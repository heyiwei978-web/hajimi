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
// Preferred: HAJIMI_ADMIN_PASSWORD_HASH = "scrypt$<salt>$<hash>" (base64url), made with
// `node scripts/hash-password.mjs`, or the browser-generated pbkdf2 form below. A salted, memory-hard hash resists offline guessing if the
// value ever leaks. HAJIMI_ADMIN_PASSWORD_SHA256 is still accepted until it is replaced.
const SCRYPT_PARAMS = {N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024};
export function hashPassword(password, salt = crypto.randomBytes(16)) {
  const hash = crypto.scryptSync(String(password), salt, 32, SCRYPT_PARAMS);
  return 'scrypt$' + salt.toString('base64url') + '$' + hash.toString('base64url');
}
export function verifyPassword(password, env = process.env) {
  const stored = env.HAJIMI_ADMIN_PASSWORD_HASH;
  if (typeof stored === 'string' && stored.trim()) {
    const value = stored.trim();
    const scrypt = /^scrypt\$([A-Za-z0-9_-]{16,})\$([A-Za-z0-9_-]{43})$/.exec(value);
    if (scrypt) {
      const actual = crypto.scryptSync(String(password), Buffer.from(scrypt[1], 'base64url'), 32, SCRYPT_PARAMS);
      return crypto.timingSafeEqual(actual, Buffer.from(scrypt[2], 'base64url'));
    }
    // "pbkdf2$<iterations>$<salt>$<hash>" (PBKDF2-HMAC-SHA256, base64url): can be made in any
    // browser with Web Crypto, so the password never has to leave the administrator's device.
    const pbkdf2 = /^pbkdf2\$(\d{6,7})\$([A-Za-z0-9_-]{16,})\$([A-Za-z0-9_-]{43})$/.exec(value);
    const iterations = pbkdf2 ? Number(pbkdf2[1]) : 0;
    if (!pbkdf2 || iterations < 310000 || iterations > 2000000) return false;
    const actual = crypto.pbkdf2Sync(String(password), Buffer.from(pbkdf2[2], 'base64url'), iterations, 32, 'sha256');
    return crypto.timingSafeEqual(actual, Buffer.from(pbkdf2[3], 'base64url'));
  }
  return safeEqHex(sha256(password), env.HAJIMI_ADMIN_PASSWORD_SHA256 || '');
}
export const requirePostHeader = req => req.headers['x-hajimi-admin'] === '1';
