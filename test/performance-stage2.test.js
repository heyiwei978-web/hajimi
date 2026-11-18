import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

test('second-stage optimization preserves content while improving paint behavior',()=>{
  const css=fs.readFileSync(new URL('../styles.css',import.meta.url),'utf8');
  assert.match(css,/second-stage paint and motion optimization/);
  assert.match(css,/@supports \(content-visibility:auto\)/);
  assert.match(css,/\.template-card,[\s\S]*?\.dept-card,[\s\S]*?\.path-step,[\s\S]*?content-visibility:auto/);
  assert.match(css,/contain:layout paint/);
  // 原 @media(hover:none) 规则针对的 .template-card 等卡片已不存在，2026-11-18 作为无人使用的规则删除。
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});

test('static scripts and styles receive repeat-load caching without caching APIs',()=>{
  const config=JSON.parse(fs.readFileSync(new URL('../vercel.json',import.meta.url),'utf8'));
  for(const source of ['/(.*).js','/(.*).css']){
    const rule=config.headers.find(entry=>entry.source===source);
    assert(rule,source+' cache rule missing');
    const cache=rule.headers.find(header=>header.key==='Cache-Control');
    assert.equal(cache?.value,'public, max-age=86400, stale-while-revalidate=604800');
  }
  const apiRule=config.headers.find(entry=>entry.source==='/api/(.*)');
  assert(apiRule?.headers.some(header=>header.key==='Cache-Control'&&header.value==='no-store'));
});
