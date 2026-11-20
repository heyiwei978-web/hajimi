import crypto from 'node:crypto';
import {createMemoryLimiter} from './_memory-limit.js';

// 错误记录（2026-11-18）。两类来源：
//   - 前端：error-report.js 把本站脚本的报错摘要发到 /api/login-log?feed=errors（公开写入，限制见该文件）。
//   - 服务端：withMonitoring() 包住各接口，接口返回 5xx 或抛出异常时记录一条。
// 相同的报错合并为一条并累计次数，只保留最近 MAX_ENTRIES 条，存放在私有 Blob，
// 只有已登录的管理员能在 /admin「错误记录」中查看和清空。
//
// 从不记录：页面内容、输入框内容、请求正文、Cookie、会话、网址里的查询参数和片段。
// 报错文字里 6 位以上的连续数字替换为 #，避免带出编号类信息。
// @vercel/blob 在运行时才动态加载，未安装依赖的环境（本地单测）可注入内存存储。
const PATHNAME = 'monitoring/errors.json';
// dedupeMs：同一实例内，同一种前端报错在此时间内只写一次存储，其余次数先在内存累加，下次写入时并入。
// dailyReports：全站每天（UTC）最多写入的前端上报条数，超过后当天只丢弃、不写存储。
export const LIMITS = Object.freeze({entries: 100, message: 300, path: 200, reportsPerWindow: 20, windowMs: 10 * 60 * 1000,
  dedupeMs: 10 * 60 * 1000, dailyReports: 300, recentKinds: 500});
export const KINDS = new Set(['error', 'rejection', 'resource', 'server']);

const header = (req, name) => {
  const value = req?.headers?.[name];
  return typeof value === 'string' ? value : '';
};
export const clean = (value, max) => String(value ?? '')
  .replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\d{6,}/g, '#').replace(/\s+/g, ' ').trim().slice(0, max);
// 只保留以 / 开头的站内路径，去掉 ?查询 和 #片段。
export const cleanPath = value => {
  const text = String(value ?? '');
  if (!text.startsWith('/') || text.startsWith('//')) return '';
  return clean(text.split(/[?#]/)[0], LIMITS.path);
};
const position = value => Number.isInteger(value) && value >= 0 && value < 10_000_000 ? value : 0;

// 校验并清理一条前端上报；不合格返回 null。
export function normalizeReport(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  const kind = String(body.kind || '');
  if (!KINDS.has(kind) || kind === 'server') return null;
  const message = clean(body.message, LIMITS.message);
  if (!message) return null;
  return {kind, message, file: cleanPath(body.file), line: position(body.line), column: position(body.column), page: cleanPath(body.page)};
}

const fingerprint = entry => crypto.createHash('sha256')
  .update([entry.kind, entry.message, entry.file, entry.line].join('\u0000')).digest('hex').slice(0, 16);
const isEntry = item => !!item && typeof item === 'object' && typeof item.id === 'string' && KINDS.has(item.kind);

async function defaultStorage() {
  try { return (await import('./_blob-auth.js')).blob; } catch { return null; }
}

export function createMonitor({storage, now = () => new Date(), pathname = PATHNAME} = {}) {
  const store = async () => storage || defaultStorage();
  async function readJson(name) {
    const s = await store();
    if (!s) return null;
    const result = await s.get(name, {access: 'private', useCache: false});
    if (!result || result.statusCode !== 200) return null;
    try { return JSON.parse(await new Response(result.stream).text()); } catch { return null; }
  }
  async function writeJson(name, value) {
    const s = await store();
    if (!s) return false;
    await s.put(name, JSON.stringify(value), {access: 'private', allowOverwrite: true, contentType: 'application/json; charset=utf-8'});
    return true;
  }
  const entriesOf = document => (Array.isArray(document?.entries) ? document.entries.filter(isEntry) : []).slice(0, LIMITS.entries);
  async function read() {
    return {entries: entriesOf(await readJson(pathname))};
  }
  // 尽力而为：记录失败不能影响正常请求。
  // extra：内存中尚未写入的同类次数；daily：计入并受全站每日上限约束（只用于公开的前端上报）。
  async function record(entry, req, {extra = 0, daily = false} = {}) {
    try {
      const date = now();
      const at = date.toISOString(), day = at.slice(0, 10);
      const item = {...entry, id: fingerprint(entry)};
      const document = await readJson(pathname);
      const entries = entriesOf(document);
      const dayWrites = document?.day === day ? Number(document.dayWrites) || 0 : 0;
      if (daily && dayWrites >= LIMITS.dailyReports) return false;
      const existing = entries.find(e => e.id === item.id);
      const added = 1 + Math.max(0, Math.floor(Number(extra) || 0));
      const merged = existing
        ? {...existing, page: item.page || existing.page, count: (Number(existing.count) || 1) + added, last: at}
        : {...item, count: added, first: at, last: at};
      merged.agent = clean(header(req, 'user-agent'), 200);
      merged.country = clean(header(req, 'x-vercel-ip-country'), 8);
      const next = [merged, ...entries.filter(e => e.id !== item.id)]
        .sort((a, b) => String(b.last).localeCompare(String(a.last))).slice(0, LIMITS.entries);
      return await writeJson(pathname, {version: 1, entries: next, day, dayWrites: dayWrites + (daily ? 1 : 0)});
    } catch { return false; }
  }
  async function clear() {
    return writeJson(pathname, {version: 1, entries: []});
  }
  // 同一网络地址在窗口内最多上报 reportsPerWindow 次；存储不可用时拒绝（不记录不影响访客）。
  async function allowReport(req) {
    try {
      const ip = (header(req, 'x-forwarded-for').split(',')[0] || 'unknown').trim().slice(0, 128);
      const name = 'monitoring/rate/' + crypto.createHash('sha256').update(ip).digest('hex') + '.json';
      const nowMs = now().getTime();
      const state = await readJson(name);
      const same = state && nowMs - Number(state.windowStart) < LIMITS.windowMs;
      const count = same ? Number(state.count) || 0 : 0;
      if (count >= LIMITS.reportsPerWindow) return false;
      return await writeJson(name, {windowStart: same ? Number(state.windowStart) : nowMs, count: count + 1});
    } catch { return false; }
  }
  // 公开上报的入口，按花费从低到高检查，能在内存里拦下的就不碰存储：
  //   1. 同一种报错在 dedupeMs 内已写过 → 只在内存累加次数；
  //   2. 同一网络地址在本实例的窗口内已达上限 → 丢弃；
  //   3. 存储中的网络地址计数（allowReport）→ 4. 写入（record，受全站每日上限约束）。
  const recent = new Map();
  const ipMemory = createMemoryLimiter({windowMs: LIMITS.windowMs, now: () => now().getTime()});
  async function accept(entry, req) {
    const nowMs = now().getTime(), id = fingerprint(entry);
    const seen = recent.get(id);
    if (seen && nowMs - seen.at < LIMITS.dedupeMs) { seen.pending += 1; return false; }
    const ip = (header(req, 'x-forwarded-for').split(',')[0] || 'unknown').trim().slice(0, 128);
    const ipKey = crypto.createHash('sha256').update(ip).digest('hex');
    if (ipMemory.count(ipKey, nowMs) >= LIMITS.reportsPerWindow) return false;
    ipMemory.add(ipKey, nowMs);
    // 在任何 await 之前登记，同一实例里的并发重复上报也会被合并。
    const extra = seen ? seen.pending : 0;
    recent.delete(id);
    recent.set(id, {at: nowMs, pending: 0});
    while (recent.size > LIMITS.recentKinds) recent.delete(recent.keys().next().value);
    if (!(await allowReport(req))) { recent.get(id).pending += extra; return false; }
    return record(entry, req, {extra, daily: true});
  }
  return {read, record, clear, allowReport, accept};
}

export const monitor = createMonitor();

// 包住接口：返回 5xx 或抛出异常时记一条 server 记录。只记录接口名、状态码和异常类型/简短说明。
export function withMonitoring(name, handler, target = monitor) {
  return async function monitored(req, res) {
    let pending = null;
    const status = typeof res?.status === 'function' ? res.status.bind(res) : null;
    if (status) {
      res.status = code => {
        if (Number(code) >= 500 && !pending) {
          pending = target.record({kind: 'server', message: 'HTTP ' + Number(code), file: '/api/' + name, line: 0, column: 0, page: cleanPath(String(req?.url || ''))}, req);
        }
        return status(code);
      };
    }
    try {
      return await handler(req, res);
    } catch (error) {
      const message = clean((error?.name || 'Error') + ': ' + (error?.message || ''), LIMITS.message);
      pending = target.record({kind: 'server', message, file: '/api/' + name, line: 0, column: 0, page: cleanPath(String(req?.url || ''))}, req);
      if (status && !res.headersSent) status(500).json({error: '服务器暂时出错，请稍后重试'});
    } finally {
      if (pending) await pending;
    }
  };
}
