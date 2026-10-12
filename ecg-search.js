/* Ranked full-text search for the ECG section.
 * Approach follows small client-side engines such as MiniSearch and Fuse.js
 * (field weights, prefix bonus, all-terms-must-match), written here without
 * dependencies so it runs under the site's script-src 'self' policy. */
(()=>{
  'use strict';
  const normalize=text=>String(text??'').normalize('NFKC').toLowerCase();
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  // Short Latin terms (AF, PE, LBBB) are matched as whole words so that "af"
  // does not hit "aflutter"; Chinese and longer terms match as substrings.
  const isShort=term=>/^[a-z0-9]{1,3}$/.test(term);
  const wordRe=new Map();
  const has=(text,term)=>{
    if(!isShort(term))return text.includes(term);
    if(!wordRe.has(term))wordRe.set(term,new RegExp('(^|[^a-z0-9])'+term+'($|[^a-z0-9])'));
    return wordRe.get(term).test(text);
  };
  const terms=query=>normalize(query).split(/\s+/).filter(Boolean).slice(0,8);

  function scoreTerm(doc,term){
    let best=0;
    if(doc.title===term)best=100;
    else if(doc.title.startsWith(term))best=70;
    else if(has(doc.title,term))best=50;
    for(const alias of doc.aliases){
      if(alias===term)best=Math.max(best,85);
      else if(alias.startsWith(term)&&!isShort(term))best=Math.max(best,45);
      else if(has(alias,term))best=Math.max(best,35);
    }
    if(!best&&has(doc.body,term))best=8;
    return best;
  }

  function create(docs){
    const index=docs.map((doc,order)=>({...doc,order,title:normalize(doc.title),aliases:(doc.aliases||[]).map(normalize),body:normalize(doc.body),raw:doc}));
    function search(query,{limit=Infinity,type}={}){
      const list=terms(query);
      if(!list.length)return [];
      const results=[];
      for(const doc of index){
        if(type&&doc.type!==type)continue;
        let score=0;
        for(const term of list){const value=scoreTerm(doc,term);if(!value){score=0;break;}score+=value;}
        if(score)results.push({doc:doc.raw,score,order:doc.order});
      }
      results.sort((a,b)=>b.score-a.score||a.order-b.order);
      return results.slice(0,limit);
    }
    return {search,size:index.length};
  }

  // Escape first, then wrap matches, so markup in data or queries is never interpreted.
  function highlight(text,query){
    const source=String(text??''),list=terms(query).filter(term=>!isShort(term)||term.length>1);
    if(!list.length)return esc(source);
    const folded=normalize(source);
    // NFKC can change length (full-width digits stay 1:1, ligatures do not); fall back if so.
    if(folded.length!==source.length)return esc(source);
    const marks=new Array(source.length).fill(false);
    for(const term of list){let at=folded.indexOf(term);while(at>=0){for(let i=at;i<at+term.length;i++)marks[i]=true;at=folded.indexOf(term,at+term.length);}}
    let html='',open=false;
    for(let i=0;i<source.length;i++){
      if(marks[i]&&!open){html+='<mark>';open=true;}
      if(!marks[i]&&open){html+='</mark>';open=false;}
      html+=esc(source[i]);
    }
    return html+(open?'</mark>':'');
  }

  function snippet(text,query,radius=36){
    const source=String(text??''),folded=normalize(source);
    let at=-1;
    for(const term of terms(query)){const found=folded.indexOf(term);if(found>=0&&(at<0||found<at))at=found;}
    if(at<0)return source.length>radius*2?source.slice(0,radius*2)+'…':source;
    const start=Math.max(0,at-radius),end=Math.min(source.length,at+radius);
    return (start?'…':'')+source.slice(start,end)+(end<source.length?'…':'');
  }

  // Build documents from the merged ECG data: atlas entries plus the long-form pages.
  function documents(data){
    const docs=[];
    const categoryTitle=id=>(data.categories.find(item=>item.id===id)||{}).title||'';
    for(const entry of data.entries){
      const criteria=(entry.basic.criteria||[]).flat();
      docs.push({type:'entry',id:entry.id,title:entry.title,aliases:entry.aliases||[],url:'/ecg/atlas/'+entry.category+'/'+entry.id,meta:categoryTitle(entry.category),summary:entry.basic.summary,
        body:[categoryTitle(entry.category),entry.basic.summary,...criteria,...entry.basic.diagnosticPoints,...entry.basic.differentialPoints,...Object.values(entry.periop)].join(' ')});
    }
    const B=data.basics||{};
    const page=(title,url,meta,parts)=>docs.push({type:'page',title,aliases:[],url,meta,summary:'',body:parts.flat(Infinity).filter(item=>typeof item==='string').join(' ')});
    for(const item of B.introduction||[])page(item.title,'/ecg/basics#ecg-'+item.id,'基础学习',item.points);
    if(B.steps)page('读图六步法','/ecg/basics#ecg-six-steps','基础学习',B.steps.map(step=>[step.title,step.body]));
    if(B.calibration)page('定标与走纸速度','/ecg/basics#ecg-calibration','基础学习',B.calibration.points);
    if(B.electrodes)page('电极位置与接反识别','/ecg/basics#ecg-electrodes','基础学习',[B.electrodes.chest,B.electrodes.limb,B.electrodes.reversals]);
    if(B.axisGuide)page('电轴测量','/ecg/basics#ecg-axis','基础学习',[B.axisGuide.steps,B.axisGuide.ranges]);
    if(B.intervals)page('间期测量方法','/ecg/basics#ecg-intervals','基础学习',B.intervals);
    if(B.artifacts)page('伪差识别','/ecg/basics#ecg-artifacts','基础学习',B.artifacts.map(item=>[item.title,item.points]));
    if(B.textbookNormals)page('各导联正常值','/ecg/basics#ecg-textbook-normals','基础学习',B.textbookNormals.rows);
    if(B.prLimits)page('PR 间期上限','/ecg/basics#ecg-pr-limits','基础学习',B.prLimits.rows);
    if(B.holter)page('动态心电图（Holter）','/ecg/basics#ecg-holter','基础学习',B.holter);
    if(B.qrsNaming)page('QRS 波群命名与测量','/ecg/basics#ecg-qrs-naming','基础学习',B.qrsNaming);
    for(const item of (data.phenomena&&data.phenomena.items)||[])page(item.title,'/ecg/phenomena#ecg-ph-'+item.id,'心电现象',[item.definition,item.ecg,item.significance]);
    const P=data.periop||{};
    if(P.abnormal)page('术前异常心电图怎么办','/ecg/periop#ecg-abnormal','围手术期',P.abnormal.map(item=>[item.finding,item.action]));
    if(P.anesthesia)page('麻醉与术中相关风险','/ecg/periop#ecg-anesthesia','围手术期',P.anesthesia.map(item=>[item.title,item.context,item.ecg,item.response]));
    if(P.postopFlow)page('术后胸闷 / 胸痛处理流程','/ecg/periop#ecg-postop','围手术期',P.postopFlow.map(step=>[step.title,step.body]));
    if(P.injury)page('术后心肌损伤','/ecg/periop#ecg-injury','围手术期',[P.injury.intro,P.injury.rows,P.injury.points]);
    if(P.onCall)page('值班速查','/ecg/periop#ecg-oncall','围手术期',P.onCall.map(item=>[item.title,item.points]));
    page('QTc 计算','/ecg/tools#ecg-qtc','工具',['QTc Bazett Fridericia Framingham Hodges QT 校正']);
    page('电轴计算','/ecg/tools#ecg-axis-tool','工具',['电轴 axis I aVF 净振幅']);
    page('心率估算','/ecg/tools#ecg-rate-tool','工具',['心率 格数法 6 秒法 RR 间期 heart rate']);
    page('报告生成器','/ecg/report#ecg-report-builder','报告',['报告 结论 规范写法 report']);
    return docs;
  }

  window.HAJIMI_ECG_SEARCH=Object.freeze({create,documents,highlight,snippet,normalize,terms});
})();
