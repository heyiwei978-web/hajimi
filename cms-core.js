(function cmsMain(){
  const CMS={
    auth:false,user:null,
    data:{templateOverrides:{},cases:[]},
    activeTemplate:null,baseGenerate:null,baseOpenPreview:null
  };

  const esc=(s)=>String(s??'').replace(/[&<>"']/g,(c)=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));

  async function req(url,options={}){
    const r=await fetch(url,{
      credentials:'same-origin',
      ...options,
      headers:{
        'Content-Type':'application/json',
        'X-Hajimi-Admin':'1',
        ...(options.headers||{})
      }
    });
    const ct=r.headers.get('content-type')||'';
    const body=ct.includes('application/json')?await r.json():await r.text();
    if(!r.ok) throw new Error(body?.error||body||'请求失败');
    return body;
  }

  function notify(msg){
    if(typeof toast==='function') return toast(msg);
    const e=document.getElementById('portalToast');
    if(!e) return;
    e.textContent=msg;
    e.classList.add('show');
    clearTimeout(window.__cmsToast);
    window.__cmsToast=setTimeout(()=>e.classList.remove('show'),1600);
  }

  function makeDialogs(){
    if(document.getElementById('cmsLoginDialog')) return;
    document.body.insertAdjacentHTML('beforeend',`
      <dialog id="cmsLoginDialog" class="cms-dialog">
        <form id="cmsLoginForm">
          <div class="cms-dialog-head">
            <div><strong>开发者登录</strong><span>登录后才能修改模板、添加案例和图片</span></div>
            <button type="butt���q�^