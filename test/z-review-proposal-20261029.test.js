import fs from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';
import {loadClinicalSource} from '../scripts/clinical-compiler.mjs';
import {readInventory,deriveClinicalState,identityKey,contentVersion,metadataHash,sha256,canonical,proposalDigest} from '../scripts/clinical-inventory.mjs';

test('generate strictly scoped review proposal for controlled clinical revision',()=>{
  const inventory=readInventory(),state=deriveClinicalState(inventory);
  const source=loadClinicalSource(fs.readFileSync(new URL('../index.html',import.meta.url),'utf8'),{audit:true});
  const selected=new Set(['主治医师首次查房记录','术前小结']);
  const updates=[];
  for(let i=0;i<source.records.length;i++){
    const record=source.records[i];
    if(record.department!=='骨科'||record.group!=='股骨转子间骨折'||!selected.has(record.short))continue;
    const identity=state.keys.get(identityKey(record));
    assert(identity,'original permanent identity not found for '+record.short);
    updates.push({recordId:identity.recordId,before:state.versions.get(identity.recordId),
      after:contentVersion(record,source.renderedBodies[i]),metadataHash:metadataHash(record)});
  }
  assert.equal(updates.length,2);
  assert(updates.every(x=>x.before.recordHash!==x.after.recordHash));
  updates.sort((a,b)=>a.recordId.localeCompare(b.recordId));
  const reviewNotes='2026-10-29 request: add hidden blood loss / conditional transfusion assessment to preop attending round, and cefazolin implant prophylaxis to preop summary, fictional teaching case; never infer actual transfusion or antibiotic administration';
  const payload={schemaVersion:1,baselineCommit:inventory.baseline.sourceCommit,
    expectedRevision:state.revision,
    sourceCommit:'f3f25455b2a2d23bb1137cf83952440c78eb3abe',
    sourceSnapshotHash:sha256(canonical(source.sourceFiles)),
    updates,additions:[],reviewHash:sha256(reviewNotes)};
  const proposalHash=proposalDigest(payload);
  const batch={...payload,proposalHash,approval:{authorizedProposalHash:proposalHash,
    reviewedBy:'ChatGPT：限范围编辑与医学措辞一致性核对，非临床签字认证',
    reason:'User-requested fictional intertrochanteric preop note refinement without changing diagnosis, dates, operation, or other records',
    reviewReference:'User 2026-10-28 instructions; User 2026-10-29 处理吧; PR #40'}};
  console.log('BEGIN_CLINICAL_REVIEW_BATCH'+JSON.stringify(batch)+'END_CLINICAL_REVIEW_BATCH');
});
