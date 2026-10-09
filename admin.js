(function(){
  const loginPanel=document.getElementById('loginPanel'),dashboard=document.getElementById('dashboardPanel');
  const status=document.getElementById('adminStatus'),form=document.getElementById('adminLoginForm');
  const error=document.getElementById('adminLoginError'),dataError=document.getElementById('adminDataError');
  const historyStatus=document.getElementById('historyStatus'),historyList=document.getElementById('historyList');
  const downloadCurrent=document.getElementById('downloadCurrent');
  let content=null,revision=null,epoch=0;
  function notify(message){const toast=document.getElementById('adminToast');toast.textContent=message;toast.classList.add('show');clearTimeout(window.__adminToast);window.__adminToast=setTimeout(()=>toast.classList.remove('show'),2200);}
  async function json(url,options={}){
    const response=await fetch(url,{credentials:'same-origin',...options,headers:{'Content-Type':'application/json','X-Hajimi-Admin':'1',...(options.headers||{})}});
    const body=await response.json().catch(()=>({}));
    if(!response.ok){const failure=new Error(body.error||'请求失败');failure.status=response.status;throw failure;}
    return body;
  }
  function download(data,name){
    const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
    const link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  async function loadDashboard(){
    const generation=epoch;content=null;revision=null;downloadCurrent.disabled=true;dataError.hidden=true;
    historyList.replaceChildren();historyStatus.textContent='正在加载修改历史…';
    for(const id of ['overrideCount','caseCount'])document.getElementById(id).textContent='—';
    try{
      const [current,history]=await Promise.all([json('/api/content',{cache:'no-store'}),json('/api/content-history',{cache:'no-store'})]);
      if(generation!==epoch)return;
      if(current.revision!==history.revision)throw new Error('资料在加载期间发生更新，请点击刷新重试');
      content=current;revision=history.revision;downloadCurrent.disabled=false;
      document.getElementById('overrideCount').textContent=Object.keys(current.templateOverrides).length;
      document.getElementById('caseCount').textContent=current.cases.length;
      historyStatus.textContent=history.history.length?'共 '+history.history.length+' 个修改前备份':'暂无历史版本，首次修改前会自动创建备份。';
      for(const item of history.history){
        const row=document.createElement('article');row.className='admin-history-item';
        const copy=document.createElement('div'),title=document.createElement('strong'),detail=document.createElement('small');
        const date=new Date(item.createdAt).toLocaleString('zh-CN',{hour12:false});
        title.textContent=date+' · '+(item.action==='restore'?'恢复前备份':'修改前备份');
        detail.textContent=item.templateCount+' 份模板修改 · '+item.caseCount+' 个案例 · '+item.user;
        copy.append(title,detail);row.append(copy);
        const actions=document.createElement('div');actions.className='admin-history-actions';
        const exportButton=document.createElement('button');exportButton.type='button';exportButton.className='admin-secondary';exportButton.textContent='下载备份';
        exportButton.onclick=async()=>{exportButton.disabled=true;try{download(await json('/api/content-history?id='+encodeURIComponent(item.id)), 'hajimi-backup-'+item.id+'.json');}catch(ex){historyStatus.textContent=ex.message;}finally{exportButton.disabled=false;}};
        const restoreButton=document.createElement('button');restoreButton.type='button';restoreButton.className='admin-secondary';restoreButton.textContent='恢复此版本';
        restoreButton.onclick=async()=>{
          if(!confirm('将把网站模板与案例恢复至 '+date+'。当前资料会先自动备份。确认恢复？'))return;
          const buttons=[...document.querySelectorAll('.admin-backups button')];buttons.forEach(button=>button.disabled=true);
          try{await json('/api/content-history',{method:'POST',body:JSON.stringify({id:item.id,revision})});await loadDashboard();notify('已恢复历史版本，恢复前资料已自动备份');}
          catch(ex){await loadDashboard();historyStatus.textContent=ex.message;}
          finally{buttons.forEach(button=>button.disabled=false);downloadCurrent.disabled=!content;}
        };
        actions.append(exportButton,restoreButton);row.append(actions);historyList.append(row);
      }
    }catch(ex){if(generation!==epoch)return;dataError.textContent=ex.message;dataError.hidden=false;historyStatus.textContent='资料暂不可用，请点击刷新重试。';}
  }
  function showAuth(auth,user){
    epoch++;content=null;revision=null;historyList.replaceChildren();downloadCurrent.disabled=true;
    loginPanel.hidden=auth;dashboard.hidden=!auth;status.classList.toggle('online',auth);
    status.querySelector('strong').textContent=auth?'已登录 · '+(user||'admin'):'未登录管理后台';
    status.querySelector('small').textContent=auth?'可维护模板、案例和备份':'登录后显示管理工具';
    if(auth)loadDashboard();
  }
  document.getElementById('refreshHistory').onclick=loadDashboard;
  downloadCurrent.onclick=()=>{if(content)download({version:1,templateOverrides:content.templateOverrides,cases:content.cases},'hajimi-content-'+new Date().toISOString().slice(0,10)+'.json');};
  form.addEventListener('submit',async event=>{
    event.preventDefault();error.hidden=true;const button=form.querySelector('button[type=submit]');button.disabled=true;button.textContent='登录中…';
    try{const session=await json('/api/login',{method:'POST',body:JSON.stringify(Object.fromEntries(new FormData(form).entries()))});form.reset();showAuth(true,session.user);notify('已进入网站管理模式');}
    catch(ex){error.textContent=ex.message;error.hidden=false;}finally{button.disabled=false;button.textContent='登录管理后台';}
  });
  document.getElementById('adminLogout').onclick=async()=>{try{await json('/api/logout',{method:'POST',body:'{}'});showAuth(false);notify('已退出管理模式');}catch(ex){notify(ex.message);}};
  json('/api/session',{cache:'no-store'}).then(session=>showAuth(!!session.authenticated,session.user)).catch(()=>showAuth(false));
})();
