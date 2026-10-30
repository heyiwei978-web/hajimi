import fs from 'node:fs';
import {NAV_SURFACES, navModules} from '../config/site-modules.mjs';

// Only replace the link list. Existing wrappers, whitespace, patient controls,
// authentication slots and page-specific branding remain part of each page.
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
