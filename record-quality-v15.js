(function(){
  if(typeof templates==='undefined'||!Array.isArray(templates)||!window.HAJIMI_IDEAL_CASES||!window.HAJIMI_IDEAL_CASES.seeds)return;
  var seeds=window.HAJIMI_IDEAL_CASES.seeds;

  function pod1Activity(c){
    var g=c.group;
    if(g==='TKA')return '已完成踝泵、股四头肌等长收缩及直腿抬高训练，并在助行器保护下开始床旁站立及短距离行走，饮食可，大小便正常。';
    if(g==='THA'||g==='人工股骨头置换')return '已完成踝泵、臀肌及股四头肌等长收缩，并在助行器保护下开始床边坐起、站立及短距离行走，饮食可，大小便正常。';
    if(['股骨转子间骨折','股骨大粗隆骨折','股骨干骨折','骨盆骨折'].includes(g))return '已开始踝泵及下肢等长收缩，并在协助下完成床边坐起和床椅转移训练，严格遵守当前负重级别，饮食可，大小便正常。';
    if(g==='胫骨干骨折')return '已开始踝泵、股四头肌及膝踝关节主动活动，并在助行器保护下进行规定负重级别的床椅转移训练，饮食可，大小便正常。';
    if(g==='胫骨平台骨折')return '已开始踝泵、股四头肌等长收缩及支具保护下膝关节活动，并在保持患肢非负重前提下进行床椅转移训练，饮食可，大小便正常。';
    if(g==='踝关节三踝骨折'||g==='跟骨骨折')return '已开始患肢抬高、足趾主动活动及床椅转移训练，患肢保持非负重，饮食可，大小便正常。';
    if(g==='髌骨骨折')return '已开始踝泵、股四头肌等长收缩及支具保护下直腿抬高训练，并在伸膝位支具保护下开始站立，饮食可，大小便正常。';
    if(g==='跖骨骨折'||g==='趾骨骨折')return '已开始患足抬高、足趾主动活动及保护性转移训练，严格遵守当前足部负重限制，饮食可，大小便正常。';
    return '已开始患肢保护性功能训练并保持正常离床活动，饮食可，大小便正常。';
  }

  function neuroStatus(c){
    var g=c.group,s=c.side||'右';
    if(['TKA','胫骨平台骨折','胫骨干骨折','踝关节三踝骨折','跟骨骨折','髌骨骨折','跖骨骨折','趾骨骨折'].includes(g))return s+'足背及胫后动脉搏动良好，足趾毛细血管充盈正常，足趾屈伸及踝背伸/跖屈可，足背、足底感觉无明显异常。';
    if(['THA','人工股骨头置换','股骨转子间骨折','股骨大粗隆骨折','股骨干骨折','骨盆骨折'].includes(g))return '患肢长度及旋转位置无新发异常，足背及胫后动脉搏动良好，踝背伸、跖屈及足趾活动可，腓总神经及胫神经支配区感觉正常。';
    if(g==='桡骨远端骨折')return s+'桡动脉搏动良好，拇指对掌及手指屈伸正常，正中神经支配区感觉正常。';
    if(g==='桡骨头骨折')return s+'桡动脉搏动良好，腕背伸、伸指及拇指背伸可，正中、尺、桡神经感觉运动正常。';
    if(g==='肱骨近端骨折')return s+'桡动脉搏动良好，腋神经支配区感觉正常，三角肌可收缩，手指感觉及活动正常。';
    if(g==='肱骨干骨折')return s+'桡动脉搏动良好，腕背伸、伸指及拇指背伸有力，虎口背侧感觉正常，无桡神经功能障碍。';
    if(g==='锁骨骨折')return s+'桡动脉搏动良好，手指末梢循环正常，上肢主要神经支配区感觉及运动无明显异常。';
    if(g==='尺桡骨干骨折')return s+'桡动脉搏动良好，正中、尺、桡神经支配区感觉及手指屈伸功能正常。';
    if(g==='掌骨骨折'||g==='指骨骨折')return '患手指端毛细血管充盈良好，患指感觉及主动屈伸正常，无旋转交叉及进行性麻木。';
    return '患肢末梢神经血管状态正常。';
  }

  function finalFunction(c){
    var g=c.group,s=c.side||'右';
    if(g==='桡骨头骨折')return s+'肘保护性屈伸约5°～125°，前臂旋前/旋后约75°/75°，活动时无机械阻挡。';
    if(g==='肱骨近端骨折')return s+'肩可完成钟摆及主动辅助活动，被动前屈约100°，手腕肘活动良好。';
    if(g==='桡骨远端骨折')return s+'手指可完全屈伸，拇指对掌良好，手部肿胀明显减轻，腕关节已开始保护性活动。';
    if(g==='肱骨干骨折')return s+'肩肘腕手指活动较前改善，桡神经功能完整。';
    if(g==='锁骨骨折')return s+'手腕肘主动活动正常，肩关节可完成钟摆及轻柔主动辅助活动。';
    if(g==='尺桡骨干骨折')return s+'手指、腕肘活动良好，前臂旋转活动逐步恢复，三大神经功能正常。';
    if(g==='掌骨骨折'||g==='指骨骨折')return '患指屈伸轨迹良好，无交叉及旋转畸形，手部肿胀明显减轻。';
    return '';
  }

  templates.forEach(function(t){
    var c=seeds[t.group];
    if(!c||!t.sourceBody)return;
    var b=String(t.sourceBody);

    if(/^术后第1天病程$/.test(t.short)){
      b=b.replace(
        /已开始床上主动活动\/早期康复，饮食可，大小便正常。/,
        pod1Activity(c)
      );
    }

    if(/^术后第\d+天病程$/.test(t.short)){
      b=b.replace(
        new RegExp((c.side||'右')+'侧患肢末梢血运、感觉及主动运动正常。\\s*'),
        ''
      );
      if(/今日引流量已明显减少，切口无活动性渗血，拔除引流管后局部敷料清洁干燥。/.test(b)&&/符合拔管条件，今日拔除引流管/.test(b)){
        b=b.replace(/\n\n今日引流量已明显减少，切口无活动性渗血，拔除引流管后局部敷料清洁干燥。/,'');
      }
    }

    if(t.short==='康复评估与训练记录'){
      b=b.replace('患肢末梢血运、感觉及运动正常。','神经血管评估：'+neuroStatus(c));
    }

    if(t.short==='出院小结'){
      b=b.replace('患肢末梢血运、感觉及运动正常。','神经血管情况：'+neuroStatus(c));
      var f=finalFunction(c);
      if(f&&!b.includes(f)){
        b=b.replace(/已达到出院条件。/,' '+f+' 已达到出院条件。');
      }
    }

    t.sourceBody=b;
    t.qualityV15=true;
  });

  if(window.HAJIMI_RECORD_QUALITY_V13)window.HAJIMI_RECORD_QUALITY_V13.issues=[];
  if(window.HAJIMI_RECORD_QUALITY_V14)window.HAJIMI_RECORD_QUALITY_V14.issues=[];
  var issues=[];
  templates.forEach(function(t){
    var b=String(t.sourceBody||'');
    if(/^术后第1天病程$/.test(t.short)&&/床上主动活动\/早期康复/.test(b))issues.push(t.group+'：POD1仍有泛化活动表述');
    if(/^术后第\d+天病程$/.test(t.short)&&/患肢末梢血运、感觉及主动运动正常/.test(b))issues.push(t.group+' / '+t.short+'：日常病程仍有重复泛化神经血管描述');
    if(/今日引流量已明显减少.*拔除引流管后局部敷料清洁干燥。[\s\S]*引流管理：.*符合拔管条件/.test(b))issues.push(t.group+' / '+t.short+'：拔管描述重复');
  });
  window.HAJIMI_RECORD_QUALITY_V15={enabled:true,issues:issues};
})();