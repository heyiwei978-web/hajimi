import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import {auditClinicalLibrary} from '../scripts/audit-clinical-library.mjs';
import {loadClinicalSource} from '../scripts/clinical-compiler.mjs';
import {identityKey,metadataHash} from '../scripts/clinical-inventory.mjs';
import {PUBLIC_FILES} from '../scripts/public-assets.mjs';

const current=auditClinicalLibrary();
const old=loadClinicalSource(fs.readFileSync(new URL('../index.html',import.meta.url),'utf8'),{
  audit:true,readSource:file=>file==='record-intertrochanteric-v28.js'?'':fs.readFileSync(new URL('../'+file,import.meta.url),'utf8')
});
const selected=current.plan.published.filter(entry=>entry.record.department==='骨科'&&entry.record.group==='股骨转子间骨折');

test('the reviewed case updates all 27 established documents and appends three identities without touching other 5334 records',()=>{
  assert.equal(current.source.records.length,5364);assert.equal(current.plan.published.length+current.plan.withdrawn.length,5364);assert.equal(selected.length,30);
  const before=new Map(old.records.map((record,index)=>[identityKey(record),{record,body:old.renderedBodies[index]}]));
  let unchanged=0,updates=0,additions=0;
  for(let index=0;index<current.source.records.length;index++){
    const record=current.source.records[index],previous=before.get(identityKey(record));
    if(!previous){assert.equal(record.group,'股骨转子间骨折');additions++;continue;}
    assert.equal(metadataHash(record),metadataHash(previous.record));
    if(record.group==='股骨转子间骨折'){assert.notEqual(record.sourceBody,previous.record.sourceBody);updates++;}
    else {assert.deepEqual(record,previous.record);assert.equal(current.source.renderedBodies[index],previous.body);unchanged++;}
    before.delete(identityKey(record));
  }
  assert.equal(before.size,0);assert.equal(unchanged,5334);assert.equal(updates,27);assert.equal(additions,3);
  assert.equal(new Set(selected.map(entry=>entry.identity.recordId)).size,30);
  assert.equal(new Set(selected.map(entry=>entry.identity.caseId)).size,1);
  assert(!PUBLIC_FILES.includes('record-intertrochanteric-v28.js'));
});

test('all independently copied documents retain the fictional teaching notice and corrected case parameters',()=>{
  for(const {record} of selected){
    assert(record.sourceBody.startsWith('【完全虚构的教学标准病例｜第三轮修订】'));
    assert(!/VAS|NRS|Hb\s*134|PLT\s*238|CRP\s*3\.6|手术日期：2026-09-08/.test(record.sourceBody),record.name);
  }
  const body=short=>selected.find(entry=>entry.record.short===short).record.sourceBody;
  assert.match(body('麻醉术前访视记录'),/Hb 132g\/L/);
  assert.match(body('麻醉术前访视记录'),/ASA分级：【本次稿件未提供/);
  assert.match(body('麻醉记录'),/08:45完成蛛网膜下腔穿刺/);
  assert.match(body('麻醉记录'),/09:10手术开始，10:30手术结束/);
  assert.match(body('麻醉记录'),/具体时刻本次材料未提供/);
  assert.match(body('术前小结'),/2024年AHA\/ACC/);
  assert(!body('术前小结').includes('2026年AHA/ACC'));
  assert.equal(selected.filter(entry=>entry.record.type==='出院医嘱').length,1);
});

test('case reading preserves clinical document sequence without inventing clock times and leaves other case ordering intact',()=>{
  const router=fs.readFileSync(new URL('../departments.js',import.meta.url),'utf8');
  const start=router.indexOf('    function sortRecordList(raw){'),end=router.indexOf('    function specialRecordId(',start);
  assert(start>=0&&end>start);
  const context={templates:[],recordTimestamp:t=>t.timestamp??NaN,recordPriority:t=>t.priority??0};
  vm.createContext(context);vm.runInContext(router.slice(start,end)+'\nglobalThis.orderRecords=sortRecordList;',context);
  const records=selected.map(entry=>entry.record).reverse();
  const ordered=Array.from(context.orderRecords(records),record=>record.short);
  const before=(a,b)=>assert(ordered.indexOf(a)<ordered.indexOf(b),a+' before '+b);
  before('入院记录','首次病程记录');before('多学科术前讨论','术前主刀查房');
  before('麻醉术前访视记录','手术记录');before('手术记录','术后首次病程记录');
  before('术后第2天病程','术后第2天晚间双下肢静脉彩超结果分析记录');
  before('术后第2天晚间双下肢静脉彩超结果分析记录','术后第3天病程');
  before('术后第4天病程记录','术后第5天病程');
  before('出院当天查房记录','出院小结');before('出院小结','出院医嘱单（单独复制版）');
  const other=[{department:'骨科',group:'TKA',short:'later',timestamp:20},{department:'骨科',group:'TKA',short:'earlier',timestamp:10}];
  assert.deepEqual(Array.from(context.orderRecords(other),record=>record.short),['earlier','later']);
});
