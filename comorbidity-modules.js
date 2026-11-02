/* Optional perioperative comorbidity overlays. Source records and CMS are never mutated. */
(function(root){
  'use strict';
  const modules=[
    {id:'cad',name:'冠心病',
      history:'既往冠心病【确诊时间、诊断依据】，既往心肌梗死、PCI或CABG史【时间及方式】，平素胸痛、活动耐量及气促情况【据实填写】，长期应用抗血小板药、他汀及其他心脏药物【逐项核实】。',
      preop:'结合冠心病病史、目前有无新发或加重的胸痛、气促、心力衰竭征象、心电图【结果】及必要时心肌损伤标志物【结果】，开展分层风险评估。合并新发气促、疑似心衰、显著瓣膜病体征或病情变化，且结果会影响决策时，申请经胸心脏超声评估心室功能及瓣膜情况；稳定无症状者不因冠心病史单独常规重复心超。既往PCI时间及双联抗血小板治疗方案须与心内科、麻醉科共同核对。',
      consult:'申请心内科/内科评估冠心病稳定性、近期缺血症状及心电图异常，结合既往PCI/心梗时间、当前抗血小板治疗、拟行手术出血风险与麻醉方式提出手术时机、用药调整及监测建议。心脏超声申请理由：存在【新发气促/疑似心衰/新发杂音/临床状况变化】且结果将改变围手术期处理；如无相应指征不机械申请。',
      postop:'观察胸痛、胸闷、心率、血压、血氧及容量状态，结合症状与手术风险判断是否复查心电图和肌钙蛋白。抗血小板药物恢复时点需结合实际止血、近期支架植入时间及心内科意见，避免将骨科静脉血栓预防等同于冠脉二级预防。',
      discharge:'核对冠心病二级预防用药清单、临床调整原因与恢复时间；向患者及家属说明胸痛、呼吸困难等警示症状，安排心内科随访。'},
    {id:'htn',name:'高血压',
      history:'既往高血压【病程、最高血压及平时控制范围】，长期降压方案【具体药名及实际服用情况】，靶器官损害及高血压相关症状【据实填写】。',
      preop:'记录多次复测血压及相关症状，辨别疼痛、焦虑、容量不足及既往控制不佳的影响，评估心脑肾靶器官情况。结合血压水平、手术紧急程度及麻醉评估调整降压方案，避免无指征快速降压；围手术期ACEI/ARB等药物按适应证及团队意见处理。',
      consult:'申请内科评估术前血压控制、可疑高血压急症与靶器官损害，明确降压用药调整、术中血流动力学监测及术后恢复方案。',
      postop:'动态记录血压、疼痛、容量状态和肾功能，及时分析持续升高或低血压原因并调整治疗，警惕心脑肾低灌注。',
      discharge:'核对降压药实际方案，交代居家血压监测、低血压警示症状及内科随访。'},
    {id:'stroke',name:'脑梗死病史',
      history:'既往脑梗死/TIA【发生日期、病灶、治疗及神经功能恢复情况】，遗留偏瘫、吞咽或认知障碍【据实填写】，长期抗血小板/抗凝及调脂用药【核实】。',
      preop:'查明距最近脑血管事件的时间及目前神经功能基线，评估围手术期再卒中、谵妄、误吸及跌倒风险。择期非心脏手术需结合近期卒中时间讨论手术时机；急诊髋部骨折则应权衡延误手术与神经系统风险，不机械套用择期延期建议。围手术期抗栓药物停复须综合出血与血栓风险。',
      consult:'申请神经内科/内科明确既往卒中类型、时间及残留神经功能，评估再卒中风险、抗栓药物停复及必要影像检查指征。',
      postop:'观察意识、言语、瞳孔、肢体肌力及吞咽情况与术前基线差异，关注低氧、低血压、房颤、谵妄和误吸。出现新发局灶性神经症状时立即启动卒中评估流程。',
      discharge:'核对卒中二级预防用药与恢复时间，结合功能状态制定吞咽、步行、跌倒预防及神经内科随访计划。'},
    {id:'dm',name:'糖尿病',
      history:'糖尿病【类型、病程】，日常用药【包括胰岛素、SGLT2抑制剂等】，近期空腹、餐后血糖和HbA1c【实际结果】，低血糖及肾脏、神经血管并发症【据实填写】。',
      preop:'评估近期血糖及HbA1c、营养状态、肾功能与感染风险；结合禁食和手术时间制定血糖监测及降糖药物调整计划。尤其核实SGLT2抑制剂停药时点，防范围术期酮症酸中毒。多数围手术期患者血糖目标可参考5.6—10.0 mmol/L，结合老年、衰弱及低血糖风险个体化。',
      consult:'申请内分泌/内科明确术前血糖控制、禁食期间降糖药及胰岛素方案、术后监测频率和低血糖应对策略。',
      postop:'结合进食恢复、血糖实测值及感染/切口愈合情况调整降糖治疗，记录低血糖、高血糖或酮症相关症状及处理。',
      discharge:'核对降糖药物、饮食与血糖监测计划，交代低血糖识别、伤口观察及内分泌门诊复诊。'},
    {id:'hf',name:'心力衰竭',
      history:'既往心力衰竭【确诊依据、类型、近期急性加重史】，既往左室射血分数、NT-proBNP及心脏超声【日期与实际结果】，活动耐量、端坐呼吸和水肿【据实填写】。',
      preop:'评估是否存在失代偿性心衰、肺淤血或容量失衡，结合症状、查体、必要的NT-proBNP及心脏超声结果决定优化和手术时机。新发气促或心衰症状变化时，经胸心脏超声可明确心室功能和瓣膜情况；稳定且近期已有有效超声结果者不常规重复。',
      consult:'申请心内科评估心衰当前代偿状态、围手术期心血管风险、容量及利尿/心衰药物管理，明确麻醉与术后监护要求。',
      postop:'持续监测血压、心率、呼吸、血氧、出入量、尿量及液体负荷，警惕肺水肿、低灌注与急性肾损伤；对补液、利尿及输血作个体化决策。',
      discharge:'确认容量状态、心衰维持用药及停复原因，交代体重、气促、水肿监测和心内科随访。'},
    {id:'af',name:'心房颤动',
      history:'既往心房颤动【首诊时间、阵发/持续类型】，既往卒中或栓塞病史、心率控制方案及长期抗凝药【药名、剂量、末次服药时间】。',
      preop:'结合心电图、心率及循环稳定性评估，核对血栓栓塞风险、术式出血风险、肾功能及椎管内麻醉计划，明确抗凝停药与重启时间；并非所有房颤患者停药后均需肝素桥接。',
      consult:'请心内科/内科与麻醉科共同评估房颤心室率控制、抗凝停复时间、椎管内麻醉安全边界及围手术期栓塞和出血风险。',
      postop:'监测心率、节律、血压及贫血/出血变化，结合切口止血、肾功能和麻醉方式确定恢复治疗性抗凝的时点，避免与骨科预防性抗凝重复。',
      discharge:'核对实际抗凝方案、恢复时间、出血警示症状、心率控制及心内科随访。'},
    {id:'ckd',name:'慢性肾脏病',
      history:'既往慢性肾脏病【病因、分期及基线肌酐/eGFR】，近期肾功能变化、尿量、水肿、贫血及透析史【据实填写】。',
      preop:'核对基线与当前肌酐/eGFR、电解质及容量状态，评估急性肾损伤风险。调整肾排泄药物及抗菌、镇痛、抗凝方案；低分子肝素使用须根据肾功能和适应证确定是否调整剂量，不固定照搬预防剂量。',
      consult:'申请肾内/内科评估肾功能变化、电解质及容量状态，明确围手术期补液、用药剂量调整、肾毒性暴露控制及必要透析安排。',
      postop:'监测尿量、肌酐、血钾及容量状态，动态评估急性肾损伤、药物蓄积和出血风险，避免不必要肾毒性药物。',
      discharge:'复核肾功能、电解质与出院处方的肾功能适配性，交代复查时间及肾内科随访。'},
    {id:'copd',name:'慢性阻塞性肺疾病',
      history:'既往慢阻肺【确诊情况、肺功能资料、急性加重次数】，平素活动耐量、吸入药物、家庭氧疗及近期咳嗽、咳痰、气促【据实填写】。',
      preop:'评估是否存在急性加重、低氧血症或感染，核对基础吸入治疗、血氧及必要影像/血气资料。结合麻醉方式和呼吸功能制定术后肺部并发症预防与呼吸康复方案。',
      consult:'申请呼吸/内科评估慢阻肺稳定性、气道用药优化、感染或急性加重处理、围手术期氧疗及术后呼吸支持需要。',
      postop:'监测呼吸频率、血氧、痰液及呼吸困难变化，落实适宜镇痛、呼吸训练、有效排痰及尽早安全活动，防范肺不张和肺炎。',
      discharge:'核对吸入药使用方法与用药方案，交代呼吸症状恶化警示、戒烟建议及呼吸科随访。'}
  ];
  const chosen=new Set();
  // 特殊检查 / 用药 / 会诊理由：数据在 special-exams.js，选择与慢性病分开保存。
  const exams=new Set();
  // Only the reusable order reason is shown; the source items keep their
  // record/caution notes (special-exams.js) but they are not displayed or copied.
  const examFields=[['reason','申请理由（可改用）']];
  const examFieldTitle=Object.fromEntries(examFields);
  function examItems(){return (root.HAJIMI_SPECIAL_ITEMS||[]);}
  function getExam(id){return examItems().find(item=>item.id===id);}
  function selectedExams(){return examItems().filter(item=>exams.has(item.id));}
  function examCategories(){return [...new Set(examItems().map(item=>item.cat))];}
  const get=id=>modules.find(item=>item.id===id);
  // This is a separate, opt-in writing resource, NOT a patch of the sample case.
  // Existing cases often explicitly deny chronic conditions: mixing the text
  // without reconciling that history would create contradictory medical records.
  function selectedItems(){return modules.filter(item=>chosen.has(item.id));}
  const fields=[
    ['history','入院记录与既往史'],
    ['preop','术前查房、术前小结及风险评估'],
    ['consult','专科会诊申请与检查理由'],
    ['postop','术后病程与监测'],
    ['discharge','出院当天查房及随访']
  ];
  // Inpatient timeline sections. These are generic fill-in templates without
  // medical judgement: only the condition name is inserted, everything else is
  // left as 【】 blanks for the clinician (or later reviewed content) to complete.
  const timeline=[
    ['day1Round','入院第1天 · 主治医师查房（完善检查）',name=>
      '主治医师查房：患者既往'+name+'病史【病程、目前控制情况及用药】。结合本次拟行手术，为评估围手术期风险，指示完善【检查项目】，复查【指标】，待结果回报后进一步评估。'],
    ['day2Results','第2天 · 检查结果回报及会诊申请',name=>
      '检查结果回报：【检查项目及结果】。结合患者既往'+name+'病史，为明确围手术期风险及用药调整，请【内科/麻醉科】会诊，协助评估【会诊目的】。'],
    ['consultRecord','会诊记录（内科/麻醉科）',name=>
      '会诊科室：【内科/麻醉科】　会诊医师：________　会诊时间：【日期 时间】\n'+
      '会诊目的：评估患者既往'+name+'病史对本次手术及麻醉的影响。\n'+
      '病史及查体：【据实填写】\n'+
      '辅助检查：【检查结果】\n'+
      '会诊意见：1.【手术时机意见】；2.【用药调整】；3.【围手术期监测建议】。\n'+
      '会诊医师签名：________'],
    ['day3Plan','第3天 · 根据会诊意见调整（查房记录）',name=>
      '查房记录：【内科/麻醉科】会诊意见已回报：【会诊意见要点】。结合患者既往'+name+'病史及会诊意见，调整为：【处理措施/用药调整】；手术时机【按期/调整及原因】；继续观察【监测指标】。']
  ];
  const timelineText=Object.fromEntries(timeline.map(([field,,make])=>[field,make]));
  // Display order: admission history, the three-day workup, then perioperative stages.
  const allFields=[fields[0],...timeline.map(([field,title])=>[field,title]),...fields.slice(1)];
  const fieldTitle=Object.fromEntries(allFields);
  function shortName(item){return String(item.name).replace(/病史$/,'');}
  // Developer-mode edits are stored in the site CMS (supplementOverrides) and
  // replace the built-in wording for everyone; deleting one restores the default.
  function overrides(){return root.HAJIMI_CMS?.supplements?.()||{};}
  function isEditor(){return !!root.HAJIMI_CMS?.admin;}
  function defaultText(item,field){
    if(timelineText[field])return timelineText[field](shortName(item));
    return String(item[field]);
  }
  function textOf(item,field){
    const edited=overrides()['c:'+item.id+':'+field];
    return edited?String(edited.body):defaultText(item,field);
  }
  function examText(item,field){
    const edited=overrides()['x:'+item.id+':'+field];
    return edited?String(edited.body):String(item[field]);
  }
  // Reading stages of the side panel. Each stage lists the fields shown beside
  // the chapter being read; "all" shows every field.
  const stages=[
    {id:'admission',label:'入院',fields:['history']},
    {id:'day1',label:'第1天查房',fields:['day1Round']},
    {id:'day2',label:'第2天会诊申请',fields:['day2Results']},
    {id:'consultRecord',label:'会诊记录',fields:['consultRecord']},
    {id:'day3',label:'第3天调整',fields:['day3Plan']},
    {id:'preop',label:'术前',fields:['preop','consult']},
    {id:'postop',label:'术后',fields:['postop']},
    {id:'discharge',label:'出院',fields:['discharge']},
    {id:'all',label:'全部',fields:allFields.map(([field])=>field)}
  ];
  const stageById=Object.fromEntries(stages.map(stage=>[stage.id,stage]));
  let stage='admission',follow=true,chapter=null,sheetOpen=false,view=null,drawn='',editing=null;
  function escape(value){return String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
  // Maps the chapter being read to the matching supplement stage.
  function stageFor(info){
    // A merged chapter (e.g. 入院查房记录) is matched by its first record's name too.
    const title=String(info?.title||'')+' '+String(info?.record||'');
    if(/出院/.test(title))return 'discharge';
    const value=String(info?.stage||'');
    if(value==='入院'){
      if(/主治/.test(title))return 'day1';
      if(/主任/.test(title))return 'day2';
      return 'admission';
    }
    // Pre-operative chapters, in reading order: treatment talk and surgeon round
    // (day 2) → multidisciplinary discussion / consultation (consult record) →
    // consents and anaesthesia visit (day 3) → pre-operative summary.
    if(value==='术前'){
      if(/小结/.test(title))return 'preop';
      if(/会诊|讨论/.test(title))return 'consultRecord';
      if(/主刀查房|治疗方案/.test(title))return 'day2';
      return 'day3';
    }
    if(value==='术中')return 'preop';
    if(value==='术后')return 'postop';
    return 'admission';
  }
  function separateText(){
    return [
      ...selectedItems().map(item=>
        '【'+item.name+'｜独立补充模块】\n'+
        allFields.map(([field,title])=>title+'：'+textOf(item,field)).join('\n\n')),
      ...selectedExams().map(item=>
        '【'+item.name+'｜'+item.cat+'】\n'+
        examFields.map(([field,title])=>title+'：'+examText(item,field)).join('\n\n'))
    ].join('\n\n========================================\n\n');
  }
  function boxText(id,field){
    if(String(id).startsWith('x~')){
      const exam=getExam(String(id).slice(2));
      return exam&&examFieldTitle[field]?examText(exam,field):'';
    }
    const item=get(id);
    return item&&fieldTitle[field]?textOf(item,field):'';
  }
  function boxLabel(id,field){
    if(String(id).startsWith('x~')){const exam=getExam(String(id).slice(2));return exam?exam.name+' · '+examFieldTitle[field]:'';}
    const item=get(id);return item?item.name+' · '+fieldTitle[field]:'';
  }
  function supplementKey(copyId,field){
    return String(copyId).startsWith('x~')?'x:'+String(copyId).slice(2)+':'+field:'c:'+copyId+':'+field;
  }
  function boxHead(copyId,field,label,ariaName){
    const key=supplementKey(copyId,field),edited=Boolean(overrides()[key]);
    return '<div class="comorbidity-box-head"><strong>'+escape(label)+(edited?'<em class="supplement-edited">已修改</em>':'')+'</strong>'+
      '<span class="comorbidity-box-buttons">'+
      (isEditor()?'<button class="btn ghost comorbidity-box-copy" type="button" data-edit-box="'+key+'" aria-label="编辑'+escape(ariaName)+'">编辑</button>':'')+
      '<button class="btn ghost comorbidity-box-copy" type="button" data-copy-box="'+copyId+':'+field+'" aria-label="复制'+escape(ariaName)+'">复制</button></span></div>';
  }
  function renderExams(){
    const items=selectedExams();
    if(!items.length)return '';
    return '<section class="special-exam-notes" aria-label="特殊检查与用药理由"><h4 class="special-exam-notes-title">特殊检查 · 用药 · 会诊理由<small>不随章节切换</small></h4>'+
      items.map(item=>'<article class="comorbidity-detail special-exam-detail" data-exam-item="'+item.id+'"><h4>'+escape(item.name)+'<small>'+escape(item.cat)+'</small></h4>'+
        examFields.map(([field,title])=>'<div class="comorbidity-box">'+boxHead('x~'+item.id,field,title,item.name+'：'+title)+
          '<p>'+escape(examText(item,field))+'</p></div>').join('')+
        '</article>').join('')+'</section>';
  }
  function renderSelected(stageId=stage){
    const items=selectedItems();
    const current=stageById[stageId]||stageById.admission;
    const extra=renderExams();
    if(!items.length)return extra||'<p class="comorbidity-empty">尚未选择慢性病或特殊检查。勾选后，这里会出现对应的补充内容框。</p>';
    return items.map(item=>'<article class="comorbidity-detail" data-comorbidity-item="'+item.id+'"><h4>'+escape(item.name)+'</h4>'+
      current.fields.map(field=>'<div class="comorbidity-box">'+boxHead(item.id,field,fieldTitle[field],item.name+'：'+fieldTitle[field])+
        '<p>'+escape(textOf(item,field))+'</p></div>').join('')+
      '</article>').join('')+extra;
  }
  // Intentionally identity-only; prevent source text and full-record copy from
  // gaining contradictory claims when a sample patient denies a condition.
  function compose(record,original){return original;}
  // The option bar shown above the record.
  // The 特殊检查 column beside the chronic-condition options.
  function examHtml(){
    if(!examItems().length)return '';
    return '<section id="specialExamPanel" class="comorbidity-panel special-exam-picker" aria-labelledby="specialExamTitle">'+
      '<div class="comorbidity-head"><div><span class="case-file-eyebrow">ORDER REASONS</span><h3 id="specialExamTitle">特殊检查（可多选）</h3>'+
      '<p>影像、其他检查、用药及会诊的申请理由。勾选后出现在病历旁的补充内容框中，可单独复制。</p></div>'+
      '<button id="clearExams" class="btn ghost" type="button">清空选择</button></div>'+
      examCategories().map(cat=>{
        const list=examItems().filter(item=>item.cat===cat);
        return '<details class="special-exam-group"><summary><span>'+escape(cat)+'</span><small data-exam-count="'+escape(cat)+'">'+list.length+' 项</small></summary>'+
          '<div class="comorbidity-grid special-exam-grid">'+list.map(item=>
            '<label class="comorbidity-choice"><input type="checkbox" data-exam="'+item.id+'"'+(exams.has(item.id)?' checked':'')+'><span>'+escape(item.name)+'</span></label>'
          ).join('')+'</div></details>';
      }).join('')+
      '<p class="comorbidity-caution">申请理由为教学参考写法，【】处须按患者实际症状、检查结果和本院规定填写；是否申请由主管医师判断。</p>'+
      '</section>';
  }
  function html(){
    return '<div class="supplement-pickers">'+comorbidityHtml()+examHtml()+'</div>';
  }
  function comorbidityHtml(){
    return '<section id="comorbidityPanel" class="comorbidity-panel comorbidity-picker" aria-labelledby="comorbidityTitle">'+
      '<div class="comorbidity-head"><div><span class="case-file-eyebrow">OPTIONAL COMORBIDITIES</span><h3 id="comorbidityTitle">合并慢性病（可多选）</h3>'+
      '<p>勾选后，病历旁出现对应的补充内容框（手机上点右下角“补充内容”打开），随阅读章节自动切换入院、第1天查房、第2天会诊申请、会诊记录、第3天调整、术前、术后、出院内容，可单独复制。</p></div>'+
      '<button id="clearComorbidities" class="btn ghost" type="button">清空选择</button></div>'+
      '<div class="comorbidity-grid">'+modules.map(item=>
        '<label class="comorbidity-choice"><input type="checkbox" data-comorbidity="'+item.id+'"'+(chosen.has(item.id)?' checked':'')+'><span>'+escape(item.name)+'</span></label>'
      ).join('')+'</div>'+
      '<p class="comorbidity-caution">原始教学病例可能已明确记载“否认慢性病史”及特定检查结果。补充内容不与原病例自动拼接，正式使用前须先按真实病史、检查、医嘱及手术时机逐项修改，避免同一病历前后矛盾。</p>'+
      '</section>';
  }
  // The supplement panel beside the record (bottom sheet on narrow screens).
  function sideHtml(){
    return '<aside id="comorbiditySide" class="comorbidity-side" aria-labelledby="comorbiditySideTitle" hidden>'+
      '<div class="comorbidity-side-head"><div><span class="case-file-eyebrow">SUPPLEMENTS</span><h3 id="comorbiditySideTitle" tabindex="-1">补充内容</h3>'+
      '<span id="comorbiditySelectionStatus" role="status">'+(chosen.size+exams.size)+' 项已选择</span></div>'+
      '<button id="closeComorbiditySide" class="btn ghost comorbidity-side-close" type="button">收起</button></div>'+
      '<div class="comorbidity-stage-tabs" role="group" aria-label="补充内容对应阶段">'+stages.map(item=>
        '<button type="button" data-comorbidity-stage="'+item.id+'" aria-pressed="'+(item.id===stage)+'">'+item.label+'</button>'
      ).join('')+'</div>'+
      '<p class="comorbidity-follow"><span id="comorbidityFollowText"></span><button id="comorbidityFollow" class="comorbidity-follow-btn" type="button" hidden>跟随阅读章节</button></p>'+
      '<div id="comorbidityNotes" class="comorbidity-notes">'+renderSelected()+'</div>'+
      '<div class="comorbidity-actions"><button id="copyComorbidities" class="btn primary" type="button"'+(chosen.size+exams.size?'':' disabled')+'>复制已选全部补充</button></div>'+
      '<p class="comorbidity-footer">检查结果、用药、处理结论须核对；不会修改原始病历或“复制完整病历”的内容。</p>'+
      '</aside>'+
      '<button id="openComorbiditySide" class="comorbidity-fab" type="button" aria-controls="comorbiditySide" aria-expanded="false" hidden>补充内容 <b id="comorbidityFabCount">0</b></button>';
  }
  async function copyValue(value){
    if(!value)return false;
    try{await navigator.clipboard.writeText(value);return true;}catch{
      if(typeof document==='undefined'||!document.createElement)return false;
      const input=document.createElement('textarea');
      input.value=value;document.body.appendChild(input);input.select();
      let ok=false;try{ok=document.execCommand('copy');}catch{}
      input.remove();return ok;
    }
  }
  function redraw(){
    if(!view||!view.side.isConnected)return;
    const {side,workspace,notes,status,copy,fab,fabCount,tabs,followText,followButton}=view;
    const count=chosen.size+exams.size;
    side.hidden=count===0;
    workspace?.classList.toggle('has-comorbidity-side',count>0);
    if(count===0)sheetOpen=false;
    side.classList.toggle('is-open',sheetOpen);
    fab.hidden=count===0||sheetOpen;
    fab.setAttribute('aria-expanded',String(sheetOpen));
    fabCount.textContent=String(count);
    status.textContent=count+' 项已选择';
    copy.disabled=count===0;
    tabs.forEach(tab=>tab.setAttribute('aria-pressed',String(tab.dataset.comorbidityStage===stage)));
    // Stage buttons only apply to chronic-condition supplements.
    const stageBar=side.querySelector?.('.comorbidity-stage-tabs'),followBar=side.querySelector?.('.comorbidity-follow');
    if(stageBar)stageBar.hidden=chosen.size===0;
    if(followBar)followBar.hidden=chosen.size===0;
    const label=stageById[stage].label;
    followText.textContent=follow
      ?(chapter?.title?'正在阅读「'+chapter.title+'」→ 显示'+label+'内容':'显示'+label+'内容，随阅读章节自动切换')
      :'已手动切换为'+label+'内容';
    followButton.hidden=follow;
    // Rebuild the boxes only when their content changes, so scrolling within the
    // same stage keeps keyboard focus on a copy button.
    const key=stage+'|'+[...chosen].join(',')+'|'+[...exams].join(',');
    if(key!==drawn&&!editing){drawn=key;notes.innerHTML=renderSelected();}
  }
  function setOpen(open){
    sheetOpen=!!open;
    redraw();
    if(!view)return;
    if(sheetOpen)view.side.querySelector('#comorbiditySideTitle')?.focus({preventScroll:true});
    else view.fab.focus?.({preventScroll:true});
  }
  // Called by the case reader whenever the current chapter changes.
  function setChapter(info){
    chapter=info?{stage:String(info.stage||''),title:String(info.title||''),record:String(info.record||'')}:null;
    if(follow)stage=stageFor(chapter);
    redraw();
  }
  // A large modal editor for the narrow side panel. It edits the same text as the
  // inline box: 保存 saves through the inline controls, 缩小 copies the text back.
  function expandDialog(){
    let dialog=document.getElementById('supplementExpandDialog');
    if(dialog)return dialog;
    dialog=document.createElement('dialog');
    dialog.id='supplementExpandDialog';dialog.className='supplement-expand-dialog';
    dialog.setAttribute('aria-labelledby','supplementExpandTitle');
    dialog.innerHTML='<div class="supplement-expand-head"><div><strong id="supplementExpandTitle">放大编辑</strong><span id="supplementExpandMeta"></span></div>'+
      '<button type="button" class="btn ghost" data-expand-close>缩小</button></div>'+
      '<label class="supplement-editor-label" for="supplementExpandText">编辑内容（保存后所有访问者都会看到）</label>'+
      '<textarea id="supplementExpandText"></textarea>'+
      '<div class="supplement-editor-actions"><button type="button" class="btn primary" data-expand-save>保存</button>'+
      '<button type="button" class="btn ghost" data-expand-close>缩小（不保存）</button></div>'+
      '<p class="supplement-editor-status" id="supplementExpandStatus" role="status" aria-live="polite"></p>';
    document.body.appendChild(dialog);
    return dialog;
  }
  function openExpanded(box,editor){
    const dialog=expandDialog(),inline=editor.querySelector('textarea'),big=dialog.querySelector('#supplementExpandText');
    const label=box.querySelector('.comorbidity-box-head strong')?.textContent||'';
    const title=box.closest('.comorbidity-detail')?.querySelector('h4')?.childNodes[0]?.textContent||'';
    dialog.querySelector('#supplementExpandMeta').textContent=[title,label.replace('已修改','')].filter(Boolean).join(' · ');
    dialog.querySelector('#supplementExpandStatus').textContent='';
    big.value=inline.value;
    const back=()=>{inline.value=big.value;};
    dialog.querySelectorAll('[data-expand-close]').forEach(button=>{button.onclick=()=>{back();dialog.close();inline.focus();};});
    dialog.querySelector('[data-expand-save]').onclick=()=>{
      back();
      if(!big.value.trim()){dialog.querySelector('#supplementExpandStatus').textContent='内容不能为空；如需还原请点小框里的“恢复默认”。';return;}
      dialog.close();
      editor.querySelector('[data-edit-save]')?.click();
    };
    dialog.oncancel=()=>{back();};
    dialog.showModal();big.focus();
  }
  // In-place editing of one supplement box (developer mode only).
  async function handleEdit(button,current){
    const box=button.closest('.comorbidity-box');if(!box)return;
    if(button.dataset.editBox){
      if(!isEditor()||editing)return;
      const key=button.dataset.editBox,[kind,id,field]=key.split(':');
      const text=kind==='x'?(getExam(id)?examText(getExam(id),field):''):(get(id)?textOf(get(id),field):'');
      editing=key;
      const para=box.querySelector('p');
      const editor=document.createElement('div');editor.className='supplement-editor';
      editor.innerHTML='<label class="supplement-editor-label">编辑内容（保存后所有访问者都会看到）<textarea rows="7" data-edit-text></textarea></label>'+
        '<div class="supplement-editor-actions"><button class="btn primary" type="button" data-edit-save="'+key+'">保存</button>'+
        (overrides()[key]?'<button class="btn ghost" type="button" data-edit-reset="'+key+'">恢复默认</button>':'')+
        '<button class="btn ghost" type="button" data-edit-cancel="'+key+'">取消</button>'+
        '<button class="btn ghost supplement-expand-btn" type="button" data-edit-expand="'+key+'">放大编辑</button></div>'+
        '<p class="supplement-editor-status" role="status" aria-live="polite"></p>';
      editor.querySelector('textarea').value=text;
      para.replaceWith(editor);
      editor.querySelector('textarea').focus();
      return;
    }
    const editor=box.querySelector('.supplement-editor');
    const status=editor?.querySelector('.supplement-editor-status');
    if(button.dataset.editExpand){openExpanded(box,editor);return;}
    const finish=()=>{editing=null;drawn='';redraw();};
    if(button.dataset.editCancel){finish();return;}
    try{
      if(button.dataset.editSave){
        const value=editor.querySelector('textarea').value;
        if(!value.trim()){status.textContent='内容不能为空；如需还原请点“恢复默认”。';return;}
        button.disabled=true;status.textContent='正在保存…';
        await root.HAJIMI_CMS.saveSupplement(button.dataset.editSave,value);
        finish();current.status.textContent='已保存修改，修改前资料已自动备份';
      }else if(button.dataset.editReset){
        if(typeof confirm==='function'&&!confirm('恢复系统默认内容？修改前资料会自动备份。'))return;
        button.disabled=true;status.textContent='正在恢复…';
        await root.HAJIMI_CMS.saveSupplement(button.dataset.editReset,null);
        finish();current.status.textContent='已恢复默认内容';
      }
    }catch(error){
      button.disabled=false;
      if(status)status.textContent='保存失败：'+(error?.message||'请稍后重试')+'。内容未丢失，可复制后刷新页面再试。';
    }
  }
  function bind(){
    const panel=document.getElementById('comorbidityPanel');
    const side=document.getElementById('comorbiditySide');
    if(!panel||!side){view=null;return;}
    const q=selector=>side.querySelector(selector);
    view={
      side,workspace:side.closest?.('.case-workspace')||null,
      notes:q('#comorbidityNotes'),status:q('#comorbiditySelectionStatus'),copy:q('#copyComorbidities'),
      tabs:[...side.querySelectorAll('[data-comorbidity-stage]')],
      followText:q('#comorbidityFollowText'),followButton:q('#comorbidityFollow'),
      fab:document.getElementById('openComorbiditySide'),fabCount:document.getElementById('comorbidityFabCount')
    };
    const current=view;
    panel.querySelectorAll('[data-comorbidity]').forEach(input=>input.addEventListener('change',()=>{
      if(input.checked)chosen.add(input.dataset.comorbidity);
      else chosen.delete(input.dataset.comorbidity);
      redraw();
    }));
    panel.querySelector('#clearComorbidities').addEventListener('click',()=>{
      chosen.clear();
      panel.querySelectorAll('[data-comorbidity]').forEach(input=>{input.checked=false;});
      redraw();
    });
    const examPanel=document.getElementById('specialExamPanel');
    if(examPanel){
      examPanel.querySelectorAll('[data-exam]').forEach(input=>input.addEventListener('change',()=>{
        if(input.checked)exams.add(input.dataset.exam);
        else exams.delete(input.dataset.exam);
        redraw();
      }));
      examPanel.querySelector('#clearExams')?.addEventListener('click',()=>{
        exams.clear();
        examPanel.querySelectorAll('[data-exam]').forEach(input=>{input.checked=false;});
        redraw();
      });
    }
    current.tabs.forEach(tab=>tab.addEventListener('click',()=>{
      stage=tab.dataset.comorbidityStage;follow=false;redraw();
    }));
    current.followButton.addEventListener('click',()=>{follow=true;stage=stageFor(chapter);redraw();});
    current.fab.addEventListener('click',()=>setOpen(true));
    q('#closeComorbiditySide').addEventListener('click',()=>setOpen(false));
    side.addEventListener('keydown',event=>{if(event.key==='Escape'&&sheetOpen)setOpen(false);});
    current.notes.addEventListener('click',async event=>{
      const edit=event.target?.closest?.('[data-edit-box],[data-edit-save],[data-edit-reset],[data-edit-cancel],[data-edit-expand]');
      if(edit){await handleEdit(edit,current);return;}
      const button=event.target?.closest?.('[data-copy-box]');
      if(!button)return;
      const [id,field]=button.dataset.copyBox.split(':');
      const ok=await copyValue(boxText(id,field));
      current.status.textContent=ok?'已复制：'+boxLabel(id,field):'复制失败，请核对浏览器权限';
    });
    current.copy.addEventListener('click',async()=>{
      const value=separateText();if(!value)return;
      const ok=await copyValue(value);
      current.status.textContent=ok?'已复制 '+(chosen.size+exams.size)+' 项补充资料':'复制失败，请核对浏览器权限';
    });
    // Each newly opened record starts by following its own chapters.
    sheetOpen=false;follow=true;stage=stageFor(chapter);drawn='';editing=null;
    redraw();
  }
  // Login, logout or a saved edit re-renders the boxes (edit buttons and wording).
  if(typeof root.addEventListener==='function')root.addEventListener('hajimi:supplements-changed',()=>{if(!editing){drawn='';redraw();}});
  root.HAJIMI_COMORBIDITIES=Object.freeze({
    modules,stages,compose,html,sideHtml,bind,setChapter,stageFor,renderSelected,separateText,boxText,
    selected:()=>[...chosen],selectedExams:()=>[...exams],stage:()=>stage
  });
})(typeof window!=='undefined'?window:globalThis);
