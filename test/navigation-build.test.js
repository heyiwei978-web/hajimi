import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';
import {NAV_SURFACES} from '../config/site-modules.mjs';
import {renderPageNavigation} from '../scripts/navigation-build.mjs';

const read = file => fs.readFileSync(new URL('../' + file, import.meta.url), 'utf8');

test('current navigation rendering preserves every byte of the existing pages', () => {
  for (const file of new Set(NAV_SURFACES.map(surface => surface.file))) {
    assert.equal(renderPageNavigation(read(file), file), read(file), file);
  }
  assert.equal(renderPageNavigation(read('password-hash.html'), 'password-hash.html'), read('password-hash.html'));
});

test('stale source links are replaced from the registry without losing patient or auth controls', () => {
  const source = read('index.html');
  const stale = source.replaceAll('href="/ecg">心电图</a>', 'href="/old-navigation">old navigation label</a>');
  assert.notEqual(stale, source);
  assert.equal(renderPageNavigation(stale, 'index.html'), source);
  assert.ok(source.includes('<button id="patientBtn"'));
  assert.ok(source.includes('<span data-auth-slot></span>'));
});

test('missing, duplicated or mixed navigation targets stop the build', () => {
  const page = read('classification.html');
  assert.throws(() => renderPageNavigation(page.replace('aria-label="主导航"', ''), 'classification.html'), /Expected one navigation/);
  const nav = /<nav\b[^>]*aria-label="主导航"[^>]*>[\s\S]*?<\/nav>/.exec(page)[0];
  assert.throws(() => renderPageNavigation(page.replace(nav, nav + nav), 'classification.html'), /Expected one navigation/);
  const missing = read('index.html').replace('id="libraryShell"', 'id="otherShell"');
  assert.throws(() => renderPageNavigation(missing, 'index.html'), /region missing or duplicated/);
  assert.throws(() => renderPageNavigation(page.replace('</a><a', '</a><button>interleaved</button><a'), 'classification.html'), /Unexpected content between/);
});

test('normal build consumes registry changes from a clean copy without exposing build inputs', async t => {
  const parent = fs.realpathSync(os.tmpdir());
  const temporary = fs.mkdtempSync(path.join(parent, 'hajimi-navigation-'));
  t.after(() => {
    const resolved = fs.realpathSync(temporary);
    assert.equal(path.dirname(resolved), parent, 'cleanup stays inside the temporary parent');
    fs.rmSync(resolved, {recursive: true, force: true});
  });
  const root = fileURLToPath(new URL('../', import.meta.url));
  function copyDirectory(source, destination) {
    fs.mkdirSync(destination);
    for (const entry of fs.readdirSync(source, {withFileTypes: true})) {
      const from = path.join(source, entry.name), to = path.join(destination, entry.name);
      if (entry.isDirectory()) copyDirectory(from, to);
      else if (entry.isFile()) fs.copyFileSync(from, to);
      else assert.fail('unexpected source entry: ' + from);
    }
  }
  for (const entry of fs.readdirSync(root, {withFileTypes: true})) {
    const source = path.join(root, entry.name), destination = path.join(temporary, entry.name);
    if (entry.isFile() && (/\.(?:html|css|js)$/.test(entry.name) || ['package.json', 'vercel.json'].includes(entry.name))) {
      fs.copyFileSync(source, destination);
    } else if (entry.isDirectory() && ['scripts', 'config', 'content'].includes(entry.name)) {
      copyDirectory(source, destination);
    }
  }
  const dist = path.join(temporary, 'dist');
  assert.ok(!fs.existsSync(dist), 'no previous build is copied');
  const build = () => promisify(execFile)(process.execPath, ['scripts/build-home.mjs'],
    {cwd: temporary, timeout: 60000, maxBuffer: 1024 * 1024});
  function publishedFiles(directory, prefix = '') {
    return fs.readdirSync(directory, {withFileTypes: true}).flatMap(entry => {
      const name = prefix + entry.name, target = path.join(directory, entry.name);
      return entry.isDirectory() ? publishedFiles(target, name + '/') : [[name, fs.readFileSync(target)]];
    });
  }
  await build();
  const before = new Map(publishedFiles(dist));
  for (const file of ['config/site-modules.mjs', 'scripts/navigation-build.mjs', 'site-modules.mjs']) {
    assert.ok(!before.has(file), file + ' stays private');
  }
  const registry = path.join(temporary, 'config/site-modules.mjs');
  const original = fs.readFileSync(registry, 'utf8'), marker = "label: '心电图'";
  assert.equal(original.split(marker).length, 2);
  const label = '心电图（构建验证）';
  fs.writeFileSync(registry, original.replace(marker, "label: '" + label + "'"));
  await build();
  const after = new Map(publishedFiles(dist));
  assert.deepEqual([...after.keys()].sort(), [...before.keys()].sort());
  const changed = [];
  let occurrences = 0;
  for (const [name, bytes] of after) {
    if (bytes.equals(before.get(name))) continue;
    changed.push(name);
    const html = bytes.toString('utf8');
    occurrences += html.split(label).length - 1;
    assert.deepEqual(Buffer.from(html.replaceAll(label, '心电图')), before.get(name), name + ' only changes the navigation label');
  }
  assert.deepEqual(changed.sort(), ['admin.html', 'classification.html', 'duty.html', 'ecg.html', 'home.html',
    'index.html', 'kb.html', 'library.html', 'pathway.html', 'tools.html'].sort());
  assert.equal(occurrences, 11, 'ten registered ECG links plus the lightweight homepage alias');
});
