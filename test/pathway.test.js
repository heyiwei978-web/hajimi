import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

test('orthopedic pathway center has a valid first-stage structure',()=>{
  const html=fs.readFileSync(new URL('../pathway.html',import.meta.url),'utf8');
  const js=fs.readFileSync(new URL('../pathway.js',import.meta.url),'utf8');
  const css=fs.readFileSync(new URL('../pathway.css',import.meta.url),'utf8');
  assert.doesNotThrow(()=>new Function(js));
  assert.match(html,/全膝关节置换术加速康复临床路径/);
  assert.match(html,/标准住院日/);
  assert.match(html,/路径准入与术前目标/);
  assert.match(html,/医师版时间轴/);
  assert.match(html,/路径变异与退出/);
  assert.match(html,/患者版路径告知/);
  assert.match(html,/路径质控指标/);
  assert.match(html,/2023年版/);
  assert.match(html,/href="\/bl\/guke\/TKA"/);
  assert.match(css,/@media\(max-width:580px\)/);
  const catalog=(js.match(/\['[^']+','(?:ready|planned)'\]/g)||[]);
  assert.equal(catalog.length,20);
});

test('main site and TKA record both link to the pathway center',()=>{
  const index=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const departments=fs.readFileSync(new URL('../departments.js',import.meta.url),'utf8');
  const vercel=JSON.parse(fs.readFileSync(new URL('../vercel.json',import.meta.url),'utf8'));
  assert.match(index,/pathway-home-banner/);
  assert.match(index,/href="\/pathway">临床路径/);
  assert.match(departments,/查看临床路径/);
  assert(vercel.rewrites.some(entry=>entry.source==='/pathway'&&entry.destination==='/pathway.html'));
  assert(vercel.rewrites.some(entry=>entry.source==='/pathway/'&&entry.destination==='/pathway.html'));
});
