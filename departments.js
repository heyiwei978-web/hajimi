(function departmentRouter(seed){
  try{
    if(typeof templates==='undefined'||!Array.isArray(templates))return;

    templates.forEach((t)=>{if(!t.department)t.department='骨科';});
    const existing=new Set(templates.map((t)=>t.name));
    seed.forEach((t)=>{if(!existing.has(t.name))templates.push(t);});

    if(typeof generate==='function'){
      const baseGenerate=generate;
      generate=function(t){return t&&t.sourceBody?t.sourceBody:baseGenerate(t);};
    }

    ['入院记录','首次病程','主治查房','主任查房'].forEach((v)=>{
      const sel=document.getElementById('typeFilter');
      if(sel&&!Array.from(sel.options).some((o)=>o.value===v)){
        const o=document.createElement('option');o.value=v;o.textContent=v;sel.appendChild(o);
      }
    });

    const departments=[
      {name:'骨科',slug:'guke',desc:'创伤、关节置换及围手术期模板'},
      {name:'普外科',slug:'puwai',desc:'腹部外科及常见外科病历模板'},
      {name:'肾内科',slug:'shennei',desc:'肾脏内科、AKI及透析相关模板'},
      {name:'妇科',slug:'fuke',desc:'妇科常见疾病及围手术期模板'}
    ];
    const diseaseMap={
      '骨科':[...groups,'通用场景'],
      '普外科':['肝脓肿'],
      '肾内科':['化疗药物性肾功能损伤'],
      '妇科':['妊娠组织物残留']
    };
    const orthoSections=[
      {
        key:'joint',
        title:'关节置换',
        eyebrow:'ARTHROPLASTY',
        desc:'膝、髋关节置换相关记录集中管理，从入院评估到术后康复按阶段进入。',
        items:['TKA','THA','人工股骨头置换'],
        reserve:['髋关节翻修','膝关节翻修']
      },
      {
        key:'trauma',
        title:'创伤骨科',
        eyebrow:'TRAUMA',
        desc:'常见四肢、骨盆及关节周围骨折模板，适合住院、手术与术后连续记录。',
        items:[...traumaGroups],
        reserve:['股骨颈骨折','肱骨外髁骨折']
      },
      {
        key:'sports',
        title:'运动医学 / 关节镜',
        eyebrow:'SPORTS MEDICINE',
        desc:'预留运动医学、韧带、半月板及关节镜相关模板位置，后续可持续补充。',
        items:[],
        reserve:['半月板损伤','前交叉韧带损伤','后交叉韧带损伤','腘窝囊肿']
      },
      {
        key:'soft',
        title:'软组织 / 其他',
        eyebrow:'SOFT TISSUE & GENERAL',
        desc:'围手术期通用记录、检查理由、沟通记录及软组织损伤内容统一归档。',
        items:['通用场景'],
        reserve:['肌腱损伤与修复','股骨头坏死','感染与清创','会诊 / 检查理由']
      }
    ];
    const slugToDept=Object.fromEntries(departments.map((d)=>[d.slug,d.name]));
    const deptToSlug=Object.fromEntries(departments.map((d)=>[d.name,d.slug]));
    const coreFiltered=typeof filtered==='function'?filtered:null;
    let currentDept=null;

    function pathState(){
      const p=location.pathname.split('/').filter(Boolean);
      if(!p.length)return {page:'home'};
      if(p[0]==='duty')return {page:'duty'};
      if(p[0]!=='bl')return {page:'home'};
      if(!p[1])return {page:'departments'};
      const dep=slugToDept[p[1]]||null;
      let disease=null;
      if(dep&&p[2]){try{disease=decodeURIComponent(p.slice(2).join('/'));}catch{disease=p.slice(2).join('/');}}
      return {page:'library',department:dep,disease};
    }
    function setShell(page){
      if(page==='home'||page==='duty')document.body.classList.remove('disease-book-page');
      const home=document.getElementById('portalHome'),duty=document.getElementById('dutyPage'),lib=document.getElementById('libraryShell');
      home.hidden=page!=='home';duty.hidden=page!=='duty';lib.hidden=!(page==='departments'||page==='library');
      document.body.classList.toggle('portal-mode',page==='home'||page==='duty');
    }
    function setBrand(){
      const strong=document.querySelector('#libraryShell .brand strong');
      const small=document.querySelector('#libraryShell .brand small');
      const h=document.getElementById('libraryTitle'),lead=document.getElementById('libraryLead');
      if(!currentDept){
        if(strong)strong.textContent='病历模板';
        if(small)small.textContent='Clinical Template Library';
        if(h)h.textContent='病历模板库';
        if(lead)lead.textContent='先选择科室，再进入疾病或术式查看具体模板。';
      }else{
        if(strong)strong.textContent=currentDept+'病历模板';
        if(small)small.textContent=currentDept+' · Clinical Template Library';
        if(h)h.textContent=currentDept+'病历模板库';
        if(lead)lead.textContent='按疾病/术式、阶段和记录类型浏览'+currentDept+'模板。';
      }
    }
    function resetState(){
      state.group='all';state.stage='all';state.type='all';state.q='';
      const q=document.getElementById('searchInput'),s=document.getElementById('stageFilter'),t=document.getElementById('typeFilter');
      if(q)q.value='';if(s)s.value='all';if(t)t.value='all';
    }
    function departmentCount(dep){return templates.filter((t)=>t.department===dep).length;}
    function listForDept(dep){return templates.filter((t)=>t.department===dep);}
    function allDisease(dep){return diseaseMap[dep]||[...new Set(listForDept(dep).map((t)=>t.group))];}
    function deptCard(dep){
      const d=departments.find((x)=>x.name===dep),n=departmentCount(dep);
      const meta={
        '骨科':{icon:'骨',cls:'dept-ortho',eyebrow:'ORTHOPAEDICS',hint:'创伤 · 关节置换 · 围手术期'},
        '普外科':{icon:'外',cls:'dept-surgery',eyebrow:'GENERAL SURGERY',hint:'腹部外科 · 常见外科病历'},
        '肾内科':{icon:'肾',cls:'dept-nephro',eyebrow:'NEPHROLOGY',hint:'AKI · 肾功能 · 内科记录'},
        '妇科':{icon:'妇',cls:'dept-gyn',eyebrow:'GYNAECOLOGY',hint:'妇科疾病 · 围手术期'}
      }[dep]||{icon:'科',cls:'dept-generic',eyebrow:'DEPARTMENT',hint:'病历模板'};
      return `<article class="department-card library-department-card ${meta.cls}" data-department="${dep}" role="button" tabindex="0">
        <div class="department-visual">
          <span class="department-icon">${meta.icon}</span>
          <span class="department-eyebrow">${meta.eyebrow}</span>
        </div>
        <div class="department-card-top"><span>科室模板</span><strong>${n} 份</strong></div>
        <h3>${dep}</h3>
        <p>${d?.desc||'病历模板'}</p>
        <small>${meta.hint}</small>
        <div class="department-card-open">进入科室 <span>→</span></div>
      </article>`;
    }
    function diseaseCard(dep,g){
      const items=listForDept(dep).filter((t)=>t.group===g);
      const chips=['入院','术前','术中','术后'].map((s)=>{const n=items.filter((t)=>t.stage===s).length;return n?`<span>${s} ${n}</span>`:''}).join('');
      return `<article class="project-card disease-card" data-disease="${encodeURIComponent(g)}" role="button" tabindex="0"><div class="project-card-top"><span class="project-kind">${dep}</span><strong>1 套完整病历</strong></div><h3>${labelFor(g)}</h3><p>一个病种一个连续病历页面，目录可直达术前讨论、手术记录及术后各日病程。</p><div class="project-stage-chips">${chips}</div><div class="project-open">打开完整病历 <span>→</span></div></article>`;
    }
    function orthoDiseaseCard(g){
      const items=listForDept('骨科').filter((t)=>t.group===g);
      const stageOrder=['入院','术前','术中','术后'];
      const chips=stageOrder.map((stage)=>{
        const n=items.filter((t)=>t.stage===stage).length;
        return n?`<span>${stage}<b>${n}</b></span>`:'';
      }).join('');
      return `<article class="ortho-disease-card" data-disease="${encodeURIComponent(g)}" role="button" tabindex="0">
        <div class="ortho-card-top"><span>完整病历</span><strong>1 套 · ${items.length} 章节</strong></div>
        <h3>${labelFor(g)}</h3>
        <p>全部记录整合到同一病种页面，按病历顺序连续阅读并通过目录快速跳转。</p>
        <div class="ortho-stage-chips">${chips}</div>
        <div class="ortho-open">打开完整病历 <span>↗</span></div>
      </article>`;
    }
    function orthoReserveCard(name){
      return `<article class="ortho-disease-card is-reserve" aria-label="${name}，预留">
        <div class="ortho-card-top"><span>预留模块</span><strong>待补充</strong></div>
        <h3>${name}</h3>
        <p>结构位置已预留，后续可直接加入模板、病例图片、检查理由及康复记录。</p>
        <div class="ortho-open muted">后续扩展 <span>＋</span></div>
      </article>`;
    }
    function bindDiseaseCards(){
      document.querySelectorAll('[data-disease]').forEach((c)=>{
        const go=()=>navigateDisease(decodeURIComponent(c.dataset.disease));
        c.onclick=go;
        c.onkeydown=(e)=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go();}};
      });
    }
    function renderOrthoIndex(){
      document.body.classList.remove('department-no-sidebar','library-root-page','disease-book-page');
      setBrand();
      const list=listForDept('骨科');
      const title=document.getElementById('resultTitle');
      const num=document.getElementById('resultCount');
      const grid=document.getElementById('templateGrid');
      const empty=document.getElementById('emptyState');
      const jointCount=list.filter((t)=>['TKA','THA','人工股骨头置换'].includes(t.group)).length;
      const traumaCount=list.filter((t)=>traumaGroups.includes(t.group)).length;
      const diseaseCount=[...new Set(list.map((t)=>t.group))].length;
      if(title)title.textContent='骨科模板总览';
      if(num)num.textContent=`${diseaseCount} 个项目 · ${list.length} 份模板`;
      if(empty)empty.hidden=true;
      if(grid){
        grid.innerHTML=`
          ${toolbar(`骨科 · ${list.length} 份模板`,false)}
          <section class="ortho-hero">
            <div class="ortho-hero-copy">
              <div class="ortho-eyebrow">ORTHOPAEDICS · TEMPLATE WORKSPACE</div>
              <h2>骨科病历模板</h2>
              <p>按专科方向组织疾病与术式，进入项目后再按入院、术前、术中、术后查看具体记录。现有模板内容保持不变，仅重组浏览结构。</p>
            </div>
            <div class="ortho-stats">
              <div><strong>${list.length}</strong><span>全部模板</span></div>
              <div><strong>${jointCount}</strong><span>关节置换</span></div>
              <div><strong>${traumaCount}</strong><span>创伤骨科</span></div>
              <div><strong>${diseaseCount}</strong><span>现有项目</span></div>
            </div>
          </section>
          <nav class="ortho-jump" aria-label="骨科模板分类">
            ${orthoSections.map((s)=>`<a href="#ortho-${s.key}"><span>${s.eyebrow}</span>${s.title}</a>`).join('')}
          </nav>
          <div class="ortho-sections">
            ${orthoSections.map((section)=>`
              <section class="ortho-category" id="ortho-${section.key}">
                <div class="ortho-category-head">
                  <div>
                    <span>${section.eyebrow}</span>
                    <h3>${section.title}</h3>
                    <p>${section.desc}</p>
                  </div>
                  <strong>${section.items.reduce((sum,g)=>sum+list.filter((t)=>t.group===g).length,0)} 份模板</strong>
                </div>
                <div class="ortho-disease-grid">
                  ${section.items.map(orthoDiseaseCard).join('')}
                  ${section.reserve.map(orthoReserveCard).join('')}
                </div>
              </section>
            `).join('')}
          </div>
          <section class="ortho-future">
            <div><span>EXPANSION AREA</span><h3>后续扩展区</h3><p>预留病例图片、术后康复路径、检查理由、用药依据、指南链接和新增疾病模块的位置。</p></div>
            <div class="ortho-future-grid">
              <div><b>病例与影像</b><span>脱敏案例 / DR / CT / MRI</span></div>
              <div><b>康复路径</b><span>ROM / 负重 / 阶段目标</span></div>
              <div><b>检查与会诊</b><span>检查理由 / 会诊单 / 回报</span></div>
              <div><b>新增模板</b><span>疾病 / 术式 / 记录类型</span></div>
            </div>
          </section>`;
      }
      const back=document.getElementById('departmentBack');
      if(back)back.onclick=()=>navigateRoot();
      bindDiseaseCards();
      const tc=document.getElementById('templateCount'),ac=document.getElementById('allCount');
      if(tc)tc.textContent=list.length;
      if(ac)ac.textContent=list.length;
    }
    function toolbar(label,root){
      return `<div class="department-toolbar"><button class="btn ghost" id="departmentBack">← ${root?'返回首页':'返回科室'}</button><span>${label}</span></div>`;
    }
    function renderDepartmentRoot(){
      document.body.classList.remove('disease-book-page');
      currentDept=null;resetState();setBrand();
      document.body.classList.add('department-no-sidebar','library-root-page');
      const title=document.getElementById('resultTitle'),num=document.getElementById('resultCount'),grid=document.getElementById('templateGrid'),empty=document.getElementById('emptyState');
      const orthoCount=departmentCount('骨科');
      const otherCount=templates.length-orthoCount;
      if(title)title.textContent='选择科室';
      if(num)num.textContent=departments.length+' 个科室 · '+templates.length+' 份模板';
      if(empty)empty.hidden=true;
      if(grid)grid.innerHTML=`
        <section class="library-overview">
          <div class="library-overview-copy">
            <span>CLINICAL TEMPLATE LIBRARY</span>
            <h2>从科室进入，快速找到需要的病历。</h2>
            <p>按科室、疾病或术式、住院阶段和记录类型组织。现有内容保持不变，后续可继续增加科室、疾病、案例影像和专项记录。</p>
          </div>
          <div class="library-overview-stats">
            <div><strong>${templates.length}</strong><span>全部模板</span></div>
            <div><strong>${departments.length}</strong><span>科室分类</span></div>
            <div><strong>${orthoCount}</strong><span>骨科模板</span></div>
            <div><strong>${otherCount}</strong><span>其他科室</span></div>
          </div>
        </section>
        <div class="library-section-heading">
          <div><span>01</span><h3>科室入口</h3><p>选择科室后，再进入具体疾病或术式。</p></div>
          <strong>${departments.length} 个科室</strong>
        </div>
        <div class="department-grid library-department-grid">${departments.map((d)=>deptCard(d.name)).join('')}</div>
        <section class="library-quick-panel">
          <div class="library-quick-head"><span>02</span><div><h3>后续扩展</h3><p>为新增内容预留固定位置，后续添加不会打乱现有结构。</p></div></div>
          <div class="library-quick-grid">
            <div><b>新增科室</b><span>继续增加内科、外科及其他专业模板</span></div>
            <div><b>病例与影像</b><span>脱敏案例、DR、CT、MRI及术前术后对照</span></div>
            <div><b>专项记录</b><span>会诊、沟通、检查理由、并发症和康复路径</span></div>
            <div><b>常用收藏</b><span>预留最近使用和个人常用模板入口</span></div>
          </div>
        </section>`;
      document.querySelectorAll('[data-department]').forEach((c)=>{
        const go=()=>navigateDepartment(c.dataset.department);
        c.onclick=go;c.onkeydown=(e)=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go();}};
      });
      const tc=document.getElementById('templateCount'),ac=document.getElementById('allCount');
      if(tc)tc.textContent=templates.length;
      if(ac)ac.textContent=templates.length;
    }
    function renderDepartmentIndex(){
      document.body.classList.remove('library-root-page','disease-book-page');
      if(currentDept==='骨科'){renderOrthoIndex();return;}
      document.body.classList.toggle('department-no-sidebar',currentDept!=='骨科');setBrand();
      const list=listForDept(currentDept);
      const title=document.getElementById('resultTitle'),num=document.getElementById('resultCount'),grid=document.getElementById('templateGrid'),empty=document.getElementById('emptyState');
      const diseases=allDisease(currentDept);
      if(title)title.textContent=currentDept+' · 疾病/术式';if(num)num.textContent=diseases.length+' 个项目 · '+list.length+' 份模板';if(empty)empty.hidden=true;
      if(grid)grid.innerHTML=toolbar(currentDept+' · '+list.length+' 份模板',false)+'<div class="project-grid">'+diseases.map((g)=>diseaseCard(currentDept,g)).join('')+'</div>';
      const b=document.getElementById('departmentBack');if(b)b.onclick=()=>navigateRoot();
      document.querySelectorAll('[data-disease]').forEach((c)=>{
        const go=()=>navigateDisease(decodeURIComponent(c.dataset.disease));
        c.onclick=go;c.onkeydown=(e)=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go();}};
      });
      const tc=document.getElementById('templateCount'),ac=document.getElementById('allCount');if(tc)tc.textContent=list.length;if(ac)ac.textContent=list.length;
    }
    function recordPriority(t){
      const s=((t.short||'')+' '+(t.name||'')+' '+(t.type||'')).replace(/\s+/g,'');
      const day=s.match(/术后第([0-9一二三四五六七八九十]+)天/);
      if(/入院记录/.test(s)&&!/首次病程/.test(s))return 10;
      if(/术后首次病程/.test(s))return 90;
      if(/首次病程/.test(s))return 20;
      if(/主治医师首次查房|主治首次查房/.test(s))return 30;
      if(/主任医师首次查房|主任首次查房/.test(s))return 40;
      if(/入院期间查房/.test(s))return 42;
      if(/选择治疗方案|沟通记录/.test(s))return 45;
      if(/术前主刀查房/.test(s))return 50;
      if(/术前讨论|多学科术前讨论/.test(s))return 60;
      if(/术前小结/.test(s))return 70;
      if(/会诊申请/.test(s))return 72;
      if(/会诊回报|会诊记录/.test(s))return 73;
      if(/完整手术记录|手术记录/.test(s))return 80;
      if(/术后主刀查房/.test(s))return 95;
      if(day){
        const map={'一':1,'二':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9,'十':10};
        const raw=day[1];const n=/^\d+$/.test(raw)?+raw:(map[raw]||11);
        return 100+n;
      }
      if(/康复评估|康复记录|训练记录/.test(s))return 250;
      if(/影像复查|检查理由|复查申请/.test(s))return 260;
      if(/并发症|切口渗液|切口愈合不良|感染|血栓|发热|贫血|神经损伤|再手术/.test(s))return 400;
      if(/出院小结|出院记录|出院病历/.test(s))return 500;
      if(t.stage==='入院')return 25;
      if(t.stage==='术前')return 65;
      if(t.stage==='术中')return 85;
      if(t.stage==='术后')return 200;
      return 300;
    }
    function recordTimestamp(t){
      const body=String(typeof generate==='function'?generate(t):(t.sourceBody||''));
      const m=body.match(/记录时间[:：]\s*(\d{4})-(\d{1,2})-(\d{1,2})\s+(\d{1,2}):(\d{2})/);
      if(!m)return NaN;
      return Date.UTC(+m[1],+m[2]-1,+m[3],+m[4]-8,+m[5]);
    }
    function recordBookId(t,i){
      return 'record-'+i+'-'+String(t.short||t.name||'section').replace(/[^a-zA-Z0-9\u4e00-\u9fa5]+/g,'-').slice(0,40);
    }
    function recordBookText(list){
      return list.map((t,i)=>`第${String(i+1).padStart(2,'0')}章  ${t.short||t.name}\n${generate(t)}`).join('\n\n========================================\n\n');
    }
    function recordChapter(t,i){
      const id=recordBookId(t,i),idx=templates.indexOf(t);
      return `<article class="record-book-section" id="${id}" data-record-index="${idx}">
        <header class="record-book-section-head">
          <div class="record-chapter-no">${String(i+1).padStart(2,'0')}</div>
          <div class="record-chapter-title"><span>${t.stage} · ${t.type}</span><h3>${t.short||t.name}</h3></div>
          <div class="record-chapter-actions">
            <button class="btn ghost preview" data-index="${idx}" type="button">查看 / 编辑</button>
            <button class="btn primary copy" data-index="${idx}" type="button">复制本章节</button>
          </div>
        </header>
        <div class="record-book-body">${escapeHtml(String(generate(t)))}</div>
        <a class="record-back-toc" href="#recordBookToc">↑ 回到目录</a>
      </article>`;
    }
    function renderDisease(){
      document.body.classList.remove('library-root-page');
      document.body.classList.add('department-no-sidebar','disease-book-page');
      setBrand();
      const raw=(coreFiltered?coreFiltered():templates).filter((t)=>t.department===currentDept&&t.group===state.group);
      const list=[...raw].sort((a,b)=>{
        const ta=recordTimestamp(a),tb=recordTimestamp(b);
        if(Number.isFinite(ta)&&Number.isFinite(tb)&&ta!==tb)return ta-tb;
        if(Number.isFinite(ta)!==Number.isFinite(tb))return Number.isFinite(ta)?-1:1;
        return recordPriority(a)-recordPriority(b)||templates.indexOf(a)-templates.indexOf(b);
      });
      const title=document.getElementById('resultTitle'),num=document.getElementById('resultCount'),grid=document.getElementById('templateGrid'),empty=document.getElementById('emptyState');
      if(title)title.textContent=currentDept+' · '+labelFor(state.group);
      if(num)num.textContent='1 套完整病历 · '+list.length+' 个现有章节';
      if(empty)empty.hidden=list.length>0;

      const isDischarge=(t)=>/出院小结|出院记录|出院病历/.test((t.short||'')+' '+(t.name||''));
      const beforeDischarge=list.filter((t)=>!isDischarge(t));
      const dischargeItems=list.filter(isDischarge);
      const tocBefore=beforeDischarge.map((t)=>{const i=list.indexOf(t);return `<a href="#${recordBookId(t,i)}"><span>${String(i+1).padStart(2,'0')}</span><b>${t.short||t.name}</b><small>${t.stage}</small></a>`;}).join('');
      const tocDischarge=dischargeItems.map((t)=>{const i=list.indexOf(t);return `<a href="#${recordBookId(t,i)}"><span>${String(i+1).padStart(2,'0')}</span><b>${t.short||t.name}</b><small>${t.stage}</small></a>`;}).join('');
      const chaptersBefore=beforeDischarge.map((t)=>recordChapter(t,list.indexOf(t))).join('');
      const chaptersDischarge=dischargeItems.map((t)=>recordChapter(t,list.indexOf(t))).join('');
      const hasDischarge=dischargeItems.length>0;
      const complicationId='record-complications-reserved';
      const dischargeReserve=!hasDischarge?`
        <article class="record-book-section record-book-reserved" id="record-discharge-reserved">
          <header class="record-book-section-head"><div class="record-chapter-no">＋</div><div class="record-chapter-title"><span>出院 · 预留</span><h3>出院小结 / 出院记录</h3></div></header>
          <div class="record-reserve-copy">本病种后续补充出院小结、出院医嘱、功能状态及随访计划时，统一放在这里，保持整套病历连续。</div>
          <a class="record-back-toc" href="#recordBookToc">↑ 回到目录</a>
        </article>`:'';
      const reserveToc=`<a class="is-reserved" href="#${complicationId}"><span>＋</span><b>术后并发症 / 特殊情况</b><small>预留</small></a>`;
      const toc=tocBefore+reserveToc+(hasDischarge?tocDischarge:`<a class="is-reserved" href="#record-discharge-reserved"><span>＋</span><b>出院小结 / 出院记录</b><small>预留</small></a>`);

      const hero=`
        <section class="disease-hero record-book-hero">
          <div>
            <span>${currentDept==='骨科'?'ORTHOPAEDICS':'CLINICAL RECORD'} · COMPLETE MEDICAL RECORD</span>
            <h2>${labelFor(state.group)} · 完整病历</h2>
            <p>一个疾病只保留一个连续病历页面。顺序参照住院病历书写流程，目录可直接跳转到首次病程、查房、术前讨论、手术记录和术后各日病程。</p>
            <div class="record-book-hero-actions"><button id="copyWholeRecord" class="btn primary" type="button">复制完整病历</button><button id="printWholeRecord" class="btn ghost" type="button">打印整套病历</button></div>
          </div>
          <strong>1<small>套完整病历 · ${list.length} 个现有章节</small></strong>
        </section>`;

      if(grid)grid.innerHTML=toolbar(currentDept+' · '+labelFor(state.group),false)+hero+
        '<div class="source-template-note">模板为脱敏整理/标准化辅助内容，必须结合真实患者病史、查体、检查结果和实际诊疗经过修改。</div>'+
        `<div class="record-book-layout">
          <aside class="record-book-toc" id="recordBookToc">
            <div class="record-book-toc-head"><span>CONTENTS</span><h3>病历目录</h3><p>按病历时间顺序排列</p></div>
            <nav>${toc}${reserveToc}</nav>
          </aside>
          <div class="record-book-content">
            ${chaptersBefore}
            <article class="record-book-section record-book-reserved complication-reserve" id="${complicationId}">
              <header class="record-book-section-head"><div class="record-chapter-no">＋</div><div class="record-chapter-title"><span>术后 · 固定预留</span><h3>术后并发症 / 特殊情况</h3></div></header>
              <div class="record-reserve-copy"><strong>该章节永久保留在本病种内。</strong><br>以后发生切口渗液/愈合不良、感染、下肢静脉血栓、贫血、发热、神经血管异常、再手术、特殊会诊或其他术后问题时，相关病程记录继续添加到本疾病页面，不再单独拆成新的病种模板。</div>
              <div class="record-reserve-slots"><span>并发症首次记录</span><span>检查与结果分析</span><span>处理措施及依据</span><span>复查 / 转归</span></div>
              <a class="record-back-toc" href="#recordBookToc">↑ 回到目录</a>
            </article>
            ${hasDischarge?chaptersDischarge:dischargeReserve}
          </div>
        </div>`;

      const b=document.getElementById('departmentBack');if(b)b.onclick=()=>navigateDepartment(currentDept);
      bindTemplateActions();
      const copyWhole=document.getElementById('copyWholeRecord');if(copyWhole)copyWhole.onclick=()=>copyText(recordBookText(list));
      const printWhole=document.getElementById('printWholeRecord');if(printWhole)printWhole.onclick=()=>window.print();
      const tc=document.getElementById('templateCount'),ac=document.getElementById('allCount');if(tc)tc.textContent='1 套';if(ac)ac.textContent=departmentCount(currentDept);
    }
    function navigateRoot(){history.pushState({},'', '/bl');applyRoute();}
    function navigateDepartment(dep){history.pushState({},'', '/bl/'+deptToSlug[dep]);applyRoute();}
    function navigateDisease(g){history.pushState({},'', '/bl/'+deptToSlug[currentDept]+'/'+encodeURIComponent(g));applyRoute();}
    function applyRoute(){
      const r=pathState();setShell(r.page);
      if(r.page==='home'||r.page==='duty')return;
      if(r.page==='departments'){renderDepartmentRoot();return;}
      currentDept=r.department||null;if(!currentDept){renderDepartmentRoot();return;}
      resetState();
      if(r.disease&&allDisease(currentDept).includes(r.disease)){state.group=r.disease;renderDisease();}
      else renderDepartmentIndex();
    }

    const originalRender=typeof render==='function'?render:null;
    render=function(){
      const r=pathState();
      if(r.page!=='library'&&r.page!=='departments'){setShell(r.page);return;}
      if(r.page==='departments'){renderDepartmentRoot();return;}
      currentDept=r.department||currentDept;
      if(!currentDept){renderDepartmentRoot();return;}
      if(state.group==='all'&&!state.q.trim()&&state.stage==='all'&&state.type==='all'){renderDepartmentIndex();return;}
      if(state.group!=='all'){renderDisease();return;}
      const list=(coreFiltered?coreFiltered():templates).filter((t)=>t.department===currentDept);
      document.body.classList.toggle('department-no-sidebar',currentDept!=='骨科');setBrand();
      const title=document.getElementById('resultTitle'),num=document.getElementById('resultCount'),grid=document.getElementById('templateGrid'),empty=document.getElementById('emptyState');
      if(title)title.textContent=currentDept+' · 搜索结果';if(num)num.textContent=list.length+' 份';if(grid)grid.innerHTML=toolbar(currentDept+' · 搜索结果',false)+list.map(templateCard).join('');if(empty)empty.hidden=list.length>0;
      const b=document.getElementById('departmentBack');if(b)b.onclick=()=>navigateDepartment(currentDept);bindTemplateActions();
    };

    const reset=document.getElementById('resetFilters');if(reset)reset.onclick=()=>{resetState();render();};
    const menu=document.getElementById('menuBtn'),sidebar=document.getElementById('sidebar'),mask=document.getElementById('drawerMask');
    if(menu&&sidebar&&mask){
      const close=()=>{sidebar.classList.remove('open');mask.classList.remove('show');};
      menu.onclick=()=>{sidebar.classList.toggle('open');mask.classList.toggle('show');};
      mask.onclick=close;
      sidebar.addEventListener('click',(e)=>{if(e.target.closest('.nav-item')&&innerWidth<=900)close();});
    }
    window.addEventListener('popstate',applyRoute);
    window.addEventListener('hajimi:cms-ready',()=>{const r=pathState();if(r.page==='library'&&r.disease&&currentDept)renderDisease();});
    window.hajimiNavigateDepartment=navigateDepartment;
    window.hajimiNavigateRoot=navigateRoot;
    applyRoute();
  }catch(e){console.error('department router failed',e);}
})([
  {department:'普外科',group:'肝脓肿',stage:'入院',type:'入院记录',short:'入院记录',name:'肝脓肿 · 入院记录',desc:'脱敏整理版：肝右叶肝脓肿入院记录。',sourceBody:`住院号：0000000001
姓名：张某某
性别：女
年龄：48岁
病史记录日期：[日期]
入院日期：[日期]

主诉：右上腹痛20天，加重1天。

现病史：患者20天前无明显诱因出现右上腹持续性胀痛，1天前腹痛加重来院。腹部CT平扫+增强提示肝右叶约4.5cm×4.2cm不规则低密度/液性区，结合炎症指标考虑肝脓肿，收入普外科进一步治疗。入院时可伴发热、右上腹隐痛、口干、纳差等，具体以实际病史为准。

既往史、个人史、过敏史、婚育史等：按实际询问记录。

体格检查：生命体征按实际填写。腹软，右上腹轻压痛，可伴反跳痛；肝脾肋下未触及；胆囊未及；双肾区叩击痛按实际记录。

专科检查：腹平坦，右上腹压痛，必要时记录反跳痛；无明显腹膜刺激征或包块。

辅助检查：腹部CT提示肝右叶脓肿样改变；血常规及CRP/PCT等按实际检查填写。

初步诊断：肝右叶肝脓肿。

住院医师：李某某
主治医师：陈某某`},
  {department:'普外科',group:'肝脓肿',stage:'入院',type:'首次病程',short:'首次病程',name:'肝脓肿 · 首次病程',desc:'脱敏整理版：肝脓肿首次病程记录。',sourceBody:`住院号：0000000001
姓名：张某某

首次病程记录

一、病例特点
患者因右上腹痛加重入院。腹部CT提示肝右叶约4.5cm×4.2cm脓肿样病灶；炎症指标升高。查体可见右上腹压痛，余腹部体征按实际记录。

二、拟诊讨论
初步诊断：肝右叶肝脓肿。
诊断依据：症状、右上腹体征、腹部增强CT及炎症指标支持。
鉴别诊断：肝恶性肿瘤、化脓性胆管炎、肝血管瘤等，结合增强影像、肿瘤标志物及胆道病史鉴别。

三、诊疗计划
1. 按腹部外科护理常规。
2. 完善血常规、肝肾功能、电解质、凝血、血培养/脓液培养等针对性检查。
3. 根据病情给予补液、抗感染及对症处理。
4. 评估脓肿大小、液化程度及穿刺引流指征。

住院医师：李某某
主治医师：陈某某`},
  {department:'普外科',group:'肝脓肿',stage:'入院',type:'主治查房',short:'主治查房',name:'肝脓肿 · 主治查房',desc:'脱敏整理版：肝脓肿主治医师查房记录。',sourceBody:`住院号：0000000001
姓名：张某某

主治医师查房记录

患者神志清楚，右上腹疼痛，生命体征及腹部查体按实际记录。辅助检查提示炎症指标升高，并可伴肝功能异常、电解质紊乱。

主治医师查房后指示：
一、结合病史、体征及腹部CT，目前诊断考虑肝右叶肝脓肿。
二、脓肿直径较大或单纯药物治疗效果有限时，应评估超声/CT引导下经皮穿刺置管引流；引流液送培养及药敏。
三、经验性抗感染方案应结合当地耐药谱、肝肾功能和培养结果调整，避免固定套用。
四、补液及营养支持，动态复查电解质、肝功能、体温、白细胞、CRP/PCT和引流量，评估疗效。

住院医师：李某某
主治医师：陈某某`},
  {department:'普外科',group:'肝脓肿',stage:'入院',type:'主任查房',short:'主任查房',name:'肝脓肿 · 主任查房',desc:'脱敏整理版：肝脓肿主任医师查房记录。',sourceBody:`住院号：0000000001
姓名：张某某

主任医师查房记录

患者右上腹疼痛较前【减轻/无明显变化】，穿刺引流管固定在位，引流液性质及量按实际记录。复查血常规、CRP、PCT、肝功能及影像学结果按实际填写。

主任医师查房后指示：
1. 维持引流管通畅并记录24小时引流量，结合培养及药敏调整抗感染治疗。
2. 加强营养与水电解质管理。
3. 拔管应综合症状、体温、炎症指标、引流量及影像学脓腔缩小情况判断，不机械套用单一阈值。
4. 若规范抗感染及经皮引流后仍无改善、引流不畅、合并腹膜炎/胸膜炎或复杂多房脓肿，应重新评估手术或其他介入方案。

住院医师：李某某
主任医师：薛某某`},
  {department:'肾内科',group:'化疗药物性肾功能损伤',stage:'入院',type:'入院记录',short:'入院记录',name:'化疗药物性肾功能损伤 · 入院记录',desc:'脱敏整理版：药物相关急性肾损伤入院记录。',sourceBody:`住院号：0000000001
姓名：张某某
性别：女
年龄：48岁
病史记录日期：[日期]
入院日期：[日期]

主诉：血肌酐升高伴恶心、呕吐3天。

现病史：患者既往曾出现急性肾损伤并接受临时血液透析，肾功能后恢复。此次3天前再次出现恶心呕吐、尿量减少及右侧腰部不适，来院检查提示血钾约6.9mmol/L、血肌酐显著升高，拟“急性肾损伤”收入院。

既往史：有肿瘤手术及含铂化疗史，既往行双侧输尿管支架置入；有长期NSAIDs使用史。其余按实际记录。

体格检查：全身水肿、心肺、腹部及双肾区体征按实际记录。

辅助检查：血肌酐、尿素氮、血钾、酸碱平衡、尿常规及泌尿系影像按实际填写。

初步诊断：急性肾损伤；伴高钾血症/代谢性酸中毒者据实记录。

住院医师：李某某
主治医师：陈某某`},
  {department:'肾内科',group:'化疗药物性肾功能损伤',stage:'入院',type:'首次病程',short:'首次病程',name:'化疗药物性肾功能损伤 · 首次病程',desc:'脱敏整理版：药物相关急性肾损伤首次病程。',sourceBody:`住院号：0000000001
姓名：张某某

首次病程记录

一、病例特点
患者有既往AKI及含铂化疗、NSAIDs使用史，本次因恶心呕吐、尿量减少、血肌酐明显升高及高钾血症入院。查体无明显全身水肿，双肾区体征按实际记录。

二、拟诊讨论
初步诊断：急性肾损伤。
诊断依据：短期内血肌酐显著升高并伴尿量减少、恶心呕吐等尿毒症相关表现。
鉴别诊断：感染相关肾损伤、急性肾小球肾炎、尿路梗阻性肾损伤等，结合尿常规、免疫学、泌尿系影像及感染指标鉴别。

三、诊疗计划
1. 严密监测尿量、出入量、肾功能、电解质和酸碱状态。
2. 停用潜在肾毒性药物并进行容量状态评估。
3. 出现严重高钾、重度酸中毒、容量负荷或尿毒症并发症时，评估紧急肾脏替代治疗指征。
4. 针对高钾及酸中毒进行标准化处理，并动态复查。

住院医师：李某某
主治医师：陈某某`},
  {department:'肾内科',group:'化疗药物性肾功能损伤',stage:'入院',type:'主治查房',short:'主治查房',name:'化疗药物性肾功能损伤 · 主治查房',desc:'脱敏整理版：药物相关急性肾损伤主治医师查房。',sourceBody:`住院号：0000000001
姓名：张某某

主治医师查房记录

患者恶心呕吐、尿量减少及右侧腰部不适。辅助检查提示血肌酐、尿素氮明显升高，可伴高钾血症及代谢性酸中毒。泌尿系影像需评估双J管位置、肾积水及梗阻情况。

主治医师查房后指示：
一、目前考虑肾性急性肾损伤，并评估药物相关肾小管/间质损伤可能。
二、鉴别尿路梗阻、肾小球疾病及感染相关肾损伤。
三、持续监测神志、血压、心率、SpO₂、小时尿量和24小时出入量；复查血常规、肾功能、电解质、血气等。
四、严重高钾或酸中毒时按急症处理并评估透析；容量管理、营养支持及肾毒性药物停用同步进行。

住院医师：唐某某
主治医师：薛某某`},
  {department:'肾内科',group:'化疗药物性肾功能损伤',stage:'入院',type:'主任查房',short:'主任查房',name:'化疗药物性肾功能损伤 · 主任查房',desc:'脱敏整理版：药物相关急性肾损伤主任医师查房。',sourceBody:`住院号：0000000001
姓名：张某某

主任医师查房记录

患者急性发病，以恶心呕吐、腰部不适及尿量减少为主要表现，入院时血肌酐显著升高，可伴高钾血症和代谢性酸中毒。

主任医师查房后指示：
1. AKI诊断及分期依据血肌酐变化和尿量标准综合判断。
2. 结合含铂化疗史、长期NSAIDs使用史及尿检、影像结果，评估药物相关肾小管/间质损伤可能，同时排除梗阻、感染和肾小球性疾病。
3. 对严重高钾、重度酸中毒、容量负荷、尿毒症症状等按肾脏替代治疗指征处理。
4. 高钾治疗、碳酸氢盐使用、利尿剂及其他药物均应结合容量状态、心电图和动态实验室结果个体化调整。

住院医师：唐某某
主任医师：薛某某`},
  {department:'妇科',group:'妊娠组织物残留',stage:'入院',type:'首次病程',short:'首次病程',name:'妊娠组织物残留 · 首次病程',desc:'脱敏整理版：妊娠组织物残留首次病程记录。',sourceBody:`住院号：0000000001
姓名：张某某

首次病程记录

一、病例特点
育龄期女性，药物流产后复查超声提示宫腔异常团块，周边可见丰富血流信号，尿妊娠试验仍阳性，伴少量阴道流血。日期等隐私信息统一使用占位符。

二、妇科检查
外阴、阴道、宫颈、子宫及双附件情况按实际检查记录；重点记录阴道流血量、宫颈口情况、子宫压痛及附件区压痛/包块。

三、拟诊讨论
中医诊断：胎堕不全（血瘀证）【如实际采用】。
西医诊断：妊娠组织物残留。
鉴别诊断：早期妊娠相关异常、妊娠滋养细胞疾病等，结合HCG动态、超声及病理结果鉴别。

四、诊疗计划
1. 观察阴道流血及生命体征。
2. 完善血常规、血型、凝血、肝肾功能、HCG及必要的妇科超声。
3. 根据残留物大小、血流、症状及生育需求评估期待治疗、药物治疗、清宫或宫腔镜治疗。

住院医师：李某某
主治医师：陈某某`},
  {department:'妇科',group:'妊娠组织物残留',stage:'入院',type:'主任查房',short:'主任查房',name:'妊娠组织物残留 · 主任查房',desc:'脱敏整理版：妊娠组织物残留主任医师查房记录。',sourceBody:`住院号：0000000001
姓名：张某某

主任医师查房记录

患者少量阴道流血，无明显发热及持续下腹痛。妇科查体及超声按实际记录。

主任医师查房后指示：
一、结合药物流产史、持续宫腔异常团块及HCG情况，考虑妊娠组织物残留。
二、治疗方式包括期待治疗、药物治疗、清宫术及宫腔镜手术，应结合出血量、感染风险、残留物血供、生育需求及患者意愿共同决策。
三、宫腔镜直视操作有助于定位残留组织并减少盲目搔刮，但是否选择宫腔镜需结合资源、麻醉条件和患者风险。
四、围术期宫颈预处理、抗菌药物预防、促宫缩、复查血常规/电解质及HCG等，应依据实际适应证和医院规范执行。

住院医师：唐某某
主任医师：薛某某`}
]);