(()=>{
  const categories=[
    {title:'关节置换 / 翻修',items:[
      {name:'全膝关节置换术',status:'ready',key:'tka',tag:'国家2023'},
      {name:'全髋关节置换术',status:'ready',key:'tha',tag:'国家2023'},
      {name:'人工股骨头置换术',status:'planned',tag:'规划中'},
      {name:'全踝关节置换术',status:'ready',key:'taa',tag:'国家2023'}
    ]},
    {title:'成人创伤',items:[
      {name:'股骨颈骨折内固定',status:'ready',key:'fnf',tag:'国家2023'},
      {name:'股骨转子间骨折',status:'ready',key:'intertroch',tag:'国家2023'},
      {name:'Pilon骨折',status:'ready',key:'pilon',tag:'国家2023'},
      {name:'三踝骨折',status:'ready',key:'trimalleolar',tag:'国家2023'},
      {name:'股骨干骨折',status:'planned',tag:'规划中'},
      {name:'胫骨平台骨折',status:'planned',tag:'规划中'},
      {name:'胫骨干骨折',status:'planned',tag:'规划中'},
      {name:'跟骨骨折',status:'planned',tag:'规划中'},
      {name:'桡骨远端骨折',status:'planned',tag:'规划中'},
      {name:'肱骨近端骨折',status:'planned',tag:'规划中'},
      {name:'锁骨骨折',status:'planned',tag:'规划中'}
    ]},
    {title:'脊柱',items:[
      {name:'椎体成形 / 后凸成形',status:'ready',key:'pvp',tag:'国家2023'},
      {name:'颈椎前路减压融合（ACDF）',status:'ready',key:'acdf',tag:'国家2023'},
      {name:'腰椎后路短节段减压融合',status:'ready',key:'lumbarFusion',tag:'国家2023'},
      {name:'腰椎间盘突出症',status:'planned',tag:'规划中'},
      {name:'腰椎管狭窄症（单纯减压）',status:'planned',tag:'规划中'}
    ]},
    {title:'骨肿瘤 / 重建',items:[
      {name:'肿瘤半髋 / 全髋置换',status:'ready',key:'tumorHip',tag:'国家2023'},
      {name:'肿瘤膝关节置换术',status:'ready',key:'tumorKnee',tag:'国家2023'}
    ]},
    {title:'运动医学',items:[
      {name:'半月板损伤',status:'planned',tag:'规划中'},
      {name:'前交叉韧带重建',status:'planned',tag:'规划中'}
    ]}
  ];

  const library=window.HAJIMI_OFFICIAL_PATHWAYS?.pathways||{};
  const renderOfficial=window.HAJIMI_OFFICIAL_PATHWAYS?.pathwayMarkup||null;
  const nav=document.getElementById('pathwayNav');
  const tka=document.getElementById('tkaPathway');
  const dynamic=document.getElementById('dynamicPathway');

  function setActive(button){
    nav?.querySelectorAll('.pathway-nav-item').forEach((item)=>item.classList.remove('active'));
    if(button)button.classList.add('active');
  }

  function setPathwayUrl(key){
    const url=new URL(location.href);
    if(!key||key==='tka')url.searchParams.delete('p');
    else url.searchParams.set('p',key);
    history.replaceState(history.state||{},'',url.pathname+url.search);
  }

  function showTka(button){
    setActive(button||nav?.querySelector('[data-key="tka"]'));
    setPathwayUrl('tka');
    if(tka)tka.hidden=false;
    if(dynamic){dynamic.hidden=true;dynamic.innerHTML='';}
    tka?.scrollIntoView({behavior:'smooth',block:'start'});
  }

  function showOfficial(key,button){
    const pathway=library[key];
    if(!pathway||!renderOfficial){
      showToast('该路径数据暂不可用');
      return;
    }
    setActive(button);
    setPathwayUrl(key);
    if(tka)tka.hidden=true;
    if(dynamic){
      dynamic.hidden=false;
      dynamic.innerHTML=renderOfficial(pathway);
      dynamic.querySelector('.dynamic-print-pathway')?.addEventListener('click',()=>window.print());
      dynamic.scrollIntoView({behavior:'smooth',block:'start'});
    }
  }

  if(nav){
    nav.innerHTML=categories.map((group)=>{
      return '<div class="pathway-nav-group"><span>'+group.title+'</span>'+
        group.items.map((item)=>{
          return '<button type="button" class="pathway-nav-item '+(item.status==='ready'?'is-ready ':'')+(item.key==='tka'?'active':'')+'" data-status="'+item.status+'" data-key="'+(item.key||'')+'" data-name="'+item.name+'"><span>'+item.name+'</span><small>'+item.tag+'</small></button>';
        }).join('')+
      '</div>';
    }).join('');

    nav.querySelectorAll('.pathway-nav-item').forEach((button)=>{
      button.addEventListener('click',()=>{
        if(button.dataset.status!=='ready'){
          showToast(button.dataset.name+'：已列入扩展计划，待国家路径批次完成后继续建设');
          return;
        }
        if(button.dataset.key==='tka')showTka(button);
        else showOfficial(button.dataset.key,button);
      });
    });
  }

  const initialKey=new URLSearchParams(location.search).get('p');
  if(initialKey&&library[initialKey]){
    const initialButton=nav?.querySelector('[data-key="'+initialKey+'"]');
    if(initialButton)showOfficial(initialKey,initialButton);
  }

  const jump=document.getElementById('jumpTka');
  if(jump)jump.addEventListener('click',()=>showTka());

  const print=document.getElementById('printPathway');
  if(print)print.addEventListener('click',()=>window.print());

  function showToast(message){
    const toast=document.getElementById('pathToast');
    if(!toast)return;
    toast.textContent=message;
    toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer=setTimeout(()=>toast.classList.remove('show'),2200);
  }
})();