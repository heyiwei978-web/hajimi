(() => {
  // 常见骨科病种示例：只用于快速填表，X 处请按实际修改。
  const PRESETS = [
    {name: '股骨颈骨折', complaint: '摔伤致右髋部疼痛、活动受限X小时', diagnosis: '右股骨颈骨折（Garden Ⅳ型）',
      operations: ['右侧人工股骨头置换术', '右侧人工全髋关节置换术', '右股骨颈骨折闭合复位空心螺钉内固定术']},
    {name: '股骨粗隆间骨折', complaint: '摔伤致右髋部疼痛、活动受限X小时', diagnosis: '右股骨粗隆间骨折',
      operations: ['右股骨粗隆间骨折闭合复位股骨近端防旋髓内钉（PFNA）内固定术']},
    {name: '桡骨远端骨折', complaint: '摔伤致左腕部疼痛、肿胀、畸形X小时', diagnosis: '左桡骨远端骨折',
      operations: ['左桡骨远端骨折切开复位钢板内固定术', '左桡骨远端骨折闭合复位石膏外固定术']},
    {name: '踝关节骨折', complaint: '扭伤致右踝部疼痛、肿胀、活动受限X天', diagnosis: '右踝关节骨折（三踝骨折）',
      operations: ['右踝关节骨折切开复位钢板螺钉内固定术']},
    {name: '胫骨平台骨折', complaint: '外伤致右膝部疼痛、肿胀、活动受限X小时', diagnosis: '右胫骨平台骨折（Schatzker Ⅱ型）',
      operations: ['右胫骨平台骨折切开复位植骨钢板内固定术']},
    {name: '胫腓骨干骨折', complaint: '外伤致右小腿疼痛、肿胀、畸形X小时', diagnosis: '右胫腓骨干骨折',
      operations: ['右胫骨骨折闭合复位髓内钉内固定术']},
    {name: '髌骨骨折', complaint: '摔伤致右膝部疼痛、肿胀、活动受限X小时', diagnosis: '右髌骨骨折',
      operations: ['右髌骨骨折切开复位克氏针张力带内固定术']},
    {name: '锁骨骨折', complaint: '摔伤致左肩部疼痛、活动受限X小时', diagnosis: '左锁骨中段骨折',
      operations: ['左锁骨骨折切开复位钢板内固定术']},
    {name: '肱骨近端骨折', complaint: '摔伤致左肩部疼痛、肿胀、活动受限X小时', diagnosis: '左肱骨近端骨折（Neer 三部分骨折）',
      operations: ['左肱骨近端骨折切开复位锁定钢板内固定术']},
    {name: '膝骨关节炎', complaint: '右膝关节疼痛X年，加重伴活动受限X月', diagnosis: '右膝关节骨性关节炎（K-L Ⅳ级）',
      operations: ['右侧人工全膝关节置换术']}
  ];
  const MAX_REQUEST_BYTES = 16384;
  // 稍长于服务端 60 秒执行窗口，覆盖响应传输；超时不会清空已有正文。
  const REQUEST_TIMEOUT_MS = 65000;
  const DRAFT_KEY = 'hajimi-note-draft-v1';
  const FIELD_NAMES = ['department', 'sex', 'age', 'complaint', 'history', 'diagnosis', 'secondary', 'operation', 'anesthesia', 'extra', 'extraScope', 'day', 'daily', 'dailyPhase', 'referenceText', 'allergies', 'checks', 'operativeFacts'];
  // 与 api/note-generate.js 中的身份信息识别保持一致。
  const GENERIC_NAME_WORDS = new Set(['老年', '中年', '青年', '男性', '女性', '高龄', '患儿', '儿童', '成年', '患者']);
  const NEEDS_OPERATION = new Set(['preop', 'op', 'postop', 'postDaily']);
  const NEEDS_DAY = new Set(['preDaily', 'postDaily']);

  const form = document.getElementById('noteForm');
  const preset = document.getElementById('notePreset');
  const operations = document.getElementById('noteOperations');
  const status = document.getElementById('noteStatus');
  const result = document.getElementById('noteResult');
  const output = document.getElementById('noteOutput');
  const login = document.getElementById('noteLogin');
  const buttons = [...form.querySelectorAll('[data-type]')];
  const caseSelect = document.getElementById('noteCase');
  const chapterSelect = document.getElementById('noteChapter');
  const caseStatus = document.getElementById('noteCaseStatus');
  const referenceWrap = document.getElementById('noteReferenceWrap');
  const reference = document.getElementById('noteReference');
  const storageStatus = document.getElementById('noteStorageStatus');
  const clearButton = document.getElementById('noteClear');
  const copyStatus = document.getElementById('noteCopyStatus');
  let cases = [], referenceRequest = 0;
  let busy = false;
  let previousCase = '';
  let suppressCaseConfirm = false;
  let restoredReference = null;
  let previousDay = '', previousPhase = 'post', previousPreset = '', stopRequested = false;
  const batchChoices = [...form.querySelectorAll('[data-batch-type]')];
  const batchButton = document.getElementById('noteGenerateSet');
  const resumeButton = document.getElementById('noteResume');
  const stopButton = document.getElementById('noteStop');
  const batchStatus = document.getElementById('noteBatchStatus');
  const storageFailures = new Set();
  const documents = new HajimiNoteDocuments({storageState, onChange:updateBatchControls});

  function storageState(key, failed) {
    if (failed) storageFailures.add(key);
    else storageFailures.delete(key);
    storageStatus.hidden = !storageFailures.size;
    storageStatus.textContent = storageFailures.size ? '本标签页暂存不可用，刷新可能丢失修改，请先复制保留正文。' : '';
  }

  function findIdentifier(text) {
    if (/\d{6}[\s-]?\d{8}[\s-]?\d{3}[\dXx]/.test(text)) return '身份证号';
    if (/(?<!\d)1[3-9]\d[\s-]?\d{4}[\s-]?\d{4}(?!\d)/.test(text)) return '手机号';
    if (/(姓名|住院号|病案号|门诊号|床号|身份证|医保号|就诊卡号|联系电话)/.test(text)) return '姓名、住院号等身份信息';
    if (/(?:住址|居住地址|家庭地址|联系地址|地址)|(?:家住|居住于|住)[：: \t]*[^\r\n，,。；;]{1,40}(?:路|街|巷|弄|号|村|小区)/.test(text)) return '地址';
    if (/[\u4e00-\u9fffA-Za-z0-9]{1,24}(?:省|市|区|县|州|大学|附属|人民|中医|中心|第一|第二|第三|第四)[\u4e00-\u9fffA-Za-z0-9]{0,16}医院/.test(text)) return '医院名称';
    const named = text.match(/(?:患者|病人)[：:]?\s*([\u4e00-\u9fa5]{2,4})(?=[，,。；;\s]*(?:男|女|男性|女性|\d{1,3}\s*岁))/);
    if (named && !GENERIC_NAME_WORDS.has(named[1].slice(0, 2))) return '患者姓名';
    const leadingName = text.match(/(?:^|[\r\n])[ \t]*([\u4e00-\u9fa5]{2,4})[，,、:：;； \t]+(?:(?:男|女)(?:性)?(?=$|[，,、;； \t\d])|\d{1,3}[ \t]*岁)/m);
    if (leadingName && !GENERIC_NAME_WORDS.has(leadingName[1].slice(0, 2))) return '患者姓名';
    return '';
  }

  function saveDraft() {
    try {
      const data = {};
      for (const name of FIELD_NAMES) data[name] = form.elements[name].value;
      // day 的 input 早于 change/清空确认；未提交的天数不能与旧 daily 一起恢复。
      data.day = previousDay;
      data.dailyPhase = previousPhase;
      const item = caseSelect.value === '' ? null : cases[Number(caseSelect.value)];
      const chapter = chapterSelect.value === '' ? null : item?.chapters[Number(chapterSelect.value)];
      data.batchTypes = batchChoices.filter(element => element.checked).map(element => element.dataset.batchType);
      data.caseId = item?.id || restoredReference?.caseId || '';
      data.chapterId = chapter?.id || restoredReference?.chapterId || '';
      if (Object.values(data).some(value => String(value).trim())) sessionStorage.setItem(DRAFT_KEY, JSON.stringify(data));
      else sessionStorage.removeItem(DRAFT_KEY);
      storageState(DRAFT_KEY, false);
    } catch { storageState(DRAFT_KEY, true); }
  }

  function restoreDraft() {
    try {
      const saved = JSON.parse(sessionStorage.getItem(DRAFT_KEY) || 'null');
      if (!saved || typeof saved !== 'object') return false;
      if (saved.extra && saved.extraScope === undefined) saved.extraScope = '';
      if (Array.isArray(saved.batchTypes)) batchChoices.forEach(element => { element.checked = saved.batchTypes.includes(element.dataset.batchType); });
      if (saved.caseId) restoredReference = {caseId: saved.caseId, chapterId: saved.chapterId};
      let restored = false;
      for (const name of FIELD_NAMES) {
        const element = form.elements[name];
        if (!element || typeof saved[name] !== 'string') continue;
        const limit = Number(element.maxLength);
        element.value = limit > 0 ? saved[name].slice(0, limit) : saved[name];
        if (element.value.trim()) restored = true;
      }
      return restored;
    } catch { storageState(DRAFT_KEY, true); return false; }
  }

  function markResultStale(event) {
    if (event?.target?.matches('[data-batch-type]')) return;
    documents.markStale();
  }

  function updateBatchControls() {
    document.getElementById('noteLegacyExtra').hidden = !form.elements.extra.value.trim() || !!form.elements.extraScope.value;
    batchButton.textContent = '生成所选文书（' + batchChoices.filter(element => element.checked).length + ' 份）';
    const pending = documents.pending;
    resumeButton.hidden = !pending?.types.length;
    resumeButton.textContent = '继续未完成文书（' + (pending?.types.length || 0) + ' 份）';
    batchStatus.hidden = !pending?.types.length;
    batchStatus.textContent = pending?.types.length ? '待完成：' + pending.types.map(type => HajimiNoteWorkflow.title(type, pending.input)).join('、') + '。已完成的文书可在下方切换。' : '';
  }

  fetch('/note-cases.json', {cache: 'no-store'})
    .then(response => { if (!response.ok) throw new Error(); return response.json(); })
    .then(items => {
      cases = items;
      items.forEach((item, index) => caseSelect.add(new Option(item.department + ' · ' + item.title, String(index))));
      caseStatus.textContent = '病例正文供本页查看；仅所选名称和你确认的参考片段会发送给 AI。';
      if (restoredReference) {
        const saved = restoredReference;
        restoredReference = null;
        const index = cases.findIndex(item => item.id === saved.caseId);
        if (index >= 0) {
          const department = form.elements.department.value;
          caseSelect.value = String(index);
          suppressCaseConfirm = true;
          caseSelect.dispatchEvent(new Event('change'));
          form.elements.department.value = department;
          const chapterIndex = cases[index].chapters.findIndex(chapter => chapter.id === saved.chapterId);
          if (chapterIndex >= 0) {
            chapterSelect.value = String(chapterIndex);
            chapterSelect.dispatchEvent(new Event('change'));
          }
          suppressCaseConfirm = false;
        }
        saveDraft();
      }
    })
    .catch(() => { caseStatus.textContent = '病例目录加载失败，请刷新页面重试。'; });

  function clearCaseFields() {
    for (const name of FIELD_NAMES) if (name !== 'department') form.elements[name].value = '';
    form.elements.extraScope.value = 'shared';
    form.elements.dailyPhase.value = 'post';
    previousPhase = 'post';
    preset.value = '';
    previousPreset = '';
    previousDay = '';
    documents.clearAll();
  }

  caseSelect.addEventListener('change', () => {
    const filled = hasCaseInput() || documents.hasText();
    if (!suppressCaseConfirm && filled
      && !window.confirm('切换参考病例会清空已填写的病情信息及本病例全部文书，确定继续吗？')) {
      caseSelect.value = previousCase;
      return;
    }
    if (!suppressCaseConfirm) clearCaseFields();
    previousCase = caseSelect.value;
    referenceRequest++;
    referenceWrap.hidden = true;
    reference.value = '';
    chapterSelect.replaceChildren(new Option('选择参考章节', ''));
    const item = caseSelect.value === '' ? null : cases[Number(caseSelect.value)];
    chapterSelect.disabled = !item;
    if (!item) { saveDraft(); return; }
    preset.value = '';
    operations.replaceChildren();
    form.elements.department.value = item.department;
    item.chapters.forEach((chapter, index) => chapterSelect.add(new Option(chapter.title, String(index))));
    caseStatus.textContent = '选择章节可查看原文；切换病例会清空已填写的病情信息。';
    saveDraft();
  });

  chapterSelect.addEventListener('change', async () => {
    const request = ++referenceRequest;
    referenceWrap.hidden = true;
    reference.value = '';
    const item = cases[Number(caseSelect.value)];
    const chapter = chapterSelect.value === '' ? null : item?.chapters[Number(chapterSelect.value)];
    if (!chapter) return;
    if (!chapter.hasBody || !item.bodyUrl) {
      caseStatus.textContent = '此章节为动态生成的通用文书，请到病历模板页面查看。';
      return;
    }
    caseStatus.textContent = '正在加载教学病例原文……';
    try {
      const response = await fetch(item.bodyUrl);
      if (!response.ok) throw new Error();
      const rows = await response.json();
      const row = rows.find(entry => entry[0] === chapter.id);
      if (!row || typeof row[1] !== 'string') throw new Error();
      if (request !== referenceRequest) return;
      reference.value = row[1];
      referenceWrap.hidden = false;
      caseStatus.textContent = '已显示原文；参考片段会发送给 AI，请先删除身份信息。';
    } catch {
      if (request === referenceRequest) caseStatus.textContent = '病例原文加载失败，请重新选择章节。';
    }
  });

  PRESETS.forEach((item, index) => preset.add(new Option(item.name, String(index))));
  preset.addEventListener('change', () => {
    const item = preset.value === '' ? null : PRESETS[Number(preset.value)];
    operations.replaceChildren();
    if (!item) { previousPreset = ''; return; }
    if ((documents.hasText() || hasCaseInput())
      && !window.confirm('切换常见病种会清空病情信息及本病例全部文书，确定继续吗？')) { preset.value = previousPreset; return; }
    clearCaseFields();
    if (caseSelect.value !== '') {
      suppressCaseConfirm = true;
      caseSelect.value = '';
      caseSelect.dispatchEvent(new Event('change'));
      suppressCaseConfirm = false;
    }
    preset.value = String(PRESETS.indexOf(item));
    previousPreset = preset.value;
    form.elements.department.value = '骨科';
    form.elements.complaint.value = item.complaint;
    form.elements.diagnosis.value = item.diagnosis;
    form.elements.operation.value = item.operations[0];
    item.operations.forEach(name => operations.append(new Option(name)));
    markResultStale();
    saveDraft();
    say('已填入示例，请把 X 改成实际时间，左右侧按实际修改。');
  });

  function say(text, error = false) {
    status.textContent = text;
    status.classList.toggle('note-error', error);
  }

  function sayCopy(text, error = false) {
    copyStatus.textContent = text;
    copyStatus.hidden = !text;
    copyStatus.classList.toggle('note-error', error);
    say(text, error);
  }

  function collect() {
    const data = {};
    for (const name of FIELD_NAMES) data[name] = form.elements[name].value.trim();
    const item = caseSelect.value === '' ? null : cases[Number(caseSelect.value)];
    const chapter = chapterSelect.value === '' ? null : item?.chapters[Number(chapterSelect.value)];
    data.caseReference = item ? item.title : '';
    data.chapterTitle = chapter ? chapter.title : '';
    return data;
  }

  function hasCaseInput() {
    return FIELD_NAMES.some(name => !['department', 'dailyPhase', 'extraScope'].includes(name) && form.elements[name].value.trim());
  }

  function check(data, type) {
    if (!data.complaint || !data.diagnosis) return '请先填写主诉和主诊断';
    if (type === 'caseChapter' && (!data.caseReference || !data.chapterTitle)) return '请先选择参考病例和章节';
    if (NEEDS_OPERATION.has(type) && !data.operation) return '这份文书需要先填写手术方式';
    if (NEEDS_DAY.has(type) && (!/^[1-9]\d{0,2}$/.test(data.day) || Number(data.day) > 365)) return '请填写 1 至 365 的病程天数';
    const phase = type === 'preDaily' ? 'pre' : type === 'postDaily' ? 'post' : type === 'caseChapter' ? HajimiNoteWorkflow.dailyPhase(data.chapterTitle) : '';
    if (phase && (data.daily || data.day) && data.dailyPhase && phase !== 'current' && phase !== data.dailyPhase) return '当日变化的阶段与文书不符，请先切换“当日变化所属阶段”并填写对应天数和情况';
    if (type === 'caseChapter' && phase && data.day && (!/^[1-9]\d{0,2}$/.test(data.day) || Number(data.day) > 365)) return '请填写 1 至 365 的病程天数';
    if (data.age && !/^\d{1,3}$/.test(data.age)) return '年龄请填数字';
    const found = findIdentifier(Object.values(data).join('\n'));
    if (found) return '检测到可能的' + found + '，请删除后再生成';
    return '';
  }

  async function requestNote(type, data) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const started = Date.now();
    const label = HajimiNoteWorkflow.title(type, data);
    say('正在生成「' + label + '」，大约需要 10～40 秒……');
    const ticker = setInterval(() => say('正在生成「' + label + '」，已等待 ' + Math.round((Date.now() - started) / 1000) + ' 秒……'), 1000);
    try {
      const response = await fetch('/api/note-generate', {
        method:'POST', headers:{'Content-Type':'application/json', 'X-Hajimi-Admin':'1'},
        credentials:'same-origin', body:JSON.stringify({type, ...data}), signal:controller.signal
      });
      const body = await response.json().catch(error => {
        if (controller.signal.aborted || error?.name === 'AbortError') throw error;
        return null;
      });
      if (response.status === 401) {
        login.hidden = false;
        throw new Error('还没有登录，请先登录管理入口。');
      }
      if (!response.ok) throw new Error((typeof body?.error === 'string' && body.error) || (response.status === 504 ? '生成超时，请稍后重试。' : '生成失败，请稍后再试。'));
      if (typeof body?.text !== 'string' || !body.text.trim()) throw new Error('未收到有效的病历正文，请重试。');
      return body.text;
    } catch (error) {
      if (controller.signal.aborted) throw new Error('生成等待超时，原结果已保留，请稍后重试。');
      if (error instanceof TypeError) throw new Error('网络连接失败，原结果已保留，请检查网络后再试。');
      throw error;
    } finally { clearInterval(ticker); clearTimeout(timeout); }
  }

  async function generate(types, resuming = false) {
    if (busy) return;
    saveDraft();
    const data = collect();
    if (!types.length) { say('请至少勾选一份文书。', true); return; }
    if (resuming && JSON.stringify(data) !== JSON.stringify(documents.pending?.input)) {
      say('病情信息已变化，请按新信息重新选择生成；已完成文书保留。', true);
      return;
    }
    for (const type of types) {
      const problem = check(data, type);
      if (problem) { say(HajimiNoteWorkflow.title(type, data) + '：' + problem, true); return; }
      if (new TextEncoder().encode(JSON.stringify({type, ...data})).length > MAX_REQUEST_BYTES) { say('输入内容总长度超出限制，请缩短病情或参考片段。', true); return; }
    }
    const replacements = types.filter(type => documents.existing(type, data));
    const changes = [];
    if (replacements.length) changes.push('将替换以下已有文书（包括手动编辑）：' + replacements.map(type => HajimiNoteWorkflow.title(type, data)).join('、'));
    if (!resuming && documents.pending?.types.length) changes.push('将放弃当前未完成任务，其余已生成文书保留');
    if (changes.length && !window.confirm(changes.join('。') + '。确定继续吗？')) return;
    busy = true;
    stopRequested = false;
    copyStatus.hidden = true;
    const controls = [...form.elements].map(element => [element, element.disabled]);
    controls.forEach(([element]) => { element.disabled = true; });
    form.setAttribute('aria-busy', 'true');
    clearButton.disabled = true;
    documents.setBusy(true);
    // 固定输入快照，整套文书逐份使用相同事实；不回传先前的模型输出。
    const queue = [...types];
    const isBatch = types.length > 1 || resuming;
    documents.pending = isBatch ? {types:queue, input:data} : null;
    documents.save();
    updateBatchControls();
    stopButton.hidden = !isBatch;
    stopButton.disabled = false;
    stopButton.textContent = '完成本份后停止';
    let completed = 0;
    try {
      while (queue.length && !stopRequested) {
        const type = queue[0];
        const text = await requestNote(type, data);
        queue.shift();
        documents.put(type, data, text);
        completed++;
      }
      if (!queue.length) documents.pending = null;
      say(queue.length ? '已停止，本次完成 ' + completed + ' 份；未完成文书可手动继续。' : '已生成 ' + completed + ' 份文书，请逐份核对修改后再复制。');
    } catch (error) {
      say(error.message + ' 已有文书与编辑内容均已保留。' + (isBatch ? '本套已暂停，可手动继续未完成文书。' : ''), true);
    } finally {
      documents.save();
      busy = false;
      controls.forEach(([element, disabled]) => { element.disabled = disabled; });
      form.setAttribute('aria-busy', 'false');
      clearButton.disabled = false;
      stopButton.hidden = true;
      documents.setBusy(false);
      if (completed) result.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block:'start'});
    }
  }

  buttons.forEach(button => button.addEventListener('click', () => generate([button.dataset.type])));
  batchChoices.forEach(element => element.addEventListener('change', updateBatchControls));
  batchButton.addEventListener('click', () => generate(batchChoices.filter(element => element.checked).map(element => element.dataset.batchType)));
  resumeButton.addEventListener('click', () => generate(documents.pending?.types || [], true));
  stopButton.addEventListener('click', () => { stopRequested = true; stopButton.disabled = true; stopButton.textContent = '本份完成后停止，已完成内容会保留'; });

  document.getElementById('noteCopy').addEventListener('click', async () => {
    if (!output.value.trim()) { sayCopy('没有可复制的正文。', true); return; }
    try {
      await navigator.clipboard.writeText(output.value);
    } catch {
      output.focus();
      output.select();
      output.setSelectionRange(0, output.value.length);
      try {
        if (!document.execCommand('copy')) throw new Error('copy failed');
      } catch {
        sayCopy('复制失败，正文已全选，请使用系统复制。', true);
        return;
      }
    }
    sayCopy('已复制完整正文。');
  });

  clearButton.addEventListener('click', () => {
    if (busy || !window.confirm('确定删除当前这份文书吗？其他文书保留。')) return;
    documents.clearCurrent();
    say('已删除本份文书。');
  });

  document.getElementById('noteNewCase').addEventListener('click', () => {
    if (busy || !window.confirm('确定清空本病例全部输入、文书和未完成任务，开始新病例吗？')) return;
    form.reset();
    restoredReference = null;
    previousCase = '';
    previousPreset = '';
    previousDay = '';
    previousPhase = 'post';
    referenceRequest++;
    chapterSelect.replaceChildren(new Option('选择病例后查看', ''));
    chapterSelect.disabled = true;
    referenceWrap.hidden = true;
    reference.value = '';
    operations.replaceChildren();
    caseStatus.textContent = '病例正文供本页查看；仅所选名称和你确认的参考片段会发送给 AI。';
    documents.clearAll();
    saveDraft();
    say('已清空本病例，可填写新的虚构教学病例。');
  });

  function changeDay(next) {
    if ((form.elements.daily.value.trim() || documents.pending?.types.length) && !window.confirm('更改天数会清空当日变化和未完成任务，已有文书保留。确定继续吗？')) {
      form.elements.day.value = previousDay;
      saveDraft();
      return;
    }
    form.elements.day.value = next;
    form.elements.daily.value = '';
    previousDay = next;
    documents.pending = null;
    markResultStale();
    saveDraft();
    say('已切换记录天数，请补充今天的变化；基础信息和已有文书保留。');
  }
  form.elements.day.addEventListener('change', () => {
    if (form.elements.day.value !== previousDay) changeDay(form.elements.day.value);
  });
  form.elements.dailyPhase.addEventListener('change', () => {
    if ((form.elements.day.value || form.elements.daily.value.trim() || documents.pending?.types.length) && !window.confirm('切换术前/术后阶段会清空天数、当日变化和未完成任务，基础病情与文书保留。确定继续吗？')) {
      form.elements.dailyPhase.value = previousPhase;
      return;
    }
    previousPhase = form.elements.dailyPhase.value;
    form.elements.day.value = '';
    form.elements.daily.value = '';
    previousDay = '';
    documents.pending = null;
    markResultStale();
    saveDraft();
  });
  document.getElementById('noteNextDay').addEventListener('click', () => {
    const day = form.elements.day.value.trim();
    if (!/^[1-9]\d{0,2}$/.test(day) || Number(day) >= 365) { say('请先填写 1 至 364 的当前天数。', true); return; }
    changeDay(String(Number(day) + 1));
  });

  form.addEventListener('input', saveDraft);
  form.addEventListener('input', updateBatchControls);
  form.addEventListener('change', updateBatchControls);
  form.addEventListener('change', saveDraft);
  form.addEventListener('input', markResultStale);
  form.addEventListener('change', event => {
    if (!suppressCaseConfirm && event.target !== caseSelect) markResultStale(event);
  });
  login.querySelector('a')?.addEventListener('click', saveDraft);
  if (restoreDraft()) say('已恢复本标签页上次填写的草稿；如不需要可清空本病例。');
  previousDay = form.elements.day.value;
  previousPhase = form.elements.dailyPhase.value;
  documents.restore();
  updateBatchControls();
  window.addEventListener('beforeunload', event => {
    if (busy) { event.preventDefault(); event.returnValue = ''; }
  });

  fetch('/api/session', {credentials: 'same-origin'})
    .then(response => response.json())
    .then(session => { login.hidden = !!session.authenticated; })
    .catch(() => {});
})();
