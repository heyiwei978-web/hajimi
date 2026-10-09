/* Clinical prose v27: retain distinct header, diagnosis, one progress paragraph and signature.
 * Runs after v25/v26, on the source records before generated per-disease JSON.
 * Do not modify operative records, consent documents, cases in other departments,
 * or original content of unusual cases beyond the progress-note layout.
 */
(function(){
'use strict';
if(typeof templates==='undefined'||!Array.isArray(templates))return;
const seeds=window.HAJIMI_IDEAL_CASES?.seeds||{};
const summary={version:'2026-10-10-v27',notesFormatted:0,dischargeRoundsAdded:0,specialCaseDischargeRounds:0,roundingSpeech:0};

function isProgress(t){
  return !!t&&t.department==='骨科'&&typeof t.sourceBody==='string'&&
   /病程|查房/.test(t.short||'')&&
   !/出院小结|术前讨论|手术记录|会诊申请|知情同意|麻醉记录|检查理由|手术安全核查/.test(t.short||'');
}
function oneField(text,name){
  const m=new RegExp(name+'[：:]\\s*(\\d{4}[-/]\\d{1,2}[-/]\\d{1,2}(?:\\s+\\d{1,2}:\\d{2})?)').exec(text);
  return m?m[1].replace(/\//g,'-'):'';
}
function clean(v){return String(v||'').replace(/\r/g,'').trim();}
function doctorRole(t){
  const s=String(t.short||'');
  if(/主治医师/.test(s))return '主治医师';
  if(/主任医师/.test(s))return '主任医师';
  if(/主刀/.test(s))return '主刀医师';
  return '';
}
function fixDoctors(body,t){
  const role=doctorRole(t);
  if(!role)return {text:body,changed:false};
  const before=body;
  const name='________';
  const fullRole=role.replace('主刀医师','主刀医师');
  // Replace variable personal-name patterns only when followed by the exact
  // medical title; never rewrite the patient's name in the header.
  const surname='[赵钱孙李周吴郑王冯陈褚卫蒋沈韩杨朱秦许何吕施张孔曹严华金魏陶姜戚谢邹喻柏水窦章云苏潘葛范彭郎鲁韦昌马苗凤花方俞任袁柳唐罗薛伍余米贝姚孟顾尹江钟汪田石董梁宋杜肖贺耿]';
  const re=new RegExp(surname+'[\\u4e00-\\u9fa5]{1,2}('+fullRole+')(?=查房|查房后|指出|指示|认为|分析|意见|：|:)','g');
  body=body.replace(re,name+'$1');
  // The consultant's conclusions belong in the SAME clinical prose paragraph.
  const opPrefix=new RegExp('(?:________)?'+fullRole+'(?:分析|意见|指出|指示)[：:]','g');
  body=body.replace(opPrefix,name+fullRole+'查房后指出：');
  const visit=new RegExp('(今日|今日上午|今晨|今日查房时)'+fullRole+'查房','g');
  body=body.replace(visit,'$1'+name+fullRole+'查房');
  const visit2=new RegExp('(?<!________)'+fullRole+'查房后(?:指出|指示)[：:]','g');
  body=body.replace(visit2,name+fullRole+'查房后指出：');
  if(!new RegExp(fullRole+'查房后(?:指出|指示)').test(body)){
    const text=name+fullRole+'查房后指出：须结合患者病史、专科查体及已完成的辅助检查动态评价病情，核对诊疗指征及下一阶段治疗、康复安排。';
    const place=/(?:处理意见|处理措施|治疗计划|下一步计划)[：:]/.exec(body);
    if(place)body=body.slice(0,place.index)+text+' '+body.slice(place.index);
    else body+=(/[。！？；]$/.test(body)?'':'。')+text;
  }
  return {text:body,changed:body!==before};
}
function extractNote(t){
  const s=clean(t.sourceBody),c=!t.specialCase?seeds[t.group]||{}:{};
  // Existing clinical header may have been joined to the narrative by v25;
  // rebuild only metadata, not the case findings.
  const headerPatient=s.match(/(?:^|\n)患者[：:]\s*([^\n]+)/);
  const patient=headerPatient?headerPatient[1].trim():(
    c.name?c.name+'，'+(c.sex||'')+'，'+(c.age||'')+'岁，床号：'+(c.bed||'')+'，住院号：'+(c.no||''):'【核对患者信息】');
  const dx=(!t.specialCase&&c.diagnosis)?c.diagnosis:(()=>{
    const m=s.match(/主诊断[：:]\s*([^\n；。]{2,100})/);return m?m[1].trim():'【据实填写主诊断】';
  })();
  const admission=oneField(s,'入院日期'),surgery=oneField(s,'手术日期'),discharge=oneField(s,'出院日期');
  const time=oneField(s,'记录时间')||oneField(s,'记录日期')||'【填写记录日期及时间】';
  let narrative='';
  const dxIndex=s.search(/(?:主诊断|主要诊断)[：:]/);
  if(dxIndex>=0){
    const tail=s.slice(dxIndex).replace(/^(?:主诊断|主要诊断)[：:]\s*/,'');
    if(dx!=='【据实填写主诊断】'&&tail.startsWith(dx))narrative=tail.slice(dx.length);
    else {
      // Older records can use a semicolon or newline between diagnosis and prose.
      const split=tail.search(/[；\n]/);
      narrative=split>=0?tail.slice(split+1):tail;
    }
  }else{
    // When no diagnosis appears, preserve everything after the record header.
    const lines=s.split('\n');const pos=lines.findIndex(v=>/^(?:患者|记录名称|记录时间|记录日期|科别|入院日期|手术日期|出院日期)[：:]/.test(v.trim()));
    narrative=lines.slice(Math.max(pos+1,0)).join('\n');
    narrative=narrative.replace(/^\s*(?:记录名称|患者|科别|入院日期|手术日期|出院日期|记录时间|记录日期)[：:][^\n]*(?:\n|$)/gm,'');
  }
  // Pull trailing signature out even if a previous formatter appended it to the treatment paragraph.
  narrative=narrative.replace(/(?:\n|\s|；)*(?:医师签名|医生签名|记录医师签名|主治医师签名|主任医师签名)[：:]\s*[^\n]{0,100}\s*$/,'');
  narrative=narrative.replace(/(?:\n|\s|；)*(?:主任医师|主治医师|主刀医师)[：:]\s*_{2,}\s*$/,'');
  narrative=narrative.replace(/^[\s；，,。.]+/,'').replace(/[\s；，,。.]+$/,'');
  // Legacy inline labels are not independent paragraphs; preserve their clinical findings.
  narrative=narrative.replace(/(?:^|\n)\s*([一二三四五六七八九十])[、.．]\s*/g,'$1、');
  narrative=narrative.replace(/\n+/g,' ').replace(/[ \t]{2,}/g,' ').replace(/；\s*；/g,'；').trim();
  if(!narrative)return s;
  const modified=fixDoctors(narrative,t);
  if(modified.changed)summary.roundingSpeech++;
  narrative=modified.text;
  const metadata=['记录名称：'+t.short,'患者：'+patient,'科别：骨科'];
  const dateLines=[admission?'入院日期：'+admission:'',surgery?'手术日期：'+surgery:'',discharge?'出院日期：'+discharge:''].filter(Boolean);
  if(dateLines.length)metadata.push(dateLines.join('    '));
  metadata.push('记录时间：'+time);
  return metadata.join('\n')+'\n\n主诊断：'+dx+'\n\n病程记录：'+narrative+'\n\n医师签名：________';
}
function makeDischargeNote(group,reference,caseKey){
  const discharge=(reference||{}),c=!caseKey?seeds[group]||{}:{};
  const s=String(discharge.sourceBody||'');
  const dx=c.diagnosis||(s.match(/(?:主诊断|出院诊断)[：:]\s*([^\n；。]+)/)||[])[1]||'【填写出院诊断】';
  const date=oneField(s,'出院日期')||oneField(s,'记录时间')?.slice(0,10)||'【实际出院日期】';
  const parts=[
    '记录名称：出院当天查房记录',
    '患者：'+(caseKey?(s.match(/(?:^|\n)患者[：:]\s*([^\n]+)/)||[])[1]||'【核对本特殊病例患者信息】':
      c.name?c.name+'，'+(c.sex||'')+'，'+(c.age||'')+'岁，床号：'+(c.bed||'')+'，住院号：'+(c.no||''):'【核对患者信息】'),
    '科别：骨科',
    '记录时间：'+date+' 08:30',
    '',
    '主诊断：'+dx,
    ''
  ];
  const text=caseKey?
    '今日为拟出院评估日，需核对患者近期症状、生命体征、切口或创面状态、引流情况及神经血管功能，并据实补录查体数据、检查结果和功能恢复情况。________主治医师查房后指出：本病例既往存在特殊诊疗经过，应重点复核相关并发症控制情况、必要检查结果与治疗方案的连续性，确认出院条件是否满足；未达到条件时应继续住院观察或治疗，不得仅凭计划日期办理出院。符合条件后应向患者及家属明确告知切口护理、用药与康复限制、预警症状及复诊时间，并记录沟通反馈。':
    '今日查房评估出院条件，患者住院期间已接受'+(c.surgery||'相应治疗')+'，继续核对主诉症状变化、生命体征、切口及局部肿胀、末梢血运和感觉运动、复查影像及康复功能状态。________主治医师查房后指出：应结合近期查体、复查结果、镇痛需求及家庭照护能力综合评估出院条件，确认无仍需院内处理的并发症后方可办理出院；出院后按照'+(c.rehab||'既定康复方案')+'继续训练，明确患肢活动与负重限制，告知切口护理、药物医嘱、门诊复查时间及发热、切口渗液、进行性肿胀、麻木无力等及时就诊指征。具体活动度、切口情况及检查结果应以出院当日实际记录为准。';
  parts.push('病程记录：'+text,'','医师签名：________');
  const entry={
    department:'骨科',group,short:'出院当天查房记录',stage:'术后',type:'查房',
    name:(group==='TKA'?'全膝关节置换':group==='THA'?'全髋关节置换':group)+' · 出院当天查房记录',
    desc:'同一患者完整病例中的出院当日主治医师查房：出院条件评估、切口及神经血管查体、康复和告知。',
    sourceBody:parts.join('\n'),idealCase:!caseKey
  };
  if(caseKey){
    entry.specialCase=true;
    entry.specialCaseKey=caseKey;
    if(discharge.specialCaseTitle)entry.specialCaseTitle=discharge.specialCaseTitle;
    if(discharge.specialCaseSummary)entry.specialCaseSummary=discharge.specialCaseSummary;
    if(discharge.specialCaseOrder)entry.specialCaseOrder=discharge.specialCaseOrder;
  }
  if(Number.isFinite(discharge.recordOrder))entry.recordOrder=discharge.recordOrder-.1;
  return entry;
}
const byGroup=new Map();
templates.forEach(t=>{
  if(t.department!=='骨科')return;
  const k=t.group+'\u0000'+(t.specialCase?(t.specialCaseKey||'special'):'standard');
  if(!byGroup.has(k))byGroup.set(k,[]);
  byGroup.get(k).push(t);
});
templates.forEach(t=>{
  if(!isProgress(t))return;
  const normalized=extractNote(t);
  if(normalized!==t.sourceBody){t.sourceBody=normalized;summary.notesFormatted++;}
});
for(const [key,records] of byGroup){
  if(records.some(t=>/^(?:出院当天查房记录|出院当日查房记录)$/.test(t.short||'')))continue;
  // Reuse a patient-specific discharge summary if one exists; otherwise attach
  // a clearly labelled draft to the latest record without inventing a date.
  const group=records[0]?.group,caseKey=records[0]?.specialCase?(records[0].specialCaseKey||'special'):null;
  if(!group||group==='通用场景')continue;
  const summaryRecord=records.find(t=>/出院小结|出院记录/.test(t.short||''));
  const reference=summaryRecord||records.filter(t=>typeof t.sourceBody==='string').slice(-1)[0];
  if(!reference)continue;
  templates.push(makeDischargeNote(group,reference,caseKey));
  summary.dischargeRoundsAdded++;
  if(caseKey)summary.specialCaseDischargeRounds++;
}
window.HAJIMI_COURSE_V27=summary;
window.HAJIMI_COURSE_FORMAT=function(t,body){
  if(!isProgress(t)||typeof body!=='string')return body;
  if(/^记录名称：[^\n]+\n患者：[^\n]+\n科别：骨科\n/.test(body)&&/\n\n主诊断：/.test(body)&&/\n\n病程记录：/.test(body)&&/\n\n医师签名：________$/.test(body))return body;
  return extractNote(Object.assign({},t,{sourceBody:body}));
};
})();
