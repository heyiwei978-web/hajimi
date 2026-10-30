// Flat clinical source: one JSON file per department/disease group.
//
// The legacy generation chain (index.html scripts) and these files must describe
// exactly the same records. `exportClinicalSource` writes the files from the
// chain; `loadClinicalJsonSource` reads them back into the shape returned by
// `loadClinicalSource`, so the compiler, ledger checks and audits are unchanged.
import fs from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {DEPARTMENTS} from '../config/site-modules.mjs';

const root=new URL('../',import.meta.url);
export const CLINICAL_SOURCE_DIR='content/clinical-library/source/';
const sha256=value=>createHash('sha256').update(value).digest('hex');
// Runtime code that renders fixed and patient-dependent records. It is code, not
// record data, and is executed exactly as the browser runtime would.
const RENDER_SCRIPTS=['search-core.js','app.js'];

function slugFor(department){
  const entry=DEPARTMENTS.find(item=>item.name===department);
  if(!entry)throw new Error('Clinical source: unmapped department '+department);
  return entry.slug;
}
export function groupFileName(record){
  const group=String(record.group||'未分组').replace(/[\\/:*?"<>|\u0000-\u001f]/g,'-').trim()||'未分组';
  return slugFor(record.department)+'/'+group+'.json';
}
function runLengths(values){
  const out=[];
  for(const value of values){
    const last=out[out.length-1];
    if(last&&last[0]===value)last[1]++;else out.push([value,1]);
  }
  return out;
}
function expand(runs){return runs.flatMap(([value,count])=>Array(count).fill(value));}

// Render records with the runtime renderer only (no legacy patch scripts).
function renderRecords(records,readSource){
  const context={window:{},document:{getElementById(){return null;},querySelector(){return null;},querySelectorAll(){return [];},addEventListener(){},createElement(){return {};}},
    location:{pathname:'/bl',href:'https://build.invalid/bl',search:''},history:{pushState(){},replaceState(){}},
    sessionStorage:{getItem(){return null;}},localStorage:{getItem(){return null;}},navigator:{},innerWidth:1440,setTimeout(){return 0;},clearTimeout(){},
    URL,addEventListener(){},dispatchEvent(){},console:{log(){},warn(){},error(){}}};
  context.window=context;
  vm.createContext(context);
  context.__records=records;
  const app=readSource('app.js'),start=app.indexOf('const types =');
  const stop=app.indexOf('function patient(){');
  if(start<0||stop<start)throw new Error('Clinical source: app.js render markers missing');
  // Same slice the published runtime uses: helpers and generators, with
  // `templates` bound to the flat records.
  const tail=app.slice(stop);
  const end=tail.indexOf('\nfunction render(');
  vm.runInContext(readSource('search-core.js'),context,{filename:'search-core.js',timeout:10000});
  vm.runInContext('const traumaGroups=[];const groups=[];'+app.slice(start,app.indexOf('const templates=makeTemplates();'))+
    'const templates=__records;\n'+(end>0?tail.slice(0,end):tail)+'\nthis.__render=function(t){return String(generate(t));};',context,{filename:'app.js',timeout:10000});
  return records.map(record=>context.__render(record));
}

export function exportClinicalSource(source,{readSource=file=>fs.readFileSync(new URL(file,root),'utf8')}={}){
  if(!source.renderedBodies||!source.origins)throw new Error('Clinical source export needs an audit-mode source');
  const files=new Map(),sequence=[];
  source.records.forEach(record=>{
    const name=groupFileName(record);
    if(!files.has(name))files.set(name,[]);
    files.get(name).push(record);
    sequence.push(name);
  });
  const runtime=renderRecords(JSON.parse(JSON.stringify(source.records)),readSource);
  // The ledger froze how the legacy chain rendered some records (earlier
  // formatter passes). Keep that text, bound to the exact record version, so
  // ledger checks stay byte-identical; any later edit to the record drops it.
  const legacyRendered=[];
  source.records.forEach((record,index)=>{
    if(runtime[index]!==source.renderedBodies[index])legacyRendered.push({index,recordHash:sha256(JSON.stringify(record)),rendered:source.renderedBodies[index]});
  });
  const index={schemaVersion:1,
    note:'病历正文源数据。每个病种一个文件；sequence 记录全部记录的原始顺序。legacy-rendered.json 仅供身份账本核对，不是显示内容。',
    groups:source.groups,traumaGroups:source.traumaGroups,seeds:source.seeds,qualityAudit:source.qualityAudit,
    origins:runLengths(source.origins),sequence:runLengths(sequence),files:[...files.keys()],
    // The legacy chain is retired: these files may no longer change (see test).
    retiredChain:source.sourceFiles};
  return {index,files,legacyRendered};
}

export function writeClinicalSource(exported,directory=new URL(CLINICAL_SOURCE_DIR,root)){
  fs.rmSync(directory,{recursive:true,force:true});
  for(const [name,records]of exported.files){
    const target=new URL(name,directory);
    fs.mkdirSync(new URL('./',target),{recursive:true});
    fs.writeFileSync(target,JSON.stringify(records,null,1)+'\n');
  }
  fs.writeFileSync(new URL('index.json',directory),JSON.stringify(exported.index,null,1)+'\n');
  fs.writeFileSync(new URL('legacy-rendered.json',directory),JSON.stringify(exported.legacyRendered,null,1)+'\n');
}

export function hasClinicalJsonSource(directory=new URL(CLINICAL_SOURCE_DIR,root)){
  return fs.existsSync(new URL('index.json',directory));
}

export function loadClinicalJsonSource({audit=false,directory=new URL(CLINICAL_SOURCE_DIR,root),readSource=file=>fs.readFileSync(new URL(file,root),'utf8'),
  read=name=>fs.readFileSync(new URL(name,directory),'utf8')}={}){
  const index=JSON.parse(read('index.json'));
  if(index.schemaVersion!==1)throw new Error('Clinical source: unsupported schema');
  const pools=new Map(index.files.map(name=>[name,JSON.parse(read(name))]));
  const cursor=new Map();
  const records=expand(index.sequence).map(name=>{
    const pool=pools.get(name);if(!pool)throw new Error('Clinical source: missing file '+name);
    const at=cursor.get(name)||0;cursor.set(name,at+1);
    if(at>=pool.length)throw new Error('Clinical source: sequence exceeds '+name);
    return pool[at];
  });
  for(const [name,pool]of pools)if((cursor.get(name)||0)!==pool.length)throw new Error('Clinical source: '+name+' has records outside the sequence');
  for(const record of records)if(groupFileName(record)!==[...pools.entries()].find(([,pool])=>pool.includes(record))[0])throw new Error('Clinical source: record filed under the wrong disease: '+record.name);
  const source={records:JSON.parse(JSON.stringify(records)),groups:index.groups,traumaGroups:index.traumaGroups,seeds:index.seeds};
  if(!audit)return source;
  const rendered=renderRecords(JSON.parse(JSON.stringify(records)),readSource);
  const legacy=new Map(JSON.parse(read('legacy-rendered.json')).map(entry=>[entry.index,entry]));
  source.renderedBodies=records.map((record,i)=>{
    const entry=legacy.get(i);
    return entry&&entry.recordHash===sha256(JSON.stringify(record))?entry.rendered:rendered[i];
  });
  source.origins=expand(index.origins);
  source.qualityAudit=index.qualityAudit;
  const names=['index.json','legacy-rendered.json',...index.files];
  source.sourceFiles=[...RENDER_SCRIPTS.map(path=>({path,sha256:sha256(readSource(path))})),
    ...names.map(name=>({path:CLINICAL_SOURCE_DIR+name,sha256:sha256(read(name))}))];
  return source;
}

