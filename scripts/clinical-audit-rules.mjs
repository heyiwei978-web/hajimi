// Read-only quality checks. Never mutate a template or export patient-level prose.
// The baseline thresholds protect the October 2026 library from accidental loss.
export const BASELINE = Object.freeze({
  total: 5361,
  orthopedics: 5334,
  tkaStandard: 28,
  tkaSpecialCases: 2
});

export const TKA_REQUIRED = Object.freeze([
  '入院记录', '首次病程记录', '主治医师首次查房记录',
  '主任医师首次查房记录', '术前主刀查房', '多学科术前讨论',
  '术前小结', '手术记录', '术后首次病程记录',
  '术后第1天病程', '术后第2天病程', '术后第3天病程',
  '康复评估与训练记录', '出院当天查房记录', '出院小结'
]);

const shortName = (record) => String(record?.short || '');
const textBody = (record) => typeof record?.sourceBody === 'string' ? record.sourceBody : '';
const isTka = (record) => record?.department === '骨科' && record?.group === 'TKA';
const byStage = (record) => {
  const match = /^术后第(\d+)天病程/.exec(shortName(record));
  return match ? Number(match[1]) : null;
};

// Dates are only compared when written as explicit YYYY-MM-DD values.
function toUtcDay(value) {
  const m = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const time = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const date = new Date(time);
  return date.toISOString().slice(0, 10) === value ? time : null;
}
function datedField(body, field) {
  const m = new RegExp('(?:^|\\n)' + field + '[：:]\\s*(\\d{4}-\\d{2}-\\d{2})').exec(body);
  return m?.[1] || null;
}

export function auditClinicalRecords(records, settings = {}) {
  if (!Array.isArray(records)) throw new TypeError('records must be an array');
  const baseline = { ...BASELINE, ...(settings.baseline || {}) };
  const required = settings.required || TKA_REQUIRED;
  const findings = [];
  const add = (severity, code, record, detail) => {
    findings.push({
      severity, code,
      group: record?.group || '全库',
      document: shortName(record) || '整体结构',
      detail // Deliberately no patient fields or sourceBody excerpts
    });
  };
  const orthopedic = records.filter(r => r.department === '骨科');
  const tka = orthopedic.filter(isTka);
  const normal = tka.filter(r => !r.specialCase);
  const special = tka.filter(r => r.specialCase);
  const specialKeys = [...new Set(special.map(r => r.specialCaseKey).filter(Boolean))].sort();

  if (records.length < baseline.total) add('error', 'LIBRARY_SHRINK', null, '模板总数低于受保护的基线 ' + baseline.total);
  if (orthopedic.length < baseline.orthopedics) add('error', 'ORTHO_SHRINK', null, '骨科模板少于受保护的基线 ' + baseline.orthopedics);
  if (normal.length < baseline.tkaStandard) add('error', 'TKA_STANDARD_SHRINK', {group:'TKA'}, 'TKA标准章节少于 ' + baseline.tkaStandard);
  if (specialKeys.length < baseline.tkaSpecialCases) add('error', 'TKA_SPECIAL_LOSS', {group:'TKA'}, 'TKA独立特殊病例少于 ' + baseline.tkaSpecialCases);
  for (const name of required) {
    if (!normal.some(r => shortName(r) === name && textBody(r).trim())) {
      add('error', 'TKA_REQUIRED_MISSING', {group:'TKA',short:name}, '标准病历必需章节缺失或正文为空');
    }
  }

  const seen = new Set();
  for (const record of normal) {
    const key = shortName(record);
    if (seen.has(key)) add('error', 'TKA_DUPLICATE_DOCUMENT', record, '同一标准病历出现重复文书名称');
    seen.add(key);
    const body = textBody(record);
    if (!body.trim()) add('error', 'TKA_EMPTY_BODY', record, '文书正文为空');

    if (/须结合患者病史、专科查体及已完成的辅助检查动态评价病情/.test(body)) {
      add('review', 'GENERIC_CONCLUSION', record, '上级医师意见含通用套话，需判断是否替代了实际诊疗决策');
    }
    if (/手术日期[：:][^\n]{0,100}：[^\n]{0,40}/.test(body) && /出院当天查房/.test(key)) {
      add('review', 'POSSIBLE_JOINED_FIELD', record, '手术日期字段附近可能存在段落拼接异常');
    }
    if (key === '手术记录') {
      if (/【[^】]*(?:待核实|据实填写|根据实际|实际手术)[^】]*】/.test(body)) {
        add('review', 'OPERATIVE_FACTS_UNCONFIRMED', record, '手术记录包含待核实字段，须按实际术中资料补全');
      }
      const operation = body.split(/手术经过[：:]/)[1]?.split(/(?:\n\n术后计划[：:]|\n\n术后医嘱[：:]|\n\n术者签名[：:])/)[0] || '';
      if (/(?:如|若)[^。；\n]{0,100}(?:应|可|需)[^。；\n]{0,100}/.test(operation)) {
        add('review', 'PROCEDURE_HAS_CONTINGENCY', record, '已完成的手术经过含条件性操作建议，应与实际实施步骤区分');
      }
    }
    if (/^(入院记录|术前小结|首次病程记录)$/.test(key) &&
        /(?:WBC\s*[\d.]+|Hb\s*\d+|PLT\s*\d+)/i.test(body)) {
      add('info', 'EXAMPLE_LAB_VALUES', record, '包含具体示例化验数值，复制到真实病历前必须逐项核实');
    }
    const pod = byStage(record);
    if (pod !== null) {
      const surgery = datedField(body, '手术日期');
      const recorded = datedField(body, '记录时间');
      const start = toUtcDay(surgery), end = toUtcDay(recorded);
      if (start !== null && end !== null && (end - start) / 86400000 !== pod) {
        add('error', 'POD_DATE_CONFLICT', record, '记录日期与术后第' + pod + '天不一致');
      }
      if (/引流\/拔管过程平稳/.test(body)) {
        add('review', 'AMBIGUOUS_DRAIN_STATE', record, '“引流/拔管过程平稳”未区分留置与拔除状态');
      }
    }
  }
  for (const record of special) {
    if (!textBody(record).trim()) add('error', 'TKA_SPECIAL_EMPTY', record, '特殊病例正文为空');
  }

  // Detect impossible states after a recorded drain removal; avoid inferring a removal
  // from phrases such as "考虑拔管" or "达到拔管条件时".
  const daily = normal.map(r => ({r,day:byStage(r)})).filter(x => x.day !== null).sort((a,b) => a.day - b.day);
  let removedDay = null;
  for (const {r,day} of daily) {
    const body = textBody(r);
    if (removedDay !== null && day > removedDay && /继续留置引流管|引流管固定通畅/.test(body)) {
      add('error', 'DRAIN_AFTER_REMOVAL', r, '此前第' + removedDay + '天记录拔管，此处又记载引流管在位');
    }
    if (/(?:今日|已|给予|予以)[^。\n]{0,20}(?:拔除|拔出)引流管/.test(body)) removedDay = day;
  }

  const summary = {
    total: records.length, orthopedics: orthopedic.length,
    tkaStandard: normal.length, tkaSpecialCases: specialKeys.length,
    specialCaseKeys: specialKeys,
    counts: {
      error: findings.filter(f => f.severity === 'error').length,
      review: findings.filter(f => f.severity === 'review').length,
      info: findings.filter(f => f.severity === 'info').length
    },
    findings
  };
  return summary;
}
