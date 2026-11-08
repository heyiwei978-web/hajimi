import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {randomBytes} from 'node:crypto';
import {BlobPreconditionFailedError} from '@vercel/blob';
import {PUBLIC_FILES} from '../scripts/public-assets.mjs';
import {MODULES, NAV_SURFACES} from '../config/site-modules.mjs';
import {createSession} from '../api/_auth.js';
import SEED from '../api/_duty-orders-seed.js';
import {createDutyOrdersStore, validateSheets} from '../api/_duty-orders-store.js';
import {createDutyOrdersHandler} from '../api/duty-orders.js';

const read = file => fs.readFileSync(new URL('../' + file, import.meta.url), 'utf8');
const CURRENT = 'duty-orders/current.json', HISTORY = 'duty-orders/history/';
function res() {
  return {code: 200, headers: {}, setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
    status(n) { this.code = n; return this; }, json(b) { this.body = b; return this; }};
}
function req(cookie = '', extra = {}) {
  return {method: 'GET', query: {}, ...extra, headers: {host: 'local.test', 'x-forwarded-proto': 'https',
    'content-type': 'application/json', 'x-hajimi-admin': '1', cookie, ...extra.headers}};
}
function auth(t) {
  const keys = ['HAJIMI_SESSION_SECRET', 'HAJIMI_ADMIN_USER'], prior = keys.map(k => process.env[k]);
  process.env.HAJIMI_SESSION_SECRET = randomBytes(32).toString('hex');
  process.env.HAJIMI_ADMIN_USER = 'fixture-owner';
  t.after(() => keys.forEach((k, i) => prior[i] === undefined ? delete process.env[k] : process.env[k] = prior[i]));
  return 'hajimi_session=' + createSession('fixture-owner');
}
const SAMPLE = [{title: '示例分页', columns: ['内容', '用法'], rows: [['合成测试条目', '口服'], ['第二条', '']]}];
function fixture(seed = SAMPLE) {
  const objects = new Map(), calls = [];
  let serial = 0;
  const backend = {objects, calls,
    async get(path, options) {
      calls.push(['get', path, options]);
      const value = objects.get(path);
      return value ? {statusCode: 200, blob: {etag: value.etag}, stream: new Response(value.body).body} : null;
    },
    async put(path, body, options) {
      calls.push(['put', path, options]);
      assert.equal(options.access, 'private');
      const prior = objects.get(path);
      if (prior && (!options.allowOverwrite || options.ifMatch && options.ifMatch !== prior.etag)) throw new BlobPreconditionFailedError();
      const etag = '"' + (++serial) + '"';
      objects.set(path, {body, etag});
      return {etag, pathname: path};
    }};
  const store = createDutyOrdersStore(backend, {seed});
  return {backend, store, handler: createDutyOrdersHandler(store)};
}
async function call(f, cookie, extra) { const out = res(); await f.handler(req(cookie, extra), out); return out; }

test('seed keeps the sheets, corrected typos and no phone numbers, billing items, insurance column or images', () => {
  assert.equal(SEED.length, 12);
  assert.doesNotThrow(() => validateSheets(SEED));
  const text = JSON.stringify(SEED);
  for (const removed of ['电话', '6293', '医保/自费', 'DISPIMG', '加收', '收费', '急诊药房']) assert.ok(!text.includes(removed), 'removed: ' + removed);
  for (const typo of ['硅诺酮', '药名名', '过敏新休克', '劲动脉', '肝精胰岛素', '注射器500ml', '烦燥', '乌斯他丁', '300ng', '%5GS', '/jg/']) {
    assert.ok(!text.includes(typo), 'typo fixed: ' + typo);
  }
  assert.ok(SEED.some(sheet => sheet.title === '过敏性休克'));
  assert.ok(SEED.find(sheet => sheet.title === '抢救药品泵法').rows.some(row => row.includes('去甲肾上腺素（2mg:1mL）')));
});

test('order data is no longer a public file; the page is routed and uses the shared navigation', () => {
  assert.ok(!fs.existsSync(new URL('../duty-orders-data.js', import.meta.url)));
  assert.ok(!PUBLIC_FILES.some(file => file.includes('duty-orders-data') || file.includes('seed')));
  for (const file of ['duty-orders.html', 'duty-orders.css', 'duty-orders.js']) assert.ok(PUBLIC_FILES.includes(file), file + ' is published');
  const vercel = JSON.parse(read('vercel.json'));
  for (const source of ['/duty/orders', '/duty/orders/']) {
    assert.ok(vercel.rewrites.some(rule => rule.source === source && rule.destination === '/duty-orders.html'));
    assert.ok(MODULES.find(module => module.id === 'duty').routes.includes(source));
  }
  assert.ok(NAV_SURFACES.some(surface => surface.file === 'duty-orders.html' && surface.active === 'duty'));
  const html = read('duty-orders.html');
  assert.doesNotMatch(html, /duty-orders-data|<script>(?!<\/script>)|\son[a-z]+=/i);
  assert.doesNotMatch(read('duty-orders.js'), /innerHTML|insertAdjacentHTML|eval\(|new Function/);
});

test('reading and writing orders require an admin session, same origin and the admin marker, before storage', async t => {
  const cookie = auth(t), f = fixture();
  for (const token of ['', cookie + 'x', 'hajimi_session=' + createSession('another-user')]) {
    for (const method of ['GET', 'PUT', 'POST']) {
      const out = await call(f, token, {method, body: {sheets: SAMPLE, revision: 'seed'}});
      assert.equal(out.code, 401, method);
      assert.match(out.headers['cache-control'], /no-store/);
    }
  }
  const samples = [
    [{headers: {origin: 'https://evil.example'}}, 403],
    [{headers: {'x-hajimi-admin': undefined}}, 403],
    [{headers: {'content-type': 'text/plain'}}, 415],
    [{body: '{'}, 400],
    [{headers: {'content-length': '1504097'}}, 413]
  ];
  for (const [extra, status] of samples) assert.equal((await call(f, cookie, {method: 'PUT', body: {sheets: SAMPLE, revision: 'seed'}, ...extra})).code, status);
  assert.equal((await call(f, cookie, {method: 'DELETE'})).code, 405);
  assert.equal(f.backend.calls.length, 0);
});

test('admins read the seed, save with backups, are protected from stale overwrites and can restore', async t => {
  const cookie = auth(t), f = fixture();
  const first = await call(f, cookie);
  assert.equal(first.code, 200);
  assert.equal(first.body.revision, 'seed');
  assert.deepEqual(first.body.sheets, SAMPLE);
  assert.match(first.headers['cache-control'], /private, no-store/);

  const edited = structuredClone(SAMPLE);
  edited[0].rows[0][0] = '合成测试条目（已更正）';
  edited[0].rows.push(['新增条目', '静脉注射']);
  const saved = await call(f, cookie, {method: 'PUT', body: {sheets: edited, revision: 'seed'}});
  assert.equal(saved.code, 200);
  assert.deepEqual(saved.body.sheets, edited);
  assert.equal(saved.body.history.length, 1);
  assert.equal(saved.body.history[0].user, 'fixture-owner');
  const backupPath = HISTORY + saved.body.history[0].id + '.json';
  assert.deepEqual(JSON.parse(f.backend.objects.get(backupPath).body).sheets, SAMPLE, 'backup holds the previous data');

  const stale = await call(f, cookie, {method: 'PUT', body: {sheets: SAMPLE, revision: 'seed'}});
  assert.equal(stale.code, 409);
  assert.equal((await call(f, cookie, {method: 'PUT', body: {sheets: SAMPLE}})).code, 428);

  const reread = await call(f, cookie);
  assert.deepEqual(reread.body.sheets, edited);
  const old = await call(f, cookie, {query: {history: saved.body.history[0].id}});
  assert.deepEqual(old.body.sheets, SAMPLE);
  assert.equal((await call(f, cookie, {query: {history: 'missing'}})).code, 404);

  const restored = await call(f, cookie, {method: 'POST', body: {action: 'restore', id: saved.body.history[0].id, revision: reread.body.revision}});
  assert.equal(restored.code, 200);
  assert.deepEqual(restored.body.sheets, SAMPLE);
  assert.equal(restored.body.history.length, 2);
  assert.equal(restored.body.history[0].action, 'restore');
  assert.equal((await call(f, cookie, {method: 'POST', body: {action: 'wipe'}})).code, 400);
  assert.ok(f.backend.calls.every(([, path]) => path === CURRENT || path.startsWith(HISTORY)), 'only private order paths');
});

test('malformed order data is rejected without writing', async t => {
  const cookie = auth(t), f = fixture();
  const bad = [
    [],
    [{title: '', columns: ['内容'], rows: []}],
    [{title: 'x', columns: [], rows: []}],
    [{title: 'x', columns: ['内容', '用法'], rows: [['只有一格']]}],
    [{title: 'x', columns: ['内容'], rows: [[1]]}],
    [{title: 'x', columns: ['内容'], rows: [['a'.repeat(10001)]]}],
    Array.from({length: 31}, () => ({title: 'x', columns: ['内容'], rows: []}))
  ];
  for (const sheets of bad) assert.equal((await call(f, cookie, {method: 'PUT', body: {sheets, revision: 'seed'}})).code, 400);
  assert.ok(f.backend.calls.every(([kind]) => kind === 'get'));
});
