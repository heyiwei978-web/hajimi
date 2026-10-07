(function(){
  const loginPanel=document.getElementById('loginPanel');
  const dashboard=document.getElementById('dashboardPanel');
  const status=document.getElementById('adminStatus');
  const form=document.getElementById('adminLoginForm');
  const err=document.getElementById('adminLoginError');
  const toast=document.getElementById('adminToast');
  function notify(msg){if(!toast)return;toast.textContent=msg;toast.classList.add('show');clearTimeout(window.__adminToast);window.__adminToast=setTimeout(()=>toast.classList.remove('show'),1800);}
  async function json(url,options={}){const r=await fetch(url,{credentials:'same-origin',...options,headers:{'Content-Type':'application/json','X-Hajimi-Admin':'1',...(options.headers||{})}});const body=await r.json().catch(()=>({}));if(!r.ok)throw new Error(body.error||'请求失败');return body;}
  async function loadDashboard(){
    const c=await fetch('/api/content',{credentials:'same-origin',cache:'no-store'}).then(r=>r.json()).catch(()=>({}));
    document.getElementById('overrideCount').textContent=Object.keys(c.templateOverrides||{}).length;
    document.getElementById('caseCount').textContent=(c.cases||[]).length;
  }
  function showAuth(auth,user){
    loginPanel.hidden=auth;dashboard.hidden=!auth;status.classList.toggle('online',auth);
    status.querySelector('strong').textContent=auth?'已登录 · '+(user||'admin'):'未登录管理后台';
    status.querySelector('small').textContent=auth?'可直接维护现有正式网站':'登录后显示管理工具';
    if(auth)loadDashboard();
  }
  async function init(){
    try{const s=await fetch('/api/session',{credentials:'same-origin',cache:'no-store'}).then(r=>r.json());showAuth(!!s.authenticated,s.user);}
    catch{showAuth(false,null);}
  }
  form.addEventListener('submit',async(e)=>{
    e.preventDefault();err.hidden=true;const btn=form.querySelector('button[type=submit]');btn.disabled=true;btn.textContent='登录中…';
    try{const d=Object.fromEntries(new FormData(form).entries());const s=await json('/api/login',{method:'POST',body:JSON.stringify(d)});form.reset();showAuth(true,s.user||'admin');notify('已进入网站管理模式');}
    catch(ex){err.textContent=ex.message;err.hidden=false;}
    finally{btn.disabled=false;btn.textContent='登录管理后台';}
  });
  document.getElementById('adminLogout').addEventListener('click',async()=>{try{await json('/api/logout',{method:'POST',body:'{}'});}catch{}showAuth(false,null);notify('已退出管理模式');});
  init();
})();