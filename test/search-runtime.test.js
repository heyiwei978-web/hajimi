import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

const context = vm.createContext({});
vm.runInContext(fs.readFileSync(new URL('../search-core.js', import.meta.url), 'utf8'), context);
const records = [
  {department:'骨科',group:'TKA',name:'全膝关节置换 · 术前讨论',stage:'术前',type:'讨论',desc:'术前风险评估'},
  {department:'骨科',group:'THA',name:'全髋关节置换 · 术前讨论',stage:'术前',type:'讨论'},
  {department:'普外科',group:'肝脓肿',name:'肝脓肿 · 入院记录',stage:'入院',type:'入院记录',sourceBody:'真实患者信息不参与搜索'}
];
const search = context.createHajimiSearch(records);
const state = {group:'all',stage:'all',type:'all',q:''};
const resultNames = (options,department) => Array.from(search({...state,...options},department), record=>record.name);

test('cross-department search finds metadata with Chinese, mixed case and multiple terms', () => {
  assert.deepEqual(resultNames({q:' 普外科 肝脓肿 '}), ['肝脓肿 · 入院记录']);
  assert.deepEqual(resultNames({q:'tka 术前'}), ['全膝关节置换 · 术前讨论']);
  assert.deepEqual(resultNames({q:'术前讨论'}), records.slice(0,2).map(r=>r.name));
});
test('department, stage, type and disease filters combine without changing source records', () => {
  assert.deepEqual(resultNames({stage:'入院'},'骨科'), []);
  assert.deepEqual(resultNames({type:'讨论',group:'THA'}), [records[1].name]);
  assert.equal(search(state)[0], records[0]);
  assert.deepEqual(resultNames({}),records.map(r=>r.name));
});
test('search excludes patient record bodies and handles empty results', () => {
  assert.deepEqual(resultNames({q:'真实患者信息'}), []);
  assert.deepEqual(resultNames({q:'不存在的病历'}), []);
});

test('metadata highlighting handles Chinese, case, overlapping terms and literal punctuation', () => {
  const highlight = context.highlightHajimiSearch;
  assert.equal(highlight('TKA · 术后首次病程', 'tka 术后 术后首次'),
    '<mark class="search-hit">TKA</mark> · <mark class="search-hit">术后首次</mark>病程');
  assert.equal(highlight('风险评估 (A+B) [复查]', '(A+B) [复查]'),
    '风险评估 <mark class="search-hit">(A+B)</mark> <mark class="search-hit">[复查]</mark>');
  assert.equal(highlight('未匹配的文书', ' '), '未匹配的文书');
});

test('highlighted labels and queries cannot inject HTML or turn text into markup', () => {
  const highlight = context.highlightHajimiSearch;
  const label = '<img src=x onerror="alert(1)"> & 术后';
  assert.equal(highlight(label, '<img 术后'),
    '<mark class="search-hit">&lt;img</mark> src=x onerror=&quot;alert(1)&quot;&gt; &amp; <mark class="search-hit">术后</mark>');
  assert.equal(highlight('正常文书', '<script>alert(1)</script>'), '正常文书');
  assert.equal(highlight("'入院'", ''), '&#39;入院&#39;');
});
