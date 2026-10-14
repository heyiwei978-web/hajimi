import fs from 'node:fs';
import {createHash} from 'node:crypto';

const directory=new URL('../content/clinical-library/',import.meta.url);
export const sha256=value=>createHash('sha256').update(value).digest('hex');
export const recordId=id=>'clinical-v1-r'+String(id).padStart(6,'0');
const stableCaseId=key=>'clinical-v1-c'+sha256(key).slice(0,20);
const special=record=>record.specialCase===true||!!record.specialCaseKey;
const utility=record=>record.group==='通用场景'&&!special(record);
export const caseKey=record=>JSON.stringify([record.department,record.group,
  special(record)?'special':'standard',special(record)?record.specialCaseKey:record.completeCaseKey||'standard']);
export const identityKey=record=>JSON.stringify([caseKey(record),record.name,record.short,record.stage,record.type]);
const fail=message=>{throw new Error('Clinical publication blocked: '+message);};

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

export function readInventory(){
  return {baseline:JSON.parse(fs.readFileSync(new URL('baseline.json',directory),'utf8')),
    records:fs.readFileSync(new URL('records.jsonl',directory),'utf8').trim().split('\n').map(line=>JSON.parse(line)),
    policy:JSON.parse(fs.readFileSync(new URL('publication.json',directory),'utf8'))};
}

// The original numeric ID is a value in a committed ledger, never today's array
// position. Reordering generated objects cannot rebind bodies, links or CMS names.
export function planClinicalPublication(source,inventory=readInventory(),{cmsAudit=null}={}){
  const {baseline,records:ledger,policy}=inventory;
  if(baseline.schemaVersion!==1||policy.schemaVersion!==1||policy.baselineCommit!==baseline.sourceCommit)fail('unsupported or mismatched inventory');
  if(ledger.length!==source.records.length)fail('record count changed; review the identity ledger before publishing');
  const byIdentity=new Map(),legacyIds=new Set(),stableIds=new Set();
  for(const row of ledger){
    if(!Number.isSafeInteger(row.legacyId)||row.legacyId<0||row.recordId!==recordId(row.legacyId)||legacyIds.has(row.legacyId)||stableIds.has(row.recordId))fail('duplicate or invalid identity ledger');
    legacyIds.add(row.legacyId);stableIds.add(row.recordId);
    const record={...row,type:row.recordType,specialCaseKey:row.caseType==='special'?row.sourceCaseKey:undefined,
      completeCaseKey:row.caseType==='standard'?row.sourceCaseKey:undefined};
    const key=identityKey(record);
    if(byIdentity.has(key))fail('ambiguous record identity');
    byIdentity.set(key,row);
  }
  const entries=source.records.map((record,index)=>{
    const row=byIdentity.get(identityKey(record));
    if(!row||sha256(JSON.stringify(record))!==row.recordHash)fail('source changed for '+record.name+'; no automatic identity or medical-text rewrite');
    if(source.renderedBodies&&sha256(source.renderedBodies[index])!==row.renderedHash)fail('rendered medical text changed for '+record.name);
    return {record,identity:row};
  });
  const seen=new Set(entries.map(entry=>entry.identity.recordId));
  if(seen.size!==ledger.length)fail('the generated source omits or repeats an identity');
  const cases=new Map(baseline.cases.map(item=>[item.caseId,item]));
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
    for(const row of ledger)if(archived.has(row.recordId)&&row.cmsRisk==='ambiguous-legacy-name')fail('ambiguous legacy CMS names require a separate approved migration');
  }
  const published=entries.filter(entry=>!archived.has(entry.identity.recordId)).sort((a,b)=>a.identity.legacyId-b.identity.legacyId);
  return {baseline,published,archived:entries.filter(entry=>archived.has(entry.identity.recordId)),replacements};
}
