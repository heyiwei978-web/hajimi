import fs from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url);
const digest=value=>createHash('sha256').update(value).digest('hex').slice(0,20);
const slugs={'骨科':'guke','普外科':'puwai','肾内科':'shennei','妇科':'fuke'};

export function loadClinicalSource(html){
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
  const files=[...html.matchAll(/<script\s+[^>]*?src="\/([^?"]+)(?:\?[^"]*)?"/g)].map(match=>match[1]).filter(file=>!['cms-core.js','workspace.js','library-personal.js'].includes(file));
  for(const file of files)vm.runInContext(fs.readFileSync(new URL(file,root),'utf8'),context,{filename:file,timeout:10000});
  if(errors.length)throw new Error('Clinical build failed: '+errors.join('\n'));
  return JSON.parse(vm.runInContext('JSON.stringify({records:templates,groups,traumaGroups,seeds:window.HAJIMI_IDEAL_CASES.seeds})',context));
}

export function compileClinicalSite(html,directory){
  const source=loadClinicalSource(html);
  const manifest={total:source.records.length,departments:{},groups:source.groups,traumaGroups:source.traumaGroups,
    seeds:Object.fromEntries(Object.entries(source.seeds).map(([key,value])=>[key,{category:value.category}])),bodies:{},scripts:{}};
  manifest.scripts.cms=[...html.matchAll(/<script[^>]*src="([^"]+)"/g)].map(match=>match[1]).find(value=>value.startsWith('/cms-core.js?'));
  const write=(prefix,text,extension='js')=>{const filename=prefix+'-'+digest(text)+'.'+extension;fs.writeFileSync(new URL(filename,directory),text);return '/'+filename;};
  for(const [department,slug]of Object.entries(slugs)){
    const strings=[],pool=new Map(),extras=[],extraPool=new Map(),rows=[];
    const intern=value=>{value=value||'';if(!pool.has(value)){pool.set(value,strings.length);strings.push(value);}return pool.get(value);};
    const bodies=new Map();
    source.records.forEach((record,id)=>{
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
  manifest.scripts.router=write('department-runtime',fs.readFileSync(new URL('departments.js',root),'utf8'));
  const manifestFile=write('library-manifest','window.HAJIMI_MANIFEST='+JSON.stringify(manifest)+';');
  const scripts=`<script defer src="/search-core.js?v=20261009-quality1"></script>\n<script defer src="/library-personal.js?v=20261009-personal1"></script>\n<script defer src="${manifestFile}"></script>\n<script defer src="/library-loader.js?v=20261009-lazy1"></script>\n<script defer src="/workspace.js?v=20261009-quality1"></script>`;
  const runtimeHtml=html.replace(/<script\b[^>]*src="\/[^"]+"[^>]*><\/script>\s*/g,'').replace('</body>',scripts+'\n</body>');
  fs.writeFileSync(new URL('library.html',directory),runtimeHtml);
  return {source,manifest};
}
