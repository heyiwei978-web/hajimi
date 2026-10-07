(function(){
  if(typeof templates==='undefined'||!Array.isArray(templates)||!window.HAJIMI_IDEAL_CASES||!window.HAJIMI_IDEAL_CASES.seeds)return;
  var seeds=window.HAJIMI_IDEAL_CASES.seeds;

  function addMin(hm,n){
    var p=hm.split(':').map(Number),x=p[0]*60+p[1]+n;
    x=((x%1440)+1440)%1440;
    return String(Math.floor(x/60)).padStart(2,'0')+':'+String(x%60).padStart(2,'0');
  }
  function timeProfile(c){
    var m={
      'TKA':['08:35',100],
      'THA':['08:50',105],
      '人工股骨头置换':['09:05',80],
      '股骨转子间骨折':['08:45',70],
      '股骨大粗隆骨折':['09:10',65],
      '股骨干骨折':['08:40',95],
      '胫骨干骨折':['09:00',80],
      '胫骨平台骨折':['08:50',100],
      '踝关节三踝骨折':['09:05',105],
      '跟骨骨折':['09:15',85],
      '桡骨远端骨折':['08:55',55],
      '桡骨头骨折':['09:20',60],
      '肱骨近端骨折':['08:45',85],
      '肱骨干骨折':['09:05',75],
      '锁骨骨折':['09:25',55],
      '尺桡骨干骨折':['08:50',95],
      '髌骨骨折':['09:15',60],
      '掌骨骨折':['09:30',40],
      '指骨骨折':['09:40',35],
      '跖骨骨折':['09:25',45],
      '趾骨骨折':['09:35',35],
      '骨盆骨折':['08:30',115]
    };
    var a=m[c.group]||['09:00',75],start=a[0],dur=a[1],end=addMin(start,dur);
    return {
      inRoom:addMin(start,-30),
      preAssess:addMin(start,-22),
      anesthStart:addMin(start,-18),
      anesthReady:addMin(start,-5),
      start:start,
      end:end,
      safety:addMin(end,5),
      count:addMin(end,7),
      anesthRecord:addMin(end,10),
      surgeryRecord:addMin(end,15),
      postopFirst:addMin(end,30),
      postopVisit:addMin(end,150)
    };
  }
  function setRecordTime(body,time){
    return body.replace(/记录时间：(\d{4}-\d{2}-\d{2}) \d{2}:\d{2}/,'记录时间：$1 '+time);
  }
  function compactCount(c){
    var scope=(['TKA','THA','人工股骨头置换','骨盆骨折','股骨干骨折','胫骨平台骨折','踝关节三踝骨折','尺桡骨干骨折'].includes(c.group)?'大中型骨科器械及植入物台':'常规骨科器械及植入物台');
    return '清点范围：'+scope+'。\n\n术前清点：器械、纱布、纱垫、缝针及其他手术物品按本台手术清点基数逐项核对，数量与清点单一致。\n关闭深层组织前清点：上述物品再次逐项清点，与术前基数一致。\n关闭切口前最终清点：器械及敷料再次核对，数量与清点单一致，无物品遗留疑虑。\n术中未输血。植入物名称、规格及数量已与手术记录及植入物追溯信息核对一致。\n\n手术结束后即时完成清点记录。';
  }

  templates.forEach(function(t){
    var c=seeds[t.group];
    if(!c||!t.sourceBody)return;
    var b=String(t.sourceBody),p=timeProfile(c);

    if(t.short==='手术安全核查记录'){
      b=setRecordTime(b,p.safety);
    }
    if(t.short==='手术清点记录'){
      b=setRecordTime(b,p.count);
      b=b.replace(/[\s\S]*?手术名称：([^\n]+)\n巡回护士：周某某    器械护士：吴某某\n\n[\s\S]*?手术结束后即时完成清点记录。/,
        function(all,name){
          var head=all.slice(0,all.indexOf('手术名称：'));
          return head+'手术名称：'+name+'\n巡回护士：周某某    器械护士：吴某某\n\n'+compactCount(c);
        }
      );
    }
    if(t.short==='麻醉记录'){
      b=setRecordTime(b,p.anesthRecord);
      b=b.replace(
        /时间记录：[^\n]+/,
        '时间记录：'+p.inRoom+'患者入室并开始监测；'+p.preAssess+'完成麻醉前再次评估；'+p.anesthStart+'开始实施麻醉；'+p.anesthReady+'麻醉效果满足手术要求；'+p.start+'手术开始；'+p.end+'手术结束；'+p.anesthRecord+'完成麻醉交接。'
      );
    }
    if(t.short==='手术记录'){
      b=setRecordTime(b,p.surgeryRecord);
      b=b.replace(/手术开始时间：\d{2}:\d{2}/,'手术开始时间：'+p.start);
      b=b.replace(/手术结束时间：\d{2}:\d{2}/,'手术结束时间：'+p.end);
    }
    if(t.short==='术后首次病程记录'){
      b=setRecordTime(b,p.postopFirst);
      b=b.replace(/手术时间：\d{2}:\d{2}～\d{2}:\d{2}/,'手术时间：'+p.start+'～'+p.end);
      b=b.replace(/患者今日\d{2}:\d{2}在/g,'患者今日'+p.start+'在');
      b=b.replace(/，\d{2}:\d{2}手术结束/g,'，'+p.end+'手术结束');
    }
    if(t.short==='麻醉术后访视记录'){
      b=setRecordTime(b,p.postopVisit);
    }

    t.sourceBody=b;
    t.qualityV7=true;
  });

  var issues=[];
  templates.forEach(function(t){
    var c=seeds[t.group],b=String(t.sourceBody||'');
    if(!c)return;
    if(t.short==='手术清点记录'&&/纱布20块|纱垫10块|缝针12枚/.test(b))issues.push(t.group+'：清点记录仍使用全站统一固定数量');
    if(['手术安全核查记录','手术清点记录','麻醉记录','手术记录','术后首次病程记录'].includes(t.short)&&!/记录时间：\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(b))issues.push(t.group+' / '+t.short+'：缺记录时间');
  });
  window.HAJIMI_RECORD_QUALITY_V7={enabled:true,issues:issues};
})();