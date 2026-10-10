(()=>{
'use strict';
const data=window.HAJIMI_CLASSIFICATION_DATA;
const app=document.getElementById('classificationApp');
if(!data||!Array.isArray(data.entries)||!app){if(app)app.textContent='分型资料暂时无法加载。';return;}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const areas=[...new Set(data.entries.map(x=>x.area))];
const parts=location.pathname.replace(/\/+$/,'').split('/').filter(Boolean);
const department=parts[1],slug=parts[2],disease=data.entries.find(x=>x.id===slug);
const crumbs=document.getElementById('classBreadcrumb');
const count=document.getElementById('classDiseaseCount');if(count)count.textContent=String(data.entries.length);
const link=(url,label)=>'<a target="_blank" rel="noopener noreferrer" href="'+esc(url)+'">'+esc(label)+' <span aria-hidden="true">↗</span></a>';
const root='<a href="/">首页</a><span>›</span><a href="/classification">疾病分型</a>';
function setCrumbs(extra){crumbs.innerHTML=root+extra;}
function departments(){
 setCrumbs('');
 const active=data.departments.filter(d=>d.ready).length;
 app.innerHTML='<section class="class-section-head"><span>01 / DEPARTMENTS</span><h2>按科室浏览</h2><p>不同科室分别维护自己的疾病分型与治疗证据。骨科资料已经开始整理，其他科室保留独立位置。</p></section>'+
 '<div class="class-dept-grid">'+data.departments.map((d,i)=>d.ready?
 '<a class="class-dept-card is-ready" href="/classification/'+esc(d.id)+'"><span class="class-dept-index">0'+(i+1)+' · '+esc(d.id.toUpperCase())+'</span><div class="class-dept-symbol">'+esc(d.name.slice(0,1))+'</div><h3>'+esc(d.name)+'</h3><p>'+esc(d.description)+'</p><div class="class-dept-foot"><strong>'+data.entries.length+' 个首批病种</strong><span>进入科室 →</span></div></a>':
 '<article class="class-dept-card is-pending"><span class="class-dept-index">0'+(i+1)+' · '+esc(d.id.toUpperCase())+'</span><div class="class-dept-symbol">'+esc(d.name.slice(0,1))+'</div><h3>'+esc(d.name)+'</h3><p>'+esc(d.description)+'</p><div class="class-dept-foot"><span>独立分区 · 待建设</span></div></article>').join('')+'</div>'+
 '<div class="class-next"><strong>栏目结构</strong><span>疾病分型 → 选择科室 → 选择疾病 → 分型、影像来源、治疗判断与证据</span><a href="/classification/guke">进入骨科 →</a></div>';
}
function groupNav(){
 return '<nav class="class-side" aria-label="骨科疾病目录"><div class="class-side-head"><small>ORTHOPAEDICS / 17 DOSSIERS</small><strong>骨科分型目录</strong></div><a class="class-all-link" href="/classification/guke">← 全部骨科疾病</a>'+
 areas.map(a=>'<section><h3>'+esc(a)+'</h3>'+data.entries.filter(d=>d.area===a).map(d=>'<a class="'+(slug===d.id?'selected':'')+'" href="/classification/guke/'+esc(d.id)+'" '+(slug===d.id?'aria-current="page"':'')+'>'+esc(d.name)+'</a>').join('')+'</section>').join('')+'</nav>';
}
function cards(){
 setCrumbs('<span>›</span><span>骨科</span>');
 app.innerHTML='<div class="class-dept-title"><div><span>ORTHOPAEDICS</span><h2>骨科 · 分型与手术指征</h2><p>按解剖部位排列的17个首批骨折分型档案。已收录真实术前影像文献入口，未完成的亚型继续保留核实标记。</p></div><a href="/classification">切换科室 ↑</a></div>'+
 '<div class="class-layout">'+groupNav()+'<section class="class-main"><label class="class-search-label" for="diseaseFilter">搜索骨科疾病或分型</label><input id="diseaseFilter" class="class-filter" type="search" placeholder="例如：股骨颈 / Schatzker / AO/OTA / Pilon" autocomplete="off">'+
 '<div id="diseaseList">'+areas.map(a=>'<section class="class-area"><div class="class-area-heading"><h3>'+esc(a)+'</h3><span>'+data.entries.filter(d=>d.area===a).length+' 个病种</span></div><div class="class-disease-grid">'+data.entries.filter(d=>d.area===a).map(d=>'<a class="class-disease-card" href="/classification/guke/'+esc(d.id)+'"><small>'+esc(d.system)+'</small><h4>'+esc(d.name)+' <span>↗</span></h4><p>'+d.types.length+' 种主要分型 · '+d.figures.length+' 组文献图源</p><b>查看分型及指征 →</b></a>').join('')+'</div></section>').join('')+'</div><p id="filterEmpty" hidden>未找到匹配病种，请更换关键词。</p></section></div>';
 const field=document.getElementById('diseaseFilter');const sections=[...document.querySelectorAll('.class-area')];
 const run=()=>{let shown=0;const q=field.value.trim().toLowerCase();for(const section of sections){let n=0;for(const el of section.querySelectorAll('.class-disease-card')){const visible=!q||el.textContent.toLowerCase().includes(q);el.hidden=!visible;n+=Number(visible);}section.hidden=n===0;shown+=n;}document.getElementById('filterEmpty').hidden=shown>0;};
 field.addEventListener('input',run);
 const q=new URLSearchParams(location.search).get('q');if(q){field.value=q;run();}
}
function details(d){
 setCrumbs('<span>›</span><a href="/classification/guke">骨科</a><span>›</span><span>'+esc(d.name)+'</span>');
 const rows=d.types.map((t,i)=>'<article class="class-type"><span class="class-type-no">'+String(i+1).padStart(2,'0')+'</span><h4>'+esc(t.code)+'</h4><p>'+esc(t.feature)+'</p></article>').join('');
 const figures=d.figures.map((f,i)=>'<article class="class-figure"><div class="class-figure-icon" aria-hidden="true">DR<span>→</span></div><div><span class="class-figure-meta">外部医学文献图源 '+String(i+1).padStart(2,'0')+'</span><h4>'+esc(f.fig)+'</h4><p>'+esc(f.match)+'</p><p class="class-figure-status">'+esc(f.status)+'</p>'+link(f.url,'打开原始文献与Figure')+'</div></article>').join('');
 const refs=d.evidence.length?d.evidence.map((e,i)=>'<article class="class-evidence"><span class="class-ev-num">依据 '+String(i+1).padStart(2,'0')+'</span><h4>'+esc(e.name)+'</h4><p>'+esc(e.claim)+'</p><div class="class-evidence-scope"><b>适用与限制：</b>'+esc(e.scope)+'</div><span class="class-evidence-grade">'+esc(e.level)+'</span><div>'+link(e.url,'查阅原始指南／综述')+'</div></article>').join(''):'<div class="class-pending"><strong>逐条指南依据尚待审核</strong><p>现有内容为文献图源整理与临床决策要点，不把分型综述误当成正式手术指征指南。本病种尚未核准逐亚型的推荐级别与强制阈值。</p></div>';
 app.innerHTML='<div class="class-dept-title"><div><span>ORTHOPAEDICS / '+esc(d.area)+'</span><h2>'+esc(d.name)+'</h2><p>'+esc(d.system)+' · 四批资料汇总版</p></div><a href="/classification/guke">返回骨科列表 ↑</a></div>'+
 '<div class="class-layout">'+groupNav()+'<article class="class-main class-detail"><section class="class-detail-intro"><span class="class-dossier-kicker">DISEASE CLASSIFICATION</span><h3>'+esc(d.name)+'</h3><p>现有主要分型：'+esc(d.system)+'</p><div class="class-detail-links"><a href="#class-types">分型特点</a><a href="#class-images">真实影像来源</a><a href="#class-indications">治疗与手术指征</a><a href="#class-sources">证据依据</a></div></section>'+
 '<section id="class-types" class="class-content-section"><div class="class-section-label">01 / CLASSIFICATION</div><h3>分型与影像特点</h3><p class="class-section-sub">以下为主要分型或大类，不等于已经补齐全部 AO/OTA 细分亚型。</p><div class="class-type-grid">'+rows+'</div></section>'+
 '<section id="class-images" class="class-content-section"><div class="class-section-label">02 / SOURCE RADIOGRAPHS</div><h3>真实术前影像资料</h3><p class="class-section-sub">适合影像检查：'+esc(d.imaging)+'。下列均为原文链接；本页不擅自转载患者影像。打开原图时须注意图注中哪些是术前DR、哪些是CT或术后片。</p><div class="class-figure-list">'+figures+'</div></section>'+
 '<section id="class-indications" class="class-content-section"><div class="class-section-label">03 / TREATMENT DECISIONS</div><h3>保守治疗与手术指征</h3><div class="class-decision"><span>临床判断与适用范围</span><p>'+esc(d.decision)+'</p></div><p class="class-asterisk">分型标签只是治疗决策的一部分。必须结合影像的实际移位/稳定性、患者年龄、合并伤、软组织条件、功能需要和麻醉风险。</p></section>'+
 '<section id="class-sources" class="class-content-section"><div class="class-section-label">04 / EVIDENCE</div><h3>手术指征对应依据</h3>'+refs+'</section>'+
 '<div class="class-more"><a href="/bl/guke/'+encodeURIComponent(d.name)+'">查找对应病历模板 ↗</a><a href="/classification/guke">骨科所有病种 →</a></div></article></div>';
}
if(!department)departments();
else if(department==='guke'){if(!slug)cards();else if(disease)details(disease);else{setCrumbs('<span>›</span><a href="/classification/guke">骨科</a>');app.innerHTML='<section class="class-error"><h2>未找到对应的疾病分型</h2><p>请回到骨科目录选择现有病种。</p><a href="/classification/guke">返回骨科</a></section>';}}
else{const dept=data.departments.find(x=>x.id===department);setCrumbs('<span>›</span><span>'+esc(dept?.name||'其他科室')+'</span>');app.innerHTML='<section class="class-error"><h2>'+esc(dept?.name||'该科室')+'分型资料待建设</h2><p>科室分区已预留，当前暂无经过整理和审核的资料，不显示骨科内容。</p><a href="/classification">返回科室目录 →</a></section>';}
})();