/* Orthopedic operative-report factuality pass, v29.
 * Operative reports narrate WHAT WAS DONE, not WHAT COULD BE DONE.
 * This pass runs AFTER v27, on GENERATED educational exemplar records only.
 * It never invents an optional procedure, deletes a record, or touches bespoke
 * or special-case content. Uncertain optional actions become visible prompts.
 */
(function() {
  'use strict';
  if (typeof templates === 'undefined' || !Array.isArray(templates)) return;
  const summary = {
    version: '2026-10-13-v29',
    operativeRecordsReviewed: 0,
    exampleRecordsChanged: 0,
    unsupportedPlansRemoved: 0,
    optionalDecisionsFlagged: 0,
    remainingConditionalDocuments: 0,
    requiresManualReview: []
  };
  const conditional = /如果|假如|若|必要时|如需|如见|如采用|可采用|可选择|可考虑|视情况|按需/g;
  function isOperation(t) {
    return t && t.department === '骨科' &&
      /手术记录/.test(String(t.short || '')) &&
      t.type === '手术记录' &&
      typeof t.sourceBody === 'string';
  }
  function extractOperation(body) {
    const match = /手术经过[：:]\s*\n([\s\S]*?)(?=\n\n(?:术后计划|术后医嘱|术后处理|术者签名|手术者签名)[：:]|$)/.exec(body);
    return match ? {whole:match[0], steps:match[1]} : null;
  }
  function factualize(steps) {
    let out=steps;
    // Pure contingency guidance is not an observed operation.
    out=out.replace(/如闭合复位不能达到目标，应及时改用辅助复位或有限切开复位。/g,function(){
      summary.unsupportedPlansRemoved++;
      return '';
    });
    // This particular "if unstable then fix" note must instead document the
    // actual syndesmosis stress-test finding and whether fixation was used.
    out=out.replace(/若存在不稳则根据具体损伤实施固定/g,function(){
      summary.optionalDecisionsFlagged++;
      return '【据实填写下胫腓联合应力检查结果及是否施行联合固定】';
    });
    // The text following 必要时 is unknown, not proof an action happened.
    // Stop at punctuation to avoid hiding verified actions later in a sentence.
    out=out.replace(/必要时([^，；。\n【】]{2,110})/g,function(_whole,procedure){
      summary.optionalDecisionsFlagged++;
      return '【待核实是否实施：'+procedure.trim()+'】';
    });
    return out;
  }
  for (const t of templates) {
    if(!isOperation(t)) continue;
    summary.operativeRecordsReviewed++;
    const original=t.sourceBody;
    const found=extractOperation(original);
    if(!found) continue;
    // Only model-built educational exemplars are eligible for automatic wording
    // repairs. Real/bespoke/special cases remain untouched for physician review.
    const autoEligible=t.idealCase === true && !t.specialCase &&
      ['TKA','THA','胫骨平台骨折','踝关节三踝骨折'].includes(t.group);
    if(autoEligible){
      const repaired=factualize(found.steps);
      if(repaired!==found.steps){
        t.sourceBody=original.replace(found.whole,found.whole.replace(found.steps,repaired));
        summary.exampleRecordsChanged++;
      }
    }
    const current=extractOperation(t.sourceBody);
    const unresolved=(current?.steps||'').match(conditional);
    if(unresolved&&unresolved.length){
      summary.remainingConditionalDocuments++;
      summary.requiresManualReview.push({
        group:String(t.group||''),
        document:String(t.short||''),
        modelExample:!!autoEligible,
        terms:[...new Set(unresolved)]
      });
    }
  }
  window.HAJIMI_OPERATIVE_REALITY_V29=summary;
})();
