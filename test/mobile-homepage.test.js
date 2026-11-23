import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

test('mobile workspace keeps the five tabs above the system gesture area',()=>{
  const css=fs.readFileSync(new URL('../personal-workstation.css',import.meta.url),'utf8');
  assert.match(css,/@media \(max-width: 720px\)[\s\S]*?\.ws-rail \{[\s\S]*?position: fixed;[\s\S]*?env\(safe-area-inset-bottom\)/);
  assert.match(css,/grid-template-columns: repeat\(5, minmax\(0, 1fr\)\)/);
});

test('every other page uses the same five phone tabs, above the system gesture area',()=>{
  const css=fs.readFileSync(new URL('../theme.css',import.meta.url),'utf8');
  const phone=css.slice(css.indexOf('@media screen and (max-width:720px){\n  :root:has(.site-nav)'));
  assert.match(phone,/\.site-nav\{position:fixed;[^}]*env\(safe-area-inset-bottom,0px\)/);
  assert.match(phone,/grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/);
  // Content and bottom-anchored controls clear the tab bar.
  assert.match(phone,/body:has\(\.site-nav\)\{padding-bottom:var\(--site-tabbar-height\)\}/);
  assert.match(fs.readFileSync(new URL('../ecg.css',import.meta.url),'utf8'),/\.ecg-review-footer\{position:fixed;bottom:var\(--site-tabbar-height,0px\)/);
});
