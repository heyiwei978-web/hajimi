import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {textProblems, syntaxProblems, forbiddenProblems, htmlSinkCounts, countHtmlSinks} from '../scripts/code-style.mjs';

// 代码规范（docs/code-style.md，2026-11-18）。本地运行 `npm run lint` 可一次列出全部问题。
const budget = JSON.parse(fs.readFileSync(new URL('../config/code-budget.json', import.meta.url), 'utf8')).htmlSinks;

test('文本格式：UTF-8、LF 换行、末尾换行、空格缩进、无行尾空格、JSON 合法', () => {
  assert.deepEqual(textProblems(), []);
});

test('所有脚本都能通过语法检查', () => {
  assert.deepEqual(syntaxProblems(), []);
});

test('不使用被禁止的写法（eval、内联脚本和事件、禁止缩放、transition: all、页面里的 console.log 等）', () => {
  assert.deepEqual(forbiddenProblems(), []);
});

test('直接拼接 HTML 的写法只减不增', () => {
  for (const [file, n] of Object.entries(htmlSinkCounts())) {
    assert.ok(n <= (budget[file] || 0), `${file} 有 ${n} 处 innerHTML/insertAdjacentHTML，超过预算 ${budget[file] || 0}。请改用 textContent 和 DOM 方法`);
  }
});

test('检查器本身：识别 HTML 拼接写法，忽略注释和比较', () => {
  assert.equal(countHtmlSinks('a.innerHTML = x; b.innerHTML += y; c.outerHTML=z; d.insertAdjacentHTML("beforeend", s);'), 4);
  assert.equal(countHtmlSinks('// a.innerHTML = x\n/* b.innerHTML = y */ if (c.innerHTML === "") {}'), 0);
});
