(() => {
  // Highlight literal metadata matches only. Escape every text fragment before
  // adding markup so neither a query nor a template label can introduce HTML.
  globalThis.highlightHajimiSearch = (text, query) => {
    const value = String(text ?? '');
    const escape = fragment => fragment.replace(/[&<>'"]/g, char => ({
      '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;'
    }[char]));
    const terms = [...new Set(String(query || '').trim().split(/\s+/).filter(Boolean))]
      .sort((a, b) => b.length - a.length);
    if (!terms.length) return escape(value);
    const pattern = new RegExp(terms.map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'giu');
    let result = '', offset = 0;
    for (const match of value.matchAll(pattern)) {
      result += escape(value.slice(offset, match.index)) + '<mark class="search-hit">' + escape(match[0]) + '</mark>';
      offset = match.index + match[0].length;
    }
    return result + escape(value.slice(offset));
  };

  // Index metadata once, after all clinical batches have finished loading.
  // No patient details or generated record bodies are stored in this index.
  globalThis.createHajimiSearch = records => {
    const index = records.map(record => ({record, text:[record.department, record.group,
      record.name, record.type, record.stage, record.desc].filter(Boolean).join(' ').toLowerCase()}));
    return (state, department = null) => {
      const terms = String(state.q || '').trim().toLowerCase().split(/\s+/).filter(Boolean);
      return index.filter(({record, text}) => (!department || record.department === department)
        && (state.group === 'all' || record.group === state.group)
        && (state.stage === 'all' || record.stage === state.stage)
        && (state.type === 'all' || record.type === state.type)
        && terms.every(term => text.includes(term))).map(({record}) => record);
    };
  };
})();
