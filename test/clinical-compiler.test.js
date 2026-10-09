import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import test from 'node:test';
import {pathToFileURL} from 'node:url';
import {compileClinicalSite} from '../scripts/clinical-compiler.mjs';

test('compiled catalogs and per-disease bodies preserve every original clinical record',t=>{
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'hajimi-clinical-'));
  t.after(()=>fs.rmSync(directory,{recursive:true,force:true}));
  const {source,manifest}=compileClinicalSite(fs.readFileSync(new URL('../index.html',import.meta.url),'utf8'),pathToFileURL(directory+'/'));
  const records=[];
  for(const department of Object.values(manifest.departments)){
    vm.runInNewContext(fs.readFileSync(path.join(directory,department.catalog.slice(1)),'utf8'),{window:{HAJIMI:{acceptCatalog(name,{strings,extras,rows}){
      for(const [id,group,short,stage,type,desc,title,extra,hasBody]of rows){
        const g=strings[group],label=g==='TKA'?'全膝关节置换':g==='THA'?'全髋关节置换':g;
        records[id]={...extras[extra],department:name,group:g,short:strings[short],stage:strings[stage],type:strings[type],desc:strings[desc],name:title<0?label+' · '+strings[short]:strings[title]};
        assert.equal(hasBody,!!source.records[id].sourceBody);
      }
    }}}});
  }
  for(const file of Object.values(manifest.bodies)){
    for(const [id,body]of JSON.parse(fs.readFileSync(path.join(directory,file.slice(1)),'utf8')))records[id].sourceBody=body;
  }
  assert.equal(records.length,5159);
  // Convert cross-context objects before comparison; all public fields, flags,
  // special-case ordering and every body must survive the data split unchanged.
  assert.deepEqual(JSON.parse(JSON.stringify(records)),source.records);
  assert.equal(manifest.departments.guke.count,5132);
  const entry=fs.readFileSync(path.join(directory,'library.html'),'utf8');
  assert(!entry.includes('/record-quality-v'));assert(!entry.includes('/orthopedic-expansion-'));
});
