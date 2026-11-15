import test from 'node:test';
import assert from 'node:assert/strict';
import {NOTE_CASES, NOTE_SCENARIOS} from '../scripts/fixtures/note-cases.mjs';
import {buildMessages, validateInput, DOC_TYPES} from '../api/note-generate.js';

// 这些是输入/提示词契约测试，不能证明真实模型输出的临床正确性。
test('five synthetic cases cover twenty requested document scenarios without changing supplied facts', () => {
  assert.equal(NOTE_CASES.length, 5);
  assert.equal(NOTE_SCENARIOS.length, 20);
  for (const {id, body} of NOTE_SCENARIOS) {
    const checked = validateInput(body);
    assert.equal(checked.error, undefined, id);
    const [system, user] = buildMessages(checked);
    for (const key of ['complaint', 'diagnosis', 'operation', 'history', 'anesthesia', 'extra', 'daily', 'secondary']) {
      if (body[key]) assert.ok(user.content.includes(body[key]), id + ' preserves ' + key);
    }
    assert.match(system.content, /补全模式/);
    assert.match(system.content, /常规手术步骤、常规术后处理与康复计划/);
    assert.match(system.content, /当前病例事实优先于临床常规与参考片段/);
    assert.match(system.content, /不罗列大量【待填写】或【待核实】/);
    assert.match(system.content, /医学审核提醒由页面独立显示/);
    assert.doesNotMatch(system.content, /正文最后单独一行写/);
  }
});

test('minimal input still supports completion without additional required fields', () => {
  for (const type of Object.keys(DOC_TYPES)) {
    const body = {type, complaint: '外伤后膝部疼痛', diagnosis: '胫骨平台骨折'};
    if (DOC_TYPES[type].needsOperation) body.operation = '胫骨平台骨折切开复位钢板内固定术';
    if (DOC_TYPES[type].needsDay) body.day = '2';
    if (DOC_TYPES[type].needsReference) { body.caseReference = '教学病例'; body.chapterTitle = '术前小结'; }
    assert.equal(validateInput(body).error, undefined, type);
  }
});

test('reference chapters use the matching document structure without importing reference facts', () => {
  for (const [chapterTitle, type] of [
    ['首次病程记录', 'first'], ['专科检查', 'spec'], ['住院第2天术前病程记录', 'preDaily'],
    ['术前小结', 'preop'], ['手术记录', 'op'], ['术后首次病程记录', 'postop'], ['术后第7天病程记录', 'postDaily']
  ]) {
    const checked = validateInput({...NOTE_SCENARIOS[0].body, type: 'caseChapter', caseReference: '独立参考病例', chapterTitle,
      day: '2', referenceText: '参考示例：左侧骨折，Hb 88 g/L。'});
    const user = buildMessages(checked)[1].content;
    assert.ok(user.includes(DOC_TYPES[type].guide), chapterTitle);
    assert.match(user, /用户填写的天数优先于参考章节名称中的天数/);
    assert.match(user, /不得套用其中事实/);
    assert.match(user, /主诊断：右股骨颈骨折/);
    assert.match(user, /记录天数（以所选章节阶段为准）：第2天/);
  }
  const checked = validateInput({...NOTE_SCENARIOS[0].body, type: 'caseChapter', caseReference: '教学病例', chapterTitle: '入院记录'});
  assert.doesNotMatch(buildMessages(checked)[1].content, /所选章节结构要求：按查房/);
});

test('daily rounds connect findings to instructions and preserve procedure-specific restrictions', () => {
  for (const type of ['preDaily', 'postDaily']) {
    const guide = DOC_TYPES[type].guide;
    assert.match(guide, /今日某级别医师查房 → 患者一般情况及主诉 → 专科查体 → 辅助检查 → 医师分析及指示 → 处理意见 → 医师签名/);
    assert.match(guide, /说明处理理由/);
  }
  assert.match(DOC_TYPES.postDaily.guide, /负重与活动计划须符合术式/);
  assert.match(DOC_TYPES.op.guide, /保留输入的入路、操作、特殊发现和否定信息/);
  assert.match(DOC_TYPES.postop.guide, /不能照抄整篇手术记录/);
  assert.match(DOC_TYPES.first.guide, /不套用每日查房开头/);
  assert.match(DOC_TYPES.spec.guide, /不为凑项目描述反复诱发骨擦感或强行活动/);
});
