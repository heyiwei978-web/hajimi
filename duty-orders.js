// 内科医嘱参考（/duty/orders）：登录后从 /api/duty-orders 读取资料，可搜索、跳转分页；
// 进入编辑模式后可编辑、插入、删除条目和修改表头，每次保存前服务器自动备份。
// 单元格文字一律用 textContent 输出，不拼 HTML。
(() => {
  const $ = id => document.getElementById(id);
  const loading = $('ordersLoading'), locked = $('ordersLocked'), app = $('ordersApp');
  const errorBox = $('ordersError'), errorText = $('ordersErrorText');
  const content = $('ordersContent'), toc = $('ordersToc'), search = $('ordersSearch'), status = $('ordersStatus');
  const editToggle = $('ordersEditToggle'), editHint = $('ordersEditHint'), saveStatus = $('ordersSaveStatus');
  const updatedLabel = $('ordersUpdated');
  const editDialog = $('ordersEditDialog'), editForm = $('ordersEditForm'), editTitle = $('ordersEditTitle');
  const editFields = $('ordersEditFields'), editStatus = $('ordersEditStatus');
  const historyDialog = $('ordersHistoryDialog'), historyList = $('ordersHistoryList'), historyStatus = $('ordersHistoryStatus');
  if (!content || !app) return;

  const CONTENT_COLUMN = '内容';
  const state = {sheets: [], revision: null, history: [], updatedAt: null, editing: false, busy: false};
  let rows = [], sections = [], onEditSave = null;

  class ApiError extends Error { constructor(status, message) { super(message); this.status = status; } }
  async function api(method, body, query = '') {
    let response;
    try {
      response = await fetch('/api/duty-orders' + query, {
        method, credentials: 'same-origin', cache: 'no-store',
        headers: method === 'GET' ? {} : {'Content-Type': 'application/json', 'X-Hajimi-Admin': '1'},
        body: body === undefined ? undefined : JSON.stringify(body)
      });
    } catch { throw new ApiError(0, '网络连接失败，请检查网络后重试'); }
    let data = null;
    try { data = await response.json(); } catch { /* handled below */ }
    if (!response.ok) {
      if (response.status === 401) showLocked();
      throw new ApiError(response.status, data?.error || '资料服务暂不可用，请稍后重试');
    }
    if (!data) throw new ApiError(503, '资料服务返回异常，请稍后重试');
    return data;
  }

  function show(part) {
    loading.hidden = part !== 'loading';
    locked.hidden = part !== 'locked';
    errorBox.hidden = part !== 'error';
    app.hidden = part !== 'app';
  }
  function showLocked() {
    if (editDialog.open) editDialog.close();
    if (historyDialog.open) historyDialog.close();
    show('locked');
  }
  function showError(message) { errorText.textContent = message; show('error'); }

  async function load() {
    show('loading');
    try {
      const data = await api('GET');
      accept(data);
      show('app');
      render();
    } catch (error) {
      if (error.status !== 401) showError(error.message);
    }
  }
  function accept(data) {
    state.sheets = data.sheets;
    state.revision = data.revision;
    state.history = Array.isArray(data.history) ? data.history : [];
    state.updatedAt = data.updatedAt || null;
    updatedLabel.textContent = state.updatedAt ? '最后修改：' + formatTime(state.updatedAt) : '尚未修改（初始资料）';
  }
  const formatTime = value => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleString('zh-CN', {hour12: false});
  };
  const clone = sheets => sheets.map(sheet => ({title: sheet.title, columns: [...sheet.columns], rows: sheet.rows.map(row => [...row])}));

  function isSubhead(row, columns) {
    const filled = row.map((value, index) => value ? index : -1).filter(index => index >= 0);
    return filled.length === 1 && columns[filled[0]] === CONTENT_COLUMN && row[filled[0]].length <= 30;
  }
  // 只有第一格有长文字的行（注释、来源等）跨整行显示。
  const isNote = row => row[0].length > 30 && row.slice(1).every(value => !value);
  function button(label, action, data, extraLabel) {
    const element = document.createElement('button');
    element.type = 'button';
    element.className = 'orders-action';
    element.textContent = label;
    element.dataset.action = action;
    for (const [key, value] of Object.entries(data)) element.dataset[key] = value;
    if (extraLabel) element.setAttribute('aria-label', extraLabel);
    return element;
  }

  function render() {
    const scroll = window.scrollY;
    toc.replaceChildren();
    content.replaceChildren();
    rows = []; sections = [];
    content.classList.toggle('is-editing', state.editing);
    state.sheets.forEach((sheet, sheetIndex) => {
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
      count.className = 'orders-sheet-count';
      heading.append(h2, count);
      if (state.editing) {
        const tools = document.createElement('div');
        tools.className = 'orders-sheet-tools';
        tools.append(button('编辑表头', 'header', {sheet: sheetIndex}, '编辑「' + sheet.title + '」的标题和表头'),
          button('添加一行', 'append', {sheet: sheetIndex}, '在「' + sheet.title + '」末尾添加一行'));
        heading.append(tools);
      }

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
      if (state.editing) {
        const th = document.createElement('th');
        th.scope = 'col';
        th.textContent = '操作';
        headRow.append(th);
      }
      thead.append(headRow);
      const tbody = document.createElement('tbody');
      const entry = {section, count, total: sheet.rows.length, link};
      sheet.rows.forEach((row, rowIndex) => {
        const tr = document.createElement('tr');
        const cells = [];
        const note = isNote(row);
        if (note || isSubhead(row, sheet.columns)) {
          tr.className = note ? 'orders-note' : 'orders-subhead';
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
        if (state.editing) {
          const td = document.createElement('td');
          td.className = 'orders-actions';
          const name = (row.find(Boolean) || '空白行').slice(0, 20);
          const data = {sheet: sheetIndex, row: rowIndex};
          td.append(button('编辑', 'edit', data, '编辑：' + name), button('插入', 'insert', data, '在「' + name + '」下方插入一行'),
            button('删除', 'delete', data, '删除：' + name));
          tr.append(td);
        }
        tbody.append(tr);
        rows.push({tr, cells, entry, text: row.join(' ').toLowerCase()});
      });
      table.append(caption, thead, tbody);
      scroller.append(table);
      section.append(heading, scroller);
      sections.push(entry);
      content.append(section);
    });
    apply();
    window.scrollTo(0, scroll);
  }

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
      // 编辑模式下保留空白分页，便于添加内容。
      entry.section.hidden = count === 0 && (terms.length > 0 || !state.editing);
      entry.link.hidden = entry.section.hidden;
      if (count) visibleSections += 1;
      entry.count.textContent = terms.length ? `${count} / ${entry.total} 条` : `${entry.total} 条`;
    }
    status.textContent = terms.length
      ? (total ? `找到 ${total} 条，分布在 ${visibleSections} 个分页。` : '没有找到匹配内容，换个关键词试试。')
      : `共 ${sections.length} 个分页、${rows.length} 条。`;
  }
  let pending = 0;
  search.addEventListener('input', () => { clearTimeout(pending); pending = setTimeout(apply, 120); });

  // ---- 编辑 ----
  editToggle.addEventListener('click', () => {
    state.editing = !state.editing;
    editToggle.setAttribute('aria-pressed', String(state.editing));
    editToggle.textContent = state.editing ? '退出编辑模式' : '进入编辑模式';
    editHint.hidden = !state.editing;
    render();
  });

  function openEditor(title, fields, onSave) {
    editTitle.textContent = title;
    editFields.replaceChildren();
    fields.forEach((field, index) => {
      const label = document.createElement('label');
      const name = document.createElement('span');
      name.textContent = field.label;
      const input = document.createElement('textarea');
      input.name = 'field' + index;
      input.value = field.value;
      input.maxLength = field.max || 10000;
      input.rows = Math.min(10, Math.max(field.single ? 1 : 2, Math.ceil(field.value.length / 40) + (field.value.match(/\n/g) || []).length));
      if (field.required) input.required = true;
      label.append(name, input);
      editFields.append(label);
    });
    editStatus.textContent = '';
    onEditSave = onSave;
    editDialog.showModal();
    editFields.querySelector('textarea')?.focus();
  }
  const closeEditor = () => { if (!state.busy) editDialog.close(); };
  $('ordersEditClose').addEventListener('click', closeEditor);
  $('ordersEditCancel').addEventListener('click', closeEditor);
  editDialog.addEventListener('cancel', event => { if (state.busy) event.preventDefault(); });
  editForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (state.busy || !onEditSave) return;
    const values = [...editFields.querySelectorAll('textarea')].map(input => input.value.replace(/\r\n?/g, '\n'));
    const next = clone(state.sheets);
    const message = onEditSave(next, values);
    editStatus.textContent = '正在保存…';
    try {
      await persist(next, message);
      editDialog.close();
    } catch (error) {
      editStatus.textContent = error.message;
    }
  });

  async function persist(next, message) {
    state.busy = true;
    setBusy(true);
    try {
      const data = await api('PUT', {sheets: next, revision: state.revision});
      accept(data);
      render();
      saveStatus.textContent = message + '（' + formatTime(data.updatedAt) + '）';
    } finally {
      state.busy = false;
      setBusy(false);
    }
  }
  function setBusy(busy) {
    for (const element of document.querySelectorAll('.orders-action, #ordersEditForm button[type=submit], #ordersHistoryList button')) element.disabled = busy;
  }

  content.addEventListener('click', async event => {
    const target = event.target.closest('button[data-action]');
    if (!target || state.busy) return;
    const sheetIndex = Number(target.dataset.sheet), rowIndex = Number(target.dataset.row);
    const sheet = state.sheets[sheetIndex];
    if (!sheet) return;
    const rowFields = values => sheet.columns.map((column, index) => ({label: column || '第 ' + (index + 1) + ' 列', value: values[index] || ''}));
    const emptyRow = () => sheet.columns.map(() => '');
    switch (target.dataset.action) {
      case 'edit':
        openEditor('编辑：' + sheet.title, rowFields(sheet.rows[rowIndex]), (next, values) => {
          next[sheetIndex].rows[rowIndex] = values; return '已保存修改';
        });
        break;
      case 'insert':
        openEditor('在下方插入一行：' + sheet.title, rowFields(emptyRow()), (next, values) => {
          next[sheetIndex].rows.splice(rowIndex + 1, 0, values); return '已插入一行';
        });
        break;
      case 'append':
        openEditor('添加一行：' + sheet.title, rowFields(emptyRow()), (next, values) => {
          next[sheetIndex].rows.push(values); return '已添加一行';
        });
        break;
      case 'header':
        openEditor('编辑标题和表头：' + sheet.title,
          [{label: '分页标题', value: sheet.title, max: 40, required: true, single: true},
            ...sheet.columns.map((column, index) => ({label: '第 ' + (index + 1) + ' 列表头', value: column, max: 100, single: true}))],
          (next, values) => {
            next[sheetIndex].title = values[0].trim();
            next[sheetIndex].columns = values.slice(1).map(value => value.replace(/\n/g, ' '));
            return '已保存表头';
          });
        break;
      case 'delete': {
        const name = (sheet.rows[rowIndex].find(Boolean) || '空白行').slice(0, 60);
        if (!window.confirm('确定删除这一条吗？\n\n' + name + '\n\n删除前的资料会自动备份，可在「修改记录」里恢复。')) return;
        const next = clone(state.sheets);
        next[sheetIndex].rows.splice(rowIndex, 1);
        try { await persist(next, '已删除一条'); } catch (error) { saveStatus.textContent = error.message; }
        break;
      }
    }
  });

  // ---- 修改记录与恢复 ----
  const ACTIONS = {save: '保存', restore: '恢复'};
  $('ordersHistoryButton').addEventListener('click', () => {
    renderHistory();
    historyStatus.textContent = '';
    historyDialog.showModal();
  });
  $('ordersHistoryClose').addEventListener('click', () => { if (!state.busy) historyDialog.close(); });
  function renderHistory() {
    historyList.replaceChildren();
    if (!state.history.length) {
      const item = document.createElement('li');
      item.className = 'orders-history-empty';
      item.textContent = '还没有修改记录。';
      historyList.append(item);
      return;
    }
    for (const entry of state.history) {
      const item = document.createElement('li');
      const text = document.createElement('span');
      text.textContent = `${formatTime(entry.createdAt)} ${ACTIONS[entry.action] || '修改'}前的资料 · ${entry.rowCount ?? '?'} 条`;
      const restore = document.createElement('button');
      restore.type = 'button';
      restore.className = 'btn ghost';
      restore.textContent = '恢复这份';
      restore.addEventListener('click', async () => {
        if (state.busy || !window.confirm('确定把资料恢复到 ' + formatTime(entry.createdAt) + ' 之前的样子吗？当前资料会先自动备份。')) return;
        state.busy = true; setBusy(true);
        historyStatus.textContent = '正在恢复…';
        try {
          const data = await api('POST', {action: 'restore', id: entry.id, revision: state.revision});
          accept(data);
          render();
          historyDialog.close();
          saveStatus.textContent = '已恢复备份（' + formatTime(data.updatedAt) + '）';
        } catch (error) {
          historyStatus.textContent = error.message;
        } finally { state.busy = false; setBusy(false); }
      });
      item.append(text, restore);
      historyList.append(item);
    }
  }

  $('ordersDownload').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify({sheets: state.sheets, revision: state.revision, exportedAt: new Date().toISOString()}, null, 1)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = '内科医嘱参考-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  $('ordersRetry').addEventListener('click', load);
  window.addEventListener('pageshow', event => { if (event.persisted) load(); });
  load();
})();
