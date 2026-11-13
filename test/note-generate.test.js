import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {randomBytes} from 'node:crypto';
import {PUBLIC_FILES} from '../scripts/public-assets.mjs';
import {MODULES, NAV_SURFACES} from '../config/site-modules.mjs';
import {createSession} from '../api/_auth.js';
import {createNoteHandler, validateInput, buildMessages, findIdentifier, DOC_TYPES} from '../api/note-generate.js';

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
function fakeFetch(calls, reply = {choices: [{message: {content: '**手术记录**\n正文'}}]}, status = 200) {
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

test('note page is published, routed and kept out of the main navigation', () => {
  for (const file of ['note.html', 'note.css', 'note.js']) assert.ok(PUBLIC_FILES.includes(file), file);
  const note = MODULES.find(module => module.id === 'note');
  assert.equal(note.nav, false);
  assert.ok(NAV_SURFACES.some(surface => surface.file === 'note.html'));
  const vercel = JSON.parse(read('vercel.json'));
  for (const route of note.routes) assert.ok(vercel.rewrites.some(rule => rule.source === route && rule.destination === '/note.html'), route);
  const page = read('note.html');
  assert.doesNotMatch(page, /<script>(?!<)|\son[a-z]+=/i);
  assert.doesNotMatch(read('note.js'), /localStorage|sessionStorage/);
  assert.match(read('tools.html'), /href="\/note"/);
});
