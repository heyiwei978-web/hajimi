(function(){
  if(typeof templates==='undefined'||!Array.isArray(templates)||!window.HAJIMI_IDEAL_CASES||!window.HAJIMI_IDEAL_CASES.seeds)return;
  var seeds=window.HAJIMI_IDEAL_CASES.seeds;
  var upperLow=['桡骨远端骨折','桡骨头骨折','肱骨近端骨折','肱骨干骨折','锁骨骨折','尺桡骨干骨折','掌骨骨折','指骨骨折'];
  var highVTE=['TKA','THA','人工股骨头置换','股骨转子间骨折','股骨干骨折','胫骨干骨折','胫骨平台骨折','骨盆骨折'];

  function woundFollow(c){
    var g=c.group;
    if(g==='跟骨骨折'||g==='踝关节三踝骨折'||g==='胫骨平台骨折')return '术后约14～21天复查切口，根据软组织消肿及愈合情况决定拆线；如切口仍有明显肿胀、张力或渗出则延后拆线。';
    if(g==='掌骨骨折'||g==='指骨骨折'||g==='跖骨骨折'||g==='趾骨骨折'||g==='桡骨头骨折'||g==='桡骨远端骨折')return '术后约10～14天复查切口，根据愈合情况拆线并同时评估早期关节活动。';
    return '术后约12～14天复查切口，根据愈合情况拆线。';
  }

  function exerciseOnly(c){
    var g=c.group;
    if(g==='TKA')return '每日继续踝泵、股四头肌等长收缩和直腿抬高，分次进行膝关节主动及被动屈伸训练，记录ROM及训练后肿胀变化。';
    if(g==='THA'||g==='人工股骨头置换')return '每日进行踝泵、股四头肌及臀肌等长收缩，练习安全床椅转移和步行，逐步增加步行耐力。';
    if(g==='股骨转子间骨折'||g==='股骨干骨折'||g==='骨盆骨折'||g==='股骨大粗隆骨折')return '继续踝泵、股四头肌及臀肌等长收缩，练习床椅转移和助行器步行，保持膝踝关节活动。';
    if(g==='胫骨干骨折')return '继续踝泵、股四头肌及膝踝关节主动活动，进行下肢肌力和步态训练。';
    if(g==='胫骨平台骨折')return '继续踝泵、股四头肌等长收缩和支具保护下膝关节屈伸训练，重点维持完全伸膝并逐步增加屈膝活动度。';
    if(g==='踝关节三踝骨折'||g==='跟骨骨折')return '继续抬高消肿、足趾活动及允许范围内踝足关节主动活动，维持膝关节和髋关节活动。';
    if(g==='髌骨骨折')return '继续踝泵、股四头肌等长收缩及支具保护下分阶段屈膝训练，保持完全伸膝能力。';
    if(g==='桡骨远端骨折')return '继续手指全范围主动屈伸、拇指对掌及抬高消肿，按复诊计划逐步增加腕关节屈伸和前臂旋转训练。';
    if(g==='桡骨头骨折')return '每日多次进行保护性肘屈伸及前臂旋前旋后训练，同时保持手指、腕关节全范围活动，记录有无机械阻挡。';
    if(g==='肱骨近端骨折')return '继续手、腕、肘主动活动以及肩关节钟摆、被动和主动辅助训练，逐步增加肩前屈范围。';
    if(g==='肱骨干骨折'||g==='锁骨骨折')return '继续手、腕、肘主动活动和肩关节安全范围内活动，逐步增加日常生活中的轻量功能使用。';
    if(g==='尺桡骨干骨折')return '继续手指、腕、肘活动，在固定稳定前提下逐步增加前臂旋前旋后训练。';
    if(g==='掌骨骨折'||g==='指骨骨折')return '继续患手抬高、未受限关节主动活动和患指保护性屈伸，重点保持正确屈伸轨迹及肌腱滑动。';
    if(g==='跖骨骨折'||g==='趾骨骨折')return '继续足部抬高、足趾主动活动及允许范围内踝关节活动，维持小腿肌群收缩。';
    return '继续住院期间已掌握的患肢肌力和关节活动训练。';
  }

  function vteDischarge(c){
    if(!highVTE.includes(c.group))return '';
    return '5. VTE预防：继续按出院抗凝处方及院内路径完成预防疗程，并坚持踝泵和安全离床活动；如出现牙龈/鼻腔持续出血、黑便、血尿、切口渗血明显增加或其他异常出血，及时就诊并评估抗凝方案。\n';
  }

  templates.forEach(function(t){
    var c=seeds[t.group];
    if(!c||!t.sourceBody)return;
    var b=String(t.sourceBody);

    if(t.short==='入院记录'){
      var p=(b.match(/P (\d+)次\/分/)||[])[1];
      if(p)b=b.replace(/心率\d+次\/分/,'心率'+p+'次/分');
    }

    if(t.short==='出院小结'){
      b=b.replace(/1\. [^\n]+/,'1. 切口管理：'+woundFollow(c));
      b=b.replace(/2\. 居家康复：[^\n]+/,'2. 居家康复：'+exerciseOnly(c));

      if(upperLow.includes(c.group)){
        b=b.replace('住院期间未出现切口感染、VTE相关临床事件、神经血管损伤及其他需要延长住院处理的术后并发症。','住院期间未出现切口感染、神经血管损伤、进行性肿胀及其他需要延长住院处理的术后并发症。');
      }

      if(highVTE.includes(c.group)&&!b.includes('5. VTE预防：')){
        b=b.replace(
          /5\. 如出现切口红肿渗液、持续发热、患肢进行性肿胀、麻木无力、明显疼痛加重或胸闷气促，及时就诊。/,
          vteDischarge(c)+'6. 异常情况：如出现切口红肿渗液、持续发热、患肢进行性肿胀或疼痛突然加重、麻木无力、胸闷气促等情况，及时就诊。'
        );
      }else{
        b=b.replace(
          /5\. 如出现切口红肿渗液、持续发热、患肢进行性肿胀、麻木无力、明显疼痛加重或胸闷气促，及时就诊。/,
          '5. 异常情况：如出现切口红肿渗液、持续发热、患肢进行性肿胀、麻木无力或明显疼痛加重，及时就诊；如出现胸闷气促等全身不适亦应立即就医。'
        );
      }
    }

    t.sourceBody=b;
    t.qualityV17=true;
  });

  var issues=[];
  templates.forEach(function(t){
    var b=String(t.sourceBody||'');
    if(t.short==='入院记录'){
      var p=(b.match(/P (\d+)次\/分/)||[])[1];
      var hr=(b.match(/心率(\d+)次\/分/)||[])[1];
      if(p&&hr&&p!==hr)issues.push(t.group+'：入院脉搏与心率不一致');
    }
    if(t.short==='出院小结'&&/2\. 居家康复：[^\n]*(避免|非负重|提重物|负重限制)/.test(b))issues.push(t.group+'：居家康复和活动限制仍有重复');
    if(upperLow.includes(t.group)&&t.short==='出院小结'&&/VTE相关临床事件/.test(b))issues.push(t.group+'：低风险上肢出院经过仍写VTE事件');
    if(highVTE.includes(t.group)&&t.short==='出院小结'&&!/VTE预防：/.test(b))issues.push(t.group+'：高VTE风险病例出院医嘱缺持续预防');
  });
  window.HAJIMI_RECORD_QUALITY_V17={enabled:true,issues:issues};
})();