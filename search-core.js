(() => {
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
