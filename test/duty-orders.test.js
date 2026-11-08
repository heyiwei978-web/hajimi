import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {PUBLIC_FILES} from '../scripts/public-assets.mjs';
import {MODULES, NAV_SURFACES} from '../config/site-modules.mjs';

const read = file => fs.readFileSync(new URL('../' + file, import.meta.url), 'utf8');
function loadOrders() {
  const context = {window: {}};
  vm.runInNewContext(read('duty-orders-data.js'), context);
  return context.window.DUTY_ORDERS;
}

test('order reference data keeps the sheets but no phone numbers, billing items, insurance column or images', () => {
  const sheets = loadOrders();
  assert.equal(sheets.length, 12);
  assert.ok(sheets.every(sheet => sheet.rows.every(row => row.length === sheet.columns.length)));
  const text = JSON.stringify(sheets);
  for (const removed of ['电话', '6293', '医保/自费', 'DISPIMG', '加收', '收费', '急诊药房']) {
    assert.ok(!text.includes(removed), 'removed: ' + removed);
  }
  const pump = sheets.find(sheet => sheet.title === '抢救药品泵法');
  assert.ok(pump.rows.some(row => row.includes('去甲肾上腺素（2mg:1mL）')), 'original wording kept');
});

test('order reference page is routed, published and uses the shared navigation', () => {
  const vercel = JSON.parse(read('vercel.json'));
  for (const source of ['/duty/orders', '/duty/orders/']) {
    assert.ok(vercel.rewrites.some(rule => rule.source === source && rule.destination === '/duty-orders.html'));
    assert.ok(MODULES.find(module => module.id === 'duty').routes.includes(source));
  }
  for (const file of ['duty-orders.html', 'duty-orders.css', 'duty-orders.js', 'duty-orders-data.js']) {
    assert.ok(PUBLIC_FILES.includes(file), file + ' is published');
  }
  assert.ok(NAV_SURFACES.some(surface => surface.file === 'duty-orders.html' && surface.active === 'duty'));
  const html = read('duty-orders.html');
  assert.doesNotMatch(html, /<script>(?!<\/script>)|\son[a-z]+=/i, 'no inline scripts or handlers');
  assert.match(read('duty.html'), /href="\/duty\/orders"/);
});
