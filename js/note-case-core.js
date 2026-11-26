/* 页面和服务端共用的病历框架；只定义文书结构，不包含病例正文。 */
globalThis.HajimiNoteCaseCore = (() => {
  const reference = '个人教学病例框架';
  const baseFields = ['department','sex','age','complaint','diagnosis','history','secondary','operation','anesthesia','extra','extraScope','allergies','checks','operativeFacts'];
  const templates = Object.freeze([
    {id:'TKA',label:'全膝关节置换',category:'关节置换',keywords:'膝骨关节炎 人工全膝关节置换',
      postoperative:'填写当天实际观察。可记录切口、引流量、膝关节活动度（ROM）及测量方式、步行辅助和已完成的康复训练。'},
    {id:'股骨转子间骨折',label:'股骨粗隆间骨折',category:'创伤骨科',keywords:'股骨转子间骨折 转子间 粗隆间 髋部骨折 PFNA',
      postoperative:'填写当天实际观察。可记录切口、引流量、患肢远端血运与感觉运动、已明确的负重要求及实际活动情况。'}
  ].map(Object.freeze));
  const templateFor = id => templates.find(item => item.id === id);
  const optional = Object.freeze([
    {id:'specialExam',title:'专科检查',type:'spec',stage:'入院'},
    {id:'internalConsult',title:'内科会诊申请单',type:'caseChapter',stage:'术前 / 诊疗'},
    {id:'anesthesiaConsult',title:'麻醉科会诊申请单',type:'caseChapter',stage:'术前',surgery:true},
    {id:'mdt',title:'多学科会诊记录',type:'caseChapter',stage:'诊疗'},
    {id:'transfusion',title:'输血相关记录',type:'caseChapter',stage:'诊疗'},
    {id:'summary',title:'阶段小结',type:'caseChapter',stage:'诊疗'},
    {id:'handover',title:'交接班记录',type:'caseChapter',stage:'诊疗'},
    {id:'transfer',title:'转科记录',type:'caseChapter',stage:'诊疗'},
    {id:'rescue',title:'抢救记录',type:'caseChapter',stage:'诊疗'}
  ].map(Object.freeze));
  function settings(value = {}) {
    if (!['surgery','medical'].includes(value.mode)) throw new Error('请选择手术或非手术病历');
    const number = (name, max) => {
      const raw = value[name], n = Number(raw);
      if (!/^[1-9]\d{0,2}$/.test(String(raw)) || n > max) throw new Error('病程天数应为 1 至 ' + max + ' 的整数');
      return n;
    };
    const extras = value.extras === undefined ? [] : value.extras;
    if (!Array.isArray(extras) || extras.length > optional.length || new Set(extras).size !== extras.length
      || extras.some(id => !optional.some(item => item.id === id && (!item.surgery || value.mode === 'surgery')))) throw new Error('附加文书选择无效');
    const template = value.template;
    if (template !== undefined && !templateFor(template)) throw new Error('病种框架选择无效');
    return {mode:value.mode,preDays:value.mode === 'surgery' ? number('preDays',30) : 1,
      postDays:value.mode === 'surgery' ? number('postDays',90) : 1,
      stayDays:value.mode === 'medical' ? number('stayDays',90) : 1,extras:[...extras],...(template ? {template} : {})};
  }
  function build(value) {
    const config = settings(value);
    const items = [
      {id:'admission',title:'入院记录',type:'caseChapter',stage:'入院'},
      {id:'first',title:'首次病程记录',type:'first',stage:'入院'}
    ];
    items.push(...optional.filter(item => config.extras.includes(item.id) && item.id === 'specialExam'));
    if (config.mode === 'surgery') {
      for (let day = 1; day < config.preDays; day++) items.push({
        id:'pre-'+day,title:'术前住院第'+day+'天'+(day === 1 ? '主治医师查房记录' : day === 2 ? '主任医师查房记录' : '病程记录'),
        type:'preDaily',phase:'pre',day:String(day),stage:'术前'
      });
      items.push(...optional.filter(item => config.extras.includes(item.id) && ['internalConsult','anesthesiaConsult','mdt'].includes(item.id)));
      items.push(
        {id:'preMaster',title:'术前主刀医师查房记录',type:'caseChapter',stage:'术前'},
        {id:'preSummary',title:'术前小结',type:'preop',stage:'术前'},
        {id:'preDiscussion',title:'术前讨论',type:'caseChapter',stage:'术前'},
        {id:'operation',title:'手术记录',type:'op',stage:'手术'},
        {id:'postFirst',title:'术后首次病程记录',type:'postop',stage:'术后'},
        {id:'postMaster',title:'术后主刀医师查房记录',type:'caseChapter',stage:'术后'}
      );
      for (let day = 1; day <= config.postDays; day++) items.push({
        id:'post-'+day,title:'术后第'+day+'天病程记录',type:'postDaily',phase:'post',day:String(day),stage:'术后'
      });
    } else {
      items.push(...optional.filter(item => config.extras.includes(item.id) && ['internalConsult','mdt'].includes(item.id)));
      for (let day = 1; day <= config.stayDays; day++) items.push({
        id:'stay-'+day,title:'住院第'+day+'天'+(day === 1 ? '主治医师查房记录' : day === 2 ? '主任医师查房记录' : '病程记录'),
        type:'caseChapter',day:String(day),stage:'住院'
      });
    }
    items.push(...optional.filter(item => config.extras.includes(item.id) && ['transfusion','summary','handover','transfer','rescue'].includes(item.id)));
    items.push(
      {id:'dischargeRound',title:'出院前主治医师查房记录',type:'caseChapter',stage:'出院'},
      {id:'discharge',title:'出院记录',type:'caseChapter',stage:'出院'}
    );
    return items.map(item => ({...item,mode:config.mode}));
  }
  function facts(input) {
    return Object.fromEntries(baseFields.map(name => [name,typeof input?.[name] === 'string' ? input[name].trim() : '']));
  }
  function inputFor(section, input, notes = '', model = '') {
    const scoped = facts(input);
    if (section.mode === 'medical') {
      scoped.operation = scoped.anesthesia = scoped.operativeFacts = '';
      if (scoped.extraScope === 'operative') scoped.extra = '';
    }
    return {...scoped,type:section.type,caseReference:reference,chapterTitle:section.title,
      referenceText:'',day:section.day || '',daily:section.day ? notes : '',dailyPhase:section.phase || '',
      sectionNotes:section.day ? '' : notes,...(model ? {model} : {})};
  }
  function combine(title, sections) {
    return [title,...sections.map(section => section.title+'\n'+section.text)].join('\n\n');
  }
  return Object.freeze({reference,baseFields,templates,templateFor,optional,settings,build,facts,inputFor,combine});
})();
