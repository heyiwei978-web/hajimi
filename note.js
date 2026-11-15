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
  const RESULT_KEY = 'hajimi-note-result-v1';
  const FIELD_NAMES = ['department', 'sex', 'age', 'complaint', 'history', 'diagnosis', 'secondary', 'operation', 'anesthesia', 'extra', 'day', 'daily', 'referenceText'];
  const CLEARED_ON_CASE_CHANGE = ['complaint', 'diagnosis', 'history', 'secondary', 'extra', 'day', 'daily'];
  // 与 api/note-generate.js 中的身份信息识别保持一致。
  const GENERIC_NAME_WORDS = new Set(['老年', '中年', '青年', '男性', '女性', '高龄', '患儿', '儿童', '成年', '患者']);
  const NEEDS_OPERATION = new Set(['preop', 'op', 'postop', 'postDaily']);
  const NEEDS_DAY = new Set(['preDaily', 'postDaily']);

  const form = document.getElementById('noteForm');
  const preset = document.getElementById('notePreset');
  const operations = document.getElementById('noteOperations');
  const status = document.getElementById('noteStatus');
  const result = document.getElementById('noteResult');
  const resultTitle = document.getElementById('noteResultTitle');
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
  let resultLabel = '生成结果', resultStale = false;
  const storageFailures = new Set();

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
    const named = text.match(/(?:患者|病人)[：:]?\s*([\u4e00-\u9fa5]{2,4})(?=[，,。；;\s]*(?:男|女|男性|女性|\d{1,3}\s*岁))/);
    if (named && !GENERIC_NAME_WORDS.has(named[1].slice(0, 2))) return '患者姓名';
    return '';
  }

  function saveDraft() {
    try {
      const data = {};
      for (const name of FIELD_NAMES) data[name] = form.elements[name].value;
      const item = caseSelect.value === '' ? null : cases[Number(caseSelect.value)];
      const chapter = chapterSelect.value === '' ? null : item?.chapters[Number(chapterSelect.value)];
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

  function saveResult(label, text) {
    try {
      if (text.trim()) sessionStorage.setItem(RESULT_KEY, JSON.stringify({label, text, stale: resultStale, at: Date.now()}));
      else sessionStorage.removeItem(RESULT_KEY);
      storageState(RESULT_KEY, false);
    } catch { storageState(RESULT_KEY, true); }
  }

  function restoreResult() {
    try {
      const saved = JSON.parse(sessionStorage.getItem(RESULT_KEY) || 'null');
      if (!saved || typeof saved.text !== 'string' || !saved.text.trim()) return;
      resultLabel = typeof saved.label === 'string' ? saved.label : '生成结果';
      resultStale = !!saved.stale;
      resultTitle.textContent = resultLabel + (resultStale ? '（上次生成，可能已过期）' : '（本标签页上次生成）');
      output.value = saved.text;
      result.hidden = false;
    } catch { storageState(RESULT_KEY, true); }
  }

  function markResultStale() {
    if (result.hidden || !output.value) return;
    resultStale = true;
    resultTitle.textContent = resultLabel + '（上次生成，可能已过期）';
    saveResult(resultLabel, output.value);
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
          suppressCaseConfirm = false;
          form.elements.department.value = department;
          const chapterIndex = cases[index].chapters.findIndex(chapter => chapter.id === saved.chapterId);
          if (chapterIndex >= 0) {
            chapterSelect.value = String(chapterIndex);
            chapterSelect.dispatchEvent(new Event('change'));
          }
        }
        saveDraft();
      }
    })
    .catch(() => { caseStatus.textContent = '病例目录加载失败，请刷新页面重试。'; });

  function clearCaseFields() {
    for (const name of CLEARED_ON_CASE_CHANGE) form.elements[name].value = '';
    form.elements.operation.value = '';
    form.elements.referenceText.value = '';
    preset.value = '';
  }

  caseSelect.addEventListener('change', () => {
    const filled = CLEARED_ON_CASE_CHANGE.some(name => form.elements[name].value.trim())
      || form.elements.operation.value.trim();
    if (!suppressCaseConfirm && filled
      && !window.confirm('切换参考病例会清空已填写的主诉、诊断、病史等病情信息，确定继续吗？')) {
      caseSelect.value = previousCase;
      return;
    }
    if (!suppressCaseConfirm) clearCaseFields();
    if (!suppressCaseConfirm) markResultStale();
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
    if (!item) return;
    clearCaseFields();
    if (caseSelect.value !== '') {
      suppressCaseConfirm = true;
      caseSelect.value = '';
      caseSelect.dispatchEvent(new Event('change'));
      suppressCaseConfirm = false;
    }
    preset.value = String(PRESETS.indexOf(item));
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

  function check(data, type) {
    if (!data.complaint || !data.diagnosis) return '请先填写主诉和主诊断';
    if (type === 'caseChapter' && (!data.caseReference || !data.chapterTitle)) return '请先选择参考病例和章节';
    if (NEEDS_OPERATION.has(type) && !data.operation) return '这份文书需要先填写手术方式';
    if (NEEDS_DAY.has(type) && (!/^[1-9]\d{0,2}$/.test(data.day) || Number(data.day) > 365)) return '请填写 1 至 365 的病程天数';
    if (type === 'caseChapter' && data.day && (!/^[1-9]\d{0,2}$/.test(data.day) || Number(data.day) > 365)) return '请填写 1 至 365 的病程天数';
    if (data.age && !/^\d{1,3}$/.test(data.age)) return '年龄请填数字';
    const found = findIdentifier(Object.values(data).join('\n'));
    if (found) return '检测到可能的' + found + '，请删除后再生成';
    return '';
  }

  async function generate(button) {
    if (busy) return;
    saveDraft();
    const type = button.dataset.type;
    const data = collect();
    const problem = check(data, type);
    if (problem) { say(problem, true); return; }
    const requestBody = JSON.stringify({type, ...data});
    if (new TextEncoder().encode(requestBody).length > MAX_REQUEST_BYTES) { say('输入内容总长度超出限制，请缩短病情或参考片段。', true); return; }
    if (!result.hidden && output.value && !window.confirm('生成新文书会替换当前结果，确定继续吗？')) return;
    busy = true;
    copyStatus.hidden = true;
    const controls = [...form.elements].map(element => [element, element.disabled]);
    controls.forEach(([element]) => { element.disabled = true; });
    form.setAttribute('aria-busy', 'true');
    clearButton.disabled = true;
    output.readOnly = true;
    saveResult(resultLabel, output.value);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const started = Date.now();
    say('正在生成「' + button.textContent + '」，大约需要 10～40 秒……');
    const ticker = setInterval(() => {
      say('正在生成「' + button.textContent + '」，已等待 ' + Math.round((Date.now() - started) / 1000) + ' 秒……');
    }, 1000);
    try {
      const response = await fetch('/api/note-generate', {
        method: 'POST',
        headers: {'Content-Type': 'application/json', 'X-Hajimi-Admin': '1'},
        credentials: 'same-origin',
        body: requestBody,
        signal: controller.signal
      });
      const body = await response.json().catch(() => ({}));
      if (response.status === 401) {
        login.hidden = false;
        markResultStale();
        say('还没有登录，请先登录管理入口。', true);
        return;
      }
      if (!response.ok) {
        markResultStale();
        say((typeof body?.error === 'string' && body.error) || (response.status === 504 ? '生成超时，请重试；原结果已保留。' : '生成失败，请稍后再试；原结果已保留。'), true);
        return;
      }
      if (typeof body?.text !== 'string' || !body.text.trim()) {
        markResultStale();
        say('未收到有效的病历正文，原结果已保留，请重试。', true);
        return;
      }
      resultLabel = typeof body.label === 'string' && body.label ? body.label : '生成结果';
      resultStale = false;
      resultTitle.textContent = resultLabel;
      output.value = body.text;
      result.hidden = false;
      saveResult(resultLabel, body.text);
      say('已生成「' + (body.label || button.textContent) + '」，请核对修改后再复制。');
      result.scrollIntoView({behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start'});
    } catch {
      markResultStale();
      say(controller.signal.aborted ? '生成等待超时，原结果已保留，请稍后重试。' : '网络连接失败，原结果已保留，请检查网络后再试。', true);
    } finally {
      clearInterval(ticker);
      clearTimeout(timeout);
      busy = false;
      controls.forEach(([element, disabled]) => { element.disabled = disabled; });
      form.setAttribute('aria-busy', 'false');
      clearButton.disabled = false;
      output.readOnly = false;
    }
  }

  buttons.forEach(button => button.addEventListener('click', () => generate(button)));

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
    if (busy) return;
    if (!window.confirm('确定清空生成结果吗？')) return;
    output.value = '';
    result.hidden = true;
    resultTitle.textContent = '生成结果';
    resultLabel = '生成结果';
    resultStale = false;
    saveResult(resultLabel, '');
    say('已清空。');
  });

  form.addEventListener('input', saveDraft);
  form.addEventListener('change', saveDraft);
  form.addEventListener('input', markResultStale);
  form.addEventListener('change', event => {
    if (!suppressCaseConfirm && event.target !== caseSelect) markResultStale();
  });
  output.addEventListener('input', () => { copyStatus.hidden = true; saveResult(resultLabel, output.value); });
  login.querySelector('a')?.addEventListener('click', saveDraft);
  if (restoreDraft()) say('已恢复本标签页上次填写的草稿；如不需要可清空对应字段。');
  restoreResult();

  fetch('/api/session', {credentials: 'same-origin'})
    .then(response => response.json())
    .then(session => { login.hidden = !!session.authenticated; })
    .catch(() => {});
})();
