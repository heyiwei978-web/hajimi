import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {loadClinicalSource} from '../scripts/clinical-compiler.mjs';

const entry = new URL('../index.html',import.meta.url);
const tag = '<script defer src="/record-tka-refinement-v28.js?v=20261012-tka1"></script>';

function samples() {
  const html = fs.readFileSync(entry,'utf8');
  assert(html.includes(tag), 'v28 must run after v27 at compile time');
  assert(html.indexOf('/record-course-v27.js') < html.indexOf('/record-tka-refinement-v28.js'));
  return {
    before: loadClinicalSource(html.replace(tag,'' )).records,
    after: loadClinicalSource(html).records
  };
}
const tkaDoc = (records,name) => records.find(record =>
  record.department === '骨科' && record.group === 'TKA' &&
  !record.specialCase && record.short === name);

test('the new pass preserves the original total, every other disease, and both special cases byte-for-byte',()=>{
  const {before,after} = samples();
  assert.equal(after.length,before.length,'No templates may be added or deleted');
  assert(after.length>=5361,'Original October baseline must be kept');
  const permitted = new Set([
    '术后第1天病程','术后第2天病程','术后第3天病程',
    '术后第5天病程','术后第7天病程','术前主刀查房',
    '术后主刀查房记录','出院前主治医师查房记录',
    '出院当天查房记录','手术记录'
  ]);
  const preservedSpecial = new Set();
  let improved=0;
  before.forEach((original,i)=>{
    const current=after[i];
    assert.equal(current.group,original.group,'group/order must stay unchanged');
    assert.equal(current.short,original.short,'record title/order must stay unchanged');
    const eligible=original.department==='骨科'&&original.group==='TKA'&&!original.specialCase&&permitted.has(original.short);
    if(!eligible) {
      assert.equal(JSON.stringify(current),JSON.stringify(original),original.group+' / '+original.short+' must be untouched');
    } else if(current.sourceBody!==original.sourceBody) improved++;
    if(original.group==='TKA'&&original.specialCase) preservedSpecial.add(original.specialCaseKey);
  });
  assert(improved>=5,'Expected several specifically identified TKA corrections');
  assert.equal(preservedSpecial.size,2,'Both original TKA special case bundles must remain intact');
});

test('postoperative drain narratives describe actual retained vs removed state',()=>{
  const {after}=samples();
  const day1=tkaDoc(after,'术后第1天病程').sourceBody;
  const day2=tkaDoc(after,'术后第2天病程').sourceBody;
  const day3=tkaDoc(after,'术后第3天病程').sourceBody;
  assert.match(day1,/120ml[^。；]*本日未拔管/);
  assert.match(day2,/55ml[^。；]*本日未拔管/);
  assert.match(day3,/已于今日拔除/);
  for(const day of [day1,day2,day3]) assert.doesNotMatch(day,/引流\/拔管过程平稳/);
});

test('discharge note and doctor recommendations are clinically specific and unjoined',()=>{
  const {after}=samples();
  const discharge=tkaDoc(after,'出院当天查房记录').sourceBody;
  assert.match(discharge,/【教学示例：以下体征、活动度及出院判断须以患者实际查房资料核实后替换】/);
  assert.match(discharge,/主治医师查房后指出：/);
  assert.match(discharge,/右膝主动活动度约0°～110°/);
  assert.doesNotMatch(discharge,/手术日期[：:][^\n]*术后疼痛/);
  assert.match(discharge,/\n\n主诊断：[^\n]+\n\n病程记录：[^\n]+\n\n医师签名：________$/);
  const pre=tkaDoc(after,'术前主刀查房').sourceBody;
  const last=tkaDoc(after,'出院前主治医师查房记录').sourceBody;
  for(const text of [pre,last]) assert.doesNotMatch(text,/须结合患者病史、专科查体及已完成的辅助检查动态评价病情/);
  const surgery=tkaDoc(after,'手术记录').sourceBody;
  assert.doesNotMatch(surgery,/髌骨是否置换及后方交叉韧带的保留情况须与实际术式一致/);
  assert.match(surgery,/髌骨处理：【根据本次实际手术填写/);
  assert.match(surgery,/后交叉韧带处理：【根据实际填写/);
});
