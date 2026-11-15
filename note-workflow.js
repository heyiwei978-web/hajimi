/* 与页面/API 共用的流程约定；不把生成正文回填为病例事实。 */
globalThis.HajimiNoteWorkflow = (() => {
  const labels = Object.freeze({caseChapter:'所选病例章节', spec:'专科检查', first:'首次病程记录', preDaily:'术前病程记录', preop:'术前小结', op:'手术记录', postop:'术后首次病程记录', postDaily:'术后病程记录'});
  function dailyPhase(title) {
    if (/首次|入院|出院|术前小结|手术记录/.test(title)) return '';
    if (/术前.*(?:病程|查房)/.test(title)) return 'pre';
    if (/术后.*(?:病程|查房)/.test(title)) return 'post';
    return /查房|每日病程|日常病程|第.+天.*病程/.test(title) ? 'current' : '';
  }
  function key(type, input) {
    if (type === 'caseChapter') {
      const phase = dailyPhase(input.chapterTitle);
      return JSON.stringify([type, input.caseReference, input.chapterTitle, phase ? [phase === 'current' ? input.dailyPhase : phase, input.day] : '']);
    }
    return JSON.stringify([type, ['preDaily', 'postDaily'].includes(type) ? input.day : '']);
  }
  function title(type, input) {
    if (type === 'caseChapter') {
      const phase = dailyPhase(input.chapterTitle);
      const stage = phase === 'current' ? input.dailyPhase === 'pre' ? '住院' : '术后' : '本次';
      return input.chapterTitle + (phase && input.day ? '（' + stage + '第' + input.day + '天）' : '');
    }
    if (['preDaily', 'postDaily'].includes(type)) return labels[type] + '（第' + input.day + '天）';
    return labels[type];
  }
  function facts(input) {
    return [
      ['主诉', input.complaint], ['性别', input.sex], ['年龄', input.age ? input.age + '岁' : ''],
      ['主诊断 / 侧别', input.diagnosis], ['手术方式', input.operation], ['麻醉方式', input.anesthesia],
      ['过敏及长期禁忌', input.allergies], ['入院检查要点', input.checks], ['现病史要点', input.history],
      ['其他诊断 / 合并症', input.secondary], ['已确认的手术细节', input.operativeFacts],
      ['补充说明' + (input.extraScope === 'operative' ? '（仅手术及术后）' : ''), input.extra], ['当日变化', input.daily]
    ].filter(([, value]) => value);
  }
  function contains(text, value) {
    const compact = s => s.replace(/\s+/g, '');
    return compact(text).includes(compact(value));
  }
  return Object.freeze({labels, dailyPhase, key, title, facts, contains});
})();
