import crypto from 'node:crypto';
import {createMemoryLimiter} from './_memory-limit.js';

// /api/note-generate 的轻量限流：同一调用方 IP 在 10 分钟窗口内最多生成 20 次。
// 状态和登录节流一样存在 Vercel Blob，并通过 _blob-auth.js 的固定凭据客户端访问；
// 存储不可用时放行（fail open），避免 Blob 故障阻断正常使用。
// @vercel/blob 在运行时才动态加载，未安装依赖的环境（本地单测）不会因此失败。
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 20;
// 同一实例内的准确计数，先于 Blob 检查；Blob 不可用时仍按策略放行，但同一实例内的突发请求会被拦下。
const memory = createMemoryLimiter({windowMs: WINDOW_MS});

function clientDigest(req) {
  const raw = String(req.headers['x-forwarded-for'] || '').trim();
  const ip = (raw.split(',')[0] || 'unknown').trim().slice(0, 128);
  return crypto.createHash('sha256').update(ip).digest('hex');
}

async function pinnedBlob() {
  try {
    const {blob} = await import('./_blob-auth.js');
    return blob;
  } catch {
    return null;
  }
}

export async function consumeNoteQuota(req, {now = Date.now(), storage} = {}) {
  const key = clientDigest(req);
  const local = memory.count(key, now);
  if (local >= MAX_REQUESTS) {
    return {allowed: false, retryAfter: Math.max(1, Math.ceil(memory.remaining(key, now) / 1000))};
  }
  // 在任何 await 之前先占用名额，同一实例里的并发请求能看到彼此。
  memory.add(key, now);
  const blob = storage || await pinnedBlob();
  if (!blob) return {allowed: true, remaining: MAX_REQUESTS - local - 1};
  const pathname = 'security/note-rate/' + key + '.json';
  let state = null;
  try {
    const stored = await blob.get(pathname, {access: 'private', useCache: false});
    if (stored && stored.statusCode === 200) state = JSON.parse(await new Response(stored.stream).text());
  } catch {}
  const windowStart = Number(state?.windowStart) || 0;
  const sameWindow = windowStart > 0 && now - windowStart < WINDOW_MS;
  // 取 Blob 与本实例计数中较大的一个：Blob 漏计时，本实例的次数仍然有效。
  const count = Math.max(sameWindow ? Number(state?.count) || 0 : 0, local);
  if (count >= MAX_REQUESTS) {
    const start = sameWindow ? windowStart : now;
    return {allowed: false, retryAfter: Math.max(1, Math.ceil((start + WINDOW_MS - now) / 1000))};
  }
  try {
    await blob.put(pathname, JSON.stringify({windowStart: sameWindow ? windowStart : now, count: count + 1, updatedAt: now}), {
      access: 'private', allowOverwrite: true, contentType: 'application/json; charset=utf-8'
    });
  } catch {}
  return {allowed: true, remaining: MAX_REQUESTS - count - 1};
}

export const NOTE_RATE_LIMIT = Object.freeze({WINDOW_MS, MAX_REQUESTS});
