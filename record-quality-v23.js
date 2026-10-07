(function(){
  if(typeof templates==='undefined'||!Array.isArray(templates)||!window.HAJIMI_IDEAL_CASES||!window.HAJIMI_IDEAL_CASES.seeds)return;
  var seeds=window.HAJIMI_IDEAL_CASES.seeds;
  var required=[
    '入院记录','首次病程记录','主治医师首次查房记录','主任医师首次查房记录',
    '选择治疗方案沟通记录','术前主刀查房','多学科术前讨论','手术知情同意记录',
    '麻醉知情同意书','麻醉术前访视记录','术前小结','手术安全核查记录',
    '手术清点记录','麻醉记录','手术记录','术后首次病程记录','麻醉术后访视记录',
    '术后主刀查房记录','术后第1天病程','康复评估与训练记录',
    '影像复查及结果分析','出院前主治医师查房记录','出院小结'
  ];
  function recTime(body){
    var m=String(body||'').match(/记录时间：(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2})/);
    return m?Date.parse(m[1]+'T'+m[2]+':00Z'):NaN;
  }
  function dateLine(body,label){
    var re=new RegExp(label+'：(\\d{4}-\\d{2}-\\d{2})'),m=String(body||'').match(re);
    return m?m[1]:'';
  }
  function dayStart(s){return s?Date.parse(s+'T00:00:00Z'):NaN;}
  var issues=[],stats={diseases:0,records:0,categories:{},missingChapters:0,blankRecords:0,timeErrors:0,placeholderErrors:0};
  var groups=Object.keys(seeds);
  stats.diseases=groups.length;
  groups.forEach(function(g){
    var c=seeds[g],arr=templates.filter(function(t){return t.department==='骨科'&&t.group===g&&!t.specialCase;});
    stats.records+=arr.length;
    var cat=c.category||'原有成熟病种';
    stats.categories[cat]=(stats.categories[cat]||0)+1;
    var names=new Set(arr.map(function(t){return t.short;}));
    required.forEach(function(r){
      if(!names.has(r)){issues.push(g+'：缺少“'+r+'”');stats.missingChapters++;}
    });
    if(!arr.length){issues.push(g+'：未生成任何病历章节');return;}
    var admission=arr.find(function(t){return t.short==='入院记录';});
    var discharge=arr.find(function(t){return t.short==='出院小结';});
    var ad=admission?dayStart(dateLine(admission.sourceBody,'入院日期')):NaN;
    var dd=discharge?dayStart(dateLine(discharge.sourceBody,'出院日期')):NaN;
    var surgery=arr.find(function(t){return t.short==='手术记录';});
    var sd=surgery?dayStart(dateLine(surgery.sourceBody,'手术日期')):NaN;
    if(isFinite(ad)&&isFinite(sd)&&sd<ad){issues.push(g+'：手术日期早于入院日期');stats.timeErrors++;}
    if(isFinite(dd)&&isFinite(sd)&&sd>dd){issues.push(g+'：手术日期晚于出院日期');stats.timeErrors++;}
    arr.forEach(function(t){
      var b=String(t.sourceBody||'');
      if(!b.trim()||b.trim().length<80){issues.push(g+' / '+t.short+'：正文为空或过短');stats.blankRecords++;}
      var rt=recTime(b);
      if(isFinite(ad)&&isFinite(rt)&&rt<ad){issues.push(g+' / '+t.short+'：记录时间早于入院');stats.timeErrors++;}
      if(isFinite(dd)&&isFinite(rt)&&rt>=dd+86400000){issues.push(g+' / '+t.short+'：记录时间晚于出院日');stats.timeErrors++;}
      if(t.short!=='出院小结'&&/出院日期：\d{4}-\d{2}-\d{2}/.test(b)){issues.push(g+' / '+t.short+'：提前出现出院日期');stats.timeErrors++;}
      if(/待补|按实际|【|】|XXX|xx待定/i.test(b)){issues.push(g+' / '+t.short+'：存在占位符');stats.placeholderErrors++;}
      if(t.short==='手术记录'&&!/手术开始时间：\d{2}:\d{2}/.test(b)){issues.push(g+'：手术记录缺手术开始时间');}
      if(t.short==='手术记录'&&!/手术结束时间：\d{2}:\d{2}/.test(b)){issues.push(g+'：手术记录缺手术结束时间');}
    });
    if(surgery){
      var firstPost=arr.find(function(t){return t.short==='术后首次病程记录';});
      if(firstPost&&recTime(firstPost.sourceBody)<=recTime(surgery.sourceBody)){issues.push(g+'：术后首次病程未晚于手术记录');stats.timeErrors++;}
    }
  });
  var duplicateNo={};
  groups.forEach(function(g){var n=seeds[g].no||'';if(n){if(duplicateNo[n])issues.push(g+' 与 '+duplicateNo[n]+' 住院号重复：'+n);else duplicateNo[n]=g;}});
  stats.issueCount=issues.length;
  window.HAJIMI_RECORD_QUALITY_V23={enabled:true,standard:'full-library-integrity-audit',stats:stats,issues:issues};
})();