import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {randomBytes} from 'node:crypto';
import {NOTE_SCENARIOS} from './fixtures/note-cases.mjs';
import {buildMessages, createNoteHandler, DOC_TYPES, validateInput} from '../api/note-generate.js';
import {createSession} from '../api/_auth.js';

const REVIEW_ITEMS = ['病历完整性', '常规自动补全是否保留', '医学逻辑', '文书格式', '占位符是否过多', '完整复制粘贴', '输入事实是否改变'];

// 仅作审阅线索。关键词/字符数不能判定医学正确性，也不能替代人工读全文。
export function inspectNote(scenario, text) {
  const placeholderCount = (text.match(/【(?:待填写|待核实|待补充|按实际填写)】/g) || []).length;
  const characters = text.replace(/\s/g, '').length;
  return {
    characters, targetCharacters: scenario.body.type === 'postDaily' ? 350 : 600,
    placeholderCount, placeholderHeavy: placeholderCount > 8 || placeholderCount * 8 / Math.max(1, characters) > 0.1,
    missingExactFacts: scenario.requiredFacts.filter(fact => !text.includes(fact)),
    possibleConflicts: scenario.prohibited.filter(fact => text.includes(fact)),
    formattingResidue: /(^\s*#{1,6}\s|\*\*|```|^\s*\|.+\|\s*$|<\/?think>|本文为.*草稿|以下是.*记录)/m.test(text),
    manualReview: Object.fromEntries(REVIEW_ITEMS.map(item => [item, '待人工审核']))
  };
}

async function main(args) {
  if (args.includes('--help')) {
    console.log('准备20份虚构病例：node scripts/evaluate-note-generation.mjs [--out /tmp/note-eval]\n调用现有DeepSeek接口：同上加 --live；需在非生产环境安全配置 NOTE_AI_API_KEY。只使用内置合成病例，不读取生产会话或Blob。');
    return;
  }
  const live = args.includes('--live');
  let outputDirectory;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--live') continue;
    if (args[i] === '--out' && args[i + 1] && !args[i + 1].startsWith('--')) { outputDirectory = args[++i]; continue; }
    throw new Error('参数无效，请使用 --help');
  }
  if (live && !process.env.NOTE_AI_API_KEY?.trim()) throw new Error('未配置 NOTE_AI_API_KEY；请使用非生产测试密钥，或不加 --live 先准备验收资料。');
  const repo = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
  const out = outputDirectory ? path.resolve(outputDirectory) : await fs.mkdtemp(path.join(os.tmpdir(), 'hajimi-note-eval-'));
  if (out === repo || out.startsWith(repo + path.sep)) throw new Error('验收输出目录应放在仓库外，避免将生成正文误提交或发布。');
  await fs.mkdir(out, {recursive: true});
  // 同一路径不可覆盖上次验收，保留可审阅证据。
  await fs.writeFile(path.join(out, 'scenarios.json'), JSON.stringify(NOTE_SCENARIOS, null, 2), {flag: 'wx', mode: 0o600});
  const report = {mode: live ? 'live' : 'prepared-only', at: new Date().toISOString(), results: []};
  const keys = ['HAJIMI_SESSION_SECRET', 'HAJIMI_ADMIN_USER'];
  const prior = keys.map(key => process.env[key]);
  try {
    // 仅为本进程直接调用 handler 构造虚构会话，不登录或读取任何部署。
    process.env.HAJIMI_SESSION_SECRET = randomBytes(32).toString('hex');
    process.env.HAJIMI_ADMIN_USER = 'synthetic-note-evaluation';
    const cookie = 'hajimi_session=' + createSession('synthetic-note-evaluation');
    const handler = createNoteHandler({quota: async () => ({allowed: true})});
    for (const scenario of NOTE_SCENARIOS) {
      const checked = validateInput(scenario.body);
      if (checked.error) throw new Error(scenario.id + '：' + checked.error);
      await fs.writeFile(path.join(out, scenario.id + '.request.json'), JSON.stringify({body: scenario.body, messages: buildMessages(checked)}, null, 2), {flag: 'wx', mode: 0o600});
      const result = {id: scenario.id, title: scenario.title, type: DOC_TYPES[scenario.body.type].label, status: '未调用模型'};
      if (live) {
        const response = {code: 200, setHeader() {}, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; }};
        const started = Date.now();
        await handler({method: 'POST', body: scenario.body, headers: {host: 'local.test', 'x-forwarded-proto': 'https',
          origin: 'https://local.test', 'sec-fetch-site': 'same-origin', 'content-type': 'application/json', 'x-hajimi-admin': '1', cookie}}, response);
        result.durationMs = Date.now() - started;
        result.httpStatus = response.code;
        if (response.code === 200) {
          result.status = '已生成，待人工审核';
          result.signals = inspectNote(scenario, response.body.text);
          await fs.writeFile(path.join(out, scenario.id + '.txt'), response.body.text, {flag: 'wx', mode: 0o600});
        } else {
          result.status = '生成失败';
          result.error = response.body?.error || '接口未返回正文';
          process.exitCode = 1;
        }
      }
      report.results.push(result);
      // 每份完成后写进度，途中中断仍可审阅已完成结果。没有自动重试或续写。
      await fs.writeFile(path.join(out, 'report.json'), JSON.stringify(report, null, 2), {mode: 0o600});
      console.log(scenario.id + '：' + result.status);
    }
    const rows = report.results.map(item => `| ${item.title} | ${item.type} | ${item.status} |`).join('\n');
    await fs.writeFile(path.join(out, 'REVIEW.md'), '# AI 病历生成验收\n\n' +
      (live ? '实际接口调用结果；字符数、占位符及关键词检查只提供审阅线索。' : '仅准备输入和提示词，尚未调用模型，不代表生成质量通过。') +
      '\n\n逐份对照 scenarios.json、正文 txt 及 report.json，检查：' + REVIEW_ITEMS.join('、') +
      '。缺少精确字符串也可能是合理改写，需读全文核实；未命中冲突词不代表无矛盾。医学结论需负责人审核。\n\n' +
      '| 虚构病例 | 文书 | 状态 |\n| --- | --- | --- |\n' + rows + '\n', {mode: 0o600});
    console.log('验收文件：' + out);
  } finally {
    keys.forEach((key, i) => prior[i] === undefined ? delete process.env[key] : process.env[key] = prior[i]);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch(error => { console.error(error.message); process.exitCode = 1; });
}
