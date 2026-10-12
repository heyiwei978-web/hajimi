import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {runInNewContext} from 'node:vm';
import {test} from 'node:test';
import {loadEcg,validateEcg,compileEcg,ECG_SOURCES} from '../scripts/ecg-compiler.mjs';

const read=file=>readFileSync(new URL('../'+file,import.meta.url),'utf8');
function withSearch(){const window=loadEcg();runInNewContext(read('ecg-search.js'),{window});return window;}

test('merged ECG data passes build validation: unique slugs, existing sketches, categories and cross-links',()=>{
  assert.deepEqual(validateEcg(loadEcg()),[]);
});

test('build validation reports broken related links, unknown sketches and insecure references',()=>{
  const broken=file=>file==='ecg-book-data-5.js'?read(file)+'\n;(()=>{const e=window.HAJIMI_ECG_DATA.entries[0];e.related=[...(e.related||[]),"no-such-entry"];e.basic.diagram.kind="no-such-sketch";e.references.push({title:"x",url:"http://example.com"});})();':read(file);
  const errors=validateEcg(loadEcg(broken)).join('\n');
  assert.match(errors,/related entry no-such-entry does not exist/);
  assert.match(errors,/sketch "no-such-sketch" does not exist/);
  assert.match(errors,/reference must use https/);
});

test('compiler publishes one hashed bundle and rewrites ecg.html to load it',()=>{
  const directory=mkdtempSync(join(tmpdir(),'ecg-'));
  try{
    const result=compileEcg(pathToFileURL(directory+'/'));
    assert.match(result.name,/^ecg-[0-9a-f]{20}\.js$/);
    assert.equal(result.entries,94);
    const html=readFileSync(join(directory,'ecg.html'),'utf8');
    assert.match(html,new RegExp('src="/assets/'+result.name+'"'));
    for(const file of ECG_SOURCES)assert(!html.includes('/'+file+'?'),file+' should be bundled');
    const bundle=readFileSync(join(directory,'assets',result.name),'utf8');
    const window={};runInNewContext(bundle.replace(/\n;\n\(\(\)=>\{\n  'use strict';\n  const data=window\.HAJIMI_ECG_DATA,app[\s\S]*$/,''),{window,document:{}});
    assert.equal(window.HAJIMI_ECG_DATA.entries.length,94);
    assert.equal(typeof window.HAJIMI_ECG_SEARCH.create,'function');
    assert.equal(typeof window.HAJIMI_ECG_CALIPERS.reading,'function');
    // The same input always yields the same file name, so the immutable cache is safe.
    assert.equal(compileEcg(pathToFileURL(directory+'/')).name,result.name);
  }finally{rmSync(directory,{recursive:true,force:true});}
});

test('hashed assets are served with an immutable cache policy',()=>{
  const config=JSON.parse(read('vercel.json'));
  const rule=config.headers.find(item=>item.source==='/assets/(.*)');
  assert(rule);assert.match(rule.headers[0].value,/immutable/);
  assert(config.headers.indexOf(rule)>config.headers.findIndex(item=>item.source==='/(.*).js'),'asset rule must override the generic .js rule');
});

test('search ranks exact titles and aliases above full-text hits and spans long-form pages',()=>{
  const window=withSearch(),S=window.HAJIMI_ECG_SEARCH,engine=S.create(S.documents(window.HAJIMI_ECG_DATA));
  const first=query=>engine.search(query)[0].doc;
  assert.equal(first('房颤').id,'atrial-fibrillation');
  assert.equal(first('LBBB').id,'left-bundle-branch-block');
  assert.equal(engine.search('AF',{type:'entry'}).length,1);
  assert.equal(first('隐匿性传导').url,'/ecg/phenomena#ecg-ph-concealed');
  assert.equal(first('六步法').url,'/ecg/basics#ecg-six-steps');
  assert(engine.search('QTc').some(result=>result.doc.url==='/ecg/tools#ecg-qtc'));
  assert.equal(engine.search('   ').length,0);
  assert.equal(engine.search('房颤',{limit:3}).length,3);
});

test('search highlighting escapes markup before marking matches',()=>{
  const S=withSearch().HAJIMI_ECG_SEARCH;
  assert.equal(S.highlight('<b>房颤</b> 伴快速心室率','房颤'),'&lt;b&gt;<mark>房颤</mark>&lt;/b&gt; 伴快速心室率');
  assert.equal(S.highlight('Ｑ波','q'),'Ｑ波');
  assert.match(S.snippet('甲'.repeat(80)+'隐匿性传导'+'乙'.repeat(80),'隐匿性'),/^….*隐匿性传导.*…$/);
});

test('caliper readings convert sketch units to milliseconds and rate',()=>{
  const window={};runInNewContext(read('ecg-calipers.js'),{window,document:{}});
  const plain=value=>JSON.parse(JSON.stringify(value));
  assert.deepEqual(plain(window.HAJIMI_ECG_CALIPERS.reading(250,410)),{ms:800,rate:75});
  assert.deepEqual(plain(window.HAJIMI_ECG_CALIPERS.reading(410,250)),{ms:800,rate:75});
  assert.deepEqual(plain(window.HAJIMI_ECG_CALIPERS.reading(100,100)),{ms:0,rate:null});
});
