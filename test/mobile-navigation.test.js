import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

test('mobile library pages always expose a site-home route',()=>{
  const departments=fs.readFileSync(new URL('../departments.js',import.meta.url),'utf8');
  assert.match(departments,/⌂ 网站首页/);
  assert.match(departments,/⌂ 返回网站首页/);
  assert.match(departments,/▤ 病历首页/);
  assert.match(departments,/department-toolbar-actions/);
  assert.match(departments,/mobile-drawer-shortcuts/);
});

test('mobile orthopedic drawer uses touch scrolling without visible nested scrollbar',()=>{
  const css=fs.readFileSync(new URL('../styles.css',import.meta.url),'utf8');
  assert.match(css,/touch-action:pan-y!important/);
  assert.match(css,/scrollbar-width:none!important/);
  assert.match(css,/sidebar::\-webkit-scrollbar/);
  assert.match(css,/mobile-drawer-shortcuts/);
});
