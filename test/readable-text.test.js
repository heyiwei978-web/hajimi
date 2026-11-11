import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {PUBLIC_STYLES} from '../scripts/public-assets.mjs';

// Readability floor (docs/interface-design.md, 2026-11-11): no on-screen text
// below 12px. Only the homepage illustration, which is aria-hidden artwork and
// not meant to be read, may use smaller type; font-size:0 hides text on purpose.
const MINIMUM = 12;
const DECORATIVE = /\.screen-|\.scene-|\.tools-art/;
const read = file => fs.readFileSync(new URL('../' + file, import.meta.url), 'utf8');

function smallText(css) {
  const found = [];
  for (const [, selector, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (DECORATIVE.test(selector)) continue;
    for (const [, value, unit] of body.matchAll(/font-size:\s*(\.?[0-9][0-9.]*)(px|rem)\b/g)) {
      const pixels = parseFloat(value) * (unit === 'rem' ? 16 : 1);
      if (pixels > 0 && pixels < MINIMUM) found.push(selector.trim().replace(/\s+/g, ' ') + ' → ' + value + unit);
    }
    for (const [, value, unit] of body.matchAll(/font:\s*[^;}]*?[\s:](\.?[0-9][0-9.]*)(px|rem)(?=[\s/])/g)) {
      const pixels = parseFloat(value) * (unit === 'rem' ? 16 : 1);
      if (pixels > 0 && pixels < MINIMUM) found.push(selector.trim().replace(/\s+/g, ' ') + ' → font ' + value + unit);
    }
  }
  return found;
}

test('published stylesheets set no text below 12px', () => {
  for (const file of PUBLIC_STYLES) assert.deepEqual(smallText(read(file)), [], file);
});

test('the check itself recognises small sizes and the documented exceptions', () => {
  assert.deepEqual(smallText('.a{font-size:11px}.b{font-size:.6875rem}.c{font:600 10px/1.2 sans-serif}.d{font-size:12px}.e{font-size:0}'),
    ['.a → 11px', '.b → .6875rem', '.c → font 10px']);
  assert.deepEqual(smallText('.screen-top{font-size:7px}.scene-books span{font-size:9px}'), []);
});
