import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {CLINICAL_BASELINE_COMMIT,CLINICAL_BASELINE_HASHES} from './clinical-baseline.mjs';

const directory=new URL('../content/clinical-library/',import.meta.url);
export const sha256=value=>createHash('sha256').update(value).digest('hex');
export const recordId=id=>'clinical-v1-r'+String(id).padStart(6,'0');
export const stableCaseId=key=>'clinical-v1-c'+sha256(key).slice(0,20);
export const special=record=>record.specialCase===true||!!record.specialCaseKey;
export const utility=record=>record.group==='通用场景'&&!special(record);
export const caseKey=record=>JSON.stringify([record.department,record.group,
  special(record)?'special':'standard',special(record)?record.specialCaseKey:record.completeCaseKey||'standard']);
export const identityKey=record=>JSON.stringify([caseKey(record),record.name,record.short,record.stage,record.type]);
export const fail=message=>{throw new Error('Clinical publication blocked: '+message);};
export const canonical=value=>JSON.stringify(value,(_,item)=>item&&typeof item==='object'&&!Array.isArray(item)
  ?Object.fromEntries(Object.keys(item).sort().map(key=>[key,item[key]])):item);
export const contentVersion=(record,rendered)=>({bodyKind:typeof record.sourceBody==='string'?'sourceBody':'generated-default',
  bodyHash:sha256(typeof record.sourceBody==='string'?record.sourceBody:rendered),renderedHash:sha256(rendered),recordHash:sha256(JSON.stringify(record))});
export const metadataHash=record=>{const {sourceBody,...metadata}=record;return sha256(JSON.stringify(metadata));};
const versionFields=['bodyKind','bodyHash','renderedHash','recordHash'];
const versionOf=row=>Object.fromEntries(versionFields.map(key=>[key,row[key]]));
export const recordFromIdentity=row=>({...row,type:row.recordType,
  specialCaseKey:row.caseType==='special'?row.sourceCaseKey:undefined,completeCaseKey:row.caseType==='standard'?row.sourceCaseKey:undefined});
export const emptyRevisions=baseline=>({schemaVersion:1,baselineCommit:baseline.sourceCommit,batches:[]});
export const proposalDigest=payload=>sha256(canonical(payload));
const revisionFor=(anchor,journal)=>sha256(canonical({anchor,journal}));
const hashPattern=/^[a-f0-9]{64}$/;
const validVersion=value=>value&&['sourceBody','generated-default'].includes(value.bodyKind)&&['bodyHash','renderedHash','recordHash'].every(key=>hashPattern.test(value[key]));

// This ledger describes complete cases first, then their individual documents.
// Dates, repeated record types and similar titles never establish duplication.
export function createInventory(source,sourceCommit){
  if(!/^[a-f0-9]{40}$/.test(sourceCommit))fail('a full source commit is required');
  if(!source.renderedBodies||source.renderedBodies.length!==source.records.length)fail('capture rendered bodies before creating the baseline');
  const names=new Map(),cases=new Map(),identities=new Set();
  for(const record of source.records){
    names.set(record.name,(names.get(record.name)||0)+1);
    if(special(record)&&!record.specialCaseKey)fail('a special case has no explicit case key');
    if(utility(record))continue;
    const key=caseKey(record);
    if(!cases.has(key))cases.set(key,{caseId:stableCaseId(key),department:record.department,group:record.group,
      caseType:special(record)?'special':'standard',sourceCaseKey:special(record)?record.specialCaseKey:record.completeCaseKey||'standard',
      status:'published',recordIds:[],stages:[],recordTypes:[],reason:special(record)?'preserve-entire-special-case':'only-established-standard-case'});
  }
  const records=source.records.map((record,legacyId)=>{
    const key=identityKey(record);
    if(identities.has(key))fail('documents need explicit case ownership before assigning identities: '+record.name);
    identities.add(key);
    const parent=utility(record)?null:cases.get(caseKey(record));
    const id=recordId(legacyId),isSpecial=special(record);
    if(parent){
      parent.recordIds.push(id);
      if(!parent.stages.includes(record.stage))parent.stages.push(record.stage);
      if(!parent.recordTypes.includes(record.type))parent.recordTypes.push(record.type);
    }
    return {recordId:id,legacyId,department:record.department,group:record.group,
      caseType:parent?.caseType||'utility',caseId:parent?.caseId||null,
      sourceCaseKey:parent?.sourceCaseKey||null,stage:record.stage,recordType:record.type,
      name:record.name,short:record.short,specialCase:isSpecial,
      bodyKind:typeof record.sourceBody==='string'?'sourceBody':'generated-default',
      bodyHash:sha256(typeof record.sourceBody==='string'?record.sourceBody:source.renderedBodies[legacyId]),
      renderedHash:sha256(source.renderedBodies[legacyId]),
      recordHash:sha256(JSON.stringify(record)),introducedBy:source.origins?.[legacyId]||null,
      cmsOverrideExists:null,cmsCaseExists:null,
      cmsRisk:names.get(record.name)>1?'ambiguous-legacy-name':'production-not-audited',
      recommendation:'retain',status:'published',
      reason:isSpecial?'preserve-entire-special-case':parent?'only-established-standard-case':'independent-utility-record'};
  });
  const list=Array.from(cases.values());
  const baseline={schemaVersion:1,sourceCommit,identityNamespace:'clinical-v1',
    sourceFiles:source.sourceFiles,qualityAudit:source.qualityAudit?.stats||null,
    summary:{records:records.length,projectGroups:new Set(records.map(r=>r.department+'\0'+r.group)).size,
      diseaseOrProcedureGroups:new Set(records.filter(r=>r.caseType!=='utility').map(r=>r.department+'\0'+r.group)).size,
      standardCases:list.filter(c=>c.caseType==='standard').length,
      standardRecords:records.filter(r=>r.caseType==='standard').length,
      specialCases:list.filter(c=>c.caseType==='special').length,
      specialRecords:records.filter(r=>r.specialCase).length,utilityRecords:records.filter(r=>r.caseType==='utility').length,
      archivedRecords:0},
    ambiguousNames:Array.from(names).filter(([,count])=>count>1).map(([name])=>({name,recordIds:records.filter(r=>r.name===name).map(r=>r.recordId)})),
    cases:list};
  return {baseline,records};
}

export function readInventory(location=directory){
  const original={};
  for(const [file,digest]of Object.entries(CLINICAL_BASELINE_HASHES)){
    let text;try{text=fs.readFileSync(new URL(file,location),'utf8');}catch{fail('missing original identity ledger; restore '+file+' from Git, never reinitialize');}
    if(sha256(text)!==digest)fail('original identity ledger changed: '+file+'; restore from Git');
    original[file]=text;
  }
  const baseline=JSON.parse(original['baseline.json']);
  if(baseline.sourceCommit!==CLINICAL_BASELINE_COMMIT)fail('original baseline commit changed');
  return {baseline,records:original['records.jsonl'].trim().split('\n').map(line=>JSON.parse(line)),
    policy:JSON.parse(fs.readFileSync(new URL('publication.json',location),'utf8')),
    revisions:JSON.parse(fs.readFileSync(new URL('revisions.json',location),'utf8'))};
}

// Replay append-only, reviewed content versions and newly allocated identities.
// Original ledger rows and original case membership lists are never rewritten.
export function deriveClinicalState(inventory){
  const {baseline,records:ledger,policy}=inventory,journal=inventory.revisions||emptyRevisions(baseline);
  if(baseline.schemaVersion!==1||policy.schemaVersion!==1||policy.baselineCommit!==baseline.sourceCommit
    ||journal.schemaVersion!==1||journal.baselineCommit!==baseline.sourceCommit||!Array.isArray(journal.batches))fail('unsupported or mismatched inventory');
  const identities=new Map(),versions=new Map(),keys=new Map(),numbers=new Set();
  const cases=new Map(structuredClone(baseline.cases).map(item=>[item.caseId,item]));
  let maxId=-1;
  const addIdentity=(row,version)=>{
    if(!Number.isSafeInteger(row.legacyId)||row.legacyId<0||row.recordId!==recordId(row.legacyId)||numbers.has(row.legacyId)||identities.has(row.recordId))fail('duplicate or invalid identity ledger');
    const key=identityKey(recordFromIdentity(row));
    if(keys.has(key)||!validVersion(version))fail('ambiguous record identity or invalid content version');
    identities.set(row.recordId,row);versions.set(row.recordId,version);keys.set(key,row);
    numbers.add(row.legacyId);maxId=Math.max(maxId,row.legacyId);
  };
  for(const original of ledger){
    const row={...original};for(const key of versionFields)delete row[key];
    addIdentity(row,versionOf(original));
  }
  for(const row of identities.values())if(row.caseId&&!cases.get(row.caseId)?.recordIds.includes(row.recordId))fail('original case ownership changed');
  const anchor=sha256(canonical({baseline,records:ledger})),prefix=emptyRevisions(baseline);
  for(const batch of journal.batches){
    const {proposalHash,approval,...payload}=batch;
    if(payload.schemaVersion!==1||payload.baselineCommit!==baseline.sourceCommit||payload.expectedRevision!==revisionFor(anchor,prefix)
      ||proposalHash!==proposalDigest(payload)||!approval||approval.authorizedProposalHash!==proposalHash
      ||['reviewedBy','reason','reviewReference'].some(key=>typeof approval[key]!=='string'||!approval[key].trim())
      ||!hashPattern.test(payload.reviewHash)||!hashPattern.test(payload.sourceSnapshotHash)||!/^[a-f0-9]{40}$/.test(payload.sourceCommit)
      ||!Array.isArray(payload.updates)||!Array.isArray(payload.additions)||!(payload.updates.length+payload.additions.length))fail('invalid or unreviewed content revision');
    const changed=new Set();
    for(const update of payload.updates){
      if(changed.has(update.recordId)||!identities.has(update.recordId)||canonical(versions.get(update.recordId))!==canonical(update.before)
        ||!validVersion(update.after)||!hashPattern.test(update.metadataHash))fail('stale or invalid content revision');
      changed.add(update.recordId);versions.set(update.recordId,update.after);
    }
    for(const addition of payload.additions){
      const {identity:row,content}=addition;
      if(!row||row.legacyId!==maxId+1||row.caseType==='special'&&!row.sourceCaseKey)fail('new identities must append permanent IDs');
      if([...identities.values()].some(old=>old.name===row.name))fail('new duplicate CMS names need a separate reviewed migration');
      const key=caseKey(recordFromIdentity(row));
      const parent=[...cases.values()].find(item=>caseKey({department:item.department,group:item.group,
        specialCaseKey:item.caseType==='special'?item.sourceCaseKey:undefined,completeCaseKey:item.caseType==='standard'?item.sourceCaseKey:undefined})===key);
      if(row.caseType==='utility'){
        if(row.caseId!==null)fail('utility record cannot change case ownership');
      }else{
        if(row.caseId!==(parent?.caseId||stableCaseId(key)))fail('new record case ownership changed');
        if(!parent)cases.set(row.caseId,{caseId:row.caseId,department:row.department,group:row.group,caseType:row.caseType,sourceCaseKey:row.sourceCaseKey,
          status:'published',recordIds:[],stages:[],recordTypes:[],reason:'reviewed-new-case'});
        const item=cases.get(row.caseId);item.recordIds.push(row.recordId);
        if(!item.stages.includes(row.stage))item.stages.push(row.stage);
        if(!item.recordTypes.includes(row.recordType))item.recordTypes.push(row.recordType);
      }
      addIdentity(row,content);
    }
    prefix.batches.push(batch);
  }
  return {identities,versions,keys,cases,maxId,revision:revisionFor(anchor,journal)};
}

// The original numeric ID is a value in a committed ledger, never today's array
// position. Reordering generated objects cannot rebind bodies, links or CMS names.
export function planClinicalPublication(source,inventory=readInventory(),{cmsAudit=null}={}){
  const {baseline,policy}=inventory;
  const state=deriveClinicalState(inventory);
  if(state.identities.size!==source.records.length)fail('record count changed; review the identity ledger before publishing');
  if(!source.renderedBodies||source.renderedBodies.length!==source.records.length)fail('capture rendered medical text before publishing');
  const entries=source.records.map((record,index)=>{
    const row=state.keys.get(identityKey(record)),version=row&&state.versions.get(row.recordId),actual=contentVersion(record,source.renderedBodies[index]);
    if(!row||actual.recordHash!==version.recordHash)fail('source changed for '+record.name+'; propose and authorize a content revision');
    if(actual.renderedHash!==version.renderedHash)fail('rendered medical text changed for '+record.name);
    if(actual.bodyHash!==version.bodyHash||actual.bodyKind!==version.bodyKind)fail('medical body hash changed for '+record.name);
    return {record,identity:row,content:version};
  });
  const seen=new Set(entries.map(entry=>entry.identity.recordId));
  if(seen.size!==state.identities.size)fail('the generated source omits or repeats an identity');
  const {cases}=state;
  const decisions=policy.decisions;
  if(!Array.isArray(decisions))fail('publication decisions must be an array');
  const archived=new Set(),replacements=new Map();
  for(const decision of decisions){
    const item=cases.get(decision.caseId),replacement=cases.get(decision.replacementCaseId);
    if(decision.status!=='archived'||!item||item.caseType!=='standard'||!replacement||replacement.caseType!=='standard'
      ||item.caseId===replacement.caseId||item.department!==replacement.department||item.group!==replacement.group
      ||typeof decision.reason!=='string'||!decision.reason.trim()||typeof decision.reviewedBy!=='string'||!decision.reviewedBy.trim())fail('archive only a reviewed duplicate complete standard case with an explicit retained replacement');
    if(replacements.has(item.caseId))fail('duplicate archive decision');
    replacements.set(item.caseId,replacement.caseId);
    for(const id of item.recordIds)archived.add(id);
  }
  for(const replacement of replacements.values())if(replacements.has(replacement))fail('an archive replacement must remain published');
  if(archived.size){
    // The normal build supplies no production audit: filtering stays blocked.
    // A future controlled release must provide a separately verified, revision-
    // bound CMS mapping, not an environment-variable bypass or a UI-only filter.
    if(!cmsAudit||cmsAudit.baselineCommit!==baseline.sourceCommit||typeof cmsAudit.revision!=='string'||!cmsAudit.revision
      ||!Array.isArray(cmsAudit.safeToArchiveRecordIds)||[...archived].some(id=>!cmsAudit.safeToArchiveRecordIds.includes(id)))fail('production CMS overrides/cases have not been verified; keep all records published');
    for(const row of state.identities.values())if(archived.has(row.recordId)&&row.cmsRisk==='ambiguous-legacy-name')fail('ambiguous legacy CMS names require a separate approved migration');
  }
  // Explicit owner-requested withdrawals remove whole cases from public output.
  // This does not archive duplicates, rebind IDs/CMS names, or delete stored data;
  // the original ledger and source remain intact and can be republished.
  const withdrawals=policy.withdrawals??[],withdrawn=new Set(),withdrawnCases=new Set();
  if(!Array.isArray(withdrawals))fail('withdrawals must be an array');
  for(const decision of withdrawals){
    const item=cases.get(decision.caseId);
    if(decision.status!=='withdrawn'||!item||item.caseType!=='standard'
      ||decision.department!==item.department||decision.group!==item.group
      ||['reason','authorizedBy','authorizationReference'].some(key=>typeof decision[key]!=='string'||!decision[key].trim()))
      fail('withdraw only an explicitly authorized complete standard case');
    const ids=decision.recordIds;
    if(!Array.isArray(ids)||new Set(ids).size!==ids.length||ids.length!==item.recordIds.length
      ||ids.some(id=>!item.recordIds.includes(id)))fail('withdrawal must name every current document of the complete case');
    if(withdrawnCases.has(item.caseId)||ids.some(id=>archived.has(id))||[...replacements.values()].includes(item.caseId))
      fail('duplicate or conflicting case withdrawal');
    withdrawnCases.add(item.caseId);
    for(const id of ids)withdrawn.add(id);
  }
  const published=entries.filter(entry=>!archived.has(entry.identity.recordId)&&!withdrawn.has(entry.identity.recordId))
    .sort((a,b)=>a.identity.legacyId-b.identity.legacyId);
  return {baseline,state,published,archived:entries.filter(entry=>archived.has(entry.identity.recordId)),
    withdrawn:entries.filter(entry=>withdrawn.has(entry.identity.recordId)),replacements};
}
