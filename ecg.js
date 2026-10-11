(()=>{
  'use strict';
  const data=window.HAJIMI_ECG_DATA,app=document.getElementById('ecgApp');
  if(!data||!Array.isArray(data.entries)||!app){if(app)app.textContent='心电图资料暂时无法加载。';return;}
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const points=items=>'<ul class="ecg-points">'+items.map(text=>'<li>'+esc(text)+'</li>').join('')+'</ul>';
  const entryUrl=entry=>'/ecg/atlas/'+entry.category+'/'+entry.id;
  const categoryFor=entry=>data.categories.find(category=>category.id===entry.category);
  const section=(id,title,content)=>'<section class="class-content-section" id="'+id+'"><h2>'+esc(title)+'</h2>'+content+'</section>';
  const card=(url,title,description,meta='')=>'<a class="class-disease-card ecg-card" href="'+esc(url)+'">'+(meta?'<small>'+esc(meta)+'</small>':'')+'<h3>'+esc(title)+'</h3><p>'+esc(description)+'</p><b>查看 →</b></a>';
  function setPage(title,description,crumbs=[]){
    document.body.classList.toggle('ecg-subpage',crumbs.length>0);
    document.title=title+'｜心电图 · 哈基米工作站';
    document.getElementById('ecgTitle').textContent=title;
    document.getElementById('ecgDescription').textContent=description;
    const items=[{title:'首页',url:'/'},{title:'心电图',url:'/ecg'},...crumbs];
    document.getElementById('ecgBreadcrumb').innerHTML=items.map((item,index)=>(index?'<span aria-hidden="true">›</span>':'')+(index===items.length-1?'<span aria-current="page">'+esc(item.title)+'</span>':'<a href="'+esc(item.url)+'">'+esc(item.title)+'</a>')).join('');
  }
  function diagram(kind,caption){
    return '<figure class="ecg-figure"><div class="ecg-figure-scroll" tabindex="0" role="region" aria-label="心电图教学示意图，可横向滚动">'+window.HAJIMI_ECG_WAVEFORMS.render(kind)+'</div><figcaption><strong>自绘教学示意 · 非真实病例</strong><p>'+esc(caption)+'</p><span>示意图比例不用于测量，手机上可横向滑动查看。</span></figcaption></figure>';
  }
  function home(){
    setPage('心电图','从基础到围手术期：学习、查阅和床旁计算。');
    const entries=[['basics','基础学习','从电活动、导联与测量开始，认识正常心电图，再用六步法读图。','基'],['atlas','图谱库','按类别逐级查阅，搜索常见心电图词条及其围手术期要点。','图'],['periop','围手术期专区','术前评估、骨科高频场景，以及胸痛、气促、心悸值班速查。','术']];
    app.innerHTML='<section class="class-section-head"><span>01 / LEARN & READ</span><h2>从这里开始</h2><p>基础层帮助认识波形，围手术期层联系临床场景。</p></section><div class="ecg-entry-grid">'+entries.map(([id,title,description,symbol],index)=>'<a class="class-dept-card is-ready" href="/ecg/'+id+'"><span class="class-dept-index">0'+(index+1)+'</span><div class="class-dept-symbol" aria-hidden="true">'+symbol+'</div><h3>'+title+'</h3><p>'+description+'</p><div class="class-dept-foot"><strong>进入栏目</strong><span aria-hidden="true">→</span></div></a>').join('')+'</div>'+section('ecg-more','工具与自测','<div class="ecg-panel-grid">'+card('/ecg/tools','心电图工具','QTc 双公式计算、RR 间期心率速算，以及现有 RCRI 入口。')+card('/ecg/quiz','自测','建设中：本阶段保留入口，后续加入判读练习。','建设中')+'</div>');
  }
  function basics(){
    setPage('基础学习','先核对记录质量与标定，再按统一顺序判读。以下为成人常用教学参考，资料待审核。',[{title:'基础学习'}]);
    const introduction=data.basics.introduction.map(item=>'<section id="ecg-'+item.id+'"><h3>'+esc(item.title)+'</h3>'+points(item.points)+'</section>').join('');
    const normal='<p>以下范围需结合年龄、性别、心率、导联和测量方法；不适用于直接替代个体化判断。</p>'+diagram('normal','规则的 P–QRS–T 用于认识各波段；正常与否仍需完整的 12 导联记录。')+'<dl class="ecg-values">'+data.basics.normalValues.map(item=>'<div><dt>'+esc(item.name)+'</dt><dd>'+esc(item.value)+'<p class="ecg-hint">'+esc(item.note)+'</p></dd></div>').join('')+'</dl><h3>常见正常变异</h3>'+points(data.basics.variants);
    app.innerHTML='<nav class="ecg-section-links" aria-label="基础学习目录"><a href="#ecg-introduction">入门</a><a href="#ecg-normal">正常心电图</a><a href="#ecg-six-steps">读图六步法</a></nav>'+section('ecg-introduction','入门',introduction)+section('ecg-normal','正常心电图',normal)+section('ecg-six-steps','读图六步法','<ol class="ecg-steps">'+data.basics.steps.map(step=>'<li><h3>'+esc(step.title)+'</h3><p>'+esc(step.body)+'</p></li>').join('')+'</ol>');
  }
  const normalize=text=>String(text).normalize('NFKC').toLowerCase();
  function atlas(category){
    setPage(category?category.title:'图谱库',category?category.description:'按类别逐级查阅，或直接搜索疾病名、英文缩写和关键表现。',category?[{title:'图谱库',url:'/ecg/atlas'},{title:category.title}]:[{title:'图谱库'}]);
    const entries=category?data.entries.filter(entry=>entry.category===category.id):data.entries;
    const categories=category?'<nav class="ecg-section-links" aria-label="图谱导航"><a href="/ecg/atlas">← 全部图谱类别</a></nav>':'<section id="ecgCategoryDirectory" aria-labelledby="ecgCategoriesTitle"><h2 id="ecgCategoriesTitle">按类别查阅</h2><div class="ecg-category-grid">'+data.categories.map(item=>{const count=data.entries.filter(entry=>entry.category===item.id).length;return card('/ecg/atlas/'+item.id,item.title,item.description,count?count+' 个词条 · 待审核':'建设中');}).join('')+'</div></section>';
    app.innerHTML='<section class="ecg-search" aria-label="搜索图谱"><label class="class-search-label" for="ecgSearch">搜索心电图图谱</label><input class="class-filter" id="ecgSearch" type="search" placeholder="例如：房颤、STEMI、文氏、LBBB、低钾、起搏" autocomplete="off"><div class="ecg-search-actions"><span id="ecgSearchCount" role="status" aria-live="polite"></span><button type="button" class="btn" id="ecgClearSearch" hidden>清空搜索</button></div></section>'+categories+'<section aria-labelledby="ecgResultsTitle"><h2 id="ecgResultsTitle">词条</h2><div class="ecg-panel-grid" id="ecgSearchResults">'+entries.map(entry=>'<div data-ecg-entry="'+entry.id+'">'+card(entryUrl(entry),entry.title,entry.basic.summary,categoryFor(entry).title+' · '+entry.reviewStatus)+'</div>').join('')+'</div><p id="ecgSearchEmpty" hidden></p></section>';
    const field=document.getElementById('ecgSearch'),count=document.getElementById('ecgSearchCount'),empty=document.getElementById('ecgSearchEmpty'),clear=document.getElementById('ecgClearSearch');
    const index=entries.map((entry,order)=>({id:entry.id,order,key:normalize([entry.title,...entry.aliases].join(' ')),text:normalize([entry.title,categoryFor(entry).title,...entry.aliases,entry.basic.summary,...entry.basic.diagnosticPoints,...entry.basic.differentialPoints,...Object.values(entry.periop)].join(' '))}));
    const results=document.getElementById('ecgSearchResults');
    const matches=(text,term)=>/^[a-z0-9]{1,3}$/.test(term)?new RegExp('(^|[^a-z0-9])'+term+'($|[^a-z0-9])').test(text):text.includes(term);
    function run(){
      const query=field.value.trim(),terms=normalize(query).split(/\s+/).filter(Boolean);
      let shown=0;
      // Entries whose title or aliases match come first, then other full-text matches.
      const ranked=index.map(item=>({item,visible:terms.every(term=>matches(item.text,term)),primary:terms.length>0&&terms.every(term=>matches(item.key,term))}))
        .sort((a,b)=>(b.primary-a.primary)||(a.item.order-b.item.order));
      for(const {item,visible} of ranked){
        const node=results.querySelector('[data-ecg-entry="'+item.id+'"]');
        node.hidden=!visible;results.appendChild(node);
        shown+=Number(visible);
      }
      count.textContent=shown+' 个匹配词条 · 资料待审核';
      empty.hidden=shown>0;
      empty.textContent=query?'未找到匹配词条，请更换关键词。':'本分类建设中，暂未添加词条。';
      clear.hidden=!query;
      const directory=document.getElementById('ecgCategoryDirectory');if(directory)directory.hidden=Boolean(query);
      const url=new URL(location.href);if(query)url.searchParams.set('q',query);else url.searchParams.delete('q');
      history.replaceState(history.state||{},'',url.pathname+url.search+url.hash);
    }
    field.value=new URLSearchParams(location.search).get('q')||'';
    field.addEventListener('input',event=>{if(!event.isComposing)run();});
    field.addEventListener('compositionend',run);
    clear.addEventListener('click',()=>{field.value='';run();field.focus();});
    run();
  }
  function references(entry){
    const refs=entry.references.filter(reference=>{try{return new URL(reference.url).protocol==='https:';}catch{return false;}});
    return refs.length?'<ol class="ecg-points">'+refs.map(reference=>'<li><a href="'+esc(reference.url)+'" target="_blank" rel="noopener noreferrer">'+esc(reference.title)+' ↗</a></li>').join('')+'</ol>':'<p>待补充：本词条尚未录入经核实的参考文献。</p>';
  }
  function details(entry){
    const category=categoryFor(entry);
    document.body.classList.add('ecg-entry-page');
    setPage(entry.title,entry.basic.summary,[{title:'图谱库',url:'/ecg/atlas'},{title:category.title,url:'/ecg/atlas/'+category.id},{title:entry.title}]);
    document.querySelector('.class-eyebrow').textContent='ECG ATLAS · DRAFT';
    const basic='<span class="class-section-label">基础层 · 默认展开</span>'+diagram(entry.basic.diagram.kind,entry.basic.diagram.caption)+'<h3>诊断要点</h3>'+points(entry.basic.diagnosticPoints)+'<h3>鉴别点</h3>'+points(entry.basic.differentialPoints);
    const periop=[['对手术时机的影响',entry.periop.timing],['麻醉关注点',entry.periop.anesthesia],['术后管理',entry.periop.postoperative],['何时会诊',entry.periop.consultation]].map(([title,text])=>'<section><h3>'+title+'</h3><p>'+esc(text)+'</p></section>').join('');
    app.innerHTML='<div class="ecg-layer-control"><span class="ecg-status">'+esc(entry.reviewStatus)+' · 草稿</span><button class="btn" id="ecgLayerToggle" type="button" aria-controls="ecgPeriopLayer" aria-expanded="false">展开围手术期层</button></div>'+section('ecg-basic','基础判读',basic)+'<details class="class-content-section ecg-periop" id="ecgPeriopLayer"><summary><h2>围手术期要点<span class="ecg-hint">对手术、麻醉、术后管理及会诊的影响 · 默认折叠</span></h2></summary>'+periop+'</details>'+section('ecg-references','参考文献',references(entry))+'<nav class="ecg-section-links" aria-label="词条导航"><a href="/ecg/atlas/'+category.id+'">返回'+esc(category.title)+'</a><a href="/ecg/periop">围手术期专区</a></nav>';
    const toggle=document.getElementById('ecgLayerToggle'),layer=document.getElementById('ecgPeriopLayer');
    function sync(){toggle.setAttribute('aria-expanded',String(layer.open));toggle.textContent=layer.open?'收起围手术期层':'展开围手术期层';}
    toggle.addEventListener('click',()=>{layer.open=!layer.open;sync();});
    layer.addEventListener('toggle',sync);
    const footerReference=document.getElementById('ecgFooterReferences');
    footerReference.innerHTML='<a href="#ecg-references">参考文献：'+(entry.references.length?entry.references.length+' 条':'待补充')+'</a>';
    const date=document.getElementById('ecgFooterDate');date.textContent=entry.updatedAt;date.dateTime=entry.updatedAt;
    document.getElementById('ecgFooterStatus').textContent=entry.reviewStatus;
    const footer=document.getElementById('ecgReviewFooter');
    const fitFooter=()=>document.documentElement.style.setProperty('--ecg-footer-height',footer.getBoundingClientRect().height+'px');
    fitFooter();if(typeof ResizeObserver==='function')new ResizeObserver(fitFooter).observe(footer);else window.addEventListener('resize',fitFooter);
  }
  function periop(){
    setPage('围手术期专区','联系手术紧迫性、症状、血流动力学状态及出血风险，按临床场景查阅。',[{title:'围手术期专区'}]);
    const scenarios=data.periop.scenarios.map(item=>{const entry=data.entries.find(entry=>entry.id===item.entry);return entry?card(entryUrl(entry),item.title,item.body,'图谱词条 · 待审核'):'<article class="class-disease-card ecg-card"><small>详细词条待建设</small><h3>'+esc(item.title)+'</h3><p>'+esc(item.body)+'</p></article>';}).join('');
    app.innerHTML='<nav class="ecg-section-links" aria-label="围手术期目录"><a href="#ecg-assessment">术前评估</a><a href="#ecg-scenarios">骨科高频场景</a><a href="#ecg-oncall">值班速查</a></nav>'+section('ecg-assessment','术前评估',points(data.periop.assessment)+'<p><a class="btn" href="/tools?tool=rcri">打开现有 RCRI 工具 →</a></p>')+section('ecg-scenarios','骨科高频场景','<div class="ecg-panel-grid">'+scenarios+'</div>')+section('ecg-oncall','值班速查',data.periop.onCall.map(item=>'<section><h3>'+esc(item.title)+'</h3>'+points(item.points)+'</section>').join(''));
  }
  function tools(){
    setPage('心电图工具','输入单位统一为毫秒（ms），计算在当前浏览器完成。结果需结合测量方法和临床背景。',[{title:'工具'}]);
    const input=(id,label,placeholder)=>'<label for="'+id+'">'+label+'<input id="'+id+'" name="'+id+'" type="number" inputmode="decimal" min="0" step="any" required placeholder="'+placeholder+'" aria-describedby="'+(id==='ecgHeartRr'?'ecgHeartHint':'ecgQtHint')+'"></label>';
    app.innerHTML=section('ecg-qtc','QTc 计算 · Bazett 与 Fridericia','<p id="ecgQtHint">QT 和 RR 均填 ms。例如 RR 1 秒应输入 1000。Bazett：QT / √RR；Fridericia：QT / ∛RR，公式中的 RR 使用秒。</p><form class="ecg-form" id="ecgQtForm" novalidate><div class="ecg-form-grid">'+input('ecgQt','QT 间期（ms）','例如 400')+input('ecgQtRr','RR 间期（ms）','例如 1000')+'</div><button class="btn primary" type="submit">计算 QTc</button><div class="ecg-result" id="ecgQtResult" role="status" aria-live="polite" hidden></div></form><p>心率过快或过慢时两种公式可能差异明显。房颤应结合多次测量；宽 QRS、起搏、明显 U 波等情况需专门解释，不依据本工具直接给出诊断或手术决定。</p>')+section('ecg-heart-rate','心率速算 · RR 间期法','<p id="ecgHeartHint">心率 = 60000 / RR（ms）。适用于根据测得的 RR 估算瞬时心率；不规则节律应测量多个周期，不能以单个 RR 代表平均心率。</p><form class="ecg-form" id="ecgHeartForm" novalidate>'+input('ecgHeartRr','RR 间期（ms）','例如 800')+'<button class="btn primary" type="submit">计算心率</button><div class="ecg-result" id="ecgHeartResult" role="status" aria-live="polite" hidden></div></form>')+section('ecg-rcri','围手术期心脏风险','<p>直接使用站内已有的 Revised Cardiac Risk Index，不重复实现评分。</p><a class="btn" href="/tools?tool=rcri">打开现有 RCRI 工具 →</a>');
    function bind(id,resultId,calculate){
      const form=document.getElementById(id),result=document.getElementById(resultId);
      form.addEventListener('input',()=>{result.hidden=true;result.replaceChildren();});
      form.addEventListener('submit',event=>{
        event.preventDefault();result.classList.remove('is-error');
        try{result.innerHTML=calculate();}catch(error){result.textContent=error.message;result.classList.add('is-error');}
        result.hidden=false;
      });
    }
    bind('ecgQtForm','ecgQtResult',()=>{const result=window.HAJIMI_ECG_CALCULATORS.qtc(document.getElementById('ecgQt').value,document.getElementById('ecgQtRr').value);return '<strong>Bazett：'+result.bazett.toFixed(0)+' ms</strong><strong>Fridericia：'+result.fridericia.toFixed(0)+' ms</strong><span>RR：'+result.rrSeconds.toFixed(3)+' s · 心率约 '+result.heartRate.toFixed(1)+' 次/分</span>';});
    bind('ecgHeartForm','ecgHeartResult',()=>'<strong>心率约 '+window.HAJIMI_ECG_CALCULATORS.heartRate(document.getElementById('ecgHeartRr').value).toFixed(1)+' 次/分</strong>');
  }
  function quiz(){
    setPage('自测','建设中',[{title:'自测'}]);
    app.innerHTML=section('ecg-quiz','建设中','<p>本阶段仅保留自测入口，暂未开放题目或评分。</p><a class="btn" href="/ecg/basics">先学习基础 →</a>');
  }
  function notFound(){setPage('页面未找到','请从栏目首页或图谱分类重新选择。',[{title:'页面未找到'}]);app.innerHTML='<p><a class="btn" href="/ecg">返回心电图首页</a></p>';}
  let route=[];try{route=location.pathname.replace(/\/+$/,'').split('/').filter(Boolean).map(decodeURIComponent);}catch{route=[];}
  if(route[0]!=='ecg')notFound();
  else if(route.length===1)home();
  else if(route.length===2&&route[1]==='basics')basics();
  else if(route.length===2&&route[1]==='periop')periop();
  else if(route.length===2&&route[1]==='tools')tools();
  else if(route.length===2&&route[1]==='quiz')quiz();
  else if(route[1]==='atlas'){
    const category=data.categories.find(item=>item.id===route[2]);
    const entry=data.entries.find(item=>item.id===route[3]&&item.category===route[2]);
    if(route.length===2)atlas();else if(route.length===3&&category)atlas(category);else if(route.length===4&&entry)details(entry);else notFound();
  }else notFound();
  // Deferred scripts create these targets before the measured public header is ready.
  if(location.hash)requestAnimationFrame(()=>{
    let id='';try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}
    const target=document.getElementById(id);
    if(target&&app.contains(target)){
      if(target.matches('details'))target.open=true;
      target.scrollIntoView({behavior:'instant',block:'start'});
    }
  });
})();
