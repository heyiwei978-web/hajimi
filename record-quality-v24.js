(function(){
  if(typeof templates==='undefined'||!Array.isArray(templates)||!window.HAJIMI_IDEAL_CASES||!window.HAJIMI_IDEAL_CASES.seeds)return;
  var seeds=window.HAJIMI_IDEAL_CASES.seeds;
  function expanded(c){return !!(c&&c.category);}
  function softNoRoutineXray(c){
    if(!c)return false;
    if(c.category==='手外科'&&!/骨不连|骨折|内生软骨瘤/.test(c.group+c.diagnosis))return true;
    if(c.category==='运动医学'&&!/截骨|骨软骨|骨折|重建术后需要骨道|髌骨/.test(c.group+c.surgery+c.diagnosis))return true;
    if(c.category==='足踝外科'&&!/融合|截骨|骨软骨/.test(c.group+c.surgery+c.diagnosis))return true;
    return false;
  }
  function dischargeImaging(c){
    var g=c.group;
    if(softNoRoutineXray(c))return '住院期间未常规追加骨性影像检查：本术式主要评价软组织修复、神经松解或关节镜处理效果，患者切口、疼痛、神经血管及功能恢复符合预期，无新增骨性症状或内植物位置疑虑；后续根据临床恢复及术式节点决定是否检查。';
    if(c.category==='脊柱外科'){
      if(/椎体后凸成形/.test(c.surgery))return '术后腰椎正侧位X线示L2椎体骨水泥分布满意，未见明显椎管内渗漏及新的椎体塌陷。';
      if(/侧弯|矫形/.test(g+c.surgery))return '术后站立/卧位全脊柱影像示冠状位及矢状位序列较术前改善，内固定连续完整，未见明显螺钉移位或断裂。';
      return '术后责任节段正侧位X线示脊柱序列及内固定/融合器位置符合预期，未见明显继发移位或内植物异常。';
    }
    if(c.category==='骨肿瘤与骨病'){
      if(/骨肉瘤|尤文|软骨肉瘤|骨旁骨肉瘤/.test(g))return '术后影像示肿瘤切除范围及骨/假体重建位置符合预期，内固定或肿瘤型假体稳定；后续以最终病理切缘及肿瘤分期随访为主。';
      return '术后相应部位影像示病灶刮除/切除及骨缺损重建位置符合预期，未见急性病理骨折或内固定异常。';
    }
    if(c.category==='骨感染')return '术后影像结合感染病灶清除范围评估未见新的骨性破坏或固定失败；感染控制以体温、切口/引流、炎症指标及培养结果的动态变化为主要依据。';
    if(c.category==='关节置换'){
      if(/感染/.test(c.diagnosis))return '术后关节影像示保留或翻修假体组件位置稳定，无急性脱位及假体周围骨折；感染控制继续结合培养、炎症指标及切口情况评估。';
      if(/骨折/.test(c.diagnosis))return '术后影像示假体周围骨折复位、辅助钢板/翻修柄位置及关节对位符合预期，未见继发移位。';
      return '术后关节影像示假体或翻修组件位置、力线及关节对位符合预期，未见急性脱位及假体周围骨折。';
    }
    return '术后相应部位影像示手术处理结果符合预期，未见需要调整治疗方案的明显异常。';
  }
  function vteText(c){
    var s=(c.group+' '+c.diagnosis+' '+c.surgery);
    var high=c.category==='关节置换'||c.category==='脊柱外科'||/股骨|胫骨|骨盆|骶骨|髋臼|膝关节脱位|Pilon/.test(s);
    if(high)return 'VTE风险评估：本例因下肢/骨盆/脊柱手术及术后活动受限属于需重点评估人群；在确认止血稳定后按院内VTE路径选择药物及机械预防，并结合踝泵、早期安全活动，每日复评出血风险和活动水平。';
    if(c.category==='手外科'||/肩|肘|腕|手|锁骨|肱骨|尺骨|桡骨/.test(s))return 'VTE风险评估：患者全身活动能力基本保留，无既往VTE、恶性肿瘤等新增高危因素；以早期正常离床活动及未受限关节主动活动为主，住院期间动态评估风险变化，不机械使用药物预防。';
    return 'VTE风险评估：根据手术部位、活动受限程度及个体危险因素动态分层，基础措施包括早期安全活动和踝泵；是否采用药物或机械预防按院内路径和出血风险决定。';
  }

  templates.forEach(function(t){
    var c=seeds[t.group];
    if(!expanded(c)||!t.sourceBody)return;
    var b=String(t.sourceBody);

    if(t.short==='术前小结'&&!b.includes('VTE风险评估：')){
      b=b.replace(/围手术期风险评估：\n/,'围手术期风险评估：\n'+vteText(c)+'\n');
    }

    if(t.short==='影像复查及结果分析'){
      if(softNoRoutineXray(c)){
        b=b.replace(/检查结果：[\s\S]*?结果分析：[\s\S]*/,'检查结果：住院期间未常规追加DR/CT。\n\n结果分析：'+dischargeImaging(c));
      }else{
        b=b.replace(/检查结果：[^\n]+/,'检查结果：'+dischargeImaging(c));
      }
    }

    if(t.short==='出院小结'){
      b=b.replace(/术后复查影像：[^\n]+/,'术后影像/检查评估：'+dischargeImaging(c));
      b=b.replace(/术后复查DR示[^\n]+/,'术后影像/检查评估：'+dischargeImaging(c));
      if(softNoRoutineXray(c)){
        b=b.replace(/4\. 随访计划：[^\n]+/,'4. 随访计划：术后10～14天复查切口及功能；后续按照软组织修复、神经恢复或关节镜术式的康复节点复诊，仅在出现异常疼痛、再损伤或功能恢复不符合预期时针对性安排影像。');
      }
      if(c.category==='骨肿瘤与骨病'){
        b=b.replace(/4\. 随访计划：[^\n]+/,'4. 随访计划：根据最终病理性质、切缘和分期制定随访；恶性或局部侵袭性病变按骨肿瘤MDT计划复查局部影像、胸部影像及必要的全身评估。');
      }
      if(c.category==='骨感染'){
        b=b.replace(/4\. 随访计划：[^\n]+/,'4. 随访计划：复查切口、体温、CRP/ESR及培养结果，根据病原学和临床反应调整抗感染疗程；出现窦道、持续渗液、发热或疼痛加重及时复诊。');
      }
    }

    b=b.replace(/固定\/重建植入物/g,'固定或重建植入物');
    b=b.replace(/关节镜\/直视/g,'关节镜或直视');
    b=b.replace(/神经根\/脊髓/g,'神经根或脊髓');
    b=b.replace(/支具\/保护/g,'支具保护');
    b=b.replace(/负重\/非负重/g,'规定负重级别');

    t.sourceBody=b;
    t.qualityV24=true;
  });

  var issues=[];
  templates.forEach(function(t){
    var c=seeds[t.group],b=String(t.sourceBody||'');
    if(!expanded(c))return;
    if(softNoRoutineXray(c)&&/骨折复位满意|内固定位置及长度合适/.test(b))issues.push(t.group+' / '+t.short+'：软组织手术仍套骨折影像结果');
    if(c.category==='骨肿瘤与骨病'&&t.short==='出院小结'&&!/病理/.test(b))issues.push(t.group+'：肿瘤出院随访缺病理节点');
    if(c.category==='骨感染'&&t.short==='出院小结'&&!/(培养|CRP|ESR)/.test(b))issues.push(t.group+'：感染出院随访缺病原/炎症指标');
    if(/固定\/重建植入物|关节镜\/直视|神经根\/脊髓/.test(b))issues.push(t.group+' / '+t.short+'：残留模板斜杠表达');
  });
  window.HAJIMI_RECORD_QUALITY_V24={enabled:true,issues:issues};
})();