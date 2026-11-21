// 性能与样式用量基线（2026-11-21）。只在本地或 CI 运行，不发布，不访问生产。
// 用预装的 Chromium 打开 dist/ 中的页面（按 vercel.json 的 rewrites 路由，gzip 传输），
// 记录：首屏内容时间（FCP）、最大内容绘制（LCP）、累计布局偏移（CLS）、请求数、传输字节（脚本/样式/其他），
// 以及各页公共样式 styles.css、theme.css 的实际使用比例（Chromium CSS 覆盖率）。
// 用法：npm run build && node scripts/perf-baseline.mjs [--slow] [--json 输出文件]
//   --slow：模拟慢速 4G（150 ms 往返、1.6 Mbps）。浏览器路径同 e2e，可用 CHROMIUM_EXECUTABLE_PATH 指定。
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import zlib from 'node:zlib';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const dist = path.join(root, 'dist');
export const ROUTES = ['/', '/bl', '/bl/guke', '/bl/guke/TKA', '/classification', '/classification/guke/femoral-neck',
  '/ecg', '/ecg/atlas/arrhythmia/atrial-fibrillation', '/labs', '/pathway', '/tools', '/duty', '/search?q=骨折', '/note', '/admin'];
const TYPES = {'.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json'};

export function routeFile(config, pathname) {
  const direct = path.join(dist, pathname);
  if (pathname !== '/' && fs.existsSync(direct) && fs.statSync(direct).isFile()) return pathname;
  const rule = config.rewrites.find(item => new RegExp('^' + item.source.replace(/:path\*/, '.*') + '$').test(pathname));
  return rule ? rule.destination : null;
}

function serve(config) {
  const cache = new Map();
  const server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, 'http://local').pathname);
    if (pathname.startsWith('/api/')) {
      res.setHeader('Content-Type', 'application/json');
      return res.end(pathname === '/api/session' ? '{"authenticated":false,"user":null}' : pathname === '/api/content' ? '{"version":1,"revision":"x","templateOverrides":{},"cases":[]}' : '{}');
    }
    const file = routeFile(config, pathname);
    const full = file && path.join(dist, file);
    if (!full || !full.startsWith(dist) || !fs.existsSync(full)) { res.writeHead(404); return res.end(); }
    if (!cache.has(full)) cache.set(full, zlib.gzipSync(fs.readFileSync(full), {level: 9}));
    res.setHeader('Content-Type', TYPES[path.extname(full)] || 'application/octet-stream');
    res.setHeader('Content-Encoding', 'gzip');
    res.end(cache.get(full));
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve(server)));
}

async function measure(browser, base, route, {width, slow}) {
  const context = await browser.newContext({viewport: {width, height: 900}});
  const page = await context.newPage();
  const client = await context.newCDPSession(page);
  await client.send('Network.enable');
  if (slow) await client.send('Network.emulateNetworkConditions', {offline: false, latency: 150, downloadThroughput: 200000, uploadThroughput: 90000});
  const bytes = {script: 0, stylesheet: 0, other: 0};
  let requests = 0;
  const kinds = new Map();
  client.on('Network.requestWillBeSent', event => kinds.set(event.requestId, event.type));
  client.on('Network.loadingFinished', event => {
    requests++;
    const kind = (kinds.get(event.requestId) || '').toLowerCase();
    bytes[kind === 'script' ? 'script' : kind === 'stylesheet' ? 'stylesheet' : 'other'] += event.encodedDataLength;
  });
  await page.addInitScript(() => {
    window.__perf = {lcp: 0, cls: 0};
    new PerformanceObserver(list => { for (const entry of list.getEntries()) window.__perf.lcp = entry.startTime; }).observe({type: 'largest-contentful-paint', buffered: true});
    new PerformanceObserver(list => { for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__perf.cls += entry.value; }).observe({type: 'layout-shift', buffered: true});
  });
  await page.coverage.startCSSCoverage();
  await page.goto(base + route, {waitUntil: 'networkidle', timeout: 120000});
  await page.waitForTimeout(300);
  const coverage = await page.coverage.stopCSSCoverage();
  const metrics = await page.evaluate(() => ({fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0, ...window.__perf}));
  const css = {};
  for (const entry of coverage) {
    const name = new URL(entry.url).pathname.slice(1);
    if (!/^(styles|theme)\.css$/.test(name)) continue;
    const used = entry.ranges.reduce((sum, range) => sum + range.end - range.start, 0);
    css[name] = Math.round(100 * used / entry.text.length);
  }
  await context.close();
  return {route, width, fcp: Math.round(metrics.fcp), lcp: Math.round(metrics.lcp), cls: Number(metrics.cls.toFixed(3)), requests,
    kb: Object.fromEntries(Object.entries(bytes).map(([key, value]) => [key, Math.round(value / 1024)])), cssUsedPercent: css};
}

export async function runBaseline({slow = false, routes = ROUTES, widths = [390, 1280]} = {}) {
  if (!fs.existsSync(path.join(dist, 'home.html'))) throw new Error('Run npm run build first');
  const config = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
  const {chromium} = await import('playwright');
  const server = await serve(config);
  const browser = await chromium.launch({headless: true, ...(process.env.CHROMIUM_EXECUTABLE_PATH ? {executablePath: process.env.CHROMIUM_EXECUTABLE_PATH} : {}), args: ['--no-sandbox']});
  try {
    const base = 'http://127.0.0.1:' + server.address().port, results = [];
    for (const width of widths) for (const route of routes) results.push(await measure(browser, base, route, {width, slow}));
    return results;
  } finally { await browser.close(); server.close(); }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2), slow = args.includes('--slow'), out = args[args.indexOf('--json') + 1];
  const results = await runBaseline({slow});
  console.log(`网络：${slow ? '慢速 4G（150 ms，1.6 Mbps）' : '本机（无限速）'}`);
  console.log(['宽度', '页面', 'FCP', 'LCP', 'CLS', '请求', '脚本KB', '样式KB', '其他KB', 'styles.css 使用率', 'theme.css 使用率'].join('\t'));
  for (const r of results) console.log([r.width, r.route, r.fcp, r.lcp, r.cls, r.requests, r.kb.script, r.kb.stylesheet, r.kb.other, r.cssUsedPercent['styles.css'] ?? '-', r.cssUsedPercent['theme.css'] ?? '-'].join('\t'));
  if (args.includes('--json') && out) fs.writeFileSync(out, JSON.stringify({createdAt: new Date().toISOString(), slow, results}, null, 1) + '\n');
}
