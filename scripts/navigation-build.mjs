import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {NAV_SURFACES, SITE_BRAND, navModules} from '../config/site-modules.mjs';

// Official and tools pages: the whole header (brand, navigation shell and the
// optional right-hand slot) is re-rendered from one template, keeping only the
// page's extra header classes and its right-slot content. Library pages keep
// their own header (department branding, patient controls, auth slot); only
// the link list is replaced there.
const patterns = {
  official: /(<nav\b[^>]*aria-label="主导航"[^>]*>)([\s\S]*?)(<\/nav>)/g,
  tools: /(<nav\b[^>]*aria-label="主导航"[^>]*>)([\s\S]*?)(<\/nav>)/g,
  library: /(<div class="top-actions library-top-actions">)([\s\S]*?)(<\/div>)/g
};
const regions = [...new Set(NAV_SURFACES.map(surface => surface.region).filter(Boolean))];
const escape = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[character]);

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
  const last = anchors.at(-1), suffix = inner.slice(last.index + last[0].length);
  const modules = navModules(surface);
  if (surface.active && !modules.some(module => module.id === surface.active)) {
    throw new Error(`Active navigation entry missing: ${surface.file}`);
  }
  return prefix + modules.map(module => {
    const active = module.id === surface.active;
    const classes = surface.variant === 'library'
      ? 'text-action' + (active ? ' library-active-link' : '')
      : active ? 'active' : '';
    return `<a${classes ? ` class="${classes}"` : ''} href="${escape(module.href)}"${active ? ' aria-current="page"' : ''}>${escape(module.label)}</a>`;
  }).join(gaps[0] || '') + suffix;
}

function brandInner() {
  return `<span class="official-brand-mark" aria-hidden="true">${escape(SITE_BRAND.mark)}</span>`
    + `<span class="official-brand-text"><strong>${escape(SITE_BRAND.name)}</strong><small>${escape(SITE_BRAND.tagline)}</small></span>`;
}

const HEADER_PATTERNS = {
  official: /^<header class="([^"]*)">\s*<div class="global-nav-inner official-nav-inner">\s*<a class="global-brand official-brand" href="\/">[\s\S]*?<\/a>\s*(<nav\b[\s\S]*?<\/nav>)\s*(?:<div class="official-nav-right">([\s\S]*?)<\/div>\s*)?<\/div>\s*<\/header>$/,
  tools: /^<header class="([^"]*)">\s*<div class="navin">\s*<a class="brand workspace-brand" href="\/">[\s\S]*?<\/a>\s*(<nav\b[\s\S]*?<\/nav>)\s*<\/div>\s*<\/header>$/
};

export function renderHeader(header, surface) {
  const match = header.match(HEADER_PATTERNS[surface.variant]);
  if (!match) {
    throw new Error(`Header does not follow the shared ${surface.variant} structure: ${surface.file}`
      + ' (brand link, main navigation and optional .official-nav-right only)');
  }
  const [, classes, nav, right] = match;
  const classList = classes.split(/\s+/).filter(Boolean);
  if (surface.variant === 'official') {
    if (!classList.includes('global-nav') || !classList.includes('official-nav')) {
      throw new Error(`Official header must keep global-nav official-nav classes: ${surface.file}`);
    }
    return `<header class="${classList.join(' ')}">\n  <div class="global-nav-inner official-nav-inner">\n`
      + `    <a class="global-brand official-brand" href="/">${brandInner()}</a>\n`
      + `    ${nav}\n`
      + (right !== undefined ? `    <div class="official-nav-right">${right.trim()}</div>\n` : '')
      + '  </div>\n</header>';
  }
  return `<header class="${classList.join(' ')}"><div class="navin">`
    + `<a class="brand workspace-brand" href="/">${brandInner()}</a>${nav}</div></header>`;
}

export function renderPageNavigation(source, file) {
  for (const surface of NAV_SURFACES.filter(surface => surface.file === file)) {
    let start = 0, end = source.length;
    if (surface.region) {
      const marker = `<div id="${surface.region}"`;
      start = source.indexOf(marker);
      if (start < 0 || source.indexOf(marker, start + 1) >= 0) {
        throw new Error(`Navigation region missing or duplicated: ${file}#${surface.region}`);
      }
      const ends = regions.map(region => source.indexOf(`<div id="${region}"`, start + 1))
        .filter(index => index > start);
      if (ends.length) end = Math.min(...ends);
    }
    const region = source.slice(start, end);
    const matches = [...region.matchAll(patterns[surface.variant])];
    if (matches.length !== 1) {
      throw new Error(`Expected one navigation: ${file}${surface.region ? '#' + surface.region : ''}; found ${matches.length}`);
    }
    const match = matches[0];
    const rendered = match[1] + links(surface, match[2]) + match[3];
    source = source.slice(0, start + match.index) + rendered
      + source.slice(start + match.index + match[0].length);
    if (surface.variant === 'official' || surface.variant === 'tools') {
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
