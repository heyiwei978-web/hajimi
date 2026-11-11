import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {PUBLIC_FILES} from '../scripts/public-assets.mjs';
import {MODULES, NAV_SURFACES} from '../config/site-modules.mjs';
import {loadBuildSource} from '../scripts/clinical-compiler.mjs';
import {planClinicalPublication} from '../scripts/clinical-inventory.mjs';
import {compileCaseTemplates} from '../scripts/clinical-compiler.mjs';
import {collectSiteSearch, withChapterNames, SEARCH_SECTIONS, SITE_SEARCH_DATA} from '../scripts/site-search-build.mjs';

const read = file => fs.readFileSync(new URL('../' + file, import.meta.url), 'utf8');
const publication = planClinicalPublication(loadBuildSource(read('index.html')));
const manifest = withChapterNames({caseTemplates: compileCaseTemplates(publication.published)}, publication.published);
const index = collectSiteSearch(manifest);
const bySection = id => index.documents.filter(document => document.s === id);

function engine() {
  const context = {window: {}};
  vm.runInNewContext(read('ecg-search.js'), context);
  const api = context.window.HAJIMI_ECG_SEARCH;
  const search = api.create(index.documents.map(item =>
    ({type: item.s, title: item.t, aliases: item.a, body: [item.d, item.b].filter(Boolean).join(' '), item})));
  // Copy out of the vm realm so deepEqual compares plain arrays.
  return query => Array.from(search.search(query), hit => hit.doc.item);
}

test('site search covers every section with unique, well-formed links', () => {
  assert.deepEqual(index.sections.map(section => section.id), SEARCH_SECTIONS.map(section => section.id));
  for (const section of index.sections) {
    assert.equal(section.label, MODULES.find(module => module.id === section.id).label, 'labels come from the registry');
    assert.ok(bySection(section.id).length > 0, section.id + ' has entries');
  }
  const links = index.documents.map(document => document.u);
  assert.equal(new Set(links).size, links.length, 'one entry per link');
  const routes = JSON.parse(read('vercel.json')).rewrites.map(rule => rule.source);
  for (const document of index.documents) {
    assert.ok(document.t && typeof document.d === 'string' && Array.isArray(document.a), document.u);
    const pathname = decodeURIComponent(new URL(document.u, 'https://site.invalid').pathname);
    assert.ok(routes.some(source => source.endsWith(':path*') ? pathname.startsWith(source.slice(0, -6)) : source === pathname),
      document.u + ' is served by a vercel.json rewrite');
  }
});

test('site search follows each section\'s own data', () => {
  const labs = vm.runInNewContext(read('labs-data.js') + ';window.HAJIMI_LABS', {window: {}});
  const labItems = labs.categories.flatMap(category => category.items);
  assert.equal(bySection('labs').length, labItems.length + 1, 'every lab item plus the section page');
  for (const item of labItems) assert.ok(bySection('labs').some(document => document.u === '/labs#lab-' + item.id), item.id);

  const tools = [...read('tools.html').matchAll(/data-tool="([a-z0-9-]+)"/g)].map(match => match[1]);
  assert.equal(bySection('tools').length, tools.length + 1, 'every calculator card plus the section page');
  // Calculators are declared either in SRC (`id:[`) or in EXTRA (`id:{src:[`); both open from ?tool=id.
  for (const id of tools) assert.match(read('tools-page.js'), new RegExp('\\n' + id + ":(?:\\[|\\{src:\\[)"), 'tool ' + id + ' can be opened by link');

  const cases = manifest.caseTemplates.items;
  assert.equal(bySection('records').length, cases.length + 1, 'one entry per published case plus the section page');
  assert.equal(bySection('records').filter(document => document.u.includes('?case=')).length,
    cases.filter(item => item.caseType === 'special').length, 'special cases link to their own case');
});

test('site search never indexes record bodies, withdrawn cases or private material', () => {
  const serialized = JSON.stringify(index);
  for (const {record} of publication.published.filter(item => item.record.sourceBody).slice(0, 40)) {
    const sample = String(record.sourceBody).replace(/\s+/g, '').slice(40, 70);
    if (sample.length === 30) assert.ok(!serialized.replace(/\s+/g, '').includes(sample), 'body text of ' + record.name);
  }
  assert.doesNotMatch(serialized, /腰椎爆裂|胸腰椎/, 'withdrawn lumbar cases stay out');
  assert.ok(!index.documents.some(document => /^\/(?:api|admin)/.test(document.u)), 'no API or admin links');
  assert.ok(serialized.length < 200000, 'index stays small enough to load on a phone');
});

test('ranking puts exact names and abbreviations first', () => {
  const search = engine();
  assert.deepEqual(search('钾').slice(0, 1).map(item => [item.s, item.t]), [['labs', '钾']]);
  assert.equal(search('AF')[0].u, '/ecg/atlas/arrhythmias/atrial-fibrillation');
  assert.equal(search('TKA')[0].u, '/bl/guke/TKA');
  assert.ok(search('eGFR').some(item => item.u === '/tools?tool=egfr'));
  assert.ok(search('Garden').some(item => item.u === '/classification/guke/femoral-neck'));
  assert.ok(search('手术记录').every(item => item.s === 'records'));
  assert.deepEqual(search('不存在的词条xyz'), []);
});

test('search page is registered, published and free of inline script', () => {
  const module = MODULES.find(entry => entry.id === 'search');
  assert.equal(module.href, '/search');
  assert.equal(module.nav, false, 'search is not a tenth main navigation entry');
  assert.ok(NAV_SURFACES.some(surface => surface.file === 'search.html' && surface.active === null));
  const vercel = JSON.parse(read('vercel.json'));
  for (const source of ['/search', '/search/']) assert.ok(vercel.rewrites.some(rule => rule.source === source && rule.destination === '/search.html'));
  for (const file of ['search.html', 'site-search.css', 'site-search.js', 'ecg-search.js']) assert.ok(PUBLIC_FILES.includes(file), file);
  assert.ok(!PUBLIC_FILES.includes(SITE_SEARCH_DATA), 'the index is generated into dist, not kept in the repository');
  const html = read('search.html');
  assert.doesNotMatch(html, /<script>(?!<\/script>)|\son[a-z]+=/i);
  assert.match(html, /<script defer src="\/site-search-data\.js\?v=[^"]+"><\/script>/);
  assert.doesNotMatch(read('site-search.js'), /insertAdjacentHTML|eval\(|new Function|localStorage|sessionStorage/);
  assert.equal(read('site-search.js').match(/innerHTML/g).length, 1, 'only the escaped highlight helper writes HTML');
  assert.match(read('index.html'), /<form class="home-search" action="\/search" method="get" role="search">/);
});
