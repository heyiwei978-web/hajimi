// 样式防叠加检查（2026-11-18）。规则说明见 docs/interface-design.md「样式防叠加规则」。
// 供 test/css-layering.test.js 使用；也可直接运行 `node scripts/css-guard.mjs` 查看报告。
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');

// ---------- 极简 CSS 解析：规则、声明、所在的 @media/@supports 条件 ----------
const norm = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').trim();

function skipString(t, i) {
  const q = t[i]; i++;
  while (i < t.length && t[i] !== q) i += t[i] === '\\' ? 2 : 1;
  return i + 1;
}
function skipComment(t, i) {
  const j = t.indexOf('*/', i + 2);
  return j < 0 ? t.length : j + 2;
}
function findClose(t, i) {
  let depth = 1;
  while (i < t.length) {
    if (t.startsWith('/*', i)) { i = skipComment(t, i); continue; }
    const c = t[i];
    if (c === '"' || c === "'") { i = skipString(t, i); continue; }
    if (c === '{') depth++;
    else if (c === '}' && --depth === 0) return i;
    i++;
  }
  return i;
}
function scanUntil(t, i, stops) {
  let depth = 0;
  while (i < t.length) {
    if (t.startsWith('/*', i)) { i = skipComment(t, i); continue; }
    const c = t[i];
    if (c === '"' || c === "'") { i = skipString(t, i); continue; }
    if (c === '(' || c === '[') depth++;
    else if (c === ')' || c === ']') depth--;
    else if (depth === 0 && stops.includes(c)) return i;
    i++;
  }
  return i;
}
function splitSelectors(p) {
  const out = []; let depth = 0, cur = '';
  for (const c of p) {
    if (c === '(' || c === '[') depth++;
    else if (c === ')' || c === ']') depth--;
    if (c === ',' && depth === 0) { out.push(cur); cur = ''; } else cur += c;
  }
  out.push(cur);
  return out.map(s => s.replace(/\s*([>+~])\s*/g, ' $1 ').replace(/\s+/g, ' ').trim());
}
function parseDecls(body) {
  const decls = [];
  for (let i = 0; i < body.length;) {
    const j = scanUntil(body, i, ';');
    const raw = body.slice(i, j); i = j + 1;
    const k = raw.indexOf(':');
    if (k <= 0) continue;
    const prop = norm(raw.slice(0, k)).toLowerCase();
    const value = norm(raw.slice(k + 1));
    if (!prop || /[{}]/.test(prop)) continue;
    decls.push({prop, value: value.replace(/\s*!\s*important\s*$/i, ''), important: /!\s*important\s*$/i.test(value)});
  }
  return decls;
}
export function parseCss(text, file) {
  const rules = [];
  (function block(i, end, conds) {
    while (i < end) {
      while (i < end && (/\s/.test(text[i]) || text.startsWith('/*', i))) i = text.startsWith('/*', i) ? skipComment(text, i) : i + 1;
      if (i >= end || text[i] === '}') return;
      const j = scanUntil(text, i, '{;}');
      if (j >= end || text[j] !== '{') { i = j + 1; continue; }
      const prelude = norm(text.slice(i, j)), close = findClose(text, j + 1);
      if (prelude.startsWith('@')) {
        if (/^@(media|supports|container|layer)\b/i.test(prelude)) block(j + 1, close, [...conds, prelude]);
      } else {
        rules.push({file, order: rules.length, selector: prelude, selectors: splitSelectors(prelude), conds, decls: parseDecls(text.slice(j + 1, close))});
      }
      i = close + 1;
    }
  })(0, text.length, []);
  return rules;
}

// ---------- 页面加载顺序 ----------
export function stylesheetFiles() {
  return fs.readdirSync(ROOT).filter(f => f.endsWith('.css')).sort();
}
export function pageOrders() {
  const pages = {};
  for (const f of fs.readdirSync(ROOT).filter(f => f.endsWith('.html'))) {
    const order = [...read(f).matchAll(/<link rel="stylesheet" href="\/([A-Za-z0-9_-]+\.css)/g)].map(m => m[1]);
    if (order.length) pages[f] = order;
  }
  return pages;
}

// ---------- 检查一：写了也不生效的声明 ----------
// 同一选择器、同一属性，后面又写了一次（条件相同或更宽、!important 不弱于前者），
// 且在所有加载前者的页面里都排在它之后，前一条永远不会生效。
// 后一条用了可能不被支持的写法时，前一条算兜底，不报。
const RISKY_VALUE = /dvh|svh|lvh|dvw|svw|lvw|env\(|clamp\(|\bmin\(|\bmax\(|color-mix|oklch|oklab|\blab\(|\blch\(|light-dark|-webkit-|-moz-|-ms-|fit-content|stretch|subgrid|text-wrap|balance|pretty/i;
const RISKY_SELECTOR = /::?-(moz|webkit|ms|o)-|:has\(|:user-|:popover|::backdrop|:modal|::file-selector|:focus-visible|:is\(|:where\(/i;

export function findOverriddenDeclarations() {
  const pages = pageOrders();
  const isAfter = (a, b) => {   // b 在所有加载 a 的页面里都在 a 之后
    let seen = false;
    for (const order of Object.values(pages)) {
      if (!order.includes(a)) continue;
      if (!order.includes(b) || order.indexOf(b) < order.indexOf(a)) return false;
      seen = true;
    }
    return seen;
  };
  const rules = stylesheetFiles().flatMap(f => parseCss(read(f), f));
  const index = new Map();
  for (const r of rules) {
    const risky = r.selectors.some(s => RISKY_SELECTOR.test(s));
    r.decls.forEach((d, n) => {
      for (const s of r.selectors) {
        const key = s + '\u0000' + d.prop;
        if (!index.has(key)) index.set(key, []);
        index.get(key).push({r, d, n, risky});
      }
    });
  }
  const later = (a, n, b, m) => a.file === b.file ? (b.order > a.order || (b.order === a.order && m > n)) : isAfter(a.file, b.file);
  const found = [];
  for (const r of rules) {
    r.decls.forEach((d, n) => {
      let killer = null;
      for (const s of r.selectors) {
        killer = (index.get(s + '\u0000' + d.prop) || []).find(x => x.d !== d && !x.risky
          && !(d.important && !x.d.important) && !RISKY_VALUE.test(x.d.value)
          && x.r.conds.every(c => r.conds.includes(c)) && later(r, n, x.r, x.n));
        if (!killer) return;
      }
      found.push(`${r.file} 「${r.selector}」的 ${d.prop} 被 ${killer.r.file} 「${killer.r.selector}」覆盖，永远不生效`);
    });
  }
  return found;
}

// ---------- 检查二、三、四：文件数量、!important、写死的颜色 ----------
export function countImportant(text) {
  return parseCss(text, '').reduce((n, r) => n + r.decls.filter(d => d.important).length, 0);
}
export function countColorLiterals(text) {
  // 定义变量（--xxx:）可以写颜色值；其他声明应引用变量。
  const COLOR = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/g;
  return parseCss(text, '').reduce((n, r) => n + r.decls.filter(d => !d.prop.startsWith('--'))
    .reduce((m, d) => m + (d.value.match(COLOR) || []).length, 0), 0);
}
export function currentBudget() {
  const files = {};
  for (const f of stylesheetFiles()) {
    const t = read(f);
    files[f] = {important: countImportant(t), colorLiterals: countColorLiterals(t)};
  }
  return files;
}


// ---------- 检查五：没有元素会用到的规则 ----------
// 选择器里的类名或 id 在全部 HTML、JS、脚本和内容数据里都找不到（连 'prefix-'+x 这类拼接前缀也找不到），
// 这条规则不可能生效，应删除而不是留着。
function sourceCorpus() {
  const parts = [];
  const walk = dir => {
    for (const e of fs.readdirSync(path.join(ROOT, dir), {withFileTypes: true})) {
      const rel = dir ? dir + '/' + e.name : e.name;
      if (e.isDirectory()) {
        if (!['node_modules', '.git', 'dist', 'docs', 'test', 'e2e'].includes(e.name)) walk(rel);
      } else if (/\.(html|js|mjs|cjs|json)$/.test(e.name) && !/^package(-lock)?\.json$/.test(e.name)) {
        parts.push(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
      }
    }
  };
  walk('');
  return parts.join('\n');
}
export function findUnusedRules() {
  const corpus = sourceCorpus();
  const cache = new Map();
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const used = token => {
    if (cache.has(token)) return cache.get(token);
    let ok = new RegExp('(?<![\\w-])' + esc(token) + '(?![\\w-])').test(corpus);
    const parts = token.split('-');
    for (let i = 1; !ok && i < parts.length; i++) {
      ok = new RegExp('(?<![\\w-])' + esc(parts.slice(0, i).join('-') + '-') + '(?:[\'"`]|\\$\\{)').test(corpus);
    }
    cache.set(token, ok);
    return ok;
  };
  const dead = sel => [...sel.replace(/:not\([^)]*\)/g, '').replace(/\[[^\]]*\]/g, '').matchAll(/[.#]([A-Za-z_][\w-]*)/g)]
    .some(m => !used(m[1]));
  const found = [];
  for (const f of stylesheetFiles()) {
    for (const r of parseCss(read(f), f)) {
      if (r.selectors.every(dead)) found.push(`${f} 「${r.selector}」没有任何元素会用到`);
    }
  }
  return found;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dead = findOverriddenDeclarations();
  console.log(dead.length ? dead.join('\n') : '没有被覆盖的声明');
  const unused = findUnusedRules();
  console.log(unused.length ? unused.join('\n') : '没有无人使用的规则');
  if (process.argv.includes('--budget')) console.log(JSON.stringify(currentBudget(), null, 2));
}
