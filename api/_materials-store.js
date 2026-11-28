import {randomUUID} from 'node:crypto';
import {BlobPreconditionFailedError} from '@vercel/blob';
import {blob} from './_blob-auth.js';
import {ContentError} from './_content-store.js';

// 个人资料库：仅管理员可读写，与公开 CMS、私人图片库、值班医嘱和 AI 私有病历完全隔离。
export const PREFIX = 'personal-materials/';
export const INDEX_PATH = PREFIX + 'index.json';
export const INDEX_HISTORY = PREFIX + 'history/index/';
export const QUOTES_PATH = PREFIX + 'quotes.json';
export const QUOTES_HISTORY = PREFIX + 'history/quotes/';
export const CHUNKS_PREFIX = PREFIX + 'chunks/';
export const TEXT_PREFIX = PREFIX + 'text/';
export const EMPTY_REVISION = 'missing';

export const CHUNK_SIZE = 2 * 1024 * 1024;
export const MAX_FILE_BYTES = 100 * 1024 * 1024;
export const MAX_CHUNKS = Math.ceil(MAX_FILE_BYTES / CHUNK_SIZE);
export const MAX_ITEMS = 200;
export const MAX_QUOTES = 2000;
export const MAX_PAGES = 5000;
export const TEXT_PAGES_PER_PART = 200;
export const MAX_TEXT_PARTS = Math.ceil(MAX_PAGES / TEXT_PAGES_PER_PART);
export const MAX_INDEX_BYTES = 1400000;
export const MAX_TEXT_PART_BYTES = 1400000;

export const CATEGORIES = Object.freeze(['指南', '共识', '教材书籍', '文献', '个人笔记']);
export const DEPARTMENTS = Object.freeze(['骨科', '普外科', '肾内科', '妇科', '内科', '外科', '通用']);
export const KINDS = Object.freeze(['pdf', 'note']);

export const UUID_RE = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const HISTORY_ID_RE = /^\d{13}-[a-f0-9-]{36}$/;
const PDF_MAGIC = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d]);

const isObject = value => !!value && typeof value === 'object' && !Array.isArray(value);
const strongEtag = etag => String(etag).replace(/^W\//, '');
const cleanText = (value, max) => typeof value === 'string' && value.length <= max;

export function isPdfMagic(buffer) {
  return Buffer.isBuffer(buffer) && buffer.length >= PDF_MAGIC.length
    && buffer.subarray(0, PDF_MAGIC.length).equals(PDF_MAGIC);
}

export function chunkPath(id, index) {
  if (!UUID_RE.test(id || '') || !Number.isInteger(index) || index < 0 || index >= MAX_CHUNKS) {
    throw new ContentError(400, '分片编号无效');
  }
  return CHUNKS_PREFIX + id + '/' + String(index).padStart(4, '0') + '.bin';
}

export function textPartPath(id, part) {
  if (!UUID_RE.test(id || '') || !Number.isInteger(part) || part < 0 || part >= MAX_TEXT_PARTS) {
    throw new ContentError(400, '文本分包编号无效');
  }
  return TEXT_PREFIX + id + '-p' + String(part).padStart(3, '0') + '.json';
}

function normalizeTags(tags, maxCount, status = 400) {
  if (tags === undefined) return [];
  if (!Array.isArray(tags) || tags.length > maxCount) {
    throw new ContentError(status, status === 400 ? '标签数量过多或格式错误' : '已保存标签格式异常');
  }
  const seen = new Set(), out = [];
  for (const raw of tags) {
    if (typeof raw !== 'string') throw new ContentError(status, status === 400 ? '标签格式错误' : '已保存标签格式异常');
    const tag = raw.trim();
    if (!tag) continue;
    if (tag.length > 24) throw new ContentError(status, status === 400 ? '单个标签最多 24 个字符' : '已保存标签格式异常');
    if (!seen.has(tag)) { seen.add(tag); out.push(tag); }
  }
  return out;
}

function normalizeOutline(outline, pageCount, status = 400) {
  if (outline === undefined) return [];
  if (!Array.isArray(outline) || outline.length > 1000) {
    throw new ContentError(status, status === 400 ? '目录条目过多或格式错误' : '已保存目录格式异常');
  }
  return outline.map(entry => {
    if (!isObject(entry) || !cleanText(entry.title, 160) || !entry.title.trim()
      || !Number.isInteger(entry.page) || entry.page < 1 || entry.page > Math.max(pageCount, 1)
      || (entry.level !== undefined && (!Number.isInteger(entry.level) || entry.level < 0 || entry.level > 6))) {
      throw new ContentError(status, status === 400 ? '目录格式错误' : '已保存目录格式异常');
    }
    return {title: entry.title.trim(), page: entry.page, level: entry.level ?? 0};
  });
}

function normalizeYear(year, status = 400) {
  if (year === undefined || year === null || year === '') return null;
  const num = Number(year);
  if (!Number.isInteger(num) || num < 1900 || num > 2100) {
    throw new ContentError(status, status === 400 ? '年份需在 1900–2100 之间' : '已保存年份格式异常');
  }
  return num;
}

export function validateTextPages(pages, status = 400) {
  if (!Array.isArray(pages) || pages.length > TEXT_PAGES_PER_PART) {
    throw new ContentError(status, status === 400 ? '单批页数过多或格式错误' : '已保存正文索引格式异常');
  }
  const clean = pages.map(entry => {
    if (!isObject(entry) || !Number.isInteger(entry.page) || entry.page < 1 || entry.page > MAX_PAGES
      || !cleanText(entry.text, 20000)
      || (entry.initials !== undefined && !cleanText(entry.initials, 12000))) {
      throw new ContentError(status, status === 400 ? '页面文本格式错误或单页超长' : '已保存正文索引格式异常');
    }
    return {
      page: entry.page,
      text: entry.text,
      ...(entry.initials ? {initials: entry.initials} : {})
    };
  });
  if (Buffer.byteLength(JSON.stringify(clean)) > MAX_TEXT_PART_BYTES) {
    throw new ContentError(413, '文本索引分包过大，请减少每批页数后重试');
  }
  return clean;
}

export function validateMaterialItem(item, status = 400) {
  const fail = message => { throw new ContentError(status, status === 400 ? message : '个人资料库索引格式异常，已停止修改'); };
  if (!isObject(item) || !UUID_RE.test(item.id || '')) fail('资料编号无效');
  if (!KINDS.includes(item.kind)) fail('资料类型仅支持 pdf 或 note');
  if (!cleanText(item.title, 160) || !item.title.trim()) fail('请填写资料标题（最多 160 字）');
  if (item.author !== undefined && !cleanText(item.author, 120)) fail('作者或发布机构最多 120 字');
  if (!CATEGORIES.includes(item.category)) fail('请选择有效的资料分类');
  if (!DEPARTMENTS.includes(item.department)) fail('请选择有效的科室归属');
  const year = normalizeYear(item.year, status);
  const tags = normalizeTags(item.tags, 12, status);
  if (item.notes !== undefined && !cleanText(item.notes, 4000)) fail('资料摘要或备注最多 4000 字');
  if (!Number.isInteger(item.pageCount) || item.pageCount < 1 || item.pageCount > MAX_PAGES) fail('页数无效');
  if (!Number.isInteger(item.textParts) || item.textParts < 0 || item.textParts > MAX_TEXT_PARTS) fail('文本分包数量无效');

  let fileSize = 0, chunkCount = 0, chunkSize = 0;
  if (item.kind === 'pdf') {
    if (!Number.isInteger(item.fileSize) || item.fileSize < 1 || item.fileSize > MAX_FILE_BYTES) fail('PDF 大小需在 1 字节至 100 MB 之间');
    if (!Number.isInteger(item.chunkSize) || item.chunkSize < 1 || item.chunkSize > CHUNK_SIZE) fail('分片大小无效');
    const expectedChunks = Math.ceil(item.fileSize / item.chunkSize);
    if (!Number.isInteger(item.chunkCount) || item.chunkCount !== expectedChunks || item.chunkCount > MAX_CHUNKS) fail('PDF 分片数量与文件大小不匹配');
    fileSize = item.fileSize;
    chunkCount = item.chunkCount;
    chunkSize = item.chunkSize;
  }

  const outline = normalizeOutline(item.outline, item.pageCount, status);
  const lastPage = item.lastPage === undefined || item.lastPage === null ? 1 : item.lastPage;
  if (!Number.isInteger(lastPage) || lastPage < 1 || lastPage > item.pageCount) fail('最近阅读页码无效');
  if (item.lastReadAt !== undefined && item.lastReadAt !== null && !cleanText(item.lastReadAt, 40)) fail('阅读时间格式错误');
  if (!cleanText(item.createdAt, 40) || !item.createdAt) fail('创建时间格式错误');
  if (item.updatedAt !== undefined && !cleanText(item.updatedAt, 40)) fail('更新时间格式错误');

  return {
    id: item.id,
    kind: item.kind,
    title: item.title.trim(),
    author: (item.author || '').trim(),
    category: item.category,
    department: item.department,
    year,
    tags,
    notes: (item.notes || '').trim(),
    pageCount: item.pageCount,
    fileSize,
    chunkCount,
    chunkSize,
    textParts: item.textParts,
    scanned: Boolean(item.scanned),
    outline,
    lastPage,
    lastReadAt: item.lastReadAt || null,
    archived: Boolean(item.archived),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt || item.createdAt
  };
}

export function validateQuote(quote, status = 400) {
  const fail = message => { throw new ContentError(status, status === 400 ? message : '引用收藏格式异常，已停止修改'); };
  if (!isObject(quote) || !UUID_RE.test(quote.id || '') || !UUID_RE.test(quote.materialId || '')) fail('引用或资料编号无效');
  if (!cleanText(quote.materialTitle, 160) || !quote.materialTitle.trim()) fail('引用出处标题无效');
  const year = normalizeYear(quote.year, status);
  if (!Number.isInteger(quote.page) || quote.page < 1 || quote.page > MAX_PAGES) fail('引用页码无效');
  if (quote.section !== undefined && !cleanText(quote.section, 160)) fail('章节名最多 160 字');
  if (!cleanText(quote.excerpt, 3000) || !quote.excerpt.trim()) fail('请填写摘录正文（最多 3000 字）');
  if (quote.note !== undefined && !cleanText(quote.note, 2000)) fail('批注最多 2000 字');
  const tags = normalizeTags(quote.tags, 8, status);
  if (!cleanText(quote.createdAt, 40) || !quote.createdAt) fail('创建时间格式错误');
  if (quote.updatedAt !== undefined && !cleanText(quote.updatedAt, 40)) fail('更新时间格式错误');
  return {
    id: quote.id,
    materialId: quote.materialId,
    materialTitle: quote.materialTitle.trim(),
    year,
    page: quote.page,
    section: (quote.section || '').trim(),
    excerpt: quote.excerpt.trim(),
    note: (quote.note || '').trim(),
    tags,
    createdAt: quote.createdAt,
    updatedAt: quote.updatedAt || quote.createdAt
  };
}

function createVersionedListStore(storage, {currentPath, historyPrefix, listKey, validateItem, maxItems, emptyLabel}) {
  async function read() {
    let result;
    try { result = await storage.get(currentPath, {access: 'private', useCache: false}); }
    catch { throw new ContentError(503, emptyLabel + '读取失败，请稍后重试'); }
    if (result === null) return {items: [], revision: EMPTY_REVISION, history: [], updatedAt: null};
    if (result?.statusCode !== 200 || !result.blob?.etag) throw new ContentError(503, emptyLabel + '读取失败，已停止修改');
    let document;
    try { document = JSON.parse(await new Response(result.stream).text()); }
    catch { throw new ContentError(503, '已保存' + emptyLabel + '无法解析，已停止修改'); }
    if (!isObject(document) || !Array.isArray(document[listKey])) {
      throw new ContentError(503, '已保存' + emptyLabel + '格式异常，已停止修改');
    }
    const items = document[listKey].map(entry => validateItem(entry, 503));
    const history = document._history || [];
    if (!Array.isArray(history) || history.some(entry => !isObject(entry) || !HISTORY_ID_RE.test(entry.id))) {
      throw new ContentError(503, emptyLabel + '修改历史格式异常，已停止修改');
    }
    return {items, revision: strongEtag(result.blob.etag), history, updatedAt: document._updatedAt || null};
  }

  async function snapshot(current, user, action) {
    const now = new Date().toISOString();
    const id = Date.now() + '-' + randomUUID();
    const metadata = {id, createdAt: now, user, action, count: current.items.length};
    try {
      await storage.put(historyPrefix + id + '.json', JSON.stringify({metadata, [listKey]: current.items}), {
        access: 'private', addRandomSuffix: false, allowOverwrite: false, contentType: 'application/json; charset=utf-8'
      });
    } catch {
      throw new ContentError(503, '自动备份失败，已停止保存；现有资料未被修改');
    }
    return metadata;
  }

  async function save(items, revision, user, action = 'save', current = null) {
    if (typeof revision !== 'string' || !revision) throw new ContentError(428, '请先刷新页面再保存，避免覆盖已有资料');
    if (!Array.isArray(items)) throw new ContentError(400, emptyLabel + '格式错误');
    const clean = items.map(entry => validateItem(entry, 400));
    const activeCount = clean.filter(entry => !entry.archived).length;
    if (activeCount > maxItems) throw new ContentError(413, emptyLabel + '已达 ' + maxItems + ' 条上限');
    const payload = {version: 1, [listKey]: clean};
    if (Buffer.byteLength(JSON.stringify(payload)) > MAX_INDEX_BYTES) throw new ContentError(413, emptyLabel + '数据过大');
    current = current || await read();
    if (revision !== current.revision) throw new ContentError(409, emptyLabel + '已在其他页面更新，请刷新后重试');
    const backup = await snapshot(current, user, action);
    const history = [backup, ...current.history].slice(0, 50);
    const updatedAt = new Date().toISOString();
    const document = {...payload, _history: history, _updatedAt: updatedAt};
    let result;
    try {
      result = await storage.put(currentPath, JSON.stringify(document), {
        access: 'private', addRandomSuffix: false, allowOverwrite: current.revision !== EMPTY_REVISION,
        ...(current.revision !== EMPTY_REVISION ? {ifMatch: current.revision} : {}),
        contentType: 'application/json; charset=utf-8'
      });
    } catch (error) {
      if (error instanceof BlobPreconditionFailedError) throw new ContentError(409, emptyLabel + '已在其他页面更新，本次修改未保存');
      throw new ContentError(503, '保存失败，请稍后重试；修改前的资料已备份');
    }
    if (!result?.etag) throw new ContentError(503, '保存结果待确认，请刷新页面核对后再操作');
    return {items: clean, revision: strongEtag(result.etag), history, updatedAt};
  }

  return {read, save};
}

export function createMaterialsStore(storage = blob) {
  const indexStore = createVersionedListStore(storage, {
    currentPath: INDEX_PATH, historyPrefix: INDEX_HISTORY, listKey: 'items',
    validateItem: validateMaterialItem, maxItems: MAX_ITEMS, emptyLabel: '个人资料库'
  });
  const quotesStore = createVersionedListStore(storage, {
    currentPath: QUOTES_PATH, historyPrefix: QUOTES_HISTORY, listKey: 'quotes',
    validateItem: validateQuote, maxItems: MAX_QUOTES, emptyLabel: '引用收藏'
  });

  async function readChunkBlob(path) {
    let result;
    try { result = await storage.get(path, {access: 'private', useCache: false}); }
    catch { throw new ContentError(503, '资料文件读取失败，请稍后重试'); }
    if (!result || result.statusCode !== 200) return null;
    return Buffer.from(await new Response(result.stream).arrayBuffer());
  }

  async function uploadChunk(id, index, buffer) {
    if (!UUID_RE.test(id || '')) throw new ContentError(400, '资料编号无效');
    if (!Number.isInteger(index) || index < 0 || index >= MAX_CHUNKS) throw new ContentError(400, '分片序号超出上限');
    if (!Buffer.isBuffer(buffer) || buffer.length < 1) throw new ContentError(400, '分片内容不能为空');
    if (buffer.length > CHUNK_SIZE) throw new ContentError(413, '单个分片不能超过 2 MB');
    if (index === 0 && !isPdfMagic(buffer)) throw new ContentError(400, '仅支持有效的 PDF 文件');

    const current = await indexStore.read();
    if (current.items.some(item => item.id === id)) {
      throw new ContentError(409, '该资料已入库，不能覆盖原始 PDF 分片');
    }
    const pathname = chunkPath(id, index);
    try {
      await storage.put(pathname, buffer, {
        access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/octet-stream'
      });
    } catch {
      throw new ContentError(503, '分片保存失败，请重试当前分片');
    }
    return {id, index, size: buffer.length};
  }

  async function saveTextPart(id, part, pages) {
    if (!UUID_RE.test(id || '')) throw new ContentError(400, '资料编号无效');
    if (!Number.isInteger(part) || part < 0 || part >= MAX_TEXT_PARTS) throw new ContentError(400, '文本分包编号无效');
    const clean = validateTextPages(pages, 400);
    const current = await indexStore.read();
    const existing = current.items.find(item => item.id === id);
    if (existing && existing.kind !== 'note') {
      throw new ContentError(409, '该资料已入库，不能直接覆盖文本分包');
    }
    const pathname = textPartPath(id, part);
    try {
      await storage.put(pathname, JSON.stringify({id, part, pages: clean}), {
        access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json; charset=utf-8'
      });
    } catch {
      throw new ContentError(503, '文本索引保存失败，请稍后重试');
    }
    return {id, part, count: clean.length};
  }

  async function commitMaterial(body, user) {
    if (!isObject(body)) throw new ContentError(400, '请求数据格式错误');
    const revision = body.revision;
    if (typeof revision !== 'string' || !revision) throw new ContentError(428, '请先加载资料库后再提交');

    const id = body.id;
    if (!UUID_RE.test(id || '')) throw new ContentError(400, '资料编号无效');

    const kind = body.kind || 'pdf';
    const hasInlinePages = Array.isArray(body.pages);
    let textParts = hasInlinePages ? 1 : Number(body.textPartsCount ?? 0);
    if (!Number.isInteger(textParts) || textParts < 0 || textParts > MAX_TEXT_PARTS) {
      throw new ContentError(400, '文本分包数量无效');
    }
    if (kind === 'note' && !hasInlinePages && textParts < 1) {
      throw new ContentError(400, '个人笔记需要至少 1 页正文');
    }

    const now = new Date().toISOString();
    const item = validateMaterialItem({
      id,
      kind,
      title: body.title,
      author: body.author || '',
      category: body.category,
      department: body.department,
      year: body.year,
      tags: body.tags || [],
      notes: body.notes || '',
      pageCount: body.pageCount ?? (hasInlinePages ? Math.max(body.pages.length, 1) : 1),
      fileSize: kind === 'pdf' ? body.fileSize : 0,
      chunkCount: kind === 'pdf' ? body.chunkCount : 0,
      chunkSize: kind === 'pdf' ? (body.chunkSize || CHUNK_SIZE) : 0,
      textParts,
      scanned: Boolean(body.scanned),
      outline: body.outline || [],
      lastPage: 1,
      lastReadAt: null,
      archived: false,
      createdAt: now,
      updatedAt: now
    }, 400);
    const cleanInlinePages = hasInlinePages ? validateTextPages(body.pages, 400) : null;

    const current = await indexStore.read();
    if (revision !== current.revision) throw new ContentError(409, '个人资料库已在其他页面更新，请刷新后重试');
    if (current.items.some(entry => entry.id === id)) throw new ContentError(409, '该资料编号已存在，请勿重复提交');

    if (item.kind === 'pdf') {
      const firstChunk = await readChunkBlob(chunkPath(item.id, 0));
      if (!firstChunk || !isPdfMagic(firstChunk)) {
        throw new ContentError(400, '未找到有效的 PDF 首页分片，请重新上传');
      }
      if (item.chunkCount > 1) {
        const lastChunk = await readChunkBlob(chunkPath(item.id, item.chunkCount - 1));
        if (!lastChunk || !lastChunk.length) {
          throw new ContentError(400, 'PDF 分片上传不完整，请补传后再提交');
        }
      }
    }

    if (cleanInlinePages) {
      try {
        await storage.put(textPartPath(item.id, 0), JSON.stringify({id: item.id, part: 0, pages: cleanInlinePages}), {
          access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json; charset=utf-8'
        });
      } catch {
        throw new ContentError(503, '文本索引写入失败，请稍后重试');
      }
    } else if (item.textParts > 0) {
      let exists;
      try { exists = await storage.get(textPartPath(item.id, 0), {access: 'private', useCache: false}); }
      catch { throw new ContentError(503, '文本索引核验失败，请稍后重试'); }
      if (!exists || exists.statusCode !== 200) {
        throw new ContentError(400, '文本索引分包缺失，请重新提交');
      }
    }

    const saved = await indexStore.save([item, ...current.items], revision, user, 'commit', current);
    return {item, revision: saved.revision};
  }

  async function updateMaterial(body, user) {
    if (!isObject(body) || !UUID_RE.test(body.id || '')) throw new ContentError(400, '资料编号无效');
    const revision = body.revision;
    if (typeof revision !== 'string' || !revision) throw new ContentError(428, '请刷新后再更新资料');
    const current = await indexStore.read();
    if (revision !== current.revision) throw new ContentError(409, '个人资料库已在其他页面更新，请刷新后重试');
    const idx = current.items.findIndex(entry => entry.id === body.id);
    if (idx < 0) throw new ContentError(404, '资料不存在');
    const prior = current.items[idx];
    const now = new Date().toISOString();
    const updated = validateMaterialItem({
      ...prior,
      ...(body.title !== undefined ? {title: body.title} : {}),
      ...(body.author !== undefined ? {author: body.author} : {}),
      ...(body.category !== undefined ? {category: body.category} : {}),
      ...(body.department !== undefined ? {department: body.department} : {}),
      ...(body.year !== undefined ? {year: body.year} : {}),
      ...(body.tags !== undefined ? {tags: body.tags} : {}),
      ...(body.notes !== undefined ? {notes: body.notes} : {}),
      ...(body.outline !== undefined ? {outline: body.outline} : {}),
      ...(body.lastPage !== undefined ? {lastPage: body.lastPage} : {}),
      ...(body.lastReadAt !== undefined ? {lastReadAt: body.lastReadAt} : {}),
      ...(body.archived !== undefined ? {archived: Boolean(body.archived)} : {}),
      updatedAt: now
    }, 400);
    const next = [...current.items];
    next[idx] = updated;
    const saved = await indexStore.save(next, revision, user, body.archived ? 'archive' : 'update', current);
    return {item: updated, revision: saved.revision};
  }

  async function readAuthorizedChunk(id, index) {
    if (!UUID_RE.test(id || '') || !Number.isInteger(index) || index < 0 || index >= MAX_CHUNKS) {
      throw new ContentError(400, '分片参数无效');
    }
    const current = await indexStore.read();
    const item = current.items.find(entry => entry.id === id && !entry.archived && entry.kind === 'pdf');
    if (!item || index >= item.chunkCount) throw new ContentError(404, '资料分片不存在');
    const buffer = await readChunkBlob(chunkPath(id, index));
    if (!buffer) throw new ContentError(404, '资料分片不存在');
    return buffer;
  }

  async function readAuthorizedText(id, part) {
    if (!UUID_RE.test(id || '') || !Number.isInteger(part) || part < 0 || part >= MAX_TEXT_PARTS) {
      throw new ContentError(400, '文本参数无效');
    }
    const current = await indexStore.read();
    const item = current.items.find(entry => entry.id === id && !entry.archived);
    if (!item || part >= item.textParts) throw new ContentError(404, '资料正文索引不存在');
    let result;
    try { result = await storage.get(textPartPath(id, part), {access: 'private', useCache: false}); }
    catch { throw new ContentError(503, '正文索引读取失败，请稍后重试'); }
    if (!result || result.statusCode !== 200) throw new ContentError(404, '资料正文索引不存在');
    let parsed;
    try { parsed = JSON.parse(await new Response(result.stream).text()); }
    catch { throw new ContentError(503, '正文索引格式异常'); }
    return {id, part, pages: validateTextPages(parsed?.pages, 503)};
  }

  async function createQuote(body, user) {
    if (!isObject(body)) throw new ContentError(400, '引用数据格式错误');
    const revision = body.quotesRevision ?? body.revision;
    if (typeof revision !== 'string' || !revision) throw new ContentError(428, '请先加载引用列表再收藏');
    const [indexState, quotesState] = await Promise.all([indexStore.read(), quotesStore.read()]);
    if (revision !== quotesState.revision) throw new ContentError(409, '引用收藏已在其他页面更新，请刷新后重试');
    const material = indexState.items.find(entry => entry.id === body.materialId && !entry.archived);
    if (!material) throw new ContentError(404, '对应的资料不存在或已归档');
    const now = new Date().toISOString();
    const quote = validateQuote({
      id: body.id && UUID_RE.test(body.id) ? body.id : randomUUID(),
      materialId: material.id,
      materialTitle: material.title,
      year: material.year,
      page: body.page,
      section: body.section || '',
      excerpt: body.excerpt,
      note: body.note || '',
      tags: body.tags || [],
      createdAt: now,
      updatedAt: now
    }, 400);
    if (quotesState.items.some(entry => entry.id === quote.id)) throw new ContentError(409, '引用编号已存在');
    const saved = await quotesStore.save([quote, ...quotesState.items], revision, user, 'create-quote', quotesState);
    return {quote, quotesRevision: saved.revision};
  }

  async function updateQuote(body, user) {
    if (!isObject(body) || !UUID_RE.test(body.id || '')) throw new ContentError(400, '引用编号无效');
    const revision = body.quotesRevision ?? body.revision;
    if (typeof revision !== 'string' || !revision) throw new ContentError(428, '请刷新后再编辑引用');
    const quotesState = await quotesStore.read();
    if (revision !== quotesState.revision) throw new ContentError(409, '引用收藏已在其他页面更新，请刷新后重试');
    const idx = quotesState.items.findIndex(entry => entry.id === body.id);
    if (idx < 0) throw new ContentError(404, '引用收藏不存在');
    const prior = quotesState.items[idx];
    const updated = validateQuote({
      ...prior,
      ...(body.page !== undefined ? {page: body.page} : {}),
      ...(body.section !== undefined ? {section: body.section} : {}),
      ...(body.excerpt !== undefined ? {excerpt: body.excerpt} : {}),
      ...(body.note !== undefined ? {note: body.note} : {}),
      ...(body.tags !== undefined ? {tags: body.tags} : {}),
      updatedAt: new Date().toISOString()
    }, 400);
    const next = [...quotesState.items];
    next[idx] = updated;
    const saved = await quotesStore.save(next, revision, user, 'update-quote', quotesState);
    return {quote: updated, quotesRevision: saved.revision};
  }

  async function deleteQuote(id, revision, user) {
    if (!UUID_RE.test(id || '')) throw new ContentError(400, '引用编号无效');
    if (typeof revision !== 'string' || !revision) throw new ContentError(428, '请刷新后再删除引用');
    const quotesState = await quotesStore.read();
    if (revision !== quotesState.revision) throw new ContentError(409, '引用收藏已在其他页面更新，请刷新后重试');
    if (!quotesState.items.some(entry => entry.id === id)) throw new ContentError(404, '引用收藏不存在');
    const next = quotesState.items.filter(entry => entry.id !== id);
    const saved = await quotesStore.save(next, revision, user, 'delete-quote', quotesState);
    return {deletedId: id, quotesRevision: saved.revision};
  }

  async function listAll({includeArchived = false} = {}) {
    const [indexState, quotesState] = await Promise.all([indexStore.read(), quotesStore.read()]);
    const active = indexState.items.filter(item => !item.archived);
    const items = includeArchived ? indexState.items : active;
    const totalPdfBytes = active.reduce((sum, item) => sum + (item.kind === 'pdf' ? item.fileSize : 0), 0);
    return {
      items,
      quotes: quotesState.items,
      revision: indexState.revision,
      quotesRevision: quotesState.revision,
      stats: {
        itemCount: active.length,
        maxItems: MAX_ITEMS,
        quoteCount: quotesState.items.length,
        maxQuotes: MAX_QUOTES,
        totalPdfBytes,
        maxFileBytes: MAX_FILE_BYTES,
        chunkSize: CHUNK_SIZE
      }
    };
  }

  async function summary() {
    const data = await listAll({includeArchived: false});
    const recentReads = [...data.items]
      .sort((a, b) => String(b.lastReadAt || b.createdAt).localeCompare(String(a.lastReadAt || a.createdAt)))
      .slice(0, 4)
      .map(({id, title, category, department, year, pageCount, lastPage, lastReadAt, kind}) =>
        ({id, title, category, department, year, pageCount, lastPage, lastReadAt, kind}));
    const recentQuotes = data.quotes.slice(0, 3);
    return {stats: data.stats, recentReads, recentQuotes};
  }

  return {
    readIndex: indexStore.read,
    readQuotes: quotesStore.read,
    listAll,
    summary,
    uploadChunk,
    saveTextPart,
    commitMaterial,
    updateMaterial,
    readAuthorizedChunk,
    readAuthorizedText,
    createQuote,
    updateQuote,
    deleteQuote
  };
}

export const materialsStore = createMaterialsStore();
