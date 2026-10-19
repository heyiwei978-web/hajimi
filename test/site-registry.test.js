import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {MODULES, DEPARTMENTS, NAV_SURFACES, SITE_BRAND, navModules} from '../config/site-modules.mjs';
import {renderPageNavigation} from '../scripts/navigation-build.mjs';
import {clinicalDepartmentSlugs} from '../scripts/clinical-compiler.mjs';
import {renderHomeDepartments,renderRouterDepartments,renderClassificationDepartments} from '../scripts/department-build.mjs';

// These guards also run before a build in CI. Check rendered source pages;
// navigation-build.test.js separately exercises the actual build in isolation.

const root = new URL('../', import.meta.url);
const read = file => fs.readFileSync(new URL(file, root), 'utf8');
const readPage = file => renderPageNavigation(['index.html','home.html'].includes(file) ? renderHomeDepartments(read(file)) : read(file), file);
const REGIONS = ['portalHome', 'dutyPage', 'libraryShell'];

function regionSource(file, region) {
  const source = readPage(file);
  if (!region) return source;
  const start = source.indexOf(`<div id="${region}"`);
  assert.ok(start >= 0, `${file} has #${region}`);
  const ends = REGIONS.map(id => source.indexOf(`<div id="${id}"`, start + 1)).filter(index => index > start);
  return source.slice(start, ends.length ? Math.min(...ends) : source.length);
}

const NAV_PATTERNS = {
  official: /<nav\b[^>]*aria-label="主导航"[^>]*>([\s\S]*?)<\/nav>/g,
  tools: /<nav\b[^>]*aria-label="主导航"[^>]*>([\s\S]*?)<\/nav>/g,
  library: /<div class="top-actions library-top-actions">([\s\S]*?)<\/div>/g,
  legacy: /<nav class="global-links">([\s\S]*?)<\/nav>/g
};
const ACTIVE_CLASS = {official: 'active', tools: 'active', library: 'library-active-link', legacy: 'active'};

function navLinks(surface) {
  const source = regionSource(surface.file, surface.region);
  const blocks = [...source.matchAll(NAV_PATTERNS[surface.variant])];
  assert.equal(blocks.length, 1, `${describe(surface)} has exactly one ${surface.variant} navigation`);
  return [...blocks[0][1].matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].map(([, attributes, inner]) => ({
    href: /\bhref="([^"]*)"/.exec(attributes)?.[1],
    label: inner.replace(/<[^>]+>/g, '').trim(),
    classes: (/\bclass="([^"]*)"/.exec(attributes)?.[1] || '').split(/\s+/).filter(Boolean)
  }));
}

const describe = surface => surface.file + (surface.region ? '#' + surface.region : '');

test('registry entries are unique and internally consistent', () => {
  const ids = MODULES.map(module => module.id);
  assert.equal(new Set(ids).size, ids.length, 'module ids are unique');
  assert.equal(new Set(MODULES.map(module => module.href)).size, MODULES.length, 'module hrefs are unique');
  assert.equal(new Set(MODULES.map(module => module.label)).size, MODULES.length, 'module labels are unique');
  for (const module of MODULES) {
    assert.match(module.id, /^[a-z][a-z0-9-]*$/);
    assert.match(module.href, /^\/[a-z0-9/-]*$/);
    assert.ok(module.routes.includes(module.href), `${module.id} routes include its href`);
  }
  const slugs = DEPARTMENTS.map(department => department.slug);
  assert.equal(new Set(slugs).size, slugs.length, 'department slugs are unique');
  assert.equal(new Set(DEPARTMENTS.map(department => department.name)).size, DEPARTMENTS.length);
  for (const department of DEPARTMENTS) assert.match(department.slug, /^[a-z]+$/);
  for (const surface of NAV_SURFACES) {
    assert.ok(surface.active === null || ids.includes(surface.active), `${describe(surface)} active module exists`);
    for (const id of surface.exclude || []) assert.ok(ids.includes(id), `${describe(surface)} excludes a known module`);
    if (surface.active) assert.ok(!(surface.exclude || []).includes(surface.active), `${describe(surface)} does not hide its own entry`);
  }
});

test('every page with a main navigation is described by the registry', () => {
  const pages = fs.readdirSync(root).filter(file => file.endsWith('.html') && read(file).includes('aria-label="主导航"'));
  const described = new Set(NAV_SURFACES.map(surface => surface.file));
  for (const page of pages) assert.ok(described.has(page), `${page} is listed in NAV_SURFACES`);
});

for (const surface of NAV_SURFACES) {
  test(`navigation in ${describe(surface)} matches the registry`, () => {
    const links = navLinks(surface);
    const expected = navModules(surface);
    assert.deepEqual(links.map(({href, label}) => ({href, label})),
      expected.map(({href, label}) => ({href, label})), 'links, labels and order');
    const active = links.filter(link => link.classes.includes(ACTIVE_CLASS[surface.variant]));
    if (surface.active === null) assert.equal(active.length, 0, 'no active entry');
    else assert.deepEqual(active.map(link => link.href), [MODULES.find(module => module.id === surface.active).href], 'one active entry');
    const current = [...regionSource(surface.file, surface.region).matchAll(/<a\b[^>]*aria-current="page"[^>]*href="([^"]*)"|<a\b[^>]*href="([^"]*)"[^>]*aria-current="page"/g)]
      .map(match => match[1] || match[2]);
    assert.deepEqual(current, surface.ariaCurrent ? [MODULES.find(module => module.id === surface.active).href] : [], 'existing aria-current behavior');
    if (surface.variant === 'official' || surface.variant === 'tools') {
      const tagline = surface.tagline || SITE_BRAND.tagline;
      const brand = `<strong>${SITE_BRAND.name}</strong><small>${tagline}</small>`;
      assert.ok(regionSource(surface.file, surface.region).includes(brand), `brand reads ${SITE_BRAND.name} / ${tagline}`);
    }
  });
}

test('registry routes and vercel.json rewrites cover each other', () => {
  const {rewrites} = JSON.parse(read('vercel.json'));
  const sources = new Set(rewrites.map(rule => rule.source));
  const claimed = new Set(MODULES.flatMap(module => module.routes));
  for (const route of claimed) assert.ok(sources.has(route), `vercel.json rewrites ${route}`);
  for (const source of sources) assert.ok(claimed.has(source), `rewrite ${source} belongs to a registry module`);
});

test('department lists elsewhere in the site agree with the registry', () => {
  const byName = Object.fromEntries(DEPARTMENTS.map(department => [department.name, department.slug]));

  assert.deepEqual(clinicalDepartmentSlugs(), byName, 'clinical compiler uses the department registry');

  const router = renderRouterDepartments(read('departments.js'));
  const routerList = /const departments=\[([\s\S]*?)\];/.exec(router)?.[1];
  assert.ok(routerList, 'department router declares its departments');
  assert.deepEqual([...routerList.matchAll(/name:'([^']+)',slug:'([^']+)'/g)].map(([, name, slug]) => ({name, slug})),
    DEPARTMENTS.map(({name, slug}) => ({name, slug})), 'department router list');

  const context = {window: {}};
  vm.runInNewContext(renderClassificationDepartments(read('classification-data.js')), context, {filename: 'classification-data.js'});
  // JSON round trip: objects created inside the vm belong to another realm.
  const classification = JSON.parse(JSON.stringify(context.window.HAJIMI_CLASSIFICATION_DATA.departments));
  assert.deepEqual(classification.map(({id, name, ready}) => ({id, name, ready})),
    DEPARTMENTS.map(({slug, name, classification}) => ({id: slug, name, ready: classification})), 'classification departments');

  const home = regionSource('index.html', 'portalHome');
  assert.deepEqual([...home.matchAll(/<a href="\/bl\/([a-z]+)"><span class="home-department-icon"/g)].map(match => match[1]),
    DEPARTMENTS.filter(department => department.records).map(department => department.slug), 'homepage department shortcuts');
});

test('registry stays build-only and outside the clinical script chain', () => {
  const pages = fs.readdirSync(root).filter(file => file.endsWith('.html'));
  for (const page of pages) {
    assert.doesNotMatch(read(page), /site-modules|\/config\//, `${page} does not load the registry`);
  }
  const scripts = [...read('index.html').matchAll(/<script\s+[^>]*?src="\/([^?"]+)/g)].map(match => match[1]);
  for (const script of scripts) assert.ok(!script.includes('/'), `index.html script ${script} is a root file, not config`);
  assert.ok(!fs.existsSync(new URL('site-modules.mjs', root)), 'registry is not in the published root directory');
});

test('mobile navigation order guard still holds', () => {
  // The 4th official navigation entry is hidden by a generic rule and restored
  // by an equal-specificity override. Removing the override, or reordering the
  // registry, changes what phones see; this test makes that coupling explicit.
  const styles = read('styles.css'), polish = read('ui-polish.css');
  if (/\.global-links a:nth-child\(4\)\{display:none\}/.test(styles)) {
    assert.match(polish, /\.official-nav \.official-links a\{display:flex/, 'official navigation restores every entry');
  }
  const official = NAV_SURFACES.filter(surface => surface.variant === 'official');
  for (const surface of official) {
    for (const stylesheet of ['styles.css', 'ui-polish.css']) {
      assert.match(readPage(surface.file), new RegExp(`href="/${stylesheet}\\?`), `${surface.file} loads ${stylesheet}`);
    }
    const page = readPage(surface.file);
    assert.ok(page.indexOf('/styles.css?') < page.indexOf('/ui-polish.css?'), `${surface.file} loads ui-polish.css after styles.css`);
  }
});
