import {isAdmin,requirePostHeader} from './_auth.js';

const writes = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function sameOrigin(req) {
  if (req.headers['sec-fetch-site'] === 'cross-site') return false;
  const origin = req.headers.origin;
  if (!origin) return true; // Non-browser clients still need the admin marker and session.
  const host = req.headers.host;
  const protocol = req.headers['x-forwarded-proto'] || (req.socket?.encrypted ? 'https' : 'http');
  if (typeof host !== 'string' || /[\s,\/@\\]/.test(host) || !['http', 'https'].includes(protocol)) return false;
  try {
    const source = new URL(origin);
    return ['http:', 'https:'].includes(source.protocol) && source.origin === new URL(protocol + '://' + host).origin;
  } catch { return false; }
}

// Applied before handler work or storage access. Vercel WAF handles distributed rate limits.
export function guardRequest(req, res, {methods, admin = false, json = false, bodyLimit = 4096}) {
  res.setHeader('Cache-Control', 'no-store');
  if (!methods.includes(req.method)) {
    res.setHeader('Allow', methods.join(', '));
    res.status(405).json({error: 'Method not allowed'}); return false;
  }
  if (writes.has(req.method) && !sameOrigin(req)) {
    res.status(403).json({error: '禁止跨站操作'}); return false;
  }
  if (admin && !isAdmin(req)) {
    res.status(401).json({error: '未登录或会话已失效'}); return false;
  }
  if (writes.has(req.method) && !requirePostHeader(req)) {
    res.status(403).json({error: '缺少管理请求标识'}); return false;
  }
  if (!json) return true;
  if (!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type'] || '')) {
    res.status(415).json({error: '仅支持 JSON 请求'}); return false;
  }
  const declaredSize = req.headers['content-length'];
  if (declaredSize !== undefined && (!/^\d+$/.test(String(declaredSize)) || Number(declaredSize) > bodyLimit)) {
    res.status(413).json({error: '请求数据过大'}); return false;
  }
  try {
    const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    if (typeof raw !== 'string' || Buffer.byteLength(raw) > bodyLimit) {
      res.status(413).json({error: '请求数据过大'}); return false;
    }
    const body = typeof req.body === 'string' ? JSON.parse(raw) : req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Expected object');
    req.body = body;
    return true;
  } catch {
    res.status(400).json({error: 'JSON 格式错误'}); return false;
  }
}
