import crypto from 'node:crypto';

function cookies(req) {
  const raw = req.headers.cookie || '';
  return Object.fromEntries(raw.split(';').map(value => value.trim()).filter(Boolean).map(value => {
    const index = value.indexOf('=');
    return [decodeURIComponent(index < 0 ? value : value.slice(0, index)), decodeURIComponent(index < 0 ? '' : value.slice(index + 1))];
  }));
}

function sessionSecret() {
  const secret = process.env.HAJIMI_SESSION_SECRET;
  return typeof secret === 'string' && secret.trim() ? secret : null;
}

function sign(value, secret) {
  return crypto.createHmac('sha256', secret).update(value).digest('base64url');
}

export function createSession(user) {
  const secret = sessionSecret();
  if (!secret) throw new Error('Session signing is not configured');
  const payload = Buffer.from(JSON.stringify({u: user, exp: Date.now() + 604800000})).toString('base64url');
  return payload + '.' + sign(payload, secret);
}

export function readSession(req) {
  const secret = sessionSecret();
  if (!secret) return null;
  try {
    const token = cookies(req).hajimi_session;
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 2 || !/^[A-Za-z0-9_-]+$/.test(parts[0]) || !/^[A-Za-z0-9_-]{43}$/.test(parts[1])) return null;
    const [payload, signature] = parts;
    if (!crypto.timingSafeEqual(Buffer.from(sign(payload, secret)), Buffer.from(signature))) return null;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (data.u !== (process.env.HAJIMI_ADMIN_USER || 'admin') || !Number.isFinite(data.exp) || Date.now() >= data.exp) return null;
    return data;
  } catch { return null; }
}

export const isAdmin = req => !!readSession(req);
export const sha256 = value => crypto.createHash('sha256').update(String(value || '')).digest('hex');
export function safeEqHex(a, b) {
  if (!/^[a-f0-9]{64}$/i.test(a) || !/^[a-f0-9]{64}$/i.test(b)) return false;
  return crypto.timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
}
export const requirePostHeader = req => req.headers['x-hajimi-admin'] === '1';
