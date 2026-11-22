import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {MODULES, NAV_SURFACES, SITE_BRAND, navModules, navActive} from '../config/site-modules.mjs';

// Every page shows the same five workspace destinations (config/site-modules.mjs).
// Workspace pages keep their own header and rail; library pages keep their own
// header (department branding, patient and sign-in controls) and only get the
// link list; every other page's whole header (brand, navigation and an optional
// right-hand slot) is re-rendered from one template, keeping only the page's
// extra header classes and its right-slot content.
const MAIN_NAV = /(<nav\b[^>]*aria-label="主导航"[^>]*>)([\s\S]*?)(<\/nav>)/g;
const SITE_NAV_OPEN = '<nav class="site-nav" aria-label="主导航">';
const workspaceMark = /(<span class="ws-brand-mark" aria-hidden="true">)[\s\S]*?(<\/span>)/;
const regions = [...new Set(NAV_SURFACES.map(surface => surface.region).filter(Boolean))];
const escape = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[character]);

// Tabler Icons (MIT). See THIRD_PARTY_NOTICES.md.
const workspacePaths = {
  home: '<path d="M5 12l-2 0l9 -9l9 9l-2 0M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1 -1v-7M9 20v-6h6v6"/>',
  clinical: '<path d="M6 4h-2v5a5 5 0 0 0 10 0V4h-2m-3 10v3a4 4 0 0 0 8 0v-2"/><circle cx="17" cy="12" r="3"/>',
  materials: '<path d="M12 7v14m-9 -3c3.3 -1.5 6.3 -1.5 9 0c2.7 -1.5 5.7 -1.5 9 0V5c-3.3 -1.5 -6.3 -1.5 -9 0c-2.7 -1.5 -5.7 -1.5 -9 0z"/>',
  study: '<path d="M22 9l-10 -5l-10 5l10 5l10 -5v6M6 11v6a6 3 0 0 0 12 0v-6"/>',
  personal: '<circle cx="12" cy="7" r="4"/><path d="M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2"/>'
};

// aria-current="page" on the destination's own page; "true" while one of its
// sections is open (the link is the current location, not the current page).
function workspaceLink(module, active) {
  const highlighted = module.id === navActive(active);
  const current = highlighted ? (module.id === active ? 'page' : 'true') : '';
  return `<a${highlighted ? ' class="active"' : ''} href="${escape(module.href)}"${current ? ` aria-current="${current}"` : ''}>`
    + `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${workspacePaths[module.id]}</svg>`
    + `<span>${escape(module.workspace)}</span></a>`;
}

function links(surface, inner) {
  const anchors = [...inner.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/g)];
  if (!anchors.length) throw new Error(`Navigation link list missing: ${surface.file}`);
  const prefix = inner.slice(0, anchors[0].index);
  if (prefix.trim()) throw new Error(`Unexpected content before navigation: ${surface.file}`);
  const gaps = anchors.slice(1).map((anchor, index) =>
    inner.slice(anchors[index].index + anchors[index][0].length, anchor.index));
  if (gaps.some(gap => gap.trim() || gap !== gaps[0])) {
    throw new Error(`Unexpected content between navigation links: ${surface.file}`);
  }
  const suffix = inner.slice(anchors.at(-1).index + anchors.at(-1)[0].length);
  if (surface.active && !MODULES.some(module => module.id === surface.active)) {
    throw new Error(`Active navigation entry missing: ${surface.file}`);
  }
  return prefix + navModules().map(module => workspaceLink(module, surface.active)).join(gaps[0] || '') + suffix;
}

export function renderWorkspaceNav(source, active) {
  const matches = [...source.matchAll(MAIN_NAV)];
  if (matches.length !== 1 || !MODULES.some(module => module.workspace && module.id === active)) {
    throw new Error(`Invalid workspace navigation: ${active}`);
  }
  return source.replace(MAIN_NAV, (_, open, inner, close) =>
    open + links({file: active, variant: 'workstation', active}, inner) + close)
    .replace(workspaceMark, (_, open, close) => open + SITE_BRAND.mark + close);
}

function brandInner() {
  return `<span class="site-brand-mark" aria-hidden="true">${SITE_BRAND.mark}</span>`
    + `<span class="site-brand-text"><strong>${escape(SITE_BRAND.name)}</strong><small>${escape(SITE_BRAND.tagline)}</small></span>`;
}

// The shared header: brand, main navigation and an optional right-hand slot.
const HEADER_SHAPE = /^<header class="([^"]*)">\s*<div class="site-header-inner">\s*<a class="site-brand" href="\/">[\s\S]*?<\/a>\s*(<nav\b[\s\S]*?<\/nav>)\s*(?:<div class="site-header-right">([\s\S]*?)<\/div>\s*)?<\/div>\s*<\/header>$/;

export function renderHeader(header, surface) {
  const match = header.match(HEADER_SHAPE);
  if (!match) {
    throw new Error(`Header does not follow the shared site header structure: ${surface.file}`
      + ' (brand link, main navigation and optional .site-header-right only)');
  }
  const [, classes, nav, right] = match;
  const classList = classes.split(/\s+/).filter(Boolean);
  if (classList[0] !== 'site-header') throw new Error(`Shared header must start with the site-header class: ${surface.file}`);
  const extra = classList.slice(1);
  return `<header class="${['site-header', ...extra].join(' ')}">\n  <div class="site-header-inner">\n`
    + `    <a class="site-brand" href="/">${brandInner()}</a>\n`
    + `    ${nav}\n`
    + (right && right.trim() ? `    <div class="site-header-right">${right.trim()}</div>\n` : '')
    + '  </div>\n</header>';
}

export function renderPageNavigation(source, file) {
  const surfaces = NAV_SURFACES.filter(surface => surface.file === file);
  // Check every region first: a missing one would otherwise widen its neighbour.
  for (const {region} of surfaces.filter(surface => surface.region)) {
    const marker = `<div id="${region}"`, at = source.indexOf(marker);
    if (at < 0 || source.indexOf(marker, at + 1) >= 0) {
      throw new Error(`Navigation region missing or duplicated: ${file}#${region}`);
    }
  }
  for (const surface of surfaces) {
    let start = 0, end = source.length;
    if (surface.region) {
      start = source.indexOf(`<div id="${surface.region}"`);
      const ends = regions.map(region => source.indexOf(`<div id="${region}"`, start + 1))
        .filter(index => index > start);
      if (ends.length) end = Math.min(...ends);
    }
    const region = source.slice(start, end);
    if (surface.variant === 'workstation') {
      source = source.slice(0, start) + renderWorkspaceNav(region, surface.active) + source.slice(end);
      continue;
    }
    const matches = [...region.matchAll(MAIN_NAV)];
    if (matches.length !== 1) {
      throw new Error(`Expected one navigation: ${file}${surface.region ? '#' + surface.region : ''}; found ${matches.length}`);
    }
    const match = matches[0];
    const rendered = SITE_NAV_OPEN + links(surface, match[2]) + match[3];
    source = source.slice(0, start + match.index) + rendered
      + source.slice(start + match.index + match[0].length);
    if (surface.variant === 'site') {
      const navAt = start + match.index;
      const headerStart = source.lastIndexOf('<header', navAt);
      const headerEnd = source.indexOf('</header>', navAt);
      if (headerStart < start || headerEnd < 0) throw new Error(`Main navigation outside a header: ${file}`);
      const header = source.slice(headerStart, headerEnd + '</header>'.length);
      source = source.slice(0, headerStart) + renderHeader(header, surface)
        + source.slice(headerEnd + '</header>'.length);
    }
  }
  return source;
}

export function writeBuiltNavigation(directory) {
  // Publishing uses a lightweight index/home and a separate compiled library.
  // Keep this transformation after both compilers, which write their own HTML.
  const rendered = new Map();
  for (const file of new Set(NAV_SURFACES.map(surface => surface.file))) {
    const published = file === 'index.html' ? ['library.html']
      : file === 'home.html' ? ['home.html', 'index.html'] : [file];
    for (const target of published) {
      rendered.set(target, renderPageNavigation(fs.readFileSync(new URL(target, directory), 'utf8'), file));
    }
  }
  // Validate every target before writing any navigation page.
  for (const [file, html] of rendered) fs.writeFileSync(new URL(file, directory), html);
}

// `npm run sync:nav`: after editing config/site-modules.mjs, rewrite the
// headers and navigation in the source pages so sources match the build
// (test/navigation-build.test.js checks this byte for byte).
export function syncSourceNavigation(directory = new URL('../', import.meta.url)) {
  const changed = [];
  for (const file of new Set(NAV_SURFACES.filter(surface => !surface.generatedFrom).map(surface => surface.file))) {
    const url = new URL(file, directory), source = fs.readFileSync(url, 'utf8');
    const rendered = renderPageNavigation(source, file);
    if (rendered !== source) { fs.writeFileSync(url, rendered); changed.push(file); }
  }
  return changed;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const changed = syncSourceNavigation();
  console.log(changed.length ? 'Updated navigation in: ' + changed.join(', ') + ' (run npm run build to refresh home.html)'
    : 'Source navigation already matches the registry');
}
