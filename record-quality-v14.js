(function(){
  if(typeof templates==='undefined'||!Array.isArray(templates)||!window.HAJIMI_IDEAL_CASES||!window.HAJIMI_IDEAL_CASES.seeds)return;
  var seeds=window.HAJIMI_IDEAL_CASES.seeds;
  var upperLow=['桡骨远端骨折','桡骨头骨折','肱骨近端骨折','肱骨干骨折','锁骨骨折','尺桡骨干骨折','掌骨骨折','指骨骨折'];

  function upperFunction(c,day){
    var g=c.group,s=c.side||'右';
    if(g==='桡骨头骨折'){
      var rom={1:['30°～100°','45°/45°'],2:['20°～110°','60°/60°'],3:['10°～120°','70°/70°'],5:['5°～125°','75°/75°']}[day]||['10°～120°','70°/70°'];
      return s+'肘保护性屈伸约'+rom[0]+'，前臂旋前/旋后约'+rom[1]+'；活动过程中无明显机械阻挡，腕部及远端尺桡关节无新发疼痛，正中、尺、桡神经功能正常。';
    }
    if(g==='肱骨近端骨折'){
      var f={1:60,2:75,3:90,5:100}[day]||90;
      return s+'肩完成钟摆训练及被动前屈约'+f+'°，手指、腕、肘主动活动良好；腋神经支配区感觉正常，三角肌可收缩，训练后疼痛可耐受。';
    }
    if(g==='桡骨远端骨折'){
      return s+'手指可完全屈伸，拇指对掌良好，手背肿胀较前减轻；腕部在固定保护下进行轻柔活动，正中神经支配区感觉正常。';
    }
    if(g==='肱骨干骨折'){
      return s+'肩、肘、腕及手指进行允许范围内主动活动；腕背伸、伸指及拇指背伸有力，虎口背侧感觉正常，未见桡神经功能异常。';
    }
    if(g==='锁骨骨折'){
      return s+'手、腕、肘主动活动良好，肩关节完成钟摆及轻柔主动辅助活动；桡动脉搏动良好，上肢末梢感觉及运动正常。';
    }
    if(g==='尺桡骨干骨折'){
      return s+'手指屈伸及腕肘活动良好，前臂在固定保护下逐步开展旋前旋后训练；正中、尺、桡神经感觉运动正常。';
    }
    if(g==='掌骨骨折'||g==='指骨骨折'){
      return '患手抬高后肿胀减轻，未限制关节主动屈伸良好，指端毛细血管充盈正常；患指屈伸轨迹及旋转排列满意，无交叉畸形。';
    }
    return '';
  }

  templates.forEach(function(t){
    var c=seeds[t.group];
    if(!c||!t.sourceBody)return;
    var b=String(t.sourceBody);

    if(upperLow.includes(c.group)&&/^术后第\d+天病程$/.test(t.short)){
      var day=Number((t.short.match(/术后第(\d+)天病程/)||[])[1]||1);

      b=b.replace(
        /2\. 卧床并发症及VTE预防：[^\n]+/,
        '2. 活动与肿胀管理：患者全身活动能力未受明显限制，鼓励正常离床活动；患肢抬高并进行未受限关节主动活动，以减轻肿胀并预防关节僵硬。'
      );
      b=b.replace(
        /3\. 卧床并发症及VTE预防：[^\n]+/,
        '3. 活动与肿胀管理：患者全身活动能力未受明显限制，鼓励正常离床活动；患肢抬高并进行未受限关节主动活动，以减轻肿胀并预防关节僵硬。'
      );

      if(day===1){
        b=b.replace(
          '已开始床上主动活动/早期康复，饮食可，大小便正常。',
          '已开始正常离床活动及患肢保护性功能训练，饮食可，大小便正常。'
        );
      }

      var f=upperFunction(c,day);
      if(f)b=b.replace(/康复进展：[^\n]+/,'康复进展：'+f);
    }

    if(upperLow.includes(c.group)&&t.short==='多学科术前讨论'){
      b=b.replace(
        '术后根据具体风险进行神经血管观察、VTE预防及分阶段康复。',
        '术后重点进行患肢神经血管观察、肿胀管理、正常离床活动及分阶段上肢功能训练。'
      );
    }

    if(upperLow.includes(c.group)&&t.short==='康复评估与训练记录'){
      var dayGuess=3;
      var sd=(b.match(/手术日期：(\d{4}-\d{2}-\d{2})/)||[])[1];
      var rd=(b.match(/记录时间：(\d{4}-\d{2}-\d{2})/)||[])[1];
      if(sd&&rd)dayGuess=Math.max(1,Math.round((Date.parse(rd+'T00:00:00Z')-Date.parse(sd+'T00:00:00Z'))/86400000));
      var ff=upperFunction(c,dayGuess);
      if(ff)b=b.replace(/当前功能：[^\n]+/,'当前功能：'+ff);
    }

    t.sourceBody=b;
    t.qualityV14=true;
  });

  var issues=[];
  templates.forEach(function(t){
    var b=String(t.sourceBody||'');
    if(upperLow.includes(t.group)&&/^术后第\d+天病程$/.test(t.short)&&/VTE预防/.test(b))issues.push(t.group+' / '+t.short+'：低风险上肢日常病程仍写VTE预防');
    if(upperLow.includes(t.group)&&t.short==='多学科术前讨论'&&/VTE预防/.test(b))issues.push(t.group+'：低风险上肢术前讨论仍模板化写VTE预防');
    if(upperLow.includes(t.group)&&/^术后第1天病程$/.test(t.short)&&/床上主动活动\/早期康复/.test(b))issues.push(t.group+'：上肢病例POD1活动表述不合理');
  });
  window.HAJIMI_RECORD_QUALITY_V14={enabled:true,issues:issues};
})();