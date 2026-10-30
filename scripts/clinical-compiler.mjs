import fs from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {planClinicalPublication} from './clinical-inventory.mjs';
import {DEPARTMENTS} from '../config/site-modules.mjs';
import {renderRouterDepartments} from './department-build.mjs';
import {hasClinicalJsonSource,loadClinicalJsonSource} from './clinical-source.mjs';
const root=new URL('../',import.meta.url);
const digest=value=>createHash('sha256').update(value).digest('hex').slice(0,20);

// A template is one complete case. Chapters retain their original IDs and text.
export function compileCaseTemplates(published){
  const cases=new Map();
  for(const {record,identity}of published){
    const caseId=identity.caseId||'utility:'+record.department+':'+record.group;
    if(!cases.has(caseId)){
      const label=record.group==='TKA'?'全膝关节置换':record.group==='THA'?'全髋关节置换':record.group;
      cases.set(caseId,{caseId,department:record.department,group:record.group,caseType:identity.caseType,
        sourceCaseKey:identity.sourceCaseKey,title:record.specialCaseTitle||label,chapterIds:[]});
    }
    cases.get(caseId).chapterIds.push(identity.legacyId);
  }
  const items=[...cases.values()].map(item=>({...item,chapterCount:item.chapterIds.length}));
  return {total:items.filter(item=>item.caseType!=='utility').length,
    standard:items.filter(item=>item.caseType==='standard').length,
    special:items.filter(item=>item.caseType==='special').length,
    utilityGroups:items.filter(item=>item.caseType==='utility').length,items};
}

// Build-only projection. UI capability flags must never filter clinical data.
export function clinicalDepartmentSlugs(published=[],departments=DEPARTMENTS){
  if(!Array.isArray(departments)||!departments.length)throw new Error('Clinical build failed: department registry is empty');
  const names=new Set(),slugs=new Set(),entries=[];
  for(const {name,slug}of departments){
    if(typeof name!=='string'||!name.trim()||name!==name.trim()||typeof slug!=='string'||!/^[a-z]+$/.test(slug)){
      throw new Error('Clinical build failed: invalid department name or slug');
    }
    if(names.has(name))throw new Error('Clinical build failed: duplicate department name: '+name);
    if(slugs.has(slug))throw new Error('Clinical build failed: duplicate department slug: '+slug);
    names.add(name);slugs.add(slug);entries.push([name,slug]);
  }
  const mapping=Object.fromEntries(entries);
  for(const {record}of published){
    if(!Object.hasOwn(mapping,record.department))throw new Error('Clinical build failed: unmapped department: '+record.department);
  }
  return mapping;
}

export function loadClinicalSource(html,{audit=false,readSource=file=>fs.readFileSync(new URL(file,root),'utf8')}={}){
  const nodes=new Map(),errors=[];
  const node=()=>({innerHTML:'',textContent:'',hidden:false,dataset:{},options:[],
    classList:{add(){},remove(){},toggle(){},contains(){return false;}},
    addEventListener(){},appendChild(child){this.options.push(child);},querySelector(){return null;},querySelectorAll(){return [];},replaceChildren(){},insertAdjacentHTML(){},setAttribute(){},scrollIntoView(){},focus(){}});
  const find=key=>{if(!nodes.has(key))nodes.set(key,node());return nodes.get(key);};
  const document={body:node(),getElementById:id=>find('#'+id),querySelector:find,querySelectorAll:()=>[],createElement:node,addEventListener(){}};
  const context={document,location:{pathname:'/bl',href:'https://build.invalid/bl',search:''},history:{pushState(){},replaceState(){}},
    sessionStorage:{getItem(){return null;}},navigator:{},innerWidth:1440,setTimeout(){return 0;},clearTimeout(){},URL,CustomEvent:class{},PopStateEvent:class{},
    addEventListener(){},dispatchEvent(){},scrollTo(){},console:{log(){},warn(){},error(...items){errors.push(items.map(String).join(' '));}}};
  context.window=context;
  vm.createContext(context);
  const origins=new WeakMap();
  const files=[...html.matchAll(/<script\s+[^>]*?src="\/([^?"]+)(?:\?[^"]*)?"/g)].map(match=>match[1]).filter(file=>!['cms-core.js','workspace.js','library-personal.js','image-upload.js','library-ui.js'].includes(file));
  for(const file of files){
    vm.runInContext(readSource(file),context,{filename:file,timeout:10000});
    if(audit)for(const record of vm.runInContext('typeof templates === "undefined" ? [] : templates',context)){
      if(!origins.has(record))origins.set(record,file);
    }
  }
  if(errors.length)throw new Error('Clinical build failed: '+errors.join('\n'));
  const source=JSON.parse(vm.runInContext('JSON.stringify({records:templates,groups,traumaGroups,seeds:window.HAJIMI_IDEAL_CASES.seeds})',context));
  if(audit){
    source.origins=Array.from(vm.runInContext('templates',context),record=>origins.get(record));
    source.renderedBodies=JSON.parse(vm.runInContext('JSON.stringify(templates.map(record=>String(generate(record))))',context));
    source.qualityAudit=JSON.parse(vm.runInContext('JSON.stringify(window.HAJIMI_RECORD_QUALITY_V23 || null)',context));
    source.sourceFiles=files.map(path=>({path,sha256:createHash('sha256').update(readSource(path)).digest('hex')}));
  }
  return source;
}

// The flat per-disease JSON files are the build source once they exist; the
// legacy chain is only read when they are absent (and by the equality test).
export function loadBuildSource(html){
  return hasClinicalJsonSource()?loadClinicalJsonSource({audit:true}):loadClinicalSource(html,{audit:true});
}

export function compileClinicalSite(html,directory,{inventory,cmsAudit,source=loadBuildSource(html)}={}){
  const publication=planClinicalPublication(source,inventory,{cmsAudit});
  const slugs=clinicalDepartmentSlugs(publication.published);
  const publishedGroups=new Set(publication.published.filter(item=>item.record.department==='骨科').map(item=>item.record.group));
  const manifest={total:publication.published.length,identityNamespace:publication.baseline.identityNamespace,
    departments:{},groups:[...new Set([...source.groups,...publishedGroups])].filter(group=>publishedGroups.has(group)),traumaGroups:source.traumaGroups.filter(group=>publishedGroups.has(group)),
    seeds:Object.fromEntries(Object.entries(source.seeds).filter(([key])=>publishedGroups.has(key)).map(([key,value])=>[key,{category:value.category}])),bodies:{},scripts:{}};
  manifest.caseTemplates=compileCaseTemplates(publication.published);
  const publicKeys=new Set(publication.published.map(({record:r})=>r.department+'\0'+r.group));
  manifest.withdrawnGroups=[...new Map(publication.withdrawn.map(({record:r})=>
    [r.department+'\0'+r.group,{department:r.department,group:r.group}]))]
    .filter(([key])=>!publicKeys.has(key)).map(([,value])=>value);
  manifest.scripts.cms=[...html.matchAll(/<script[^>]*src="([^"]+)"/g)].map(match=>match[1]).find(value=>value.startsWith('/cms-core.js?'));
  const write=(prefix,text,extension='js')=>{const filename=prefix+'-'+digest(text)+'.'+extension;fs.writeFileSync(new URL(filename,directory),text);return '/'+filename;};
  for(const [department,slug]of Object.entries(slugs)){
    const strings=[],pool=new Map(),extras=[],extraPool=new Map(),rows=[];
    const intern=value=>{value=value||'';if(!pool.has(value)){pool.set(value,strings.length);strings.push(value);}return pool.get(value);};
    const bodies=new Map();
    publication.published.forEach(({record,identity:{legacyId:id}})=>{
      if(record.department!==department)return;
      const extra={...record};for(const key of ['department','group','name','short','stage','type','desc','sourceBody'])delete extra[key];
      const extraKey=JSON.stringify(extra);if(!extraPool.has(extraKey)){extraPool.set(extraKey,extras.length);extras.push(extra);}
      const label=record.group==='TKA'?'全膝关节置换':record.group==='THA'?'全髋关节置换':record.group;
      rows.push([id,intern(record.group),intern(record.short),intern(record.stage),intern(record.type),intern(record.desc),record.name===label+' · '+record.short?-1:intern(record.name),extraPool.get(extraKey),!!record.sourceBody]);
      if(record.sourceBody){if(!bodies.has(record.group))bodies.set(record.group,[]);bodies.get(record.group).push([id,record.sourceBody]);}
    });
    const encoded=JSON.stringify({strings,extras,rows});
    manifest.departments[slug]={name:department,count:rows.length,catalog:write('catalog-'+slug,'window.HAJIMI.acceptCatalog('+JSON.stringify(department)+','+encoded+');')};
    for(const [group,records]of bodies)manifest.bodies[department+'\0'+group]=write('records',JSON.stringify(records),'json');
  }
  const app=fs.readFileSync(new URL('app.js',root),'utf8'),start=app.indexOf('const templates=makeTemplates();'),end=app.indexOf('function patient(){');
  if(start<0||end<start)throw new Error('Clinical app source markers missing');
  // Keep patient-dependent scenario generation and UI code; all fixed record
  // bodies have already passed the original generation and quality chain.
  const header=app.indexOf('const types =');
  if(header<0)throw new Error('Clinical app header marker missing');
  manifest.scripts.app=write('app-runtime','const traumaGroups=window.HAJIMI.manifest.traumaGroups;\nconst groups=window.HAJIMI.manifest.groups;\n'+app.slice(header,start)+'const templates=window.HAJIMI.records;\n'+app.slice(end));
  const router=fs.readFileSync(new URL('departments.js',root),'utf8'),seedStart=router.lastIndexOf('\n})([');
  if(seedStart<0)throw new Error('Department seed boundary missing');
  // The bootstrap always loads compiled catalogs; do not ship an unreachable
  // second copy of department medical source text inside the router.
  manifest.scripts.router=write('department-runtime',renderRouterDepartments(router.slice(0,seedStart)+'\n})([]);\n'));
  const manifestFile=write('library-manifest','window.HAJIMI_MANIFEST='+JSON.stringify(manifest)+';');
  const scripts=`<script defer src="/library-ui.js?v=20261011-mvp1"></script>\n<script defer src="/search-core.js?v=20261011-mvp1"></script>\n<script defer src="/library-personal.js?v=20261024-lumbar1"></script>\n<script defer src="/comorbidity-modules.js?v=20261021-comorb1"></script>\n<script defer src="/image-upload.js?v=20261009-manager1"></script>\n<script defer src="${manifestFile}"></script>\n<script defer src="/library-loader.js?v=20261014-identity1"></script>\n<script defer src="/workspace.js?v=20261009-layout1"></script>`;
  const runtimeHtml=html.replace(/<script\b[^>]*src="\/[^"]+"[^>]*><\/script>\s*/g,'').replace('</body>',scripts+'\n</body>').replace('<body>','<body>\n<script src="/route-shell.js?v=20261027-cls1"></script>');
  fs.writeFileSync(new URL('library.html',directory),runtimeHtml);
  return {source,manifest,publication};
}
