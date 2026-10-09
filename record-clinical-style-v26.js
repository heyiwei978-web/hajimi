(function(){
  'use strict';
  if(typeof templates==='undefined'||!Array.isArray(templates))return;
  var seeds=(window.HAJIMI_IDEAL_CASES&&window.HAJIMI_IDEAL_CASES.seeds)||{};
  var rules=(window.HAJIMI_ORTHO_PROTOCOLS||[]).map(function(r){return {name:r.name,parts:r.parts,test:new RegExp(r.pattern)};});
  var status={version:'2026-10-09-v26',orthoSurgicalRecords:0,rewritten:0,specialPreserved:0,unmatched:[],applied:{}};

  function isSurgery(t){return t && (t.short==='手术记录'||t.short==='完整手术记录'||t.type==='手术记录') && /手术记录/.test(t.short||'');}
  function isCourse(t){return t && !/手术记录|术前讨论|麻醉|出院小结|手术清点|手术核查|知情同意/.test(t.short||'') && /病程|查房/.test(t.short||'');}
  function restoreDoctorNames(s){
    var re=/([\u4e00-\u9fa5]{2,4})(主任医师|主治医师)(?=查房|指出|指示|认为|分析|意见|复查|查房后|：|:)/g;
    return s.replace(re,function(full,n,role){if(/^(今日|昨日|入院|术后|住院|出院|术前|目前|今日早|患者)/.test(n))return full;return '________'+role;});
  }
  function fourParagraphProtocol(t,c,p){
    var text=String(t.sourceBody||'').replace(/\r/g,'');
    var start=text.search(/手术经过[：:]/);
    if(start<0)return text;
    var prefix=text.slice(0,start),remaining=text.slice(start);
    var marker=/\n\s*(?:术后计划|术后医嘱|术后处理|术者签名|手术者签名)[：:]/.exec(remaining);
    var footer=marker?remaining.slice(marker.index).trim():'';
    var side=String(c.side||'患');
    var anesthesia=String(c.anesthesia||'计划麻醉');
    var position=String(c.position||'符合手术要求的体位');
    var paragraphs=p.parts.slice();
    // Keep every middle paragraph substantial even for short tendon/epiphysiodesis procedures.
    if(paragraphs[1].length<45)paragraphs[1]+=' 并在直视下复核邻近神经血管、肌腱及关节结构的保护情况。';
    if(paragraphs[2].length<45)paragraphs[2]+=' 术中同时核查处理范围、局部稳定性及周围健康组织的完整情况。';
    paragraphs[0]='患者进入手术室后核对姓名、住院号、手术名称及'+side+'侧标识，完成手术安全核查，在'+anesthesia+'满意后取'+position+'，手术区域常规消毒并铺无菌巾单。'+paragraphs[0];
    paragraphs[3]+=' 再次检查有无活动性出血，彻底冲洗术野，根据实际需要放置引流，清点器械、纱布、缝针无误后逐层缝合并覆盖无菌敷料；术后核对患肢神经血管状态及植入物追溯信息。';
    if(typeof c.bloodloss==='number')paragraphs[3]+=' 该模板原始病例记载出血约'+c.bloodloss+'ml，应用时以实际麻醉记录和手术记录为准。';
    var result=prefix+'手术经过：\n'+paragraphs.join('\n\n')+(footer?'\n\n'+footer:'');
    return result;
  }
  function regroupNumbering(s){
    // Keep unusual operations as-is if they already contain descriptive paragraphs.
    var start=s.search(/手术经过[：:]/);
    if(start<0)return s;
    var pre=s.slice(0,start),rest=s.slice(start).replace(/^手术经过[：:]\s*/,'');
    var m=/\n\s*(?:术后计划|术后医嘱|术后处理|术者签名|手术者签名)[：:]/.exec(rest);
    var tail=m?rest.slice(m.index).trim():'';
    var op=m?rest.slice(0,m.index):rest;
    var lines=op.split(/\n/).map(x=>x.trim()).filter(Boolean);
    var steps=[],preface=[];
    lines.forEach(function(line){
      var match=/^(?:第?[一二三四五六七八九十]{1,2}[、.．]|\d{1,2}[、.．])\s*(.+)/.exec(line);
      if(match)steps.push(match[1]);
      else if(steps.length)steps[steps.length-1]+=' '+line;
      else preface.push(line);
    });
    if(steps.length<4)return s;
    var sections=[[],[],[],[]];
    preface.forEach(x=>sections[0].push(x));
    steps.forEach(function(x,i){sections[Math.min(3,Math.floor(4*i/steps.length))].push(x);});
    return pre+'手术经过：\n'+sections.map(part=>part.join('')).filter(Boolean).join('\n\n')+(tail?'\n\n'+tail:'');
  }
  function normalizeCourse(s,t){
    // V25 already merges all course paragraphs; this handles short/late-added variants only.
    if(s.includes('\n\n主任医师：________')||s.includes('\n\n主治医师：________'))return s;
    var body=String(s).replace(/\r/g,'');
    if(!/\n\n/.test(body))return restoreDoctorNames(body);
    var fields=/^(?:记录名称|记录时间|患者|患者信息|主要诊断|主诊断|住院号|入院日期|手术日期|出院日期)[：:]/;
    var lines=body.split('\n'),head=[],pos=0;
    while(pos<lines.length&&(fields.test(lines[pos].trim())||(!lines[pos].trim()&&head.length))){if(lines[pos].trim())head.push(lines[pos].trim());pos++;}
    var rest=lines.slice(pos).map(x=>x.trim()).filter(Boolean);
    if(!rest.length)return s;
    if(!/\n\n/.test(rest.join('\n')))return restoreDoctorNames(s);
    var para=rest.join('').replace(/(\d{1,2})[、.．]\s*/g,'$1、');
    var role=/主任医师/.test(t.short)?'主任医师':/主治医师/.test(t.short)?'主治医师':'';
    return restoreDoctorNames((head.length?head.join('\n')+'\n\n':'')+para+(role?'\n\n'+role+'：________':''));
  }
  templates.forEach(function(t){
    if(t.department!=='骨科'||typeof t.sourceBody!=='string'||!t.sourceBody.trim())return;
    if(isSurgery(t)){
      status.orthoSurgicalRecords++;
      if(t.specialCase){status.specialPreserved++;t.sourceBody=regroupNumbering(t.sourceBody);return;}
      var c=seeds[t.group]||null;
      if(!c){status.unmatched.push(t.group+'（缺少术式数据）');t.sourceBody=regroupNumbering(t.sourceBody);return;}
      var op=String(c.surgery||'')+' '+String(t.group||'');
      var candidates=rules.filter(function(r){return r.test.test(op);});
      // A disease-specific reconstructive route must outrank a generic approach.
      var p=(/侧弯矫形/.test(op)&&candidates.find(function(r){return /长节段矫形融合/.test(r.name);}))||
            (/Haglund/.test(op)&&candidates.find(function(r){return /跟骨后上方跟腱止点/.test(r.name);}))||candidates[0];
      if(p){t.sourceBody=fourParagraphProtocol(t,c,p);status.rewritten++;status.applied[p.name]=(status.applied[p.name]||0)+1;}
      else {t.sourceBody=regroupNumbering(t.sourceBody);status.unmatched.push(op);}
      return;
    }
    if(isCourse(t))t.sourceBody=normalizeCourse(t.sourceBody,t);
  });
  window.HAJIMI_ORTHO_STYLE_V26=status;
  window.HAJIMI_BROWSER_CLINICAL_FORMAT=function(t,s){
    if(!t||typeof s!=='string')return s;
    if(t.department==='骨科'&&isSurgery(t))return regroupNumbering(s);
    if(t.department==='骨科'&&isCourse(t))return normalizeCourse(s,t);
    return s;
  };
})();