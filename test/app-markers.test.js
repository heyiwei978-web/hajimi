import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {APP_MARKERS, markerIndex} from '../scripts/clinical-source.mjs';

// 2026-11-21：app.js 已排版。构建和身份账本审核按 APP_MARKERS 切分 app.js，
// 标记必须同时适用于当前的排版写法和历史提交中的压缩写法（audit:clinical 会读取历史版本）。
function check(source, label) {
  const types = markerIndex(source, APP_MARKERS.types), templates = markerIndex(source, APP_MARKERS.templates), patient = markerIndex(source, APP_MARKERS.patient);
  assert.ok(types >= 0 && templates > types && patient > templates, label + ': markers in order');
  assert.ok(markerIndex(source.slice(patient), APP_MARKERS.render) > 0, label + ': render() follows patient()');
  for (const pattern of Object.values(APP_MARKERS)) assert.equal(source.match(new RegExp(pattern.source, 'g')).length, 1, label + ': ' + pattern + ' is unique');
}

test('app.js split markers match the formatted source', () => {
  check(fs.readFileSync(new URL('../app.js', import.meta.url), 'utf8'), 'current');
});

test('app.js split markers still match the minified app.js of earlier commits', t => {
  let old;
  try { old = execFileSync('git', ['show', '540efe1:app.js'], {encoding: 'utf8', maxBuffer: 1 << 26, stdio: ['ignore', 'pipe', 'ignore']}); }
  catch { t.skip('history not available in this checkout'); return; }
  check(old, '540efe1');
});
