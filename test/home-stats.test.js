import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {DEPARTMENTS} from '../config/site-modules.mjs';
import {auditClinicalLibrary} from '../scripts/audit-clinical-library.mjs';
import {compileCaseTemplates} from '../scripts/clinical-compiler.mjs';

// The homepage figures are static markup; keep them tied to the real data so they
// cannot silently drift when cases, departments or tools are added or removed.
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const stat=label=>{
  const match=new RegExp('<strong>(\\d+)</strong><small>'+label+'</small>').exec(html);
  assert(match,'homepage stat missing: '+label);
  return Number(match[1]);
};

test('homepage statistics match the published library, departments and tool catalogue',()=>{
  const catalog=compileCaseTemplates(auditClinicalLibrary().plan.published);
  const orthoStandard=catalog.items.filter(item=>item.department==='骨科'&&item.caseType==='standard').length;
  assert.equal(stat('骨科病种 / 术式'),orthoStandard);
  assert.equal(Number(/<small>骨科标准模板<\/small>\s*<strong>(\d+)<\/strong>/.exec(html)?.[1]),orthoStandard);
  assert.equal(stat('科室分类'),DEPARTMENTS.length);
  const tools=new Set([...fs.readFileSync(new URL('../tools.html',import.meta.url),'utf8').matchAll(/data-tool="([^"]+)"/g)].map(m=>m[1]));
  assert.equal(stat('临床工具'),tools.size);
});
