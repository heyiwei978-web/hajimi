import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {loadClinicalSource} from '../scripts/clinical-compiler.mjs';

const html = fs.readFileSync(new URL('../index.html', import.meta.url),'utf8');
const tag = '<script defer src="/record-operative-reality-v29.js?v=20261013-operative1"></script>';
function compare(){
  assert(html.includes(tag),'operative factuality pass must be enabled during compilation');
  assert(html.indexOf('/record-course-v27.js') < html.indexOf('/record-operative-reality-v29.js'));
  return {
    before:loadClinicalSource(html.replace(tag,'')).records,
    after:loadClinicalSource(html).records
  };
}
const operation = (rows,name) => rows.find(r => r.group === name &&
  r.department === '骨科' && r.short === '手术记录' && !r.specialCase);
const section = (body) =>
  /手术经过[：:]\s*\n([\s\S]*?)(?=\n\n(?:术后计划|术后医嘱|术后处理|术者签名|手术者签名)[：:]|$)/.exec(body)?.[1] || '';

test('surgical-factuality pass preserves other departments, ordinary nonoperative documents and all special cases',()=>{
  const {before,after}=compare();
  assert.equal(after.length,before.length);
  assert(after.length>=5361);
  let changed=0,protectedSpecial=0;
  for(let i=0;i<before.length;i++){
    const old=before[i],now=after[i];
    assert.equal(now.group,old.group);
    assert.equal(now.short,old.short);
    const eligible=old.department==='骨科' && old.idealCase===true &&
      !old.specialCase && old.type==='手术记录' && /手术记录/.test(old.short||'');
    if(!eligible){
      assert.equal(JSON.stringify(now),JSON.stringify(old),old.group+'/'+old.short+' must remain unchanged');
      if(old.group==='TKA'&&old.specialCase)protectedSpecial++;
    } else if(now.sourceBody!==old.sourceBody) {
      changed++;
      // One or more optional variants become visible pending-verification fields.
      assert(now.sourceBody.includes('【') || !now.sourceBody.includes('如闭合复位不能达到目标'));
    }
  }
  assert(protectedSpecial>=2);
  assert(changed>=6,'must actually improve several model-generated operative reports');
  console.log('[operative-record-audit] amended model examples:',changed,'of',before.filter(r=>r.department==='骨科' && r.type==='手术记录').length,'orthopedic operative records');
});

test('examples do not assert additional unverified procedures',()=>{
  const {before,after}=compare();
  const femurBefore=section(operation(before,'股骨转子间骨折').sourceBody);
  const femurAfter=section(operation(after,'股骨转子间骨折').sourceBody);
  assert.match(femurBefore,/如闭合复位不能达到目标/);
  assert.doesNotMatch(femurAfter,/如闭合复位不能达到目标/);
  assert.match(femurAfter,/大转子顶点/);
  const plateau=section(operation(after,'胫骨平台骨折').sourceBody);
  assert.doesNotMatch(plateau,/必要时依据双髁骨折情况加用内侧固定/);
  assert.match(plateau,/【待核实是否实施：依据双髁骨折情况加用内侧固定】/);
  assert.match(plateau,/抬高塌陷关节面/);
  const tka=section(operation(after,'TKA').sourceBody);
  assert.match(tka,/【待核实是否实施：适度松解内侧软组织】/);
});

test('preserves operation structure with four natural paragraphs',()=>{
  const {before,after}=compare();
  before.forEach((item,i)=>{
    const current=after[i];
    if(item.sourceBody===current.sourceBody)return;
    const original=section(item.sourceBody),corrected=section(current.sourceBody);
    assert.equal(corrected.trim().split(/\n\s*\n/).length,original.trim().split(/\n\s*\n/).length,item.group);
    assert(!current.specialCase);
  });
});
