import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {pathToFileURL} from 'node:url';
import test from 'node:test';
import {auditClinicalLibrary} from '../scripts/audit-clinical-library.mjs';
import {createInventory,planClinicalPublication,sha256} from '../scripts/clinical-inventory.mjs';
import {compileClinicalSite} from '../scripts/clinical-compiler.mjs';
import {PUBLIC_FILES} from '../scripts/public-assets.mjs';

const current=auditClinicalLibrary();
const commit=current.inventory.baseline.sourceCommit;
function fixture(){
  const records=['retained','duplicate'].flatMap(completeCaseKey=>['入院','出院'].map((stage,index)=>({
    department:'骨科',group:'合成测试术式',completeCaseKey,idealCase:true,
    name:completeCaseKey+' · '+stage,short:stage,stage,type:index?'出院小结':'入院记录',sourceBody:'合成资料 '+completeCaseKey+' '+stage
  })));
  const source={records,renderedBodies:records.map(r=>r.sourceBody),sourceFiles:[],origins:records.map(()=> 'synthetic-test')};
  const inventory={...createInventory(source,commit),policy:{schemaVersion:1,baselineCommit:commit,decisions:[]}};
  return {source,inventory};
}
function archiveDuplicate(inventory){
  const [retained,duplicate]=inventory.baseline.cases;
  inventory.policy.decisions=[{caseId:duplicate.caseId,status:'archived',replacementCaseId:retained.caseId,
    reason:'Synthetic reviewed duplicate',reviewedBy:'test-fixture'}];
  return duplicate;
}

test('the committed baseline preserves complete cases and every special-case document',()=>{
  assert.deepEqual(current.inventory.baseline.summary,{records:5361,projectGroups:204,diseaseOrProcedureGroups:203,
    standardCases:203,standardRecords:5313,specialCases:2,specialRecords:44,utilityRecords:4,archivedRecords:0});
  assert.equal(current.plan.published.length,5361);
  assert.equal(current.plan.archived.length,0);
  assert.deepEqual(current.inventory.baseline.cases.filter(c=>c.caseType==='special').map(c=>c.recordIds.length),[29,15]);
  assert.equal(current.inventory.baseline.ambiguousNames[0].recordIds.length,3);
  for(const {record,identity,content}of current.plan.published){
    if(typeof record.sourceBody==='string')assert.equal(sha256(record.sourceBody),content.bodyHash);
    assert.equal(identity.cmsOverrideExists,null);
    assert.equal(identity.cmsCaseExists,null);
  }
});

test('reordering generated documents retains every original numeric and stable identity',()=>{
  const reordered={...current.source,records:[...current.source.records].reverse(),renderedBodies:[...current.source.renderedBodies].reverse()};
  const result=planClinicalPublication(reordered,current.inventory);
  assert.deepEqual(result.published.map(x=>x.identity.recordId),current.plan.published.map(x=>x.identity.recordId));
  assert.deepEqual(result.published.map(x=>x.record),current.source.records);
});

test('medical changes, missing records and duplicate identities stop publication',()=>{
  const altered=structuredClone(current.source);altered.records[4].sourceBody+=' altered';
  assert.throws(()=>planClinicalPublication(altered,current.inventory),/source changed/);
  assert.throws(()=>planClinicalPublication({...current.source,records:current.source.records.slice(1)},current.inventory),/record count changed/);
  const inventory=structuredClone(current.inventory);inventory.records[1].legacyId=inventory.records[0].legacyId;
  assert.throws(()=>planClinicalPublication(current.source,inventory),/identity ledger/);
});

test('archiving requires an independent CMS audit and always preserves whole cases',()=>{
  const {source,inventory}=fixture(),duplicate=archiveDuplicate(inventory);
  assert.throws(()=>planClinicalPublication(source,inventory),/production CMS overrides\/cases have not been verified/);
  const plan=planClinicalPublication(source,inventory,{cmsAudit:{baselineCommit:commit,revision:'synthetic-revision',safeToArchiveRecordIds:duplicate.recordIds}});
  assert.equal(plan.published.length,2);assert.equal(plan.archived.length,2);
  assert.deepEqual(plan.archived.map(x=>x.identity.recordId),duplicate.recordIds);
  assert.deepEqual(plan.published.map(x=>x.identity.legacyId),[0,1]);
  assert.deepEqual(source.records.map(r=>r.sourceBody),['合成资料 retained 入院','合成资料 retained 出院','合成资料 duplicate 入院','合成资料 duplicate 出院']);
  inventory.policy.decisions=[];
  assert.equal(planClinicalPublication(source,inventory).published.length,4,'removing the policy decision republishes the unchanged source');
});

test('special cases, different procedures and ambiguous CMS names cannot be archived',()=>{
  const real=structuredClone(current.inventory),special=real.baseline.cases.find(c=>c.caseType==='special');
  real.policy.decisions=[{caseId:special.caseId,status:'archived',replacementCaseId:real.baseline.cases[0].caseId,reason:'forbidden',reviewedBy:'test'}];
  assert.throws(()=>planClinicalPublication(current.source,real),/complete standard case/);
  const {source,inventory}=fixture(),duplicate=archiveDuplicate(inventory);
  const audit={baselineCommit:commit,revision:'synthetic-revision',safeToArchiveRecordIds:duplicate.recordIds};
  inventory.records.find(r=>r.recordId===duplicate.recordIds[0]).cmsRisk='ambiguous-legacy-name';
  assert.throws(()=>planClinicalPublication(source,inventory,{cmsAudit:audit}),/ambiguous legacy CMS names/);
  duplicate.group='another procedure';
  assert.throws(()=>planClinicalPublication(source,inventory,{cmsAudit:audit}),/complete standard case/);
});

test('public compilation retains exact payloads while excluding authoring sources and duplicate router medical text',t=>{
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'clinical-slim-test-'));t.after(()=>fs.rmSync(directory,{recursive:true,force:true}));
  const {manifest}=compileClinicalSite(fs.readFileSync(new URL('../index.html',import.meta.url),'utf8'),pathToFileURL(directory+'/'));
  assert.equal(manifest.total,5361);
  const router=fs.readFileSync(path.join(directory,manifest.scripts.router.slice(1)),'utf8');
  const nonOrtho=current.source.records.find(r=>r.department==='普外科');
  assert(!router.includes(nonOrtho.sourceBody.slice(0,120)),'medical seed text must exist only in its lazy body resource');
  assert.doesNotThrow(()=>new vm.Script(router));
  for(const name of PUBLIC_FILES)assert(fs.existsSync(new URL('../'+name,import.meta.url)),name);
  for(const name of ['app.js','departments.js','ideal-cases.js','record-quality-v3.js','record-course-v27.js','tka-special-cases.js'])assert(!PUBLIC_FILES.includes(name),name);
  assert(!PUBLIC_FILES.some(name=>name.startsWith('content/')));
});
