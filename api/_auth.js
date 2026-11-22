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

// 会话有效期（2026-11-19 负责人确定）：12 小时 + 滑动续期。
// - 每个会话 12 小时后过期；管理操作（通过 guardRequest 的管理员请求）和打开管理页面
//   （GET /api/session）时，签发已超过 RENEW_AFTER_MS 的会话会换成新的 12 小时会话。
// - 续期最长到登录后 MAX_LIFETIME_MS（7 天），之后必须重新登录，被盗的 Cookie 不能无限续命。
// - 不带登录时间（l）的旧格式会话（原 7 天有效期）一律无效，上线后需重新登录一次。
export const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
export const RENEW_AFTER_MS = 30 * 60 * 1000;
export const MAX_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;
// 允许服务器之间少量时钟误差，超出的会话视为伪造或旧格式。
const CLOCK_SKEW_MS = 60 * 1000;

// 会话版本号（可选）：HAJIMI_SESSION_VERSION 写进每个新会话。修改这个变量并重新部署，
// 之前签发的所有会话立即失效，不用更换签名密钥。
function sessionVersion() {
  const value = process.env.HAJIMI_SESSION_VERSION;
  return typeof value === 'string' ? value.trim() : '';
}

// loginAt：首次登录时间；续期时沿用，用来计算 7 天上限。
export function createSession(user, {now = Date.now(), loginAt = now} = {}) {
  const secret = sessionSecret();
  if (!secret) throw new Error('Session signing is not configured');
  const version = sessionVersion();
  const exp = Math.min(now + SESSION_TTL_MS, loginAt + MAX_LIFETIME_MS);
  const payload = Buffer.from(JSON.stringify({u: user, l: loginAt, exp, ...(version ? {v: version} : {})})).toString('base64url');
  return payload + '.' + sign(payload, secret);
}

export function sessionCookie(token, maxAgeMs = SESSION_TTL_MS) {
  return 'hajimi_session=' + encodeURIComponent(token) + '; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=' + Math.max(0, Math.floor(maxAgeMs / 1000));
}
export const CLEAR_SESSION_COOKIE = 'hajimi_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0';

export function readSession(req, now = Date.now()) {
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
    if (data.u !== (process.env.HAJIMI_ADMIN_USER || 'admin') || !Number.isFinite(data.exp) || now >= data.exp) return null;
    if (!Number.isFinite(data.l) || data.l > now + CLOCK_SKEW_MS || now >= data.l + MAX_LIFETIME_MS) return null;
    if (data.exp > now + SESSION_TTL_MS + CLOCK_SKEW_MS) return null;
    if ((data.v === undefined ? '' : data.v) !== sessionVersion()) return null;
    return data;
  } catch { return null; }
}

// 滑动续期：有效会话签发超过 RENEW_AFTER_MS 时换发新会话（保留登录时间）。
// 返回是否续期；没有会话或已到 7 天上限时什么也不做。
export function renewSession(req, res, now = Date.now()) {
  const session = readSession(req, now);
  if (!session || typeof res?.setHeader !== 'function') return false;
  const issuedAt = session.exp - SESSION_TTL_MS;
  const next = Math.min(now + SESSION_TTL_MS, session.l + MAX_LIFETIME_MS);
  if (now - issuedAt < RENEW_AFTER_MS || next <= session.exp) return false;
  try { res.setHeader('Set-Cookie', sessionCookie(createSession(session.u, {now, loginAt: session.l}), next - now)); }
  catch { return false; }
  return true;
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

// Self-check shown to the signed-in administrator only (api/session.js). It reports how the
// login is configured — which kind of password hash, whether the signing secret is long
// enough — and never returns any configured value.
export function securityChecks(env = process.env) {
  const text = name => typeof env[name] === 'string' ? env[name].trim() : '';
  const hash = text('HAJIMI_ADMIN_PASSWORD_HASH'), legacy = text('HAJIMI_ADMIN_PASSWORD_SHA256');
  const checks = [];
  if (/^scrypt\$/.test(hash) || /^pbkdf2\$/.test(hash)) {
    checks.push({id: 'password-hash', ok: true, message: '管理员密码使用加盐哈希保存。'});
    if (legacy) checks.push({id: 'legacy-hash-left', ok: false,
      message: '旧的 HAJIMI_ADMIN_PASSWORD_SHA256 仍保留在 Vercel 环境变量中。它已不再用于登录，但一旦泄露容易被破解，建议删除后重新部署。'});
  } else if (hash) {
    checks.push({id: 'password-hash', ok: false, message: 'HAJIMI_ADMIN_PASSWORD_HASH 的格式无法识别，请在 /admin/password 页面重新生成。'});
  } else {
    checks.push({id: 'password-hash', ok: false,
      message: '管理员密码仍使用无盐 SHA-256（HAJIMI_ADMIN_PASSWORD_SHA256），泄露后容易被离线破解。请在 /admin/password 页面生成新的校验码，填入 HAJIMI_ADMIN_PASSWORD_HASH 后重新部署，再删除旧变量。'});
  }
  const secret = text('HAJIMI_SESSION_SECRET');
  checks.push(secret.length >= 32
    ? {id: 'session-secret', ok: true, message: '会话签名密钥长度符合要求（不少于 32 个字符）。'}
    : {id: 'session-secret', ok: false, message: '会话签名密钥 HAJIMI_SESSION_SECRET 少于 32 个字符，建议换成更长的随机值后重新部署（所有已登录的会话会失效，需要重新登录）。'});
  const user = text('HAJIMI_ADMIN_USER');
  checks.push(user && user.toLowerCase() !== 'admin'
    ? {id: 'admin-user', ok: true, message: '管理员用户名不是默认的 admin。'}
    : {id: 'admin-user', ok: false, message: '管理员用户名是默认的 admin，容易被猜到；建议在 HAJIMI_ADMIN_USER 中改用其他名称。'});
  return checks;
}

