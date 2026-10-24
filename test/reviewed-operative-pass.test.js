import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {loadClinicalSource} from '../scripts/clinical-compiler.mjs';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const tag='<script defer src="/record-operative-reality-v29.js?v=20261024-reviewed1"></script>';
const before=loadClinicalSource(html.replace(tag,''),{audit:true});
const after=loadClinicalSource(html,{audit:true});
test('reviewed operative pass changes only the four named teaching operations; newer case, withdrawn sources and special cases stay identical',()=>{
 const expected=new Set(['TKA','THA','胫骨平台骨折','踝关节三踝骨折']);const changed=[];
 assert.equal(after.records.length,before.records.length);
 for(let i=0;i<before.records.length;i++){
  const a=after.records[i],b=before.records[i];
  assert.deepEqual({...a,sourceBody:null},{...b,sourceBody:null});
  if(a.sourceBody!==b.sourceBody){assert(expected.has(a.group));assert.equal(a.short,'手术记录');assert(!a.specialCase);changed.push(a.group);
   assert(a.sourceBody.includes('【待核实是否实施：')||a.sourceBody.includes('【据实填写下胫腓联合'));
   const section=x=>x.split('手术经过：')[1].split('\n\n术后计划：')[0];
   assert.equal(section(a.sourceBody).trim().split(/\n\s*\n/).length,4);
  }else assert.equal(after.renderedBodies[i],before.renderedBodies[i]);
 }
 assert.deepEqual(new Set(changed),expected);
});
test('uncertain soft tissue procedures remain prompts and never become asserted facts',()=>{
 for(const group of ['TKA','THA','胫骨平台骨折']){
  const r=after.records.find(r=>r.group===group&&r.short==='手术记录'&&!r.specialCase);
  assert.match(r.sourceBody,/【待核实是否实施：/);
 }
});
