// Offline harness for tests that run the real @vercel/blob SDK.
// - Intercepts undici (the SDK calls undici.fetch for get() and for API requests)
//   through a MockAgent installed as the global dispatcher of the very undici copy
//   the SDK resolves; unmatched requests are refused (disableNetConnect).
// - Also refuses globalThis.fetch, net.connect/createConnection and tls.connect, so
//   any request that escapes the mock fails loudly instead of reaching the network.
// Only fictitious credentials are used. Not a test file itself (no .test.js suffix).
import {createRequire} from 'node:module';
import path from 'node:path';
import net from 'node:net';
import tls from 'node:tls';

const require = createRequire(import.meta.url);
const sdkEntry = require.resolve('@vercel/blob');
const packageDir = file => {
  let dir = path.dirname(file);
  while (!require('node:fs').existsSync(path.join(dir, 'package.json'))) dir = path.dirname(dir);
  return dir;
};
export const undiciForSdk = packageDir(createRequire(sdkEntry).resolve('undici'));
export const undiciForTest = packageDir(require.resolve('undici'));
const {MockAgent, setGlobalDispatcher, getGlobalDispatcher} = require(createRequire(sdkEntry).resolve('undici'));

export const FAKE_STORE = 'Fakestore0000001';
export const FAKE_TOKEN = `vercel_blob_rw_${FAKE_STORE}_fictitiousSecretForTests0001`;
export const OIDC_STORE = 'Oidcstore0000002';
// Unsigned, fictitious JWT-shaped value with a far-future expiry.
export const FAKE_OIDC = ['eyJhbGciOiJub25lIn0', Buffer.from(JSON.stringify({exp: 4102444800, sub: 'test'})).toString('base64url'), 'x'].join('.');

const ENV_KEYS = ['BLOB_READ_WRITE_TOKEN', 'BLOB_STORE_ID', 'VERCEL_OIDC_TOKEN', 'VERCEL_BLOB_RETRIES', 'VERCEL_BLOB_API_URL', 'NEXT_PUBLIC_VERCEL_BLOB_API_URL'];

export function setEnv(t, values) {
  const saved = Object.fromEntries(ENV_KEYS.map(key => [key, process.env[key]]));
  for (const key of ENV_KEYS) delete process.env[key];
  process.env.VERCEL_BLOB_RETRIES = '0';
  Object.assign(process.env, values);
  t.after(() => {
    for (const key of ENV_KEYS) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  });
}

function headerValue(headers, name) {
  if (!headers) return undefined;
  if (Array.isArray(headers)) {
    for (let i = 0; i < headers.length; i += 2) if (String(headers[i]).toLowerCase() === name) return String(headers[i + 1]);
    return undefined;
  }
  if (typeof headers.get === 'function') return headers.get(name) ?? undefined;
  for (const [key, value] of Object.entries(headers)) if (key.toLowerCase() === name) return String(value);
  return undefined;
}

// handler({origin, method, path, authorization}) -> {status, body, headers}
export function offlineBlob(t, handler) {
  const requests = [];
  const escaped = [];
  const agent = new MockAgent();
  agent.disableNetConnect();
  const pool = agent.get(() => true);
  pool.intercept({path: () => true, method: () => true}).reply(options => {
    const request = {
      origin: String(options.origin),
      method: options.method,
      path: options.path,
      authorization: headerValue(options.headers, 'authorization'),
      body: options.body
    };
    requests.push(request);
    const response = handler(request);
    return {statusCode: response.status, data: response.body ?? '', responseOptions: {headers: response.headers || {}}};
  }).persist();

  const previous = getGlobalDispatcher();
  setGlobalDispatcher(agent);
  const originals = {fetch: globalThis.fetch, connect: net.connect, createConnection: net.createConnection, tlsConnect: tls.connect};
  const refuse = name => (...args) => { escaped.push(name); throw new Error(`network disabled in tests (${name})`); };
  globalThis.fetch = async input => { escaped.push('globalThis.fetch ' + String(input)); throw new Error('network disabled in tests (globalThis.fetch)'); };
  net.connect = refuse('net.connect');
  net.createConnection = refuse('net.createConnection');
  tls.connect = refuse('tls.connect');
  t.after(async () => {
    globalThis.fetch = originals.fetch;
    net.connect = originals.connect;
    net.createConnection = originals.createConnection;
    tls.connect = originals.tlsConnect;
    setGlobalDispatcher(previous);
    await agent.close();
  });
  return {requests, escaped};
}

// A minimal fake Blob backend keyed by pathname, answering the two request shapes the
// SDK sends: GET https://<store>.private.blob.vercel-storage.com/<path> and
// PUT https://vercel.com/api/blob/?pathname=<path>.
export function fakeBackend(initial = {}) {
  const objects = new Map(Object.entries(initial));
  let etag = 1;
  return {
    objects,
    handle(request) {
      const url = new URL(request.path, request.origin);
      if (request.method === 'GET' && url.hostname.endsWith('.blob.vercel-storage.com')) {
        const key = decodeURIComponent(url.pathname.slice(1));
        if (!objects.has(key)) return {status: 404};
        const value = objects.get(key);
        const type = key.endsWith('.png') ? 'image/png' : 'application/json';
        return {status: 200, body: value, headers: {'content-type': type, etag: '"e' + etag + '"', 'content-length': String(Buffer.byteLength(value))}};
      }
      if (request.method === 'PUT' && url.hostname === 'vercel.com' && url.pathname.startsWith('/api/blob')) {
        const key = url.searchParams.get('pathname');
        objects.set(key, typeof request.body === 'string' ? request.body : '{}');
        etag += 1;
        const store = (request.authorization || '').split('_')[3] || 'unknown';
        const blobUrl = `https://${store}.private.blob.vercel-storage.com/${key}`;
        return {status: 200, body: JSON.stringify({url: blobUrl, downloadUrl: blobUrl + '?download=1', pathname: key, contentType: 'application/json', contentDisposition: 'inline', etag: '"e' + etag + '"'}), headers: {'content-type': 'application/json'}};
      }
      return {status: 500, body: JSON.stringify({error: {code: 'unknown_error', message: 'unexpected request in test'}})};
    }
  };
}
