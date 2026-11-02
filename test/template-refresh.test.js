import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

const departments=fs.readFileSync(new URL('../departments.js',import.meta.url),'utf8');
const cms=fs.readFileSync(new URL('../cms-core.js',import.meta.url),'utf8');
const start=departments.indexOf("    window.addEventListener('hajimi:templates-changed',");
const listener=departments.slice(start,departments.indexOf("    window.addEventListener('hajimi:cms-ready',"));

test('developer-mode template save and reset announce the change',()=>{
  assert.ok(start>0,'departments.js listens for template changes');
  assert.equal((cms.match(/renderExtras\(t\);templatesChanged\(\);notify/g)||[]).length,2,'save and restore both refresh the page');
  assert.match(cms,/function templatesChanged\(\)\{window\.dispatchEvent\(new CustomEvent\('hajimi:templates-changed'\)\);\}/);
});

test('open record chapters show the saved wording without a reload',()=>{
  const templates=[{name:'a'},{name:'b'}];
  const overrides={a:'改后正文 A'};
  const chapter=index=>({closest:()=>({dataset:{recordIndex:String(index)}}),textContent:'旧正文'});
  const bodies=[chapter(0),chapter(1),{closest:()=>null,textContent:'无索引'}];
  const handlers={};
  const context={
    templates,
    generate:t=>overrides[t.name]||'默认 '+t.name,
    document:{querySelectorAll:selector=>selector==='.record-book-body'?bodies:[]},
    window:{addEventListener:(type,fn)=>{handlers[type]=fn;}}
  };
  vm.runInNewContext(listener,context);
  handlers['hajimi:templates-changed']();
  assert.deepEqual(bodies.map(b=>b.textContent),['改后正文 A','默认 b','无索引']);
});
