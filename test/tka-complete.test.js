import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {loadClinicalSource} from '../scripts/clinical-compiler.mjs';
import {auditClinicalLibrary} from '../scripts/audit-clinical-library.mjs';
import {identityKey,metadataHash} from '../scripts/clinical-inventory.mjs';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const tag='<script defer src="/record-tka-complete-v31.js?v=20261025-tka14"></script>';
const before=loadClinicalSource(html.replace(tag,''),{audit:true});
const current=auditClinicalLibrary(),after=current.source;
const selected=after.records.filter(r=>r.group==='TKA'&&r.department==='骨科'&&!r.specialCase);
const find=name=>selected.find(r=>r.short===name);
const time=r=>r.sourceBody.match(/记录时间：(\d{4}-\d{2}-\d{2} \d{2}:\d{2})/)[1];
test('TKA complete-case rewrite preserves every other record, both special cases and all established identities',()=>{
 const previous=new Map(before.records.map((r,i)=>[identityKey(r),{r,body:before.renderedBodies[i]}]));let updates=0,added=0,untouched=0;
 for(let i=0;i<after.records.length;i++){
  const r=after.records[i],old=previous.get(identityKey(r));
  if(!old){assert.equal(r.group,'TKA');assert(!r.specialCase);added++;continue;}
  assert.equal(metadataHash(r),metadataHash(old.r));
  if(r.group==='TKA'&&!r.specialCase){assert.notEqual(r.sourceBody,old.r.sourceBody);updates++;}
  else{assert.deepEqual(r,old.r);assert.equal(after.renderedBodies[i],old.body);untouched++;}
  previous.delete(identityKey(r));
 }
 assert.equal(previous.size,0);assert.equal(updates,28);assert.equal(added,12);assert.equal(untouched,before.records.length-28);
 assert.equal(selected.length,40);
 const p=current.plan.published.filter(e=>e.record.group==='TKA'&&!e.record.specialCase);
 assert.equal(new Set(p.map(e=>e.identity.caseId)).size,1);
 for(const entry of p.filter(e=>e.identity.legacyId<5364))assert(before.records.some(r=>identityKey(r)===identityKey(entry.record)));
 assert(p.filter(e=>e.identity.legacyId>=5364).every(e=>e.identity.caseType==='standard'));
});
test('one continuous case covers all 17 calendar dates, pre-op day 3 surgery and POD1 through POD14',()=>{
 const dates=new Set(selected.filter(r=>r.sourceBody.includes('病程记录：')).map(r=>time(r).slice(0,10)));
 for(let i=2;i<=18;i++)assert(dates.has('2026-09-'+String(i).padStart(2,'0')),'Missing inpatient date '+i);
 assert.equal(time(find('手术记录')).slice(0,10),'2026-09-04');
 for(let d=1;d<=14;d++){
  const r=find('术后第'+d+'天病程');assert(r);assert.equal(time(r).slice(0,10),'2026-09-'+String(4+d).padStart(2,'0'));
  assert.match(r.sourceBody,/病程记录：今日随陈某某主治医师查房/);
  assert.match(r.sourceBody,/主治医师查房后指出：/);
  assert.match(r.sourceBody,/查体：/);assert.match(r.sourceBody,/引流管/);
  assert(!r.sourceBody.split('病程记录：')[1].split('\n\n医师签名')[0].includes('\n'));
 }
 for(const r of selected){assert(r.sourceBody.startsWith('【虚构教学标准病例'));assert(!/VAS|NRS|疼痛评分|___|【待核实|【填写/.test(r.sourceBody));}
 assert.match(find('出院小结').sourceBody,/出院日期：2026-09-18/);
 assert.match(find('出院小结').sourceBody,/今日已拆线/);
});
test('investigations, drain removal, rehabilitation and discharge remain temporally consistent',()=>{
 assert.match(find('术后第2天病程').sourceBody,/今日完善右下肢静脉超声/);
 assert.match(find('术后第2天晚间右下肢静脉超声结果分析记录').sourceBody,/未见明确血栓/);
 assert(time(find('术后第2天病程'))<time(find('术后第2天晚间右下肢静脉超声结果分析记录')));
 assert.match(find('术后第3天病程').sourceBody,/09:30拔除引流管/);
 for(let d=4;d<=14;d++)assert.match(find('术后第'+d+'天病程').sourceBody,/引流管(?:昨日)?已/);
 assert(time(find('术后第3天病程'))<time(find('影像复查及结果分析')));
 assert.match(find('出院当天查房记录').sourceBody,/09:30拆线后/);
 assert.match(find('出院当天查房记录').sourceBody,/0°～105°/);
 assert.match(find('出院小结').sourceBody,/0°～105°/);
 assert.match(find('手术记录').sourceBody,/未置换髌骨/);
 assert.match(find('手术记录').sourceBody,/后交叉韧带保留型/);
 for(const r of selected){const i=after.records.indexOf(r);assert.equal(after.renderedBodies[i],r.sourceBody,'source and compiled default rendering must match');}
});
