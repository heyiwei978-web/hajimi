import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {pathToFileURL} from 'node:url';
import test from 'node:test';
import {compileClinicalSite} from '../scripts/clinical-compiler.mjs';

test('retained numeric and stable IDs resolve originals; withdrawn IDs remain unavailable',async t=>{
  const folder=fs.mkdtempSync(path.join(os.tmpdir(),'clinical-links-'));t.after(()=>fs.rmSync(folder,{recursive:true,force:true}));
  const directory=pathToFileURL(folder+'/'),{source,manifest,publication}=compileClinicalSite(fs.readFileSync(new URL('../index.html',import.meta.url),'utf8'),directory);
  const context={window:{HAJIMI_MANIFEST:manifest},location:{pathname:'/bl'},console,
    document:{createElement(){return {};},head:{append(){}}},fetch:async url=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(new URL(url.slice(1),directory),'utf8'))})};
  vm.createContext(context);vm.runInContext(fs.readFileSync(new URL('../library-loader.js',import.meta.url),'utf8'),context);
  for(const item of Object.values(manifest.departments))vm.runInContext(fs.readFileSync(new URL(item.catalog.slice(1),directory),'utf8'),context);
  const H=context.window.HAJIMI;
  const withdrawn=new Set(publication.withdrawn.map(entry=>entry.identity.legacyId));
  const byId=new Map([...publication.published,...publication.withdrawn].map(entry=>[entry.identity.legacyId,entry.record]));
  for(const [id,expected] of byId){
    const row=H.findRecord(id),stable=H.findRecord('clinical-v1-r'+String(id).padStart(6,'0'));
    assert.equal(row,stable);
    if(withdrawn.has(id)){assert.equal(row,null);continue;}
    assert.equal(row.name,expected.name);assert.equal(row.group,expected.group);
    assert.equal(row.specialCaseKey,expected.specialCaseKey);
  }
  // The three same-name records must remain distinct before and after body load.
  const rows=[5159,5359,5360].map(id=>H.findRecord(id));
  const fetchBody=JSON.parse(fs.readFileSync(new URL(manifest.bodies['骨科\0TKA'].slice(1),directory),'utf8'));
  for(const [id,body]of fetchBody)H.findRecord(id).sourceBody=body;
  assert.equal(new Set(rows).size,3);
  for(let i=0;i<3;i++)assert.equal(rows[i].sourceBody,source.records[[5159,5359,5360][i]].sourceBody);
  assert.equal(H.findRecord(-1),null);assert.equal(H.findRecord('clinical-v1-r999999'),null);
});
