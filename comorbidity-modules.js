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
  const get=id=>modules.find(item=>item.id===id);
  function section(record){
    if(!record||record.specialCase||record.department!=='骨科'||record.group==='通用场景')return '';
    const title=String(record.short||record.name||'');
    const kind=String(record.type||'');
    if(/手术记录|手术安全核查|手术清点|麻醉记录|同意书|知情同意|选择治疗方案|手术谈话|麻醉术后访视/.test(title+' '+kind))return '';
    if(/会诊申请/.test(title+' '+kind))return 'consult';
    if(/会诊回报/.test(title+' '+kind))return '';
    if(/出院/.test(title))return 'discharge';
    if(record.stage==='术后' && /病程|查房|康复|护理|复查|评估/.test(title+' '+kind))return 'postop';
    if(/术前讨论|术前小结|术前.*查房|主刀.*查房|术前访视/.test(title))return 'preop';
    if(record.stage==='术前' && /查房|病程|评估/.test(title+' '+kind))return 'preop';
    if(record.stage==='入院' && /入院|病程|查房|首次/.test(title+' '+kind))return 'history';
    return '';
  }
  function compose(record,original){
    const category=section(record);
    const snippets=category?[...chosen].map(get).filter(Boolean).map(item=>item.name+'：'+item[category]).filter(line=>!line.endsWith('undefined')):[];
    if(!snippets.length)return original;
    const supplementary='合并慢性病评估与处理（须根据患者实际资料逐项核实）：'+snippets.join(' ');
    const signature=/\n\n医师签名：/;
    if(/病程|查房/.test(String(record.short||''))&&signature.test(original)){
      return String(original).replace(signature,' '+supplementary+'\n\n医师签名：');
    }
    return String(original)+'\n\n【合并慢性病补充（使用前逐项核实）】\n'+snippets.join('\n');
  }
  function html(){
    return '<section id="comorbidityPanel" class="comorbidity-panel" aria-labelledby="comorbidityTitle">'+
      '<div class="comorbidity-head"><div><span class="case-file-eyebrow">OPTIONAL COMORBIDITIES</span><h3 id="comorbidityTitle">合并慢性病管理</h3>'+
      '<p>勾选患者已确诊的慢性病，在适用的入院、会诊、术前、术后及出院章节追加待核对补充内容；不更改原始模板、手术记录或特殊病例。</p></div>'+
      '<button id="clearComorbidities" class="btn ghost" type="button">清空选择</button></div>'+
      '<div class="comorbidity-grid">'+modules.map(item=>
        '<label class="comorbidity-choice"><input type="checkbox" data-comorbidity="'+item.id+'"'+(chosen.has(item.id)?' checked':'')+'><span>'+item.name+'</span></label>'
      ).join('')+'</div><div class="comorbidity-footer"><span id="comorbiditySelectionStatus" role="status">'+chosen.size+' 项已选择</span>'+
      '<span>检查结果、药物和手术时机均须依据真实情况确定；本模块仅作书写辅助。</span></div></section>';
  }
  function bind(refresh){
    const panel=document.getElementById('comorbidityPanel');
    if(!panel)return;
    panel.querySelectorAll('[data-comorbidity]').forEach(input=>input.addEventListener('change',()=>{
      if(input.checked)chosen.add(input.dataset.comorbidity);else chosen.delete(input.dataset.comorbidity);
      panel.querySelector('#comorbiditySelectionStatus').textContent=chosen.size+' 项已选择';
      refresh();
    }));
    const clear=panel.querySelector('#clearComorbidities');
    clear.addEventListener('click',()=>{
      chosen.clear();
      panel.querySelectorAll('[data-comorbidity]').forEach(input=>{input.checked=false;});
      panel.querySelector('#comorbiditySelectionStatus').textContent='0 项已选择';
      refresh();
    });
  }
  root.HAJIMI_COMORBIDITIES=Object.freeze({modules,section,compose,html,bind,selected:()=>[...chosen]});
})(typeof window!=='undefined'?window:globalThis);
