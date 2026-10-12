(()=>{
  'use strict';
  const data=window.HAJIMI_ECG_DATA,app=document.getElementById('ecgApp');
  if(!data||!Array.isArray(data.entries)||!app){if(app)app.textContent='心电图资料暂时无法加载。';return;}
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const points=items=>'<ul class="ecg-points">'+items.map(text=>'<li>'+esc(text)+'</li>').join('')+'</ul>';
  const entryUrl=entry=>'/ecg/atlas/'+entry.category+'/'+entry.id;
  const categoryFor=entry=>data.categories.find(category=>category.id===entry.category);
  const RISK={high:['高风险','ecg-risk-high'],medium:['中等风险','ecg-risk-medium'],low:['低风险','ecg-risk-low']};
  const riskLabel=entry=>RISK[entry.risk]?RISK[entry.risk][0]:'';
  const riskBadge=entry=>RISK[entry.risk]?'<span class="ecg-risk '+RISK[entry.risk][1]+'">'+RISK[entry.risk][0]+'</span>':'';
  const criteriaTable=rows=>Array.isArray(rows)&&rows.length?'<h3>诊断标准</h3><div class="ecg-criteria-wrap"><table class="ecg-criteria"><tbody>'+rows.map(([item,value])=>'<tr><th scope="row">'+esc(item)+'</th><td>'+esc(value)+'</td></tr>').join('')+'</tbody></table></div><p class="ecg-hint">数值为成人常用标准，需结合年龄、性别、导联和临床背景；与本院或最新指南不一致时以后者为准。</p>':'';
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
    const entries=[['basics','基础学习','电活动、导联与电极位置、电轴与间期测量、伪差识别，再用六步法读图。','基'],['atlas','图谱库','按类别逐级查阅，搜索常见心电图词条及其围手术期要点。','图'],['periop','围手术期专区','术前异常心电图处置、骨科麻醉相关风险、术后胸闷流程与术后心肌损伤。','术']];
    app.innerHTML='<section class="class-section-head"><span>01 / LEARN & READ</span><h2>从这里开始</h2><p>基础层帮助认识波形，围手术期层联系临床场景。</p></section><div class="ecg-entry-grid">'+entries.map(([id,title,description,symbol],index)=>'<a class="class-dept-card is-ready" href="/ecg/'+id+'"><span class="class-dept-index">0'+(index+1)+'</span><div class="class-dept-symbol" aria-hidden="true">'+symbol+'</div><h3>'+title+'</h3><p>'+description+'</p><div class="class-dept-foot"><strong>进入栏目</strong><span aria-hidden="true">→</span></div></a>').join('')+'</div>'+section('ecg-more','工具、练习与报告','<div class="ecg-panel-grid">'+card('/ecg/tools','心电图工具','QTc 四种公式、电轴计算、格数换算、心率估算，以及现有 RCRI 入口。')+card('/ecg/quiz','病例练习','骨科围手术期场景的判读练习，作答后给出解析和规范报告。','示意病例')+card('/ecg/report','报告范例','标准化心电图报告结构、规范写法、范例与报告生成器。')+card('/ecg/phenomena','常见心电现象','超常传导、隐匿性传导、蝉联、干扰脱节、心脏记忆、拖带等 11 种现象。','进阶')+'</div>');
  }
  function basics(){
    setPage('基础学习','先核对记录质量与标定，再按统一顺序判读。以下为成人常用教学参考，资料待审核。',[{title:'基础学习'}]);
    const introduction=data.basics.introduction.map(item=>'<section id="ecg-'+item.id+'"><h3>'+esc(item.title)+'</h3>'+points(item.points)+'</section>').join('');
    const normal='<p>以下范围需结合年龄、性别、心率、导联和测量方法；不适用于直接替代个体化判断。</p>'+diagram('normal','规则的 P–QRS–T 用于认识各波段；正常与否仍需完整的 12 导联记录。')+'<dl class="ecg-values">'+data.basics.normalValues.map(item=>'<div><dt>'+esc(item.name)+'</dt><dd>'+esc(item.value)+'<p class="ecg-hint">'+esc(item.note)+'</p></dd></div>').join('')+'</dl><h3>常见正常变异</h3>'+points(data.basics.variants);
    const B=data.basics,table=(rows,head)=>'<div class="ecg-criteria-wrap"><table class="ecg-criteria">'+(head?'<thead><tr><th scope="col">'+esc(head[0])+'</th><th scope="col">'+esc(head[1])+'</th></tr></thead>':'')+'<tbody>'+rows.map(([a,b])=>'<tr><th scope="row">'+esc(a)+'</th><td>'+esc(b)+'</td></tr>').join('')+'</tbody></table></div>';
    const parts=[['ecg-introduction','入门',introduction],['ecg-normal','正常心电图',normal],['ecg-six-steps','读图六步法','<ol class="ecg-steps">'+B.steps.map(step=>'<li><h3>'+esc(step.title)+'</h3><p>'+esc(step.body)+'</p></li>').join('')+'</ol>']];
    if(B.calibration)parts.push(['ecg-calibration','定标与走纸速度',points(B.calibration.points)]);
    if(B.electrodes)parts.push(['ecg-electrodes','电极位置与接反识别','<h3>胸前导联</h3><figure class="ecg-figure"><div class="ecg-figure-scroll" tabindex="0" role="region" aria-label="胸前导联电极位置示意图">'+window.HAJIMI_ECG_WAVEFORMS.electrodes()+'</div><figcaption><strong>示意图 · 非解剖比例</strong></figcaption></figure>'+points(B.electrodes.chest)+'<h3>肢体导联</h3>'+points(B.electrodes.limb)+'<h3>常见接反与放置错误</h3>'+diagram('lead-reversal','左右上肢电极接反：I 导联 P、QRS、T 全部倒置，而胸导联正常。')+table(B.electrodes.reversals,['情况','心电图线索'])]);
    if(B.axisGuide)parts.push(['ecg-axis','电轴测量',points(B.axisGuide.steps)+table(B.axisGuide.ranges,['电轴','范围与常见原因'])+'<p><a class="btn" href="/ecg/tools#ecg-axis-tool">打开电轴计算工具 →</a></p>']);
    if(B.intervals)parts.push(['ecg-intervals','间期测量方法',table(B.intervals,['项目','测量方法与参考'])+'<p><a class="btn" href="/ecg/tools">打开间期与 QTc 工具 →</a></p>']);
    if(B.artifacts)parts.push(['ecg-artifacts','伪差识别',B.artifacts.map(item=>'<section><h3>'+esc(item.title)+'</h3>'+diagram(item.kind,item.points[0])+points(item.points.slice(1))+'</section>').join('')]);
    if(B.textbookNormals)parts.push(['ecg-textbook-normals','各导联正常值（教材要点）','<p>按导联逐项整理，便于对照具体导联判读。</p>'+table(B.textbookNormals.rows,['项目','正常范围与要点'])+'<p class="ecg-hint">'+esc(B.textbookNormals.note)+'</p>'+textbookNote(B.textbookNormals.source)]);
    if(B.qrsNaming)parts.push(['ecg-qrs-naming','QRS 波群命名与测量',points(B.qrsNaming)+'<p><a class="btn" href="/ecg/phenomena">进阶：常见心电现象 →</a></p>']);
    if(B.references)parts.push(['ecg-basics-refs','参考文献','<ol class="ecg-points">'+B.references.map(ref=>'<li><a href="'+esc(ref.url)+'" target="_blank" rel="noopener noreferrer">'+esc(ref.title)+' ↗</a></li>').join('')+'</ol>']);
    app.innerHTML='<nav class="ecg-section-links" aria-label="基础学习目录">'+parts.map(([id,title])=>'<a href="#'+id+'">'+esc(title)+'</a>').join('')+'</nav>'+parts.map(([id,title,html])=>section(id,title,html)).join('');
  }
  const normalize=text=>String(text).normalize('NFKC').toLowerCase();
  function atlas(category){
    setPage(category?category.title:'图谱库',category?category.description:'按类别逐级查阅，或直接搜索疾病名、英文缩写和关键表现。',category?[{title:'图谱库',url:'/ecg/atlas'},{title:category.title}]:[{title:'图谱库'}]);
    const entries=category?data.entries.filter(entry=>entry.category===category.id):data.entries;
    const categories=category?'<nav class="ecg-section-links" aria-label="图谱导航"><a href="/ecg/atlas">← 全部图谱类别</a></nav>':'<section id="ecgCategoryDirectory" aria-labelledby="ecgCategoriesTitle"><h2 id="ecgCategoriesTitle">按类别查阅</h2><div class="ecg-category-grid">'+data.categories.map(item=>{const count=data.entries.filter(entry=>entry.category===item.id).length;return card('/ecg/atlas/'+item.id,item.title,item.description,count?count+' 个词条 · 待审核':'建设中');}).join('')+'</div></section>';
    app.innerHTML='<section class="ecg-search" aria-label="搜索图谱"><label class="class-search-label" for="ecgSearch">搜索心电图图谱</label><input class="class-filter" id="ecgSearch" type="search" placeholder="例如：房颤、STEMI、文氏、LBBB、低钾、起搏" autocomplete="off"><div class="ecg-search-actions"><span id="ecgSearchCount" role="status" aria-live="polite"></span><button type="button" class="btn" id="ecgClearSearch" hidden>清空搜索</button></div></section>'+categories+'<section aria-labelledby="ecgResultsTitle"><h2 id="ecgResultsTitle">词条</h2><div class="ecg-panel-grid" id="ecgSearchResults">'+entries.map(entry=>'<div data-ecg-entry="'+entry.id+'">'+card(entryUrl(entry),entry.title,entry.basic.summary,[categoryFor(entry).title,riskLabel(entry),entry.reviewStatus].filter(Boolean).join(' · '))+'</div>').join('')+'</div><p id="ecgSearchEmpty" hidden></p></section>';
    const field=document.getElementById('ecgSearch'),count=document.getElementById('ecgSearchCount'),empty=document.getElementById('ecgSearchEmpty'),clear=document.getElementById('ecgClearSearch');
    const index=entries.map((entry,order)=>({id:entry.id,order,key:normalize([entry.title,...entry.aliases].join(' ')),text:normalize([entry.title,categoryFor(entry).title,...entry.aliases,entry.basic.summary,...entry.basic.diagnosticPoints,...entry.basic.differentialPoints,...(entry.basic.criteria||[]).flat(),...Object.values(entry.periop)].join(' '))}));
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
    const list=refs.length?'<ol class="ecg-points">'+refs.map(reference=>'<li><a href="'+esc(reference.url)+'" target="_blank" rel="noopener noreferrer">'+esc(reference.title)+' ↗</a></li>').join('')+'</ol>':'<p>待补充：本词条尚未录入经核实的参考文献。</p>';
    return list+textbookNote(entry.textbook);
  }
  function textbookNote(source){
    if(!source||!data.textbook)return '';
    return '<p class="ecg-textbook"><strong>学习教材</strong>'+esc(data.textbook.title)+'，'+esc(source.chapter)+'，第 '+esc(source.pages)+' 页。<span class="ecg-hint">'+esc(data.textbook.note)+'</span></p>';
  }
  function related(entry){
    const items=(entry.related||[]).map(id=>data.entries.find(other=>other.id===id)).filter(Boolean);
    return items.length?section('ecg-related','相关词条','<div class="ecg-panel-grid">'+items.map(other=>card(entryUrl(other),other.title,other.basic.summary,[categoryFor(other).title,riskLabel(other)].filter(Boolean).join(' · '))).join('')+'</div>'):'';
  }
  function details(entry){
    const category=categoryFor(entry);
    document.body.classList.add('ecg-entry-page');
    setPage(entry.title,entry.basic.summary,[{title:'图谱库',url:'/ecg/atlas'},{title:category.title,url:'/ecg/atlas/'+category.id},{title:entry.title}]);
    document.querySelector('.class-eyebrow').textContent='ECG ATLAS · DRAFT';
    const basic='<span class="class-section-label">基础层 · 默认展开</span>'+diagram(entry.basic.diagram.kind,entry.basic.diagram.caption)+criteriaTable(entry.basic.criteria)+'<h3>诊断要点</h3>'+points(entry.basic.diagnosticPoints)+'<h3>鉴别点</h3>'+points(entry.basic.differentialPoints);
    const periop=[['对手术时机的影响',entry.periop.timing],['麻醉关注点',entry.periop.anesthesia],['术后管理',entry.periop.postoperative],['何时会诊',entry.periop.consultation]].map(([title,text])=>'<section><h3>'+title+'</h3><p>'+esc(text)+'</p></section>').join('');
    app.innerHTML='<div class="ecg-layer-control">'+riskBadge(entry)+'<span class="ecg-status">'+esc(entry.reviewStatus)+' · 草稿</span><button class="btn" id="ecgLayerToggle" type="button" aria-controls="ecgPeriopLayer" aria-expanded="false">展开围手术期层</button></div>'+section('ecg-basic','基础判读',basic)+'<details class="class-content-section ecg-periop" id="ecgPeriopLayer"><summary><h2>围手术期要点<span class="ecg-hint">对手术、麻醉、术后管理及会诊的影响 · 默认折叠</span></h2></summary>'+periop+'</details>'+related(entry)+section('ecg-references','参考文献',references(entry))+'<nav class="ecg-section-links" aria-label="词条导航"><a href="/ecg/atlas/'+category.id+'">返回'+esc(category.title)+'</a><a href="/ecg/periop">围手术期专区</a></nav>';
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
    const P=data.periop;
    setPage('围手术期专区','骨科术前异常心电图、麻醉相关风险、术后胸闷与心肌损伤：联系手术紧迫性、症状、血流动力学状态及出血风险。',[{title:'围手术期专区'}]);
    const link=id=>{const entry=id&&data.entries.find(item=>item.id===id);return entry?'<a href="'+esc(entryUrl(entry))+'">'+esc(entry.title)+' →</a>':'';};
    const scenarios=P.scenarios.map(item=>{const entry=data.entries.find(entry=>entry.id===item.entry);return entry?card(entryUrl(entry),item.title,item.body,'图谱词条 · 待审核'):'<article class="class-disease-card ecg-card"><small>详细词条待建设</small><h3>'+esc(item.title)+'</h3><p>'+esc(item.body)+'</p></article>';}).join('');
    const LEVEL={proceed:['通常可手术','ecg-risk-low'],evaluate:['评估后决定','ecg-risk-medium'],postpone:['推迟择期手术','ecg-risk-high']};
    const parts=[];const nav=[];
    const add=(id,title,html)=>{nav.push('<a href="#'+id+'">'+esc(title)+'</a>');parts.push(section(id,title,html));};
    add('ecg-assessment','术前评估',points(P.assessment)+'<p><a class="btn" href="/tools?tool=rcri">打开现有 RCRI 工具 →</a></p>');
    if(P.indications)add('ecg-indications','术前心电图：谁需要做','<p>'+esc(P.indications.intro)+'</p>'+points(P.indications.points));
    if(P.surgeryRisk)add('ecg-surgery-risk','骨科手术的心血管风险','<div class="ecg-criteria-wrap"><table class="ecg-criteria ecg-table-3"><thead><tr><th scope="col">手术类型</th><th scope="col">风险分级</th><th scope="col">评估重点</th></tr></thead><tbody>'+P.surgeryRisk.map(row=>'<tr>'+row.map((cell,i)=>i?'<td>'+esc(cell)+'</td>':'<th scope="row">'+esc(cell)+'</th>').join('')+'</tr>').join('')+'</tbody></table></div><p class="ecg-hint">风险分级参考 ESC 2022 非心脏手术指南（30 天心血管死亡或心梗的估计风险）；患者自身因素同样重要。</p>');
    if(P.abnormal)add('ecg-abnormal','术前异常心电图怎么办','<p>按心电图发现查找处置建议；最终决定需结合症状、手术紧迫性和多学科讨论。</p><div class="ecg-abnormal-list">'+P.abnormal.map(item=>'<article class="ecg-abnormal-item"><div class="ecg-abnormal-head"><h3>'+esc(item.finding)+'</h3><span class="ecg-risk '+LEVEL[item.level][1]+'">'+LEVEL[item.level][0]+'</span></div><p>'+esc(item.action)+'</p>'+link(item.entry)+'</article>').join('')+'</div>');
    add('ecg-scenarios','骨科高频场景','<div class="ecg-panel-grid">'+scenarios+'</div>');
    if(P.anesthesia)add('ecg-anesthesia','麻醉与术中相关风险','<div class="ecg-abnormal-list">'+P.anesthesia.map(item=>'<article class="ecg-abnormal-item"><h3>'+esc(item.title)+'</h3><dl class="ecg-mini-dl"><dt>常见场景</dt><dd>'+esc(item.context)+'</dd><dt>心电图与循环表现</dt><dd>'+esc(item.ecg)+'</dd><dt>应对要点</dt><dd>'+esc(item.response)+'</dd></dl>'+link(item.link)+'</article>').join('')+'</div>');
    if(P.postopFlow)add('ecg-postop','术后胸闷 / 胸痛：处理流程','<ol class="ecg-steps ecg-flow">'+P.postopFlow.map(step=>'<li><strong>'+esc(step.title)+'</strong><p>'+esc(step.body)+'</p></li>').join('')+'</ol>');
    if(P.injury)add('ecg-injury','术后心肌损伤','<p>'+esc(P.injury.intro)+'</p><div class="ecg-criteria-wrap"><table class="ecg-criteria"><tbody>'+P.injury.rows.map(([a,b])=>'<tr><th scope="row">'+esc(a)+'</th><td>'+esc(b)+'</td></tr>').join('')+'</tbody></table></div><h3>发现后怎么做</h3>'+points(P.injury.points)+'<p>'+link('nste-ischemia')+'</p>');
    add('ecg-oncall','值班速查',P.onCall.map(item=>'<section><h3>'+esc(item.title)+'</h3>'+points(item.points)+'</section>').join(''));
    if(P.references)add('ecg-periop-refs','参考文献','<ol class="ecg-points">'+P.references.map(ref=>'<li><a href="'+esc(ref.url)+'" target="_blank" rel="noopener noreferrer">'+esc(ref.title)+' ↗</a></li>').join('')+'</ol><p class="ecg-hint">专题内容为草稿，待临床医师审核；不含固定药物剂量，具体处理以本院流程为准。</p>');
    app.innerHTML='<nav class="ecg-section-links" aria-label="围手术期目录">'+nav.join('')+'</nav>'+parts.join('');
  }
  function tools(){
    setPage('心电图工具','QTc、电轴、格数换算与心率估算。计算在当前浏览器完成，结果需结合测量方法和临床背景。',[{title:'工具'}]);
    const input=(id,label,placeholder)=>'<label for="'+id+'">'+label+'<input id="'+id+'" name="'+id+'" type="number" inputmode="decimal" min="0" step="any" required placeholder="'+placeholder+'" aria-describedby="'+(id==='ecgHeartRr'?'ecgHeartHint':'ecgQtHint')+'"></label>';
    app.innerHTML=section('ecg-qtc','QTc 计算 · Bazett、Fridericia、Framingham、Hodges','<p id="ecgQtHint">QT 和 RR 均填 ms。例如 RR 1 秒应输入 1000。Bazett：QT / √RR；Fridericia：QT / ∛RR；Framingham：QT + 154 ×（1 − RR）；Hodges：QT + 1.75 ×（心率 − 60）。公式中的 RR 使用秒。</p><form class="ecg-form" id="ecgQtForm" novalidate><div class="ecg-form-grid">'+input('ecgQt','QT 间期（ms）','例如 400')+input('ecgQtRr','RR 间期（ms）','例如 1000')+'</div><button class="btn primary" type="submit">计算 QTc</button><div class="ecg-result" id="ecgQtResult" role="status" aria-live="polite" hidden></div></form><p>心率过快或过慢时两种公式可能差异明显。房颤应结合多次测量；宽 QRS、起搏、明显 U 波等情况需专门解释，不依据本工具直接给出诊断或手术决定。</p>')+section('ecg-heart-rate','心率速算 · RR 间期法','<p id="ecgHeartHint">心率 = 60000 / RR（ms）。适用于根据测得的 RR 估算瞬时心率；不规则节律应测量多个周期，不能以单个 RR 代表平均心率。</p><form class="ecg-form" id="ecgHeartForm" novalidate>'+input('ecgHeartRr','RR 间期（ms）','例如 800')+'<button class="btn primary" type="submit">计算心率</button><div class="ecg-result" id="ecgHeartResult" role="status" aria-live="polite" hidden></div></form>')+section('ecg-rcri','围手术期心脏风险','<p>直接使用站内已有的 Revised Cardiac Risk Index，不重复实现评分。</p><a class="btn" href="/tools?tool=rcri">打开现有 RCRI 工具 →</a>');
    const field=(id,label,placeholder,extra='')=>'<label for="'+id+'">'+label+'<input id="'+id+'" name="'+id+'" type="number" inputmode="decimal" step="any" required placeholder="'+placeholder+'" '+extra+'></label>';
    const speed=id=>'<label for="'+id+'">走纸速度<select id="'+id+'"><option value="25">25 mm/s（标准）</option><option value="50">50 mm/s</option></select></label>';
    app.insertAdjacentHTML('beforeend',
      section('ecg-axis-tool','电轴计算 · I 与 aVF 净振幅','<p>QRS 净振幅 = R 波高度 − Q 与 S 波深度（mm，向下为负）。电轴 ≈ arctan（aVF / I），以 I 导联为 0°、aVF 为 +90°。</p><form class="ecg-form" id="ecgAxisForm" novalidate><div class="ecg-form-grid">'+field('ecgAxisI','I 导联净振幅（mm）','例如 6')+field('ecgAxisF','aVF 导联净振幅（mm）','例如 −4')+'</div><button class="btn primary" type="submit">计算电轴</button><div class="ecg-result" id="ecgAxisResult" role="status" aria-live="polite" hidden></div></form><p>两导联均接近 0 时结果不可靠，请改用等电位导联法。<a href="/ecg/basics#ecg-axis">查看电轴测量方法</a></p>')+
      section('ecg-grid-tool','格数换算 · 间期与振幅','<p>1 小格 = 1 mm。25 mm/s 时 1 小格 = 40 ms；50 mm/s 时 1 小格 = 20 ms。标准增益 10 mm/mV 时 1 小格 = 0.1 mV。</p><form class="ecg-form" id="ecgGridForm" novalidate><div class="ecg-form-grid">'+field('ecgGridBoxes','间期所占小格数','例如 4.5','min="0"')+speed('ecgGridSpeed')+'</div><button class="btn primary" type="submit">换算间期</button><div class="ecg-result" id="ecgGridResult" role="status" aria-live="polite" hidden></div></form><form class="ecg-form" id="ecgAmpForm" novalidate><div class="ecg-form-grid">'+field('ecgAmpMm','振幅（mm，向下为负）','例如 2')+'<label for="ecgAmpGain">增益<select id="ecgAmpGain"><option value="10">10 mm/mV（标准）</option><option value="5">5 mm/mV（半电压）</option><option value="20">20 mm/mV（双电压）</option></select></label></div><button class="btn primary" type="submit">换算振幅</button><div class="ecg-result" id="ecgAmpResult" role="status" aria-live="polite" hidden></div></form>')+
      section('ecg-rate-tool','心率估算 · 格数法与 6 秒法','<form class="ecg-form" id="ecgRateBoxForm" novalidate><div class="ecg-form-grid">'+field('ecgRateBoxes','RR 间小格数','例如 20','min="0"')+speed('ecgRateSpeed')+'</div><button class="btn primary" type="submit">按格数计算</button><div class="ecg-result" id="ecgRateBoxResult" role="status" aria-live="polite" hidden></div></form><form class="ecg-form" id="ecgSixForm" novalidate>'+field('ecgSixCount','6 秒内 QRS 个数','例如 8','min="0"')+'<button class="btn primary" type="submit">按 6 秒法计算</button><div class="ecg-result" id="ecgSixResult" role="status" aria-live="polite" hidden></div></form><p>规则节律优先用格数法；房颤等不规则节律用 6 秒法（或更长记录），并报告心室率范围。</p>'));
    function bind(id,resultId,calculate){
      const form=document.getElementById(id),result=document.getElementById(resultId);
      form.addEventListener('input',()=>{result.hidden=true;result.replaceChildren();});
      form.addEventListener('submit',event=>{
        event.preventDefault();result.classList.remove('is-error');
        try{result.innerHTML=calculate();}catch(error){result.textContent=error.message;result.classList.add('is-error');}
        result.hidden=false;
      });
    }
    bind('ecgQtForm','ecgQtResult',()=>{const result=window.HAJIMI_ECG_CALCULATORS.qtc(document.getElementById('ecgQt').value,document.getElementById('ecgQtRr').value);return '<strong>Bazett：'+result.bazett.toFixed(0)+' ms</strong><strong>Fridericia：'+result.fridericia.toFixed(0)+' ms</strong><strong>Framingham：'+result.framingham.toFixed(0)+' ms</strong><strong>Hodges：'+result.hodges.toFixed(0)+' ms</strong><span>RR：'+result.rrSeconds.toFixed(3)+' s · 心率约 '+result.heartRate.toFixed(1)+' 次/分</span>';});
    const C=window.HAJIMI_ECG_CALCULATORS,val=id=>document.getElementById(id).value;
    bind('ecgAxisForm','ecgAxisResult',()=>{const r=C.axis(val('ecgAxisI'),val('ecgAxisF'));return '<strong>电轴约 '+(r.degrees>0?'+':'')+r.degrees+'°</strong><span>'+esc(r.category)+'</span>';});
    bind('ecgGridForm','ecgGridResult',()=>'<strong>'+C.boxesToMs(val('ecgGridBoxes'),val('ecgGridSpeed')).toFixed(0)+' ms</strong>');
    bind('ecgAmpForm','ecgAmpResult',()=>'<strong>'+C.mmToMv(val('ecgAmpMm'),val('ecgAmpGain')).toFixed(2)+' mV</strong>');
    bind('ecgRateBoxForm','ecgRateBoxResult',()=>'<strong>心率约 '+C.heartRateFromBoxes(val('ecgRateBoxes'),val('ecgRateSpeed')).toFixed(0)+' 次/分</strong>');
    bind('ecgSixForm','ecgSixResult',()=>'<strong>平均心室率约 '+C.heartRateSixSecond(val('ecgSixCount'))+' 次/分</strong>');
    bind('ecgHeartForm','ecgHeartResult',()=>'<strong>心率约 '+window.HAJIMI_ECG_CALCULATORS.heartRate(document.getElementById('ecgHeartRr').value).toFixed(1)+' 次/分</strong>');
  }
  function quiz(){
    const cases=Array.isArray(data.cases)?data.cases:[];
    setPage('病例练习','以骨科围手术期场景为背景的心电图判读练习。作答后查看解析、规范报告写法和相关词条。',[{title:'病例练习'}]);
    if(!cases.length){app.innerHTML=section('ecg-quiz','建设中','<p>暂未开放题目。</p>');return;}
    const target=item=>{if(item.link)return item.link;const entry=data.entries.find(other=>other.id===item.entry);return entry?{url:entryUrl(entry),title:entry.title}:null;};
    app.innerHTML='<div class="class-notice"><strong>示意病例 · 非真实患者</strong><span>图形为自绘教学示意，用于练习判读思路，比例不用于测量；真实 12 导联病例待加入。内容待临床医师审核。</span></div>'+
      '<div class="ecg-quiz-bar"><span id="ecgQuizScore" role="status" aria-live="polite">已答 0 / '+cases.length+' 题</span><button type="button" class="btn" id="ecgQuizReset">重新开始</button></div>'+
      '<nav class="ecg-section-links" aria-label="题目导航">'+cases.map((item,index)=>'<a href="#'+item.id+'">'+(index+1)+'</a>').join('')+'</nav>'+
      cases.map((item,index)=>'<section class="class-content-section ecg-case" id="'+item.id+'" data-case="'+item.id+'"><h2><span class="ecg-case-no">'+(index+1)+'</span>'+esc(item.title)+'</h2><p class="ecg-vignette">'+esc(item.vignette)+'</p>'+diagram(item.kind,'病例 '+(index+1)+' 的心电图示意')+
        '<form class="ecg-case-form" novalidate><fieldset><legend>'+esc(item.question)+'</legend>'+item.options.map((option,i)=>'<label class="ecg-option"><input type="radio" name="'+item.id+'" value="'+i+'"><span>'+String.fromCharCode(65+i)+'. '+esc(option)+'</span></label>').join('')+'</fieldset><button class="btn primary" type="submit">提交答案</button><p class="ecg-case-error" role="alert" hidden>请先选择一个答案。</p></form>'+
        '<div class="ecg-case-feedback" hidden></div></section>').join('');
    const results=new Map(),score=document.getElementById('ecgQuizScore');
    const refresh=()=>{const right=[...results.values()].filter(Boolean).length;score.textContent='已答 '+results.size+' / '+cases.length+' 题 · 答对 '+right+' 题';};
    for(const item of cases){
      const box=app.querySelector('[data-case="'+item.id+'"]'),form=box.querySelector('form'),feedback=box.querySelector('.ecg-case-feedback'),error=box.querySelector('.ecg-case-error');
      form.addEventListener('submit',event=>{
        event.preventDefault();
        const picked=form.querySelector('input:checked');
        if(!picked){error.hidden=false;return;}
        error.hidden=true;
        const chosen=Number(picked.value),correct=chosen===item.answer,link=target(item);
        results.set(item.id,correct);
        form.querySelectorAll('input').forEach(input=>{input.disabled=true;const label=input.closest('label');label.classList.toggle('is-answer',Number(input.value)===item.answer);label.classList.toggle('is-wrong',input===picked&&!correct);});
        form.querySelector('button').disabled=true;
        feedback.innerHTML='<p class="ecg-case-verdict '+(correct?'is-right':'is-wrong')+'">'+(correct?'回答正确。':'回答不正确。正确答案是 '+String.fromCharCode(65+item.answer)+'。')+'</p><h3>解析</h3><p>'+esc(item.explanation)+'</p><h3>规范报告写法</h3><blockquote class="ecg-report-quote">'+esc(item.report)+'</blockquote>'+(link?'<p><a class="btn" href="'+esc(link.url)+'">查看：'+esc(link.title)+' →</a></p>':'');
        feedback.hidden=false;
        refresh();
      });
    }
    document.getElementById('ecgQuizReset').addEventListener('click',()=>{results.clear();refresh();for(const box of app.querySelectorAll('[data-case]')){box.querySelector('form').reset();box.querySelectorAll('input,button').forEach(element=>element.disabled=false);box.querySelectorAll('label').forEach(label=>label.classList.remove('is-answer','is-wrong'));const feedback=box.querySelector('.ecg-case-feedback');feedback.hidden=true;feedback.replaceChildren();}window.scrollTo({top:0,behavior:'instant'});});
    refresh();
  }
  function report(){
    const R=data.report;
    setPage('报告范例','标准化心电图报告的结构、规范写法与范例；报告生成器只在当前浏览器中运行，不保存、不上传。',[{title:'报告范例'}]);
    if(!R){notFound();return;}
    const table=rows=>'<div class="ecg-criteria-wrap"><table class="ecg-criteria"><tbody>'+rows.map(([a,b])=>'<tr><th scope="row">'+esc(a)+'</th><td>'+esc(b)+'</td></tr>').join('')+'</tbody></table></div>';
    const sample='<h3>'+esc(R.sample.title)+'</h3><div class="ecg-report-sheet">'+R.sample.lines.map(line=>'<p>'+esc(line)+'</p>').join('')+'<p><strong>结论：</strong></p><ol>'+R.sample.conclusion.map(line=>'<li>'+esc(line)+'</li>').join('')+'</ol></div>';
    const examples=(data.cases||[]).map(item=>'<li><strong>'+esc(item.title)+'：</strong>'+esc(item.report)+'</li>').join('');
    const opt=values=>values.map(value=>'<option>'+esc(value)+'</option>').join('');
    const builder='<p>按实际测量填写，未填写的项目不会出现在报告中。请勿填写姓名、住院号等身份信息。</p><form class="ecg-form" id="ecgReportForm" novalidate><div class="ecg-form-grid">'+
      '<label for="ecgRpRhythm">心律<select id="ecgRpRhythm">'+opt(['窦性心律','窦性心动过速','窦性心动过缓','心房颤动','心房扑动','交界性心律','心室起搏心律'])+'</select></label>'+
      '<label for="ecgRpRate">心率（次/分）<input id="ecgRpRate" type="number" inputmode="decimal" min="0" step="any" placeholder="例如 72"></label>'+
      '<label for="ecgRpPr">PR 间期（ms）<input id="ecgRpPr" type="number" inputmode="decimal" min="0" step="any" placeholder="例如 160"></label>'+
      '<label for="ecgRpQrs">QRS 时限（ms）<input id="ecgRpQrs" type="number" inputmode="decimal" min="0" step="any" placeholder="例如 90"></label>'+
      '<label for="ecgRpQt">QT 间期（ms）<input id="ecgRpQt" type="number" inputmode="decimal" min="0" step="any" placeholder="例如 400"></label>'+
      '<label for="ecgRpAxis">电轴（度）<input id="ecgRpAxis" type="number" inputmode="decimal" step="any" placeholder="例如 60"></label>'+
      '</div><label for="ecgRpFindings">其他描述（ST-T、QRS 形态等，每行一条）<textarea id="ecgRpFindings" rows="3" placeholder="例如：V1–V2 导联 T 波倒置"></textarea></label>'+
      '<label for="ecgRpConclusion">结论（按重要性排序，每行一条）<textarea id="ecgRpConclusion" rows="3" placeholder="例如：窦性心律&#10;一度房室传导阻滞"></textarea></label>'+
      '<button class="btn primary" type="submit">生成报告</button><div class="ecg-result" id="ecgRpResult" role="status" aria-live="polite" hidden></div></form>';
    app.innerHTML='<nav class="ecg-section-links" aria-label="报告目录"><a href="#ecg-report-structure">报告结构</a><a href="#ecg-report-rules">规范写法</a><a href="#ecg-report-sample">完整范例</a><a href="#ecg-report-examples">练习病例报告</a><a href="#ecg-report-builder">报告生成器</a></nav>'+
      section('ecg-report-structure','报告结构',table(R.structure))+section('ecg-report-rules','规范写法',points(R.rules))+section('ecg-report-sample','完整范例',sample)+
      section('ecg-report-examples','练习病例的规范报告','<ul class="ecg-points">'+examples+'</ul><p><a class="btn" href="/ecg/quiz">去做病例练习 →</a></p>')+section('ecg-report-builder','报告生成器',builder);
    const form=document.getElementById('ecgReportForm'),out=document.getElementById('ecgRpResult'),C=window.HAJIMI_ECG_CALCULATORS,v=id=>document.getElementById(id).value.trim();
    form.addEventListener('input',()=>{out.hidden=true;out.replaceChildren();});
    form.addEventListener('submit',event=>{
      event.preventDefault();out.classList.remove('is-error');
      try{
        const num=(value,label)=>{const n=Number(value);if(!Number.isFinite(n)||n<=0)throw new RangeError(label+'请输入大于 0 的数值。');return n;};
        const lines=[],rate=v('ecgRpRate'),qt=v('ecgRpQt'),axisValue=v('ecgRpAxis');
        lines.push('心律：'+v('ecgRpRhythm')+'。'+(rate?'心率：'+Math.round(num(rate,'心率'))+' 次/分。':''));
        const intervals=[];
        if(v('ecgRpPr'))intervals.push('PR 间期 '+Math.round(num(v('ecgRpPr'),'PR 间期'))+' ms');
        if(v('ecgRpQrs'))intervals.push('QRS 时限 '+Math.round(num(v('ecgRpQrs'),'QRS 时限'))+' ms');
        if(qt){if(!rate)throw new RangeError('计算 QTc 需要同时填写心率。');const q=C.qtc(num(qt,'QT 间期'),60000/num(rate,'心率'));intervals.push('QT/QTc '+Math.round(Number(qt))+'/'+Math.round(q.bazett)+' ms（Bazett）');}
        if(intervals.length)lines.push(intervals.join('；')+'。');
        if(axisValue){const deg=Number(axisValue);if(!Number.isFinite(deg)||deg<=-180||deg>180)throw new RangeError('电轴请输入 −180 至 +180 之间的度数。');const r=C.axis(Math.cos(deg*Math.PI/180),Math.sin(deg*Math.PI/180));lines.push('电轴：'+(deg>0?'+':'')+Math.round(deg)+'°（'+r.category.replace(/（.*$/,'')+'）。');}
        for(const line of v('ecgRpFindings').split('\n').map(text=>text.trim()).filter(Boolean))lines.push(line.replace(/[。.]?$/,'。'));
        const conclusion=v('ecgRpConclusion').split('\n').map(text=>text.trim()).filter(Boolean);
        const text=lines.join('\n')+(conclusion.length?'\n结论：\n'+conclusion.map((line,index)=>(index+1)+'. '+line).join('\n'):'');
        out.innerHTML='<pre class="ecg-report-text">'+esc(text)+'</pre><button type="button" class="btn" id="ecgRpCopy">复制报告</button>';
        document.getElementById('ecgRpCopy').addEventListener('click',async event=>{try{await navigator.clipboard.writeText(text);event.target.textContent='已复制';}catch{event.target.textContent='复制失败，请长按文字手动复制';}});
      }catch(error){out.textContent=error.message;out.classList.add('is-error');}
      out.hidden=false;
    });
  }
  function phenomena(){
    const P=data.phenomena;
    setPage('常见心电现象','超常传导、隐匿性传导、蝉联、干扰脱节、心脏记忆等：用电生理机制解释“看起来矛盾”的心电图。',[{title:'心电现象'}]);
    if(!P){notFound();return;}
    app.innerHTML='<nav class="ecg-section-links" aria-label="心电现象目录">'+P.items.map(item=>'<a href="#ecg-ph-'+esc(item.id)+'">'+esc(item.title)+'</a>').join('')+'</nav>'+
      P.items.map(item=>section('ecg-ph-'+item.id,item.title,'<p>'+esc(item.definition)+'</p><h3>心电图表现</h3>'+points(item.ecg)+'<h3>意义与鉴别</h3><p>'+esc(item.significance)+'</p>')).join('')+
      section('ecg-ph-source','出处',textbookNote(P.source)+'<p><a class="btn" href="/ecg/basics">返回基础学习 →</a></p>');
  }
  function notFound(){setPage('页面未找到','请从栏目首页或图谱分类重新选择。',[{title:'页面未找到'}]);app.innerHTML='<p><a class="btn" href="/ecg">返回心电图首页</a></p>';}
  let route=[];try{route=location.pathname.replace(/\/+$/,'').split('/').filter(Boolean).map(decodeURIComponent);}catch{route=[];}
  if(route[0]!=='ecg')notFound();
  else if(route.length===1)home();
  else if(route.length===2&&route[1]==='basics')basics();
  else if(route.length===2&&route[1]==='periop')periop();
  else if(route.length===2&&route[1]==='tools')tools();
  else if(route.length===2&&route[1]==='quiz')quiz();
  else if(route.length===2&&route[1]==='report')report();
  else if(route.length===2&&route[1]==='phenomena')phenomena();
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
