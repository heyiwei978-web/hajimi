import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {pathToFileURL} from 'node:url';
import test from 'node:test';
import {auditClinicalLibrary} from '../scripts/audit-clinical-library.mjs';
import {compileCaseTemplates,compileClinicalSite} from '../scripts/clinical-compiler.mjs';

const current=auditClinicalLibrary(),catalog=compileCaseTemplates(current.plan.published);

test('complete templates own every published chapter exactly once, with special and utility cases separate',()=>{
  assert.equal(catalog.total,193);assert.equal(catalog.standard,191);assert.equal(catalog.special,2);assert.equal(catalog.utilityGroups,1);
  const chapters=catalog.items.flatMap(item=>item.chapterIds);
  assert.equal(chapters.length,5052);assert.equal(new Set(chapters).size,5052);
  assert.deepEqual([...chapters].sort((a,b)=>a-b),current.plan.published.map(x=>x.identity.legacyId).sort((a,b)=>a-b));
  for(const item of catalog.items){
    assert.equal(item.chapterCount,item.chapterIds.length);
    const owners=current.plan.published.filter(x=>item.chapterIds.includes(x.identity.legacyId));
    assert(owners.every(x=>x.record.department===item.department&&x.record.group===item.group));
    if(item.caseType!=='utility')assert(owners.every(x=>x.identity.caseId===item.caseId));
  }
  const tka=catalog.items.filter(x=>x.group==='TKA');
  assert.equal(tka.length,3);assert.deepEqual(tka.map(x=>x.chapterCount),[40,29,15]);
  assert.equal(catalog.items.find(x=>x.caseType==='utility').chapterCount,4);
  assert(!catalog.items.some(x=>x.group==='腰椎间盘突出症'));
});

test('whole-case counts are available before lazy catalogs load and never use the chapter total',()=>{
  const source=fs.readFileSync(new URL('../departments.js',import.meta.url),'utf8');
  const start=source.indexOf('function caseEntries('),end=source.indexOf('function allDisease(',start);
  const context={window:{HAJIMI:{manifest:{total:5052,caseTemplates:catalog}}},templates:[],labelFor:g=>g};
  vm.runInNewContext(source.slice(start,end)+'\nglobalThis.countCases=caseTotals;',context);
  assert.equal(context.countCases().total,193);
  assert.equal(context.countCases('骨科').total,190);
  assert.equal(context.countCases('骨科').standard,188);
  assert.equal(context.countCases('骨科').special,2);
  for(const name of ['普外科','肾内科','妇科'])assert.equal(context.countCases(name).total,1);
  assert.equal(context.countCases('骨科',['通用场景']).total,0);
  assert.equal(context.countCases('骨科',['通用场景']).utility,1);
});

test('case integration keeps every published body and original numeric identity intact',t=>{
  const folder=fs.mkdtempSync(path.join(os.tmpdir(),'case-templates-'));
  t.after(()=>fs.rmSync(folder,{recursive:true,force:true}));
  const directory=pathToFileURL(folder+'/');
  const before=JSON.stringify(current.source.records);
  const {manifest,publication}=compileClinicalSite(fs.readFileSync(new URL('../index.html',import.meta.url),'utf8'),directory);
  assert.equal(manifest.total,5052,'the internal lazy-loading contract still counts chapters');
  assert.deepEqual(manifest.caseTemplates,catalog);
  const bodies=new Map(Object.values(manifest.bodies).flatMap(file=>JSON.parse(fs.readFileSync(new URL(file.slice(1),directory),'utf8'))));
  for(const entry of publication.published)if(entry.record.sourceBody)assert.equal(bodies.get(entry.identity.legacyId),entry.record.sourceBody);
  assert.equal(JSON.stringify(current.source.records),before);
});
