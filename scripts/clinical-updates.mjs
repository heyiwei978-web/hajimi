import fs from 'node:fs';
import {randomUUID} from 'node:crypto';
import {canonical,caseKey,contentVersion,deriveClinicalState,emptyRevisions,fail,identityKey,metadataHash,
  planClinicalPublication,proposalDigest,readInventory,recordFromIdentity,recordId,sha256,special,stableCaseId,utility} from './clinical-inventory.mjs';

// Review text is local to the proposal, never copied into the version journal.
function diff(before,after){
  if(before===after)return '';
  const a=String(before).split('\n'),b=String(after).split('\n');
  let start=0,end=0;
  while(start<a.length&&start<b.length&&a[start]===b[start])start++;
  while(end<a.length-start&&end<b.length-start&&a[a.length-1-end]===b[b.length-1-end])end++;
  const context=Math.max(0,start-3),tail=Math.min(end,3);
  return ['--- approved','+++ proposed',`@@ -${context+1},${a.length-end+tail-context} +${context+1},${b.length-end+tail-context} @@`,
    ...a.slice(context,start).map(line=>' '+line),...a.slice(start,a.length-end).map(line=>'-'+line),
    ...b.slice(start,b.length-end).map(line=>'+'+line),...a.slice(a.length-end,a.length-end+tail).map(line=>' '+line)].join('\n');
}
function snapshot(source){
  if(!source.renderedBodies||source.renderedBodies.length!==source.records.length)fail('capture rendered bodies before reviewing updates');
  return sha256(canonical({files:source.sourceFiles||[],records:source.records.map((record,index)=>({key:identityKey(record),...contentVersion(record,source.renderedBodies[index])}))
    .sort((a,b)=>a.key.localeCompare(b.key,'en'))}));
}

export function proposeClinicalUpdate(source,previousSource,inventory,{sourceCommit}={}){
  if(!/^[a-f0-9]{40}$/.test(sourceCommit))fail('provide the full reviewed previous source commit');
  // The supplied old source must actually represent the currently approved
  // version, not merely be a convenient Git ref with a similar title.
  const previous=planClinicalPublication(previousSource,inventory),state=previous.state;
  const before=new Map(previousSource.records.map((record,index)=>[identityKey(record),{record,rendered:previousSource.renderedBodies[index]}]));
  const seen=new Set(),updates=[],additions=[],review=[],newRecords=[];
  snapshot(source);
  for(let index=0;index<source.records.length;index++){
    const record=source.records[index],key=identityKey(record),row=state.keys.get(key),rendered=source.renderedBodies[index];
    if(seen.has(key))fail('duplicate proposed identity');
    seen.add(key);
    if(!row){newRecords.push({record,key,rendered,index});continue;}
    const old=before.get(key),version=state.versions.get(row.recordId),next=contentVersion(record,rendered);
    if(metadataHash(old.record)!==metadataHash(record))fail('only medical body updates are supported; metadata/ownership needs a separate migration: '+row.recordId);
    if(next.bodyKind!==version.bodyKind)fail('changing fixed/generated body representation needs a separate migration');
    if(canonical(version)!==canonical(next)){
      updates.push({recordId:row.recordId,before:version,after:next,metadataHash:metadataHash(record)});
      review.push({recordId:row.recordId,sourceBodyDiff:diff(old.record.sourceBody??'',record.sourceBody??''),renderedDiff:diff(old.rendered,rendered)});
    }
  }
  for(const key of state.keys.keys())if(!seen.has(key))fail('an existing identity was removed, renamed or reassigned; no automatic remapping');
  const names=new Set([...state.identities.values()].map(row=>row.name));
  let nextId=state.maxId+1;
  for(const {record,key,rendered,index}of newRecords.sort((a,b)=>a.key.localeCompare(b.key,'en'))){
    if(names.has(record.name))fail('new duplicate CMS names need a separate reviewed migration');
    names.add(record.name);
    if(!['骨科','普外科','肾内科','妇科'].includes(record.department)||['name','short','group','stage','type'].some(field=>typeof record[field]!=='string'||!record[field].trim())
      ||special(record)&&!record.specialCaseKey||typeof record.sourceBody!=='string'||!record.sourceBody)fail('new records require explicit supported identity, case ownership and fixed body');
    const isUtility=utility(record),parent=[...state.identities.values()].find(row=>caseKey(record)===caseKey(recordFromIdentity(row)));
    const caseType=isUtility?'utility':special(record)?'special':'standard';
    const identity={recordId:recordId(nextId),legacyId:nextId++,department:record.department,group:record.group,caseType,
      caseId:isUtility?null:parent?.caseId||stableCaseId(caseKey(record)),sourceCaseKey:isUtility?null:special(record)?record.specialCaseKey:record.completeCaseKey||'standard',
      stage:record.stage,recordType:record.type,name:record.name,short:record.short,specialCase:special(record),introducedBy:source.origins?.[index]||null,
      cmsOverrideExists:null,cmsCaseExists:null,cmsRisk:'production-not-audited',recommendation:'retain',status:'published',reason:'reviewed-new-record'};
    additions.push({identity,content:contentVersion(record,rendered)});
    review.push({recordId:identity.recordId,sourceBodyDiff:diff('',record.sourceBody),renderedDiff:diff('',rendered)});
  }
  updates.sort((a,b)=>a.recordId.localeCompare(b.recordId));review.sort((a,b)=>a.recordId.localeCompare(b.recordId));
  const payload={schemaVersion:1,baselineCommit:inventory.baseline.sourceCommit,expectedRevision:state.revision,sourceCommit,
    sourceSnapshotHash:snapshot(source),updates,additions,reviewHash:sha256(canonical(review))};
  return {...payload,review,proposalHash:proposalDigest(payload)};
}
export function applyClinicalUpdate(source,previousSource,inventory,proposal,approval){
  const expected=proposeClinicalUpdate(source,previousSource,inventory,{sourceCommit:proposal.sourceCommit});
  if(canonical(expected)!==canonical(proposal))fail('stale or edited proposal; generate and review it again');
  if(!approval||approval.authorizedProposalHash!==proposal.proposalHash
    ||['reviewedBy','reason','reviewReference'].some(key=>typeof approval[key]!=='string'||!approval[key].trim()))fail('explicit proposal hash authorization, reviewer, reason and review reference are required');
  if(!proposal.updates.length&&!proposal.additions.length)fail('no content changes to authorize');
  const {review,...payload}=proposal;
  const next=structuredClone(inventory);
  next.revisions||=emptyRevisions(inventory.baseline);
  next.revisions.batches.push({...payload,approval:{authorizedProposalHash:approval.authorizedProposalHash,
    reviewedBy:approval.reviewedBy,reason:approval.reason,reviewReference:approval.reviewReference}});
  // All validation, including the independent archive/CMS gate, precedes writes.
  planClinicalPublication(source,next);
  return next;
}

// One atomic file replaces a multi-file ledger rewrite. An exclusive lock and a
// second on-disk revision check prevent two cooperative editors losing updates.
export function persistClinicalRevision(location,expectedRevision,next){
  const target=new URL('revisions.json',location),lock=new URL('.revision-update.lock',location);
  const temporary=new URL('.revision-'+randomUUID()+'.tmp',location);
  let descriptor;
  try{
    descriptor=fs.openSync(lock,'wx',0o600);
    const current=readInventory(location);
    if(deriveClinicalState(current).revision!==expectedRevision)fail('ledger changed while review was pending');
    if(canonical(current.baseline)!==canonical(next.baseline)||canonical(current.records)!==canonical(next.records)
      ||canonical(current.policy)!==canonical(next.policy)||next.revisions.batches.length!==current.revisions.batches.length+1
      ||canonical(next.revisions.batches.slice(0,-1))!==canonical(current.revisions.batches))fail('only one append-only revision may be persisted');
    deriveClinicalState(next);
    fs.writeFileSync(temporary,JSON.stringify(next.revisions,null,2)+'\n',{flag:'wx',mode:0o600});
    const file=fs.openSync(temporary,'r+');try{fs.fsyncSync(file);}finally{fs.closeSync(file);}
    fs.renameSync(temporary,target);
  }finally{
    if(fs.existsSync(temporary))fs.unlinkSync(temporary);
    if(descriptor!==undefined){fs.closeSync(descriptor);fs.unlinkSync(lock);}
  }
}
