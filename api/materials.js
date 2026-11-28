import {withMonitoring} from './_monitoring.js';
import {readSession} from './_auth.js';
import {guardRequest} from './_security.js';
import {ContentError} from './_content-store.js';
import {CHUNK_SIZE, MAX_TEXT_PART_BYTES, materialsStore} from './_materials-store.js';

const METHODS = ['GET', 'POST', 'PUT', 'DELETE'];
const JSON_LARGE_LIMIT = MAX_TEXT_PART_BYTES + 100000;
const JSON_SMALL_LIMIT = 120000;

function queryValue(req, key) {
  const value = req.query?.[key];
  if (typeof value === 'string') return value;
  if (value !== undefined) return null;
  if (typeof req.url === 'string' && req.url.includes('?')) {
    const params = new URL(req.url, 'https://local.test').searchParams;
    const all = params.getAll(key);
    if (all.length > 1) return null;
    return all[0] ?? '';
  }
  return '';
}

function parseIntParam(raw) {
  if (typeof raw !== 'string' || !/^\d+$/.test(raw)) return null;
  const num = Number(raw);
  return Number.isSafeInteger(num) ? num : null;
}

async function readBinaryBody(req, maxBytes) {
  const declared = req.headers?.['content-length'];
  if (declared !== undefined && (!/^\d+$/.test(String(declared)) || Number(declared) > maxBytes)) {
    throw new ContentError(413, '单个分片不能超过 2 MB');
  }
  if (Buffer.isBuffer(req.body)) {
    if (req.body.length > maxBytes) throw new ContentError(413, '单个分片不能超过 2 MB');
    return req.body;
  }
  if (req.body instanceof Uint8Array) {
    if (req.body.byteLength > maxBytes) throw new ContentError(413, '单个分片不能超过 2 MB');
    return Buffer.from(req.body);
  }
  if (typeof req[Symbol.asyncIterator] === 'function') {
    const chunks = [];
    let total = 0;
    for await (const piece of req) {
      const buf = Buffer.isBuffer(piece) ? piece : Buffer.from(piece);
      total += buf.length;
      if (total > maxBytes) throw new ContentError(413, '单个分片不能超过 2 MB');
      chunks.push(buf);
    }
    return Buffer.concat(chunks, total);
  }
  throw new ContentError(400, '分片内容缺失');
}

export function createMaterialsHandler({store = materialsStore} = {}) {
  return async function handler(req, res) {
    const action = queryValue(req, 'action');
    const isBinaryUpload = req.method === 'POST' && action === 'upload-chunk';
    const isJsonWrite = (req.method === 'POST' && !isBinaryUpload) || req.method === 'PUT';
    const bodyLimit = (action === 'commit' || action === 'text-part') ? JSON_LARGE_LIMIT : JSON_SMALL_LIMIT;

    if (!guardRequest(req, res, {methods: METHODS, admin: true, json: isJsonWrite, bodyLimit})) return;
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    const user = readSession(req)?.u;
    if (!user) return res.status(401).json({error: '未登录或会话已失效'});
    if (action === null) return res.status(400).json({error: '请求参数格式错误'});

    try {
      if (req.method === 'GET') {
        if (action === 'chunk') {
          const id = queryValue(req, 'id');
          const index = parseIntParam(queryValue(req, 'index'));
          if (!id || index === null) return res.status(400).json({error: '分片参数无效'});
          const buffer = await store.readAuthorizedChunk(id, index);
          res.setHeader('Content-Type', 'application/octet-stream');
          return res.status(200).end(buffer);
        }
        if (action === 'text') {
          const id = queryValue(req, 'id');
          const partRaw = queryValue(req, 'part');
          const part = partRaw === '' ? 0 : parseIntParam(partRaw);
          if (!id || part === null) return res.status(400).json({error: '文本参数无效'});
          return res.status(200).json(await store.readAuthorizedText(id, part));
        }
        if (action !== '') return res.status(400).json({error: '不支持的读取操作'});
        const view = queryValue(req, 'view');
        if (view === 'summary') return res.status(200).json(await store.summary());
        const includeArchived = queryValue(req, 'includeArchived') === '1';
        return res.status(200).json(await store.listAll({includeArchived}));
      }

      if (req.method === 'POST') {
        if (action === 'upload-chunk') {
          const contentType = req.headers?.['content-type'] || '';
          if (!/^application\/octet-stream(?:\s*;|$)/i.test(contentType)) {
            return res.status(415).json({error: '分片上传仅支持 application/octet-stream'});
          }
          const id = queryValue(req, 'id');
          const index = parseIntParam(queryValue(req, 'index'));
          if (!id || index === null) return res.status(400).json({error: '分片参数无效'});
          const buffer = await readBinaryBody(req, CHUNK_SIZE);
          return res.status(201).json(await store.uploadChunk(id, index, buffer));
        }
        if (action === 'text-part') {
          return res.status(201).json(await store.saveTextPart(req.body.id, req.body.part, req.body.pages));
        }
        if (action === 'commit') {
          return res.status(201).json(await store.commitMaterial(req.body, user));
        }
        if (action === 'quote') {
          return res.status(201).json(await store.createQuote(req.body, user));
        }
        return res.status(400).json({error: '不支持的提交操作'});
      }

      if (req.method === 'PUT') {
        if (action === 'meta') {
          return res.status(200).json(await store.updateMaterial(req.body, user));
        }
        if (action === 'quote') {
          return res.status(200).json(await store.updateQuote(req.body, user));
        }
        return res.status(400).json({error: '不支持的更新操作'});
      }

      if (req.method === 'DELETE') {
        if (action !== 'quote') return res.status(400).json({error: '不支持的删除操作'});
        const id = queryValue(req, 'id');
        const revision = queryValue(req, 'revision');
        if (!id || revision === null) return res.status(400).json({error: '删除参数无效'});
        return res.status(200).json(await store.deleteQuote(id, revision, user));
      }

      return res.status(405).json({error: 'Method not allowed'});
    } catch (error) {
      return res.status(error instanceof ContentError ? error.status : 503).json({
        error: error instanceof ContentError ? error.message : '个人资料库服务暂不可用，请稍后重试'
      });
    }
  };
}

export default withMonitoring('materials', createMaterialsHandler());
