(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const CHUNK_SIZE = 2 * 1024 * 1024;
  const MAX_FILE_BYTES = 100 * 1024 * 1024;
  const TEXT_PAGES_PER_PART = 200;

  const state = {
    authenticated: false,
    items: [],
    quotes: [],
    revision: 'missing',
    quotesRevision: 'missing',
    stats: null,
    view: 'shelf',
    activeItem: null,
    activePage: 1,
    activeHighlight: '',
    pdfController: null,
    textCache: new Map(),
    uploadDraft: null,
    progressTimer: 0
  };

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function showToast(message) {
    const toast = $('mlToast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove('show'), 2600);
  }

  function setBannerError(message) {
    const node = $('mlErrorBanner');
    if (!node) return;
    node.textContent = message || '';
    node.hidden = !message;
  }

  function formatBytes(bytes) {
    if (!bytes) return '0 MB';
    if (bytes < 1024 * 1024) return Math.max(1, Math.round(bytes / 1024)) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function parseTags(raw) {
    return [...new Set(String(raw || '').split(/[\s,，;；]+/).map(s => s.trim()).filter(Boolean))];
  }

  function formatCitation(quote) {
    const year = quote.year ? '（' + quote.year + '）' : '';
    const section = quote.section ? '，' + quote.section : '';
    return '《' + quote.materialTitle + '》' + year + '，第 ' + quote.page + ' 页' + section + '：“' + quote.excerpt + '”';
  }

  async function copyText(text) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const area = document.createElement('textarea');
    area.value = text;
    document.body.append(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    if (!ok) throw new Error('copy failed');
  }

  function appendHighlighted(parent, text, query) {
    const source = String(text || '');
    const api = window.HAJIMI_ECG_SEARCH;
    const rawTerms = api ? api.terms(query) : String(query || '').toLowerCase().split(/\s+/).filter(Boolean);
    const terms = rawTerms.filter(t => t.length >= 2 || /[\u3400-\u9fff]/.test(t));
    if (!terms.length) {
      parent.append(document.createTextNode(source));
      return;
    }
    const lower = source.toLowerCase();
    if (lower.length !== source.length) {
      parent.append(document.createTextNode(source));
      return;
    }
    const marks = new Array(source.length).fill(false);
    for (const term of terms) {
      let at = lower.indexOf(term);
      while (at >= 0) {
        for (let i = at; i < at + term.length; i++) marks[i] = true;
        at = lower.indexOf(term, at + term.length);
      }
    }
    let idx = 0;
    while (idx < source.length) {
      const marked = marks[idx];
      let end = idx + 1;
      while (end < source.length && marks[end] === marked) end++;
      const segment = source.slice(idx, end);
      parent.append(marked ? el('mark', 'ml-mark', segment) : document.createTextNode(segment));
      idx = end;
    }
  }

  function matchesQuery(text, initialsList, query) {
    const api = window.HAJIMI_ECG_SEARCH;
    const terms = api ? api.terms(query) : String(query || '').toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return true;
    const hay = String(text || '').toLowerCase();
    const pinyinStr = (Array.isArray(initialsList) ? initialsList.join(' ') : String(initialsList || '')).toLowerCase();
    return terms.every(term => hay.includes(term) || (/^[a-z]{2,}$/.test(term) && pinyinStr.includes(term)));
  }

  function snippetFor(text, query) {
    const api = window.HAJIMI_ECG_SEARCH;
    if (api?.snippet) return api.snippet(text, query, 48);
    const s = String(text || '');
    return s.length > 110 ? s.slice(0, 110) + '…' : s;
  }

  async function apiFetch(url, options = {}) {
    const headers = {...(options.headers || {})};
    if (options.method && options.method !== 'GET') headers['X-Hajimi-Admin'] = '1';
    const res = await fetch(url, {credentials: 'same-origin', cache: 'no-store', ...options, headers});
    if (res.status === 401) {
      clearPrivateState('管理员会话已失效，请重新登录。');
      throw new Error('未登录或会话已失效');
    }
    return res;
  }

  async function clearPrivateState(message) {
    clearTimeout(state.progressTimer);
    if (state.pdfController) {
      const ctrl = state.pdfController;
      state.pdfController = null;
      await ctrl.destroy();
    }
    state.authenticated = false;
    state.items = [];
    state.quotes = [];
    state.activeItem = null;
    state.textCache.clear();
    state.uploadDraft = null;
    $('mlList').replaceChildren();
    $('mlCrossResults').replaceChildren();
    $('mlQuoteList').replaceChildren();
    $('mlTextLayer').replaceChildren();
    $('mlNoteStage').replaceChildren();
    const canvas = $('mlPdfCanvas');
    if (canvas) { canvas.width = 1; canvas.height = 1; }
    $('mlWorkspace').hidden = true;
    $('mlAuthGate').hidden = false;
    $('mlGateMessage').textContent = message || '个人资料库仅管理员登录后可见，数据隔离存放在私有存储中。';
    $('mlGateActions').hidden = false;
  }

  function setView(view) {
    state.view = view;
    $('mlShelfView').hidden = view !== 'shelf';
    $('mlSearchView').hidden = view !== 'search';
    $('mlQuotesView').hidden = view !== 'quotes';
    $('mlReaderView').hidden = view !== 'reader';
    for (const btn of document.querySelectorAll('[data-ml-view]')) {
      btn.setAttribute('aria-pressed', String(btn.dataset.mlView === view));
    }
  }

  function setAsideTab(name) {
    $('mlAsideOutline').hidden = name !== 'outline';
    $('mlAsideFind').hidden = name !== 'find';
    $('mlAsideQuotes').hidden = name !== 'book-quotes';
    for (const btn of document.querySelectorAll('[data-aside-tab]')) {
      btn.setAttribute('aria-pressed', String(btn.dataset.asideTab === name));
    }
  }

  function renderStats() {
    const stats = state.stats || {};
    $('mlStatItems').textContent = (stats.itemCount ?? state.items.length) + ' / ' + (stats.maxItems || 200);
    $('mlStatQuotes').textContent = String(stats.quoteCount ?? state.quotes.length);
    $('mlStatSize').textContent = formatBytes(stats.totalPdfBytes || 0);

    const yearSelect = $('mlFilterYear');
    const priorYear = yearSelect.value;
    const years = [...new Set(state.items.map(i => i.year).filter(Boolean))].sort((a, b) => b - a);
    yearSelect.replaceChildren(el('option', '', '全部年份'));
    yearSelect.firstChild.value = '';
    for (const y of years) {
      const opt = el('option', '', String(y));
      opt.value = String(y);
      yearSelect.append(opt);
    }
    yearSelect.value = years.includes(Number(priorYear)) ? priorYear : '';

    const matSelect = $('mlQuoteFilterMaterial');
    const priorMat = matSelect.value;
    matSelect.replaceChildren(el('option', '', '全部资料'));
    matSelect.firstChild.value = '';
    for (const item of state.items) {
      const opt = el('option', '', item.title);
      opt.value = item.id;
      matSelect.append(opt);
    }
    matSelect.value = state.items.some(i => i.id === priorMat) ? priorMat : '';
  }

  function renderShelf() {
    const query = $('mlShelfQuery').value.trim();
    const category = $('mlFilterCategory').value;
    const department = $('mlFilterDepartment').value;
    const year = $('mlFilterYear').value;
    const pinyin = window.HAJIMI_PINYIN_INITIALS;

    const filtered = state.items.filter(item => {
      if (category && item.category !== category) return false;
      if (department && item.department !== department) return false;
      if (year && String(item.year || '') !== year) return false;
      if (!query) return true;
      const combined = [item.title, item.author, item.category, item.department, item.notes,
        ...(item.tags || []), ...(item.outline || []).map(o => o.title)].join(' ');
      const initials = pinyin ? pinyin.initialsOf(item.title).concat(pinyin.textInitials(combined, 800)) : [];
      return matchesQuery(combined, initials, query);
    });

    $('mlShelfCount').textContent = filtered.length + ' 份资料';
    const list = $('mlList');
    list.replaceChildren();
    $('mlShelfEmpty').hidden = filtered.length > 0;

    for (const item of filtered) {
      const card = el('article', 'ml-card');
      const badges = el('div', 'ml-card-badges');
      badges.append(el('span', 'ml-badge', item.category), el('span', 'ml-badge ml-badge-muted', item.department));
      if (item.year) badges.append(el('span', 'ml-badge ml-badge-muted', String(item.year)));
      if (item.kind === 'pdf') badges.append(el('span', 'ml-badge ml-badge-muted', 'PDF · ' + formatBytes(item.fileSize)));
      else badges.append(el('span', 'ml-badge ml-badge-muted', '文本笔记'));
      if (item.scanned) badges.append(el('span', 'ml-badge ml-badge-muted', '扫描版'));

      const title = el('h3', '', item.title);
      const metaParts = [item.author || '', '共 ' + item.pageCount + ' 页', '上次读到第 ' + (item.lastPage || 1) + ' 页'].filter(Boolean);
      const meta = el('p', 'ml-card-meta', metaParts.join(' · '));
      card.append(badges, title, meta);

      if (item.tags?.length) {
        const tagRow = el('div', 'ml-card-badges');
        for (const tag of item.tags) tagRow.append(el('span', 'ml-badge ml-badge-muted', '#' + tag));
        card.append(tagRow);
      }
      if (item.notes) card.append(el('p', 'ml-card-notes', item.notes));

      const actions = el('div', 'ml-card-actions');
      const openBtn = el('button', 'ml-btn ml-btn-primary', item.lastReadAt ? '继续阅读（第 ' + item.lastPage + ' 页）' : '打开阅读');
      openBtn.type = 'button';
      openBtn.addEventListener('click', () => openMaterial(item, item.lastPage || 1));

      const editBtn = el('button', 'ml-btn ml-btn-ghost', '编辑信息');
      editBtn.type = 'button';
      editBtn.addEventListener('click', () => openMetaDialog(item));

      actions.append(openBtn, editBtn);
      card.append(actions);
      list.append(card);
    }
  }

  function renderQuotesList(container, quotes, {compact = false} = {}) {
    container.replaceChildren();
    if (!quotes.length) {
      if (compact) container.append(el('p', 'ml-empty', '本书暂无引用收藏。'));
      return;
    }
    for (const quote of quotes) {
      const card = el('article', 'ml-quote-card');
      const head = el('div', 'ml-quote-head');
      const titleText = compact
        ? ('第 ' + quote.page + ' 页' + (quote.section ? ' · ' + quote.section : ''))
        : ('《' + quote.materialTitle + '》' + (quote.year ? '（' + quote.year + '）' : '') + ' · 第 ' + quote.page + ' 页' + (quote.section ? ' · ' + quote.section : ''));
      head.append(el('strong', 'ml-quote-source', titleText));
      card.append(head, el('p', 'ml-quote-excerpt', quote.excerpt));
      if (quote.note) card.append(el('p', 'ml-quote-note', '批注：' + quote.note));
      if (quote.tags?.length) {
        const tagRow = el('div', 'ml-card-badges');
        for (const tag of quote.tags) tagRow.append(el('span', 'ml-badge ml-badge-muted', '#' + tag));
        card.append(tagRow);
      }
      const actions = el('div', 'ml-card-actions');
      const locateBtn = el('button', 'ml-btn ml-btn-primary', '定位第 ' + quote.page + ' 页');
      locateBtn.type = 'button';
      locateBtn.addEventListener('click', () => {
        const target = state.items.find(i => i.id === quote.materialId);
        if (target) openMaterial(target, quote.page, quote.excerpt.slice(0, 24));
        else showToast('对应资料已归档或不在列表中');
      });

      const copyBtn = el('button', 'ml-btn ml-btn-ghost', '复制引用');
      copyBtn.type = 'button';
      copyBtn.addEventListener('click', async () => {
        try {
          await copyText(formatCitation(quote));
          showToast('已复制带出处的引用文本');
        } catch {
          showToast('复制失败，请手动复制');
        }
      });

      const editBtn = el('button', 'ml-btn ml-btn-ghost', '编辑');
      editBtn.type = 'button';
      editBtn.addEventListener('click', () => openQuoteDialog({quote}));

      const delBtn = el('button', 'ml-btn ml-btn-danger', '删除');
      delBtn.type = 'button';
      delBtn.addEventListener('click', () => deleteQuote(quote));

      actions.append(locateBtn, copyBtn, editBtn, delBtn);
      card.append(actions);
      container.append(card);
    }
  }

  function renderQuotesView() {
    const query = $('mlQuoteFilterQuery').value.trim();
    const materialId = $('mlQuoteFilterMaterial').value;
    const pinyin = window.HAJIMI_PINYIN_INITIALS;

    const filtered = state.quotes.filter(quote => {
      if (materialId && quote.materialId !== materialId) return false;
      if (!query) return true;
      const combined = [quote.materialTitle, quote.section, quote.excerpt, quote.note, ...(quote.tags || [])].join(' ');
      const initials = pinyin ? pinyin.textInitials(combined, 1000) : '';
      return matchesQuery(combined, initials, query);
    });
    $('mlQuotesCount').textContent = filtered.length + ' 条引用';
    $('mlQuotesEmpty').hidden = filtered.length > 0;
    renderQuotesList($('mlQuoteList'), filtered);
  }

  async function ensureItemText(item) {
    if (state.textCache.has(item.id)) return state.textCache.get(item.id);
    if (!item.textParts) {
      state.textCache.set(item.id, []);
      return [];
    }
    const allPages = [];
    for (let part = 0; part < item.textParts; part++) {
      const res = await apiFetch('/api/materials?action=text&id=' + encodeURIComponent(item.id) + '&part=' + part);
      if (!res.ok) continue;
      const data = await res.json();
      if (Array.isArray(data.pages)) allPages.push(...data.pages);
    }
    state.textCache.set(item.id, allPages);
    return allPages;
  }

  async function runCrossBookSearch(query) {
    const q = String(query || '').trim();
    const results = $('mlCrossResults');
    results.replaceChildren();
    if (!q) {
      $('mlCrossStatus').textContent = '';
      $('mlCrossEmpty').hidden = false;
      return;
    }
    $('mlCrossEmpty').hidden = true;
    $('mlCrossStatus').textContent = '正在检索 ' + state.items.length + ' 份资料的正文…';

    const hits = [];
    for (let i = 0; i < state.items.length; i++) {
      const item = state.items[i];
      const pages = await ensureItemText(item);
      for (const page of pages) {
        if (matchesQuery(page.text, page.initials || '', q)) {
          hits.push({item, page: page.page, text: page.text});
          if (hits.length >= 120) break;
        }
      }
      if (hits.length >= 120) break;
    }

    $('mlCrossStatus').textContent = '找到 ' + hits.length + ' 处命中' + (hits.length >= 120 ? '（显示前 120 条）' : '');
    if (!hits.length) {
      results.append(el('p', 'ml-empty', '未在已提取的正文中找到“' + q + '”。扫描版 PDF 的正文需手动补充备注后检索。'));
      return;
    }
    for (const hit of hits) {
      const card = el('article', 'ml-hit-card');
      const head = el('div', 'ml-hit-head');
      head.append(
        el('strong', 'ml-hit-title', hit.item.title),
        el('span', 'ml-badge', '第 ' + hit.page + ' 页')
      );
      const snippet = el('p', 'ml-hit-snippet');
      appendHighlighted(snippet, snippetFor(hit.text, q), q);
      const btn = el('button', 'ml-btn ml-btn-primary', '打开并定位到第 ' + hit.page + ' 页');
      btn.type = 'button';
      btn.addEventListener('click', () => openMaterial(hit.item, hit.page, q));
      card.append(head, snippet, btn);
      results.append(card);
    }
  }

  function renderOutline(item) {
    const box = $('mlAsideOutline');
    box.replaceChildren();
    if (!item.outline?.length) {
      box.append(el('p', 'ml-empty', '本资料未包含书签目录，可直接使用顶部页码跳转或页内搜索。'));
      return;
    }
    for (const entry of item.outline) {
      const btn = el('button', 'ml-outline-btn' + (entry.level > 0 ? ' ml-outline-sub' : ''));
      btn.type = 'button';
      btn.append(el('span', '', entry.title), el('span', 'ml-count', 'P.' + entry.page));
      btn.addEventListener('click', () => goToPage(entry.page));
      box.append(btn);
    }
  }

  function renderBookQuotes(item) {
    const list = state.quotes.filter(q => q.materialId === item.id);
    renderQuotesList($('mlAsideQuotes'), list, {compact: true});
  }

  async function runInBookSearch(query) {
    const item = state.activeItem;
    const container = $('mlInBookHits');
    container.replaceChildren();
    if (!item) return;
    const q = String(query || '').trim();
    if (!q) {
      $('mlInBookStatus').textContent = '';
      state.activeHighlight = '';
      renderCurrentPage();
      return;
    }
    $('mlInBookStatus').textContent = '搜索中…';
    const pages = await ensureItemText(item);
    const hits = pages.filter(p => matchesQuery(p.text, p.initials || '', q));
    $('mlInBookStatus').textContent = '本书命中 ' + hits.length + ' 页';
    if (!hits.length) {
      container.append(el('p', 'ml-empty', '本书未找到匹配内容。'));
      return;
    }
    for (const hit of hits.slice(0, 80)) {
      const btn = el('button', 'ml-inbook-hit');
      btn.type = 'button';
      btn.append(el('strong', '', '第 ' + hit.page + ' 页'));
      const p = el('span', '');
      appendHighlighted(p, snippetFor(hit.text, q), q);
      btn.append(p);
      btn.addEventListener('click', () => {
        state.activeHighlight = q;
        goToPage(hit.page);
      });
      container.append(btn);
    }
  }

  function scheduleSaveProgress(item, page) {
    clearTimeout(state.progressTimer);
    if (item.lastPage === page && item.lastReadAt) return;
    state.progressTimer = setTimeout(async () => {
      if (!state.authenticated || state.activeItem?.id !== item.id) return;
      try {
        const res = await apiFetch('/api/materials?action=meta', {
          method: 'PUT',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            id: item.id,
            revision: state.revision,
            lastPage: page,
            lastReadAt: new Date().toISOString()
          })
        });
        if (res.ok) {
          const data = await res.json();
          state.revision = data.revision;
          const idx = state.items.findIndex(x => x.id === item.id);
          if (idx >= 0) state.items[idx] = data.item;
          state.activeItem = data.item;
        }
      } catch {}
    }, 900);
  }

  async function renderCurrentPage() {
    const item = state.activeItem;
    if (!item) return;
    const page = Math.min(Math.max(1, state.activePage), item.pageCount);
    state.activePage = page;
    $('mlPageInput').value = String(page);
    $('mlPageInput').max = String(item.pageCount);
    $('mlPageTotal').textContent = '/ ' + item.pageCount;
    $('mlPrevPage').disabled = page <= 1;
    $('mlNextPage').disabled = page >= item.pageCount;
    $('mlSelectionBar').hidden = true;

    const url = new URL(location.href);
    url.searchParams.set('id', item.id);
    url.searchParams.set('page', String(page));
    history.replaceState(history.state, '', url.pathname + url.search);

    const api = window.HAJIMI_ECG_SEARCH;
    const highlightTerms = state.activeHighlight
      ? (api ? api.terms(state.activeHighlight) : [state.activeHighlight])
      : [];

    if (item.kind === 'pdf') {
      $('mlPdfStage').hidden = false;
      $('mlNoteStage').hidden = true;
      if (!state.pdfController) return;
      $('mlReaderStatus').textContent = '正在渲染第 ' + page + ' / ' + item.pageCount + ' 页…';
      try {
        await state.pdfController.renderPage(page, {
          canvas: $('mlPdfCanvas'),
          textLayer: $('mlTextLayer'),
          zoom: $('mlZoomSelect').value,
          containerWidth: $('mlStage').clientWidth || window.innerWidth,
          highlightTerms
        });
        $('mlReaderStatus').textContent = '第 ' + page + ' / ' + item.pageCount + ' 页'
          + (item.scanned ? '（扫描版 PDF，无内置文字层）' : '（可直接划词选中存为引用）');
      } catch {
        $('mlReaderStatus').textContent = '第 ' + page + ' 页渲染失败，请刷新或重试。';
      }
    } else {
      $('mlPdfStage').hidden = true;
      $('mlNoteStage').hidden = false;
      $('mlReaderStatus').textContent = '正在加载第 ' + page + ' 页…';
      const pages = await ensureItemText(item);
      const entry = pages.find(p => p.page === page) || pages[page - 1];
      const stage = $('mlNoteStage');
      stage.replaceChildren();
      appendHighlighted(stage, entry ? entry.text : '（本页为空）', state.activeHighlight);
      $('mlReaderStatus').textContent = '第 ' + page + ' / ' + item.pageCount + ' 页（文本笔记）';
    }

    scheduleSaveProgress(item, page);
  }

  function goToPage(page) {
    if (!state.activeItem) return;
    const next = Math.min(Math.max(1, Number(page) || 1), state.activeItem.pageCount);
    state.activePage = next;
    renderCurrentPage();
  }

  async function openMaterial(item, page = 1, highlightQuery = '') {
    setBannerError('');
    if (state.pdfController) {
      await state.pdfController.destroy();
      state.pdfController = null;
    }
    state.activeItem = item;
    state.activePage = Math.min(Math.max(1, Number(page) || 1), item.pageCount);
    state.activeHighlight = highlightQuery || '';
    $('mlTabReader').hidden = false;
    $('mlReaderTitle').textContent = item.title;
    $('mlReaderSubtitle').textContent = [item.category, item.department, item.year || '', item.author || ''].filter(Boolean).join(' · ');
    $('mlDownloadPdfBtn').hidden = item.kind !== 'pdf';
    $('mlZoomSelect').hidden = item.kind !== 'pdf';
    $('mlInBookQuery').value = highlightQuery || '';
    renderOutline(item);
    renderBookQuotes(item);
    setView('reader');
    setAsideTab(highlightQuery ? 'find' : 'outline');

    if (item.kind === 'pdf') {
      $('mlReaderStatus').textContent = '正在按需载入 PDF 分片…';
      try {
        state.pdfController = await window.HAJIMI_MATERIALS_PDF.openChunkedPdf({
          fileSize: item.fileSize,
          chunkSize: item.chunkSize,
          chunkCount: item.chunkCount,
          fetchChunk: async index => {
            const res = await apiFetch('/api/materials?action=chunk&id=' + encodeURIComponent(item.id) + '&index=' + index);
            if (!res.ok) throw new Error('分片读取失败');
            return new Uint8Array(await res.arrayBuffer());
          }
        });
      } catch (err) {
        $('mlReaderStatus').textContent = 'PDF 载入失败：' + (err?.message || '请刷新重试');
        return;
      }
    }
    await renderCurrentPage();
    if (highlightQuery) runInBookSearch(highlightQuery);
  }

  function currentSectionForPage(item, page) {
    if (!item?.outline?.length) return '';
    let matched = '';
    for (const entry of item.outline) {
      if (entry.page <= page) matched = entry.title;
      else break;
    }
    return matched;
  }

  function openMetaDialog(item) {
    const form = $('mlMetaForm');
    form.elements.id.value = item.id;
    form.elements.title.value = item.title;
    form.elements.author.value = item.author || '';
    form.elements.year.value = item.year || '';
    form.elements.category.value = item.category;
    form.elements.department.value = item.department;
    form.elements.tags.value = (item.tags || []).join(' ');
    form.elements.notes.value = item.notes || '';
    $('mlMetaError').hidden = true;
    $('mlMetaDialog').showModal();
  }

  function openQuoteDialog({quote = null, item = null, page = 1, excerpt = ''} = {}) {
    const form = $('mlQuoteForm');
    $('mlQuoteError').hidden = true;
    if (quote) {
      $('mlQuoteTitle').textContent = '编辑引用收藏';
      form.elements.id.value = quote.id;
      form.elements.materialId.value = quote.materialId;
      form.elements.page.value = String(quote.page);
      form.elements.section.value = quote.section || '';
      form.elements.excerpt.value = quote.excerpt;
      form.elements.note.value = quote.note || '';
      form.elements.tags.value = (quote.tags || []).join(' ');
      $('mlQuoteSourceLabel').textContent = '出处：《' + quote.materialTitle + '》';
    } else {
      const target = item || state.activeItem;
      if (!target) return;
      $('mlQuoteTitle').textContent = '收藏引用';
      form.elements.id.value = '';
      form.elements.materialId.value = target.id;
      form.elements.page.value = String(page || state.activePage || 1);
      form.elements.section.value = currentSectionForPage(target, page || state.activePage || 1);
      form.elements.excerpt.value = excerpt || '';
      form.elements.note.value = '';
      form.elements.tags.value = '';
      $('mlQuoteSourceLabel').textContent = '出处：《' + target.title + '》' + (target.year ? '（' + target.year + '）' : '');
    }
    $('mlQuoteDialog').showModal();
  }

  async function deleteQuote(quote) {
    if (!window.confirm('确认删除这条来自《' + quote.materialTitle + '》第 ' + quote.page + ' 页的引用收藏？')) return;
    try {
      const res = await apiFetch(
        '/api/materials?action=quote&id=' + encodeURIComponent(quote.id) + '&revision=' + encodeURIComponent(state.quotesRevision),
        {method: 'DELETE'}
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '删除失败');
      state.quotesRevision = data.quotesRevision;
      state.quotes = state.quotes.filter(q => q.id !== quote.id);
      if (state.stats) state.stats.quoteCount = state.quotes.length;
      renderStats();
      renderQuotesView();
      if (state.activeItem) renderBookQuotes(state.activeItem);
      showToast('已删除引用收藏');
    } catch (err) {
      setBannerError(err.message);
    }
  }

  async function loadLibrary({preserveView = false} = {}) {
    setBannerError('');
    try {
      const res = await apiFetch('/api/materials');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '资料库加载失败');
      state.items = data.items || [];
      state.quotes = data.quotes || [];
      state.revision = data.revision || 'missing';
      state.quotesRevision = data.quotesRevision || 'missing';
      state.stats = data.stats || null;
      renderStats();
      renderShelf();
      renderQuotesView();
      if (state.activeItem) {
        const refreshed = state.items.find(i => i.id === state.activeItem.id);
        if (refreshed) {
          state.activeItem = refreshed;
          renderBookQuotes(refreshed);
        }
      }
      if (!preserveView) {
        const params = new URLSearchParams(location.search);
        const deepId = params.get('id');
        const deepPage = Number(params.get('page')) || 1;
        const deepQuery = params.get('q') || '';
        const found = deepId && state.items.find(i => i.id === deepId);
        if (found) await openMaterial(found, deepPage, deepQuery);
        else if (deepQuery) {
          setView('search');
          $('mlCrossQuery').value = deepQuery;
          await runCrossBookSearch(deepQuery);
        } else setView('shelf');
      }
    } catch (err) {
      setBannerError(err.message);
    }
  }

  async function checkSession(initial = false) {
    try {
      const res = await fetch('/api/session', {credentials: 'same-origin', cache: 'no-store'});
      const session = res.ok ? await res.json() : null;
      if (!session?.authenticated) {
        await clearPrivateState('个人资料库仅管理员登录后可见，数据隔离存放在私有存储中。');
        return;
      }
      if (!state.authenticated) {
        state.authenticated = true;
        $('mlAuthGate').hidden = true;
        $('mlWorkspace').hidden = false;
        await loadLibrary({preserveView: !initial});
      }
    } catch {
      if (initial) await clearPrivateState('无法验证管理员会话，请刷新页面重试。');
    }
  }

  function bindEvents() {
    for (const btn of document.querySelectorAll('[data-ml-view]')) {
      btn.addEventListener('click', () => setView(btn.dataset.mlView));
    }
    for (const btn of document.querySelectorAll('[data-aside-tab]')) {
      btn.addEventListener('click', () => setAsideTab(btn.dataset.asideTab));
    }
    for (const btn of document.querySelectorAll('[data-close-dialog]')) {
      btn.addEventListener('click', () => $(btn.dataset.closeDialog)?.close());
    }

    $('mlRefreshBtn').addEventListener('click', () => loadLibrary({preserveView: true}));
    $('mlOpenUpload').addEventListener('click', () => {
      state.uploadDraft = null;
      $('mlUploadForm').reset();
      $('mlInspectStatus').textContent = '';
      $('mlUploadProgress').textContent = '';
      $('mlUploadError').hidden = true;
      $('mlUploadSubmit').disabled = true;
      $('mlUploadDialog').showModal();
    });
    $('mlOpenNote').addEventListener('click', () => {
      $('mlNoteForm').reset();
      $('mlNoteError').hidden = true;
      $('mlNoteDialog').showModal();
    });

    for (const id of ['mlShelfQuery', 'mlFilterCategory', 'mlFilterDepartment', 'mlFilterYear']) {
      $(id).addEventListener('input', renderShelf);
      $(id).addEventListener('change', renderShelf);
    }
    for (const id of ['mlQuoteFilterQuery', 'mlQuoteFilterMaterial']) {
      $(id).addEventListener('input', renderQuotesView);
      $(id).addEventListener('change', renderQuotesView);
    }

    $('mlCrossSearchForm').addEventListener('submit', event => {
      event.preventDefault();
      runCrossBookSearch($('mlCrossQuery').value);
    });
    $('mlInBookForm').addEventListener('submit', event => {
      event.preventDefault();
      runInBookSearch($('mlInBookQuery').value);
    });

    $('mlBackShelf').addEventListener('click', () => setView('shelf'));
    $('mlPrevPage').addEventListener('click', () => goToPage(state.activePage - 1));
    $('mlNextPage').addEventListener('click', () => goToPage(state.activePage + 1));
    $('mlPageInput').addEventListener('change', () => goToPage($('mlPageInput').value));
    $('mlZoomSelect').addEventListener('change', () => renderCurrentPage());
    $('mlAddQuoteBtn').addEventListener('click', () => openQuoteDialog({item: state.activeItem, page: state.activePage}));
    $('mlToggleAside').addEventListener('click', () => {
      const aside = $('mlReaderAside');
      const open = aside.classList.toggle('is-open');
      $('mlToggleAside').setAttribute('aria-expanded', String(open));
    });

    $('mlDownloadPdfBtn').addEventListener('click', async () => {
      if (!state.activeItem || !state.pdfController) return;
      showToast('正在组装完整 PDF…');
      try {
        const blob = await state.pdfController.assembleFullBlob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = (state.activeItem.title || 'material') + '.pdf';
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      } catch {
        showToast('下载 PDF 失败，请稍后重试');
      }
    });

    $('mlStage').addEventListener('mouseup', () => {
      const text = String(window.getSelection?.() || '').trim();
      if (text.length >= 2 && state.activeItem) {
        $('mlSelectionPreview').textContent = '已选中：' + (text.length > 36 ? text.slice(0, 36) + '…' : text);
        $('mlSelectionBar').hidden = false;
        $('mlQuoteSelectionBtn').dataset.excerpt = text.slice(0, 3000);
      } else {
        $('mlSelectionBar').hidden = true;
      }
    });
    $('mlQuoteSelectionBtn').addEventListener('click', () => {
      const excerpt = $('mlQuoteSelectionBtn').dataset.excerpt || '';
      $('mlSelectionBar').hidden = true;
      openQuoteDialog({item: state.activeItem, page: state.activePage, excerpt});
    });

    $('mlPdfFile').addEventListener('change', async event => {
      const file = event.target.files?.[0];
      state.uploadDraft = null;
      $('mlUploadSubmit').disabled = true;
      $('mlUploadError').hidden = true;
      $('mlUploadProgress').textContent = '';
      if (!file) { $('mlInspectStatus').textContent = ''; return; }
      if (file.size > MAX_FILE_BYTES) {
        $('mlUploadError').textContent = 'PDF 文件超过 100 MB 上限，无法上传。';
        $('mlUploadError').hidden = false;
        return;
      }
      $('mlInspectStatus').textContent = '正在本地解析 PDF 目录与逐页文本…';
      try {
        const parsed = await window.HAJIMI_MATERIALS_PDF.inspectLocalPdf(file, ({page, pageCount}) => {
          $('mlInspectStatus').textContent = '正在提取正文：第 ' + page + ' / ' + pageCount + ' 页…';
        });
        const form = $('mlUploadForm');
        if (!form.elements.title.value.trim()) {
          form.elements.title.value = file.name.replace(/\.pdf$/i, '').slice(0, 160);
        }
        state.uploadDraft = {
          id: crypto.randomUUID(),
          file,
          chunkCount: Math.ceil(file.size / CHUNK_SIZE),
          uploadedChunks: new Set(),
          uploadedTextParts: new Set(),
          ...parsed
        };
        $('mlInspectStatus').textContent = '解析完成：共 ' + parsed.pageCount + ' 页，' + parsed.outline.length + ' 条目录，'
          + formatBytes(file.size) + '（' + state.uploadDraft.chunkCount + ' 个分片）'
          + (parsed.scanned ? '。提示：检测到可能是扫描版 PDF，仍支持页内翻页与备注检索。' : '。');
        $('mlUploadSubmit').disabled = false;
      } catch (err) {
        $('mlInspectStatus').textContent = '';
        $('mlUploadError').textContent = 'PDF 解析失败：' + (err?.message || '请确认文件未损坏且未加密');
        $('mlUploadError').hidden = false;
      }
    });

    $('mlUploadForm').addEventListener('submit', async event => {
      event.preventDefault();
      const draft = state.uploadDraft;
      if (!draft) return;
      const form = event.currentTarget;
      const submitBtn = $('mlUploadSubmit');
      const errNode = $('mlUploadError');
      const progress = $('mlUploadProgress');
      errNode.hidden = true;
      submitBtn.disabled = true;

      try {
        for (let idx = 0; idx < draft.chunkCount; idx++) {
          if (draft.uploadedChunks.has(idx)) continue;
          progress.textContent = '正在上传分片 ' + (idx + 1) + ' / ' + draft.chunkCount + '…';
          const slice = draft.file.slice(idx * CHUNK_SIZE, Math.min(draft.file.size, (idx + 1) * CHUNK_SIZE));
          const res = await apiFetch(
            '/api/materials?action=upload-chunk&id=' + encodeURIComponent(draft.id) + '&index=' + idx,
            {method: 'POST', headers: {'Content-Type': 'application/octet-stream'}, body: slice}
          );
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || '分片 ' + (idx + 1) + ' 上传失败');
          draft.uploadedChunks.add(idx);
        }

        const textParts = [];
        for (let i = 0; i < draft.pages.length; i += TEXT_PAGES_PER_PART) {
          textParts.push(draft.pages.slice(i, i + TEXT_PAGES_PER_PART));
        }
        const inlineSingle = textParts.length === 1 && JSON.stringify(textParts[0]).length < 900000;
        if (!inlineSingle) {
          for (let part = 0; part < textParts.length; part++) {
            if (draft.uploadedTextParts.has(part)) continue;
            progress.textContent = '正在保存正文索引分包 ' + (part + 1) + ' / ' + textParts.length + '…';
            const res = await apiFetch('/api/materials?action=text-part', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({id: draft.id, part, pages: textParts[part]})
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || '正文索引上传失败');
            draft.uploadedTextParts.add(part);
          }
        }

        progress.textContent = '正在写入个人资料库索引…';
        const res = await apiFetch('/api/materials?action=commit', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            id: draft.id,
            kind: 'pdf',
            revision: state.revision,
            title: form.elements.title.value.trim(),
            author: form.elements.author.value.trim(),
            year: form.elements.year.value ? Number(form.elements.year.value) : null,
            category: form.elements.category.value,
            department: form.elements.department.value,
            tags: parseTags(form.elements.tags.value),
            notes: form.elements.notes.value.trim(),
            pageCount: draft.pageCount,
            fileSize: draft.file.size,
            chunkSize: CHUNK_SIZE,
            chunkCount: draft.chunkCount,
            outline: draft.outline,
            scanned: draft.scanned,
            ...(inlineSingle ? {pages: textParts[0]} : {textPartsCount: textParts.length})
          })
        });
        const committed = await res.json();
        if (!res.ok) throw new Error(committed.error || '资料入库失败');

        state.revision = committed.revision;
        state.items = [committed.item, ...state.items];
        state.textCache.set(committed.item.id, draft.pages);
        state.uploadDraft = null;
        if (state.stats) {
          state.stats.itemCount = state.items.length;
          state.stats.totalPdfBytes = (state.stats.totalPdfBytes || 0) + committed.item.fileSize;
        }
        renderStats();
        renderShelf();
        $('mlUploadDialog').close();
        showToast('已入库：《' + committed.item.title + '》');
      } catch (err) {
        errNode.textContent = err.message + '（已完成的分片会保留，可点击按钮继续上传）';
        errNode.hidden = false;
        submitBtn.disabled = false;
      }
    });

    $('mlNoteForm').addEventListener('submit', async event => {
      event.preventDefault();
      const form = event.currentTarget;
      const errNode = $('mlNoteError');
      errNode.hidden = true;
      const pinyin = window.HAJIMI_PINYIN_INITIALS;
      const rawPages = form.elements.body.value.split(/\n[ \t]*---[ \t]*\n/).map(s => s.trim()).filter(Boolean);
      if (!rawPages.length) {
        errNode.textContent = '请填写笔记正文';
        errNode.hidden = false;
        return;
      }
      const pages = rawPages.slice(0, TEXT_PAGES_PER_PART).map((text, index) => ({
        page: index + 1,
        text: text.slice(0, 18000),
        ...(pinyin ? {initials: pinyin.textInitials(text, 6000)} : {})
      }));
      try {
        const res = await apiFetch('/api/materials?action=commit', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            id: crypto.randomUUID(),
            kind: 'note',
            revision: state.revision,
            title: form.elements.title.value.trim(),
            author: form.elements.author.value.trim(),
            year: form.elements.year.value ? Number(form.elements.year.value) : null,
            category: form.elements.category.value,
            department: form.elements.department.value,
            tags: parseTags(form.elements.tags.value),
            pageCount: pages.length,
            pages
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || '笔记保存失败');
        state.revision = data.revision;
        state.items = [data.item, ...state.items];
        state.textCache.set(data.item.id, pages);
        if (state.stats) state.stats.itemCount = state.items.length;
        renderStats();
        renderShelf();
        $('mlNoteDialog').close();
        showToast('已保存笔记：《' + data.item.title + '》');
      } catch (err) {
        errNode.textContent = err.message;
        errNode.hidden = false;
      }
    });

    $('mlMetaForm').addEventListener('submit', async event => {
      event.preventDefault();
      const form = event.currentTarget;
      const errNode = $('mlMetaError');
      errNode.hidden = true;
      try {
        const res = await apiFetch('/api/materials?action=meta', {
          method: 'PUT',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            id: form.elements.id.value,
            revision: state.revision,
            title: form.elements.title.value.trim(),
            author: form.elements.author.value.trim(),
            year: form.elements.year.value ? Number(form.elements.year.value) : null,
            category: form.elements.category.value,
            department: form.elements.department.value,
            tags: parseTags(form.elements.tags.value),
            notes: form.elements.notes.value.trim()
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || '更新失败');
        state.revision = data.revision;
        const idx = state.items.findIndex(i => i.id === data.item.id);
        if (idx >= 0) state.items[idx] = data.item;
        renderStats();
        renderShelf();
        $('mlMetaDialog').close();
        showToast('资料信息已更新');
      } catch (err) {
        errNode.textContent = err.message;
        errNode.hidden = false;
      }
    });

    $('mlArchiveBtn').addEventListener('click', async () => {
      const form = $('mlMetaForm');
      if (!window.confirm('确认归档隐藏《' + form.elements.title.value + '》？归档后该资料的分片与正文将不再显示或读取。')) return;
      try {
        const res = await apiFetch('/api/materials?action=meta', {
          method: 'PUT',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({id: form.elements.id.value, revision: state.revision, archived: true})
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || '归档失败');
        state.revision = data.revision;
        state.items = state.items.filter(i => i.id !== data.item.id);
        state.textCache.delete(data.item.id);
        if (state.stats) {
          state.stats.itemCount = state.items.length;
          state.stats.totalPdfBytes = state.items.reduce((s, i) => s + (i.kind === 'pdf' ? i.fileSize : 0), 0);
        }
        renderStats();
        renderShelf();
        $('mlMetaDialog').close();
        showToast('已归档隐藏');
      } catch (err) {
        $('mlMetaError').textContent = err.message;
        $('mlMetaError').hidden = false;
      }
    });

    $('mlQuoteForm').addEventListener('submit', async event => {
      event.preventDefault();
      const form = event.currentTarget;
      const errNode = $('mlQuoteError');
      errNode.hidden = true;
      const editingId = form.elements.id.value;
      const payload = {
        ...(editingId ? {id: editingId} : {materialId: form.elements.materialId.value}),
        page: Number(form.elements.page.value),
        section: form.elements.section.value.trim(),
        excerpt: form.elements.excerpt.value.trim(),
        note: form.elements.note.value.trim(),
        tags: parseTags(form.elements.tags.value),
        quotesRevision: state.quotesRevision
      };
      try {
        const res = await apiFetch('/api/materials?action=quote', {
          method: editingId ? 'PUT' : 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || '保存引用失败');
        state.quotesRevision = data.quotesRevision;
        if (editingId) {
          const idx = state.quotes.findIndex(q => q.id === editingId);
          if (idx >= 0) state.quotes[idx] = data.quote;
        } else {
          state.quotes = [data.quote, ...state.quotes];
        }
        if (state.stats) state.stats.quoteCount = state.quotes.length;
        renderStats();
        renderQuotesView();
        if (state.activeItem) renderBookQuotes(state.activeItem);
        $('mlQuoteDialog').close();
        showToast(editingId ? '已更新引用收藏' : '已收藏引用');
      } catch (err) {
        errNode.textContent = err.message;
        errNode.hidden = false;
      }
    });

    document.addEventListener('keydown', event => {
      if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return;
      const active = document.activeElement;
      if (active?.isContentEditable || /^(?:INPUT|TEXTAREA|SELECT)$/.test(active?.tagName || '')) return;
      if (!state.authenticated) return;
      const target = state.view === 'search' ? $('mlCrossQuery')
        : state.view === 'quotes' ? $('mlQuoteFilterQuery')
          : state.view === 'reader' ? $('mlInBookQuery') : $('mlShelfQuery');
      if (!target) return;
      event.preventDefault();
      target.focus();
      target.select();
    });

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && state.authenticated) checkSession(false);
    });
    setInterval(() => {
      if (!document.hidden && state.authenticated) checkSession(false);
    }, 60000);
  }

  bindEvents();
  checkSession(true);
})();
