import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {pathToFileURL} from 'node:url';
import test from 'node:test';
import {MODULES, NAV_SURFACES} from '../config/site-modules.mjs';
import {PUBLIC_PAGES, PUBLIC_STYLES, PUBLIC_SCRIPTS, DIRECTORY_SCRIPTS} from '../scripts/public-assets.mjs';
import {copyPdfjsAssets, writePinyinRuntime} from '../scripts/pdfjs-build.mjs';

const root = new URL('../', import.meta.url);
const read = file => fs.readFileSync(new URL(file, root), 'utf8');

test('personal materials library route, assets, budget and notices are registered without weakening CSP', () => {
  const mod = MODULES.find(entry => entry.id === 'materials-library');
  assert.ok(mod, 'materials-library module exists in registry');
  assert.equal(mod.href, '/materials/library');
  assert.equal(mod.hub, 'materials');
  assert.ok(NAV_SURFACES.some(surface => surface.file === 'materials-library.html' && surface.active === 'materials-library'));

  const vercel = JSON.parse(read('vercel.json'));
  assert.ok(vercel.rewrites.some(r => r.source === '/materials/library' && r.destination === '/materials-library.html'));
  assert.ok(vercel.rewrites.some(r => r.source === '/materials/library/' && r.destination === '/materials-library.html'));
  const csp = vercel.headers.find(rule => rule.source === '/(.*)').headers.find(h => h.key === 'Content-Security-Policy').value;
  assert.match(csp, /connect-src 'self'/);
  assert.match(csp, /frame-src 'none'/);
  assert.match(csp, /object-src 'none'/);

  assert.ok(PUBLIC_PAGES.includes('materials-library.html'));
  assert.ok(PUBLIC_STYLES.includes('materials-library.css'));
  for (const script of ['materials-hub.js', 'materials-pdf.js', 'materials-library.js']) {
    assert.ok(PUBLIC_SCRIPTS.includes(script), script + ' in PUBLIC_SCRIPTS');
    assert.ok(DIRECTORY_SCRIPTS.has(script), script + ' in DIRECTORY_SCRIPTS');
  }

  const budget = JSON.parse(read('config/css-budget.json')).files;
  assert.deepEqual(budget['materials-library.css'], {important: 0, colorLiterals: 0});
  assert.match(read('THIRD_PARTY_NOTICES.md'), /PDF\.js.*Apache License 2\.0/);
});

test('personal materials scripts stay free of innerHTML and inline event handlers', () => {
  const html = read('materials-library.html');
  assert.doesNotMatch(html, /<script>(?!<\/script>)|\son[a-z]+=/i);
  assert.doesNotMatch(html, /<style[\s>]|\sstyle\s*=/i);
  for (const file of ['js/materials-hub.js', 'js/materials-pdf.js', 'js/materials-library.js']) {
    const src = read(file);
    assert.doesNotMatch(src, /\.(?:inner|outer)HTML\s*=|\binsertAdjacentHTML\s*\(/, file + ' uses DOM APIs instead of innerHTML');
  }
});

test('pinyin runtime build helper generates a working browser initials lookup', t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hajimi-pinyin-'));
  t.after(() => fs.rmSync(dir, {recursive: true, force: true}));
  const url = pathToFileURL(dir + path.sep);
  writePinyinRuntime(url);
  const code = fs.readFileSync(path.join(dir, 'pinyin-initials.js'), 'utf8');
  const ctx = {window: {}};
  vm.runInNewContext(code, ctx, {filename: 'pinyin-initials.js'});
  assert.ok(ctx.window.HAJIMI_PINYIN_INITIALS.initialsOf('股骨颈骨折').includes('ggjgz'));
  assert.match(ctx.window.HAJIMI_PINYIN_INITIALS.textInitials('髋关节置换抗凝要点'), /kgjzhkgyd|ggjzhkgyd|hgjzhkgyd/);
});

test('pdfjs-dist build helper copies runtime, worker, cmaps and standard fonts when installed', t => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hajimi-pdfjs-'));
  t.after(() => fs.rmSync(dir, {recursive: true, force: true}));
  const pkgInstalled = fs.existsSync(new URL('../node_modules/pdfjs-dist/build/pdf.min.mjs', import.meta.url));
  const result = copyPdfjsAssets(pathToFileURL(dir + path.sep));
  assert.equal(result.copied, pkgInstalled);
  if (pkgInstalled) {
    assert.ok(fs.existsSync(path.join(dir, 'assets', 'pdfjs', 'pdf.min.mjs')));
    assert.ok(fs.existsSync(path.join(dir, 'assets', 'pdfjs', 'pdf.worker.min.mjs')));
    assert.ok(fs.existsSync(path.join(dir, 'assets', 'pdfjs', 'cmaps', 'Adobe-GB1-UCS2.bcmap')));
    assert.ok(result.files > 10);
  }
});
