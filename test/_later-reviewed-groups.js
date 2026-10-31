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
