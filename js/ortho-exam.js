(() => {
  const presets = {
    'hip-fracture': {label: '髋部骨折', region: '髋部'},
    'knee-replacement': {
      label: '膝关节置换', region: '膝关节',
      motions: ['屈曲', '伸直']
    },
    'tibial-plateau': {label: '胫骨平台骨折', region: '膝部'},
    'ankle-fracture': {label: '踝关节骨折', region: '踝部'},
    'distal-radius': {label: '桡骨远端骨折', region: '腕部'},
    knee: {
      label: '膝关节查体', region: '膝关节',
      motions: ['屈曲', '伸直'],
      tests: ['Lachman 试验', '前抽屉试验', '后抽屉试验', 'McMurray 试验']
    },
    general: {label: '其他部位', region: '患肢'}
  };
  const sides = {left: '左侧', right: '右侧'};
  const fields = [
    ['inspection', '视诊'], ['palpation', '触诊'],
    ['sensation', '感觉'], ['motor', '肌力'],
    ['pulse', '远端动脉搏动'], ['crt', '毛细血管再充盈时间'],
    ['skin', '皮肤颜色及皮温'], ['note', '补充查体']
  ];
  const quickFindings = {
    inspection: ['局部肿胀', '瘀斑', '畸形', '皮肤破损'],
    palpation: ['局部压痛']
  };
  const choicesByField = {
    sensation: ['正常', '减退', '消失', '异常感觉'],
    motor: ['M5', 'M4', 'M3', 'M2', 'M1', 'M0'],
    pulse: ['可触及', '减弱', '未触及']
  };
  const text = value => typeof value === 'string' ? value.trim().replace(/[。；\s]+$/u, '') : '';
  const specialResults = {'阳性': '＋', '阴性': '－'};

  function formatExam(presetId, selection, exams) {
    if (!Object.hasOwn(presets, presetId)) return '';
    const selectedSides = selection === 'both' ? ['left', 'right'] : [selection];
    const preset = presets[presetId];
    return selectedSides.filter(side => Object.hasOwn(sides, side)).flatMap(side => {
      const exam = exams[side] || {};
      const findings = [];
      for (const [key, label] of fields.slice(0, 2)) {
        const finding = text(exam[key]);
        if (finding) findings.push(label + '：' + finding);
      }
      for (const direction of preset.motions || []) {
        const motion = [text(exam[direction + '主动']), text(exam[direction + '被动'])];
        const values = motion.map((value, index) => value && (index ? '被动' : '主动') + value).filter(Boolean);
        const pain = text(exam[direction + '疼痛']);
        if (pain) values.push(pain);
        if (values.length) findings.push('活动度' + direction + '：' + values.join('、'));
      }
      const tests = (preset.tests || []).filter(name => Object.hasOwn(specialResults, exam[name]))
        .map(name => name + '（' + specialResults[exam[name]] + '）');
      if (tests.length) findings.push('特殊试验：' + tests.join('、'));
      for (const [key, label] of fields.slice(2)) {
        const finding = text(exam[key]);
        if (finding) findings.push(label + '：' + finding);
      }
      return findings.length ? [sides[side] + preset.region + '查体：' + findings.join('；') + '。'] : [];
    }).join('\n');
  }

  function element(tag, label = '') {
    const node = document.createElement(tag);
    if (label) node.textContent = label;
    return node;
  }
  function addField(parent, label, control) {
    const wrapper = element('label', label);
    wrapper.append(control);
    parent.append(wrapper);
    return control;
  }
  function select(choices) {
    const control = element('select');
    for (const [value, label] of choices) control.add(new Option(label, value));
    return control;
  }
  function button(label) {
    const control = element('button', label);
    control.type = 'button';
    return control;
  }

  function open({apply} = {}) {
    if (document.getElementById('orthoExamDialog')) return;
    const dialog = element('dialog');
    dialog.id = 'orthoExamDialog';
    dialog.className = 'ortho-exam-dialog';
    dialog.setAttribute('aria-labelledby', 'orthoExamHeading');
    const header = element('header');
    const heading = element('h2', '骨科专科查体');
    heading.id = 'orthoExamHeading';
    const close = button('关闭');
    close.addEventListener('click', () => dialog.close());
    header.append(heading, close);

    const form = element('div');
    const instructions = element('p', '只填已核实的查体结果。请输入虚构教学资料。');
    const preset = addField(form, '查体模板', select([
      ['', '请选择'], ...Object.entries(presets).map(([id, item]) => [id, item.label])
    ]));
    const side = addField(form, '检查侧别', select([
      ['', '请选择'], ...Object.entries(sides), ['both', '双侧（分别填写）']
    ]));
    const entries = element('div');
    const output = element('textarea');
    output.readOnly = true;
    output.rows = 5;
    output.placeholder = '选择模板和侧别，填写实际结果后生成正文';
    const actions = element('footer');
    const copy = button('复制正文');
    const insert = button('填入本章');
    const status = element('p');
    status.setAttribute('role', 'status');
    actions.append(copy);
    if (apply) actions.append(insert);
    dialog.append(header, instructions, form, entries);
    addField(dialog, '生成正文', output);
    dialog.append(actions, status);
    let activePreset = '';

    function update() {
      const exams = {left: {}, right: {}};
      for (const control of entries.querySelectorAll('[data-exam-field]')) {
        if (control.type === 'checkbox' && !control.checked) continue;
        const exam = exams[control.dataset.examSide];
        const key = control.dataset.examField;
        exam[key] = [exam[key], control.value].filter(Boolean).join('、');
      }
      const result = formatExam(activePreset, side.value, exams);
      const incomplete = side.value === 'both' && ['left', 'right'].some(item => !formatExam(activePreset, item, exams));
      output.value = result;
      copy.disabled = insert.disabled = !result || incomplete;
      status.textContent = incomplete ? '双侧记录请分别填写左右侧结果，或选择已录入的一侧。' : '';
    }
    function updateSides() {
      for (const panel of entries.children) {
        panel.hidden = side.value !== 'both' && panel.dataset.examSide !== side.value;
      }
      update();
    }
    function buildFields() {
      entries.replaceChildren();
      if (!activePreset) return updateSides();
      const selected = presets[activePreset];
      for (const [id, label] of Object.entries(sides)) {
        const panel = element('fieldset');
        panel.dataset.examSide = id;
        panel.append(element('legend', label + selected.region));
        const add = (key, name, control = element('input')) => {
          if (control.tagName === 'INPUT') control.maxLength = 200;
          control.dataset.examSide = id;
          control.dataset.examField = key;
          addField(panel, name, control);
        };
        for (const [key, name] of fields.slice(0, 2)) {
          add(key, name + '补充');
          const quick = element('div');
          quick.className = 'ortho-exam-quick';
          quick.setAttribute('role', 'group');
          quick.setAttribute('aria-label', label + name + '常用所见');
          for (const item of quickFindings[key]) {
            const option = element('input');
            option.type = 'checkbox';
            option.value = item;
            option.dataset.examSide = id;
            option.dataset.examField = key;
            const tag = element('label', item);
            tag.prepend(option);
            quick.append(tag);
          }
          panel.append(quick);
        }
        for (const direction of selected.motions || []) {
          add(direction + '主动', direction + '（主动 ROM）');
          add(direction + '被动', direction + '（被动 ROM）');
          add(direction + '疼痛', direction + '疼痛', select([['', '未记录'], ['疼痛', '疼痛'], ['无痛', '无痛']]));
        }
        for (const name of selected.tests || []) {
          add(name, name, select([['', '未检查'], ['阳性', '阳性'], ['阴性', '阴性']]));
        }
        for (const [key, name] of fields.slice(2)) {
          const choices = choicesByField[key];
          add(key, name, choices ? select([['', '未记录'], ...choices.map(item => [item, item])]) : undefined);
        }
        entries.append(panel);
      }
      updateSides();
    }
    preset.addEventListener('change', () => {
      const hasEntries = Array.from(entries.querySelectorAll('[data-exam-field]'))
        .some(control => control.type === 'checkbox' ? control.checked : text(control.value));
      if (hasEntries && !window.confirm('切换模板会清空左右侧已录入的结果。继续切换？')) {
        preset.value = activePreset;
        return;
      }
      activePreset = preset.value;
      buildFields();
    });
    side.addEventListener('change', updateSides);
    entries.addEventListener('input', update);
    entries.addEventListener('change', update);
    copy.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(output.value);
        status.textContent = '已复制正文。';
      } catch {
        output.focus();
        output.select();
        status.textContent = '已选中正文，请使用系统复制。';
      }
    });
    insert.addEventListener('click', () => { if (output.value && apply?.(output.value)) dialog.close(); });
    dialog.addEventListener('close', () => dialog.remove(), {once: true});
    update();
    document.body.append(dialog);
    dialog.showModal();
    preset.focus();
  }

  globalThis.HajimiOrthoExam = Object.freeze({formatExam, open});
  document.getElementById('openOrthoExam')?.addEventListener('click', () => open());
})();
