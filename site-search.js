// 全站搜索（/search）：在构建时生成的索引里查找各栏目的标题、缩写和别名。
// 索引不含病历正文和患者信息；排序与高亮复用心电图栏目的搜索引擎（ecg-search.js）。
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const form = $('siteSearchForm'), input = $('siteSearchInput'), status = $('siteSearchStatus');
  const filters = $('siteSearchFilters'), results = $('siteSearchResults'), start = $('siteSearchStart');
  if (!form || !input || !results) return;
  const data = window.HAJIMI_SITE_SEARCH, engineApi = window.HAJIMI_ECG_SEARCH;
  if (!data || !Array.isArray(data.documents) || !engineApi) {
    status.textContent = '搜索资料加载失败，请刷新页面重试。';
    return;
  }

  const PREVIEW = 6;
  const sections = data.sections;
  const engine = engineApi.create(data.documents.map(item =>
    ({type: item.s, title: item.t, aliases: item.a || [], body: [item.d, item.b].filter(Boolean).join(' '), item})));
  const state = {query: '', section: 'all', expanded: new Set()};

  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  // highlight() escapes the text before adding <mark>, so this is the only HTML sink.
  const marked = (tag, className, text) => {
    const node = el(tag, className);
    node.innerHTML = engineApi.highlight(text, state.query);
    return node;
  };

  function resultItem(item) {
    const li = el('li'), link = el('a', 'site-search-hit');
    link.href = item.u;
    link.append(marked('span', 'site-search-hit-title', item.t));
    const terms = engineApi.terms(state.query);
    const alias = (item.a || []).find(value => {
      const folded = engineApi.normalize(value);
      return !engineApi.normalize(item.t).includes(folded) && terms.some(term => folded.includes(term));
    });
    const description = el('span', 'site-search-hit-desc');
    description.append(marked('span', '', item.d));
    if (alias) description.append(el('span', '', ' · 又称 '), marked('span', '', alias));
    link.append(description);
    li.append(link);
    return li;
  }

  function filterButton(id, label, count) {
    const button = el('button', 'site-search-filter');
    button.type = 'button';
    button.dataset.section = id;
    button.setAttribute('aria-pressed', String(state.section === id));
    button.append(el('span', '', label), el('small', '', String(count)));
    return button;
  }

  function render() {
    const query = state.query.trim();
    results.replaceChildren();
    filters.replaceChildren();
    start.hidden = Boolean(query);
    filters.hidden = !query;
    if (!query) { status.textContent = ''; return; }

    const hits = engine.search(query);
    const groups = sections.map((section, order) => {
      const items = hits.filter(hit => hit.doc.type === section.id);
      return {...section, order, items, top: items[0]?.score || 0};
    }).filter(group => group.items.length);
    if (state.section !== 'all' && !groups.some(group => group.id === state.section)) state.section = 'all';

    if (!hits.length) {
      status.textContent = '没有找到“' + query + '”相关的资料。';
      const empty = el('div', 'site-search-empty');
      empty.append(el('p', '', '可以换一个更短的词、缩写或别名再试；全站搜索不包含病历正文。'));
      const link = el('a', 'site-search-more', '在病历模板库中搜索“' + query + '” →');
      link.href = '/bl?q=' + encodeURIComponent(query);
      empty.append(link);
      results.append(empty);
      filters.hidden = true;
      return;
    }

    status.textContent = '找到 ' + hits.length + ' 条结果，分布在 ' + groups.length + ' 个栏目。';
    filters.append(filterButton('all', '全部', hits.length));
    for (const group of groups) filters.append(filterButton(group.id, group.label, group.items.length));

    // Best-matching section first; equal scores keep the navigation order.
    const shown = groups.filter(group => state.section === 'all' || group.id === state.section)
      .sort((a, b) => b.top - a.top || a.order - b.order);
    for (const group of shown) {
      const section = el('section', 'site-search-group');
      const heading = el('h2', '', group.label);
      heading.id = 'site-search-' + group.id;
      heading.append(el('small', '', group.items.length + ' 条'));
      section.setAttribute('aria-labelledby', heading.id);
      const list = el('ul', 'site-search-list');
      const all = state.section !== 'all' || state.expanded.has(group.id);
      for (const hit of all ? group.items : group.items.slice(0, PREVIEW)) list.append(resultItem(hit.doc.item));
      section.append(heading, list);
      if (!all && group.items.length > PREVIEW) {
        const more = el('button', 'site-search-more', '显示全部 ' + group.items.length + ' 条');
        more.type = 'button';
        more.dataset.expand = group.id;
        section.append(more);
      }
      if (group.id === 'records') {
        const link = el('a', 'site-search-more', '在病历模板库中按文书搜索“' + query + '” →');
        link.href = '/bl?q=' + encodeURIComponent(query);
        section.append(link);
      }
      results.append(section);
    }
  }

  function setQuery(value, {history: updateHistory = true} = {}) {
    state.query = value;
    state.expanded.clear();
    if (updateHistory) {
      const url = new URL(location.href);
      if (value.trim()) url.searchParams.set('q', value.trim()); else url.searchParams.delete('q');
      history.replaceState(history.state, '', url.pathname + url.search);
    }
    render();
  }

  let timer = 0;
  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => setQuery(input.value), 120);
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    clearTimeout(timer);
    setQuery(input.value);
  });
  filters.addEventListener('click', event => {
    const button = event.target.closest('button[data-section]');
    if (!button) return;
    state.section = button.dataset.section;
    render();
    filters.querySelector('[aria-pressed="true"]')?.focus();
  });
  results.addEventListener('click', event => {
    const button = event.target.closest('button[data-expand]');
    if (!button) return;
    const id = button.dataset.expand, shown = PREVIEW;
    state.expanded.add(id);
    render();
    // Keep keyboard users at the first newly revealed result.
    document.querySelector('[aria-labelledby="site-search-' + id + '"] li:nth-child(' + (shown + 1) + ') a')?.focus();
  });
  document.addEventListener('keydown', event => {
    if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return;
    if (/^(?:INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '')) return;
    event.preventDefault();
    input.focus();
    input.select();
  });

  const initial = new URLSearchParams(location.search).get('q') || '';
  input.value = initial;
  setQuery(initial, {history: false});
  if (!initial && matchMedia('(min-width: 761px)').matches) input.focus({preventScroll: true});
})();
