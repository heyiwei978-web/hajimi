(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const draftKey = 'hajimi.ortho-exam.draft.v1';
  const sides = ['左侧', '右侧', '不分侧'];
  const regions = {
    shoulder: ['肩关节', ['前屈', '后伸', '外展', '内收', '内旋', '外旋']],
    elbow: ['肘关节', ['屈曲', '伸直', '旋前', '旋后']],
    wrist: ['腕关节', ['掌屈', '背伸', '桡偏', '尺偏']],
    hip: ['髋关节', ['屈曲', '后伸', '内收', '外展', '内旋', '外旋']],
    knee: ['膝关节', ['屈曲', '伸直']],
    ankle: ['踝关节', ['背伸', '跖屈', '内翻', '外翻']]
  };
  const basicJoints = Object.fromEntries(Object.entries(regions).map(([id, [name, dirs]]) =>
    [id, {name, dirs: dirs.map(dir => [dir, ''])}]));
  const general = {id: '', name: '通用查体', joints: [], inspect: ['肿胀', '畸形', '瘀斑'], palp: ['局部压痛'], special: []};
  const baseTemplates = [general, ...Object.entries(regions).map(([id, [name]]) =>
    ({...general, id: 'region-' + id, name, joints: [id]}))];
  const neuroFields = ['感觉', '肌力与运动', '远端动脉搏动', '毛细血管再充盈时间', '皮肤颜色及皮温', '补充描述'];
  const resultValues = ['阳性', '阴性', '无法完成'];
  const examSections = [['inspect', '视诊'], ['palp', '触诊']];
  const manualRomFields = ['主动', '被动', '伴随表现'];
  const genericGuide = {
    name: '通用查体',
    stages: [
      {title: '检查范围', checks: [['核对检查侧别及部位', '']]},
      {title: '视诊与触诊', checks: [['记录实际视诊所见', ''], ['记录实际触诊所见', '']]},
      {title: '活动度与特殊试验', checks: [['记录已测量的关节活动度', ''], ['记录所做特殊试验的结果', '']]},
      {title: '神经血运与复核', checks: [['记录已检查的神经血运项目', ''], ['核对生成记录', '']]}
    ]
  };
  const emptyExam = () => ({
    inspect: [], inspectNote: '', palp: [], palpNote: '', tests: Object.create(null), customTests: [],
    rom: {}, customRom: '', neuro: {}, note: ''
  });
  const fresh = () => ({templateId: '', site: '', side: '', compare: '', exams: {}});
  let state = fresh();
  let data = null;
  let guideId = '';
  let stageIndex = 0;
  let checkedSteps = new Set();
  let nextFieldId = 0;

  function element(tag, content, className) {
    const node = document.createElement(tag);
    if (content) node.textContent = content;
    if (className) node.className = className;
    return node;
  }

  function button(text, action, primary = false) {
    const node = element('button', text, primary ? 'exam-primary' : '');
    node.type = 'button';
    node.addEventListener('click', action);
    return node;
  }

  function select(choices, value, change) {
    const control = element('select');
    choices.forEach(([id, name]) => control.add(new Option(name, id)));
    control.value = value;
    control.addEventListener('change', () => change(control.value));
    return control;
  }

  function field(label, control) {
    const node = element('div', '', 'exam-field');
    const caption = element('label', label);
    if (!control.id) control.id = 'exam-field-' + (++nextFieldId);
    caption.htmlFor = control.id;
    node.append(caption, control);
    return node;
  }

  function textField(label, value, change, placeholder = '', maxLength = 350) {
    const input = element('input');
    input.value = value || '';
    input.placeholder = placeholder;
    input.maxLength = maxLength;
    input.addEventListener('input', () => {
      change(input.value);
      renderOutput();
    });
    return field(label, input);
  }

  function choice(label, type, checked = false) {
    const node = element('label', '', 'exam-choice');
    const input = element('input');
    input.type = type;
    input.checked = checked;
    node.append(input, element('span', label));
    return [node, input];
  }

  function panel(title) {
    const node = element('section', '', 'exam-panel');
    node.setAttribute('aria-label', title);
    node.append(element('h2', title));
    return node;
  }

  function setNotice(text) {
    $('examNotice').textContent = text;
  }

  function resultNotice(text) {
    $('examResultNotice').textContent = text;
  }

  function templateList() {
    return [...baseTemplates, ...(data?.templates || [])];
  }

  function template() {
    return templateList().find(item => item.id === state.templateId) || general;
  }

  function activeSides() {
    if (state.side === '双侧') return sides.slice(0, 2);
    return state.side ? [state.side] : [];
  }

  function examFor(side) {
    state.exams[side] ||= emptyExam();
    return state.exams[side];
  }

  function testLabel(name) {
    return name.replace(/阳性(?=\s*\(|$)|异常$/g, '');
  }

  function teachingLink(name) {
    const info = data?.special[name];
    if (!info) return null;
    return button(testLabel(name) + ' · 查体说明', () => {
      $('examTeachingTitle').textContent = testLabel(name);
      const texts = [
        ['检查方法', info.how], ['阳性判定', info.positive],
        ['临床意义', info.meaning], ['操作提醒', info.caution]
      ];
      $('examTeachingBody').replaceChildren(...texts.filter(([, value]) => value)
        .map(([label, value]) => element('p', label + '：' + value)));
      $('examTeaching').showModal();
      $('examTeaching').scrollTop = 0;
    });
  }

  function testField(side, name, description = '') {
    const exam = examFor(side);
    const row = element('div', '', 'exam-test');
    const teaching = teachingLink(name);
    const results = [['', '未记录'], ...resultValues.map(item => [item, item])];
    if (teaching) row.append(teaching);
    if (description) row.append(element('p', description));
    const input = select(results, exam.tests[name] || '', value => {
      if (value) exam.tests[name] = value;
      else delete exam.tests[name];
      renderOutput();
      updateGuideProgress();
    });
    row.append(field(side + ' · ' + testLabel(name), input));
    return row;
  }

  function findingInputs(exam, key, title, options) {
    const group = element('fieldset', '', 'exam-controls');
    const choices = element('div', '', 'exam-grid');
    group.append(element('legend', title), choices);
    [...new Set([...options, ...exam[key]])].forEach(item => {
      const [label, input] = choice(item, 'checkbox', exam[key].includes(item));
      input.addEventListener('change', () => {
        exam[key] = input.checked ? [...exam[key], item] : exam[key].filter(value => value !== item);
        renderOutput();
      });
      choices.append(label);
    });
    group.append(textField(title + '补充', exam[key + 'Note'], value => {exam[key + 'Note'] = value;}));
    return group;
  }

  function jointRows(exam, activeTemplate) {
    const joints = data?.joints || basicJoints;
    const rows = new Map();
    activeTemplate.joints.forEach(id => {
      const joint = joints[id] || basicJoints[id];
      joint.dirs.forEach(([direction, reference]) => {
        rows.set(joint.name + '|' + direction, reference);
      });
    });
    Object.keys(exam.rom).forEach(key => {
      if (!rows.has(key)) rows.set(key, '');
    });
    return [...rows.entries()].map(([key, reference]) => {
      const row = element('div', '', 'exam-rom');
      row.append(element('strong', key.replace('|', ' · ') + (reference ? '（附件参考 ' + reference + '）' : '')));
      manualRomFields.forEach(label => row.append(textField(label, exam.rom[key]?.[label], value => {
        exam.rom[key] ||= {};
        exam.rom[key][label] = value;
      }, label === '伴随表现' ? '疼痛或受限原因' : '实际测量角度', 80)));
      return row;
    });
  }

  function customTestRows(exam, container) {
    const rows = element('div', '', 'exam-stack');
    const resultChoices = [['', '未记录'], ...resultValues.map(item => [item, item])];
    function draw() {
      rows.replaceChildren();
      exam.customTests.forEach((item, index) => {
        const row = element('div', '', 'exam-test');
        const inputs = element('div', '', 'exam-grid');
        inputs.append(
          textField('试验名称', item.name, value => {item.name = value;}, '', 80),
          field('检查结果', select(resultChoices, item.result, value => {item.result = value; renderOutput();}))
        );
        row.append(inputs, button('移除该项', () => {
          exam.customTests.splice(index, 1);
          draw();
          renderOutput();
          rows.nextElementSibling.focus();
        }));
        rows.append(row);
      });
    }
    container.append(rows, button('添加自填特殊试验', () => {
      exam.customTests.push({name: '', result: ''});
      draw();
      rows.lastElementChild.querySelector('input').focus();
    }));
    draw();
  }

  function examForm(side, activeTemplate) {
    const exam = examFor(side);
    const box = panel(side === '不分侧' ? '查体所见' : side + '查体所见');
    examSections.forEach(([key, label]) =>
      box.append(findingInputs(exam, key, label, activeTemplate[key])));
    const tests = element('div', '', 'exam-stack');
    tests.append(element('h3', '特殊试验'));
    [...new Set([...activeTemplate.special, ...Object.keys(exam.tests)])]
      .forEach(name => tests.append(testField(side, name)));
    customTestRows(exam, tests);
    const rom = element('div', '', 'exam-stack');
    rom.append(element('h3', '关节活动度'), ...jointRows(exam, activeTemplate),
      textField('活动度补充', exam.customRom, value => {exam.customRom = value;}, '例如 记录其他方向或未测原因'));
    const neuro = element('div', '', 'exam-grid');
    neuroFields.forEach(label => neuro.append(textField(label, exam.neuro[label], value => {exam.neuro[label] = value;})));
    box.append(tests, rom, element('h3', '神经、血运及皮肤'), neuro,
      textField('其他查体所见', exam.note, value => {exam.note = value;}));
    return box;
  }

  function renderWrite() {
    const selected = template();
    $('examWriteEmpty').hidden = activeSides().length > 0;
    $('examReference').hidden = !selected.template;
    $('examReferenceTip').textContent = selected.tip || '';
    $('examReferenceText').textContent = selected.template || '';
    $('examForms').replaceChildren(...activeSides().map(side => examForm(side, selected)));
  }

  function syncScope() {
    const selector = $('examTemplate');
    const groups = new Map();
    selector.replaceChildren();
    templateList().forEach(item => {
      if (!item.category) {
        selector.add(new Option(item.name, item.id));
        return;
      }
      if (!groups.has(item.category)) {
        const group = element('optgroup');
        group.label = item.category;
        selector.append(group);
        groups.set(item.category, group);
      }
      groups.get(item.category).append(new Option(item.name, item.id));
    });
    selector.value = template().id;
    $('examSite').value = state.site;
    $('examSide').value = state.side;
    $('examCompare').value = state.compare;
    renderWrite();
  }

  function join(values) {
    return values.map(value => value.trim()).filter(Boolean).join('、');
  }

  function describeExam(exam) {
    const findings = [];
    function add(title, values) {
      const text = join(values);
      if (text) findings.push(title + '：' + text);
    }
    examSections.forEach(([key, title]) => add(title, [...exam[key], exam[key + 'Note']]));
    const namedTests = Object.entries(exam.tests).map(([name, result]) => testLabel(name) + '（' + result + '）');
    const customTests = exam.customTests.filter(item => item.name.trim() && item.result)
      .map(item => item.name.trim() + '（' + item.result + '）');
    add('特殊试验', [...namedTests, ...customTests]);

    const measurements = Object.entries(exam.rom).flatMap(([key, values]) => {
      const text = join(manualRomFields.map(label => values[label]?.trim() ? label + values[label].trim() : ''));
      return text ? [key.replace('|', '') + ' ' + text] : [];
    });
    add('关节活动度', [...measurements, exam.customRom]);
    add('神经、血运及皮肤', neuroFields.flatMap(label =>
      exam.neuro[label]?.trim() ? [label + ' ' + exam.neuro[label].trim()] : []));
    add('其他', [exam.note]);
    return findings.map(value => value.replace(/[。；;]+$/u, '')).join('；');
  }

  function renderOutput() {
    const parts = activeSides().flatMap(side => {
      const findings = describeExam(examFor(side));
      return findings ? [(side === '不分侧' ? '' : side + '：') + findings + '。'] : [];
    });
    const site = state.site.trim();
    const lines = ['专科查体：' + (site ? '检查部位为' + site + '。' : '')];
    if (state.compare) lines.push('检查方式：' + state.compare + '。');
    $('examOutput').value = parts.length ? [...lines, ...parts].join('\n') : '';
    $('examCopy').disabled = $('examExport').disabled = !parts.length;
  }

  function guides() {
    return {'': genericGuide, ...(data?.guides || {})};
  }

  function guide() {
    const available = guides();
    return Object.hasOwn(available, guideId) ? available[guideId] : genericGuide;
  }

  function stepKey(stageIndex, itemIndex) {
    return JSON.stringify([guideId, state.side, stageIndex, itemIndex]);
  }

  function updateGuideProgress() {
    const status = $('examGuideProgress');
    if (!status) return;
    const scopes = activeSides();
    const counts = guide().stages.reduce((total, stage, index) => {
      if (stage.checks) {
        total[0] += stage.checks.filter((_, itemIndex) => checkedSteps.has(stepKey(index, itemIndex))).length;
        total[1] += stage.checks.length;
      } else {
        total[0] += stage.tests.filter(([name]) => scopes.length > 0 && scopes.every(side => Object.hasOwn(examFor(side).tests, name))).length;
        total[1] += stage.tests.length;
      }
      return total;
    }, [0, 0]);
    status.textContent = '第 ' + (stageIndex + 1) + ' / ' + guide().stages.length + ' 步，已记录 ' + counts[0] + ' / ' + counts[1] + ' 项';
  }

  function renderGuide() {
    const box = $('examGuideBody');
    const active = guide();
    const guideSelector = select(Object.entries(guides()).map(([id, value]) => [id, value.name]), guideId, value => {
      guideId = value;
      stageIndex = 0;
      renderGuide();
      $('examGuideRegion').focus();
    });
    guideSelector.id = 'examGuideRegion';
    const stage = active.stages[stageIndex];
    const progress = element('p', '', 'exam-muted');
    progress.id = 'examGuideProgress';
    progress.setAttribute('aria-live', 'polite');
    const stagePicker = select(active.stages.map((step, index) => [String(index), step.title]), String(stageIndex),
      value => goToStep(Number(value)));
    stagePicker.id = 'examGuideStep';
    const nav = element('div', '', 'exam-actions');
    const previous = button('上一步', () => goToStep(stageIndex - 1));
    previous.disabled = stageIndex === 0;
    nav.append(previous);
    if (stageIndex < active.stages.length - 1) nav.append(button('下一步', () => goToStep(stageIndex + 1), true));
    else nav.append(button('查看查体记录', () => $('examOutput').focus(), true));
    box.replaceChildren(field('流程部位', guideSelector), progress, field('当前步骤', stagePicker));
    if (stage.why) box.append(element('p', stage.why));
    if (stage.checks) {
      stage.checks.forEach(([label, detail], index) => {
        const key = stepKey(stageIndex, index);
        const [row, input] = choice(label, 'checkbox', checkedSteps.has(key));
        input.addEventListener('change', () => {
          if (input.checked) checkedSteps.add(key);
          else checkedSteps.delete(key);
          updateGuideProgress();
        });
        const item = element('div', '', 'exam-test');
        item.append(row);
        if (detail) item.append(element('p', detail));
        box.append(item);
      });
    } else if (!activeSides().length) {
      box.append(element('p', '请选择检查侧别，再填写特殊试验结果。'));
    } else {
      stage.tests.forEach(([name, detail]) =>
        activeSides().forEach(side => box.append(testField(side, name, detail))));
    }
    box.append(nav);
    updateGuideProgress();
  }

  function goToStep(index) {
    stageIndex = index;
    renderGuide();
    $('examGuideStep').focus();
  }

  function renderMode() {
    const requested = location.hash.slice(1);
    const mode = ['guide', 'study'].includes(requested) ? requested : 'write';
    document.querySelectorAll('[data-exam-mode]').forEach(link => {
      if (link.dataset.examMode === mode) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    $('examWorkspace').hidden = mode === 'study';
    $('examWrite').hidden = mode !== 'write';
    $('examGuide').hidden = mode !== 'guide';
    $('examStudy').hidden = mode !== 'study';
    if (mode === 'write') renderWrite();
    if (mode === 'guide') renderGuide();
    if (mode === 'study') renderStudy();
  }

  let studyMode = 'knowledge';
  let studyRegion = 'knee';
  let studyDisease = '';
  let caseId = '';
  const attempts = new Map();

  function renderStudy() {
    const box = $('examStudyBody');
    if (!data) {
      box.replaceChildren(element('p', '从本机导入查体书写器 v10 后，可阅读疾病知识并练习病例。'),
        button('选择资料文件', () => {
          $('examSource').open = true;
          $('examImport').focus();
        }));
      return;
    }
    const actions = element('div', '', 'exam-actions');
    [['knowledge', '疾病知识'], ['cases', '病例训练']].forEach(([id, label]) => {
      const action = button(label, () => {studyMode = id; renderStudy(); $('examStudySelector')?.focus();}, studyMode === id);
      action.setAttribute('aria-pressed', String(id === studyMode));
      actions.append(action);
    });
    box.replaceChildren(actions);
    if (studyMode === 'knowledge') renderKnowledge(box);
    else renderCases(box);
  }

  function renderKnowledge(box) {
    const choices = Object.entries(data.knowledge)
      .filter(([, items]) => items.length).map(([id]) => [id, regions[id][0]]);
    if (!choices.length) {
      box.append(element('p', '资料文件中没有疾病知识。'));
      return;
    }
    if (!data.knowledge[studyRegion].length) studyRegion = choices[0][0];
    const items = data.knowledge[studyRegion];
    const topic = items.find(item => item.id === studyDisease) || items[0];
    const selectors = element('div', '', 'exam-grid');
    const regionSelector = select(choices, studyRegion, value => {
      studyRegion = value;
      renderStudy();
      $('examStudySelector').focus();
    });
    regionSelector.id = 'examStudySelector';
    const topicSelector = select(items.map(item => [item.id, item.name]), topic.id, value => {
      studyDisease = value;
      renderStudy();
      $('examStudyTopic').focus();
    });
    topicSelector.id = 'examStudyTopic';
    selectors.append(field('关节部位', regionSelector), field('疾病', topicSelector));
    box.append(selectors, element('h3', topic.name), element('p', topic.subtitle, 'exam-muted'));
    topic.sections.forEach(([title, content]) => {
      const section = element('section', '', 'exam-test');
      section.append(element('h4', title));
      if (Array.isArray(content)) {
        const list = element('ul');
        list.append(...content.map(item => element('li', item)));
        section.append(list);
      } else {
        section.append(element('p', content));
      }
      box.append(section);
    });
    if (topic.pearl) box.append(element('p', topic.pearl, 'exam-reveal'));
    const links = element('div', '', 'exam-actions');
    (topic.exams || []).forEach(name => {
      const link = teachingLink(name);
      if (link) links.append(link);
    });
    const guideRegion = ['elbow', 'wrist'].includes(studyRegion) ? 'elbowhand' : studyRegion;
    if (data.guides[guideRegion]) links.append(button('打开该部位分步查体', () => {
      guideId = guideRegion;
      stageIndex = 0;
      location.hash = 'guide';
    }));
    const practice = data.caseForTopic[topic.id];
    links.append(button(practice ? '练习相关病例' : '浏览病例题', () => {
      if (practice) caseId = practice;
      studyMode = 'cases';
      renderStudy();
      $('examStudySelector')?.focus();
    }));
    box.append(links);
  }

  function renderCases(box) {
    const item = data.cases.find(candidate => candidate.id === caseId) || data.cases[0];
    if (!item) {
      box.append(element('p', '资料文件中没有病例题。'));
      return;
    }
    caseId = item.id;
    if (!attempts.has(caseId)) attempts.set(caseId, {index: 0, answers: []});
    const attempt = attempts.get(caseId);
    const picker = select(data.cases.map(entry => [entry.id, entry.title]), caseId, value => {
      caseId = value;
      renderStudy();
      $('examStudySelector').focus();
    });
    picker.id = 'examStudySelector';
    box.append(field('选择病例', picker), element('h3', item.title),
      element('p', item.level + ' · ' + item.disease, 'exam-muted'),
      element('p', item.story, 'exam-reveal'));
    item.reveals.slice(0, attempt.index).forEach(text => box.append(element('p', text, 'exam-reveal')));
    const question = item.questions[attempt.index];
    if (!question) {
      const score = attempt.answers.filter((answer, index) => answer === item.questions[index].answer).length;
      const summary = element('h4', '病例总结');
      summary.tabIndex = -1;
      box.append(summary, element('p', '本病例得分 ' + score + ' / ' + item.questions.length),
        button('重新练习', () => {
          attempts.delete(caseId);
          renderStudy();
          $('examCaseQuestion')?.focus();
        }));
      return;
    }
    const answered = attempt.answers[attempt.index];
    const group = element('fieldset', '', 'exam-controls exam-stack');
    const heading = element('legend', '第 ' + (attempt.index + 1) + ' / ' + item.questions.length + ' 题　' + question.q);
    heading.tabIndex = -1;
    heading.id = 'examCaseQuestion';
    group.append(heading);
    let selection;
    const submit = button('提交答案', () => {
      attempt.answers[attempt.index] = selection;
      renderStudy();
      $('examCaseFeedback')?.focus();
    }, true);
    submit.disabled = true;
    question.opts.forEach((option, index) => {
      const [label, input] = choice(option, 'radio', index === answered);
      input.name = 'examCaseAnswer';
      input.disabled = answered !== undefined;
      input.addEventListener('change', () => {
        selection = index;
        submit.disabled = false;
      });
      group.append(label);
    });
    box.append(group);
    if (answered === undefined) {
      box.append(submit);
    } else {
      const prefix = answered === question.answer ? '回答正确。' : '本题未答对。';
      const feedback = element('p', prefix + ' 正确答案：' + question.opts[question.answer] + '。' + question.why, 'exam-reveal');
      feedback.id = 'examCaseFeedback';
      feedback.tabIndex = -1;
      const next = button(attempt.index + 1 === item.questions.length ? '查看病例总结' : '下一题', () => {
        attempt.index++;
        renderStudy();
        ($('examCaseQuestion') || $('examStudyBody').querySelector('h4')).focus();
      }, true);
      box.append(feedback, next);
    }
  }

  function textValue(value) {
    return typeof value === 'string' ? value : '';
  }

  function cleanRecord(value, normalize) {
    return Object.fromEntries(Object.entries(value && typeof value === 'object' ? value : {})
      .map(([key, entry]) => [key, normalize(entry)]));
  }

  function readExam(value) {
    const record = value || {};
    const result = emptyExam();
    ['inspectNote', 'palpNote', 'customRom', 'note'].forEach(key => {result[key] = textValue(record[key]);});
    ['inspect', 'palp'].forEach(key => {
      if (Array.isArray(record[key])) result[key] = record[key].filter(item => typeof item === 'string');
    });
    Object.entries(cleanRecord(record.tests, textValue)).forEach(([key, item]) => {
      if (resultValues.includes(item)) result.tests[key] = item;
    });
    result.rom = cleanRecord(record.rom, item => cleanRecord(item, textValue));
    result.neuro = cleanRecord(record.neuro, textValue);
    if (Array.isArray(record.customTests)) result.customTests = record.customTests.filter(Boolean)
      .map(item => ({name: textValue(item.name), result: resultValues.includes(item.result) ? item.result : ''}));
    return result;
  }

  function loadDraft() {
    try {
      const raw = sessionStorage.getItem(draftKey);
      if (!raw) {resultNotice('当前标签页没有草稿。'); return;}
      const draft = JSON.parse(raw);
      const side = [...sides, '双侧'].includes(draft.side) ? draft.side : '';
      const compare = ['与健侧对比', '双侧对比'].includes(draft.compare) ? draft.compare : '';
      const exams = Object.fromEntries(sides.filter(label => draft.exams?.[label])
        .map(label => [label, readExam(draft.exams[label])]));
      if ($('examOutput').value && !window.confirm('读取草稿会替换当前表单，是否继续？')) return;
      state = {templateId: textValue(draft.templateId), site: textValue(draft.site), side, compare, exams};
      checkedSteps = new Set(Array.isArray(draft.checkedSteps) ? draft.checkedSteps : []);
      syncScope();
      renderMode();
      renderOutput();
      resultNotice('已读取草稿。');
    } catch {
      resultNotice('读取草稿失败。');
    }
  }

  $('examTemplate').addEventListener('change', event => {
    state.templateId = event.target.value;
    $('examReference').open = false;
    renderWrite();
  });
  $('examSite').addEventListener('input', event => {
    state.site = event.target.value;
    renderOutput();
  });
  $('examSide').addEventListener('change', event => {
    state.side = event.target.value;
    renderMode();
    renderOutput();
  });
  $('examCompare').addEventListener('change', event => {
    state.compare = event.target.value;
    renderOutput();
  });
  $('examImport').addEventListener('change', async event => {
    const input = event.target;
    const file = input.files[0];
    if (!file) return;
    input.disabled = true;
    try {
      if (file.size > HajimiOrthoExamImport.maxBytes) throw new Error('资料文件过大');
      data = HajimiOrthoExamImport.parse(await file.text());
      attempts.clear();
      checkedSteps.clear();
      guideId = '';
      stageIndex = 0;
      syncScope();
      renderMode();
      $('examSource').open = false;
      $('examSource').querySelector('summary').focus();
      setNotice('已导入 ' + data.templates.length + ' 个病种参考、' + data.cases.length + ' 个病例。');
    } catch (error) {
      setNotice('导入失败。' + error.message);
    } finally {
      input.value = '';
      input.disabled = false;
    }
  });
  $('examJump').addEventListener('click', () => $('examOutput').focus());
  $('examSave').addEventListener('click', () => {
    try {
      sessionStorage.setItem(draftKey, JSON.stringify({...state, checkedSteps: [...checkedSteps]}));
      resultNotice('草稿已保存到当前标签页。');
    } catch {
      resultNotice('浏览器无法保存草稿。');
    }
  });
  $('examLoad').addEventListener('click', loadDraft);
  $('examReset').addEventListener('click', () => {
    if (!window.confirm('清空当前查体记录和会话草稿？')) return;
    state = fresh();
    checkedSteps.clear();
    stageIndex = 0;
    resultNotice('已清空查体记录。');
    try {sessionStorage.removeItem(draftKey);} catch {resultNotice('已清空表单，浏览器无法清除会话草稿。');}
    syncScope();
    renderMode();
    renderOutput();
  });
  $('examCopy').addEventListener('click', async () => {
    const output = $('examOutput');
    try {
      await navigator.clipboard.writeText(output.value);
      resultNotice('已复制查体记录。');
    } catch {
      output.focus();
      output.select();
      let copied = false;
      try {copied = document.execCommand('copy');} catch { /* Keep the text selected for manual copy. */ }
      resultNotice(copied ? '已复制查体记录。' : '已选中文本，请手动复制。');
    }
  });
  $('examExport').addEventListener('click', () => {
    const file = new Blob(['\uFEFF', $('examOutput').value], {type: 'text/plain;charset=utf-8'});
    const url = URL.createObjectURL(file);
    const link = element('a');
    link.href = url;
    link.download = '骨科专科查体.txt';
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  window.addEventListener('hashchange', renderMode);
  syncScope();
  renderMode();
  renderOutput();
})();
