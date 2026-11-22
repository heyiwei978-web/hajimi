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

// 2026-11-20（优化方案 P1-1）：网址随内容变化的文件可以长期缓存。
const IMMUTABLE = 'public, max-age=31536000, immutable';
const pathPattern = source => new RegExp('^/' + /^\/:file\((.+)\)$/.exec(source)[1] + '$');

test('content-hashed file names are cached as immutable, after the generic one-day .js rule', () => {
  const config = JSON.parse(fs.readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
  const index = config.headers.findIndex(entry => entry.source.startsWith('/:file(') && !entry.has);
  assert(index > config.headers.findIndex(entry => entry.source === '/(.*).js'), 'later rules override earlier ones');
  const rule = config.headers[index];
  assert.equal(rule.headers.find(header => header.key === 'Cache-Control')?.value, IMMUTABLE);
  const pattern = pathPattern(rule.source);
  // The clinical compiler names its outputs <name>-<20 hex digits>.js.
  for (const file of ['/app-runtime-df9108f4fa1b35310a2b.js', '/library-manifest-c5fa14a2c9f6d6f51d2e.js', '/catalog-guke-5eda5e3d2e3c7041470b.js', '/department-runtime-80733457f8b05ad67369.js']) {
    assert.match(file, pattern);
  }
  for (const file of ['/cms-core.js', '/ecg-search.js', '/note.js', '/assets/ecg-14a00d3802e6f928ac1a.js', '/x-df9108f4fa1b35310a2bZ.js', '/api/x-df9108f4fa1b35310a2b.js']) {
    assert.doesNotMatch(file, pattern, file);
  }
});

test('?v= with a 12-digit content digest is cached as immutable; other ?v= values keep the one-day rule', async () => {
  const config = JSON.parse(fs.readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
  const {assetDigest} = await import('../scripts/asset-versions.mjs');
  const directory = new URL('../', import.meta.url);
  const digest = assetDigest(directory, 'styles.css');
  for (const source of ['/(.*).js', '/(.*).css']) {
    const generic = config.headers.findIndex(entry => entry.source === source && !entry.has);
    const index = config.headers.findIndex(entry => entry.source === source && entry.has);
    assert(index > generic, source + ' versioned rule comes after the generic rule');
    const rule = config.headers[index];
    assert.equal(rule.headers.find(header => header.key === 'Cache-Control')?.value, IMMUTABLE);
    assert.deepEqual(rule.has.map(({type, key}) => [type, key]), [['query', 'v']]);
    const value = new RegExp(rule.has[0].value);
    assert.match(digest, value, 'asset-versions.mjs digests match');
    for (const stale of ['20261030-ui1', '20261011-mvp1', '', 'abc', digest + '0', 'zzzzzzzzzzzz']) assert.doesNotMatch(stale, value, stale);
  }
});
