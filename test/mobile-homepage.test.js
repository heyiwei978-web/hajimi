import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

test('mobile workspace keeps the five tabs above the system gesture area',()=>{
  const css=fs.readFileSync(new URL('../personal-workstation.css',import.meta.url),'utf8');
  assert.match(css,/@media \(max-width: 720px\)[\s\S]*?\.ws-rail \{[\s\S]*?position: fixed;[\s\S]*?env\(safe-area-inset-bottom\)/);
  assert.match(css,/grid-template-columns: repeat\(5, minmax\(0, 1fr\)\)/);
});

test('mobile clinical navigation is width-constrained and horizontally scrollable inside its own row',()=>{
  const css=fs.readFileSync(new URL('../styles.css',import.meta.url),'utf8');
  assert.match(css,/\.official-nav-inner\{[\s\S]*?width:100%;/);
  assert.match(css,/\.official-links\{[\s\S]*?max-width:100%;[\s\S]*?overflow-x:auto;/);
  assert.match(css,/\.official-links::\-webkit-scrollbar\{display:none\}/);
});
