import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {loadClinicalSource} from '../scripts/clinical-compiler.mjs';
import {auditClinicalRecords,BASELINE,TKA_REQUIRED} from '../scripts/clinical-audit-rules.mjs';

const example = (short,sourceBody,more={}) => ({
  department:'骨科',group:'TKA',stage:'术后',short,sourceBody,...more
});
const relaxed = {baseline:{total:0,orthopedics:0,tkaStandard:0,tkaSpecialCases:0},required:[]};
const codes = (result) => result.findings.map(item => item.code);

test('read-only audit preserves its input and never includes clinical source prose in results',()=>{
  const rows=[example('手术记录','手术经过：\n如有异常，应调整方案。患者姓名张某某')];
  const before=JSON.stringify(rows);
  const result=auditClinicalRecords(rows,relaxed);
  assert.equal(JSON.stringify(rows),before);
  assert(codes(result).includes('PROCEDURE_HAS_CONTINGENCY'));
  assert(!JSON.stringify(result).includes('张某某'));
  assert(!JSON.stringify(result).includes('患者姓名'));
});

test('detects duplicate or missing TKA records and protected special cases',()=>{
  const result=auditClinicalRecords(
    [example('入院记录','病史'),example('入院记录','再次病史')],
    {baseline:{total:3,orthopedics:3,tkaStandard:3,tkaSpecialCases:1},required:['术前小结']}
  );
  for(const code of ['LIBRARY_SHRINK','ORTHO_SHRINK','TKA_STANDARD_SHRINK',
    'TKA_SPECIAL_LOSS','TKA_DUPLICATE_DOCUMENT','TKA_REQUIRED_MISSING']) {
    assert(codes(result).includes(code),code);
  }
});

test('detects contradicting postoperative day, drain sequence and ambiguous expressions',()=>{
  const result=auditClinicalRecords([
    example('术后第1天病程','手术日期：2026-10-10\n记录时间：2026-10-12\n引流/拔管过程平稳。'),
    example('术后第3天病程','今日拔除引流管。'),
    example('术后第5天病程','切口良好，继续留置引流管观察。')
  ],relaxed);
  assert(codes(result).includes('POD_DATE_CONFLICT'));
  assert(codes(result).includes('AMBIGUOUS_DRAIN_STATE'));
  assert(codes(result).includes('DRAIN_AFTER_REMOVAL'));
});

test('does not infer removal from a hypothetical operation or plan',()=>{
  const result=auditClinicalRecords([
    example('术后第1天病程','必要时可考虑拔除引流管。'),
    example('术后第2天病程','引流管固定通畅，继续留置引流管观察。')
  ],relaxed);
  assert(!codes(result).includes('DRAIN_AFTER_REMOVAL'));
});

test('audits original site records without changing the baseline library',()=>{
  const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const records=loadClinicalSource(html).records;
  const originalLength=records.length;
  const result=auditClinicalRecords(records);
  assert.equal(records.length,originalLength);
  assert(records.length>=BASELINE.total);
  assert(result.orthopedics>=BASELINE.orthopedics);
  assert(result.tkaStandard>=BASELINE.tkaStandard);
  assert(result.tkaSpecialCases>=BASELINE.tkaSpecialCases);
  for(const name of TKA_REQUIRED) assert(records.some(r=>
    r.group==='TKA' && r.department==='骨科' && !r.specialCase &&
    r.short===name && String(r.sourceBody||'').trim()),name);
  assert.equal(result.counts.error,0,JSON.stringify(result.findings.filter(x=>x.severity==='error'),null,2));
  assert(result.counts.review>0,'existing TKA quality issues must remain visible for review');
});
