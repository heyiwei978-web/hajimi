import {blob} from './_blob-auth.js';

// Login record for the administrator: when and from where the admin signed in, and
// recent failed attempts. Stored in the private Blob store, readable through
// /api/login-log by a signed-in administrator only.
//
// Never recorded: the password, the username that was typed (a mistyped password often
// ends up in that field), cookies or session tokens.
const PATHNAME = 'security/login-log.json';
export const LIMITS = Object.freeze({success: 50, failure: 100});
const KINDS = new Set(['success', 'failure', 'blocked']);

const header = (req, name) => {
  const value = req.headers?.[name];
  return typeof value === 'string' ? value : '';
};
// Printable text only, so a crafted header cannot smuggle control characters into the log.
const clean = (value, max) => String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);
function decoded(value) {
  try { return decodeURIComponent(value); } catch { return value; }
}

export function describeRequest(req) {
  return {
    ip: clean(header(req, 'x-forwarded-for').split(',')[0], 64),
    // Vercel adds approximate location headers at the edge; the city is URL-encoded.
    country: clean(header(req, 'x-vercel-ip-country'), 8),
    region: clean(header(req, 'x-vercel-ip-country-region'), 16),
    city: clean(decoded(header(req, 'x-vercel-ip-city')), 60),
    agent: clean(header(req, 'user-agent'), 200)
  };
}

const isEntry = item => !!item && typeof item === 'object' && !Array.isArray(item)
  && typeof item.at === 'string' && KINDS.has(item.kind);
const entries = value => Array.isArray(value) ? value.filter(isEntry) : [];

export function createLoginLog(storage = blob, {pathname = PATHNAME, now = () => new Date()} = {}) {
  async function read() {
    const result = await storage.get(pathname, {access: 'private', useCache: false});
    if (!result || result.statusCode !== 200) return {success: [], failure: []};
    let document;
    try { document = JSON.parse(await new Response(result.stream).text()); }
    catch { return {success: [], failure: []}; }
    return {success: entries(document?.success).slice(0, LIMITS.success), failure: entries(document?.failure).slice(0, LIMITS.failure)};
  }
  // Best effort: a storage problem must never block or fail a login. Successful and
  // failed attempts are kept in separate lists so that a burst of failed attempts
  // cannot push the real sign-ins out of the record.
  async function record(kind, req) {
    if (!KINDS.has(kind)) return false;
    try {
      const current = await read();
      const entry = {at: now().toISOString(), kind, ...describeRequest(req)};
      const list = kind === 'success' ? 'success' : 'failure';
      current[list] = [entry, ...current[list]].slice(0, LIMITS[list]);
      await storage.put(pathname, JSON.stringify({version: 1, ...current}), {
        access: 'private', allowOverwrite: true, contentType: 'application/json; charset=utf-8'
      });
      return true;
    } catch { return false; }
  }
  return {read, record};
}

export const loginLog = createLoginLog();
