// 检验解读（/labs）：按分类列出化验项目，可搜索；每项点开查看参考范围、升高与降低原因、临床要点。
// 文字一律用 textContent 输出，不拼 HTML。
(() => {
  const data = window.HAJIMI_LABS;
  const $ = id => document.getElementById(id);
  const content = $('labsContent'), toc = $('labsToc'), search = $('labsSearch'), result = $('labsResult');
  if (!content || !search) return;
  if (!data || !Array.isArray(data.categories)) { result.textContent = '资料加载失败，请刷新页面重试。'; return; }

  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const byId = new Map();
  for (const category of data.categories) for (const item of category.items) byId.set(item.id, item);

  $('labsCount').textContent = String(byId.size);
  $('labsStatus').textContent = data.reviewStatus || '待审核';
  for (const [title, text] of data.steps || []) {
    const li = el('li');
    li.append(el('strong', '', title), el('span', '', text));
    $('labsSteps').append(li);
  }
  for (const text of data.references || []) $('labsRefs').append(el('li', '', text));

  function list(title, values, className) {
    const box = el('section', 'labs-block ' + (className || ''));
    box.append(el('h4', '', title));
    const ul = el('ul');
    for (const value of values) ul.append(el('li', '', value));
    box.append(ul);
    return box;
  }

  const entries = [];
  data.categories.forEach((category, index) => {
    const link = el('a', '', category.title);
    link.href = '#labs-' + category.id;
    toc.append(link);

    const section = el('section', 'labs-category');
    section.id = 'labs-' + category.id;
    section.setAttribute('aria-labelledby', section.id + '-title');
    const head = el('div', 'labs-category-head');
    const h2 = el('h2', '', category.title);
    h2.id = section.id + '-title';
    const count = el('span', 'labs-category-count');
    head.append(el('span', 'labs-category-no', String(index + 1).padStart(2, '0')), h2, count);
    section.append(head, el('p', 'labs-category-desc', category.desc));
    const grid = el('div', 'labs-items');

    for (const item of category.items) {
      const details = el('details', 'labs-item');
      details.id = 'lab-' + item.id;
      const summary = el('summary');
      const title = el('span', 'labs-item-title');
      title.append(el('strong', '', item.name), el('span', 'labs-abbr', item.abbr));
      const range = el('span', 'labs-item-range', item.ranges.map(([label, value]) => label + ' ' + value).slice(0, 2).join('；'));
      summary.append(title, range);
      details.append(summary);

      const body = el('div', 'labs-item-body');
      const table = el('table', 'labs-ranges');
      const caption = el('caption', '', '参考范围（单位：' + item.unit + '）');
      table.append(caption);
      const tbody = el('tbody');
      for (const [label, value] of item.ranges) {
        const tr = el('tr');
        const th = el('th', '', label);
        th.scope = 'row';
        tr.append(th, el('td', '', value));
        tbody.append(tr);
      }
      table.append(tbody);
      body.append(table);
      if (item.source) {
        const source = el('p', 'labs-source');
        source.append(el('span', '', '来源：'), document.createTextNode(item.source));
        body.append(source);
      }
      if (item.critical) {
        const critical = el('p', 'labs-critical');
        critical.append(el('strong', '', '危急值参考：'), document.createTextNode(item.critical));
        body.append(critical);
      }
      const columns = el('div', 'labs-columns');
      columns.append(list('升高见于', item.high, 'is-high'), list('降低见于', item.low, 'is-low'));
      body.append(columns, list('临床要点', item.points, 'is-points'));

      const links = el('div', 'labs-links');
      for (const id of item.related || []) {
        const target = byId.get(id);
        if (!target) continue;
        const a = el('a', 'labs-chip', target.name);
        a.href = '#lab-' + id;
        a.dataset.lab = id;
        links.append(a);
      }
      for (const [key, label] of item.tools || []) {
        const a = el('a', 'labs-chip is-tool', '计算：' + label);
        a.href = '/tools?tool=' + encodeURIComponent(key);
        links.append(a);
      }
      for (const [id, label] of item.ecg || []) {
        const a = el('a', 'labs-chip is-ecg', '心电图：' + label);
        a.href = '/ecg/atlas/' + id.split('/').map(encodeURIComponent).join('/');
        links.append(a);
      }
      if (links.childElementCount) {
        const wrap = el('div', 'labs-related');
        wrap.append(el('h4', '', '相关项目与工具'), links);
        body.append(wrap);
      }
      details.append(body);
      grid.append(details);
      const text = [item.name, item.abbr, ...(item.aliases || []), category.title].join(' ').toLowerCase();
      entries.push({details, text, section, link, count});
    }
    section.append(grid);
    content.append(section);
  });

  function apply() {
    const terms = search.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const shown = new Map();
    let total = 0;
    for (const entry of entries) {
      const match = terms.every(term => entry.text.includes(term));
      entry.details.hidden = !match;
      if (match) { total += 1; shown.set(entry.section, (shown.get(entry.section) || 0) + 1); }
    }
    for (const entry of entries) {
      const n = shown.get(entry.section) || 0;
      entry.section.hidden = n === 0;
      entry.link.hidden = n === 0;
      entry.count.textContent = n + ' 项';
    }
    // 结果很少时自动展开，方便直接查看。
    if (terms.length) for (const entry of entries) if (!entry.details.hidden && total <= 3) entry.details.open = true;
    result.textContent = terms.length
      ? (total ? '找到 ' + total + ' 项。' : '没有找到，换个名称或缩写试试，例如“肌酐”“Cr”。')
      : '共 ' + entries.length + ' 项，点开查看解读。';
  }
  let timer = 0;
  search.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(apply, 120); });

  function openFromHash() {
    const id = decodeURIComponent(location.hash.slice(1));
    if (!id.startsWith('lab-')) return;
    const target = document.getElementById(id);
    if (!target) return;
    if (target.hidden) { search.value = ''; apply(); }
    target.open = true;
    target.scrollIntoView({block: 'start'});
    target.querySelector('summary')?.focus({preventScroll: true});
  }
  window.addEventListener('hashchange', openFromHash);
  apply();
  openFromHash();
})();
