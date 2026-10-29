import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const source=fs.readFileSync(new URL('../record-intertrochanteric-v28.js',import.meta.url),'utf8');
function chapter(short){
  const key=JSON.stringify('股骨转子间骨折 · '+short)+': ';
  const pos=source.indexOf(key);
  assert(pos>=0,'missing '+short);
  const rest=source.slice(pos+key.length);
  const m=rest.match(/^"((?:\\.|[^"\\])*)"/);
  assert(m,'missing body for '+short);
  return JSON.parse('"'+m[1]+'"');
}

test('preoperative attending round documents hidden blood loss and transfusion assessment without fabricating transfusion',()=>{
  const round=chapter('主治医师首次查房记录');
  assert.match(round,/股骨转子间骨折可出现明显隐性失血/);
  assert.match(round,/Hb132g\/L仅反映当次水平/);
  assert.match(round,/术前计划复查血常规/);
  assert.match(round,/暂无立即输血指征/);
  assert.match(round,/结合Hb变化、持续出血、心血管风险及临床症状综合评估红细胞输注需要/);
  assert.doesNotMatch(round,/已输注红细胞|已给予输血/);
});
test('preop summary records implant infection rationale and prophylaxis timing instead of prolonged treatment',()=>{
  const summary=chapter('术前小结');
  assert.match(summary,/Ⅰ类切口PFNA内固定术/);
  assert.match(summary,/植入物相关手术部位感染风险/);
  assert.match(summary,/切皮前30～60分钟给予头孢唑林静脉给药/);
  assert.match(summary,/无感染证据时不常规延长抗菌药物疗程/);
  assert.doesNotMatch(summary,/术后常规(7|七)天抗菌药/);
});
