import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {CLINICAL_SOURCE_DIR,loadClinicalJsonSource} from '../scripts/clinical-source.mjs';
import {PLACEHOLDER,parseArgs,scaffoldDisease} from '../scripts/clinical-new-disease.mjs';

const source=new URL('../'+CLINICAL_SOURCE_DIR,import.meta.url);
function withCopy(run){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'hajimi-new-'));
  try{fs.cpSync(source,dir,{recursive:true});return run(pathToFileURL(dir+'/'),dir);}
  finally{fs.rmSync(dir,{recursive:true,force:true});}
}
const read=(dir,name)=>JSON.parse(fs.readFileSync(path.join(dir,name),'utf8'));

test('a new disease copies the chapter structure of an existing complete case in reading order',()=>withCopy((directory,dir)=>{
  const like=read(dir,'guke/锁骨骨折.json');
  const result=scaffoldDisease({department:'骨科',group:'测试新病种',category:'运动医学'},{directory});
  assert.equal(result.file,'guke/测试新病种.json');assert.equal(result.records,like.length);assert.equal(result.reusedWithdrawnGroup,false);
  const records=read(dir,'guke/测试新病种.json');
  assert.deepEqual(records.map(r=>r.recordOrder),records.map((_,i)=>i+1));
  assert.deepEqual(new Set(records.map(r=>r.short)),new Set(like.map(r=>r.short)),'same chapters as the reference case');
  assert.deepEqual(records.slice(0,2).map(r=>r.short),['入院记录','首次病程记录']);
  assert.equal(records.at(-1).stage,'术后');
  for(const r of records){
    assert.equal(r.name,'测试新病种 · '+r.short);assert.equal(r.department,'骨科');assert.equal(r.group,'测试新病种');
    assert(r.sourceBody.includes(PLACEHOLDER));assert(r.sourceBody.startsWith('【虚构教学标准病例｜测试新病种完整住院示例】'));
    assert.equal(r.completeCaseKey,undefined);
  }
  const index=read(dir,'index.json');
  assert(index.files.includes('guke/测试新病种.json'));assert(index.groups.includes('测试新病种'));
  assert.equal(index.seeds['测试新病种'].category,'运动医学');assert(!index.traumaGroups.includes('测试新病种'));
  const loaded=loadClinicalJsonSource({directory});
  assert.equal(loaded.records.filter(r=>r.group==='测试新病种').length,like.length);
}));

test('a disease withdrawn earlier gets a separate new case; the old case and names stay untouched',()=>withCopy((directory,dir)=>{
  const before=read(dir,'guke/胫骨平台骨折.json');
  const result=scaffoldDisease({department:'骨科',group:'胫骨平台骨折',category:'创伤骨科',like:'股骨转子间骨折'},{directory});
  assert.equal(result.reusedWithdrawnGroup,true);assert.match(result.caseKey,/^complete-\d{8}$/);
  const after=read(dir,'guke/胫骨平台骨折.json');
  assert.deepEqual(after.slice(0,before.length),before,'withdrawn records are kept as they were');
  const added=after.slice(before.length);
  assert.equal(added.length,30);
  assert(added.every(r=>r.completeCaseKey===result.caseKey&&r.name.startsWith('胫骨平台骨折（完整病例） · ')));
  assert(!added.some(r=>before.some(old=>old.name===r.name)));
  assert(read(dir,'index.json').traumaGroups.includes('胫骨平台骨折'));
  assert.equal(loadClinicalJsonSource({directory}).records.filter(r=>r.group==='胫骨平台骨折').length,after.length);
}));

test('invalid requests are refused before anything is written',()=>withCopy((directory,dir)=>{
  const index=fs.readFileSync(path.join(dir,'index.json'),'utf8');
  assert.throws(()=>scaffoldDisease({department:'眼科',group:'测试'},{directory}),/科室必须是/);
  assert.throws(()=>scaffoldDisease({department:'骨科',group:'测试'},{directory}),/category/);
  assert.throws(()=>scaffoldDisease({department:'骨科',group:'a/b',category:'手外科'},{directory}),/名称无效/);
  assert.throws(()=>scaffoldDisease({department:'骨科',group:'测试',category:'手外科',like:'不存在'},{directory}),/找不到参照病种/);
  assert.equal(fs.readFileSync(path.join(dir,'index.json'),'utf8'),index);
  scaffoldDisease({department:'普外科',group:'测试普外'},{directory});
  assert.throws(()=>scaffoldDisease({department:'普外科',group:'测试普外'},{directory}),/已存在/);
  assert.throws(()=>parseArgs(['--group=甲','--group=乙']),/重复参数/);
  assert.throws(()=>parseArgs(['--foo=1']),/未知参数/);
}));
