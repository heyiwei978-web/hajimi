import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import {get as sdkGet} from '@vercel/blob';
import {blob, blobAuth, createBlobClient, BlobConfigError, BlobOptionError} from '../api/_blob-auth.js';
import {contentStore, ContentError} from '../api/_content-store.js';
import image from '../api/image.js';
import upload from '../api/upload.js';
import {checkLoginThrottle, recordLoginFailure, clearLoginFailures} from '../api/_rate-limit.js';
import {createSession} from '../api/_auth.js';
import {offlineBlob, fakeBackend, setEnv, undiciForSdk, undiciForTest, FAKE_STORE, FAKE_TOKEN, OIDC_STORE, FAKE_OIDC} from './_offline-blob.js';

// Phase R1.5-A: every Blob call is pinned to the static read-write token.
// All credentials below are fictitious; no request leaves the process.

const OIDC_PRESENT = {BLOB_STORE_ID: OIDC_STORE, VERCEL_OIDC_TOKEN: FAKE_OIDC};
const BAD_TOKENS = [undefined, '', '   ', '\n\t', 'abc', 'vercel_blob_rw_', 'vercel_blob_rw_store', 'vercel_blob_rw__secret', FAKE_OIDC, 'Bearer ' + FAKE_TOKEN];

function response() {
  return {
    code: 200, headers: {}, body: null,
    setHeader(key, value) { this.headers[key.toLowerCase()] = value; },
    status(code) { this.code = code; return this; },
    json(body) { this.body = body; return this; },
    end(body) { this.body = body; return this; }
  };
}
function request(extra = {}) {
  return {method: 'POST', body: {}, query: {}, ...extra, headers: {
    host: 'wdyxzl.icu', 'x-forwarded-proto': 'https', 'content-type': 'application/json', 'x-hajimi-admin': '1',
    'x-forwarded-for': '203.0.113.7', ...extra.headers
  }};
}
function adminCookie(t) {
  const previous = process.env.HAJIMI_SESSION_SECRET;
  process.env.HAJIMI_SESSION_SECRET = crypto.randomBytes(32).toString('hex');
  t.after(() => { if (previous === undefined) delete process.env.HAJIMI_SESSION_SECRET; else process.env.HAJIMI_SESSION_SECRET = previous; });
  return 'hajimi_session=' + createSession(process.env.HAJIMI_ADMIN_USER || 'admin');
}
const PNG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const CONTENT = JSON.stringify({version: 1, templateOverrides: {}, cases: [{id: 'c1', template: 't', images: ['cases/a.png']}]});

function assertOnlyStaticToken(network) {
  assert.ok(network.requests.length > 0, 'at least one Blob request was made');
  for (const request of network.requests) {
    assert.equal(request.authorization, 'Bearer ' + FAKE_TOKEN, `${request.method} ${request.origin}${request.path} uses the static token`);
    assert.ok(!String(request.authorization).includes(FAKE_OIDC), 'OIDC token never sent');
    assert.ok(!request.origin.toLowerCase().includes(OIDC_STORE.toLowerCase()), 'never addresses the BLOB_STORE_ID store');
    const url = new URL(request.path, request.origin);
    if (url.hostname.endsWith('.blob.vercel-storage.com')) assert.equal(url.hostname, `${FAKE_STORE}.private.blob.vercel-storage.com`.toLowerCase(), 'addresses the store named in the static token');
  }
  assert.deepEqual(network.escaped, [], 'no request escaped the undici mock');
}

// ---- harness self-checks -------------------------------------------------

test('harness: test intercepts the same undici copy that the SDK uses', () => {
  assert.equal(undiciForSdk, undiciForTest);
});

test('harness sensitivity: without a pinned token the real SDK would choose OIDC over BLOB_READ_WRITE_TOKEN', async t => {
  setEnv(t, {BLOB_READ_WRITE_TOKEN: FAKE_TOKEN, BLOB_STORE_ID: OIDC_STORE});
  const backend = fakeBackend({'probe.json': '{}'});
  const network = offlineBlob(t, request => backend.handle(request));
  // oidcToken is passed explicitly so this control does not depend on @vercel/oidc.
  await sdkGet('probe.json', {access: 'private', useCache: false, oidcToken: FAKE_OIDC});
  assert.equal(network.requests.length, 1);
  assert.equal(network.requests[0].authorization, 'Bearer ' + FAKE_OIDC, 'the harness can observe an OIDC-authenticated request');
  assert.equal(new URL(network.requests[0].path, network.requests[0].origin).hostname, `${OIDC_STORE}.private.blob.vercel-storage.com`.toLowerCase());
});

test('harness: requests the mock does not expect are refused, not sent', async t => {
  setEnv(t, {BLOB_READ_WRITE_TOKEN: FAKE_TOKEN});
  const network = offlineBlob(t, () => ({status: 500, body: JSON.stringify({error: {code: 'unknown_error'}})}));
  await assert.rejects(globalThis.fetch('https://example.com/'), /network disabled/);
  assert.deepEqual(network.escaped, ['globalThis.fetch https://example.com/']);
});

// ---- T1: token validation -------------------------------------------------

test('T1 blobAuth accepts only a non-empty static read-write token and never echoes input', () => {
  assert.deepEqual(blobAuth({BLOB_READ_WRITE_TOKEN: FAKE_TOKEN}), {token: FAKE_TOKEN});
  assert.deepEqual(blobAuth({BLOB_READ_WRITE_TOKEN: '  ' + FAKE_TOKEN + '\n'}), {token: FAKE_TOKEN}, 'surrounding whitespace is trimmed');
  for (const value of [...BAD_TOKENS, 42, null, {}]) {
    assert.throws(() => blobAuth({BLOB_READ_WRITE_TOKEN: value}), error => {
      assert.ok(error instanceof BlobConfigError);
      assert.equal(error.code, 'no_credentials');
      if (typeof value === 'string' && value.trim()) assert.ok(!error.message.includes(value.trim()), 'message does not contain the value');
      assert.ok(!error.message.includes('fictitiousSecret'));
      return true;
    }, `rejects ${JSON.stringify(value)}`);
  }
  assert.throws(() => blobAuth({}), BlobConfigError);
});

test('T1 the client checks the token before calling the SDK and passes only allow-listed options', async t => {
  const calls = [];
  const sdk = {get: async (...args) => { calls.push(['get', ...args]); return null; }, put: async (...args) => { calls.push(['put', ...args]); return {}; }};
  const client = createBlobClient(sdk);
  setEnv(t, OIDC_PRESENT);
  await assert.rejects(client.get('a.json', {access: 'private'}), BlobConfigError);
  await assert.rejects(client.put('a.json', 'x', {access: 'private'}), BlobConfigError);
  assert.equal(calls.length, 0, 'SDK not called without a valid token');
  process.env.BLOB_READ_WRITE_TOKEN = FAKE_TOKEN;
  await client.get('a.json', {access: 'private', useCache: false});
  await client.put('a.json', 'x', {access: 'private', allowOverwrite: true, addRandomSuffix: false, contentType: 'application/json', ifMatch: '"e1"'});
  assert.deepEqual(calls[0], ['get', 'a.json', {access: 'private', useCache: false, token: FAKE_TOKEN}]);
  assert.deepEqual(calls[1], ['put', 'a.json', 'x', {access: 'private', allowOverwrite: true, addRandomSuffix: false, contentType: 'application/json', ifMatch: '"e1"', token: FAKE_TOKEN}]);
  calls.length = 0;
  const rejected = [
    ['get', {access: 'private', token: 'vercel_blob_rw_Other_x'}],
    ['get', {access: 'private', oidcToken: FAKE_OIDC}],
    ['get', {access: 'private', storeId: OIDC_STORE}],
    ['get', {access: 'private', ifNoneMatch: '"e1"'}],
    ['get', {access: 'private', allowOverwrite: true}],
    ['put', {access: 'private', useCache: false}],
    ['put', {access: 'private', multipart: true}],
    ['get', {access: 'private', [Symbol('headers')]: {authorization: 'Bearer x'}}],
    ['get', Object.defineProperty({access: 'private'}, 'headers', {value: {authorization: 'Bearer x'}, enumerable: false})],
    ['get', Object.assign(Object.create({headers: {authorization: 'Bearer x'}}), {access: 'private'})],
    ['get', null], ['get', undefined], ['get', 'private'], ['get', []]
  ];
  for (const [method, options] of rejected) {
    const call = method === 'get' ? client.get('a.json', options) : client.put('a.json', 'x', options);
    await assert.rejects(call, error => error instanceof BlobOptionError && error.code === 'unsupported_option' && !error.message.includes('Bearer'));
  }
  assert.equal(calls.length, 0, 'SDK never called with a disallowed option');
});

// ---- T2 + T3: every call site, real SDK, OIDC conditions present -----------

test('T2/T3 content store reads, backups, saves and history reads use the static token even when OIDC is available', async t => {
  setEnv(t, {BLOB_READ_WRITE_TOKEN: FAKE_TOKEN, ...OIDC_PRESENT});
  const backend = fakeBackend({'cms/content.json': CONTENT});
  const network = offlineBlob(t, request => backend.handle(request));
  const current = await contentStore.read();
  assert.equal(current.data.cases.length, 1);
  const saved = await contentStore.save({version: 1, templateOverrides: {}, cases: []}, current.revision, 'admin');
  assert.ok(saved.revision);
  const after = await contentStore.read();
  const historyId = after.history[0].id;
  assert.match(historyId, /^\d{13}-[a-f0-9-]{36}$/);
  await contentStore.historyContent(historyId, after);
  const kinds = network.requests.map(r => r.method + ' ' + new URL(r.path, r.origin).hostname);
  assert.ok(kinds.filter(k => k.startsWith('GET')).length >= 3, 'reads and history read went through the SDK');
  assert.ok(kinds.filter(k => k.startsWith('PUT')).length >= 2, 'backup and save went through the SDK');
  assertOnlyStaticToken(network);
});

test('T2/T3 image handler uses the static token for the published index and the image', async t => {
  setEnv(t, {BLOB_READ_WRITE_TOKEN: FAKE_TOKEN, ...OIDC_PRESENT});
  const backend = fakeBackend({'cms/content.json': CONTENT, 'cases/a.png': PNG});
  const network = offlineBlob(t, request => backend.handle(request));
  const res = response();
  await image(request({method: 'GET', query: {path: 'cases/a.png'}}), res);
  assert.equal(res.code, 200);
  assert.equal(network.requests.length, 2);
  assertOnlyStaticToken(network);
});

test('T2/T3 upload uses the static token', async t => {
  setEnv(t, {BLOB_READ_WRITE_TOKEN: FAKE_TOKEN, ...OIDC_PRESENT});
  const cookie = adminCookie(t);
  const backend = fakeBackend();
  const network = offlineBlob(t, request => backend.handle(request));
  const res = response();
  await upload(request({headers: {cookie}, body: {type: 'image/png', data: PNG.toString('base64')}}), res);
  assert.equal(res.code, 200);
  assert.match(res.body.pathname, /^cases\/\d+-[a-f0-9]{12}\.png$/);
  assert.equal(network.requests.length, 1);
  assert.equal(network.requests[0].method, 'PUT');
  assertOnlyStaticToken(network);
});

test('T2/T3 login rate limiter reads and writes with the static token', async t => {
  setEnv(t, {BLOB_READ_WRITE_TOKEN: FAKE_TOKEN, ...OIDC_PRESENT});
  const backend = fakeBackend();
  const network = offlineBlob(t, request => backend.handle(request));
  const req = request();
  assert.equal((await checkLoginThrottle(req)).allowed, true);
  assert.equal((await recordLoginFailure(req)).blocked, false);
  await clearLoginFailures(req);
  const methods = network.requests.map(r => r.method);
  assert.ok(methods.includes('GET') && methods.includes('PUT'));
  assert.ok(network.requests.every(r => !r.path.includes('203.0.113.7')), 'client IP is hashed, not sent');
  assertOnlyStaticToken(network);
});

// ---- T4: missing or invalid token never falls back to OIDC -----------------

for (const value of BAD_TOKENS) {
  test(`T4 no fallback to OIDC when BLOB_READ_WRITE_TOKEN is ${JSON.stringify(value)}`, async t => {
    setEnv(t, {...OIDC_PRESENT, ...(value === undefined ? {} : {BLOB_READ_WRITE_TOKEN: value})});
    const backend = fakeBackend({'cms/content.json': CONTENT, 'cases/a.png': PNG});
    const network = offlineBlob(t, request => backend.handle(request));

    await assert.rejects(contentStore.read(), error => error instanceof ContentError && error.status === 503);
    await assert.rejects(contentStore.save({version: 1, templateOverrides: {}, cases: []}, '"e1"', 'admin'),
      error => error instanceof ContentError && error.status === 503);

    const imageRes = response();
    await image(request({method: 'GET', query: {path: 'cases/a.png'}}), imageRes);
    assert.equal(imageRes.code, 404, 'image keeps its existing 404-on-failure behaviour');

    const cookie = adminCookie(t);
    // Existing behaviour kept: the upload handler does not catch storage errors (Vercel answers 500).
    await assert.rejects(upload(request({headers: {cookie}, body: {type: 'image/png', data: PNG.toString('base64')}}), response()), BlobConfigError);

    await assert.rejects(blob.get('x.json', {access: 'private'}), BlobConfigError);
    await assert.rejects(blob.put('x.json', 'x', {access: 'private'}), BlobConfigError);

    assert.equal(network.requests.length, 0, 'no request at all: neither OIDC nor any other credential was tried');
    assert.deepEqual(network.escaped, []);
  });
}

// ---- T5: rate limiter keeps failing open (recorded as a separate follow-up) --

test('T5 login rate limiter still fails open without a token (unchanged policy)', async t => {
  setEnv(t, OIDC_PRESENT);
  const network = offlineBlob(t, () => ({status: 500}));
  const req = request();
  assert.deepEqual(await checkLoginThrottle(req), {allowed: true, pathname: (await checkLoginThrottle(req)).pathname});
  assert.deepEqual(await recordLoginFailure(req), {blocked: false, retryAfter: 0});
  await clearLoginFailures(req);
  assert.equal(network.requests.length, 0);
});

// ---- T6: static guard against new unpinned Blob calls -----------------------

test('T6 only api/_blob-auth.js calls the Blob SDK, and it always applies the pinned token', () => {
  const dir = new URL('../api/', import.meta.url);
  const files = fs.readdirSync(dir).filter(file => file.endsWith('.js'));
  const SDK_CALLS = /\b(get|put|head|list|del|copy|createFolder|rename|getDownloadUrl|upload|handleUpload|presign\w*|createMultipartUpload|uploadPart|completeMultipartUpload|createMultipartUploader)\b/;
  for (const file of files) {
    const source = fs.readFileSync(new URL(file, dir), 'utf8');
    for (const match of source.matchAll(/import\s*\{([^}]*)\}\s*from\s*['"]@vercel\/blob(?:\/[^'"]*)?['"]/g)) {
      const names = match[1].split(',').map(part => part.trim().split(/\s+as\s+/)[0]).filter(Boolean);
      if (file === '_blob-auth.js') {
        assert.deepEqual(names.sort(), ['get', 'put'], '_blob-auth.js imports only get and put');
      } else {
        for (const name of names) {
          assert.ok(!SDK_CALLS.test(name) && /Error$/.test(name), `${file} imports only error classes from @vercel/blob (found ${name})`);
        }
      }
    }
    assert.doesNotMatch(source, /import\s+\*\s+as\s+\w+\s+from\s*['"]@vercel\/blob/, `${file} has no namespace import of the SDK`);
    assert.doesNotMatch(source, /import\(\s*['"]@vercel\/blob/, `${file} has no dynamic import of the SDK`);
    assert.doesNotMatch(source, /require\(\s*['"]@vercel\/blob/, `${file} has no require of the SDK`);
    if (file !== '_blob-auth.js') {
      assert.doesNotMatch(source, /BLOB_READ_WRITE_TOKEN|BLOB_STORE_ID|VERCEL_OIDC_TOKEN|oidcToken/, `${file} does not handle Blob credentials itself`);
    }
  }
  const auth = fs.readFileSync(new URL('_blob-auth.js', dir), 'utf8');
  const sdkCalls = [...auth.matchAll(/sdk\.(get|put)\(([^;]*)\)/g)];
  assert.equal(sdkCalls.length, 2);
  for (const call of sdkCalls) assert.match(call[2], new RegExp(`withToken\\('${call[1]}',options\\)\\)?$`), `sdk.${call[1]} passes withToken('${call[1]}',options)`);
  for (const file of ['_content-store.js', 'image.js', 'upload.js', '_rate-limit.js']) {
    assert.match(fs.readFileSync(new URL(file, dir), 'utf8'), /from '\.\/_blob-auth\.js'/, `${file} uses the pinned client`);
  }
});

// ---- T8: caller-supplied Authorization headers can never replace the pinned token ----

const HEADER_VARIANTS = [
  ['lower-case object key', () => ({authorization: 'Bearer vercel_blob_rw_Attacker000001_x'})],
  ['canonical object key', () => ({Authorization: 'Bearer vercel_blob_rw_Attacker000001_x'})],
  ['upper-case object key', () => ({AUTHORIZATION: 'Bearer vercel_blob_rw_Attacker000001_x'})],
  ['Headers instance', () => new Headers({Authorization: 'Bearer vercel_blob_rw_Attacker000001_x'})],
  ['array of pairs', () => [['authorization', 'Bearer vercel_blob_rw_Attacker000001_x']]],
  ['unrelated header', () => ({'x-custom': '1'})],
  ['empty object', () => ({})]
];

test('T8 control: the published SDK lets options.headers change its Authorization header in get()', async t => {
  setEnv(t, {BLOB_READ_WRITE_TOKEN: FAKE_TOKEN});
  const backend = fakeBackend({'probe.json': '{}'});
  const network = offlineBlob(t, request => backend.handle(request));
  const attacker = 'Bearer vercel_blob_rw_Attacker000001_x';
  // Same-case key: the caller's value replaces the SDK's own header outright.
  await sdkGet('probe.json', {access: 'private', useCache: false, token: FAKE_TOKEN, headers: {authorization: attacker}});
  // Different case: both values are sent, joined into one ambiguous header.
  await sdkGet('probe.json', {access: 'private', useCache: false, token: FAKE_TOKEN, headers: {Authorization: attacker}});
  assert.equal(network.requests.length, 2);
  assert.equal(network.requests[0].authorization, attacker, 'override exists in the SDK, so the wrapper must block it');
  assert.ok(network.requests[1].authorization.includes(attacker), 'a differently-cased header is still injected');
});

for (const [label, make] of HEADER_VARIANTS) {
  test(`T8 headers option (${label}) is rejected before any request, for get and put`, async t => {
    setEnv(t, {BLOB_READ_WRITE_TOKEN: FAKE_TOKEN, ...OIDC_PRESENT});
    const backend = fakeBackend({'probe.json': '{}'});
    const network = offlineBlob(t, request => backend.handle(request));
    await assert.rejects(blob.get('probe.json', {access: 'private', useCache: false, headers: make()}), BlobOptionError);
    await assert.rejects(blob.put('probe.json', '{}', {access: 'private', allowOverwrite: true, headers: make()}), BlobOptionError);
    assert.equal(network.requests.length, 0, 'nothing was sent');
    assert.deepEqual(network.escaped, []);
  });
}

test('T8 the same calls without headers go out with only the pinned token', async t => {
  setEnv(t, {BLOB_READ_WRITE_TOKEN: FAKE_TOKEN, ...OIDC_PRESENT});
  const backend = fakeBackend({'probe.json': '{}'});
  const network = offlineBlob(t, request => backend.handle(request));
  await blob.get('probe.json', {access: 'private', useCache: false});
  await blob.put('probe.json', '{}', {access: 'private', allowOverwrite: true});
  assert.equal(network.requests.length, 2);
  assertOnlyStaticToken(network);
});
