import crypto from 'node:crypto';

// /api/note-generate 的轻量限流：同一调用方 IP 在 10 分钟窗口内最多生成 20 次。
// 状态和登录节流一样存在 Vercel Blob，并通过 _blob-auth.js 的固定凭据客户端访问；
// 存储不可用时放行（fail open），避免 Blob 故障阻断正常使用。
// @vercel/blob 在运行时才动态加载，未安装依赖的环境（本地单测）不会因此失败。
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 20;

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

export async function consumeNoteQuota(req, {now = Date.now()} = {}) {
  const blob = await pinnedBlob();
  if (!blob) return {allowed: true, remaining: MAX_REQUESTS};
  const pathname = 'security/note-rate/' + clientDigest(req) + '.json';
  let state = null;
  try {
    const stored = await blob.get(pathname, {access: 'private', useCache: false});
    if (stored && stored.statusCode === 200) state = JSON.parse(await new Response(stored.stream).text());
  } catch {}
  const windowStart = Number(state?.windowStart) || 0;
  const sameWindow = windowStart > 0 && now - windowStart < WINDOW_MS;
  const count = sameWindow ? Number(state?.count) || 0 : 0;
  if (count >= MAX_REQUESTS) {
    return {allowed: false, retryAfter: Math.max(1, Math.ceil((windowStart + WINDOW_MS - now) / 1000))};
  }
  try {
    await blob.put(pathname, JSON.stringify({windowStart: sameWindow ? windowStart : now, count: count + 1, updatedAt: now}), {
      access: 'private', allowOverwrite: true, contentType: 'application/json; charset=utf-8'
    });
  } catch {}
  return {allowed: true, remaining: MAX_REQUESTS - count - 1};
}

export const NOTE_RATE_LIMIT = Object.freeze({WINDOW_MS, MAX_REQUESTS});
