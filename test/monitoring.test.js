import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createMonitor, normalizeReport, withMonitoring, LIMITS} from '../api/_monitoring.js';
import {createClientErrorHandler, REPORT_BODY_LIMIT} from '../api/client-error.js';
import {injectReporter, REPORTER_TAG} from '../scripts/error-reporter.mjs';
import {PUBLIC_SCRIPTS} from '../scripts/public-assets.mjs';

function memoryStorage() {
  const files = new Map();
  return {
    files,
    async get(name) { return files.has(name) ? {statusCode: 200, stream: files.get(name)} : null; },
    async put(name, body) { files.set(name, body); return {pathname: name}; }
  };
}
function response() {
  const res = {statusCode: 200, headers: {}, body: undefined, headersSent: false};
  res.setHeader = (k, v) => { res.headers[k.toLowerCase()] = v; };
  res.status = code => { res.statusCode = code; return res; };
  res.json = body => { res.body = body; res.headersSent = true; return res; };
  res.end = () => { res.headersSent = true; return res; };
  return res;
}
const report = (extra = {}) => ({kind: 'error', message: 'TypeError: x is undefined', file: '/app.js', line: 3, column: 9, page: '/bl/guke', ...extra});
const post = (body, headers = {}) => ({
  method: 'POST', url: '/api/client-error', body,
  headers: {host: 'wdyxzl.icu', origin: 'https://wdyxzl.icu', 'x-forwarded-proto': 'https', 'sec-fetch-site': 'same-origin',
    'content-type': 'application/json', 'x-hajimi-report': '1', 'x-forwarded-for': '203.0.113.9', ...headers}
});

test('上报内容逐项清理：去掉查询参数和片段、替换长数字、拒绝未知类型和伪造的 server 类型', () => {
  const clean = normalizeReport(report({message: '病历号 123456789 解析失败\n第二行', page: '/search?q=张三#top', file: 'https://evil.example/x.js'}));
  assert.equal(clean.message, '病历号 # 解析失败 第二行');
  assert.equal(clean.page, '/search');
  assert.equal(clean.file, '');
  assert.equal(normalizeReport(report({kind: 'server'})), null);
  assert.equal(normalizeReport(report({kind: 'debug'})), null);
  assert.equal(normalizeReport(report({message: ''})), null);
  assert.equal(normalizeReport([]), null);
  assert.equal(normalizeReport(report({message: 'x'.repeat(5000)})).message.length, LIMITS.message);
});

test('相同报错合并计数，只保留最近 100 种', async () => {
  let clock = Date.parse('2026-11-18T00:00:00Z');
  const monitor = createMonitor({storage: memoryStorage(), now: () => new Date(clock += 1000)});
  const req = {headers: {'user-agent': 'Test', 'x-vercel-ip-country': 'CN'}};
  await monitor.record(normalizeReport(report()), req);
  await monitor.record(normalizeReport(report()), req);
  let {entries} = await monitor.read();
  assert.equal(entries.length, 1);
  assert.equal(entries[0].count, 2);
  assert.equal(entries[0].country, 'CN');
  for (let i = 0; i < 120; i++) await monitor.record(normalizeReport(report({line: i + 10})), req);
  ({entries} = await monitor.read());
  assert.equal(entries.length, LIMITS.entries);
  assert.equal(entries[0].line, 129, 'newest first');
  await monitor.clear();
  assert.deepEqual((await monitor.read()).entries, []);
});

test('同一网络地址在窗口内最多上报 20 次', async () => {
  const monitor = createMonitor({storage: memoryStorage()});
  const req = {headers: {'x-forwarded-for': '198.51.100.1'}};
  const results = [];
  for (let i = 0; i < LIMITS.reportsPerWindow + 3; i++) results.push(await monitor.allowReport(req));
  assert.equal(results.filter(Boolean).length, LIMITS.reportsPerWindow);
  assert.equal(await monitor.allowReport({headers: {'x-forwarded-for': '198.51.100.2'}}), true, 'other addresses are unaffected');
});

test('公开上报接口：只接受同源、带标识、2 KB 以内的合法 JSON；其余一律不写入', async () => {
  const storage = memoryStorage(), monitor = createMonitor({storage}), handler = createClientErrorHandler(monitor);
  const run = async req => { const res = response(); await handler(req, res); return res; };
  assert.equal((await run(post(report(), {origin: 'https://evil.example', 'sec-fetch-site': 'cross-site'}))).statusCode, 403);
  assert.equal((await run(post(report(), {'x-hajimi-report': undefined}))).statusCode, 403);
  assert.equal((await run(post(report({message: 'x'.repeat(REPORT_BODY_LIMIT)})))).statusCode, 204);
  assert.equal((await run(post(report({kind: 'server'})))).statusCode, 204);
  assert.equal((await run(post('{broken', {}))).statusCode, 204);
  assert.equal((await run(post(report(), {'content-type': 'text/plain'}))).statusCode, 204);
  assert.deepEqual((await monitor.read()).entries, [], 'nothing invalid was stored');
  const ok = await run(post(report()));
  assert.equal(ok.statusCode, 204);
  assert.equal(ok.body, undefined, 'no echo');
  assert.equal((await monitor.read()).entries.length, 1);
});

test('查看和清空错误记录需要管理员登录', async () => {
  const handler = createClientErrorHandler(createMonitor({storage: memoryStorage()}));
  for (const method of ['GET', 'DELETE']) {
    const res = response();
    await handler({method, url: '/api/client-error', headers: {host: 'wdyxzl.icu', 'x-hajimi-admin': '1'}}, res);
    assert.equal(res.statusCode, 401, method);
  }
  const res = response();
  await handler({method: 'PUT', url: '/api/client-error', headers: {}}, res);
  assert.equal(res.statusCode, 405);
});

test('接口包装：5xx 和抛出的异常会被记录，正常响应不受影响', async () => {
  const monitor = createMonitor({storage: memoryStorage()});
  const ok = withMonitoring('demo', async (req, res) => res.status(200).json({ok: true}), monitor);
  const unavailable = withMonitoring('demo', async (req, res) => res.status(503).json({error: 'x'}), monitor);
  const broken = withMonitoring('demo', async () => { throw new RangeError('bad 1234567 input'); }, monitor);
  const req = {url: '/api/demo?secret=1', headers: {}};
  let res = response(); await ok(req, res); assert.equal(res.statusCode, 200);
  assert.deepEqual((await monitor.read()).entries, []);
  res = response(); await unavailable(req, res); assert.equal(res.statusCode, 503);
  res = response(); await broken(req, res); assert.equal(res.statusCode, 500);
  const {entries} = await monitor.read();
  assert.deepEqual(entries.map(e => e.message).sort(), ['HTTP 503', 'RangeError: bad # input']);
  assert.ok(entries.every(e => e.kind === 'server' && e.file === '/api/demo' && e.page === '/api/demo'));
});

test('构建时把上报脚本注入每个页面 head 最前面，且只注入一次', () => {
  const html = '<!doctype html>\n<html lang="zh-CN">\n<head>\n<meta charset="utf-8">\n<title>x</title>\n</head></html>';
  const once = injectReporter(html);
  assert.ok(once.includes('<meta charset="utf-8">\n' + REPORTER_TAG + '\n<title>'));
  assert.equal(injectReporter(once), once);
  assert.throws(() => injectReporter('<html><head></head></html>'));
  assert.ok(PUBLIC_SCRIPTS.includes('error-report.js'));
});

test('前端上报脚本不读取页面内容、输入、存储或 Cookie', () => {
  const source = fs.readFileSync(new URL('../error-report.js', import.meta.url), 'utf8').replace(/^\s*\/\/.*$/gm, '');
  for (const forbidden of ['innerText', 'innerHTML', 'textContent', '.value', 'document.cookie', 'localStorage', 'sessionStorage', 'location.search', 'location.hash']) {
    assert.ok(!source.includes(forbidden), forbidden);
  }
  assert.match(source, /MAX_PER_PAGE = 5/);
  assert.match(source, /'\/api\/client-error'/);
});
