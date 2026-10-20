(function departmentRouter(seed){
  try{
    if(typeof templates==='undefined'||!Array.isArray(templates))return;

    templates.forEach((t)=>{if(!t.department)t.department='骨科';});
    const existing=new Set(templates.map((t)=>t.name));
    if(!window.HAJIMI_BOOTSTRAP)seed.forEach((t)=>{if(!existing.has(t.name))templates.push(t);});

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
    const orthoSeedMap=(window.HAJIMI_IDEAL_CASES&&window.HAJIMI_IDEAL_CASES.seeds)||{};
    const byOrthoCategory=(name)=>groups.filter((g)=>orthoSeedMap[g]&&orthoSeedMap[g].category===name);
    const uniq=(arr)=>[...new Set(arr.filter(Boolean))];
    const jointGroups=uniq(['TKA','THA','人工股骨头置换',...byOrthoCategory('关节置换')]);
    const pediatricGroups=uniq(byOrthoCategory('儿童骨科'));
    const adultTraumaGroups=uniq(traumaGroups.filter((g)=>!pediatricGroups.includes(g)&&(!orthoSeedMap[g]||!orthoSeedMap[g].category||orthoSeedMap[g].category==='创伤骨科')));
    const sportsGroups=uniq(byOrthoCategory('运动医学'));
    const handGroups=uniq(byOrthoCategory('手外科'));
    const spineGroups=uniq(byOrthoCategory('脊柱外科'));
    const footGroups=uniq(byOrthoCategory('足踝外科'));
    const boneDiseaseGroups=uniq([
      ...byOrthoCategory('骨病与保髋'),
      ...byOrthoCategory('骨感染'),
      ...byOrthoCategory('骨肿瘤与骨病')
    ]);
    const orthoSections=[
      {
        key:'joint',
        title:'关节置换 / 翻修',
        eyebrow:'ARTHROPLASTY',
        desc:'膝、髋初次置换、单髁置换、翻修及假体周围感染病例，均按完整住院时间线管理。',
        items:jointGroups,
        reserve:[]
      },
      {
        key:'trauma',
        title:'成人创伤骨科',
        eyebrow:'TRAUMA',
        desc:'上肢、下肢、骨盆及关节周围骨折脱位，覆盖常见内固定术式与围手术期记录。',
        items:adultTraumaGroups,
        reserve:[]
      },
      {
        key:'pediatric',
        title:'儿童骨科 / 儿童创伤',
        eyebrow:'PEDIATRIC ORTHOPAEDICS',
        desc:'儿童常见骨折按骨骺保护、复位固定和功能恢复特点单独归档。',
        items:pediatricGroups,
        reserve:[]
      },
      {
        key:'sports',
        title:'运动医学 / 关节镜',
        eyebrow:'SPORTS MEDICINE',
        desc:'半月板、交叉韧带、髌骨不稳、肩关节镜、踝韧带与肌腱损伤完整病例。',
        items:sportsGroups,
        reserve:[]
      },
      {
        key:'hand',
        title:'手外科 / 周围神经',
        eyebrow:'HAND & PERIPHERAL NERVE',
        desc:'肌腱修复、腕管/肘管、腱鞘炎、囊肿及指端软组织修复病例。',
        items:handGroups,
        reserve:[]
      },
      {
        key:'foot',
        title:'足踝外科',
        eyebrow:'FOOT & ANKLE',
        desc:'拇外翻、距骨骨软骨损伤、踝关节退变及成人获得性扁平足等择期病例。',
        items:footGroups,
        reserve:[]
      },
      {
        key:'spine',
        title:'脊柱外科',
        eyebrow:'SPINE',
        desc:'腰椎间盘、椎管狭窄、滑脱、颈椎脊髓病、后纵韧带骨化及脊柱侧弯。',
        items:spineGroups,
        reserve:[]
      },
      {
        key:'bone',
        title:'骨感染 / 骨肿瘤 / 骨病',
        eyebrow:'BONE DISEASE & TUMOR',
        desc:'保髋、骨髓炎、化脓性关节炎、良恶性骨肿瘤及病理性骨折病例。',
        items:boneDiseaseGroups,
        reserve:[]
      },
      {
        key:'soft',
        title:'通用场景 / 并发症',
        eyebrow:'GENERAL & COMPLICATIONS',
        desc:'检查理由、会诊、沟通记录以及术后并发症内容继续作为各病种的扩展章节归档。',
        items:['通用场景'],
        reserve:[]
      }
    ];
    const slugToDept=Object.fromEntries(departments.map((d)=>[d.slug,d.name]));
    const deptToSlug=Object.fromEntries(departments.map((d)=>[d.name,d.slug]));
    const coreFiltered=typeof filtered==='function'?filtered:null;
    let currentDept=null;
    let catalogSize=-1,departmentRecords=new Map(),diseaseRecords=new Map();
    let searchIndex=null,searchIndexSize=-1;
    let routeGeneration=0,activeRoute='';
    let disposeCaseReader=()=>{};

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
    function ensureCatalog(){
      if(catalogSize===templates.length)return;
      departmentRecords=new Map();diseaseRecords=new Map();
      for(const record of templates){
        if(!departmentRecords.has(record.department))departmentRecords.set(record.department,[]);
        departmentRecords.get(record.department).push(record);
        const key=record.department+'\0'+record.group;
        if(!diseaseRecords.has(key))diseaseRecords.set(key,[]);
        diseaseRecords.get(key).push(record);
      }
      catalogSize=templates.length;
    }
    function listForDept(dep){ensureCatalog();return departmentRecords.get(dep)||[];}
    function recordsForDisease(dep,group){ensureCatalog();return diseaseRecords.get(dep+'\0'+group)||[];}
    function departmentCount(dep){return window.HAJIMI?Object.values(window.HAJIMI.manifest.departments).find(item=>item.name===dep)?.count||0:listForDept(dep).length;}
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
      const items=recordsForDisease(dep,g);
      const chips=['入院','术前','术中','术后'].map((s)=>{const n=items.filter((t)=>t.stage===s).length;return n?`<span>${s} ${n}</span>`:''}).join('');
      return `<article class="project-card disease-card" data-disease="${encodeURIComponent(g)}" role="button" tabindex="0"><div class="project-card-top"><span class="project-kind">${dep}</span><strong>1 套完整病历</strong></div><h3>${labelFor(g)}</h3><p>一个病种一个连续病历页面，目录可直达术前讨论、手术记录及术后各日病程。</p><div class="project-stage-chips">${chips}</div><div class="project-open">打开完整病历 <span>→</span></div></article>`;
    }
    function orthoDiseaseCard(g){
      const items=recordsForDisease('骨科',g);
      const standardItems=items.filter((t)=>!t.specialCase);
      const specialCases=[...new Set(items.filter((t)=>t.specialCase).map((t)=>t.specialCaseKey).filter(Boolean))];
      const stageOrder=['入院','术前','术中','术后'];
      const chips=stageOrder.map((stage)=>{
        const n=standardItems.filter((t)=>t.stage===stage).length;
        return n?`<span>${stage}<b>${n}</b></span>`:'';
      }).join('');
      const meta=specialCases.length?`1 套标准 · ${specialCases.length} 个特殊病例`:`1 套 · ${standardItems.length} 章节`;
      const copy=specialCases.length?'标准病历与术后特殊病例分开归档，特殊病例按各自真实时间线连续阅读。':'全部记录整合到同一病种页面，按病历顺序连续阅读并通过目录快速跳转。';
      return `<article class="ortho-disease-card" data-disease="${encodeURIComponent(g)}" role="button" tabindex="0">
        <div class="ortho-card-top"><span>完整病历</span><strong>${meta}</strong></div>
        <h3>${labelFor(g)}</h3>
        <p>${copy}</p>
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
    function scrollToOrthoCategory(){
      const anchor=orthoSections.find(section=>location.hash==='#ortho-'+section.key);
      if(anchor)document.getElementById('ortho-'+anchor.key)?.scrollIntoView({behavior:'instant',block:'start'});
    }
    function renderOrthoIndex(){
      document.body.classList.remove('department-no-sidebar','library-root-page','disease-book-page');
      setBrand();
      const list=listForDept('骨科');
      const title=document.getElementById('resultTitle');
      const num=document.getElementById('resultCount');
      const grid=document.getElementById('templateGrid');
      const empty=document.getElementById('emptyState');
      const jointCount=list.filter((t)=>jointGroups.includes(t.group)).length;
      const traumaCount=list.filter((t)=>adultTraumaGroups.includes(t.group)).length;
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
                  <strong>${section.items.reduce((sum,g)=>sum+recordsForDisease('骨科',g).length,0)} 份模板</strong>
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
      // The catalog loads asynchronously, so an initial fragment may arrive
      // before its category exists. Restore it once the overview is rendered.
      scrollToOrthoCategory();
    }
    function toolbar(label,root){
      return `<div class="department-toolbar"><div class="department-toolbar-actions"><a class="btn ghost site-home-btn" href="/">⌂ 网站首页</a><button class="btn ghost" id="departmentBack">← ${root?'返回病历首页':'返回科室'}</button></div><span>${label}</span></div>`;
    }
    function renderDepartmentRoot(){
      disposeCaseReader();disposeCaseReader=()=>{};
      document.body.classList.remove('disease-book-page');
      currentDept=null;resetState();setBrand();
      document.body.classList.add('department-no-sidebar','library-root-page');
      const title=document.getElementById('resultTitle'),num=document.getElementById('resultCount'),grid=document.getElementById('templateGrid'),empty=document.getElementById('emptyState');
      const totalCount=window.HAJIMI?.manifest.total||templates.length;
      const orthoCount=departmentCount('骨科');
      const otherCount=totalCount-orthoCount;
      if(title)title.textContent='选择科室';
      if(num)num.textContent=departments.length+' 个科室 · '+totalCount+' 份模板';
      if(empty)empty.hidden=true;
      if(grid)grid.innerHTML=`
        <div class="library-root-home-row"><a class="btn ghost site-home-btn" href="/">⌂ 返回网站首页</a></div>
        <div class="library-section-heading">
          <div><span>01</span><h3>科室入口</h3><p>选择科室后，再进入具体疾病或术式。</p></div>
          <strong>${departments.length} 个科室</strong>
        </div>
        <div class="department-grid library-department-grid">${departments.map((d)=>deptCard(d.name)).join('')}</div>
        <section class="library-overview">
          <div class="library-overview-copy">
            <span>CLINICAL TEMPLATE LIBRARY</span>
            <h2>从科室进入，快速找到需要的病历。</h2>
            <p>按科室、疾病或术式、住院阶段和记录类型组织。现有内容保持不变，后续可继续增加科室、疾病、案例影像和专项记录。</p>
          </div>
          <div class="library-overview-stats">
            <div><strong>${totalCount}</strong><span>全部模板</span></div>
            <div><strong>${departments.length}</strong><span>科室分类</span></div>
            <div><strong>${orthoCount}</strong><span>骨科模板</span></div>
            <div><strong>${otherCount}</strong><span>其他科室</span></div>
          </div>
        </section>
        <section id="libraryPersonal" class="library-quick-panel" aria-label="我的常用入口"></section>`;
      window.HAJIMI_PERSONAL?.mount();
      document.querySelectorAll('[data-department]').forEach((c)=>{
        const go=()=>navigateDepartment(c.dataset.department);
        c.onclick=go;c.onkeydown=(e)=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go();}};
      });
      const tc=document.getElementById('templateCount'),ac=document.getElementById('allCount');
      if(tc)tc.textContent=totalCount;
      if(ac)ac.textContent=totalCount;
    }
    function renderDepartmentIndex(){
      disposeCaseReader();disposeCaseReader=()=>{};
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
      if(/手术知情同意/.test(s))return 64;
      if(/麻醉知情同意/.test(s))return 65;
      if(/麻醉术前访视/.test(s))return 66;
      if(/术前小结/.test(s))return 70;
      if(/会诊申请/.test(s))return 72;
      if(/会诊回报|会诊记录/.test(s))return 73;
      if(/手术安全核查/.test(s))return 80;
      if(/手术清点/.test(s))return 82;
      if(/^麻醉记录|麻醉记录/.test(s))return 84;
      if(/完整手术记录|手术记录/.test(s))return 86;
      if(/麻醉术后访视/.test(s))return 92;
      if(/术后主刀查房/.test(s))return 95;
      if(day){
        const map={'一':1,'二':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9,'十':10};
        const raw=day[1];const n=/^\d+$/.test(raw)?+raw:(map[raw]||11);
        return 100+n;
      }
      if(/康复评估|康复记录|训练记录/.test(s))return 250;
      if(/影像复查|检查理由|复查申请/.test(s))return 260;
      if(/并发症|切口渗液|切口愈合不良|感染|血栓|发热|贫血|神经损伤|再手术/.test(s))return 400;
      if(/出院前主治医师查房/.test(s))return 450;
      if(/出院当天查房|出院当日查房|出院前主治医师查房/.test(s))return 480;
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
    function sortRecordList(raw){
      // The reviewed case includes supplementary forms with explicitly unknown
      // clock times. Keep their reviewed document order without inventing times.
      const reviewedIntertrochanteric = raw.length > 0 && raw.every(t =>
        t.department === '骨科' && t.group === '股骨转子间骨折' &&
        String(t.sourceBody || '').startsWith("【完全虚构的教学标准病例｜第三轮修订】"));
      const reviewedOrder = reviewedIntertrochanteric ? ["入院记录", "首次病程记录", "主治医师首次查房记录", "主任医师首次查房记录", "选择治疗方案沟通记录", "多学科术前讨论", "手术知情同意记录", "麻醉知情同意书", "麻醉术前访视记录", "术前小结", "术前主刀查房", "手术安全核查记录", "麻醉记录", "手术记录", "手术清点记录", "术后首次病程记录", "麻醉术后访视记录", "术后主刀查房记录", "术后第1天病程", "术后第2天病程", "术后第2天晚间双下肢静脉彩超结果分析记录", "术后第3天病程", "影像复查及结果分析", "康复评估与训练记录", "术后第4天病程记录", "术后第5天病程", "出院当天查房记录", "出院前主治医师查房记录", "出院小结", "出院医嘱单（单独复制版）"] : [];
      return [...raw].sort((a,b)=>{
        if(reviewedIntertrochanteric){
          const ao=reviewedOrder.indexOf(a.short),bo=reviewedOrder.indexOf(b.short);
          if(ao>=0 && bo>=0 && ao!==bo)return ao-bo;
        }
        if(Number.isFinite(a.recordOrder)||Number.isFinite(b.recordOrder)){
          const ao=Number.isFinite(a.recordOrder)?a.recordOrder:9999;
          const bo=Number.isFinite(b.recordOrder)?b.recordOrder:9999;
          if(ao!==bo)return ao-bo;
        }
        const ta=recordTimestamp(a),tb=recordTimestamp(b);
        if(Number.isFinite(ta)&&Number.isFinite(tb)&&ta!==tb)return ta-tb;
        if(Number.isFinite(ta)!==Number.isFinite(tb))return Number.isFinite(ta)?-1:1;
        return recordPriority(a)-recordPriority(b)||templates.indexOf(a)-templates.indexOf(b);
      });
    }
    function specialRecordId(t,i,key){
      return 'special-'+String(key||'case').replace(/[^a-zA-Z0-9\u4e00-\u9fa5]+/g,'-').slice(0,42)+'-'+i+'-'+String(t.short||t.name||'section').replace(/[^a-zA-Z0-9\u4e00-\u9fa5]+/g,'-').slice(0,32);
    }
    function specialRecordChapter(t,i,key){
      const id=specialRecordId(t,i,key),idx=templates.indexOf(t);
      return `<article class="record-book-section special-record-section" id="${id}" data-record-index="${idx}">
        <header class="record-book-section-head">
          <div class="record-chapter-no">${String(i+1).padStart(2,'0')}</div>
          <div class="record-chapter-title"><span>${t.stage} · ${t.type}</span><h3>${t.short||t.name}</h3></div>
          <div class="record-chapter-actions">
            <button class="btn ghost preview" data-index="${idx}" type="button">查看 / 编辑</button>
            <button class="btn primary copy" data-index="${idx}" type="button">复制本章节</button>
          </div>
        </header>
        <div class="record-book-body">${escapeHtml(String(generate(t)))}</div>
        <a class="record-back-toc" href="#special-cases-top">↑ 回到特殊病例</a>
      </article>`;
    }
    function buildSpecialCaseBooks(specialRaw){
      const byKey=new Map();
      specialRaw.forEach((t)=>{
        const key=t.specialCaseKey||t.specialCaseTitle||'special';
        if(!byKey.has(key))byKey.set(key,[]);
        byKey.get(key).push(t);
      });
      const groups=[...byKey.entries()].map(([key,items])=>({
        key,
        title:items[0]?.specialCaseTitle||'特殊病例',
        summary:items[0]?.specialCaseSummary||'',
        order:items[0]?.specialCaseOrder||999,
        records:sortRecordList(items)
      })).sort((a,b)=>a.order-b.order);
      if(!groups.length)return {html:'',groups:[]};
      const html=`<section class="special-case-library" id="special-cases-top">
        <div class="special-case-library-head">
          <span>SPECIAL CASES · TKA</span>
          <h3>膝关节置换 · 特殊病例</h3>
          <p>特殊病例不与标准理想病例混排，按每个患者自身的住院时间线归档。重点保留并发症判断、再手术决策、处理依据与转归。</p>
          <strong>${groups.length} 个病例 · ${specialRaw.length} 个章节</strong>
        </div>
        ${groups.map((g,caseIndex)=>`<details class="special-case-book" ${caseIndex===0?'open':''}>
          <summary class="special-case-summary">
            <div><span>CASE ${String(caseIndex+1).padStart(2,'0')}</span><h4>${escapeHtml(g.title)}</h4><p>${escapeHtml(g.summary)}</p></div>
            <div class="special-case-summary-meta"><strong>${g.records.length}</strong><small>个连续章节</small></div>
          </summary>
          <div class="special-case-actions"><button class="btn primary copy-special-case" data-special-key="${escapeHtml(g.key)}" type="button">复制该特殊病例整套记录</button></div>
          <div class="special-case-layout">
            <aside class="special-case-toc">
              <div><span>CASE CONTENTS</span><b>本病例目录</b></div>
              <nav>${g.records.map((t,i)=>`<a href="#${specialRecordId(t,i,g.key)}"><span>${String(i+1).padStart(2,'0')}</span><b>${escapeHtml(t.short||t.name)}</b><small>${t.stage}</small></a>`).join('')}</nav>
            </aside>
            <div class="special-case-records">${g.records.map((t,i)=>specialRecordChapter(t,i,g.key)).join('')}</div>
          </div>
        </details>`).join('')}
      </section>`;
      return {html,groups};
    }

    // Case workspace: all existing chapter content remains unchanged. Group only the navigation.
    function caseFileCategory(t){
      const label=String(t.short||'')+' '+String(t.type||'');
      if(/知情同意|同意书|选择治疗方案|选择手术方案|沟通记录|沟通告知|谈话记录|告知书|术前谈话|家属谈话|手术风险告知/.test(label))return 'consent';
      if(/出院小结|出院记录|出院病历|出院医嘱|出院随访|随访记录|出院当天查房|出院当日查房|出院前主治医师查房/.test(label))return 'discharge';
      if(/术后|康复|下肢血管超声|影像复查|切口渗液|并发症/.test(label))return 'postop';
      if(/手术记录|麻醉记录|手术安全核查|手术清点|麻醉术后访视/.test(label))return 'surgery';
      if(/会诊申请|会诊回报|会诊记录|检查理由|辅助检查/.test(label))return 'consult';
      return 'admission';
    }
    function caseFileSections(list){
      const defs=[
        ['admission','住院病历','入院、首次病程、术前查房及讨论','clinical'],
        ['surgery','手术与麻醉','手术记录、麻醉及手术核查','clinical'],
        ['postop','术后病程与康复','术后每日记录、康复和并发症','clinical'],
        ['discharge','出院与随访','出院小结、出院记录与随访','clinical'],
        ['consent','知情同意与沟通','手术、麻醉、治疗方案及家属签字','consent'],
        ['consult','检查与会诊','辅助检查、会诊及其他材料','extra']
      ];
      return defs.map(function(def){
        const members=list.map(function(t,i){return {t:t,i:i};}).filter(function(item){return caseFileCategory(item.t)===def[0];});
        return {key:def[0],title:def[1],hint:def[2],family:def[3],members:members};
      });
    }
    function caseFileNav(list){
      const sections=caseFileSections(list);
      const familyLabels={clinical:'一、临床病历',consent:'二、知情同意与沟通签字',extra:'三、检查与会诊'};
      const nav=Object.keys(familyLabels).map(function(family){
        const groups=sections.filter(function(x){return x.family===family;});
        return '<div class="case-nav-family"><h4>'+familyLabels[family]+'</h4>'+groups.map(function(section){
          const items=section.members.map(function(m){
            const id=recordBookId(m.t,m.i);
            return '<a href="#'+id+'" class="case-nav-item" data-case-record="'+id+'"><span>'+String(m.i+1).padStart(2,'0')+'</span><b>'+escapeHtml(m.t.short||m.t.name)+'</b><small class="case-nav-current-label" aria-hidden="true">当前章节</small></a>';
          }).join('');
          return '<details class="case-nav-group" open><summary><span>'+section.title+'</span><small>'+section.members.length+' 篇</small></summary>'+
            (items?'<nav>'+items+'</nav>':'<p class="case-nav-empty">暂无此类文书</p>')+'</details>';
        }).join('')+'</div>';
      }).join('');
      return '<div class="record-book-toc-head"><span>PATIENT CASE FILE</span><h3>完整病例目录</h3><p>整套连续阅读，点击目录跳转</p><div class="reading-font-slot"></div></div>'+nav;
    }
    function bindCaseFileReader(){
      disposeCaseReader();disposeCaseReader=()=>{};
      const root=document.getElementById('caseWorkspace');if(!root)return;
      const articles=[...root.querySelectorAll('.case-file-reader > .record-book-section')];
      const links=[...root.querySelectorAll('[data-case-record]')];
      const status=root.querySelector('#caseCurrentSection');
      const bottomStatus=root.querySelector('#caseBottomSection');
      const stepButtons=[...root.querySelectorAll('[data-case-step]')];
      const directory=root.querySelector('#recordBookToc');
      const directoryPanel=root.querySelector('#caseDirectoryPanel');
      const directorySummary=root.querySelector('#caseDirectorySummary');
      const compactStatus=root.querySelector('#caseDirectoryCurrent');
      const compactQuery=typeof window.matchMedia==='function'?window.matchMedia('(max-width: 720px)'):null;
      const isCompact=()=>compactQuery?compactQuery.matches:window.innerWidth<=720;
      // All chapters stay in the same document. case-active is only a location marker.
      root.classList.add('case-continuous-reader','case-show-all');
      if(directoryPanel)directoryPanel.open=!isCompact();
      if(!articles.length){
        if(status)status.textContent='暂无标准文书';
        if(bottomStatus)bottomStatus.textContent='暂无标准文书';
        if(compactStatus)compactStatus.textContent='暂无标准文书';
        root.querySelectorAll('.case-file-tools button,.case-file-bottom-nav button').forEach(function(btn){btn.disabled=true;});
        return;
      }
      // pinnedY: page offset left by our own jump. The chosen chapter stays current
      // until the reader scrolls away, even if a short final chapter cannot reach the top.
      let selected=-1,frame=0,disposed=false,pinnedY=null;
      const pinScroll=function(){pinnedY=typeof window.scrollY==='number'?window.scrollY:null;};
      function syncNavigation(){
        const position=String(selected+1).padStart(2,'0')+' / '+articles.length;
        const name=articles[selected].querySelector('h3').textContent;
        if(status)status.textContent='整套病历 · '+articles.length+' 篇连续文书';
        if(bottomStatus)bottomStatus.textContent='第 '+position+' 份 · '+name;
        if(compactStatus)compactStatus.textContent=String(selected+1).padStart(2,'0')+' · '+name;
        stepButtons.forEach(function(btn){btn.disabled=Number(btn.dataset.caseStep)<0?selected===0:selected===articles.length-1;});
      }
      function revealDirectorySelection(){
        const link=links.find(function(item){return item.dataset.caseRecord===articles[selected].id;});
        if(link&&directory&&(!isCompact()||directoryPanel?.open)){
          link.closest('details').open=true;
          const item=link.getBoundingClientRect(),bounds=directory.getBoundingClientRect();
          if(item.top<bounds.top+12)directory.scrollTop+=item.top-bounds.top-12;
          else if(item.bottom>bounds.bottom-12)directory.scrollTop+=item.bottom-bounds.bottom+12;
        }
        return link;
      }
      function activate(i,scroll,updateHash=true){
        if(i<0||i>=articles.length)return;
        selected=i;
        articles.forEach(function(a,j){a.classList.toggle('case-active',j===i);});
        const id=articles[i].id;
        links.forEach(function(link){const yes=link.dataset.caseRecord===id;link.classList.toggle('is-current',yes);if(yes){link.setAttribute('aria-current','location');link.closest('details').open=true;}else link.removeAttribute('aria-current');});
        syncNavigation();
        if(!isCompact())revealDirectorySelection();
        if(scroll){
          if(isCompact()&&directoryPanel)directoryPanel.open=false;
          if(updateHash){try{history.replaceState(history.state||{},'',location.pathname+location.search+'#'+encodeURIComponent(id));}catch{}}
          articles[i].scrollIntoView({behavior:'instant',block:'start'});pinScroll();
          const heading=articles[i].querySelector('h3');heading.tabIndex=-1;heading.focus({preventScroll:true});
        }
      }
      function syncFromScroll(){
        frame=0;
        if(disposed||!root.isConnected||(isCompact()&&directoryPanel?.open))return;
        if(pinnedY!==null&&Math.abs(window.scrollY-pinnedY)<2)return;
        pinnedY=null;
        const header=document.querySelector('.library-topbar');
        const line=Math.max(0,header?.getBoundingClientRect().bottom||0)+(isCompact()&&directoryPanel?directory.getBoundingClientRect().height+48:24);
        let index=0;
        for(let i=0;i<articles.length;i++){
          if(articles[i].getBoundingClientRect().top>line)break;
          index=i;
        }
        if(index!==selected)activate(index,false,false);
      }
      function scheduleReadingSync(){
        if(!frame&&!disposed)frame=window.requestAnimationFrame(syncFromScroll);
      }
      function applyDirectoryMode(){
        if(directoryPanel)directoryPanel.open=!isCompact();
        scheduleReadingSync();
      }
      links.forEach(function(link){
        link.addEventListener('click',function(e){
          e.preventDefault();
          const idx=articles.findIndex(function(a){return a.id===link.dataset.caseRecord;});
          if(idx<0)return;
          activate(idx,true);
        });
      });
      stepButtons.forEach(function(btn){btn.onclick=function(){activate(selected+Number(btn.dataset.caseStep),true);};});
      function backToDirectory(e){
        e.preventDefault();
        if(isCompact()&&directoryPanel)directoryPanel.open=true;
        const link=revealDirectorySelection();
        if(link)link.focus({preventScroll:true});
        // The directory is sticky and normally already on screen. Only nudge the page
        // when its top is hidden (e.g. pushed up at the end of the record), so the
        // reading position and the current chapter are kept.
        if(directory&&typeof window.scrollBy==='function'){
          const header=document.querySelector('.library-topbar');
          const limit=Math.max(0,header?.getBoundingClientRect().bottom||0);
          const top=directory.getBoundingClientRect().top;
          if(top<limit||top>window.innerHeight-56){window.scrollBy({top:top-limit-8,behavior:'instant'});pinScroll();}
        }
      }
      root.querySelectorAll('#caseBackToDirectory,.record-back-toc').forEach(function(btn){btn.onclick=backToDirectory;});
      // Old chapter URLs include a presentation ordinal. A body timestamp edit
      // can change sorting; resolve the frozen case/title only when unambiguous.
      function historicalChapter(list,hash){
        const exact=list.find(a=>a.id===hash);if(exact)return exact;
        const matches=list.filter(a=>{
          const record=templates[Number(a.dataset.recordIndex)];if(!record)return false;
          const marker='__ordinal__',sample=a.classList.contains('special-record-section')
            ?specialRecordId(record,marker,record.specialCaseKey):recordBookId(record,marker);
          const [prefix,suffix]=sample.split(marker);
          return hash.startsWith(prefix)&&hash.endsWith(suffix)&&/^\d+$/.test(hash.slice(prefix.length,hash.length-suffix.length));
        });
        return matches.length===1?matches[0]:null;
      }
      function restoreChapter(){
        let hash='';try{hash=decodeURIComponent(location.hash.slice(1));}catch{}
        const specialTarget=historicalChapter([...document.querySelectorAll('.special-record-section')],hash);
        const specialBook=specialTarget?.closest('details.special-case-book');
        if(specialBook){specialBook.open=true;specialTarget.scrollIntoView({behavior:'instant',block:'start'});}
        const initial=articles.indexOf(historicalChapter(articles,hash));
        if(initial>=0)activate(initial,true,false);
        else if(selected<0)activate(0,false,false);
      }
      function directoryEscape(e){
        if(e.key==='Escape'&&isCompact()&&directoryPanel?.open){directoryPanel.open=false;directorySummary?.focus({preventScroll:true});}
      }
      window.addEventListener('scroll',scheduleReadingSync,{passive:true});
      window.addEventListener('resize',scheduleReadingSync,{passive:true});
      window.addEventListener('hashchange',restoreChapter);
      compactQuery?.addEventListener('change',applyDirectoryMode);
      directoryPanel?.addEventListener('toggle',scheduleReadingSync);
      directory?.addEventListener('keydown',directoryEscape);
      disposeCaseReader=()=>{
        disposed=true;
        if(frame)window.cancelAnimationFrame(frame);
        window.removeEventListener('scroll',scheduleReadingSync);
        window.removeEventListener('resize',scheduleReadingSync);
        window.removeEventListener('hashchange',restoreChapter);
        compactQuery?.removeEventListener('change',applyDirectoryMode);
        directoryPanel?.removeEventListener('toggle',scheduleReadingSync);
        directory?.removeEventListener('keydown',directoryEscape);
      };
      restoreChapter();
    }

    function renderDisease(){
      document.body.classList.remove('library-root-page');
      document.body.classList.add('department-no-sidebar','disease-book-page');
      setBrand();
      const raw=(coreFiltered?coreFiltered():templates).filter((t)=>t.department===currentDept&&t.group===state.group);
      const specialRaw=raw.filter((t)=>t.specialCase);
      const standardRaw=raw.filter((t)=>!t.specialCase);
      const list=sortRecordList(standardRaw);
      const specialBundle=buildSpecialCaseBooks(specialRaw);
      const title=document.getElementById('resultTitle'),num=document.getElementById('resultCount'),grid=document.getElementById('templateGrid'),empty=document.getElementById('emptyState');
      if(title)title.textContent=currentDept+' · '+labelFor(state.group);
      if(num)num.textContent=specialBundle.groups.length
        ?'1 套标准病历 · '+list.length+' 个章节 · '+specialBundle.groups.length+' 个特殊病例'
        :'1 套完整病历 · '+list.length+' 个现有章节';
      if(empty)empty.hidden=(list.length+specialRaw.length)>0;

      const isDischarge=(t)=>/出院小结|出院记录|出院病历/.test((t.short||'')+' '+(t.name||''))||(t.group==='股骨转子间骨折'&&t.type==='出院医嘱');
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
      const pathwayKeyByGroup={
        'TKA':'tka',
        'THA':'tha',
        '股骨颈骨折内固定':'fnf',
        '股骨转子间骨折':'intertroch',
        '胫骨Pilon骨折':'pilon',
        '踝关节三踝骨折':'trimalleolar',
        '脊髓型颈椎病':'acdf',
        '腰椎滑脱症':'lumbarFusion'
      };
      const pathwayKey=currentDept==='骨科'?pathwayKeyByGroup[state.group]:null;
      const pathwayHref=pathwayKey?(pathwayKey==='tka'?'/pathway':'/pathway?p='+encodeURIComponent(pathwayKey)):'';

      const hero=`
        <section class="disease-hero record-book-hero">
          <div>
            <span>${currentDept==='骨科'?'ORTHOPAEDICS':'CLINICAL RECORD'} · COMPLETE MEDICAL RECORD</span>
            <h2>${labelFor(state.group)} · 完整病历</h2>
            <p>一个疾病只保留一个连续病历页面。顺序参照住院病历书写流程，目录可直接跳转到首次病程、查房、术前讨论、手术记录和术后各日病程。</p>
            <div class="record-book-hero-actions"><button id="copyWholeRecord" class="btn primary" type="button">复制完整病历</button><button id="printWholeRecord" class="btn ghost" type="button">打印整套病历</button><button id="favoriteDisease" class="btn ghost" type="button" aria-pressed="false">☆ 收藏病种</button>${pathwayHref?'<a class="btn ghost" href="'+pathwayHref+'">查看临床路径</a>':''}</div>
          </div>
          <strong>1<small>套标准病历 · ${list.length} 个现有章节${specialBundle.groups.length?' · '+specialBundle.groups.length+'个特殊病例':''}</small></strong>
        </section>`;

      const allChapters=list.map(function(t,i){return recordChapter(t,i);}).join('');
      const grouping=caseFileSections(list);
      const signedCount=grouping.find(function(x){return x.key==='consent';}).members.length;
      if(grid)grid.innerHTML=toolbar(currentDept+' · '+labelFor(state.group),false)+hero+
        '<div class="source-template-note"><strong>示例患者 · 整套病历：</strong>各章节取自本病种现有示例模板，使用前请核对患者身份、日期、检查结果、真实手术经过及签字信息；特殊病例另行归档，不与标准病例混用。</div>'+
        '<section id="caseWorkspace" class="case-workspace case-continuous-reader case-show-all record-book-layout">'+
          '<aside class="record-book-toc case-file-sidebar" id="recordBookToc" aria-label="完整病历目录">'+
            '<details id="caseDirectoryPanel" class="case-directory-panel" open><summary id="caseDirectorySummary" class="case-directory-summary"><strong>病历目录</strong><span id="caseDirectoryCurrent"></span><span class="case-directory-chevron" aria-hidden="true">⌄</span></summary>'+caseFileNav(list)+'</details></aside>'+
          '<div class="record-book-content case-file-reader-wrap">'+
            '<div class="case-file-tools"><div><span class="case-file-eyebrow">CASE READER</span><strong id="caseCurrentSection">'+list.length+' 篇文书</strong><small>临床病历 '+(list.length-signedCount)+' 篇 · 签字沟通 '+signedCount+' 篇</small></div><div class="case-file-reader-actions">'+
              '<button id="casePrevious" data-case-step="-1" class="btn ghost" type="button">← 上一章</button>'+
              '<button id="caseNext" data-case-step="1" class="btn ghost" type="button">下一章 →</button>'+
            '</div></div>'+
            '<div class="case-file-reader">'+allChapters+'</div>'+
            '<nav class="case-file-bottom-nav" aria-label="病历阅读操作">'+
              '<strong id="caseBottomSection" aria-live="polite" aria-atomic="true"></strong>'+
              '<div class="case-file-bottom-actions">'+
                '<button id="casePreviousBottom" data-case-step="-1" class="btn ghost" type="button">← 上一章</button>'+
                '<button id="caseBackToDirectory" class="btn ghost" type="button">病历目录</button>'+
                '<button id="caseNextBottom" data-case-step="1" class="btn primary" type="button">下一章 →</button>'+
              '</div>'+
            '</nav>'+
          '</div>'+
        '</section>'+specialBundle.html;

      const b=document.getElementById('departmentBack');if(b)b.onclick=()=>navigateDepartment(currentDept);
      bindTemplateActions();
      window.HAJIMI_PERSONAL?.remember(currentDept,state.group);
      window.HAJIMI_PERSONAL?.bindFavorite(document.getElementById('favoriteDisease'),currentDept,state.group);
      const copyWhole=document.getElementById('copyWholeRecord');if(copyWhole)copyWhole.onclick=()=>copyText(recordBookText(list));
      const printWhole=document.getElementById('printWholeRecord');if(printWhole)printWhole.onclick=()=>window.print();

      bindCaseFileReader();
      window.HAJIMI_UI?.mount();

      document.querySelectorAll('.copy-special-case').forEach((btn)=>{
        btn.onclick=()=>{
          const g=specialBundle.groups.find((x)=>x.key===btn.dataset.specialKey);
          if(g)copyText(recordBookText(g.records));
        };
      });
      const tc=document.getElementById('templateCount'),ac=document.getElementById('allCount');if(tc)tc.textContent=specialBundle.groups.length?'1 套 + '+specialBundle.groups.length+' 特殊':'1 套';if(ac)ac.textContent=departmentCount(currentDept);
    }
    async function finishNavigation(){
      const path=location.pathname;
      window.scrollTo({top:0,behavior:'instant'});
      await applyRoute();if(path!==location.pathname)return;
      const main=document.querySelector('#libraryShell main');
      if(main){main.tabIndex=-1;main.focus({preventScroll:true});}
    }
    function navigateRoot(){history.pushState({},'', '/bl');finishNavigation();}
    function navigateDepartment(dep){history.pushState({},'', '/bl/'+deptToSlug[dep]);finishNavigation();}
    function navigateDisease(g){history.pushState({},'', '/bl/'+deptToSlug[currentDept]+'/'+encodeURIComponent(g));finishNavigation();}
    function applyRouteSearch(){
      if(!location.search)return;
      const query=new URLSearchParams(location.search).get('q')?.trim();
      if(!query)return;
      state.q=query;
      document.getElementById('searchInput').value=query;
      render();
    }
    async function applyRoute(){
      disposeCaseReader();disposeCaseReader=()=>{};
      activeRoute=location.pathname+location.search;
      const generation=++routeGeneration;
      document.getElementById('templateGrid').classList.remove('search-results','case-search-results');
      const r=pathState();setShell(r.page);
      const title=r.page==='home'?'哈基米工作站':r.page==='duty'?'值班资料':r.page==='departments'?'病历模板库':(r.disease?labelFor(r.disease)+' · 完整病历':(r.department||'')+'病历模板库');
      document.title=title==='哈基米工作站'?title:title+' · 哈基米工作站';
      if(r.page==='home'||r.page==='duty')return;
      if(r.page==='departments'){renderDepartmentRoot();applyRouteSearch();return;}
      if(window.HAJIMI&&r.department){
        const grid=document.getElementById('templateGrid');grid.innerHTML='<p class="library-loading" role="status">正在加载病历资料…</p>';
        try{
          await window.HAJIMI.ensureDepartment(deptToSlug[r.department]);
          if(r.disease)await window.HAJIMI.ensureGroup(r.department,r.disease);
        }catch(error){
          if(generation!==routeGeneration)return;
          grid.innerHTML='<p class="library-loading" role="alert">'+escapeHtml(error.message)+'</p><button class="btn ghost" id="retryRecords">重试</button>';
          document.getElementById('retryRecords').onclick=applyRoute;return;
        }
        if(generation!==routeGeneration)return;
      }
      currentDept=r.department||null;if(!currentDept){renderDepartmentRoot();return;}
      resetState();
      if(r.disease&&allDisease(currentDept).includes(r.disease)){state.group=r.disease;renderDisease();}
      else{renderDepartmentIndex();applyRouteSearch();}
    }

    function renderSearchResults(department){
      disposeCaseReader();disposeCaseReader=()=>{};
      if(!searchIndex||searchIndexSize!==templates.length){
        searchIndex=createHajimiSearch(templates);searchIndexSize=templates.length;
      }
      const matching=searchIndex(state,department);
      const grouped=new Map();
      matching.forEach(function(t){
        const key=t.department+'\0'+t.group;
        if(!grouped.has(key))grouped.set(key,{department:t.department,group:t.group,count:0,examples:[]});
        const entry=grouped.get(key);
        entry.count++;
        if(entry.examples.length<3&&!entry.examples.some(item=>item.name===t.name&&item.specialCaseKey===t.specialCaseKey))entry.examples.push(t);
      });
      const cases=[...grouped.values()];
      document.body.classList.remove('disease-book-page');
      document.body.classList.toggle('library-root-page',!department);
      document.body.classList.toggle('department-no-sidebar',department!=='骨科');
      setBrand();
      const title=document.getElementById('resultTitle'),num=document.getElementById('resultCount'),grid=document.getElementById('templateGrid'),empty=document.getElementById('emptyState');
      if(title)title.textContent=(department||'全部科室')+' · 搜索结果 · 完整病例';
      if(num)num.textContent=cases.length+' 套病例 · 匹配 '+matching.length+' 份文书';
      if(empty)empty.hidden=cases.length>0;
      if(!grid)return;
      grid.classList.add('search-results','case-search-results');
      grid.innerHTML='<p class="case-search-intro">每个病种只显示一个入口。打开后可在左侧查看住院病历、手术与术后记录，以及独立整理的知情同意和沟通签字材料。</p><div class="case-search-grid"></div>';
      const container=grid.querySelector('.case-search-grid');
      let shown=0;
      function renderCard(c){
        const count=recordsForDisease(c.department,c.group).filter(function(x){return !x.specialCase;}).length;
        const highlight=value=>highlightHajimiSearch(value,state.q);
        const icon=name=>window.HAJIMI_UI?.icon(name)||'';
        const terms=state.q.trim().toLowerCase().split(/\s+/).filter(Boolean);
        const examples=c.examples.map(t=>{
          const desc=String(t.desc||'');
          const showDesc=terms.some(term=>desc.toLowerCase().includes(term));
          return '<li>'+icon('file')+'<div><b>'+highlight(t.short||t.name)+'</b><small>'+highlight([t.stage,t.type,t.specialCase?'特殊病例':''].filter(Boolean).join(' · '))+'</small>'+
            (showDesc?'<span class="case-match-description">'+highlight(desc)+'</span>':'')+'</div></li>';
        }).join('');
        const code=labelFor(c.group)!==c.group?'<span class="case-search-code">'+highlight(c.group)+'</span>':'';
        return '<article class="case-search-card" data-case-group="'+encodeURIComponent(c.group)+'" data-case-department="'+encodeURIComponent(c.department)+'" tabindex="0" role="button">'+
        '<div class="case-search-card-top"><span>完整病例 · '+highlight(c.department)+'</span>'+code+'<span>'+count+' 篇现有文书</span></div>'+
        '<h3>'+highlight(labelFor(c.group))+'</h3><p>整合入院、术前、手术、术后康复、出院记录以及独立的签字同意与沟通资料。</p>'+
        '<div class="case-search-matches"><h4>'+(state.q.trim()?'匹配文书':'符合筛选的文书')+'</h4><ul>'+examples+'</ul>'+
        (c.count>c.examples.length?'<small class="case-match-more">另有 '+(c.count-c.examples.length)+' 篇匹配文书</small>':'')+'</div>'+
        '<div class="case-search-card-bottom"><small>搜索匹配 '+c.count+' 篇</small><b>打开完整病历 '+icon('next')+'</b></div></article>';
      }
      function append(){
        container.querySelector('.search-more')?.remove();
        const next=cases.slice(shown,shown+24);
        shown+=next.length;
        container.insertAdjacentHTML('beforeend',next.map(renderCard).join(''));
        if(shown<cases.length){
          container.insertAdjacentHTML('beforeend','<div class="search-more"><span>已显示 '+shown+' / '+cases.length+' 套病例</span><button class="btn ghost" type="button">显示更多</button></div>');
          container.querySelector('.search-more button').onclick=append;
        }
        container.querySelectorAll('.case-search-card').forEach(function(card){
          if(card.dataset.bound==='yes')return;
          card.dataset.bound='yes';
          const open=function(){
            const dep=decodeURIComponent(card.dataset.caseDepartment),g=decodeURIComponent(card.dataset.caseGroup);
            history.pushState({},'', '/bl/'+deptToSlug[dep]+'/'+encodeURIComponent(g));
            finishNavigation();
          };
          card.onclick=open;
          card.onkeydown=function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}};
        });
      }
      append();
    }

    let searchLoading=false;
    render=function(){
      document.getElementById('templateGrid').classList.remove('search-results','case-search-results');
      const r=pathState();
      if(r.page!=='library'&&r.page!=='departments'){setShell(r.page);return;}
      if(r.page==='departments'){
        currentDept=null;
        if(window.HAJIMI&&!window.HAJIMI.hasAllDepartments()&&(state.q.trim()||state.stage!=='all'||state.type!=='all')){
          if(searchLoading)return;
          searchLoading=true;
          document.getElementById('templateGrid').innerHTML='<p class="library-loading" role="status">正在加载搜索目录…</p>';
          window.HAJIMI.ensureAllDepartments().then(()=>{searchLoading=false;if(location.pathname==='/bl'||location.pathname==='/bl/')render();}).catch(error=>{searchLoading=false;toast(error.message);});
          return;
        }
        if(state.q.trim()||state.stage!=='all'||state.type!=='all')renderSearchResults(null);
        else renderDepartmentRoot();
        return;
      }
      currentDept=r.department||currentDept;
      if(!currentDept){renderDepartmentRoot();return;}
      if(state.group==='all'&&!state.q.trim()&&state.stage==='all'&&state.type==='all'){renderDepartmentIndex();return;}
      if(state.group!=='all'){renderDisease();return;}
      renderSearchResults(currentDept);
    };

    const reset=document.getElementById('resetFilters');if(reset)reset.onclick=()=>{
      resetState();
      if(location.search){const url=new URL(location.href);url.searchParams.delete('q');history.replaceState(history.state||{},'',url.pathname+url.search+url.hash);}
      render();
    };

    // Rebuild the orthopedic drawer after all expansion scripts have loaded.
    // app.js renders the original trauma-only sidebar before later disease batches exist.
    const orthoDrawer=document.getElementById('sidebar');
    if(orthoDrawer){
      orthoDrawer.innerHTML=
        '<div class="mobile-drawer-shortcuts"><a href="/">⌂ 网站首页</a><a href="/bl">▤ 病历首页</a><a href="/ecg">心电图</a></div>'+
        '<div class="side-head">骨科疾病 / 术式</div>'+
        '<button class="nav-item active" type="button" data-ortho-route="__overview">骨科总览</button>'+
        orthoSections.map((section)=>{
          return '<div class="nav-label">'+section.title+'</div>'+
            section.items.map((g)=>'<button class="nav-item" type="button" data-ortho-route="'+encodeURIComponent(g)+'">'+labelFor(g)+'</button>').join('');
        }).join('');
      orthoDrawer.querySelectorAll('[data-ortho-route]').forEach((button)=>{
        button.onclick=()=>{
          const value=button.dataset.orthoRoute;
          if(value==='__overview')history.pushState({},'', '/bl/guke');
          else history.pushState({},'', '/bl/guke/'+value);
          finishNavigation();
        };
      });
    }

    const menu=document.getElementById('menuBtn'),sidebar=document.getElementById('sidebar'),mask=document.getElementById('drawerMask');
    if(menu&&sidebar&&mask){
      const setDrawer=(open)=>{
        sidebar.classList.toggle('open',open);
        mask.classList.toggle('show',open);
        document.body.classList.toggle('drawer-open',open);
        menu.setAttribute('aria-expanded',open?'true':'false');
        menu.setAttribute('aria-label',open?'关闭菜单':'打开菜单');
        mask.setAttribute('aria-hidden',open?'false':'true');
      };
      const close=()=>setDrawer(false);
      menu.setAttribute('aria-expanded','false');
      menu.onclick=()=>setDrawer(!sidebar.classList.contains('open'));
      mask.onclick=close;
      sidebar.addEventListener('click',(e)=>{if(e.target.closest('.nav-item')&&innerWidth<=900)close();});
      document.addEventListener('keydown',(e)=>{if(e.key==='Escape'&&sidebar.classList.contains('open'))close();});
      window.addEventListener('resize',()=>{if(innerWidth>900&&sidebar.classList.contains('open'))close();},{passive:true});
    }
    window.addEventListener('popstate',()=>{
      // Native category anchors also emit popstate. Keep their DOM and let
      // the browser scroll; rebuilding it interrupts fragment navigation.
      if(activeRoute===location.pathname+location.search&&document.querySelector('.ortho-jump'))return;
      applyRoute();
    });
    // hashchange follows native history scroll restoration. Align the category
    // after that step, including when returning from another category link.
    window.addEventListener('hashchange',scrollToOrthoCategory);
    window.addEventListener('hajimi:cms-ready',async()=>{const r=pathState(),path=location.pathname;if(r.page==='library'&&r.disease&&currentDept){try{if(window.HAJIMI)await window.HAJIMI.ensureGroup(r.department,r.disease);if(path===location.pathname)renderDisease();}catch(error){toast(error.message);}}});
    window.hajimiNavigateDepartment=navigateDepartment;
    window.hajimiNavigateRoot=navigateRoot;
    window.HAJIMI_LIBRARY_READY=true;
    document.getElementById('libraryShell').setAttribute('aria-busy','false');
    for(const id of ['searchInput','stageFilter','typeFilter'])document.getElementById(id).disabled=false;
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
