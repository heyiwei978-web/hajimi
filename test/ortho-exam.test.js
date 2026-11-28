import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {runInNewContext} from 'node:vm';

const context = {document: {getElementById: () => null}};
runInNewContext(readFileSync(new URL('../js/ortho-exam.js', import.meta.url), 'utf8'), context);
const {formatExam} = context.HajimiOrthoExam;

test('空白查体和未选侧别无正文；不会写入拟诊或默认正常结果', () => {
  assert.equal(formatExam('hip-fracture', 'left', {left: {inspection: '   '}}), '');
  assert.equal(formatExam('hip-fracture', '', {left: {pulse: '减弱'}}), '');
  assert.equal(formatExam('', 'left', {left: {pulse: '减弱'}}), '');
});

test('左右侧结果独立，选择双侧也不会复制单侧所见', () => {
  const exam = {left: {pulse: '减弱'}, right: {inspection: '肿胀'}};
  assert.equal(formatExam('ankle-fracture', 'right', exam), '右侧踝部查体：视诊：肿胀。');
  assert.equal(formatExam('ankle-fracture', 'both', exam),
    '左侧踝部查体：远端动脉搏动：减弱。\n右侧踝部查体：视诊：肿胀。');
  assert.equal(formatExam('ankle-fracture', 'both', {left: exam.left}),
    '左侧踝部查体：远端动脉搏动：减弱。');
});

test('ROM 只使用实际录入，特殊试验仅输出本模板的显式结果', () => {
  const exam = {right: {'屈曲主动': '0°–90°', '屈曲被动': '0°–100°', '屈曲疼痛': '疼痛',
    'Lachman 试验': '阳性', '前抽屉试验': '未检查', '后抽屉试验': '阴性', 'Thompson 试验': '阳性'}};
  assert.equal(formatExam('knee', 'right', exam),
    '右侧膝关节查体：活动度屈曲：主动0°–90°、被动0°–100°、疼痛；特殊试验：Lachman 试验（＋）、后抽屉试验（－）。');
  assert.equal(formatExam('ankle-fracture', 'right', exam), '');
});
