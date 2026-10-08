(()=>{
  const categories=[
    {title:'关节置换 / 翻修',items:[
      ['全膝关节置换术','ready'],
      ['全髋关节置换术','planned'],
      ['人工股骨头置换术','planned']
    ]},
    {title:'成人创伤',items:[
      ['股骨颈骨折内固定','planned'],
      ['股骨转子间骨折','planned'],
      ['股骨干骨折','planned'],
      ['胫骨平台骨折','planned'],
      ['胫骨干骨折','planned'],
      ['Pilon骨折','planned'],
      ['三踝骨折','planned'],
      ['跟骨骨折','planned'],
      ['桡骨远端骨折','planned'],
      ['肱骨近端骨折','planned'],
      ['锁骨骨折','planned']
    ]},
    {title:'脊柱',items:[
      ['腰椎间盘突出症','planned'],
      ['腰椎管狭窄症','planned'],
      ['腰椎滑脱症','planned'],
      ['颈椎病','planned']
    ]},
    {title:'运动医学',items:[
      ['半月板损伤','planned'],
      ['前交叉韧带重建','planned']
    ]}
  ];

  const nav=document.getElementById('pathwayNav');
  if(nav){
    nav.innerHTML=categories.map((group)=>`
      <div class="pathway-nav-group">
        <span>${group.title}</span>
        ${group.items.map(([name,status])=>`
          <button type="button" class="pathway-nav-item ${status==='ready'?'active':''}" data-status="${status}" data-name="${name}">
            <span>${name}</span><small>${status==='ready'?'已完成':'规划中'}</small>
          </button>
        `).join('')}
      </div>
    `).join('');

    nav.querySelectorAll('.pathway-nav-item').forEach((button)=>{
      button.addEventListener('click',()=>{
        if(button.dataset.status==='ready'){
          document.getElementById('tkaPathway')?.scrollIntoView({behavior:'smooth',block:'start'});
          return;
        }
        showToast(button.dataset.name+'：已列入第一批路径，待TKA样板确认后继续扩展');
      });
    });
  }

  const jump=document.getElementById('jumpTka');
  if(jump)jump.addEventListener('click',()=>document.getElementById('tkaPathway')?.scrollIntoView({behavior:'smooth',block:'start'}));

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