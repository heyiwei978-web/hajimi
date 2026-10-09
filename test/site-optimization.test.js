import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

test('main application external scripts are deferred but keep source order',()=>{
  const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const tags=[...html.matchAll(/<script\s+([^>]*?)src="([^"]+)"([^>]*)><\/script>/g)];
  assert(tags.length>=30,'expected the clinical script chain');
  for(const tag of tags){
    const attrs=(tag[1]+' '+tag[3]);
    assert.match(attrs,/\bdefer\b/,tag[2]+' should be deferred');
    assert.doesNotMatch(attrs,/\basync\b/,tag[2]+' must preserve ordered execution');
  }
  const srcs=tags.map(x=>x[2]);
  assert(srcs.findIndex(x=>x.startsWith('/app.js?'))<srcs.findIndex(x=>x.startsWith('/ideal-cases.js')));
  assert(srcs.findIndex(x=>x.startsWith('/record-quality-v23.js'))<srcs.findIndex(x=>x.startsWith('/departments.js')));
});

test('long medical-record and pathway pages use safe offscreen rendering optimization',()=>{
  const css=fs.readFileSync(new URL('../ui-polish.css',import.meta.url),'utf8');
  assert.match(css,/rendering and navigation performance pass/);
  assert.match(css,/\.record-book-section[^\{]*,[\s\S]*?\.pathway-section[^\{]*,[\s\S]*?\.ortho-category\{[\s\S]*?scroll-margin-top:84px/);
  assert.match(css,/@supports \(content-visibility:auto\)/);
  assert.match(css,/content-visibility:auto/);
  assert.match(css,/contain-intrinsic-size:auto 620px/);
  assert.match(css,/@media print\{[\s\S]*?content-visibility:visible!important;[\s\S]*?contain:none!important/);
});

test('mobile drawer exposes synchronized accessibility state',()=>{
  const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const js=fs.readFileSync(new URL('../departments.js',import.meta.url),'utf8');
  assert.match(html,/id="menuBtn"[^>]*aria-controls="sidebar"[^>]*aria-expanded="false"/);
  assert.match(html,/id="drawerMask"[^>]*aria-hidden="true"/);
  assert.match(js,/mask\.setAttribute\('aria-hidden',open\?'false':'true'\)/);
  assert.match(js,/e\.key==='Escape'/);
});
