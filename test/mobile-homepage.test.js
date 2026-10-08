import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

test('mobile homepage cannot be widened by the clinical illustration',()=>{
  const css=fs.readFileSync(new URL('../ui-polish.css',import.meta.url),'utf8');
  assert.match(css,/definitive mobile homepage overflow fix/);
  assert.match(css,/@media\(max-width:900px\)[\s\S]*?\.clinical-scene\{[\s\S]*?min-width:0!important;[\s\S]*?max-width:100%!important;/);
  assert.match(css,/@media\(max-width:640px\)[\s\S]*?\.official-hero\{[\s\S]*?grid-template-columns:minmax\(0,1fr\)!important;/);
  assert.match(css,/\.official-hero h1\{[\s\S]*?max-width:100%;[\s\S]*?overflow-wrap:anywhere;/);
  assert.match(css,/\.clinical-scene\{[\s\S]*?width:100%!important;[\s\S]*?min-width:0!important;[\s\S]*?transform:none;/);
});

test('mobile homepage navigation is width-constrained and horizontally scrollable inside its own row',()=>{
  const css=fs.readFileSync(new URL('../ui-polish.css',import.meta.url),'utf8');
  assert.match(css,/\.official-nav-inner\{[\s\S]*?width:100%;/);
  assert.match(css,/\.official-links\{[\s\S]*?max-width:100%;[\s\S]*?overflow-x:auto;/);
  assert.match(css,/\.official-links::\-webkit-scrollbar\{display:none\}/);
});
