import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {loadClinicalSource} from '../scripts/clinical-compiler.mjs';
import {auditClinicalLibrary} from '../scripts/audit-clinical-library.mjs';
import {identityKey,metadataHash} from '../scripts/clinical-inventory.mjs';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const tag='<script defer src="/record-tha-complete-v32.js?v=20261025-tha1"></script>';
const before=loadClinicalSource(html.replace(tag,''),{audit:true});
const current=auditClinicalLibrary(),after=current.source;
const rows=after.records.filter(r=>r.group==='THA'&&!r.specialCase),get=n=>rows.find(r=>r.short===n);
const time=r=>r.sourceBody.match(/记录时间：(\d{4}-\d{2}-\d{2} \d{2}:\d{2})/)[1];
test('THA revision changes only 27 established standard records and appends five permanent chapters to that same case',()=>{
 const old=new Map(before.records.map((r,i)=>[identityKey(r),{r,rendered:before.renderedBodies[i]}]));let updated=0,added=0,unchanged=0;
 for(let i=0;i<after.records.length;i++){
  const r=after.records[i],b=old.get(identityKey(r));
  if(!b){assert.equal(r.group,'THA');assert(!r.specialCase);added++;continue;}
  assert.equal(metadataHash(r),metadataHash(b.r));
  if(r.group==='THA'&&!r.specialCase){assert.notEqual(r.sourceBody,b.r.sourceBody);updated++;}
  else{assert.deepEqual(r,b.r);assert.equal(after.renderedBodies[i],b.rendered);unchanged++;}
  old.delete(identityKey(r));
 }
 assert.equal(old.size,0);assert.equal(updated,27);assert.equal(added,5);assert.equal(unchanged,before.records.length-27);assert.equal(rows.length,32);
 const published=current.plan.published.filter(e=>e.record.group==='THA'&&!e.record.specialCase);
 assert.equal(new Set(published.map(e=>e.identity.caseId)).size,1);
 assert.equal(published.filter(e=>e.identity.legacyId>=5376).length,5);
});
test('daily rounds span the existing nine-day stay and all six postoperative dates without pain scores or explanatory filler',()=>{
 const dates=new Set(rows.filter(r=>r.sourceBody.includes('病程记录：')).map(r=>time(r).slice(0,10)));
 for(let d=3;d<=11;d++)assert(dates.has('2026-09-'+String(d).padStart(2,'0')));
 for(let d=1;d<=6;d++){
  const r=get('术后第'+d+'天病程');assert(r);assert.equal(time(r).slice(0,10),'2026-09-'+String(d+5).padStart(2,'0'));
  assert.match(r.sourceBody,/病程记录：今日随陈某某主治医师查房/);
  assert.match(r.sourceBody,/主治医师查房后指出：/);
  assert(!r.sourceBody.split('病程记录：')[1].split('\n\n医师签名')[0].includes('\n'));
 }
 for(const r of rows){assert(r.sourceBody.startsWith('【虚构教学标准病例'));assert(!/VAS|NRS|疼痛评分|___|【待核实/.test(r.sourceBody));assert.equal(after.renderedBodies[after.records.indexOf(r)],r.sourceBody);}
});
test('THA drainage, ultrasound results, postoperative imaging and suture follow-up form one consistent chronology',()=>{
 assert.match(get('术后第1天病程').sourceBody,/90mL[^。]*本日未拔管/);
 assert.match(get('术后第2天病程').sourceBody,/09:30拔除引流管/);
 assert(time(get('术后第2天病程'))<time(get('术后第2天晚间右下肢静脉超声结果分析记录')));
 assert(time(get('术后第2天晚间右下肢静脉超声结果分析记录'))<time(get('术后第3天病程')));
 assert(time(get('术后第3天病程'))<time(get('影像复查及结果分析')));
 assert.match(get('术后第4天病程').sourceBody,/昨日骨盆及右髋X线/);
 for(const n of ['出院小结','出院当天查房记录']){assert.match(get(n).sourceBody,/缝线仍在位/);assert.match(get(n).sourceBody,/2026-09-11/);}
 assert.match(get('出院小结').sourceBody,/今日尚未拆线/);
 assert.match(get('出院小结').sourceBody,/2026-09-17～19/);
 assert.match(get('手术记录').sourceBody,/后外侧/);
 assert.match(get('手术记录').sourceBody,/生物型髋臼杯/);
 assert.match(get('手术记录').sourceBody,/陶瓷股骨头/);
});
