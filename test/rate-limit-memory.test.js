import test from 'node:test';
import assert from 'node:assert/strict';
import {createMemoryLimiter} from '../api/_memory-limit.js';
import {consumeNoteQuota, NOTE_RATE_LIMIT} from '../api/_note-limit.js';
import {checkLoginThrottle, recordLoginFailure, clearLoginFailures} from '../api/_rate-limit.js';
import {createMonitor, normalizeReport, LIMITS} from '../api/_monitoring.js';

const req = ip => ({headers: {'x-forwarded-for': ip}});
const report = (extra = {}) => normalizeReport({kind: 'error', message: 'TypeError: x is undefined', file: '/app.js', line: 3, column: 9, page: '/bl/guke', ...extra});

// Blob 的「读 → 加一 → 写」在并发时读到同一个旧值：这个存储永远返回旧计数、丢弃写入，模拟最坏的漏计。
function staleStorage(state = null) {
  const calls = {get: 0, put: 0};
  return {calls, async get() { calls.get++; await new Promise(resolve => setImmediate(resolve)); return state ? {statusCode: 200, stream: JSON.stringify(state)} : null; },
    async put() { calls.put++; return {}; }};
}
const brokenStorage = {async get() { throw new Error('down'); }, async put() { throw new Error('down'); }};

function withoutBlobToken(t) {
  const previous = process.env.BLOB_READ_WRITE_TOKEN;
  delete process.env.BLOB_READ_WRITE_TOKEN;
  t.after(() => { if (previous !== undefined) process.env.BLOB_READ_WRITE_TOKEN = previous; });
}

test('内存计数：窗口内累加，过期清零，键数量有上限', () => {
  let clock = 0;
  const limiter = createMemoryLimiter({windowMs: 1000, maxKeys: 3, now: () => clock});
  assert.equal(limiter.add('a').count, 1);
  assert.equal(limiter.add('a').count, 2);
  assert.equal(limiter.count('a'), 2);
  clock = 400; assert.equal(limiter.remaining('a'), 600);
  clock = 1000; assert.equal(limiter.count('a'), 0, 'window over');
  assert.equal(limiter.add('a').count, 1, 'new window starts at 1');
  for (const key of ['b', 'c', 'd', 'e']) limiter.add(key);
  assert.ok(limiter.size <= 3, 'oldest keys are evicted');
  limiter.reset('e'); assert.equal(limiter.count('e'), 0);
});

test('AI 生成额度：并发请求在同一实例内不会因 Blob 漏计而超额', async () => {
  const storage = staleStorage();
  const results = await Promise.all(Array.from({length: NOTE_RATE_LIMIT.MAX_REQUESTS + 5}, () => consumeNoteQuota(req('198.51.100.10'), {storage})));
  assert.equal(results.filter(r => r.allowed).length, NOTE_RATE_LIMIT.MAX_REQUESTS);
  const denied = results.find(r => !r.allowed);
  assert.ok(denied.retryAfter > 0 && denied.retryAfter <= NOTE_RATE_LIMIT.WINDOW_MS / 1000);
  assert.equal((await consumeNoteQuota(req('198.51.100.11'), {storage})).allowed, true, 'other addresses are unaffected');
});

test('AI 生成额度：Blob 故障时按策略放行，但同一实例内仍有上限；窗口过后恢复', async () => {
  const now = Date.UTC(2026, 10, 20);
  const results = [];
  for (let i = 0; i < NOTE_RATE_LIMIT.MAX_REQUESTS + 2; i++) results.push(await consumeNoteQuota(req('198.51.100.12'), {storage: brokenStorage, now}));
  assert.equal(results.filter(r => r.allowed).length, NOTE_RATE_LIMIT.MAX_REQUESTS);
  assert.equal((await consumeNoteQuota(req('198.51.100.12'), {storage: brokenStorage, now: now + NOTE_RATE_LIMIT.WINDOW_MS})).allowed, true);
});

test('AI 生成额度：Blob 记录已达上限时拒绝（跨实例的计数仍然有效）', async () => {
  const now = Date.UTC(2026, 10, 20, 1);
  const storage = staleStorage({windowStart: now - 1000, count: NOTE_RATE_LIMIT.MAX_REQUESTS});
  const result = await consumeNoteQuota(req('198.51.100.13'), {storage, now});
  assert.equal(result.allowed, false);
  assert.equal(storage.calls.put, 0);
});

test('登录：存储不可用（放行策略）时，同一实例内连续失败 10 次仍会被封锁，登录成功后清零', async t => {
  withoutBlobToken(t);
  const client = req('198.51.100.20');
  assert.equal((await checkLoginThrottle(client)).allowed, true, 'storage down: allowed by policy');
  const outcomes = [];
  for (let i = 0; i < 10; i++) outcomes.push(await recordLoginFailure(client));
  assert.deepEqual(outcomes.map(o => o.blocked), [...Array(9).fill(false), true]);
  const blocked = await checkLoginThrottle(client);
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfter > 0 && blocked.retryAfter <= 15 * 60);
  assert.equal((await checkLoginThrottle(req('198.51.100.21'))).allowed, true, 'other addresses are unaffected');
  await clearLoginFailures(client);
  assert.equal((await checkLoginThrottle(client)).allowed, true);
});

test('登录：并发失败在同一实例内全部计数', async t => {
  withoutBlobToken(t);
  const client = req('198.51.100.22');
  const outcomes = await Promise.all(Array.from({length: 12}, () => recordLoginFailure(client)));
  assert.ok(outcomes.filter(o => o.blocked).length >= 3, 'the 10th, 11th and 12th concurrent failures block');
  assert.equal((await checkLoginThrottle(client)).allowed, false);
  await clearLoginFailures(client);
});

function countingStorage() {
  const files = new Map(), calls = {get: 0, put: 0};
  return {files, calls,
    async get(name) { calls.get++; return files.has(name) ? {statusCode: 200, stream: files.get(name)} : null; },
    async put(name, body) { calls.put++; files.set(name, body); return {pathname: name}; }};
}

test('错误上报：同种报错 10 分钟内只写一次存储，期间的次数在下次写入时并入', async () => {
  let clock = Date.parse('2026-11-20T00:00:00Z');
  const storage = countingStorage(), monitor = createMonitor({storage, now: () => new Date(clock)});
  assert.equal(await monitor.accept(report(), req('203.0.113.1')), true);
  const afterFirst = {...storage.calls};
  for (let i = 0; i < 50; i++) await monitor.accept(report(), req('203.0.113.' + (i + 2)));
  assert.deepEqual(storage.calls, afterFirst, 'repeats from rotating addresses cost no storage operations');
  clock += LIMITS.dedupeMs;
  assert.equal(await monitor.accept(report(), req('203.0.113.200')), true);
  const [entry] = (await monitor.read()).entries;
  assert.equal(entry.count, 52, 'first + 50 held in memory + this one');
  assert.equal(await monitor.accept(report({line: 99}), req('203.0.113.201')), true, 'a different error is written at once');
});

test('错误上报：同一网络地址在本实例超限后不再访问存储', async () => {
  const storage = countingStorage(), monitor = createMonitor({storage});
  for (let i = 0; i < LIMITS.reportsPerWindow; i++) await monitor.accept(report({line: i + 10}), req('203.0.113.50'));
  const before = {...storage.calls};
  assert.equal(await monitor.accept(report({line: 999}), req('203.0.113.50')), false);
  assert.deepEqual(storage.calls, before);
});

test('错误上报：全站每天最多写入 dailyReports 条，次日恢复；服务端 5xx 记录不受此上限影响', async () => {
  let clock = Date.parse('2026-11-20T08:00:00Z');
  const storage = countingStorage(), monitor = createMonitor({storage, now: () => new Date(clock)});
  storage.files.set('monitoring/errors.json', JSON.stringify({version: 1, entries: [], day: '2026-11-20', dayWrites: LIMITS.dailyReports}));
  assert.equal(await monitor.accept(report(), req('203.0.113.60')), false);
  assert.deepEqual((await monitor.read()).entries, []);
  assert.equal(await monitor.record({kind: 'server', message: 'HTTP 503', file: '/api/demo', line: 0, column: 0, page: '/api/demo'}, {headers: {}}), true);
  clock = Date.parse('2026-11-21T00:00:01Z');
  assert.equal(await monitor.accept(report({line: 7}), req('203.0.113.61')), true);
  const document = JSON.parse(storage.files.get('monitoring/errors.json'));
  assert.equal(document.day, '2026-11-21'); assert.equal(document.dayWrites, 1);
});
