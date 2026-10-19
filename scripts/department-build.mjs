import fs from 'node:fs';
import {DEPARTMENTS} from '../config/site-modules.mjs';

// Browser and clinical authoring sources remain fallbacks. These projections
// replace only the published department lists, preserving surrounding content.
const html = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[character]);
const jsString = value => "'" + String(value).replace(/[\\'\u0000-\u001f\u2028\u2029]/g,
  character => character === '\\' || character === "'" ? '\\' + character
    : '\\u' + character.charCodeAt(0).toString(16).padStart(4,'0')) + "'";

function presentation(department, field) {
  const value = department.presentation?.[field];
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Department presentation missing: ${department.slug}.${field}`);
  }
  return value;
}

function replaceOne(source, pattern, render, description) {
  const matches = [...source.matchAll(pattern)];
  if (matches.length !== 1) throw new Error(`Expected one ${description}; found ${matches.length}`);
  const match = matches[0];
  return source.slice(0,match.index) + render(match) + source.slice(match.index + match[0].length);
}

export function renderHomeDepartments(source, departments=DEPARTMENTS) {
  return replaceOne(source, /(<div class="home-quick-grid">)([\s\S]*?)(<\/div>\s*(?=<a class="home-quick-pathway"))/g,
    match => {
      const inner = match[2], anchors = [...inner.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/g)];
      if (!anchors.length) throw new Error('Homepage department cards missing');
      const prefix = inner.slice(0,anchors[0].index), last = anchors.at(-1);
      const suffix = inner.slice(last.index + last[0].length);
      const gaps = anchors.slice(1).map((anchor,index) => inner.slice(anchors[index].index + anchors[index][0].length,anchor.index));
      if (prefix.trim() || suffix.trim() || gaps.some(gap => gap.trim() || gap !== gaps[0])) {
        throw new Error('Unexpected content between homepage department cards');
      }
      const cards = departments.filter(department => department.records).map(department =>
        `<a href="/bl/${html(department.slug)}"><span class="home-department-icon" aria-hidden="true">${html(presentation(department,'homeIcon'))}</span><div><strong>${html(department.name)}</strong><small>${html(presentation(department,'homeDescription'))}</small></div><b aria-hidden="true">↗</b></a>`);
      return match[1] + prefix + cards.join(gaps[0] || '') + suffix + match[3];
    }, 'homepage department grid');
}

export function renderRouterDepartments(source, departments=DEPARTMENTS) {
  return replaceOne(source, /(const departments=\[)([\s\S]*?)(\];)/g, match => {
    // All clinical departments stay routable, independently of UI visibility.
    const rows = departments.map(department => `{name:${jsString(department.name)},slug:${jsString(department.slug)},desc:${jsString(presentation(department,'recordsDescription'))}}`);
    return match[1] + '\n      ' + rows.join(',\n      ') + '\n    ' + match[3];
  }, 'router department list');
}

export function renderClassificationDepartments(source, departments=DEPARTMENTS) {
  return replaceOne(source, /("departments": )(\[[\s\S]*?\n  \])(?=,\s*"entries":)/g, match => {
    const rows = departments.map(department => {
      if (typeof department.classification !== 'boolean') throw new Error('Department classification flag must be boolean');
      return {id:department.slug,name:department.name,
        description:presentation(department,'classificationDescription'),ready:department.classification};
    });
    return match[1] + JSON.stringify(rows,null,2).replace(/\n/g,'\n  ');
  }, 'classification department list');
}

export function writeBuiltDepartmentPages(directory) {
  const rendered = new Map();
  for (const file of ['index.html','home.html','library.html']) {
    rendered.set(file,renderHomeDepartments(fs.readFileSync(new URL(file,directory),'utf8')));
  }
  rendered.set('classification-data.js',renderClassificationDepartments(
    fs.readFileSync(new URL('classification-data.js',directory),'utf8')));
  for (const [file,source] of rendered) fs.writeFileSync(new URL(file,directory),source);
}
