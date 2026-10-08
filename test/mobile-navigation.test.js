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


test('sticky header exposes a permanent site-home control without losing the library-home link',()=>{
  const index=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const css=fs.readFileSync(new URL('../styles.css',import.meta.url),'utf8');
  assert.match(index,/class="site-home-mark" href="\/" aria-label="返回网站首页"/);
  assert.match(index,/class="brand library-brand" href="\/bl"/);
  assert.match(css,/persistent site-home control in library sticky header/);
  assert.match(css,/#libraryShell \.site-home-mark/);
  assert.match(css,/\.topbar\{[^}]*position:sticky/s);
});
