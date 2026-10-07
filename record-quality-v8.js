(function(){
  if(typeof templates==='undefined'||!Array.isArray(templates)||!window.HAJIMI_IDEAL_CASES||!window.HAJIMI_IDEAL_CASES.seeds)return;
  var seeds=window.HAJIMI_IDEAL_CASES.seeds;

  function imagingPlan(c){
    if(c.kind==='joint-knee')return '复查右膝正侧位DR，评价假体位置、胫股力线及有无假体周围骨折，据此指导负重和膝关节活动进度。';
    if(c.kind==='joint-hip')return '复查骨盆正位及患髋DR，评价假体位置、髋关节复位、肢体长度及有无假体周围骨折，据此指导负重和脱位预防。';
    if(['胫骨平台骨折','踝关节三踝骨折','跟骨骨折','桡骨远端骨折','桡骨头骨折','趾骨骨折'].includes(c.group))return '复查相应部位正侧位/关节专项X线，评价关节面或关节关系恢复、内固定位置及有无继发移位，并据此确定关节活动及负重限制。';
    return '复查相应部位正侧位X线，评价骨折对位对线、内固定位置及有无继发移位，并据此调整后续康复。';
  }

  templates.forEach(function(t){
    var c=seeds[t.group];
    if(!c||!t.sourceBody)return;
    var b=String(t.sourceBody);

    if(t.short==='麻醉知情同意书'){
      b=b.replace(/\n\n患者签名：[^\n]+麻醉医师签名：[^\n]+。(?=\n\n患者\/代理人签名：)/,'');
    }

    if(t.short==='麻醉记录'){
      b=b.replace(/\n手术日期：\d{4}-\d{2}-\d{2}\n麻醉医师：/,'\n麻醉医师：');
    }

    if(t.short==='麻醉术后访视记录'){
      b=b.replace(
        /患者术后神志清楚，呼吸平稳，循环稳定，SpO₂ 98%，无明显恶心呕吐、寒战、剧烈头痛、呼吸抑制及异常嗜睡。患者术后神志清楚，呼吸循环稳定，无明显恶心、呕吐及寒战，感觉与运动阻滞按预期逐步消退，未见麻醉相关神经功能异常。/,
        '患者术后神志清楚，呼吸循环稳定，SpO₂ 98%，无明显恶心、呕吐、寒战、剧烈头痛、呼吸抑制及异常嗜睡；感觉与运动阻滞按预期逐步消退，未见麻醉相关神经功能异常。'
      );
      b=b.replace(/\n麻醉医师签名：[^\n]+。(?=\n\n麻醉医师签名：)/,'');
    }

    if(t.short==='手术安全核查记录'){
      b=b.replace(
        /\n\n手术医师：([^\n]+?)    麻醉医师：([^\n]+?)    巡回护士：([^\n]+)$/,
        '\n\n手术医师签名：$1    麻醉医师签名：$2    巡回护士签名：$3'
      );
    }

    if(t.short==='术后首次病程记录'){
      b=b.replace(/复查相应部位DR评估固定\/假体位置。/,imagingPlan(c));
    }

    t.sourceBody=b;
    t.qualityV8=true;
  });

  var issues=[];
  templates.forEach(function(t){
    var c=seeds[t.group],b=String(t.sourceBody||'');
    if(!c)return;
    if(t.short==='麻醉知情同意书'&&(b.match(/麻醉医师签名/g)||[]).length!==1)issues.push(t.group+'：麻醉同意书签名重复或缺失');
    if(t.short==='麻醉术后访视记录'&&(b.match(/麻醉医师签名/g)||[]).length!==1)issues.push(t.group+'：麻醉术后访视签名重复或缺失');
    if(t.short==='麻醉术后访视记录'&&/患者术后神志清楚.*患者术后神志清楚/.test(b))issues.push(t.group+'：麻醉术后访视重复描述');
    if(t.short==='术后首次病程记录'&&/固定\/假体位置/.test(b))issues.push(t.group+'：术后首次病程影像计划仍泛化');
  });
  window.HAJIMI_RECORD_QUALITY_V8={enabled:true,issues:issues};
})();