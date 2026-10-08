import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

test('orthopedic pathway center has the national ERAS library and responsive shell',()=>{
  const html=fs.readFileSync(new URL('../pathway.html',import.meta.url),'utf8');
  const navJs=fs.readFileSync(new URL('../pathway.js',import.meta.url),'utf8');
  const officialJs=fs.readFileSync(new URL('../pathway-official.js',import.meta.url),'utf8');
  const css=fs.readFileSync(new URL('../pathway.css',import.meta.url),'utf8');

  assert.doesNotThrow(()=>new Function(navJs));
  assert.doesNotThrow(()=>new Function(officialJs));
  assert.match(html,/全膝关节置换术加速康复临床路径/);
  assert.match(html,/路径准入与术前目标/);
  assert.match(html,/医师版时间轴/);
  assert.match(html,/路径变异与退出/);
  assert.match(html,/患者版路径告知/);
  assert.match(html,/路径质控指标/);
  assert.match(html,/pathway-official\.js/);
  assert.match(css,/@media\(max-width:580px\)/);

  const context={window:{},encodeURIComponent,console};
  vm.createContext(context);
  vm.runInContext(officialJs,context,{timeout:3000});
  const paths=context.window.HAJIMI_OFFICIAL_PATHWAYS?.pathways||{};
  assert.equal(Object.keys(paths).length,11);
  for(const key of ['tha','fnf','intertroch','pilon','trimalleolar','acdf','lumbarFusion','pvp','taa','tumorHip','tumorKnee']){
    assert(paths[key],key+' pathway should exist');
    assert.match(paths[key].source,/^https:\/\/www\.nhc\.gov\.cn\//);
    assert(paths[key].stay);
    assert(paths[key].discharge.length>=3);
  }

  const ready=(navJs.match(/status:'ready'/g)||[]).length;
  assert.equal(ready,12);
});

test('main site and TKA record both link to the pathway center',()=>{
  const index=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const departments=fs.readFileSync(new URL('../departments.js',import.meta.url),'utf8');
  const vercel=JSON.parse(fs.readFileSync(new URL('../vercel.json',import.meta.url),'utf8'));
  assert.match(index,/pathway-home-banner/);
  assert.match(index,/12 <small>国家路径已纳入/);
  assert.match(index,/href="\/pathway">临床路径/);
  assert.match(departments,/查看临床路径/);
  assert(vercel.rewrites.some(entry=>entry.source==='/pathway'&&entry.destination==='/pathway.html'));
  assert(vercel.rewrites.some(entry=>entry.source==='/pathway/'&&entry.destination==='/pathway.html'));
});
