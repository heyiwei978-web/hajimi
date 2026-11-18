// 代码规范检查（2026-11-18）。不依赖第三方包：规则见 docs/code-style.md。
// 供 test/code-style.test.js 在 CI 中强制执行；本地运行 `npm run lint` 查看全部问题。
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
// 医学源资料，内容不改（见 AGENTS.md）；生成文件由构建负责。
const EXEMPT = new Set(['record-quality-v2.js', 'home.html']);

export function trackedFiles() {
  return execFileSync('git', ['ls-files'], {cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024})
    .split('\n').filter(Boolean).filter(file => fs.existsSync(path.join(ROOT, file)) && !EXEMPT.has(file));
}
const TEXT = /\.(?:js|mjs|cjs|css|html|json|jsonl|md|yml|yaml|svg|txt)$/;
const CODE = /\.(?:js|mjs|cjs)$/;
// 浏览器直接加载的经典脚本（非 ES 模块）：页面脚本和根目录的 app.js 等。
const isBrowserScript = file => /\.js$/.test(file) && (file.startsWith('js/') || !file.includes('/'));
// 内容数据（病历源数据、身份账本）只检查编码和换行，不检查行尾空格。
const isContent = file => file.startsWith('content/');

// ---------- 一、文本格式 ----------
export function textProblems(files = trackedFiles()) {
  const out = [];
  for (const file of files.filter(f => TEXT.test(f))) {
    const buffer = fs.readFileSync(path.join(ROOT, file));
    if (!buffer.length) continue;
    const text = buffer.toString('utf8');
    if (buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) out.push(`${file}：文件开头有 BOM，请存为无 BOM 的 UTF-8`);
    if (text.includes(String.fromCharCode(0xfffd))) out.push(`${file}：不是有效的 UTF-8`);
    if (text.includes('\r')) out.push(`${file}：使用了 Windows 换行（CRLF），请改为 LF`);
    if (!text.endsWith('\n')) out.push(`${file}：文件末尾缺少换行`);
    if (!file.endsWith('.md') && /^\t/m.test(text)) out.push(`${file}：用 Tab 缩进，请改为空格`);
    if (!file.endsWith('.md') && !isContent(file)) {
      const line = text.split('\n').findIndex(l => /[ \t]+$/.test(l));
      if (line >= 0) out.push(`${file}:${line + 1}：行尾有多余空格`);
    }
    if (/\.json$/.test(file)) { try { JSON.parse(text); } catch (e) { out.push(`${file}：JSON 格式错误（${e.message}）`); } }
  }
  return out;
}

// ---------- 二、语法 ----------
export function syntaxProblems(files = trackedFiles()) {
  const out = [];
  for (const file of files.filter(f => CODE.test(f))) {
    if (isBrowserScript(file)) {
      try { new vm.Script(read(file), {filename: file}); } catch (e) { out.push(`${file}：语法错误（${e.message}）`); }
    } else {
      try { execFileSync(process.execPath, ['--check', path.join(ROOT, file)], {stdio: 'pipe'}); }
      catch (e) { out.push(`${file}：语法错误（${String(e.stderr || e.message).split('\n').find(l => /Error/.test(l)) || '无法解析'}）`); }
    }
  }
  return out;
}

// ---------- 三、禁止的写法 ----------
const strip = source => source.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:\\])\/\/.*$/gm, '$1');
const FORBIDDEN = [
  [/\beval\s*\(/, '不要用 eval（站点 CSP 也会拦截）'],
  [/\bnew\s+Function\s*\(/, '不要用 new Function（站点 CSP 也会拦截）'],
  [/\bdocument\.write(?:ln)?\s*\(/, '不要用 document.write'],
  [new RegExp('\\bdebug' + 'ger\\b'), '提交前删除 debug' + 'ger 语句'],  // 拆开写，避免本文件匹配到自己
  [/\bset(?:Timeout|Interval)\s*\(\s*['"`]/, 'setTimeout/setInterval 不要传字符串'],
];
export function forbiddenProblems(files = trackedFiles()) {
  const out = [];
  for (const file of files.filter(f => CODE.test(f) && !f.startsWith('test/') && !f.startsWith('e2e/'))) {
    const source = strip(read(file));
    for (const [pattern, message] of FORBIDDEN) if (pattern.test(source)) out.push(`${file}：${message}`);
    // 页面脚本和接口里不留调试输出；构建、审核脚本是命令行工具，可以打印。
    if ((file.startsWith('js/') || file.startsWith('api/') || !file.includes('/')) && /\bconsole\.log\s*\(/.test(source)) {
      out.push(`${file}：删除 console.log（需要记录问题时用 console.error / console.warn）`);
    }
  }
  for (const file of files.filter(f => f.endsWith('.html'))) {
    const html = read(file);
    if (/<script\b(?![^>]*\bsrc=)[^>]*>/i.test(html)) out.push(`${file}：不要写内联 <script>（CSP 只允许本站脚本文件）`);
    if (/<[a-z][^>]*\son[a-z]+\s*=/i.test(html)) out.push(`${file}：不要在 HTML 属性里写 onclick= 等内联事件`);
    if (/user-scalable\s*=\s*no|maximum-scale\s*=\s*1(?![.\d])/i.test(html)) out.push(`${file}：不要禁止页面缩放`);
  }
  for (const file of files.filter(f => f.endsWith('.css'))) {
    if (/transition\s*:\s*all\b/i.test(read(file))) out.push(`${file}：不要用 transition: all，请写明过渡的属性`);
  }
  return out;
}

// ---------- 四、只减不增：直接拼接 HTML ----------
// innerHTML / outerHTML 赋值和 insertAdjacentHTML 容易引入 XSS，新代码请用 textContent 和 DOM 方法。
export function countHtmlSinks(source) {
  return (strip(source).match(/\.(?:inner|outer)HTML\s*\+?=(?!=)|\binsertAdjacentHTML\s*\(/g) || []).length;
}
export function htmlSinkCounts(files = trackedFiles()) {
  const counts = {};
  for (const file of files.filter(f => CODE.test(f) && !f.startsWith('test/') && !f.startsWith('e2e/'))) {
    const n = countHtmlSinks(read(file));
    if (n) counts[file] = n;
  }
  return counts;
}

export function allProblems() {
  return [...textProblems(), ...syntaxProblems(), ...forbiddenProblems()];
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const problems = allProblems();
  if (process.argv.includes('--budget')) console.log(JSON.stringify(htmlSinkCounts(), null, 2));
  console.log(problems.length ? problems.join('\n') : '代码规范检查通过');
  process.exitCode = problems.length ? 1 : 0;
}
