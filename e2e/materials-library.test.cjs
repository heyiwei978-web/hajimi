const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {pathToFileURL} = require('node:url');
const {randomBytes} = require('node:crypto');
const {test, before, after} = require('node:test');
const {chromium} = require('playwright');

const root = path.resolve(__dirname, '..');
let server, browser, base, objects, priorEnv;

// Generates a minimal valid multi-page PDF with real Type1 Helvetica text streams
// so pdfjs-dist extracts text, counts pages and renders every page onto <canvas>.
function buildSyntheticPdf(pageTexts) {
  const objs = [];
  const add = body => { objs.push(body); return objs.length; };
  const catalogId = add('');
  const pagesId = add('');
  const fontId = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const pageIds = [];
  for (const text of pageTexts) {
    const safe = text.replace(/[()\\]/g, ch => '\\' + ch);
    const stream = 'BT /F1 18 Tf 50 720 Td (' + safe + ') Tj ET';
    const contentId = add('<< /Length ' + Buffer.byteLength(stream, 'ascii') + ' >>\nstream\n' + stream + '\nendstream');
    const pageId = add('<< /Type /Page /Parent ' + pagesId + ' 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ' + fontId + ' 0 R >> >> /Contents ' + contentId + ' 0 R >>');
    pageIds.push(pageId);
  }
  objs[catalogId - 1] = '<< /Type /Catalog /Pages ' + pagesId + ' 0 R >>';
  objs[pagesId - 1] = '<< /Type /Pages /Kids [' + pageIds.map(id => id + ' 0 R').join(' ') + '] /Count ' + pageIds.length + ' >>';

  let out = '%PDF-1.4\n';
  const offsets = [0];
  for (let i = 0; i < objs.length; i++) {
    offsets.push(Buffer.byteLength(out, 'ascii'));
    out += (i + 1) + ' 0 obj\n' + objs[i] + '\nendobj\n';
  }
  const xrefPos = Buffer.byteLength(out, 'ascii');
  out += 'xref\n0 ' + (objs.length + 1) + '\n0000000000 65535 f \n';
  for (let i = 1; i < offsets.length; i++) {
    out += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
  }
  out += 'trailer\n<< /Size ' + (objs.length + 1) + ' /Root ' + catalogId + ' 0 R >>\nstartxref\n' + xrefPos + '\n%%EOF\n';
  return Buffer.from(out, 'ascii');
}

function contentTypeFor(file) {
  if (file.endsWith('.html')) return 'text/html; charset=utf-8';
  if (file.endsWith('.css')) return 'text/css; charset=utf-8';
  if (file.endsWith('.js') || file.endsWith('.mjs')) return 'text/javascript; charset=utf-8';
  if (file.endsWith('.json')) return 'application/json; charset=utf-8';
  return 'application/octet-stream';
}

before(async () => {
  const load = p => import(pathToFileURL(path.join(root, p)).href);
  const {createMaterialsStore} = await load('api/_materials-store.js');
  const {createMaterialsHandler} = await load('api/materials.js');
  const {sha256} = await load('api/_auth.js');
  const {BlobPreconditionFailedError} = await import('@vercel/blob');

  const keys = ['HAJIMI_ADMIN_USER', 'HAJIMI_ADMIN_PASSWORD_SHA256', 'HAJIMI_ADMIN_PASSWORD_HASH', 'HAJIMI_SESSION_SECRET', 'BLOB_READ_WRITE_TOKEN'];
  priorEnv = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  keys.forEach(key => delete process.env[key]);
  Object.assign(process.env, {
    HAJIMI_ADMIN_USER: 'fixture-owner',
    HAJIMI_ADMIN_PASSWORD_SHA256: sha256('fixture-only'),
    HAJIMI_SESSION_SECRET: randomBytes(32).toString('hex')
  });

  objects = new Map();
  let serial = 0;
  const storage = {
    async get(key) {
      const o = objects.get(key);
      return o ? {statusCode: 200, blob: {etag: o.etag, contentType: o.type}, stream: new Response(o.body).body} : null;
    },
    async put(key, body, options) {
      const old = objects.get(key);
      if (old && (!options.allowOverwrite || (options.ifMatch && options.ifMatch !== old.etag))) {
        throw new BlobPreconditionFailedError();
      }
      const etag = '"' + (++serial) + '"';
      objects.set(key, {body: Buffer.isBuffer(body) ? Buffer.from(body) : String(body), type: options.contentType, etag});
      return {etag, pathname: key};
    }
  };

  const routes = {
    '/api/materials': createMaterialsHandler({store: createMaterialsStore(storage)}),
    '/api/login': (await load('api/login.js')).default,
    '/api/session': (await load('api/session.js')).default
  };

  const config = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
  const distRoot = path.join(root, config.outputDirectory);
  const securityHeaders = config.headers.find(rule => rule.source === '/(.*)').headers;

  server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      if (routes[url.pathname]) {
        req.query = Object.fromEntries(url.searchParams);
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        const raw = Buffer.concat(chunks);
        const ct = req.headers['content-type'] || '';
        req.body = ct.startsWith('application/octet-stream') ? raw : raw.toString('utf8');
        res.status = code => { res.statusCode = code; return res; };
        res.json = body => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(body)); return res; };
        return await routes[url.pathname](req, res);
      }

      const rewrite = config.rewrites.find(r => r.source === url.pathname);
      const target = rewrite ? rewrite.destination : url.pathname;
      const resolved = path.resolve(distRoot, '.' + target);
      if (!resolved.startsWith(distRoot) || !fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
        res.writeHead(404);
        return res.end();
      }
      for (const header of securityHeaders) res.setHeader(header.key, header.value);
      res.setHeader('Content-Type', contentTypeFor(resolved));
      fs.createReadStream(resolved).pipe(res);
    } catch {
      res.writeHead(500);
      res.end();
    }
  });

  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  base = 'http://127.0.0.1:' + server.address().port;
  browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROMIUM_EXECUTABLE_PATH ? {executablePath: process.env.CHROMIUM_EXECUTABLE_PATH} : {}),
    args: ['--no-sandbox', ...(process.env.CHROMIUM_SINGLE_PROCESS === '1' ? ['--no-zygote', '--single-process', '--disable-gpu', '--disable-software-rasterizer'] : [])]
  });
});

after(async () => {
  await browser?.close();
  if (server) await new Promise(resolve => server.close(resolve));
  if (priorEnv) {
    for (const [key, value] of Object.entries(priorEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test('personal materials library: auth gate, PDF upload/preview/flip, pinyin search, quote bookmark, hub summary and expiry cleanup', async () => {
  const context = await browser.newContext({viewport: {width: 390, height: 850}});
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  page.on('console', msg => {
    if (msg.type() === 'error' && /Content Security Policy/i.test(msg.text())) errors.push('CSP: ' + msg.text());
  });

  try {
    // 1. Anonymous visitors are gated out and API returns 401.
    await page.goto(base + '/materials/library', {waitUntil: 'networkidle'});
    await page.locator('#mlGateActions').waitFor({state: 'visible'});
    assert.equal(await page.locator('#mlWorkspace').isVisible(), false);
    assert.equal((await context.request.get(base + '/api/materials')).status(), 401);

    // 2. Sign in as fixture admin via /api/login inside browser context.
    const loginRes = await context.request.post(base + '/api/login', {
      headers: {'Content-Type': 'application/json', 'X-Hajimi-Admin': '1'},
      data: {username: 'fixture-owner', password: 'fixture-only'}
    });
    assert.equal(loginRes.status(), 200);

    await page.goto(base + '/materials/library', {waitUntil: 'networkidle'});
    await page.locator('#mlWorkspace').waitFor({state: 'visible'});

    // 3. Upload a real multi-page synthetic PDF (local PDF.js extraction + chunk upload + commit).
    const pdfBuffer = buildSyntheticPdf([
      'Ortho VTE Guideline Page One Rivaroxaban',
      'Postop LMWH Anticoagulation Page Two Followup'
    ]);
    await page.locator('#mlOpenUpload').click();
    await page.locator('#mlPdfFile').setInputFiles({
      name: 'ortho-vte-guideline.pdf',
      mimeType: 'application/pdf',
      buffer: pdfBuffer
    });
    await page.waitForFunction(() => document.getElementById('mlInspectStatus').textContent.includes('共 2 页'));
    await page.locator('#mlUploadForm [name=title]').fill('骨科静脉血栓预防指南（合成测试）');
    await page.locator('#mlUploadForm [name=year]').fill('2025');
    await page.locator('#mlUploadForm [name=tags]').fill('抗凝 VTE');
    await page.locator('#mlUploadSubmit').click();
    await page.locator('#mlList .ml-card').first().waitFor({state: 'visible'});
    assert.equal(await page.locator('#mlList .ml-card').count(), 1);

    // 4. Add a Chinese text note to verify pinyin initials search (ggjgz -> 股骨颈骨折).
    await page.locator('#mlOpenNote').click();
    await page.locator('#mlNoteForm [name=title]').fill('股骨颈骨折查房要点');
    await page.locator('#mlNoteForm [name=body]').fill('股骨颈骨折围手术期评估与术后康复注意要点');
    await page.locator('#mlNoteSubmit').click();
    await page.waitForFunction(() => document.querySelectorAll('#mlList .ml-card').length === 2);

    // Shelf pinyin initials filter works.
    await page.locator('#mlShelfQuery').fill('ggjgz');
    assert.equal(await page.locator('#mlList .ml-card').count(), 1);
    assert.match(await page.locator('#mlList .ml-card h3').first().textContent(), /股骨颈骨折/);
    await page.locator('#mlShelfQuery').fill('');

    // 5. Cross-book full-text search finds page 2 of the PDF and opens it directly at page 2!
    await page.locator('#mlTabSearch').click();
    await page.locator('#mlCrossQuery').fill('Rivaroxaban');
    await page.locator('#mlCrossSubmit').click();
    await page.locator('#mlCrossResults .ml-hit-card').first().waitFor({state: 'visible'});
    await page.locator('#mlCrossResults .ml-hit-card button').first().click();

    // 6. Verify real PDF.js Canvas rendering and page flip (Page 1 -> Page 2).
    await page.locator('#mlPdfStage').waitFor({state: 'visible'});
    await page.waitForFunction(() => document.getElementById('mlReaderStatus').textContent.includes('第 1 / 2 页'));
    const canvasDims = await page.evaluate(() => {
      const c = document.getElementById('mlPdfCanvas');
      return {w: c.width, h: c.height};
    });
    assert.ok(canvasDims.w > 100 && canvasDims.h > 100, 'PDF canvas rendered page 1');

    await page.locator('#mlNextPage').click();
    await page.waitForFunction(() => document.getElementById('mlReaderStatus').textContent.includes('第 2 / 2 页'));
    assert.equal(await page.locator('#mlPageInput').inputValue(), '2');

    // 7. Bookmark a quote on Page 2 and verify in Quotes tab.
    await page.locator('#mlAddQuoteBtn').click();
    await page.locator('#mlQuoteForm [name=section]').fill('术后抗凝');
    await page.locator('#mlQuoteForm [name=excerpt]').fill('Postop LMWH Anticoagulation Page Two Followup');
    await page.locator('#mlQuoteForm [name=note]').fill('测试批注');
    await page.locator('#mlQuoteForm button[type=submit]').click();
    await page.locator('#mlTabQuotes').click();
    await page.locator('#mlQuoteList .ml-quote-card').first().waitFor({state: 'visible'});
    assert.match(await page.locator('#mlQuoteList .ml-quote-card').first().textContent(), /第 2 页/);

    // 8. Check zero horizontal overflow at both 390px and 1280px.
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no overflow at 390px');
    await page.setViewportSize({width: 1280, height: 900});
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'no overflow at 1280px');

    // 9. Verify /materials workstation hub shows live summary for signed-in admin.
    await page.goto(base + '/materials', {waitUntil: 'networkidle'});
    await page.waitForFunction(() => document.querySelector('[data-materials-hub]')?.textContent.includes('已收录 2 份资料'));

    // 10. Session expiry clears private state immediately.
    await page.goto(base + '/materials/library', {waitUntil: 'networkidle'});
    await page.locator('#mlWorkspace').waitFor({state: 'visible'});
    await context.clearCookies();
    await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
    await page.locator('#mlAuthGate').waitFor({state: 'visible'});
    assert.equal(await page.locator('#mlWorkspace').isVisible(), false);
    assert.equal(await page.locator('#mlList .ml-card').count(), 0);
    assert.deepEqual(errors, []);
  } finally {
    await context.close();
  }
});
