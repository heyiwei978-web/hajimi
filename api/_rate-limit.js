import crypto from 'node:crypto';
import {blob} from './_blob-auth.js';
import {createMemoryLimiter} from './_memory-limit.js';

const WINDOW_MS = 15 * 60 * 1000;
const BLOCK_MS = 15 * 60 * 1000;
const MAX_FAILURES = 10;
// 同一实例内的准确计数（见 _memory-limit.js）：Blob 计数漏计或存储故障放行时，
// 打到同一实例的连续失败仍会在第 10 次后被封锁 15 分钟。
const memoryFailures = createMemoryLimiter({windowMs: WINDOW_MS});
const memoryBlocks = createMemoryLimiter({windowMs: BLOCK_MS});

function clientIp(req) {
  const raw = String(req.headers['x-forwarded-for'] || '').trim();
  return (raw.split(',')[0] || 'unknown').trim().slice(0, 128);
}

const clientKey = req => crypto.createHash('sha256').update(clientIp(req)).digest('hex');
const pathnameFor = req => 'security/login-rate/' + clientKey(req) + '.json';

async function readState(pathname) {
  try {
    const result = await blob.get(pathname,{access:'private',useCache:false});
    if (!result || result.statusCode !== 200) return null;
    const parsed = JSON.parse(await new Response(result.stream).text());
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

async function writeState(pathname,state) {
  try {
    await blob.put(pathname,JSON.stringify(state),{
      access:'private',
      allowOverwrite:true,
      contentType:'application/json; charset=utf-8'
    });
  } catch {
    // Fail open so a Blob outage never locks the legitimate administrator out.
  }
}

export async function checkLoginThrottle(req) {
  const pathname = pathnameFor(req);
  const now = Date.now();
  const key = clientKey(req);
  if (memoryBlocks.count(key,now) > 0) {
    return {allowed:false,pathname,retryAfter:Math.max(1,Math.ceil(memoryBlocks.remaining(key,now)/1000))};
  }
  const state = await readState(pathname);
  if (!state) return {allowed:true,pathname};

  const blockedUntil = Number(state.blockedUntil) || 0;
  if (blockedUntil > now) {
    return {
      allowed:false,
      pathname,
      retryAfter:Math.max(1,Math.ceil((blockedUntil-now)/1000))
    };
  }

  const windowStart = Number(state.windowStart) || 0;
  if (!windowStart || now-windowStart >= WINDOW_MS) {
    await writeState(pathname,{windowStart:now,failures:0,blockedUntil:0,updatedAt:now});
  }
  return {allowed:true,pathname};
}

export async function recordLoginFailure(req) {
  const pathname = pathnameFor(req);
  const now = Date.now();
  const key = clientKey(req);
  // 在任何 await 之前先计数，同一实例里的并发失败能看到彼此。
  const local = memoryFailures.add(key,now).count;
  const prior = await readState(pathname);
  const sameWindow = prior && Number(prior.windowStart) && now-Number(prior.windowStart) < WINDOW_MS;
  const failures = Math.max((sameWindow ? Number(prior.failures)||0 : 0) + 1, local);
  const blockedUntil = failures >= MAX_FAILURES ? now + BLOCK_MS : 0;
  if (blockedUntil && memoryBlocks.count(key,now) === 0) memoryBlocks.add(key,now);
  await writeState(pathname,{
    windowStart:sameWindow ? Number(prior.windowStart) : now,
    failures,
    blockedUntil,
    updatedAt:now
  });
  return {
    blocked:blockedUntil>now,
    retryAfter:blockedUntil>now ? Math.ceil((blockedUntil-now)/1000) : 0
  };
}

export async function clearLoginFailures(req) {
  const now=Date.now();
  memoryFailures.reset(clientKey(req));
  memoryBlocks.reset(clientKey(req));
  await writeState(pathnameFor(req),{windowStart:now,failures:0,blockedUntil:0,updatedAt:now});
}
