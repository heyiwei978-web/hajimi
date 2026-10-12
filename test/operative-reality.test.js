import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {loadClinicalSource} from '../scripts/clinical-compiler.mjs';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const v29='<script defer src="/record-operative-reality-v29.js?v=20261013-operative1"></script>';
const v30='<script defer src="/record-operative-case-review-v30.js?v=20261013-operative2"></script>';
const targetGroups=['TKA','THA','股骨转子间骨折','胫骨平台骨折','踝关节三踝骨折'];
const procedureRE=/手术经过[：:]\s*\n([\s\S]*?)(?=\n\n(?:术后计划|术后医嘱|术后处理|术者签名|手术者签名)[：:]|$)/;
function compare(){
  assert(html.includes(v29),'v29 must run during compilation');
  assert(html.includes(v30),'v30 must run during compilation');
  assert(html.indexOf(v29)<html.indexOf(v30));
  const before=loadClinicalSource(html.replace(v29,'').replace(v30,'')).records;
  const after=loadClinicalSource(html).records;
  return {before,after};
}
const operation=(rows,group)=>rows.find(r=>r.department==='骨科' && r.group===group &&
  r.type==='手术记录' && r.short==='手术记录' && !r.specialCase);
const steps=body=>procedureRE.exec(body)?.[1]||'';

test('operational factuality repair preserves all other case content and all 2 special-case bundles',()=>{
  const {before,after}=compare();
  assert.equal(after.length,before.length);
  assert(after.length>=5361);
  let changed=0;
  const specialKeys=new Set();
  for(let i=0;i<before.length;i++){
    const old=before[i],current=after[i];
    assert.equal(old.group,current.group,'disease order must not change');
    assert.equal(old.short,current.short,'document name/order must not change');
    const eligible=old.department==='骨科'&&old.idealCase===true&&!old.specialCase&&
      old.type==='手术记录'&&/手术记录/.test(old.short||'');
    if(!eligible)assert.equal(JSON.stringify(current),JSON.stringify(old),old.group+' / '+old.short);
    else if(current.sourceBody!==old.sourceBody)changed++;
    if(old.department==='骨科'&&old.group==='TKA'&&old.specialCase)specialKeys.add(old.specialCaseKey);
  }
  assert.equal(specialKeys.size,2,'Both TKA exceptional cases must be unchanged');
  assert(changed>=targetGroups.length,'The targeted operative records should actually change');
});

test('all five targeted educational operative records use factual chronological prose',()=>{
  const {before,after}=compare();
  const required={
    'TKA':[/经内侧髌旁关节囊入路/,/股骨假体和胫骨托/,/活动度0°～125°/],
    'THA':[/右髋后外侧/,/生物型髋臼杯/,/生物型股骨柄和陶瓷股骨头/],
    '股骨转子间骨折':[/闭合复位满意/,/头颈螺旋刀片/,/远端锁定螺钉/],
    '胫骨平台骨折':[/关节面塌陷约6mm/,/人工骨材料/,/外侧安放解剖型锁定钢板/],
    '踝关节三踝骨折':[/后踝骨块/,/内踝骨块并采用空心螺钉固定/,/下胫腓联合稳定/]
  };
  const banned=/(?:如果|假如|若|必要时|可采用|可选择|可考虑|视情况|按需)/;
  for(const [group,need] of Object.entries(required)){
    const previous=operation(before,group),current=operation(after,group);
    assert(previous?.sourceBody&&current?.sourceBody,'Missing '+group);
    assert.notEqual(previous.sourceBody,current.sourceBody,'Expected revision for '+group);
    const prose=steps(current.sourceBody);
    assert(prose,'Missing surgical procedure for '+group);
    assert.doesNotMatch(prose,banned,'Completed procedure still has prospective conditional clause: '+group);
    assert.doesNotMatch(prose,/【待核实是否实施/,'Do not substitute options inside surgical narrative: '+group);
    assert.equal(prose.trim().split(/\n\s*\n/).length,4,'Four natural procedural paragraphs: '+group);
    for(const pattern of need)assert.match(prose,pattern,group+' missing clinically anchored content');
    const end=prose.trim().split(/\n\s*\n/);
    assert(end.every(x=>x.length>=80),group+' operative steps too short');
  }
});

test('do not invent whether the knee implant required patellar resurfacing or PCL removal',()=>{
  const tka=operation(compare().after,'TKA').sourceBody;
  assert.match(tka,/术中待核对事项：/);
  assert.match(tka,/髌骨是否置换及后交叉韧带的最终处理方式须以真实手术记录/);
  assert.doesNotMatch(steps(tka),/髌骨置换完成|已切除后交叉韧带|已保留后交叉韧带/);
});

test('all changed operative reports keep original identity, operative metadata and note footer',()=>{
  const {before,after}=compare();
  for(let i=0;i<before.length;i++){
    if(before[i].sourceBody===after[i].sourceBody)continue;
    const original=steps(before[i].sourceBody),current=steps(after[i].sourceBody);
    if(!original||!current)continue;
    assert.equal(current.trim().split(/\n\s*\n/).length,original.trim().split(/\n\s*\n/).length,before[i].group);
    assert.equal(after[i].sourceBody.includes('术者签名：'),before[i].sourceBody.includes('术者签名：'),before[i].group);
  }
});
