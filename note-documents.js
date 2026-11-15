/* 本标签页文书集合：逐份保留正文和输入快照，页面提示不参与复制。 */
globalThis.HajimiNoteDocuments = class {
  constructor({storageState, onChange}) {
    this.storageState = storageState;
    this.onChange = onChange;
    this.key = 'hajimi-note-documents-v1';
    this.legacyKey = 'hajimi-note-result-v1';
    this.items = [];
    this.active = '';
    this.pending = null;
    this.busy = false;
    this.output = document.getElementById('noteOutput');
    this.list = document.getElementById('noteDocumentList');
    this.result = document.getElementById('noteResult');
    this.title = document.getElementById('noteResultTitle');
    this.facts = document.getElementById('noteFactList');
    this.output.addEventListener('input', () => {
      const item = this.current();
      if (!item) return;
      item.text = this.output.value;
      document.getElementById('noteCopyStatus').hidden = true;
      this.save();
      this.renderFacts();
    });
  }

  current() { return this.items.find(item => item.id === this.active); }
  hasText() { return this.items.some(item => item.text.trim()); }
  existing(type, input) { return this.items.find(item => item.id === HajimiNoteWorkflow.key(type, input) && item.text.trim()); }

  save() {
    try {
      sessionStorage.setItem(this.key, JSON.stringify({items:this.items.filter(item => item.text.trim()), active:this.active, pending:this.pending}));
      sessionStorage.removeItem(this.legacyKey);
      this.storageState(this.key, false);
    } catch { this.storageState(this.key, true); }
  }

  restore() {
    try {
      const raw = sessionStorage.getItem(this.key);
      if (raw) {
        const data = JSON.parse(raw);
        if (!Array.isArray(data.items)) throw new Error('Invalid documents');
        this.items = data.items.filter(item => typeof item.id === 'string' && typeof item.text === 'string' && item.text.trim() && typeof item.label === 'string');
        this.active = data.active;
        const pending = data.pending;
        if (pending && Array.isArray(pending.types) && pending.types.every(type => Object.hasOwn(HajimiNoteWorkflow.labels, type)) && pending.input && typeof pending.input === 'object') this.pending = pending;
      } else {
        const old = JSON.parse(sessionStorage.getItem(this.legacyKey) || 'null');
        if (typeof old?.text === 'string' && old.text.trim()) this.items = [{id:'legacy', label:old.label || '上次生成结果', text:old.text, stale:true, input:null}];
      }
      if (!this.current()) this.active = this.items[0]?.id || '';
      this.render();
    } catch { this.storageState(this.key, true); }
  }

  put(type, input, text) {
    const id = HajimiNoteWorkflow.key(type, input);
    const item = {id, type, input:{...input}, label:HajimiNoteWorkflow.title(type, input), text, stale:false};
    const index = this.items.findIndex(entry => entry.id === id);
    if (index < 0) this.items.push(item);
    else this.items[index] = item;
    this.active = id;
    this.save();
    this.render();
  }

  markStale() {
    this.items.forEach(item => { item.stale = true; });
    this.save();
    this.render();
  }

  clearCurrent() {
    this.items = this.items.filter(item => item.id !== this.active);
    this.active = this.items[0]?.id || '';
    this.save();
    this.render();
  }

  clearAll() {
    this.items = [];
    this.active = '';
    this.pending = null;
    this.save();
    this.render();
  }

  setBusy(value) { this.busy = value; this.render(); }

  renderFacts() {
    this.facts.replaceChildren();
    const item = this.current();
    if (!item?.input) {
      const message = document.createElement('p');
      message.textContent = '旧版本结果没有输入快照，请对照病情手动核对。';
      this.facts.append(message);
      return;
    }
    for (const [label, value] of HajimiNoteWorkflow.facts(item.input)) {
      const row = document.createElement('div');
      const term = document.createElement('dt');
      term.textContent = label;
      const detail = document.createElement('dd');
      const source = document.createElement('span');
      source.className = 'note-fact-source';
      // 只高亮输入快照，不修改编辑区正文；使用 textContent 防止 HTML 注入。
      for (const part of value.split(/((?:左|右|双)侧?|\d+(?:\.\d+)?(?:\s*(?:g\/L|mg\/L|mmol\/L|mL|ml|mm|cm|°|%))?)/g)) {
        const node = document.createElement(/^(?:左|右|双|\d)/.test(part) ? 'mark' : 'span');
        node.textContent = part;
        source.append(node);
      }
      const status = document.createElement('span');
      status.className = 'note-fact-status';
      status.textContent = HajimiNoteWorkflow.contains(item.text, value) ? '含输入原文，仍需核对' : '请对照正文，可能已改写或未采用';
      detail.append(source, status);
      row.append(term, detail);
      this.facts.append(row);
    }
  }

  render() {
    const item = this.current();
    this.result.hidden = !item;
    this.output.value = item?.text || '';
    this.output.readOnly = this.busy;
    this.title.textContent = item ? item.label + (item.stale ? '（输入已变化，请核对）' : '') : '生成结果';
    this.list.replaceChildren();
    for (const entry of this.items) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = entry.label + (entry.stale ? ' · 待核对' : '');
      button.setAttribute('aria-pressed', String(entry.id === this.active));
      button.disabled = this.busy;
      button.addEventListener('click', () => {
        this.active = entry.id;
        document.getElementById('noteCopyStatus').hidden = true;
        this.save();
        this.render();
        this.output.focus();
      });
      this.list.append(button);
    }
    this.renderFacts();
    this.onChange();
  }
};
