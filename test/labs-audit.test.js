// 检验解读（labs-data.js）自动审核：参考范围与国家标准比对、内部逻辑、与站内其他模块交叉核对。
// 只读检查，不修改任何医学内容。审核记录见 docs/labs-audit-20261110.md。
//
// 已知差异（KNOWN_*）是本轮审核发现、等待站点负责人决定的问题：
// - 负责人决定修改 labs-data.js 后，对应条目会“消失”，测试会提示把它从清单里删掉；
// - 出现清单外的新差异时测试失败，防止内容在不知情的情况下偏离标准或自相矛盾。
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read = file => fs.readFileSync(new URL('../' + file, import.meta.url), 'utf8');
function loadLabs() {
  const context = {window: {}};
  vm.runInNewContext(read('labs-data.js'), context);
  return JSON.parse(JSON.stringify(context.window.HAJIMI_LABS)); // 转成本 realm 的对象，便于 deepEqual
}
const data = loadLabs();
const items = data.categories.flatMap(category => category.items);
const byId = new Map(items.map(item => [item.id, item]));
const row = (id, label) => {
  const found = byId.get(id).ranges.find(([name]) => name === label);
  assert.ok(found, id + ' 缺少参考范围行「' + label + '」');
  return found[1];
};

// 把「3.5–9.5」「<0.5」「≥90」「约 0.8–1.2」「82–100 fL」等写法解析成上下限。
const NUM = String.raw`[−-]?\d+(?:\.\d+)?`;
function parseRange(text) {
  const t = String(text).replace(/，/g, ',');
  let m = t.match(new RegExp('(' + NUM + ')\\s*%?\\s*[–~～-]\\s*<?\\s*(' + NUM + ')'));
  if (m) return {lo: Number(m[1].replace('−', '-')), hi: Number(m[2].replace('−', '-'))};
  m = t.match(new RegExp('^[^\\d<>≤≥]*([<≤])\\s*(' + NUM + ')'));
  if (m) return {lo: -Infinity, hi: Number(m[2])};
  m = t.match(new RegExp('^[^\\d<>≤≥]*([>≥])\\s*(' + NUM + ')'));
  if (m) return {lo: Number(m[2]), hi: Infinity};
  return null;
}
const same = (a, b) => Math.abs(a - b) < 1e-9;

// ---------------------------------------------------------------------------
// 1. 参考范围与国家卫生行业标准原文逐条比对
// 数值抄自标准原文表 1（2026-11-10 下载核对）：
//   WS/T 405-2012 血细胞分析；WS/T 404.1-2012 ALT/AST/ALP/GGT；404.2-2012 总蛋白/白蛋白；
//   404.3-2012 钾钠氯；404.4-2018 总胆红素/直接胆红素；404.5-2015 尿素/肌酐；
//   404.6-2015 钙磷镁铁；404.7-2015 LDH/CK；404.9-2026（2026-11-01 实施，代替 2018 版）CRP 等；
//   404.10-2022 甲状腺功能（按分析系统给出，取各系统最低下限与最高上限作包络）。
// ---------------------------------------------------------------------------
const STANDARD = [
  ['WS/T 405-2012', 'wbc', '成人', 3.5, 9.5],
  ['WS/T 405-2012', 'neut', '绝对值', 1.8, 6.3],
  ['WS/T 405-2012', 'neut', '百分比', 40, 75],
  ['WS/T 405-2012', 'lym', '绝对值', 1.1, 3.2],
  ['WS/T 405-2012', 'lym', '百分比', 20, 50],
  ['WS/T 405-2012', 'eos', '绝对值', 0.02, 0.52],
  ['WS/T 405-2012', 'eos', '百分比', 0.4, 8.0],
  ['WS/T 405-2012', 'hb', '成年男性', 130, 175],
  ['WS/T 405-2012', 'hb', '成年女性', 115, 150],
  ['WS/T 405-2012', 'mcv', 'MCV', 82, 100],
  ['WS/T 405-2012', 'mcv', 'MCH', 27, 34],
  ['WS/T 405-2012', 'mcv', 'MCHC', 316, 354],
  ['WS/T 405-2012', 'plt', '成人', 125, 350],
  ['WS/T 404.1-2012', 'alt', '男', 9, 50],
  ['WS/T 404.1-2012', 'alt', '女', 7, 40],
  ['WS/T 404.1-2012', 'ast', '男', 15, 40],
  ['WS/T 404.1-2012', 'ast', '女', 13, 35],
  ['WS/T 404.1-2012', 'alp', '男', 45, 125],
  ['WS/T 404.1-2012', 'alp', '女（20–49 岁）', 35, 100],
  ['WS/T 404.1-2012', 'alp', '女（50–79 岁）', 50, 135],
  ['WS/T 404.1-2012', 'ggt', '男', 10, 60],
  ['WS/T 404.1-2012', 'ggt', '女', 7, 45],
  ['WS/T 404.2-2012', 'alb', '成人', 40, 55],
  ['WS/T 404.2-2012', 'alb', '总蛋白', 65, 85],
  ['WS/T 404.3-2012', 'k', '成人', 3.5, 5.3],
  ['WS/T 404.3-2012', 'na', '成人', 137, 147],
  ['WS/T 404.3-2012', 'cl', '成人', 99, 110],
  ['WS/T 404.4-2018', 'tbil', '总胆红素（男）', -Infinity, 26.0],
  ['WS/T 404.4-2018', 'tbil', '总胆红素（女）', -Infinity, 21.0],
  ['WS/T 404.4-2018', 'tbil', '直接胆红素', -Infinity, 8.0], // 罗氏 ≤8.0；贝克曼 ≤4.0
  ['WS/T 404.5-2015', 'cr', '男（20–59 岁）', 57, 97],
  ['WS/T 404.5-2015', 'cr', '男（60–79 岁）', 57, 111],
  ['WS/T 404.5-2015', 'cr', '女（20–59 岁）', 41, 73],
  ['WS/T 404.5-2015', 'cr', '女（60–79 岁）', 41, 81],
  ['WS/T 404.5-2015', 'urea', '男（20–59 岁）', 3.1, 8.0],
  ['WS/T 404.5-2015', 'urea', '男（60–79 岁）', 3.6, 9.5],
  ['WS/T 404.5-2015', 'urea', '女（20–59 岁）', 2.6, 7.5],
  ['WS/T 404.5-2015', 'urea', '女（60–79 岁）', 3.1, 8.8],
  ['WS/T 404.6-2015', 'ca', '总钙', 2.11, 2.52],
  ['WS/T 404.6-2015', 'p', '成人', 0.85, 1.51],
  ['WS/T 404.6-2015', 'mg', '成人', 0.75, 1.02],
  ['WS/T 404.7-2015', 'ck', 'CK 男', 50, 310],
  ['WS/T 404.7-2015', 'ck', 'CK 女', 40, 200],
  ['WS/T 404.9-2026', 'crp', '常规', -Infinity, 6.0],
  ['WS/T 404.10-2022', 'thyroid', 'TSH', 0.60, 5.60]
];
// 与标准不一致、待负责人决定的项目（item:行名）。
// 2026-11-10 负责人确认后已按标准修订胆红素、CRP、TSH，目前没有已知差异。
const KNOWN_STANDARD_DEVIATIONS = new Set([]);

test('参考范围与 WS/T 405、WS/T 404 系列原文一致（已知差异除外）', () => {
  const deviations = new Set();
  for (const [source, id, label, lo, hi] of STANDARD) {
    const parsed = parseRange(row(id, label));
    assert.ok(parsed, id + ' ' + label + ' 无法解析：' + row(id, label));
    const ok = (lo === -Infinity ? true : same(parsed.lo, lo)) && same(parsed.hi, hi);
    if (!ok) deviations.add(id + ':' + label);
    else assert.ok(!KNOWN_STANDARD_DEVIATIONS.has(id + ':' + label),
      id + ':' + label + ' 已与 ' + source + ' 一致，请从 KNOWN_STANDARD_DEVIATIONS 删除');
  }
  assert.deepEqual([...deviations].sort(), [...KNOWN_STANDARD_DEVIATIONS].sort(),
    '出现新的与国家标准不一致的参考范围');
});

// ---------------------------------------------------------------------------
// 2. 内部逻辑
// ---------------------------------------------------------------------------
test('每个数字参考范围下限小于上限，单位写法统一', () => {
  for (const item of items) {
    for (const [label, value] of item.ranges) {
      const parsed = parseRange(value);
      if (!parsed || !Number.isFinite(parsed.lo) || !Number.isFinite(parsed.hi)) continue;
      assert.ok(parsed.lo < parsed.hi, item.id + ' ' + label + ' 下限应小于上限：' + value);
    }
    assert.doesNotMatch(item.unit + item.ranges.flat().join(''), /10\^9|10e9|x10/i, item.id + ' 使用 ×10⁹/L 写法');
  }
});

// 危急值不得落在参考范围以内：低危急值 < 参考下限，高危急值 > 参考上限。
// critical 文字按「；」分段，段首可写所指项目（pH、PaO₂、INR），否则对应 refRow。
const CRITICAL = {
  wbc: {'': ['成人']},
  hb: {'': ['成年男性', '成年女性']},
  plt: {'': ['成人']},
  pt: {INR: ['INR（未抗凝）', '华法林治疗目标']},
  k: {'': ['成人']},
  na: {'': ['成人']},
  ca: {'': ['总钙']},
  abg: {pH: ['pH'], 'PaO₂': ['PaO₂（吸空气）']},
  lac: {'': ['成人']},
  glu: {'': ['空腹']}
};
function criticalBounds(text) {
  const out = [];
  for (const segment of text.replace(/（以本院为准）/g, '').split('；')) {
    const key = (segment.match(/^(?:[^<>]*?)(pH|PaO₂|INR)/) || [, ''])[1];
    for (const m of segment.matchAll(new RegExp('([<>])\\s*(' + NUM + ')(?:\\s*[–-]\\s*(' + NUM + '))?', 'g'))) {
      const values = [Number(m[2]), m[3] === undefined ? Number(m[2]) : Number(m[3])];
      out.push({key, side: m[1], values});
    }
  }
  return out;
}

test('危急值都在参考范围之外，且每项都有说明「以本院为准」', () => {
  const withCritical = items.filter(item => item.critical).map(item => item.id).sort();
  assert.deepEqual(withCritical, Object.keys(CRITICAL).sort(), '有危急值的项目变化时请同步本测试');
  for (const [id, map] of Object.entries(CRITICAL)) {
    const item = byId.get(id);
    assert.match(item.critical, /以本院为准/, id + ' 危急值须注明以本院为准');
    const bounds = criticalBounds(item.critical);
    assert.ok(bounds.length, id + ' 危急值无法解析：' + item.critical);
    for (const {key, side, values} of bounds) {
      assert.ok(map[key], id + ' 危急值分段「' + key + '」没有对应的参考范围');
      const refs = map[key].map(label => parseRange(row(id, label)));
      for (const value of values) {
        if (side === '<') assert.ok(refs.every(r => value < r.lo), id + ' 低危急值 ' + value + ' 落入参考范围');
        else assert.ok(refs.every(r => value > r.hi), id + ' 高危急值 ' + value + ' 落入参考范围');
      }
      assert.ok(values[0] <= values[1], id + ' 危急值区间写反');
    }
    // 危急值里写了单位时必须与项目单位一致。
    for (const unit of item.critical.match(/×10⁹\/L|g\/L|mmol\/L|mmHg/g) || []) {
      assert.ok(item.unit.includes(unit) || item.ranges.some(([, v]) => v.includes(unit)) || unit === 'mmHg' && id === 'abg',
        id + ' 危急值单位 ' + unit + ' 与项目单位不一致');
    }
  }
});

// 只有低侧或高侧危急值的项目（待负责人决定是否补另一侧）。
const KNOWN_ONE_SIDED_CRITICAL = new Set(['hb', 'lac', 'pt']);
test('危急值单侧缺失的项目与审核清单一致', () => {
  const oneSided = Object.keys(CRITICAL).filter(id => {
    const sides = new Set(criticalBounds(byId.get(id).critical).map(b => b.side));
    return sides.size < 2;
  });
  assert.deepEqual(oneSided.sort(), [...KNOWN_ONE_SIDED_CRITICAL].sort());
});

test('分级、分层的界值连续且不重叠', () => {
  // eGFR G1–G5
  const stages = byId.get('egfr').ranges.map(([, v]) => parseRange(v));
  for (let i = 1; i < stages.length; i += 1) {
    const upper = stages[i], lower = stages[i - 1];
    // 「60–89」是整数闭区间，下一档从 90 开始；「<15」不含 15，紧接「15–29」。
    assert.equal(upper.lo === -Infinity ? upper.hi : upper.hi + 1, lower.lo, 'eGFR 分期不连续：' + JSON.stringify([lower, upper]));
  }
  // PCT 界值递增：0.05 < 0.5 < 2 < 10；抗生素停药界值 0.5 与分层一致。
  const pct = byId.get('pct');
  const cuts = pct.ranges.map(([label, value]) => parseRange(label) || parseRange(value));
  const points = [cuts[0].hi, cuts[1].hi, cuts[2].lo, cuts[2].hi, cuts[3].lo, cuts[4].lo];
  assert.deepEqual(points, [0.05, 0.5, 0.5, 2, 2, 10]);
  assert.match(pct.points.join(''), /<0\.5 ng\/mL/);
  // 关节液白细胞分层 200 / 2000 / 50000。
  const syn = byId.get('synovial').ranges.map(([, v]) => parseRange(v));
  assert.equal(syn[0].hi, syn[1].lo);
  assert.equal(syn[1].hi, syn[2].lo);
  assert.equal(syn[2].hi, syn[3].lo);
  // 假体周围感染：慢性阈值低于急性阈值，急性阈值低于自体关节化脓阈值。
  const pji = byId.get('synovial').points.join('');
  assert.match(pji, /WBC >3000\/μL、中性粒细胞 >80%/);
  assert.match(pji, /WBC >10000\/μL、中性粒细胞 >90%/);
  assert.ok(3000 < 10000 && 10000 < syn[3].lo);
  // 贫血分度 30 / 60 / 90，轻度上限即参考下限，均低于女性下限 115。
  assert.match(byId.get('hb').points[0], /轻度 >90，中度 60–90，重度 30–59，极重度 <30 g\/L/);
  assert.ok(90 < parseRange(row('hb', '成年女性')).lo);
});

test('同一界值在不同条目、不同句子中写法一致', () => {
  const hb = byId.get('hb');
  // 输血指征：<70 考虑输血，>100 一般不输；两个界值都高于 Hb 危急值。
  assert.match(hb.points.join(''), /Hb >100 g\/L 不需输血，<70 g\/L 多需考虑输血，70–100 g\/L/);
  for (const {values} of criticalBounds(hb.critical)) assert.ok(values.every(v => v < 70), 'Hb 危急值应低于输血界值 70');
  // 低血糖界值 3.9 与空腹下限一致；严重低血糖界值高于危急值下限。
  const glu = byId.get('glu');
  assert.equal(parseRange(row('glu', '空腹')).lo, 3.9);
  assert.match(glu.points[0], /<3\.9 mmol\/L 为低血糖/);
  const gluLow = criticalBounds(glu.critical).find(b => b.side === '<').values[1];
  assert.ok(gluLow < 3.0, '血糖低危急值应低于 3.0');
  // 乳酸：参考上限 2.0 = 高乳酸界值 = Sepsis-3 界值；严重低灌注 4 = 危急值。
  const lac = byId.get('lac');
  assert.equal(parseRange(row('lac', '成人')).hi, 2.0);
  assert.match(lac.points[0], />2 mmol\/L 为高乳酸血症；≥4 mmol\/L/);
  assert.match(lac.points[0], /乳酸 >2 mmol\/L/);
  assert.deepEqual(criticalBounds(lac.critical).map(b => b.values[0]), [4]);
  // D-二聚体年龄校正在 50 岁时等于常用界值 0.5。
  assert.equal(parseRange(row('ddimer', '常用阴性界值')).hi, 0.5);
  assert.match(row('ddimer', '年龄校正界值（>50 岁）'), /年龄 × 0\.01/);
  // 白蛋白：术前风险界值 35 低于参考下限 40；校正钙、校正 AG 都以 40 g/L 为基线。
  assert.match(byId.get('alb').points[0], /<35 g\/L/);
  assert.match(byId.get('ca').points[0], /0\.02 ×（40 − 白蛋白 g\/L）/);
  assert.match(byId.get('ag').points[0], /白蛋白每降低 10 g\/L，AG 约降低 2\.5/);
  // 中性粒细胞减少 1.5 低于参考下限 1.8。
  assert.ok(1.5 < parseRange(row('neut', '绝对值')).lo);
  // 小细胞界值 80 不高于 MCV 参考下限 82（80–82 之间页面未定义，见审核清单）。
  assert.match(byId.get('mcv').low[0], /MCV <80/);
  assert.match(byId.get('mcv').high[0], /MCV >100/);
  assert.ok(80 <= parseRange(row('mcv', 'MCV')).lo);
  // 维生素 D：ng/mL × 2.5 = nmol/L。
  assert.match(row('vitd', '缺乏'), /<20 ng\/mL（<50 nmol\/L）/);
});

test('相关项目链接不指向自己、不重复', () => {
  for (const item of items) {
    const related = item.related || [];
    assert.ok(!related.includes(item.id), item.id + ' 链接到自己');
    assert.equal(new Set(related).size, related.length, item.id + ' 相关项目重复');
    const tools = (item.tools || []).map(([key]) => key);
    assert.equal(new Set(tools).size, tools.length, item.id + ' 工具重复');
  }
});

// ---------------------------------------------------------------------------
// 3. 与站内其他模块交叉核对
// ---------------------------------------------------------------------------
const toolsSource = read('tools-page.js');
const toolCalc = key => {
  const m = toolsSource.match(new RegExp("k==='" + key + "'\\)go\\.onclick=\\(\\)=>\\{(.*)"));
  assert.ok(m, '找不到工具 ' + key + ' 的计算代码');
  return m[1];
};
const toolForm = key => {
  const m = toolsSource.match(new RegExp("if\\(k==='" + key + "'\\)return (.*)"));
  return m ? m[1] : '';
};

test('与临床工具：公式、系数一致', () => {
  // 校正钙：页面 0.02 mmol/L per g/L；工具 0.8 mg/dL per g/dL。换算：0.8 / 4.008 / 10 ≈ 0.020。
  assert.match(toolCalc('corrca'), /num\('#ca'\)\+\.8\*\(4-num\('#alb'\)\)/);
  assert.ok(Math.abs(0.8 / 4.008 / 10 - 0.02) < 0.0005);
  // 校正 AG：页面每 10 g/L 2.5；工具 2.5 ×（4 − g/dL）。
  assert.match(toolCalc('corrag'), /ag\+2\.5\*\(4-num\('#alb'\)\)/);
  // AG 公式与 Delta ratio 基线 12 在页面参考范围 8–16 内。
  assert.match(toolCalc('ag'), /num\('#na'\)-num\('#cl'\)-num\('#hco3'\)/);
  assert.match(byId.get('ag').points[0], /AG = Na⁺ −（Cl⁻ \+ HCO₃⁻）/);
  const ag = parseRange(row('ag', '常用'));
  assert.ok(ag.lo <= 12 && 12 <= ag.hi && /\(ag-12\)\/\(24-b\)/.test(toolCalc('deltaratio')));
  // Winter 公式。
  assert.match(toolCalc('winter'), /1\.5\*num\('#hco3'\)\+8/);
  assert.match(toolCalc('winter'), /e-2[\s\S]*e\+2/);
  assert.match(byId.get('abg').points[0], /1\.5 × HCO₃⁻ \+ 8 ± 2/);
  // Mentzer 指数界值 13。
  assert.match(toolCalc('mentzer'), /<13/);
  // ANC 单位与页面一致（×10⁹/L）。
  assert.match(toolCalc('anc'), /×10⁹\/L/);
});

// 页面用法定单位（mmol/L、g/L、μmol/L），以下链接到的工具要求输入美制单位，医生需先换算。
const KNOWN_TOOL_UNIT_MISMATCH = new Set(['corrag', 'corrca', 'corrna', 'crcl', 'egfrcc', 'ldl', 'nonhdl', 'osm', 'osmgap', 'tsat']);
test('与临床工具：输入单位与检验解读页面单位不一致的工具与审核清单一致', () => {
  const linked = new Set(items.flatMap(item => (item.tools || []).map(([key]) => key)));
  // 提供 μmol/L / mmol/L 单位切换的工具（如 eGFR）不算。
  const mismatch = [...linked].filter(key => /mg\/dL|g\/dL|μg\/dL/.test(toolForm(key)) && !/\['u','μmol\/L'\]/.test(toolForm(key)));
  assert.deepEqual(mismatch.sort(), [...KNOWN_TOOL_UNIT_MISMATCH].sort());
});

test('与心电图：血钾、血钙、低钾病例的数值与检验解读一致', () => {
  const k = parseRange(row('k', '成人'));
  const book = read('ecg-book-data-3.js');
  const hyper = book.match(/教材：血钾与心电图（大致对应）','>(\d+\.\d) mmol\/L/);
  assert.ok(hyper && Number(hyper[1]) > k.hi, '心电图教材高钾起始界值应高于血钾参考上限');
  const cases = read('ecg-cases-data.js');
  for (const m of cases.matchAll(/低钾（(\d+\.\d) mmol\/L）/g)) assert.ok(Number(m[1]) < k.lo, '心电图病例「低钾」数值应低于参考下限');
  // 两边都要求查镁、以离子钙或校正钙为准。
  assert.match(read('ecg-data.js'), /同时检查血镁/);
  assert.match(byId.get('k').points.join(''), /查镁/);
  assert.match(read('ecg-data.js'), /离子钙或白蛋白校正后血钙/);
  assert.match(byId.get('ca').points[0], /离子钙更准确/);
});

test('与内科医嘱参考（初始资料）：高钾处理界值落在检验解读的危急值区间内', async () => {
  const seed = (await import('../api/_duty-orders-seed.js')).default;
  const text = seed.flatMap(sheet => sheet.rows.flat()).join('\n');
  const m = text.match(/血钾＞(\d+\.\d)/);
  assert.ok(m, '内科医嘱参考中找不到高钾会诊界值');
  const high = criticalBounds(byId.get('k').critical).find(b => b.side === '>').values;
  assert.ok(Number(m[1]) >= high[0] && Number(m[1]) <= high[1], '高钾会诊界值 ' + m[1] + ' 与危急值 ' + high.join('–') + ' 不一致');
  const dka = text.match(/血钾①小于(\d+\.\d)mmol\/L/);
  assert.ok(dka && Number(dka[1]) < parseRange(row('k', '成人')).lo, '酮症补钾界值应低于血钾参考下限');
});

test('页面状态保持「待审核」', () => {
  assert.equal(data.reviewStatus, '待审核');
  assert.match(read('labs-data.js'), /草稿 · 待审核/);
});

test('2026-11-10 负责人确认的修订保持不变（低血糖分级、脓毒性休克、化脓性关节炎）', () => {
  const glu = byId.get('glu').points[0];
  assert.match(glu, /<3\.0 mmol\/L 为 2 级（临床显著）低血糖/);
  assert.match(glu, /3 级（严重）低血糖，不以血糖数值界定/);
  assert.doesNotMatch(glu, /<3\.0 mmol\/L 为严重低血糖/);
  assert.match(byId.get('lac').points[0], /充分液体复苏后仍需血管活性药维持 MAP ≥65 mmHg，且乳酸 >2 mmol\/L/);
  assert.match(row('synovial', '化脓性关节炎（自体关节）'), /中性粒细胞多 >75%（常 >90%）/);
  for (const ref of ['WS/T 404.4-2018', 'WS/T 404.9-2026', 'WS/T 404.10-2022']) {
    assert.ok(data.references.some(text => text.includes(ref)), '参考资料缺少 ' + ref);
  }
});
