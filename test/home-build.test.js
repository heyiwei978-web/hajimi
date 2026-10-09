import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {buildHome} from '../scripts/build-home.mjs';

test('homepage build keeps public entries while loading no clinical script chain', () => {
  const html=buildHome(fs.readFileSync(new URL('../index.html',import.meta.url),'utf8'));
  for(const path of ['/bl','/tools','/pathway','/admin']) assert(html.includes('href="'+path+'"'));
  assert(!html.includes('id="libraryShell"'));
  assert(!html.includes('id="patientForm"'));
  const scripts=[...html.matchAll(/<script[^>]*src="([^"]+)"/g)].map(m=>m[1]);
  assert.deepEqual(scripts,['/workspace.js?v=20261009-quality1','/home.js?v=20261009-quality1']);
  assert(html.includes('id="homeContent"'));
  assert(!/<div id="portalHome"[^>]*\bhidden/.test(html));
  assert(html.includes('骨科临床路径中心'));
});
test('homepage generation is repeatable and fails on missing source sections', () => {
  const source=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
  assert.equal(buildHome(source),fs.readFileSync(new URL('../home.html',import.meta.url),'utf8'));
  assert.throws(()=>buildHome('<html></html>'),/Homepage sections missing/);
});
