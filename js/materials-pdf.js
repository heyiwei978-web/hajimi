(() => {
  'use strict';
  const PDFJS_BASE = '/assets/pdfjs/';
  let libPromise = null;

  function loadPdfJs() {
    if (!libPromise) {
      libPromise = import(PDFJS_BASE + 'pdf.min.mjs').then(lib => {
        lib.GlobalWorkerOptions.workerSrc = PDFJS_BASE + 'pdf.worker.min.mjs';
        return lib;
      });
    }
    return libPromise;
  }

  function hasPdfHeader(bytes) {
    return bytes && bytes.length >= 5
      && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44
      && bytes[3] === 0x46 && bytes[4] === 0x2d;
  }

  async function resolveOutline(pdf) {
    let raw;
    try { raw = await pdf.getOutline(); } catch { return []; }
    if (!Array.isArray(raw) || !raw.length) return [];
    const out = [];
    async function walk(items, level) {
      for (const item of items) {
        if (out.length >= 1000) return;
        const title = String(item?.title || '').trim().slice(0, 160);
        let page = null;
        try {
          let dest = item.dest;
          if (typeof dest === 'string') dest = await pdf.getDestination(dest);
          if (Array.isArray(dest) && dest[0]) {
            const index = await pdf.getPageIndex(dest[0]);
            if (Number.isInteger(index) && index >= 0) page = index + 1;
          }
        } catch { page = null; }
        if (title && page && page <= pdf.numPages) {
          out.push({title, page, level: Math.min(level, 6)});
        }
        if (Array.isArray(item.items) && item.items.length) {
          await walk(item.items, level + 1);
        }
      }
    }
    await walk(raw, 0);
    return out;
  }

  function joinTextItems(items) {
    let text = '';
    for (const item of items || []) {
      const str = typeof item?.str === 'string' ? item.str : '';
      if (!str) continue;
      text += str;
      if (item.hasEOL) text += '\n';
      else if (/[a-zA-Z0-9]$/.test(str)) text += ' ';
    }
    return text.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  }

  async function inspectLocalPdf(file, onProgress) {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    if (!hasPdfHeader(bytes)) throw new Error('所选文件不是有效的 PDF');
    const pdfjs = await loadPdfJs();
    const task = pdfjs.getDocument({
      data: bytes.slice(),
      cMapUrl: PDFJS_BASE + 'cmaps/',
      cMapPacked: true,
      standardFontDataUrl: PDFJS_BASE + 'standard_fonts/'
    });
    const pdf = await task.promise;
    try {
      const pageCount = pdf.numPages;
      const outline = await resolveOutline(pdf);
      const pinyin = window.HAJIMI_PINYIN_INITIALS;
      const pages = [];
      let totalChars = 0;

      for (let p = 1; p <= pageCount; p++) {
        const page = await pdf.getPage(p);
        const content = await page.getTextContent();
        const rawText = joinTextItems(content.items).slice(0, 18000);
        page.cleanup();
        totalChars += rawText.replace(/\s+/g, '').length;
        const initials = pinyin ? pinyin.textInitials(rawText, 6000) : '';
        pages.push({page: p, text: rawText, ...(initials ? {initials} : {})});
        if (onProgress && (p === 1 || p === pageCount || p % 5 === 0)) {
          onProgress({page: p, pageCount});
        }
      }

      const avgChars = pageCount ? totalChars / pageCount : 0;
      return {
        pageCount,
        outline,
        pages,
        totalChars,
        scanned: avgChars < 12
      };
    } finally {
      try { await pdf.destroy(); } catch {}
    }
  }

  async function openChunkedPdf({fileSize, chunkSize, chunkCount, fetchChunk}) {
    const pdfjs = await loadPdfJs();
    const cache = new Map();
    const inflight = new Map();

    async function getChunk(index) {
      if (cache.has(index)) return cache.get(index);
      if (inflight.has(index)) return inflight.get(index);
      const promise = Promise.resolve(fetchChunk(index)).then(buf => {
        const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
        cache.set(index, bytes);
        inflight.delete(index);
        return bytes;
      }, err => {
        inflight.delete(index);
        throw err;
      });
      inflight.set(index, promise);
      return promise;
    }

    const first = await getChunk(0);
    let task;
    if (chunkCount <= 1) {
      task = pdfjs.getDocument({
        data: first.slice(),
        cMapUrl: PDFJS_BASE + 'cmaps/',
        cMapPacked: true,
        standardFontDataUrl: PDFJS_BASE + 'standard_fonts/'
      });
    } else {
      class ChunkRangeTransport extends pdfjs.PDFDataRangeTransport {
        constructor(length, initialData) {
          super(length, initialData);
          this._aborted = false;
        }
        requestDataRange(begin, end) {
          if (this._aborted) return;
          const safeEnd = Math.min(end, fileSize);
          const startIdx = Math.floor(begin / chunkSize);
          const endIdx = Math.floor(Math.max(begin, safeEnd - 1) / chunkSize);
          const indices = [];
          for (let i = startIdx; i <= endIdx; i++) indices.push(i);
          Promise.all(indices.map(getChunk)).then(chunks => {
            if (this._aborted) return;
            const out = new Uint8Array(safeEnd - begin);
            let writeOffset = 0;
            for (let k = 0; k < indices.length; k++) {
              const idx = indices[k];
              const chunk = chunks[k];
              const chunkStart = idx * chunkSize;
              const from = Math.max(0, begin - chunkStart);
              const to = Math.min(chunk.length, safeEnd - chunkStart);
              if (to > from) {
                out.set(chunk.subarray(from, to), writeOffset);
                writeOffset += to - from;
              }
            }
            this.onDataRange(begin, out);
          }).catch(() => {});
        }
        abort() {
          this._aborted = true;
          super.abort();
        }
      }
      const transport = new ChunkRangeTransport(fileSize, first.slice());
      task = pdfjs.getDocument({
        range: transport,
        length: fileSize,
        rangeChunkSize: Math.min(chunkSize, 512 * 1024),
        disableAutoFetch: true,
        disableStream: true,
        cMapUrl: PDFJS_BASE + 'cmaps/',
        cMapPacked: true,
        standardFontDataUrl: PDFJS_BASE + 'standard_fonts/'
      });
    }

    const pdf = await task.promise;
    let activeRender = null;

    async function renderPage(pageNum, {canvas, textLayer, zoom = 'fit', containerWidth = 760, highlightTerms = []}) {
      if (activeRender) {
        try { activeRender.cancel(); } catch {}
        activeRender = null;
      }
      const page = await pdf.getPage(pageNum);
      const baseViewport = page.getViewport({scale: 1});
      let scale = Number(zoom);
      if (!Number.isFinite(scale) || scale <= 0) {
        const available = Math.max(280, Math.min(containerWidth - 24, 960));
        scale = available / baseViewport.width;
      }
      const viewport = page.getViewport({scale});
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.max(1, Math.floor(viewport.width * dpr));
      canvas.height = Math.max(1, Math.floor(viewport.height * dpr));
      canvas.style.width = Math.floor(viewport.width) + 'px';
      canvas.style.height = Math.floor(viewport.height) + 'px';

      const ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const renderTask = page.render({canvasContext: ctx, viewport});
      activeRender = renderTask;
      try {
        await renderTask.promise;
      } catch (err) {
        if (err?.name === 'RenderingCancelledException') return;
        throw err;
      } finally {
        if (activeRender === renderTask) activeRender = null;
      }

      if (textLayer) {
        textLayer.replaceChildren();
        textLayer.style.width = Math.floor(viewport.width) + 'px';
        textLayer.style.height = Math.floor(viewport.height) + 'px';
        const content = await page.getTextContent();
        const terms = (highlightTerms || []).map(t => String(t || '').toLowerCase()).filter(Boolean);
        const frag = document.createDocumentFragment();
        for (const item of content.items || []) {
          if (!item.str) continue;
          const tx = pdfjs.Util.transform(viewport.transform, item.transform);
          const fontHeight = Math.hypot(tx[2], tx[3]) || 12;
          const angle = Math.atan2(tx[1], tx[0]);
          const span = document.createElement('span');
          span.textContent = item.str;
          span.style.left = tx[4] + 'px';
          span.style.top = (tx[5] - fontHeight) + 'px';
          span.style.fontSize = fontHeight + 'px';
          if (Math.abs(angle) > 0.01) span.style.transform = 'rotate(' + angle + 'rad)';
          if (terms.length) {
            const lower = item.str.toLowerCase();
            if (terms.some(term => lower.includes(term))) span.className = 'ml-text-hit';
          }
          frag.append(span);
        }
        textLayer.append(frag);
      }
    }

    async function assembleFullBlob() {
      const parts = [];
      for (let i = 0; i < chunkCount; i++) parts.push(await getChunk(i));
      return new Blob(parts, {type: 'application/pdf'});
    }

    async function destroy() {
      if (activeRender) {
        try { activeRender.cancel(); } catch {}
        activeRender = null;
      }
      cache.clear();
      inflight.clear();
      try { await pdf.destroy(); } catch {}
    }

    return {pdf, renderPage, assembleFullBlob, destroy};
  }

  window.HAJIMI_MATERIALS_PDF = Object.freeze({
    inspectLocalPdf,
    openChunkedPdf
  });
})();
