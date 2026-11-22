import {withMonitoring} from './_monitoring.js';
import {blob as blobClient} from './_blob-auth.js';
import {guardRequest} from './_security.js';
import {isAdmin} from './_auth.js';
import {contentStore} from './_content-store.js';

const PATH_PATTERN = /^cases\/[A-Za-z0-9_/-]+\.(?:jpe?g|png|webp)$/;
const PUBLIC_INDEX_TTL_MS = 60 * 1000;
// Answers that do not send the image body release the Blob download early.
const discard = stream => { try { stream?.cancel?.()?.catch?.(() => {}); } catch {} };

// Case images are clinical material: anonymous viewers may only load images that a
// published case references. Drafts, deleted cases and orphaned uploads stay admin-only.
export function createImageHandler({store = contentStore, blob = blobClient, now = () => Date.now()} = {}) {
  let cached = null;

  async function publishedImages() {
    if (cached && now() - cached.at < PUBLIC_INDEX_TTL_MS) return cached.paths;
    const current = await store.read();
    const paths = new Set();
    for (const item of current.data.cases) {
      if (item.published === false || !Array.isArray(item.images)) continue;
      for (const path of item.images) if (typeof path === 'string') paths.add(path);
    }
    cached = {at: now(), paths};
    return paths;
  }

  return async function handler(req, res) {
    if (!guardRequest(req, res, {methods: ['GET']})) return;
    const pathname = req.query.path;
    if (typeof pathname !== 'string' || !PATH_PATTERN.test(pathname) || pathname.includes('..')) return res.status(400).end();
    const admin = isAdmin(req);
    try {
      if (!admin && !(await publishedImages()).has(pathname)) return res.status(404).end();
      const result = await blob.get(pathname, {access: 'private', useCache: true});
      if (!result || result.statusCode !== 200) return res.status(404).end();
      const contentType = result.blob.contentType;
      if (!/^image\/(jpeg|png|webp)$/.test(contentType)) { discard(result.stream); return res.status(404).end(); }
      res.setHeader('X-Content-Type-Options', 'nosniff');
      // Browser-only caching: a shared/CDN copy would outlive unpublishing a case.
      res.setHeader('Cache-Control', admin ? 'private, no-store' : 'private, max-age=600');
      // Anonymous viewers revalidate after 10 minutes. The published check above has already run,
      // so an unchanged image answers 304 without sending its bytes again (2026-11-21).
      const etag = !admin && typeof result.blob.etag === 'string' && /^(?:W\/)?"[^"]{1,200}"$/.test(result.blob.etag) ? result.blob.etag.replace(/^W\//, '') : null;
      if (etag) {
        res.setHeader('ETag', etag);
        const candidates = String(req.headers['if-none-match'] || '').split(',').map(value => value.trim().replace(/^W\//, ''));
        if (candidates.includes(etag)) { discard(result.stream); return res.status(304).end(); }
      }
      const buffer = await new Response(result.stream).arrayBuffer();
      res.setHeader('Content-Type', contentType);
      return res.status(200).end(Buffer.from(buffer));
    } catch { return res.status(404).end(); }
  };
}

export default withMonitoring('image', createImageHandler());
