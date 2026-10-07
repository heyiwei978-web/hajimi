(function(){
  if(typeof templates==='undefined'||!Array.isArray(templates)||!window.HAJIMI_IDEAL_CASES||!window.HAJIMI_IDEAL_CASES.seeds)return;
  var seeds=window.HAJIMI_IDEAL_CASES.seeds;

  function profile(c){
    var n=Number(String(c.no||'0').slice(-2))||1;
    var female=c.sex==='女';
    return {
      t:(36.4+(n%4)*0.1).toFixed(1),
      p:70+(n%7)*2,
      r:16+(n%3),
      sbp:118+(n%8)*2,
      dbp:72+(n%6)*2,
      wbc:(5.9+(n%7)*0.23).toFixed(1),
      neut:(58.0+(n%8)*1.1).toFixed(1),
      hb:(female?130:143)+(n%5),
      plt:218+(n%7)*5,
      crp:(1.8+(n%6)*0.45).toFixed(1),
      glu:(4.7+(n%6)*0.12).toFixed(1),
      postopT:(36.5+(n%4)*0.1).toFixed(1),
      postopP:76+(n%6)*2,
      postopSbp:118+(n%7)*2,
      postopDbp:70+(n%5)*2
    };
  }

  function baselineLab(c){
    var x=profile(c);
    return '血常规：WBC '+x.wbc+'×10^9/L，N '+x.neut+'%，Hb '+x.hb+'g/L，PLT '+x.plt+'×10^9/L；CRP '+x.crp+'mg/L。肝功能、肾功能、电解质及凝血功能未见明显异常，空腹血糖'+x.glu+'mmol/L。心电图示窦性心律，未见明显异常。';
  }

  function admissionDiff(c){
    if(c.group==='TKA')return '鉴别诊断：类风湿性关节炎目前缺乏多关节对称受累、长期晨僵及相关实验室依据；感染性关节炎无发热、窦道及炎症指标升高；痛风性关节炎无反复急性红肿热痛发作史。结合负重位X线退变及病程，支持原发性膝骨性关节炎。';
    if(c.group==='THA')return '鉴别诊断：原发性髋骨关节炎通常以关节间隙退变为主，本例影像以股骨头坏死、塌陷为主要改变；感染性髋关节炎后遗症缺乏既往感染、窦道及炎症指标异常；影像未见股骨颈陈旧骨折。';
    if(c.group==='人工股骨头置换')return '鉴别诊断：影像未见转子间骨折线，股骨头仍位于髋臼内，排除髋关节脱位；骨折区未见溶骨性破坏或其他病理性骨折表现。';
    return '鉴别诊断：结合受伤机制、查体及影像，未见同部位关节脱位或病理性骨质破坏；患肢末梢神经血管状态正常，目前无明确伴发神经血管损伤证据。';
  }

  function rehabNext(c){
    var g=c.group;
    if(g==='TKA')return '继续记录膝关节主动ROM、股四头肌力量及助行器步行距离，出院后重点保持完全伸直并逐步提高屈曲及步行耐力。';
    if(g==='THA'||g==='人工股骨头置换')return '继续提高床椅转移和助行器步行独立性，保持臀肌/股四头肌训练并严格执行髋关节脱位预防，门诊根据影像及功能调整辅助器具。';
    if(['股骨转子间骨折','股骨大粗隆骨折','股骨干骨折','胫骨干骨折','骨盆骨折'].includes(g))return '继续量化记录患肢肌力、转移能力、步行距离及实际负重级别，后续依据疼痛和骨折复查影像逐步调整负重。';
    if(g==='胫骨平台骨折')return '继续记录膝关节ROM、股四头肌力量和床椅转移能力，保持非负重，达到约90°屈曲后在不增加肿胀的前提下维持训练，负重待复查决定。';
    if(g==='踝关节三踝骨折'||g==='跟骨骨折')return '继续监测足踝肿胀、切口及末梢循环，保持非负重并逐步增加允许范围内踝足活动，待复查确认愈合后再调整负重。';
    if(g==='髌骨骨折')return '继续记录支具设定范围、膝屈曲ROM及股四头肌功能，按固定稳定性逐步增加屈膝角度，同时保持伸膝位保护下步行。';
    if(g==='桡骨头骨折')return '继续量化肘屈伸及前臂旋前旋后角度，逐步扩大无痛活动范围，保持无机械阻挡并避免上肢轴向负荷。';
    if(g==='桡骨远端骨折'||g==='尺桡骨干骨折')return '继续记录手部肿胀、腕肘活动及前臂旋转范围，重点保持手指全范围活动，并根据影像稳定性逐步增加腕/前臂训练。';
    if(g==='肱骨近端骨折'||g==='肱骨干骨折'||g==='锁骨骨折')return '继续记录肩肘活动范围和上肢神经功能，在保护内固定前提下逐步增加肩关节安全活动，暂不进行提重物和抗阻训练。';
    if(g==='掌骨骨折'||g==='指骨骨折')return '继续记录患指屈伸范围、旋转排列及肌腱滑动情况，在固定稳定前提下增加保护性活动频次，重点预防粘连和僵硬。';
    if(g==='跖骨骨折'||g==='趾骨骨折')return '继续记录足部肿胀、趾活动及实际负重方式，保持当前保护措施，待复查显示骨折稳定愈合后再逐步恢复正常步态。';
    return '继续量化记录患肢活动度、肌力和日常功能，根据影像及临床恢复调整下一阶段康复。';
  }

  templates.forEach(function(t){
    var c=seeds[t.group];
    if(!c||!t.sourceBody)return;
    var b=String(t.sourceBody),x=profile(c);

    b=b.replace(
      /血常规：WBC 6\.8×10\^9\/L，N 62\.1%，Hb (?:145|132)g\/L，PLT 236×10\^9\/L；CRP 4\.2mg\/L。肝功能、肾功能、电解质及凝血功能未见明显异常，空腹血糖5\.0mmol\/L。心电图示窦性心律，未见明显异常。/g,
      baselineLab(c)
    );

    if(t.short==='入院记录'){
      b=b.replace(
        /T 36\.6℃，P 76次\/分，R 18次\/分，BP 126\/78mmHg。/,
        'T '+x.t+'℃，P '+x.p+'次/分，R '+x.r+'次/分，BP '+x.sbp+'/'+x.dbp+'mmHg。'
      );
      b=b.replace(
        /鉴别诊断：[\s\S]*?\n\n诊疗计划：/,
        admissionDiff(c)+'\n\n诊疗计划：'
      );
    }

    if(t.short==='术后首次病程记录'){
      b=b.replace(
        /T 36\.7℃，P 80次\/分，R 18次\/分，BP 124\/76mmHg，SpO₂ 98%/,
        'T '+x.postopT+'℃，P '+x.postopP+'次/分，R 18次/分，BP '+x.postopSbp+'/'+x.postopDbp+'mmHg，SpO₂ 98%'
      );
    }

    if(/^术后第\d+天病程$/.test(t.short)&&!['TKA','THA','人工股骨头置换','股骨转子间骨折','股骨大粗隆骨折','股骨干骨折','胫骨干骨折','胫骨平台骨折','踝关节三踝骨折','跟骨骨折','髌骨骨折','跖骨骨折','趾骨骨折','骨盆骨折'].includes(c.group)){
      b=b.replace(
        /2\. 卧床并发症及VTE预防：当前无额外高危因素，鼓励尽早离床及未受限关节主动活动；动态评估VTE风险，风险因素变化时及时调整预防策略。/,
        '2. 活动与肿胀管理：患者全身活动能力未受明显限制，鼓励正常离床活动；患肢抬高并进行未受限关节主动活动，以减轻肿胀并预防关节僵硬。'
      );
    }

    if(t.short==='康复评估与训练记录'){
      b=b.replace(
        /五、下一阶段计划\n[\s\S]*?\n\n医师签名：/,
        '五、下一阶段计划\n'+rehabNext(c)+'\n\n医师签名：'
      );
    }

    t.sourceBody=b;
    t.qualityV13=true;
  });

  var issues=[];
  templates.forEach(function(t){
    var b=String(t.sourceBody||'');
    if(/WBC 6\.8×10\^9\/L，N 62\.1%/.test(b))issues.push(t.group+' / '+t.short+'：仍使用全站统一术前化验值');
    if(/^术后第\d+天病程$/.test(t.short)&&['桡骨远端骨折','桡骨头骨折','肱骨近端骨折','肱骨干骨折','锁骨骨折','尺桡骨干骨折','掌骨骨折','指骨骨折'].includes(t.group)&&/VTE预防/.test(b))issues.push(t.group+' / '+t.short+'：低风险上肢病例仍模板化写VTE预防');
    if(t.short==='康复评估与训练记录'&&/步行距离\/辅助器具/.test(b))issues.push(t.group+'：康复下一阶段计划仍泛化');
  });
  window.HAJIMI_RECORD_QUALITY_V13={enabled:true,issues:issues};
})();