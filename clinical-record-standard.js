/* Orthopedic record writing standard: final-stage normalization for display, copy and print.
   Does not change diagnoses, dates, vital signs, treatment decisions or operative facts.
   Operative technique expansion is maintained separately in surgery-techniques-reviewed.js.
*/
(function installOrthopedicWritingStandard(){
  'use strict';
  if(typeof templates==='undefined'||!Array.isArray(templates))return;
  const seedMap=window.HAJIMI_IDEAL_CASES?.seeds||{};
  const roles='主治医师|主任医师';
  const isOrtho=(t)=>t&&((t.department||'骨科')==='骨科');
  const isProgress=(t)=>/(?:病程|查房|首次病程|入院首程)/.test(String(t?.short||'')+' '+String(t?.type||''));
  function blankSeniorNames(raw){
    return String(raw||'')
      .replace(/陈某某主治医师/g,'________主治医师')
      .replace(/王某某主任医师/g,'________主任医师')
      .replace(/王建伟主任医师/g,'________主任医师')
      .replace(/(^|\n)((?:主治医师|主任医师)(?:签名)?)\s*[:：][^\n]*/g,(_m,p,role)=>p+role+'：________');
  }
  function oneNarrativeParagraph(raw){
    const normalized=String(raw||'').replace(/\r\n?/g,'\n');
    const gap=normalized.indexOf('\n\n');
    if(gap<0)return normalized.replace(/\n+/g,' ').replace(/[ \t]{2,}/g,' ').trim();
    const header=normalized.slice(0,gap).trim();
    let narrative=normalized.slice(gap+2).trim();
    // Senior physician signature lines belong below the prose, not inside the paragraph.
    const tail=[];
    const lines=narrative.split('\n');
    while(lines.length&&/^\s*(?:主治医师|主任医师|住院医师|经治医师|记录人)(?:签名)?\s*[:：]/.test(lines[lines.length-1])){
      tail.unshift(lines.pop().trim());
    }
    narrative=lines.join(' ')
      .replace(/(?:^|\s)[一二三四五六七八九十]+[、.．]\s*(?=[^\s])/g,' ')
      .replace(/(?:^|\s)\d+[.、．]\s+(?=[^\s])/g,' ')
      .replace(/\s+/g,' ')
      .trim();
    return header+'\n\n'+narrative+(tail.length?'\n\n'+tail.join('\n'):'');
  }
  function format(t,raw){
    if(!isOrtho(t)||typeof raw!=='string')return raw;
    let b=blankSeniorNames(raw);
    if(isProgress(t))b=oneNarrativeParagraph(b);
    return b;
  }
  let progress=0,opnotes=0,senior=0;
  for(const t of templates){
    if(!isOrtho(t)||typeof t.sourceBody!=='string')continue;
    const before=t.sourceBody;
    let after=before;
    if(t.type==='手术记录'||/手术记录/.test(String(t.short||''))){
      const detail=window.HAJIMI_REVIEWED_SURGERIES?.getDetail?.(t,seedMap[t.group]);
      if(detail&&!(after.includes('术式专项操作细节：'))){
        after=after.replace(/(手术经过：\s*\n)/,'$1术式专项操作细节：'+detail+'\n');
        if(after!==before)opnotes++;
      }
    }
    after=format(t,after);
    if(isProgress(t)&&after!==before)progress++;
    if(after.includes('________主任医师')||after.includes('________主治医师'))senior++;
    t.sourceBody=after;
  }
  if(typeof generate==='function'){
    const originalGenerate=generate;
    generate=function(t){return format(t,originalGenerate(t));};
  }
  window.HAJIMI_RECORD_STANDARD={format,blankSeniorNames,oneNarrativeParagraph,
    stats:{progress,opnotes,senior,templates:templates.filter(isOrtho).length}};
})();
