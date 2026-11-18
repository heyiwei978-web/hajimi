import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PUBLIC_STYLES} from '../scripts/public-assets.mjs';
import {
  parseCss, stylesheetFiles, findOverriddenDeclarations, findUnusedRules, countImportant, countColorLiterals,
} from '../scripts/css-guard.mjs';

// 样式防叠加规则（docs/interface-design.md「样式防叠加规则」，2026-11-18）。
// 改样式时直接修改原规则；不要在后面再写一条去覆盖它，也不要新增补丁式样式文件。
const budget = JSON.parse(fs.readFileSync(new URL('../config/css-budget.json', import.meta.url), 'utf8')).files;
const read = file => fs.readFileSync(new URL('../' + file, import.meta.url), 'utf8');

test('样式文件清单固定：新增或删除样式文件须同步登记 config/css-budget.json', () => {
  assert.deepEqual(stylesheetFiles(), Object.keys(budget).sort(),
    '样式文件有增删。不要新增补丁式样式文件（如 xxx-polish.css、xxx-fix.css）；确需新增页面样式时，在 PR 中说明理由并登记预算');
  assert.deepEqual([...PUBLIC_STYLES].sort(), Object.keys(budget).sort(), '发布白名单与样式清单不一致');
});

test('没有写了也不生效的样式：改样式请直接修改原规则，不要在后面再覆盖一次', () => {
  assert.deepEqual(findOverriddenDeclarations(), []);
});

test('没有无人使用的样式规则：删除页面元素时一并删除对应样式', () => {
  assert.deepEqual(findUnusedRules(), []);
});

test('!important 只减不增', () => {
  for (const file of stylesheetFiles()) {
    const n = countImportant(read(file));
    assert.ok(n <= budget[file].important, `${file} 有 ${n} 处 !important，超过预算 ${budget[file].important}。请调整原规则，不要用 !important 硬盖`);
  }
});

test('新样式的颜色使用设计变量（--ds-*），直接写死的颜色只减不增', () => {
  for (const file of stylesheetFiles()) {
    const n = countColorLiterals(read(file));
    assert.ok(n <= budget[file].colorLiterals, `${file} 有 ${n} 处直接写死的颜色，超过预算 ${budget[file].colorLiterals}。请改用 theme.css 中的 --ds-* 变量`);
  }
});

test('检查器本身：能识别无空格的 @media、!important 与条件嵌套', () => {
  const rules = parseCss('.a{color:red}@media(max-width:600px){.a{color:blue!important}}@supports (display:grid){.b{--c:#fff;color:#000}}', 'x.css');
  assert.deepEqual(rules.map(r => [r.selector, r.conds]), [['.a', []], ['.a', ['@media(max-width:600px)']], ['.b', ['@supports (display:grid)']]]);
  assert.equal(countImportant('.a{color:red!important;margin:0}'), 1);
  assert.equal(countColorLiterals('.b{--c:#fff;color:#000;background:rgba(0,0,0,.1)}'), 2);
});
