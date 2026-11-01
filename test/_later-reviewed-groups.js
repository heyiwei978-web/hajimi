// Disease groups whose source JSON received a separately reviewed revision
// (appended to content/clinical-library/revisions.json) AFTER the per-disease
// source migration of 2026-10-30.
//
// The older revision tests (TKA, THA, clavicle, intertrochanteric) compare the
// whole library with the retired legacy chain to prove "nothing else changed".
// A later, independently authorized revision of another disease is not covered
// by those tests' scope, so they skip body comparison for these groups while
// still checking identity and metadata. Each group's own revision is guarded by
// the clinical identity ledger (proposalHash) and the quality gates instead.
//
// Only add a group here together with its reviewed revision batch.
export const LATER_REVIEWED_GROUPS=new Set([
  '肩锁关节脱位',
]);

export const laterReviewed=record=>!record.specialCase&&LATER_REVIEWED_GROUPS.has(record.group);

// Whole new cases added later through `npm run clinical:new` and their own
// reviewed revision batch. The retired legacy chain never contained them, so
// the old snapshot tests leave them out before comparing "nothing else changed".
// Only add a case here together with its reviewed revision batch.
export const LATER_ADDED_CASES=new Set([
  '胫骨平台骨折|complete-20261101',
]);
export const LATER_ADDED_GROUPS=new Set([...LATER_ADDED_CASES].map(key=>key.split('|')[0]));
export const laterAdded=record=>Boolean(record?.completeCaseKey)&&LATER_ADDED_CASES.has(record.group+'|'+record.completeCaseKey);
export function withoutLaterAdded(source){
  const keep=source.records.map((record,index)=>laterAdded(record)?-1:index).filter(index=>index>=0);
  return {...source,records:keep.map(index=>source.records[index]),renderedBodies:keep.map(index=>source.renderedBodies[index])};
}
