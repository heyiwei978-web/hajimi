import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const clinicalStyle = readFileSync(new URL('../record-clinical-style-v25.js', import.meta.url), 'utf8');

function sandbox(seeds, rows) {
  const scope = {
    window: { HAJIMI_IDEAL_CASES: { seeds } },
    templates: rows,
    generate: row => row.sourceBody
  };
  vm.runInNewContext(clinicalStyle, scope, { filename: 'record-clinical-style-v25.js' });
  assert.equal(scope.window.HAJIMI_CLINICAL_COPY_STYLE_V25.enabled, true);
  return scope.generate;
}

test('chief physician note has one body paragraph and a blank name', () => {
  const row = {
    group: 'TKA', short: '主任医师首次查房记录', type: '查房',
    sourceBody: '记录名称：主任医师首次查房记录\n患者：张某某\n记录时间：2026-10-09 10:00\n\n今日王建伟主任医师查房。\n\n查体：患膝肿胀。\n\n主任医师分析：影像支持关节退变。\n\n处理：完善术前检查。'
  };
  const text = sandbox({}, [row])(row);
  assert.match(text, /记录时间：2026-10-09 10:00\n\n/);
  assert.doesNotMatch(text, /王建伟/);
  assert.match(text, /查体：患膝肿胀。主任医师分析：影像支持关节退变。处理：完善术前检查。/);
  assert.match(text, /\n\n主任医师：________$/);
  assert.equal(text.split('\n\n').length, 3);
});

test('attending physician note leaves signature blank without losing clinical content', () => {
  const row = {
    group: 'THA', short: '主治医师首次查房记录', type: '查房',
    sourceBody: '记录名称：主治医师首次查房记录\n\n今日耿克亮主治医师查房。\n\n查体：髋部疼痛。\n\n处理：术前评估后决定手术。'
  };
  const text = sandbox({}, [row])(row);
  assert.doesNotMatch(text, /耿克亮/);
  assert.match(text, /髋部疼痛/);
  assert.match(text, /主治医师：________$/);
});

const operations = [
  {group:'TKA',surgery:'右全膝关节置换术',expected:'内侧髌旁'},
  {group:'THA',surgery:'右全髋关节置换术',expected:'髋臼'},
  {group:'人工股骨头置换',surgery:'左人工股骨头置换术',expected:'双极'},
  {group:'股骨转子间骨折',surgery:'右股骨转子间骨折闭合复位髓内钉内固定术',expected:'大转子'},
  {group:'股骨大粗隆骨折',surgery:'左股骨大粗隆骨折切开复位内固定术',expected:'臀中肌'},
  {group:'胫骨平台骨折',surgery:'右胫骨平台骨折切开复位内固定术',expected:'半月板'},
  {group:'桡骨远端骨折',surgery:'右桡骨远端骨折切开复位内固定术',expected:'旋前方肌'},
  {group:'锁骨骨折',surgery:'右锁骨骨折切开复位内固定术',expected:'锁骨上神经'},
  {group:'肱骨近端骨折',surgery:'右肱骨近端骨折切开复位内固定术',expected:'三角肌胸大肌'},
  {group:'肱骨干骨折',surgery:'左肱骨干骨折切开复位内固定术',expected:'桡神经'},
  {group:'肱骨远端骨折',surgery:'左肱骨远端髁间骨折切开复位双钢板内固定术',expected:'双钢板'},
  {group:'儿童肱骨髁上骨折',surgery:'右肱骨髁上骨折闭合复位经皮克氏针固定术',expected:'Baumann角'},
];

test('core operative records are 4 detailed paragraphs and retain metadata / postoperative plan', () => {
  const seeds = {};
  const rows = operations.map((op, index) => {
    seeds[op.group] = { ...op, side:index % 2 ? '左' : '右', anesthesia:'全身麻醉', position:'仰卧位', bloodloss:60, drain:false };
    return {
      group:op.group, short:'手术记录', type:'手术记录',
      sourceBody:'术前诊断：骨折\n手术名称：'+op.surgery+'\n\n手术经过：\n1. 消毒。\n2. 复位。\n3. 内固定。\n\n术后计划：康复。'
    };
  });
  const generate = sandbox(seeds, rows);
  rows.forEach((row, index) => {
    const body = generate(row);
    const procedural = body.split('手术经过：\n')[1].split('\n\n术后计划：')[0];
    assert.equal(procedural.split('\n\n').length, 4, operations[index].group);
    assert.ok(procedural.length > 450, operations[index].group + ' too short');
    assert.ok(procedural.includes(operations[index].expected), operations[index].group + ' anatomy missing');
    assert.match(body, /术后计划：康复。/);
  });
});

test('complex TKA cases keep their unique operative content', () => {
  const row = { group:'TKA',short:'手术记录',type:'手术记录',specialCase:true,
    sourceBody:'手术经过：于髌骨使用2枚锚钉修复内侧韧带撕裂，逐层缝合。' };
  assert.equal(sandbox({TKA:{group:'TKA',surgery:'右全膝关节置换术'}},[row])(row),row.sourceBody);
});
