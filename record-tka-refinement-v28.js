/* TKA standard-example coherence repairs (v28).
 * Runs after record-course-v27.js and before the clinical compiler serializes records.
 * Scope: TKA STANDARD templates only. NEVER change the two TKA special cases,
 * other diseases, UI, case facts, or patient input.
 */
(function refineTkaExample(){
  'use strict';
  if (typeof templates === 'undefined' || !Array.isArray(templates)) return;
  const stats = {version:'2026-10-12-tka-v28',changed:0,drainStates:0,rounds:0,discharge:0,operation:0};
  const generic = '须结合患者病史、专科查体及已完成的辅助检查动态评价病情，核对诊疗指征及下一阶段治疗、康复安排。';
  const clinicianNotes = {
    '术前主刀查房':
      '结合右膝长期疼痛、内翻畸形、负重位影像退变及既往保守治疗效果，复核右侧手术标识、麻醉评估和拟用假体；术中着重检查截骨后下肢力线、屈伸间隙、侧副韧带稳定性及髌骨轨迹，术后根据伤口、疼痛和神经血管查体制定康复计划。',
    '术后主刀查房记录':
      '继续重点观察右膝切口、引流量及引流液性状，记录患肢足背及胫后动脉搏动、踝足感觉运动；结合实际疼痛、肿胀和股四头肌功能，决定当天的膝关节活动度、离床训练及VTE预防措施。',
    '出院前主治医师查房记录':
      '结合本例示范病程中切口清洁、主动活动度约0°～100°、助行器步行约100米及神经血管查体稳定等情况，综合核对当日真实ROM、活动能力、疼痛、VTE与出血风险以及出院用药；确认无需继续住院处理后，向患者及家属交代切口护理、居家训练、复查和异常症状就医指征。'
  };
  const drainState = {
    '术后第1天病程':'右膝切口敷料清洁，引流管仍在位，近24小时淡血性引流约120ml，本日未拔管',
    '术后第2天病程':'右膝切口敷料清洁，引流管仍在位，近24小时淡血性引流约55ml，较前减少，本日未拔管',
    '术后第3天病程':'右膝引流管已于今日拔除，拔管后局部敷料干燥',
    '术后第5天病程':'右膝引流管已按前期记录拔除，继续观察切口及肿胀情况',
    '术后第7天病程':'右膝引流管已于前期拔除，切口及患肢功能继续随访评估'
  };
  const correctedDischarge = [
    '【教学示例：以下体征、活动度及出院判断须以患者实际查房资料核实后替换】',
    '今日进行出院前查房。患者因右膝骨性关节炎入院，住院期间接受右全膝关节置换术。',
    '示例出院前检查：生命体征平稳，右膝切口清洁干燥，无新发异常渗液；右下肢足背及胫后动脉搏动可触及，足趾感觉、踝足活动未见新发异常。',
    '功能评估：右膝主动活动度约0°～110°，股四头肌收缩良好，能够使用助行器完成病区内步行，训练后无明显反跳性肿胀或无法耐受的疼痛。',
    '________主治医师查房后指出：应结合当日切口、疼痛、患肢神经血管功能、实际ROM、步行安全性及必要检查结果，确认不存在需要继续住院处理的问题；出院前核对VTE预防与出血风险、实际处方及康复限制，并向患者及家属说明换药、复查、居家功能训练及异常肿胀、渗液、发热或胸闷气促时及时就医的要求。'
  ].join('');
  for (const record of templates) {
    if (record.department !== '骨科' || record.group !== 'TKA' ||
        record.specialCase || typeof record.sourceBody !== 'string') continue;
    const short = record.short || '';
    let body = record.sourceBody;
    const started = body;
    const stateText = drainState[short];
    if (stateText && body.includes('右膝切口及引流/拔管过程平稳')) {
      body = body.replace('右膝切口及引流/拔管过程平稳', stateText);
      stats.drainStates++;
    }
    if (clinicianNotes[short] && body.includes(generic)) {
      body = body.replace(generic, clinicianNotes[short]);
      stats.rounds++;
    }
    if (short === '手术记录') {
      const vague = '髌骨是否置换及后方交叉韧带的保留情况须与实际术式一致。';
      if (body.includes(vague)) {
        body = body.replace(vague,
          '髌骨处理：【根据本次实际手术填写是否置换及具体处理】；后交叉韧带处理：【根据实际填写保留或切除及对应假体设计】。');
        stats.operation++;
      }
    }
    if (short === '出院当天查房记录') {
      const before = body;
      body = body.replace(/(病程记录：)[\s\S]*?(\n\n医师签名：________\s*$)/,
        (_whole,prefix,suffix) => prefix + correctedDischarge + suffix);
      if (body !== before) stats.discharge++;
    }
    if (body !== started) {
      record.sourceBody = body;
      stats.changed++;
    }
  }
  window.HAJIMI_TKA_REFINEMENT_V28 = stats;
})();
