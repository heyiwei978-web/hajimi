import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {fileURLToPath,pathToFileURL} from 'node:url';
import test from 'node:test';
import {auditClinicalLibrary,parseClinicalAuditOptions} from '../scripts/audit-clinical-library.mjs';
import {canonical,deriveClinicalState,planClinicalPublication,readInventory,sha256} from '../scripts/clinical-inventory.mjs';
import {applyClinicalUpdate,persistClinicalRevision,proposeClinicalUpdate} from '../scripts/clinical-updates.mjs';
import {compileClinicalSite} from '../scripts/clinical-compiler.mjs';

const current=auditClinicalLibrary(),commit=current.inventory.baseline.sourceCommit;
const authorize=proposal=>({authorizedProposalHash:proposal.proposalHash,reviewedBy:'synthetic-reviewer',reason:'synthetic test only',reviewReference:'test://approved-change'});
function changed(index=4){
  const source=structuredClone(current.source);
  source.records[index].sourceBody='合成测试正文\n仅存在于内存及临时测试产物。';
  source.renderedBodies[index]=source.records[index].sourceBody;
  const proposal=proposeClinicalUpdate(source,current.source,current.inventory,{sourceCommit:commit});
  return {source,proposal,next:()=>applyClinicalUpdate(source,current.source,current.inventory,proposal,authorize(proposal))};
}
function temp(t){
  const folder=fs.mkdtempSync(path.join(os.tmpdir(),'clinical-update-'));t.after(()=>fs.rmSync(folder,{recursive:true,force:true}));
  return pathToFileURL(folder+'/');
}
function copyInventory(location){
  for(const name of ['baseline.json','records.jsonl','publication.json','revisions.json'])fs.copyFileSync(new URL('../content/clinical-library/'+name,import.meta.url),new URL(name,location));
}
function payloads(location,manifest){
  return new Map(Object.values(manifest.bodies).flatMap(file=>JSON.parse(fs.readFileSync(new URL(file.slice(1),location),'utf8'))));
}

test('reviewed single-body edit rebuilds while all other 5360 identities and records remain exact',t=>{
  const before=canonical(current.inventory),{source,proposal,next}=changed(),updated=next();
  assert.equal(proposal.updates.length,1);assert.equal(proposal.additions.length,0);
  assert.match(proposal.review[0].sourceBodyDiff,/\+合成测试正文/);
  assert.equal(canonical(current.inventory),before,'preview/apply never mutate the original inventory');
  assert.deepEqual(updated.baseline,current.inventory.baseline);assert.deepEqual(updated.records,current.inventory.records);
  const plan=planClinicalPublication(source,updated);
  for(let i=0;i<current.plan.published.length;i++){
    assert.deepEqual(plan.published[i].identity,current.plan.published[i].identity);
    if(i!==4){assert.deepEqual(plan.published[i].record,current.source.records[i]);assert.deepEqual(plan.published[i].content,current.plan.published[i].content);}
  }
  const oldDir=temp(t),newDir=temp(t),html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const oldBuild=compileClinicalSite(html,oldDir),newBuild=compileClinicalSite(html,newDir,{source,inventory:updated});
  const oldBodies=payloads(oldDir,oldBuild.manifest),newBodies=payloads(newDir,newBuild.manifest);
  assert.equal(newBodies.size,current.plan.published.filter(entry=>typeof entry.record.sourceBody==='string').length);assert.equal(newBuild.manifest.total,current.plan.published.length);
  assert.deepEqual([...newBodies.keys()],[...oldBodies.keys()]);
  assert.deepEqual([...oldBodies].filter(([id,body])=>body!==newBodies.get(id)).map(([id])=>id),[4]);
  assert.equal(newBodies.get(4),source.records[4].sourceBody);
  assert.deepEqual(oldBuild.manifest.departments,newBuild.manifest.departments,'all old catalog numeric IDs remain identical');
  assert.doesNotThrow(()=>planClinicalPublication(current.source,current.inventory),'joint source/journal rollback restores the old version');
  assert.throws(()=>planClinicalPublication(source,current.inventory),/source changed/,'resetting only the revision log cannot publish the edit');
});

test('new records inserted before old arrays get permanent appended IDs, including across later updates',()=>{
  const source=structuredClone(current.source),template=source.records[4];
  const add=label=>({...template,name:template.group+' · '+label,short:label,sourceBody:'合成新增正文 '+label});
  source.records.unshift(add('合成新增 A'));source.renderedBodies.unshift(source.records[0].sourceBody);
  const proposal=proposeClinicalUpdate(source,current.source,current.inventory,{sourceCommit:commit});
  assert.equal(proposal.additions[0].identity.legacyId,current.plan.state.maxId+1);
  const next=applyClinicalUpdate(source,current.source,current.inventory,proposal,authorize(proposal));
  const plan=planClinicalPublication(source,next);
  for(let i=0;i<current.plan.published.length;i++)assert.deepEqual(plan.published[i].identity,current.plan.published[i].identity);
  const again=structuredClone(source);again.records.unshift(add('合成新增 B'));again.renderedBodies.unshift(again.records[0].sourceBody);
  const second=proposeClinicalUpdate(again,source,next,{sourceCommit:commit});
  assert.equal(second.additions[0].identity.legacyId,current.plan.state.maxId+2);
  const final=applyClinicalUpdate(again,source,next,second,authorize(second));
  const reverse={...again,records:[...again.records].reverse(),renderedBodies:[...again.renderedBodies].reverse()};
  assert.deepEqual(planClinicalPublication(reverse,final).published.slice(0,current.plan.published.length+1).map(e=>e.identity),plan.published.map(e=>e.identity));
  assert.equal(deriveClinicalState(final).identities.get('clinical-v1-r'+String(current.plan.state.maxId+1).padStart(6,'0')).name,source.records[0].name);
});

test('exact authorization and full review metadata are required; edited or stale proposals fail',()=>{
  const {source,proposal}=changed();
  for(const approval of [null,{}, {...authorize(proposal),authorizedProposalHash:'0'.repeat(64)}, {...authorize(proposal),reviewReference:''}])
    assert.throws(()=>applyClinicalUpdate(source,current.source,current.inventory,proposal,approval),/authorization/);
  const tampered=structuredClone(proposal);tampered.review[0].sourceBodyDiff='concealed change';
  assert.throws(()=>applyClinicalUpdate(source,current.source,current.inventory,tampered,authorize(tampered)),/stale or edited/);
  const drift=structuredClone(source);drift.records[5].sourceBody+=' further edit';
  assert.throws(()=>applyClinicalUpdate(drift,current.source,current.inventory,proposal,authorize(proposal)),/stale or edited/);
  const next=applyClinicalUpdate(source,current.source,current.inventory,proposal,authorize(proposal));
  assert.throws(()=>applyClinicalUpdate(source,source,next,proposal,authorize(proposal)),/stale or edited/);
});

test('renames, case reassignment, non-body metadata edits, removals and new ambiguous CMS names are blocked',()=>{
  for(const change of [r=>r.name+=' renamed',r=>r.group='another procedure',r=>r.specialCaseKey='another case',r=>r.desc+=' metadata edit']){
    const source=structuredClone(current.source);change(source.records[4]);
    assert.throws(()=>proposeClinicalUpdate(source,current.source,current.inventory,{sourceCommit:commit}),/removed, renamed|only medical body/);
  }
  const missing=structuredClone(current.source);missing.records.shift();missing.renderedBodies.shift();
  assert.throws(()=>proposeClinicalUpdate(missing,current.source,current.inventory,{sourceCommit:commit}),/removed, renamed/);
  const duplicate=structuredClone(current.source),record={...duplicate.records[4],short:'new short'};
  duplicate.records.push(record);duplicate.renderedBodies.push(record.sourceBody);
  assert.throws(()=>proposeClinicalUpdate(duplicate,current.source,current.inventory,{sourceCommit:commit}),/duplicate CMS names/);
  const dropped=structuredClone(current.source);delete dropped.records[4].sourceBody;
  assert.throws(()=>proposeClinicalUpdate(dropped,current.source,current.inventory,{sourceCommit:commit}),/body representation/);
});

test('both special cases and the three same-name TKA records keep their exact ownership and CMS keys',()=>{
  const ids=[5159,5359,5360],{source,next}=changed(5359),updated=next(),plan=planClinicalPublication(source,updated);
  for(const id of ids){
    assert.deepEqual(plan.published[id].identity,current.plan.published[id].identity);
    assert.equal(plan.published[id].record.name,'全膝关节置换 · 出院当天查房记录');
  }
  assert.deepEqual([...plan.state.cases.values()].filter(c=>c.caseType==='special'),current.inventory.baseline.cases.filter(c=>c.caseType==='special'));
  assert.equal(plan.published.filter(e=>e.identity.specialCase).length,44);
  assert.deepEqual(updated.policy,current.inventory.policy);
  assert(!JSON.stringify(updated.revisions).includes('合成测试正文'),'journal stores hashes/review references, never review body copies');
});

test('default generated body changes are individually reviewed even when record objects do not change',()=>{
  const source=structuredClone(current.source),ids=[];
  source.records.forEach((record,index)=>{if(typeof record.sourceBody!=='string'){ids.push(index);source.renderedBodies[index]+='\n合成生成器变更';}});
  const proposal=proposeClinicalUpdate(source,current.source,current.inventory,{sourceCommit:commit});
  assert.equal(ids.length,4);assert.equal(proposal.updates.length,4);
  for(const update of proposal.updates){assert.equal(update.before.recordHash,update.after.recordHash);assert.notEqual(update.before.renderedHash,update.after.renderedHash);}
  const next=applyClinicalUpdate(source,current.source,current.inventory,proposal,authorize(proposal));
  assert.equal(planClinicalPublication(source,next).published.length,current.plan.published.length);
});

test('revision persistence is atomic, detects concurrent writers and leaves original anchors untouched',t=>{
  const location=temp(t);copyInventory(location);
  const originals=['baseline.json','records.jsonl','publication.json'].map(name=>[name,sha256(fs.readFileSync(new URL(name,location)))]);
  const {proposal,next}=changed();
  fs.writeFileSync(new URL('.revision-update.lock',location),'another editor');
  assert.throws(()=>persistClinicalRevision(location,proposal.expectedRevision,next()),/EEXIST/);
  assert.equal(fs.readFileSync(new URL('.revision-update.lock',location),'utf8'),'another editor');
  fs.unlinkSync(new URL('.revision-update.lock',location));
  const invalid=next();invalid.records[0].legacyId=10000;
  assert.throws(()=>persistClinicalRevision(location,proposal.expectedRevision,invalid),/append-only/);
  persistClinicalRevision(location,proposal.expectedRevision,next());
  const bytes=fs.readFileSync(new URL('revisions.json',location));
  assert.throws(()=>persistClinicalRevision(location,proposal.expectedRevision,next()),/ledger changed/);
  assert.deepEqual(fs.readFileSync(new URL('revisions.json',location)),bytes);
  for(const [name,hash]of originals)assert.equal(sha256(fs.readFileSync(new URL(name,location))),hash);
  assert.equal(fs.readdirSync(location).filter(file=>file.startsWith('.')).length,0);
  assert.equal(readInventory(location).revisions.batches.length,current.inventory.revisions.batches.length+1);
});

test('missing or rewritten original ledgers cannot be replaced by a fresh initialization',async t=>{
  const location=temp(t);copyInventory(location);
  fs.appendFileSync(new URL('records.jsonl',location),'\n');
  assert.throws(()=>readInventory(location),/original identity ledger changed/);
  fs.unlinkSync(new URL('baseline.json',location));
  assert.throws(()=>readInventory(location),/never reinitialize/);
  assert.throws(()=>parseClinicalAuditOptions(['--initialize','--source-commit='+commit]),/reinitialization is disabled/);
  await assert.rejects(promisify(execFile)(process.execPath,['scripts/audit-clinical-library.mjs','--initialize','--source-commit='+commit],{cwd:new URL('../',import.meta.url)}),error=>error.code===1);
});

test('CLI preview is local and read-only, includes diff review and never auto-applies',async t=>{
  const location=temp(t),output=new URL('proposal.json',location),before=fs.readFileSync(new URL('../content/clinical-library/revisions.json',import.meta.url));
  await promisify(execFile)(process.execPath,['scripts/audit-clinical-library.mjs','--propose-update','--output='+fileURLToPath(output)],{cwd:new URL('../',import.meta.url),maxBuffer:1024*1024});
  const proposal=JSON.parse(fs.readFileSync(output,'utf8'));
  assert.equal(proposal.updates.length,0);assert.equal(proposal.additions.length,0);assert.deepEqual(proposal.review,[]);
  assert.deepEqual(fs.readFileSync(new URL('../content/clinical-library/revisions.json',import.meta.url)),before);
});
