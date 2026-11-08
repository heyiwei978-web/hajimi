// 内科医嘱参考：把 duty-orders-data.js 里的表格原样显示，支持分页跳转和关键词筛选。
// 只改显示方式，单元格文字原样输出（用 textContent，不拼 HTML）。
(() => {
  const data = Array.isArray(window.DUTY_ORDERS) ? window.DUTY_ORDERS : [];
  const content = document.getElementById('ordersContent');
  const toc = document.getElementById('ordersToc');
  const search = document.getElementById('ordersSearch');
  const status = document.getElementById('ordersStatus');
  if (!content || !toc || !search || !status) return;
  if (!data.length) { status.textContent = '资料加载失败，请刷新页面重试。'; return; }

  const rows = []; // {tr, cells:[{td,text}], section, text}
  const sections = [];
  const CONTENT_COLUMN = '内容';

  function isSubhead(row, columns) {
    const filled = row.map((value, index) => value ? index : -1).filter(index => index >= 0);
    return filled.length === 1 && columns[filled[0]] === CONTENT_COLUMN && row[filled[0]].length <= 30;
  }

  data.forEach((sheet, sheetIndex) => {
    const id = 'orders-sheet-' + (sheetIndex + 1);
    const link = document.createElement('a');
    link.href = '#' + id;
    link.textContent = sheet.title;
    toc.append(link);

    const section = document.createElement('section');
    section.className = 'orders-sheet';
    section.id = id;
    section.setAttribute('aria-labelledby', id + '-title');
    const heading = document.createElement('div');
    heading.className = 'orders-sheet-head';
    const h2 = document.createElement('h2');
    h2.id = id + '-title';
    h2.textContent = sheet.title;
    const count = document.createElement('span');
    count.textContent = sheet.rows.length + ' 条';
    heading.append(h2, count);

    const scroller = document.createElement('div');
    scroller.className = 'orders-table-wrap';
    const table = document.createElement('table');
    table.className = 'orders-table';
    const caption = document.createElement('caption');
    caption.className = 'visually-hidden';
    caption.textContent = sheet.title;
    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    for (const column of sheet.columns) {
      const th = document.createElement('th');
      th.scope = 'col';
      th.textContent = column;
      headRow.append(th);
    }
    thead.append(headRow);
    const tbody = document.createElement('tbody');
    const entry = {section, count, total: sheet.rows.length, link};
    for (const row of sheet.rows) {
      const tr = document.createElement('tr');
      const cells = [];
      if (isSubhead(row, sheet.columns)) {
        tr.className = 'orders-subhead';
        const td = document.createElement('td');
        td.colSpan = sheet.columns.length;
        const text = row.find(Boolean);
        td.textContent = text;
        cells.push({td, text});
        tr.append(td);
      } else {
        row.forEach((text, index) => {
          const td = document.createElement('td');
          td.dataset.label = sheet.columns[index];
          td.textContent = text;
          if (!text) td.className = 'orders-empty';
          if (sheet.columns[index] === CONTENT_COLUMN) td.classList.add('orders-main-cell');
          cells.push({td, text});
          tr.append(td);
        });
      }
      tbody.append(tr);
      rows.push({tr, cells, entry, text: row.join(' ').toLowerCase()});
    }
    table.append(caption, thead, tbody);
    scroller.append(table);
    section.append(heading, scroller);
    sections.push(entry);
    content.append(section);
  });

  function highlight(cell, terms) {
    const {td, text} = cell;
    if (!terms.length || !text) { td.textContent = text; return; }
    const lower = text.toLowerCase();
    const marks = [];
    for (const term of terms) {
      let at = lower.indexOf(term);
      while (at >= 0) { marks.push([at, at + term.length]); at = lower.indexOf(term, at + term.length); }
    }
    if (!marks.length) { td.textContent = text; return; }
    marks.sort((a, b) => a[0] - b[0]);
    const merged = [];
    for (const mark of marks) {
      const last = merged[merged.length - 1];
      if (last && mark[0] <= last[1]) last[1] = Math.max(last[1], mark[1]); else merged.push(mark.slice());
    }
    td.textContent = '';
    let position = 0;
    for (const [start, end] of merged) {
      if (start > position) td.append(text.slice(position, start));
      const mark = document.createElement('mark');
      mark.textContent = text.slice(start, end);
      td.append(mark);
      position = end;
    }
    if (position < text.length) td.append(text.slice(position));
  }

  let pending = 0;
  function apply() {
    const terms = search.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const shown = new Map(sections.map(entry => [entry, 0]));
    for (const row of rows) {
      const match = terms.every(term => row.text.includes(term));
      row.tr.hidden = !match;
      for (const cell of row.cells) highlight(cell, match ? terms : []);
      if (match) shown.set(row.entry, shown.get(row.entry) + 1);
    }
    let total = 0, visibleSections = 0;
    for (const entry of sections) {
      const count = shown.get(entry);
      total += count;
      entry.section.hidden = count === 0;
      entry.link.hidden = count === 0;
      if (count) visibleSections += 1;
      entry.count.textContent = terms.length ? `${count} / ${entry.total} 条` : `${entry.total} 条`;
    }
    status.textContent = terms.length
      ? (total ? `找到 ${total} 条，分布在 ${visibleSections} 个分页。` : '没有找到匹配内容，换个关键词试试。')
      : `共 ${sections.length} 个分页、${rows.length} 条。`;
  }
  search.addEventListener('input', () => { clearTimeout(pending); pending = setTimeout(apply, 120); });
  search.disabled = false;
  apply();
})();
