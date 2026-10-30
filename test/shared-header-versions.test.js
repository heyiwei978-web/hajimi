import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {NAV_SURFACES, SITE_BRAND} from '../config/site-modules.mjs';
import {renderHeader, renderPageNavigation} from '../scripts/navigation-build.mjs';
import {versionAssetReferences, writeAssetVersions} from '../scripts/asset-versions.mjs';

const root = new URL('../', import.meta.url);
const read = file => fs.readFileSync(new URL(file, root), 'utf8');
const brand = `<span class="official-brand-mark" aria-hidden="true">${SITE_BRAND.mark}</span>`
  + `<span class="official-brand-text"><strong>${SITE_BRAND.name}</strong><small>${SITE_BRAND.tagline}</small></span>`;

test('every official and tools header is rendered from the shared template', () => {
  const shells = new Set();
  for (const surface of NAV_SURFACES.filter(item => item.variant === 'official' || item.variant === 'tools')) {
    const html = renderPageNavigation(read(surface.file), surface.file);
    const header = html.match(/<header\b[^>]*>(?:(?!<\/header>)[\s\S])*aria-label="主导航"[\s\S]*?<\/header>/)[0];
    assert.ok(header.includes(brand), `${surface.file} brand comes from SITE_BRAND`);
    // Ignore the link list (active entry differs) and the page-specific right slot.
    shells.add(surface.variant + ':' + header
      .replace(/<nav\b[\s\S]*?<\/nav>/, '<nav/>')
      .replace(/\n\s*<div class="official-nav-right">[\s\S]*?<\/div>(?=\n)/, '')
      .replace(/^<header class="[^"]*">/, '<header>'));
  }
  assert.equal(shells.size, 2, 'one shell for official pages, one for the tools page');
});

test('page-specific header classes and right-hand slot content are kept', () => {
  const html = renderPageNavigation(read('classification.html'), 'classification.html');
  assert.match(html, /<header class="global-nav official-nav class-topnav">/);
  assert.match(html, /<div class="official-nav-right"><a class="official-search" href="\/bl" aria-label="打开病历模板">病历模板 ↗<\/a><\/div>/);
  const home = renderPageNavigation(read('home.html'), 'home.html');
  assert.match(home, /<div class="official-nav-right"><a class="official-search"[\s\S]*?<span class="official-auth" data-auth-slot><\/span><\/div>/);
});

test('unexpected content in a shared header stops the build', () => {
  const surface = NAV_SURFACES.find(item => item.file === 'admin.html');
  const header = read('admin.html').match(/<header\b[\s\S]*?<\/header>/)[0];
  assert.throws(() => renderHeader(header.replace('</nav>', '</nav><button>额外按钮</button>'), surface),
    /shared official structure/);
  assert.throws(() => renderHeader(header.replace('global-nav official-nav', 'global-nav'), surface),
    /global-nav official-nav/);
});

test('asset versions follow file contents and stay identical across pages', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hajimi-versions-'));
  try {
    const url = pathToFileURL(dir + path.sep);
    fs.writeFileSync(path.join(dir, 'site.css'), 'body{color:red}');
    fs.writeFileSync(path.join(dir, 'app.js'), 'console.log(1)');
    fs.writeFileSync(path.join(dir, 'a.html'), '<link href="/site.css?v=old-a"><script src="/app.js?v=1"></script><script src="/hashed-abc.js"></script>');
    fs.writeFileSync(path.join(dir, 'b.html'), "<link href='/site.css?v=20261027-cls1'>");
    writeAssetVersions(url);
    const a = fs.readFileSync(path.join(dir, 'a.html'), 'utf8');
    const b = fs.readFileSync(path.join(dir, 'b.html'), 'utf8');
    const version = a.match(/site\.css\?v=([0-9a-f]{12})"/)[1];
    assert.ok(b.includes(`/site.css?v=${version}'`), 'same file, same version on every page');
    assert.match(a, /\/app\.js\?v=[0-9a-f]{12}"/);
    assert.ok(a.includes('src="/hashed-abc.js"'), 'references without ?v are left alone');
    fs.writeFileSync(path.join(dir, 'site.css'), 'body{color:blue}');
    assert.notEqual(versionAssetReferences('<link href="/site.css?v=x">', url).match(/v=([0-9a-f]+)/)[1], version,
      'changing a file changes its version');
    assert.throws(() => versionAssetReferences('<script src="/missing.js?v=1"></script>', url), /missing from dist/);
  } finally {
    fs.rmSync(dir, {recursive: true, force: true});
  }
});
