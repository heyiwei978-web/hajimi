import assert from 'node:assert/strict';
import test from 'node:test';
import {createHmac, randomBytes, randomUUID} from 'node:crypto';
import {BlobPreconditionFailedError} from '@vercel/blob';
import {createSession} from '../api/_auth.js';
import {createContentStore} from '../api/_content-store.js';
import {
  CHUNK_SIZE, INDEX_PATH, INDEX_HISTORY, QUOTES_PATH, QUOTES_HISTORY,
  MAX_FILE_BYTES, createMaterialsStore
} from '../api/_materials-store.js';
import {createMaterialsHandler} from '../api/materials.js';
import {createContentHandler} from '../api/content.js';
import {createImageHandler} from '../api/image.js';
import {createPrivateImageHandler} from '../api/private-image.js';

const PDF_CHUNK_0 = Buffer.concat([Buffer.from('%PDF-1.7\n1 0 obj\n<<>>\nendobj\n'), Buffer.alloc(64, 0x41)]);
const PDF_CHUNK_1 = Buffer.from('2 0 obj\n<<>>\nendobj\n%%EOF\n');

function res() {
  return {
    code: 200, headers: {}, body: undefined,
    setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
    status(n) { this.code = n; return this; },
    json(b) { this.body = b; return this; },
    end(b) { this.body = b; return this; }
  };
}

function req(cookie = '', extra = {}) {
  return {
    method: 'GET', query: {}, ...extra,
    headers: {
      host: 'local.test', 'x-forwarded-proto': 'https',
      'content-type': 'application/json', 'x-hajimi-admin': '1',
      cookie, ...extra.headers
    }
  };
}

function auth(t) {
  const keys = ['HAJIMI_SESSION_SECRET', 'HAJIMI_ADMIN_USER'];
  const prior = keys.map(k => process.env[k]);
  process.env.HAJIMI_SESSION_SECRET = randomBytes(32).toString('hex');
  process.env.HAJIMI_ADMIN_USER = 'materials-owner';
  t.after(() => keys.forEach((k, i) => {
    if (prior[i] === undefined) delete process.env[k];
    else process.env[k] = prior[i];
  }));
  return 'hajimi_session=' + createSession('materials-owner');
}

function fixture() {
  const objects = new Map(), calls = [];
  let serial = 0;
  const backend = {
    objects, calls, failBackup: false, failIndex: false, failGet: false,
    async get(path, options) {
      calls.push(['get', path, options]);
      assert.equal(options.access, 'private');
      if (backend.failGet) throw new Error('offline');
      const value = objects.get(path);
      return value
        ? {statusCode: 200, blob: {etag: value.etag, contentType: value.type}, stream: new Response(value.body).body}
        : null;
    },
    async put(path, body, options) {
      calls.push(['put', path, options]);
      assert.equal(options.access, 'private');
      if ((path.startsWith(INDEX_HISTORY) || path.startsWith(QUOTES_HISTORY)) && backend.failBackup) throw new Error('offline');
      if ((path === INDEX_PATH || path === QUOTES_PATH) && backend.failIndex) throw new Error('offline');
      const prior = objects.get(path);
      if (prior && (!options.allowOverwrite || (options.ifMatch && options.ifMatch !== prior.etag))) {
        throw new BlobPreconditionFailedError();
      }
      const etag = '"' + (++serial) + '"';
      objects.set(path, {body: Buffer.isBuffer(body) ? Buffer.from(body) : String(body), type: options.contentType, etag});
      return {etag, pathname: path};
    }
  };
  const store = createMaterialsStore(backend);
  const handler = createMaterialsHandler({store});
  return {backend, store, handler};
}

async function call(handler, cookie, extra = {}) {
  const out = res();
  await handler(req(cookie, extra), out);
  return out;
}

async function uploadPdfMaterial(f, cookie, id = randomUUID(), revision = 'missing') {
  const up0 = await call(f.handler, cookie, {
    method: 'POST', query: {action: 'upload-chunk', id, index: '0'},
    headers: {'content-type': 'application/octet-stream'}, body: PDF_CHUNK_0
  });
  assert.equal(up0.code, 201);
  const up1 = await call(f.handler, cookie, {
    method: 'POST', query: {action: 'upload-chunk', id, index: '1'},
    headers: {'content-type': 'application/octet-stream'}, body: PDF_CHUNK_1
  });
  assert.equal(up1.code, 201);
  const textUp = await call(f.handler, cookie, {
    method: 'POST', query: {action: 'text-part'},
    body: {
      id, part: 0,
      pages: [
        {page: 1, text: '髋关节置换围手术期抗凝指南要点', initials: 'kgjzhwssqkgznyd'},
        {page: 2, text: '术后低分子肝素与利伐沙班方案对比', initials: 'shdfzgsylfsbfadb'}
      ]
    }
  });
  assert.equal(textUp.code, 201);
  const commit = await call(f.handler, cookie, {
    method: 'POST', query: {action: 'commit'},
    body: {
      id, kind: 'pdf', revision,
      title: '骨科围手术期抗凝教学指南（测试）',
      author: '合成测试组',
      category: '指南',
      department: '骨科',
      year: 2025,
      tags: ['抗凝', 'TKA', '抗凝'],
      notes: '仅用于单元测试的合成指南',
      pageCount: 2,
      fileSize: PDF_CHUNK_0.length + PDF_CHUNK_1.length,
      chunkSize: PDF_CHUNK_0.length,
      chunkCount: 2,
      textPartsCount: 1,
      outline: [{title: '第一章 术前评估', page: 1, level: 0}, {title: '第二章 术后抗凝', page: 2, level: 1}]
    }
  });
  return {id, commit};
}

test('personal materials deny missing, forged, expired and wrong-user sessions before storage', async t => {
  const cookie = auth(t), f = fixture(), id = randomUUID();
  const expiredPayload = Buffer.from(JSON.stringify({u: 'materials-owner', exp: Date.now() - 1000})).toString('base64url');
  const expired = 'hajimi_session=' + expiredPayload + '.' + createHmac('sha256', process.env.HAJIMI_SESSION_SECRET).update(expiredPayload).digest('base64url');
  const tokens = ['', cookie + 'x', expired, 'hajimi_session=' + createSession('other-admin')];
  const calls = [
    {method: 'GET'},
    {method: 'GET', query: {view: 'summary'}},
    {method: 'GET', query: {action: 'chunk', id, index: '0'}},
    {method: 'GET', query: {action: 'text', id, part: '0'}},
    {method: 'POST', query: {action: 'upload-chunk', id, index: '0'}, headers: {'content-type': 'application/octet-stream'}, body: PDF_CHUNK_0},
    {method: 'POST', query: {action: 'commit'}, body: {id}},
    {method: 'PUT', query: {action: 'meta'}, body: {id}},
    {method: 'DELETE', query: {action: 'quote', id, revision: 'missing'}}
  ];
  for (const token of tokens) {
    for (const extra of calls) {
      const out = await call(f.handler, token, extra);
      assert.equal(out.code, 401);
      assert.match(out.headers['cache-control'], /no-store/);
    }
  }
  assert.equal(f.backend.calls.length, 0);
});

test('authenticated writes reject CSRF, missing admin marker, wrong content-type, bad PDF magic and oversized chunks', async t => {
  const cookie = auth(t), f = fixture(), id = randomUUID();
  const cases = [
    [{method: 'PATCH'}, 405],
    [{method: 'POST', query: {action: 'commit'}, headers: {origin: 'https://evil.example'}, body: {}}, 403],
    [{method: 'POST', query: {action: 'commit'}, headers: {'x-hajimi-admin': undefined}, body: {}}, 403],
    [{method: 'POST', query: {action: 'commit'}, headers: {'content-type': 'text/plain'}, body: '{}'}, 415],
    [{method: 'POST', query: {action: 'upload-chunk', id, index: '0'}, headers: {'content-type': 'application/json'}, body: {}}, 415],
    [{method: 'POST', query: {action: 'upload-chunk', id, index: '0'}, headers: {'content-type': 'application/octet-stream'}, body: Buffer.from('not-a-pdf')}, 400],
    [{method: 'POST', query: {action: 'upload-chunk', id: '../escape', index: '0'}, headers: {'content-type': 'application/octet-stream'}, body: PDF_CHUNK_0}, 400],
    [{method: 'POST', query: {action: 'upload-chunk', id, index: '0'}, headers: {'content-type': 'application/octet-stream', 'content-length': String(CHUNK_SIZE + 1)}, body: PDF_CHUNK_0}, 413],
    [{method: 'POST', query: {action: 'commit'}, body: {id, kind: 'pdf', title: 'x', category: '指南', department: '骨科', pageCount: 1, fileSize: MAX_FILE_BYTES + 1, chunkSize: CHUNK_SIZE, chunkCount: 51, revision: 'missing'}}, 400],
    [{method: 'POST', query: {action: 'commit'}, body: {id, kind: 'pdf', title: 'x', category: '指南', department: '骨科'}}, 428]
  ];
  for (const [extra, status] of cases) {
    const out = await call(f.handler, cookie, extra);
    assert.equal(out.code, status, JSON.stringify(extra.query || extra.method));
  }
  assert.equal(f.backend.calls.length, 0);
});

test('multi-chunk PDF upload, commit, chunk/text reads, metadata update, archive and isolation work end to end', async t => {
  const cookie = auth(t), f = fixture();
  const {id, commit} = await uploadPdfMaterial(f, cookie);
  assert.equal(commit.code, 201);
  assert.deepEqual(commit.body.item.tags, ['抗凝', 'TKA']);
  assert.equal(commit.body.item.chunkCount, 2);

  // Post-commit overwrite of raw PDF chunks is blocked.
  const overwrite = await call(f.handler, cookie, {
    method: 'POST', query: {action: 'upload-chunk', id, index: '0'},
    headers: {'content-type': 'application/octet-stream'}, body: PDF_CHUNK_0
  });
  assert.equal(overwrite.code, 409);

  // List & summary return the committed material and stats.
  const list = await call(f.handler, cookie, {method: 'GET'});
  assert.equal(list.code, 200);
  assert.equal(list.body.items.length, 1);
  assert.equal(list.body.stats.itemCount, 1);
  assert.equal(list.body.stats.totalPdfBytes, PDF_CHUNK_0.length + PDF_CHUNK_1.length);

  const summary = await call(f.handler, cookie, {method: 'GET', query: {view: 'summary'}});
  assert.equal(summary.code, 200);
  assert.equal(summary.body.recentReads.length, 1);
  assert.equal(summary.body.recentReads[0].id, id);

  // Authorized chunk & text downloads work with private no-store headers.
  const c0 = await call(f.handler, cookie, {method: 'GET', query: {action: 'chunk', id, index: '0'}});
  assert.equal(c0.code, 200);
  assert.deepEqual(c0.body, PDF_CHUNK_0);
  assert.equal(c0.headers['cache-control'], 'private, no-store');
  assert.equal(c0.headers['x-content-type-options'], 'nosniff');
  assert.equal(c0.headers['content-type'], 'application/octet-stream');

  const c1 = await call(f.handler, cookie, {method: 'GET', query: {action: 'chunk', id, index: '1'}});
  assert.equal(c1.code, 200);
  assert.deepEqual(c1.body, PDF_CHUNK_1);

  const oob = await call(f.handler, cookie, {method: 'GET', query: {action: 'chunk', id, index: '2'}});
  assert.equal(oob.code, 404);

  const text = await call(f.handler, cookie, {method: 'GET', query: {action: 'text', id, part: '0'}});
  assert.equal(text.code, 200);
  assert.equal(text.body.pages.length, 2);
  assert.match(text.body.pages[0].text, /抗凝/);

  // Update reading progress & metadata with ETag revision.
  const updated = await call(f.handler, cookie, {
    method: 'PUT', query: {action: 'meta'},
    body: {id, revision: commit.body.revision, lastPage: 2, lastReadAt: '2026-11-28T10:00:00.000Z', notes: '已核对第 2 页'}
  });
  assert.equal(updated.code, 200);
  assert.equal(updated.body.item.lastPage, 2);
  assert.equal(updated.body.item.notes, '已核对第 2 页');

  // Public CMS & image endpoints remain completely isolated from personal-materials/.
  const cmsOut = res();
  await createContentHandler(createContentStore(f.backend))(req(), cmsOut);
  assert.deepEqual(cmsOut.body.cases, []);
  const pubImg = res();
  await createImageHandler({store: createContentStore(f.backend), blob: f.backend})(req(cookie, {query: {path: 'personal-materials/chunks/' + id + '/0000.bin'}}), pubImg);
  assert.equal(pubImg.code, 400);
  const privImg = res();
  await createPrivateImageHandler({store: createContentStore(f.backend), blob: f.backend})(req(cookie, {query: {path: 'personal-materials/chunks/' + id + '/0000.bin'}}), privImg);
  assert.equal(privImg.code, 400);

  // Soft-archiving hides the material and blocks chunk/text reads.
  const archived = await call(f.handler, cookie, {
    method: 'PUT', query: {action: 'meta'},
    body: {id, revision: updated.body.revision, archived: true}
  });
  assert.equal(archived.code, 200);
  assert.equal((await call(f.handler, cookie, {method: 'GET'})).body.items.length, 0);
  assert.equal((await call(f.handler, cookie, {method: 'GET', query: {action: 'chunk', id, index: '0'}})).code, 404);
  assert.equal((await call(f.handler, cookie, {method: 'GET', query: {action: 'text', id, part: '0'}})).code, 404);
});

test('pure text note commit, orphan chunk denial and quotes CRUD with ETag checks work', async t => {
  const cookie = auth(t), f = fixture();
  const orphanId = randomUUID();
  f.backend.objects.set('personal-materials/chunks/' + orphanId + '/0000.bin', {body: PDF_CHUNK_0, type: 'application/octet-stream', etag: '"o1"'});
  assert.equal((await call(f.handler, cookie, {method: 'GET', query: {action: 'chunk', id: orphanId, index: '0'}})).code, 404);

  // Commit a pure text/Markdown note without PDF chunks.
  const noteId = randomUUID();
  const noteCommit = await call(f.handler, cookie, {
    method: 'POST', query: {action: 'commit'},
    body: {
      id: noteId, kind: 'note', revision: 'missing',
      title: '骨科查房笔记（合成）', category: '个人笔记', department: '骨科', year: 2026,
      tags: ['查房'], pageCount: 1,
      pages: [{page: 1, text: '术后 24 小时引流量评估要点', initials: 'shxsyllpgyd'}]
    }
  });
  assert.equal(noteCommit.code, 201);
  assert.equal(noteCommit.body.item.fileSize, 0);
  assert.equal((await call(f.handler, cookie, {method: 'GET', query: {action: 'text', id: noteId, part: '0'}})).body.pages[0].text, '术后 24 小时引流量评估要点');

  // Create, update and delete quote bookmarks with ETag concurrency protection.
  const qCreate = await call(f.handler, cookie, {
    method: 'POST', query: {action: 'quote'},
    body: {materialId: noteId, page: 1, section: '术后引流', excerpt: '术后 24 小时引流量评估要点', note: '重点关注', tags: ['引流'], quotesRevision: 'missing'}
  });
  assert.equal(qCreate.code, 201);
  const quoteId = qCreate.body.quote.id;
  assert.equal(qCreate.body.quote.materialTitle, '骨科查房笔记（合成）');

  // Stale quotesRevision fails with 409.
  const staleQuote = await call(f.handler, cookie, {
    method: 'PUT', query: {action: 'quote'},
    body: {id: quoteId, note: '冲突更新', quotesRevision: 'missing'}
  });
  assert.equal(staleQuote.code, 409);

  const qUpdate = await call(f.handler, cookie, {
    method: 'PUT', query: {action: 'quote'},
    body: {id: quoteId, note: '已更新批注', quotesRevision: qCreate.body.quotesRevision}
  });
  assert.equal(qUpdate.code, 200);
  assert.equal(qUpdate.body.quote.note, '已更新批注');

  const qDelete = await call(f.handler, cookie, {
    method: 'DELETE', query: {action: 'quote', id: quoteId, revision: qUpdate.body.quotesRevision}
  });
  assert.equal(qDelete.code, 200);
  assert.equal((await call(f.handler, cookie, {method: 'GET'})).body.quotes.length, 0);
});

test('stale revisions, concurrent commits and backup failures protect existing index', async t => {
  const cookie = auth(t), f = fixture();
  const first = await uploadPdfMaterial(f, cookie, randomUUID(), 'missing');
  assert.equal(first.commit.code, 201);
  const second = await uploadPdfMaterial(f, cookie, randomUUID(), 'missing');
  assert.equal(second.commit.code, 409);

  const concurrent = fixture();
  const idA = randomUUID(), idB = randomUUID();
  for (const id of [idA, idB]) {
    await call(concurrent.handler, cookie, {method: 'POST', query: {action: 'upload-chunk', id, index: '0'}, headers: {'content-type': 'application/octet-stream'}, body: PDF_CHUNK_0});
  }
  const commitBody = id => ({
    method: 'POST', query: {action: 'commit'},
    body: {id, kind: 'pdf', revision: 'missing', title: '并发测试 ' + id.slice(0, 6), category: '指南', department: '骨科', pageCount: 1, fileSize: PDF_CHUNK_0.length, chunkSize: PDF_CHUNK_0.length, chunkCount: 1, textPartsCount: 0}
  });
  const results = await Promise.all([call(concurrent.handler, cookie, commitBody(idA)), call(concurrent.handler, cookie, commitBody(idB))]);
  assert.deepEqual(results.map(r => r.code).sort(), [201, 409]);

  const broken = fixture();
  broken.backend.failBackup = true;
  const failed = await uploadPdfMaterial(broken, cookie);
  assert.equal(failed.commit.code, 503);
  assert.equal((await broken.store.readIndex()).revision, 'missing');
});
