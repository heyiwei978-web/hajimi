// Since 2026-11-01 the withdrawn (unpublished) cases are deleted from the source
// data; only their permanent IDs remain reserved in the ledger. Older tests that
// compare the library with the retired legacy chain drop those removed records
// from the legacy side first. Relative order is unchanged by the removal, so the
// filtered legacy source still lines up position by position with the current one.
import {identityKey,recordFromIdentity} from '../scripts/clinical-inventory.mjs';

export const removedKeys=plan=>new Set(plan.removed.map(row=>identityKey(recordFromIdentity(row))));

export function withoutRemoved(source,plan){
  const removed=removedKeys(plan),keep=source.records.map(record=>!removed.has(identityKey(record)));
  const pick=list=>list&&list.filter((_,index)=>keep[index]);
  return {...source,records:pick(source.records),renderedBodies:pick(source.renderedBodies),origins:pick(source.origins)};
}
