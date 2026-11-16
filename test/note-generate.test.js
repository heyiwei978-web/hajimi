import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {randomBytes} from 'node:crypto';
import {PUBLIC_FILES} from '../scripts/public-assets.mjs';
import {MODULES, NAV_SURFACES} from '../config/site-modules.mjs';
import {createSession} from '../api/_auth.js';
import {createNoteHandler, validateInput, buildMessages, findIdentifier, stripMarkdown, DOC_TYPES} from '../api/note-generate.js';

const read = file => fs.readFileSync(new URL('../' + file, import.meta.url), 'utf8');
function res() {
  return {code: 200, headers: {}, setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
    status(n) { this.code = n; return this; }, json(b) { this.body = b; return this; }};
}
function req(cookie, body) {
  return {method: 'POST', query: {}, body, headers: {host: 'local.test', 'x-forwarded-proto': 'https',
    origin: 'https://local.test', 'sec-fetch-site': 'same-origin',
    'content-type': 'application/json', 'x-hajimi-admin': '1', cookie}};
}
function auth(t) {
  const keys = ['HAJIMI_SESSION_SECRET', 'HAJIMI_ADMIN_USER'], prior = keys.map(k => process.env[k]);
  process.env.HAJIMI_SESSION_SECRET = randomBytes(32).toString('hex');
  process.env.HAJIMI_ADMIN_USER = 'fixture-owner';
  t.after(() => keys.forEach((k, i) => prior[i] === undefined ? delete process.env[k] : process.env[k] = prior[i]));
  return 'hajimi_session=' + createSession('fixture-owner');
}
const BODY = {type: 'op', sex: '女', age: '78', complaint: '摔伤致右髋部疼痛3小时', diagnosis: '右股骨颈骨折', operation: '右侧人工股骨头置换术'};
const ENV = {NOTE_AI_API_KEY: 'fixture-key'};
function fakeFetch(calls, reply = {choices: [{message: {content: '**手术记录**\n正文'}, finish_reason: 'stop'}]}, status = 200) {
  return async (url, options) => { calls.push({url, options}); return {ok: status === 200, status, json: async () => reply}; };
}

test('note generator rejects anonymous visitors before calling the AI', async () => {
  const calls = [];
  const handler = createNoteHandler({fetchImpl: fakeFetch(calls), env: ENV});
  const r = res();
  await handler(req('', BODY), r);
  assert.equal(r.code, 401);
  assert.equal(calls.length, 0);
});

test('note generator refuses identifiers and missing fields', async t => {
  const cookie = auth(t), calls = [];
  const handler = createNoteHandler({fetchImpl: fakeFetch(calls), env: ENV});
  for (const body of [
    {...BODY, extra: '姓名：张三'},
    {...BODY, extra: '联系 13800138000'},
    {...BODY, history: '身份证 11010119500101123X'},
    {...BODY, complaint: ''},
    {...BODY, operation: ''},
    {...BODY, type: 'unknown'},
    {...BODY, age: '七十'}
  ]) {
    const r = res();
    await handler(req(cookie, body), r);
    assert.equal(r.code, 400, JSON.stringify(body));
  }
  assert.equal(calls.length, 0);
  assert.equal(validateInput({...BODY, type: 'spec', operation: ''}).error, undefined);
  assert.equal(findIdentifier('右股骨颈骨折，Garden Ⅳ型'), null);
});

test('identifier filtering catches spaced IDs, split phone numbers and unlabeled names', () => {
  const blocked = {
    '110101 19500101 123X': /身份证号/,
    '联系 138 0013 8000': /手机号/,
    '患者张三，男，65岁': /患者姓名/,
    '病人李四 女 42岁': /患者姓名/
  };
  for (const [text, expected] of Object.entries(blocked)) {
    assert.match(validateInput({...BODY, extra: text}).error || '', expected, text);
  }
  assert.equal(findIdentifier('患者老年男性，65岁，因摔伤入院'), null);
  assert.equal(findIdentifier('中年女性，右髋部疼痛'), null);
});

test('note generation blocks common names, institutions and addresses before any AI call', async t => {
  const cookie = auth(t), calls = [];
  const handler = createNoteHandler({fetchImpl: fakeFetch(calls), env: ENV});
  const blocked = [
    ['张三，男，65岁，右膝痛3年', /患者姓名/],
    ['李四 男 65岁', /患者姓名/],
    ['王小明于2026-11-01入住XX市人民医院骨科', /医院/],
    ['住 上海市徐汇区XX路1号', /地址/],
    ['于XX市人民医院就诊', /医院/],
    ['住址：某地', /地址/]
  ];
  for (const [value, expected] of blocked) {
    const r = res();
    await handler(req(cookie, {...BODY, history:value}), r);
    assert.equal(r.code, 400, value);
    assert.match(r.body.error, expected, value);
  }
  assert.equal(calls.length, 0);
  for (const value of ['患者，男，65岁，因摔伤入院', '中年女性，右髋部疼痛', '住院3天后进行手术', '患者曾到当地医院就诊']) {
    assert.equal(validateInput({...BODY, history:value}).error, undefined, value);
  }
  assert.equal(validateInput({...BODY, extra:'虚构教学手术，2026年10月12日09:00至10:30。'}).error, undefined);
});

test('note generator reports a missing key without calling out', async t => {
  const cookie = auth(t), calls = [];
  const r = res();
  await createNoteHandler({fetchImpl: fakeFetch(calls), env: {}})(req(cookie, BODY), r);
  assert.equal(r.code, 503);
  assert.equal(calls.length, 0);
});

test('note generator forwards only the clinical fields and returns plain text', async t => {
  const cookie = auth(t), calls = [];
  const r = res();
  await createNoteHandler({fetchImpl: fakeFetch(calls), env: ENV})(req(cookie, BODY), r);
  assert.equal(r.code, 200);
  assert.equal(r.body.text, '手术记录\n正文');
  assert.equal(r.body.label, '手术记录');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://api.deepseek.com/chat/completions');
  assert.equal(calls[0].options.headers.Authorization, 'Bearer fixture-key');
  const sent = JSON.parse(calls[0].options.body);
  assert.equal(sent.model, 'deepseek-chat');
  assert.equal(sent.temperature, 0.5);
  assert.equal(sent.max_tokens, 3500);
  assert.equal(sent.stream, false);
  assert.match(sent.messages[1].content, /右侧人工股骨头置换术/);
  assert.doesNotMatch(calls[0].options.body, /fixture-owner|hajimi_session/);
});

test('note generator maps AI errors to readable messages', async t => {
  const cookie = auth(t);
  for (const [status, pattern] of [[401, /密钥/], [402, /余额/], [429, /频繁/], [500, /暂时不可用/]]) {
    const r = res();
    await createNoteHandler({fetchImpl: fakeFetch([], {}, status), env: ENV})(req(cookie, BODY), r);
    assert.equal(r.code, 502);
    assert.match(r.body.error, pattern);
  }
});

test('every document type tells the model not to invent facts', () => {
  for (const type of Object.keys(DOC_TYPES)) {
    const checked = validateInput({...BODY, type, day: '2', caseReference: '教学病例', chapterTitle: '入院记录'});
    const [system, user] = buildMessages(checked);
    assert.match(system.content, /不得编造/);
    assert.match(user.content, new RegExp(DOC_TYPES[type].label));
  }
});

test('daily progress requires a valid day and sends the correct stage and observations', () => {
  for (const [type, stage] of [['preDaily', '住院'], ['postDaily', '术后']]) {
    for (const day of ['', '0', '366', '-1', '1.5']) {
      assert.match(validateInput({...BODY, type, day}).error, /病程天数/);
    }
    const checked = validateInput({...BODY, type, day: '2', daily: '虚构示例：当日情况待填写'});
    assert.equal(checked.error, undefined);
    const content = buildMessages(checked)[1].content;
    assert.match(content, new RegExp(stage + '第2天'));
    assert.match(content, /虚构示例：当日情况待填写/);
    assert.match(content, /不得推断/);
  }
  assert.match(validateInput({...BODY, type: 'postDaily', day: '1', operation: ''}).error, /手术方式/);
  assert.match(validateInput({...BODY, type: 'preDaily', day: '1', daily: '联系电话：13800138000'}).error, /手机号|身份信息/);
});

test('other specialties and case names are carried as context, not as current case facts', () => {
  const checked = validateInput({...BODY, type: 'caseChapter', department: '普外科', caseReference: '肝脓肿', chapterTitle: '首次病程记录'});
  const content = buildMessages(checked)[1].content;
  assert.match(content, /科室：普外科/);
  assert.match(content, /参考病例及章节名称：肝脓肿/);
  assert.match(content, /不得将参考病例的事实当成当前病例事实/);
  assert.match(validateInput({...BODY, type: 'caseChapter'}).error, /病例和章节/);
  const withExcerpt=validateInput({...BODY, type:'caseChapter', caseReference:'肝脓肿', chapterTitle:'入院记录', referenceText:'病史结构示例'});
  assert.match(buildMessages(withExcerpt)[1].content, /病史结构示例/);
  assert.match(validateInput({...BODY, referenceText:'姓名：张三'}).error, /身份信息/);
  assert.match(validateInput({...BODY, department: '无效科室'}).error, /科室/);
});

test('note page is published, routed and part of the main navigation', () => {
  for (const file of ['note.html', 'note.css', 'note.js']) assert.ok(PUBLIC_FILES.includes(file), file);
  const note = MODULES.find(module => module.id === 'note');
  assert.equal(note.nav, true);
  assert.ok(NAV_SURFACES.some(surface => surface.file === 'note.html'));
  const vercel = JSON.parse(read('vercel.json'));
  for (const route of note.routes) assert.ok(vercel.rewrites.some(rule => rule.source === route && rule.destination === '/note.html'), route);
  assert.equal(vercel.functions?.['api/note-generate.js']?.maxDuration, 60);
  const page = read('note.html');
  assert.doesNotMatch(page, /<script>(?!<)|\son[a-z]+=/i);
  assert.match(page, /<a class="active" href="\/note" aria-current="page">AI 病历生成<\/a>/);
  assert.doesNotMatch(read('note.js'), /localStorage/);
  assert.match(read('note.js'), /sessionStorage/);
  assert.match(read('tools.html'), /href="\/note"/);
});

test('completion mode keeps safety rails and length targets', () => {
  const checked = validateInput({...BODY, type: 'op'});
  const [system, user] = buildMessages(checked);
  assert.match(system.content, /补全模式/);
  assert.match(system.content, /不少于 600 字/);
  assert.match(system.content, /不得编造/);
  assert.match(user.content, /书写说明：/);
  assert.match(DOC_TYPES.op.guide, /可按术式常规补全/);
  assert.match(DOC_TYPES.op.guide, /按实际填写/);
});

test('note generator returns 429 when the request quota is exhausted', async t => {
  const cookie = auth(t), calls = [];
  const r = res();
  await createNoteHandler({fetchImpl: fakeFetch(calls), env: ENV, quota: async () => ({allowed: false, retryAfter: 120})})(req(cookie, BODY), r);
  assert.equal(r.code, 429);
  assert.equal(r.headers['retry-after'], '120');
  assert.match(r.body.error, /频繁/);
  assert.equal(calls.length, 0);
});

test('truncated AI output is reported instead of returned silently', async t => {
  const cookie = auth(t);
  const reply = {choices: [{message: {content: '手术记录\n半截'}, finish_reason: 'length'}]};
  const r = res();
  await createNoteHandler({fetchImpl: fakeFetch([], reply), env: ENV})(req(cookie, BODY), r);
  assert.equal(r.code, 502);
  assert.match(r.body.error, /截断/);
});

test('markdown formatting is stripped from AI output', async t => {
  const cookie = auth(t);
  const reply = {choices: [{message: {content: '# 手术记录\n\n**一、术前诊断**\n- 右股骨颈骨折\n| 项目 | 值 |\n| --- | --- |'}, finish_reason: 'stop'}]};
  const r = res();
  await createNoteHandler({fetchImpl: fakeFetch([], reply), env: ENV})(req(cookie, BODY), r);
  assert.equal(r.code, 200);
  assert.doesNotMatch(r.body.text, /[#*]/);
  assert.doesNotMatch(r.body.text, /^\s*[-|]/m);
  assert.match(r.body.text, /右股骨颈骨折/);
  assert.match(r.body.text, /项目；值/);
});

test('plain-text cleanup preserves medical values, signs, units, numbering and table cells', () => {
  const source = '```text\r\n# 术后病程记录\r\n**辅助检查**\r\n| 项目 | 结果 |\r\n| :--- | ---: |\r\n| Hb | 108 g/L |\r\n| CRP | > 10 mg/L |\r\n| 肌力 | Ⅳ+级 |\r\n\r\n1. 切口3*4 cm，Na+ 138 mmol/L，HCO3- 22 mmol/L。\r\n> 5 mm\r\n- 5°\r\n- 观察患肢血运，Homan征（-）。\r\n2. 右下肢暂不负重。\r\n医师签名：____\r\n```';
  const text = stripMarkdown(source);
  for (const fact of ['Hb；108 g/L', 'CRP；> 10 mg/L', '肌力；Ⅳ+级', '3*4 cm', 'Na+ 138 mmol/L', 'HCO3- 22 mmol/L', '> 5 mm', '- 5°', 'Homan征（-）', '1. 切口', '2. 右下肢暂不负重', '医师签名：____']) assert.ok(text.includes(fact), fact);
  assert.doesNotMatch(text, /```|\r|\*\*|^#|^\|/m);
  assert.equal(stripMarkdown(text), text);
});

test('cleanup only removes explicit AI wrappers, not medical instructions or reasoning in diagnosis', () => {
  const source = '<think>不应展示的模型推理</think>\n以下是为您生成的手术记录：\n# 手术记录\n诊断分析：保留临床推理。\n注意：警惕骨筋膜室综合征。\n说明：术后暂不负重。\n医师签名：\n※ 本文为草稿，请按患者实际情况核对修改。';
  assert.equal(stripMarkdown(source), '手术记录\n诊断分析：保留临床推理。\n注意：警惕骨筋膜室综合征。\n说明：术后暂不负重。\n医师签名：');
});

test('optional table borders and exponent notation do not lose medical information', () => {
  const source = '项目 | 结果\n--- | ---\nWBC | 6.2×10^9/L\nPLT | 180×10^9/L\n\nWBC 6.2*10**9/L，RBC 4.1*10**12/L。\n> ULN\n> 正常上限3倍\n**处理意见**\n保留用药注意事项。';
  const text = stripMarkdown(source);
  assert.match(text, /项目；结果/);
  assert.match(text, /WBC；6.2×10\^9\/L/);
  assert.match(text, /PLT；180×10\^9\/L/);
  assert.ok(text.includes('WBC 6.2*10**9/L，RBC 4.1*10**12/L。'));
  assert.ok(text.includes('> ULN\n> 正常上限3倍'));
  assert.ok(text.includes('\n处理意见\n'));
  assert.doesNotMatch(text, /\|/);
});

test('incomplete finishes, reasoning-only output and malformed responses never become a successful note', async t => {
  const cookie = auth(t);
  const replies = [
    ...['content_filter', 'insufficient_system_resource', 'aborted', 'tool_calls', null, undefined].map(finish_reason => ({choices: [{message: {content: '半截正文'}, finish_reason}]})),
    {choices: [{message: {reasoning_content: '仅推理内容'}, finish_reason: 'stop'}]},
    ...['', '  ', '```\n```', '<think>未结束', '<think>只有推理</think>', '※ 本文为草稿，请按患者实际情况核对修改。'].map(content => ({choices: [{message: {content}, finish_reason: 'stop'}]})),
    null, {}, {choices: []}
  ];
  for (const reply of replies) {
    const r = res();
    await createNoteHandler({fetchImpl: fakeFetch([], reply), env: ENV, quota: async () => ({allowed: true})})(req(cookie, BODY), r);
    assert.equal(r.code, 502, JSON.stringify(reply));
    assert.equal(r.body.text, undefined);
  }
  const r = res();
  await createNoteHandler({fetchImpl: fakeFetch([], {choices: [{message: {content: '完整正文', reasoning_content: '不要公开的推理'}, finish_reason: 'stop'}]}), env: ENV})(req(cookie, BODY), r);
  assert.equal(r.body.text, '完整正文');
  assert.doesNotMatch(JSON.stringify(r.body), /推理/);
});

test('network errors, response-body timeouts and invalid JSON are sanitized', async t => {
  const cookie = auth(t);
  const failure = () => { throw new Error('upstream private details and fixture-key'); };
  const aborting = signal => new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(new DOMException('timeout', 'AbortError')), {once: true}));
  for (const [fetchImpl, code] of [
    [failure, 502],
    [async () => ({ok: true, json: failure}), 502],
    [async (_, {signal}) => aborting(signal), 504],
    [async (_, {signal}) => ({ok: true, json: () => aborting(signal)}), 504]
  ]) {
    const r = res();
    await createNoteHandler({fetchImpl, env: ENV, timeoutMs: 10, quota: async () => ({allowed: true})})(req(cookie, BODY), r);
    assert.equal(r.code, code);
    assert.doesNotMatch(JSON.stringify(r.body), /private|fixture-key/);
    assert.equal(r.headers['cache-control'], 'no-store');
  }
});

test('same-origin, admin marker, JSON and byte limits still guard the AI before quota or network', async t => {
  const cookie = auth(t), calls = [];
  let quotaCalls = 0;
  const handler = createNoteHandler({fetchImpl: fakeFetch(calls), env: ENV, quota: async () => { quotaCalls++; return {allowed: true}; }});
  for (const [mutate, code] of [
    [r => { r.method = 'GET'; }, 405],
    [r => { r.headers.origin = 'https://other.test'; }, 403],
    [r => { r.headers['sec-fetch-site'] = 'cross-site'; }, 403],
    [r => { delete r.headers['x-hajimi-admin']; }, 403],
    [r => { r.headers['content-type'] = 'text/plain'; }, 415],
    [r => { r.body = {...BODY, extra: '字'.repeat(6000)}; }, 413]
  ]) {
    const request = req(cookie, BODY), r = res();
    mutate(request);
    await handler(request, r);
    assert.equal(r.code, code);
  }
  assert.equal(quotaCalls, 0);
  assert.equal(calls.length, 0);
});
