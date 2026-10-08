import crypto from 'node:crypto';
import {get,put} from '@vercel/blob';

const WINDOW_MS = 15 * 60 * 1000;
const BLOCK_MS = 15 * 60 * 1000;
const MAX_FAILURES = 10;

function clientIp(req) {
  const raw = String(req.headers['x-forwarded-for'] || '').trim();
  return (raw.split(',')[0] || 'unknown').trim().slice(0, 128);
}

function pathnameFor(req) {
  const digest = crypto.createHash('sha256').update(clientIp(req)).digest('hex');
  return 'security/login-rate/' + digest + '.json';
}

async function readState(pathname) {
  try {
    const result = await get(pathname,{access:'private',useCache:false});
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
    await put(pathname,JSON.stringify(state),{
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
  const prior = await readState(pathname);
  const sameWindow = prior && Number(prior.windowStart) && now-Number(prior.windowStart) < WINDOW_MS;
  const failures = (sameWindow ? Number(prior.failures)||0 : 0) + 1;
  const blockedUntil = failures >= MAX_FAILURES ? now + BLOCK_MS : 0;
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
  await writeState(pathnameFor(req),{windowStart:now,failures:0,blockedUntil:0,updatedAt:now});
}
