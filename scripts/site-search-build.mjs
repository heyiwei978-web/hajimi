import fs from 'node:fs';
import vm from 'node:vm';
import {MODULES, DEPARTMENTS} from '../config/site-modules.mjs';
import {loadEcg} from './ecg-compiler.mjs';

// Site-wide search index (/search).
//
// Built from the same sources each section already publishes: titles, aliases
// and short labels only. No clinical record bodies, no login-only material and
// no patient data are indexed, and nothing here rewrites medical text — the
// index only points at existing pages.
//
// Each document: {s: section id, t: title, d: one-line context, u: link,
// a: aliases, b: extra searchable words}.

const root = new URL('../', import.meta.url);
const readSource = file => fs.readFileSync(new URL(file, root), 'utf8');

function runScripts(files, read) {
  const context = {window: {}};
  vm.createContext(context);
  for (const file of files) vm.runInContext(read(file), context, {filename: file, timeout: 10000});
  return context.window;
}

const text = value => String(value ?? '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim();
const caseLabel = group => group === 'TKA' ? '全膝关节置换' : group === 'THA' ? '全髋关节置换' : group;

function recordDocuments(manifest) {
  const slugs = new Map(DEPARTMENTS.map(department => [department.name, department.slug]));
  // Chapter names come from the published catalog rows; bodies are never read.
  return manifest.caseTemplates.items.map(item => {
    const slug = slugs.get(item.department);
    if (!slug) throw new Error('Site search: unmapped department ' + item.department);
    const special = item.caseType === 'special';
    return {
      s: 'records',
      t: special ? item.title : caseLabel(item.group),
      d: item.department + ' · ' + (item.caseType === 'utility' ? '通用文书' : special ? '特殊病例' : '完整病历')
        + ' · ' + item.chapterCount + ' 份文书',
      u: '/bl/' + slug + '/' + encodeURIComponent(item.group) + (special ? '?case=' + encodeURIComponent(item.caseId) : ''),
      // The standard case owns the group abbreviation (TKA); special cases are found by their own titles.
      a: special ? [] : [item.group],
      b: [item.department, ...(item.chapters || [])].join(' ')
    };
  });
}

function classificationDocuments(read) {
  const window = runScripts(['classification-data.js', 'classification-detail-v2-upper.js',
    'classification-detail-v2-lower.js', 'classification-detail-v2-pelvis-foot.js'], read);
  const data = window.HAJIMI_CLASSIFICATION_DATA, details = window.HAJIMI_CLASSIFICATION_DETAILS || {};
  const department = data.departments.find(item => item.ready);
  return data.entries.map(entry => ({
    s: 'classification',
    t: entry.name,
    d: entry.area + ' · ' + entry.system,
    u: '/classification/' + department.id + '/' + entry.id,
    a: [],
    b: [entry.system, entry.area, ...(details[entry.id]?.types || entry.types.map(type => [type.code])).map(type => type[0])].join(' ')
  }));
}

const ECG_PAGES = [
  ['基础学习', '/ecg/basics', '正常值、判读步骤、电轴、间期与伪差'],
  ['围手术期专区', '/ecg/periop', '术前异常心电图、麻醉相关风险、术后胸闷'],
  ['心电图工具', '/ecg/tools', 'QTc、电轴、格数换算与心率估算'],
  ['病例练习', '/ecg/quiz', '骨科围手术期场景判读练习'],
  ['报告范例', '/ecg/report', '心电图报告结构与报告生成器'],
  ['经典心电图', '/ecg/classic', '完整 12 导联示意图'],
  ['12 导联读图练习', '/ecg/classic/practice', '看图选择最可能的诊断'],
  ['常见心电现象', '/ecg/phenomena', '超常传导、隐匿性传导、蝉联等']
];

function ecgDocuments(read) {
  const window = loadEcg(read), data = window.HAJIMI_ECG_DATA;
  const categories = new Map(data.categories.map(category => [category.id, category.title]));
  return [
    ...data.entries.map(entry => ({
      s: 'ecg', t: entry.title, d: '图谱 · ' + categories.get(entry.category),
      u: '/ecg/atlas/' + entry.category + '/' + entry.id, a: entry.aliases || [], b: ''
    })),
    ...window.HAJIMI_ECG_CLASSIC.items.map(item => ({
      s: 'ecg', t: item.title, d: '经典心电图 · 12 导联示意', u: '/ecg/classic/' + item.id, a: [], b: ''
    })),
    ...ECG_PAGES.map(([title, url, description]) => ({s: 'ecg', t: title, d: description, u: url, a: [], b: ''}))
  ];
}

function labDocuments(read) {
  const data = runScripts(['labs-data.js'], read).HAJIMI_LABS;
  return data.categories.flatMap(category => category.items.map(item => ({
    s: 'labs', t: item.name, d: category.title + (item.abbr ? ' · ' + item.abbr : ''),
    u: '/labs#lab-' + item.id, a: [item.abbr, ...(item.aliases || [])].filter(Boolean), b: category.title
  })));
}

function toolDocuments(read) {
  const html = read('tools.html'), documents = [];
  for (const section of html.split('<section class="section">').slice(1)) {
    const heading = text(/<h2>([\s\S]*?)<\/h2>/.exec(section)?.[1]);
    for (const card of section.matchAll(/<article class="card" data-tool="([a-z0-9-]+)">[\s\S]*?<span class="icon">([\s\S]*?)<\/span>[\s\S]*?<h3>([\s\S]*?)<\/h3><p>([\s\S]*?)<\/p>/g)) {
      documents.push({s: 'tools', t: text(card[3]), d: heading + ' · ' + text(card[4]),
        u: '/tools?tool=' + card[1], a: [text(card[2])], b: heading});
    }
  }
  return documents;
}

function pathwayDocuments(read) {
  const library = runScripts(['pathway-official.js'], read).HAJIMI_OFFICIAL_PATHWAYS.pathways;
  const documents = [];
  for (const item of read('pathway.js').matchAll(/\{name:'([^']+)',status:'ready',key:'([A-Za-z0-9]+)',tag:'([^']+)'\}/g)) {
    const [, name, key, tag] = item;
    if (key !== 'tka' && !Object.hasOwn(library, key)) throw new Error('Site search: pathway ' + key + ' has no data');
    documents.push({s: 'pathway', t: name, d: '骨科临床路径 · ' + tag,
      u: key === 'tka' ? '/pathway#tkaPathway' : '/pathway?p=' + encodeURIComponent(key), a: [key.toUpperCase()], b: ''});
  }
  return documents;
}

const PAGE_NOTES = {
  records: '各科室病历模板库', classification: '骨折及关节损伤分型与手术指征',
  ecg: '图谱、基础学习、围手术期与练习', labs: '常见化验的参考范围与结果分析', pathway: '骨科临床路径中心',
  duty: '交班核对、待办与交班摘要', tools: '床旁计算与风险评分'
};

function pageDocuments() {
  return [
    ...MODULES.filter(module => Object.hasOwn(PAGE_NOTES, module.id)).map(module => ({
      s: module.id, t: module.label, d: '栏目 · ' + PAGE_NOTES[module.id],
      u: module.href, a: [], b: ''
    })),
    {s: 'duty', t: '内科医嘱参考', d: '值班资料 · 登录后可见', u: '/duty/orders', a: ['医嘱'], b: ''}
  ];
}

// Sections shown as result groups and filters, in navigation order.
export const SEARCH_SECTIONS = ['records', 'classification', 'ecg', 'labs', 'pathway', 'tools', 'duty']
  .map(id => ({id, label: MODULES.find(module => module.id === id).label}));

export function collectSiteSearch(manifest, read = readSource) {
  const documents = [
    ...recordDocuments(manifest), ...classificationDocuments(read), ...ecgDocuments(read),
    ...labDocuments(read), ...pathwayDocuments(read), ...toolDocuments(read), ...pageDocuments()
  ];
  const sections = new Set(SEARCH_SECTIONS.map(section => section.id)), seen = new Set(), errors = [];
  for (const document of documents) {
    if (!sections.has(document.s)) errors.push('unknown section ' + document.s);
    if (!document.t) errors.push('missing title for ' + document.u);
    if (!/^\/[^/]/.test(document.u) || document.u.startsWith('/api/')) errors.push('link must be a site page: ' + document.u);
    if (seen.has(document.u)) errors.push('duplicate link ' + document.u);
    seen.add(document.u);
  }
  for (const section of SEARCH_SECTIONS) {
    if (!documents.some(document => document.s === section.id)) errors.push('section ' + section.id + ' has no documents');
  }
  if (errors.length) throw new Error('Site search build failed:\n' + [...new Set(errors)].join('\n'));
  return {sections: SEARCH_SECTIONS, documents};
}

// Chapter names per case, taken from the compiled publication (metadata only).
export function withChapterNames(manifest, published) {
  const names = new Map(published.map(({record, identity}) => [identity.legacyId, record.short || record.name]));
  return {...manifest, caseTemplates: {...manifest.caseTemplates, items: manifest.caseTemplates.items.map(item =>
    ({...item, chapters: [...new Set(item.chapterIds.map(id => names.get(id)).filter(Boolean))]}))}};
}

export const SITE_SEARCH_DATA = 'site-search-data.js';

export function writeSiteSearch(directory, manifest, published) {
  const index = collectSiteSearch(withChapterNames(manifest, published));
  // JSON.parse of a string literal is parsed faster than an object literal.
  fs.writeFileSync(new URL(SITE_SEARCH_DATA, directory),
    '/* Generated by scripts/site-search-build.mjs. Do not edit. */\n'
    + 'window.HAJIMI_SITE_SEARCH=JSON.parse(' + JSON.stringify(JSON.stringify(index)) + ');\n');
  return index;
}
