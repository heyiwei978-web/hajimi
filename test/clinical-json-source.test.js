import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {loadBuildSource} from '../scripts/clinical-compiler.mjs';
import {CLINICAL_SOURCE_DIR,groupFileName,hasClinicalJsonSource,loadClinicalJsonSource} from '../scripts/clinical-source.mjs';

const root=new URL('../',import.meta.url);
const sha256=value=>createHash('sha256').update(value).digest('hex');
const sourceDir=new URL(CLINICAL_SOURCE_DIR,root);
const index=JSON.parse(fs.readFileSync(new URL('index.json',sourceDir),'utf8'));

test('the build reads the per-disease JSON source, one file per department and disease',()=>{
  assert(hasClinicalJsonSource());
  const source=loadBuildSource(fs.readFileSync(new URL('index.html',root),'utf8'));
  assert(source.sourceFiles.some(file=>file.path===CLINICAL_SOURCE_DIR+'index.json'));
  assert.equal(source.records.length,index.sequence.reduce((sum,[,count])=>sum+count,0));
  assert.equal(source.renderedBodies.length,source.records.length);
  assert.equal(source.origins.length,source.records.length);
  for(const name of index.files){
    assert.match(name,/^(guke|puwai|shennei|fuke)\/[^/]+\.json$/);
    const records=JSON.parse(fs.readFileSync(new URL(name,sourceDir),'utf8'));
    assert(records.length>0,name);
    for(const record of records)assert.equal(groupFileName(record),name,'record filed under its own disease: '+record.name);
  }
});

test('the retired generation chain is frozen; edit the JSON files instead',()=>{
  assert(Array.isArray(index.retiredChain)&&index.retiredChain.length>40);
  // search-core.js, app.js and departments.js also ran in the chain but are live
  // runtime code (Claude's scope), so only the record/patch scripts are frozen.
  const runtimeCode=new Set(['search-core.js','app.js','departments.js']);
  for(const file of index.retiredChain.filter(item=>!runtimeCode.has(item.path))){
    assert.equal(sha256(fs.readFileSync(new URL(file.path,root),'utf8')),file.sha256,file.path+' is retired and must not change');
  }
});

test('the one-time export refuses to overwrite the JSON source',async()=>{
  await assert.rejects(import(pathToFileURL(path.join(root.pathname,'scripts/clinical-source-export.mjs')).href+'?t='+Date.now()),/already exists/);
});

test('legacy ledger rendering applies only to the unchanged record version',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'hajimi-source-'));
  try{
    const base={group:'测试病种',name:'测试病种 · 入院记录',short:'入院记录',stage:'入院',type:'入院记录',desc:'合成',department:'骨科',sourceBody:'合成正文'};
    const edited={...base,sourceBody:'合成正文（已修改）'};
    const write=(record,legacy)=>{
      fs.mkdirSync(path.join(dir,'guke'),{recursive:true});
      fs.writeFileSync(path.join(dir,'guke','测试病种.json'),JSON.stringify([record]));
      fs.writeFileSync(path.join(dir,'index.json'),JSON.stringify({schemaVersion:1,groups:['测试病种'],traumaGroups:[],seeds:{},qualityAudit:null,
        origins:[['synthetic',1]],sequence:[['guke/测试病种.json',1]],files:['guke/测试病种.json']}));
      fs.writeFileSync(path.join(dir,'legacy-rendered.json'),JSON.stringify(legacy));
    };
    const legacy=[{index:0,recordHash:sha256(JSON.stringify(base)),rendered:'旧链渲染'}];
    write(base,legacy);
    const directory=pathToFileURL(dir+'/');
    assert.deepEqual(loadClinicalJsonSource({audit:true,directory}).renderedBodies,['旧链渲染']);
    write(edited,legacy);
    assert.deepEqual(loadClinicalJsonSource({audit:true,directory}).renderedBodies,['合成正文（已修改）'],'an edited record renders its new text');
    fs.writeFileSync(path.join(dir,'index.json'),JSON.stringify({schemaVersion:1,groups:[],traumaGroups:[],seeds:{},qualityAudit:null,
      origins:[['synthetic',2]],sequence:[['guke/测试病种.json',2]],files:['guke/测试病种.json']}));
    assert.throws(()=>loadClinicalJsonSource({directory}),/sequence exceeds/);
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
