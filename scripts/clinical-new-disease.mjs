// Scaffold a new complete case (one disease) in the flat clinical source, using
// the chapter structure of an existing published complete case.
//
//   npm run clinical:new -- --department=骨科 --group=胫骨平台骨折 --category=创伤骨科 [--like=锁骨骨折]
//
// Every chapter gets a 【待填写】 body. The build refuses to publish any record
// that still contains 【待填写】, and new records must pass the reviewed revision
// flow (AGENTS.md 6.2) before they can be published.
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {DEPARTMENTS} from '../config/site-modules.mjs';
import {CLINICAL_SOURCE_DIR,groupFileName} from './clinical-source.mjs';
import {deriveClinicalState,readInventory,special} from './clinical-inventory.mjs';

const root=new URL('../',import.meta.url);
export const PLACEHOLDER='【待填写】';
export const ORTHO_CATEGORIES=['关节置换','创伤骨科','运动医学','儿童骨科','手外科','脊柱外科','足踝外科','骨肿瘤与骨病','骨感染','骨病与保髋'];

function fail(message){throw new Error('新增病种失败：'+message);}

export function parseArgs(args){
  const out={};
  for(const arg of args){
    const m=/^--([a-z]+)=(.+)$/.exec(arg);
    if(!m)fail('参数格式应为 --名称=值：'+arg);
    if(Object.hasOwn(out,m[1]))fail('重复参数 --'+m[1]);
    out[m[1]]=m[2].trim();
  }
  for(const key of Object.keys(out))if(!['department','group','category','like'].includes(key))fail('未知参数 --'+key);
  return out;
}

// Chapters follow admission → pre-op → surgery → post-op, and within a stage the
// record time written in the body; untimed forms stay after their predecessor.
function recordTime(record){
  const m=String(record.sourceBody||'').match(/记录时间[:：]\s*(\d{4})-(\d{1,2})-(\d{1,2})\s+(\d{1,2}):(\d{2})/);
  return m?Date.UTC(+m[1],+m[2]-1,+m[3],+m[4],+m[5]):NaN;
}
export function readingOrder(records){
  if(records.every(record=>Number.isFinite(record.recordOrder)))return [...records].sort((a,b)=>a.recordOrder-b.recordOrder);
  const stages=['入院','术前','术中','术后'];
  return stages.flatMap(stage=>{
    const list=records.filter(record=>record.stage===stage);
    const timed=list.filter(record=>Number.isFinite(recordTime(record))).sort((a,b)=>recordTime(a)-recordTime(b));
    const out=[...timed];
    list.forEach((record,i)=>{
      if(Number.isFinite(recordTime(record)))return;
      const before=list.slice(0,i).reverse().find(item=>out.includes(item));
      out.splice(before?out.indexOf(before)+1:0,0,record);
    });
    return out;
  }).concat(records.filter(record=>!stages.includes(record.stage)));
}

function skeleton(group,record,index,total){
  return [
    `【虚构教学标准病例｜${group}完整住院示例】`,
    '本例身份、检查数值、手术及诊疗经过均为虚构示范；正式使用须逐项核对真实资料。',
    '',
    `记录名称：${record.short}`,
    `患者：${PLACEHOLDER}（虚构姓名），${PLACEHOLDER}岁，床号：${PLACEHOLDER}，住院号：${PLACEHOLDER}`,
    `科别：${record.department}`,
    `记录时间：${PLACEHOLDER}`,
    '',
    `${PLACEHOLDER}本章正文（第 ${index+1}/${total} 章，参照同类病例「${record.likeGroup}」的「${record.short}」格式书写）`
  ].join('\n');
}

export function scaffoldDisease({department,group,category,like},{directory=new URL(CLINICAL_SOURCE_DIR,root),inventory=readInventory()}={}){
  const dept=DEPARTMENTS.find(item=>item.name===department);
  if(!dept)fail('科室必须是：'+DEPARTMENTS.map(item=>item.name).join('、'));
  if(!group||/[\\/:*?"<>|]/.test(group)||group!==group.trim()||group==='通用场景')fail('病种名称无效');
  if(department==='骨科'&&!ORTHO_CATEGORIES.includes(category))fail('骨科病种需指定 --category，可选：'+ORTHO_CATEGORIES.join('、'));
  const read=name=>JSON.parse(fs.readFileSync(new URL(name,directory),'utf8'));
  const index=read('index.json');
  const likeGroup=like||'锁骨骨折';
  const likeFile=index.files.find(name=>name.endsWith('/'+likeGroup+'.json'));
  if(!likeFile)fail('找不到参照病种：'+likeGroup);
  const template=readingOrder(read(likeFile).filter(record=>!special(record)&&record.group===likeGroup));
  if(template.length<10)fail('参照病种「'+likeGroup+'」不是完整病例');
  const file=groupFileName({department,group});
  const state=deriveClinicalState(inventory);
  const takenNames=new Set([...state.identities.values()].map(row=>row.name));
  const existingGroup=[...state.identities.values()].some(row=>row.department===department&&row.group===group);
  if(index.files.includes(file)&&!existingGroup)fail('病种文件已存在：'+file);
  // A withdrawn older case may already use this group and its record names. The
  // new case gets its own case key and distinct names; the old one stays withdrawn.
  const caseKey=existingGroup?'complete-'+new Date().toISOString().slice(0,10).replace(/-/g,''):undefined;
  const label=existingGroup?group+'（完整病例）':group;
  const records=template.map((like,i)=>{
    const record={department,group,name:label+' · '+like.short,short:like.short,stage:like.stage,type:like.type,
      desc:group+'完整虚拟病例连续记录。'};
    record.sourceBody=skeleton(group,{...record,likeGroup},i,template.length);
    if(caseKey)record.completeCaseKey=caseKey;
    record.recordOrder=i+1;
    return record;
  });
  for(const record of records)if(takenNames.has(record.name))fail('记录名称已被占用：'+record.name);
  const existing=index.files.includes(file)?read(file):[];
  fs.mkdirSync(new URL(dept.slug+'/',directory),{recursive:true});
  fs.writeFileSync(new URL(file,directory),JSON.stringify([...existing,...records],null,1)+'\n');
  if(!index.files.includes(file))index.files.push(file);
  index.sequence.push([file,records.length]);
  index.origins.push(['scaffold:'+likeGroup,records.length]);
  if(department==='骨科'){
    if(!index.groups.includes(group))index.groups.push(group);
    if(category==='创伤骨科'&&!index.traumaGroups.includes(group))index.traumaGroups.push(group);
    index.seeds[group]={...(index.seeds[group]||{}),category,group};
  }
  fs.writeFileSync(new URL('index.json',directory),JSON.stringify(index,null,1)+'\n');
  return {file,records:records.length,likeGroup,caseKey:caseKey||'standard',reusedWithdrawnGroup:existingGroup};
}

if(process.argv[1]===fileURLToPath(import.meta.url)){
  try{
    const result=scaffoldDisease(parseArgs(process.argv.slice(2)));
    console.log(`已建立 ${result.file}：${result.records} 章，章节结构参照「${result.likeGroup}」。`);
    if(result.reusedWithdrawnGroup)console.log('该病种以前有已下架的旧病例；新病例单独建档（'+result.caseKey+'），旧病例保持下架。');
    console.log('下一步：把每章的「'+PLACEHOLDER+'」替换为正文，再按 AGENTS.md 第 6.2 节生成预览、交负责人授权。');
  }catch(error){console.error(error.message);process.exitCode=1;}
}
