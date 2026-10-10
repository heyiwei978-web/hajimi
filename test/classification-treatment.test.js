import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {test} from 'node:test';
function catalog(){
 const context={window:{}};
 for(const file of ['classification-data.js','classification-detail-v2-lower.js','classification-detail-v2-upper.js','classification-detail-v2-pelvis-foot.js','classification-treatment.js'])
  runInNewContext(readFileSync(new URL('../'+file,import.meta.url),'utf8'),context,{filename:file});
 return context.window;
}
test('every published morphology has treatment considerations with no missing or legacy codes',()=>{
 const w=catalog(),details=w.HAJIMI_CLASSIFICATION_DETAILS,tx=w.HAJIMI_CLASSIFICATION_TREATMENTS;
 assert.equal(Object.keys(tx).sort().join('|'),Object.keys(details).sort().join('|'));
 let total=0;
 for(const [id,d] of Object.entries(details)){
  assert.equal(Object.keys(tx[id].types).sort().join('|'),d.types.map(t=>t[0]).sort().join('|'),id+' code mismatch');
  for(const type of d.types){
   const treatment=tx[id].types[type[0]];
   for(const field of ['conservative','operative','plan']){
    assert.equal(typeof treatment[field],'string',id+' '+type[0]+' '+field);
    assert.ok(treatment[field].trim(),id+' '+type[0]+' empty '+field);
    assert.doesNotMatch(treatment[field],/<[^>]*>/);
   }
  }
  assert.ok(tx[id].scope&&tx[id].followUp&&tx[id].sources.length);
  for(const [title,url] of tx[id].sources){assert.ok(title);assert.equal(new URL(url).protocol,'https:');}
  total+=d.types.length;
 }
 assert.equal(total,135);
});
test('critical age, emergency and version distinctions remain explicit',()=>{
 const tx=catalog().HAJIMI_CLASSIFICATION_TREATMENTS;
 assert.match(tx['distal-radius'].types['2R3A1'].conservative,/桡骨茎突撕脱/);
 assert.doesNotMatch(tx['distal-radius'].types['2R3A1'].conservative,/孤立尺骨/);
 assert.match(tx['distal-radius'].scope,/<65岁/);
 assert.match(tx['distal-radius'].scope,/复位后/);
 assert.match(tx['proximal-humerus'].scope,/低能量.*非手术/);
 assert.match(tx.pilon.scope,/临时固定.*不要求.*最终/);
 assert.match(tx.talus.types['Hawkins Ⅲ'].operative,/紧急/);
 assert.match(tx.calcaneus.types['Essex–Lopresti 舌形'].operative,/皮肤.*紧急/);
 assert.match(tx['pelvic-ring'].scope,/血流动力学/);
});
test('the treatment supplement loads after morphology and before the reader',()=>{
 const html=readFileSync(new URL('../classification.html',import.meta.url),'utf8');
 assert.ok(html.indexOf('classification-detail-v2-pelvis-foot.js')<html.indexOf('classification-treatment.js'));
 assert.ok(html.indexOf('classification-treatment.js')<html.indexOf('src="/classification.js'));
});
