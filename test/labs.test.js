import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {PUBLIC_FILES} from '../scripts/public-assets.mjs';
import {MODULES, NAV_SURFACES} from '../config/site-modules.mjs';

const read = file => fs.readFileSync(new URL('../' + file, import.meta.url), 'utf8');
function load() {
  const context = {window: {}};
  vm.runInNewContext(read('labs-data.js'), context);
  return context.window.HAJIMI_LABS;
}

test('lab interpretation data is complete, unique and cross-linked', () => {
  const data = load();
  assert.equal(data.reviewStatus, '待审核', 'stays marked as a draft until the owner reviews it');
  const items = data.categories.flatMap(category => category.items);
  assert.ok(items.length >= 50);
  const ids = new Set(items.map(item => item.id));
  assert.equal(ids.size, items.length, 'item ids are unique');
  for (const item of items) {
    for (const key of ['name', 'abbr', 'unit']) assert.ok(typeof item[key] === 'string' && item[key].trim(), item.id + ' ' + key);
    for (const key of ['ranges', 'high', 'low', 'points']) assert.ok(Array.isArray(item[key]) && item[key].length, item.id + ' ' + key);
    assert.ok(item.ranges.every(row => row.length === 2 && row.every(cell => typeof cell === 'string' && cell)), item.id + ' ranges');
    for (const id of item.related || []) assert.ok(ids.has(id), item.id + ' links to missing ' + id);
    if (item.source !== undefined) assert.ok(typeof item.source === 'string' && item.source.trim(), item.id + ' source');
  }
});

test('lab tool links point at existing calculators and ECG links at existing entries', () => {
  const data = load(), tools = read('tools-page.js'), ecg = read('ecg-data.js');
  for (const item of data.categories.flatMap(category => category.items)) {
    for (const [key] of item.tools || []) assert.match(tools, new RegExp('\\n' + key + ":\\['"), item.id + ' tool ' + key);
    for (const [path] of item.ecg || []) {
      const [category, id] = path.split('/');
      assert.match(ecg, new RegExp("id:'" + id + "',title:'[^']*',category:'" + category + "'"), item.id + ' ecg ' + path);
    }
  }
});

test('lab page is registered in the navigation, routes and public files', () => {
  const module = MODULES.find(entry => entry.id === 'labs');
  assert.equal(module.href, '/labs');
  assert.ok(NAV_SURFACES.some(surface => surface.file === 'labs.html' && surface.active === 'labs'));
  const vercel = JSON.parse(read('vercel.json'));
  for (const source of ['/labs', '/labs/']) assert.ok(vercel.rewrites.some(rule => rule.source === source && rule.destination === '/labs.html'));
  for (const file of ['labs.html', 'labs.css', 'labs.js', 'labs-data.js']) assert.ok(PUBLIC_FILES.includes(file), file);
  assert.doesNotMatch(read('labs.html'), /<script>(?!<\/script>)|\son[a-z]+=/i);
  assert.doesNotMatch(read('labs.js'), /innerHTML|insertAdjacentHTML|eval\(|new Function/);
  assert.match(read('labs.js'), /item\.source[\s\S]*labs-source/, 'per-item source line is rendered when present');
});
