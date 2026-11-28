(() => {
  'use strict';
  const mount = document.querySelector('[data-materials-hub]');
  if (!mount) return;

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function rowLink(href, title, subtitle) {
    const item = document.createElement('li');
    const link = el('a', 'ws-row');
    link.href = href;
    const copy = document.createElement('span');
    copy.append(el('strong', '', title), el('small', '', subtitle));
    const arrow = el('b', '', '›');
    arrow.setAttribute('aria-hidden', 'true');
    link.append(copy, arrow);
    item.append(link);
    return item;
  }

  async function load() {
    let session;
    try {
      const res = await fetch('/api/session', {credentials: 'same-origin', cache: 'no-store'});
      if (!res.ok) return;
      session = await res.json();
    } catch { return; }
    if (!session?.authenticated) return;

    let summary;
    try {
      const res = await fetch('/api/materials?view=summary', {credentials: 'same-origin', cache: 'no-store'});
      if (!res.ok) return;
      summary = await res.json();
    } catch { return; }

    const list = document.createElement('ul');
    const mb = ((summary.stats?.totalPdfBytes || 0) / (1024 * 1024)).toFixed(1);
    list.append(rowLink(
      '/materials/library',
      '进入个人资料库',
      '已收录 ' + (summary.stats?.itemCount || 0) + ' 份资料 · ' + (summary.stats?.quoteCount || 0) + ' 条引用 · ' + mb + ' MB'
    ));

    for (const item of summary.recentReads || []) {
      const page = item.lastPage || 1;
      const meta = [item.category, item.department, item.year || '', '第 ' + page + ' / ' + item.pageCount + ' 页']
        .filter(Boolean).join(' · ');
      list.append(rowLink('/materials/library?id=' + encodeURIComponent(item.id) + '&page=' + page, item.title, meta));
    }

    for (const quote of (summary.recentQuotes || []).slice(0, 2)) {
      const preview = quote.excerpt.length > 48 ? quote.excerpt.slice(0, 48) + '…' : quote.excerpt;
      list.append(rowLink(
        '/materials/library?id=' + encodeURIComponent(quote.materialId) + '&page=' + quote.page,
        '引用 · ' + quote.materialTitle + '（第 ' + quote.page + ' 页）',
        preview
      ));
    }

    mount.replaceChildren(list);
  }

  load();
})();
