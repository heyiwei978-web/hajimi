(function cmsMain(){
  const CMS={auth:false,user:null,data:{templateOverrides:{},cases:[]},activeTemplate:null,baseGenerate:null,baseOpenPreview:null};
  const esc=(s)=>String(s??'').replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  async function req(url,options={}){
    const r=await fetch(url,{credentials:'same-origin',...options,headers:{'Content-Type':'application/json','X-Hajimi-Admin':'1',...(options.headers||{})}});
    const ct=r.headers.get('content-type')||'';
    const body=ct.includes('application/json')?await r.json():await r.text();
    if(!r.ok)throw new Error(body?.error||body||'请求失败');
    return body;
  }
  function notify(msg){
    if(typeof toast==='function')return toast(msg);
    const e=document.getElementById('portalToast');if(!e)return;
    e.textContent=msg;e.classList.add('show');clearTimeout(window.__cmsToast);window.__cmsToast=setTimeout(()=>e.classList.remove('show'),1600);
  }
  function makeDialogs(){
    if(document.getElementById('cmsLoginDialog'))return;
    document.body.insertAdjacentHTML('beforeend',`
      <dialog id="cmsLoginDialog" class="cms-dialog"><form id="cmsLoginForm">
        <div class="cms-dialog-head"><div><strong>开发者登录</strong><span>登录后才能修改模板、添加案例和图片</span></div><button type="button" class="cms-x" data-dialog-close aria-label="关闭">×</button></div>
        <label>用户名<input name="username" autocomplete="username" value="admin"></label>
        <label>密码<input name="password" type="password" autocomplete="current-password" required></label>
        <div id="cmsLoginError" class="cms-error" hidden></div>
        <div class="cms-actions"><button type="button" class="btn ghost" data-dialog-close>取消</button><button type="submit" class="btn primary">登录</button></div>
      </form></dialog>
      <dialog id="cmsEditDialog" class="cms-dialog cms-edit-dialog"><form id="cmsEditForm">
        <div class="cms-dialog-head"><div><strong>编辑模板正文</strong><span id="cmsEditTitle"></span></div><button type="button" class="cms-x" data-dialog-close aria-label="关闭">×</button></div>
        <textarea id="cmsEditBody" rows="24"></textarea>
        <div class="cms-actions"><button type="button" id="cmsRestoreDefault" class="btn ghost">恢复默认</button><span class="cms-spacer"></span><button type="button" class="btn ghost" data-dialog-close>取消</button><button type="submit" class="btn primary">保存修改</button></div>
      </form></dialog>
      <dialog id="cmsCaseDialog" class="cms-dialog"><form id="cmsCaseForm">
        <div class="cms-dialog-head"><div><strong id="cmsCaseDialogTitle">添加案例</strong><span>案例可在浏览模式中展示</span></div><button type="button" class="cms-x" data-dialog-close aria-label="关闭">×</button></div>
        <input type="hidden" name="caseId">
        <label>案例标题<input name="title" placeholder="例如：术后第3天切口及DR复查" required></label>
        <label>说明<textarea name="description" rows="5" placeholder="填写经过脱敏的案例说明"></textarea></label>
        <label>添加图片<input name="images" type="file" accept="image/jpeg,image/png,image/webp" multiple></label>
        <label class="cms-check"><input name="published" type="checkbox" checked> 浏览者可见</label>
        <div class="cms-privacy">上传前必须完成脱敏：去除姓名、住院号、身份证号、手机号、二维码、DICOM文字层及其他可识别信息。网页图片仅用于学习和案例展示，不替代原始诊断影像。</div>
        <div class="cms-actions"><button type="button" class="btn ghost" data-dialog-close>取消</button><button type="submit" class="btn primary" id="cmsCaseSave">保存案例</button></div>
      </form></dialog>`);
  }
  function installDialogCloseHandlers(){
    document.querySelectorAll('[data-dialog-close],#patientDialog [data-close-dialog]').forEach((btn)=>btn.addEventListener('click',()=>{const d=btn.closest('dialog');if(d)d.close();}));
    document.querySelectorAll('.cms-dialog').forEach((dialog)=>dialog.addEventListener('click',(e)=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();const inside=e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom;if(!inside)dialog.close();}));
  }
  function installAuthSlots(){
    document.querySelectorAll('[data-auth-slot]').forEach((slot)=>{
      slot.classList.add('cms-auth-slot');
      slot.innerHTML='<button type="button" class="cms-login-btn" data-cms-login>登录</button><span class="cms-admin-badge" data-cms-badge hidden>开发者模式</span><button type="button" class="cms-logout-btn" data-cms-logout hidden>退出</button>';
    });
    document.querySelectorAll('[data-cms-login]').forEach((b)=>b.addEventListener('click',()=>document.getElementById('cmsLoginDialog').showModal()));
    document.querySelectorAll('[data-cms-logout]').forEach((b)=>b.addEventListener('click',logout));
    syncAuthUI();
  }
  function syncAuthUI(){
    document.body.classList.toggle('cms-admin-mode',CMS.auth);
    document.querySelectorAll('[data-cms-login]').forEach((e)=>e.hidden=CMS.auth);
    document.querySelectorAll('[data-cms-badge]').forEach((e)=>{e.hidden=!CMS.auth;e.textContent=CMS.auth?'开发者模式':'';});
    document.querySelectorAll('[data-cms-logout]').forEach((e)=>e.hidden=!CMS.auth);
  }
  async function login(e){
    e.preventDefault();const f=e.currentTarget,err=document.getElementById('cmsLoginError');err.hidden=true;
    try{
      const d=Object.fromEntries(new FormData(f).entries());const s=await req('/api/login',{method:'POST',body:JSON.stringify(d)});
      CMS.auth=true;CMS.user=s.user||'admin';syncAuthUI();document.getElementById('cmsLoginDialog').close();f.reset();notify('已进入开发者模式');if(CMS.activeTemplate)renderExtras(CMS.activeTemplate);
    }catch(ex){err.textContent=ex.message;err.hidden=false;}
  }
  async function logout(){
    try{await req('/api/logout',{method:'POST',body:'{}'});}catch{}
    CMS.auth=false;CMS.user=null;syncAuthUI();notify('已退出开发者模式');if(CMS.activeTemplate)renderExtras(CMS.activeTemplate);
  }
  function patchTemplates(){
    if(typeof generate!=='function'||typeof openPreview!=='function')return;
    if(!CMS.baseGenerate){CMS.baseGenerate=generate;generate=function(t){const o=CMS.data.templateOverrides[t.name];return o&&o.body?o.body:CMS.baseGenerate(t);};}
    if(!CMS.baseOpenPreview){CMS.baseOpenPreview=openPreview;openPreview=function(t){CMS.activeTemplate=t;CMS.baseOpenPreview(t);renderExtras(t);};}
  }
  async function saveContent(){
    const out=await req('/api/content',{method:'PUT',body:JSON.stringify(CMS.data)});
    CMS.data={templateOverrides:out.templateOverrides||{},cases:out.cases||[]};
  }
  function renderExtras(t){
    const dlg=document.getElementById('previewDialog');if(!dlg)return;
    dlg.querySelectorAll('.cms-preview-admin,#cmsCases').forEach((e)=>e.remove());
    if(CMS.auth){
      const tools=dlg.querySelector('.preview-tools');
      if(tools){
        tools.insertAdjacentHTML('beforeend','<span class="cms-preview-admin"><button class="btn ghost" id="cmsEditTemplate">编辑正文</button><button class="btn ghost" id="cmsAddCase">添加案例/图片</button></span>');
        document.getElementById('cmsEditTemplate').onclick=()=>openTemplateEditor(t);
        document.getElementById('cmsAddCase').onclick=()=>openCaseEditor(t,null);
      }
    }
    const cases=CMS.data.cases.filter((c)=>c.template===t.name&&(CMS.auth||c.published!==false));if(!cases.length)return;
    const cards=cases.map((c)=>{
      const images=(c.images||[]).map((p)=>'<a href="/api/image?path='+encodeURIComponent(p)+'" target="_blank" rel="noopener"><img src="/api/image?path='+encodeURIComponent(p)+'" loading="lazy" alt="'+esc(c.title||'案例图片')+'"></a>').join('');
      const admin=CMS.auth?'<div class="cms-case-admin"><button data-edit-case="'+esc(c.id)+'">编辑</button><button data-delete-case="'+esc(c.id)+'">删除</button></div>':'';
      return '<article class="cms-case-card"><div class="cms-case-head"><div><strong>'+esc(c.title||'案例')+'</strong><span>'+esc(new Date(c.updatedAt||c.createdAt||Date.now()).toLocaleDateString())+'</span></div>'+admin+'</div>'+(c.description?'<p>'+esc(c.description).replace(/\n/g,'<br>')+'</p>':'')+(images?'<div class="cms-case-images">'+images+'</div>':'')+'</article>';
    }).join('');
    const preview=document.getElementById('previewContent');
    preview.insertAdjacentHTML('afterend','<section id="cmsCases" class="cms-cases"><div class="cms-cases-title"><strong>案例资料</strong><span>已脱敏内容</span></div>'+cards+'</section>');
    if(CMS.auth){
      dlg.querySelectorAll('[data-delete-case]').forEach((b)=>b.onclick=()=>deleteCase(b.dataset.deleteCase,t));
      dlg.querySelectorAll('[data-edit-case]').forEach((b)=>b.onclick=()=>openCaseEditor(t,CMS.data.cases.find((c)=>c.id===b.dataset.editCase)));
    }
  }
  function openTemplateEditor(t){
    document.getElementById('cmsEditTitle').textContent=t.name;document.getElementById('cmsEditBody').value=generate(t);
    const dialog=document.getElementById('cmsEditDialog');dialog.showModal();
    const form=document.getElementById('cmsEditForm');
    form.onsubmit=async(e)=>{e.preventDefault();CMS.data.templateOverrides[t.name]={body:document.getElementById('cmsEditBody').value,updatedAt:new Date().toISOString()};await saveContent();dialog.close();document.getElementById('previewContent').textContent=generate(t);renderExtras(t);notify('模板已更新');};
    document.getElementById('cmsRestoreDefault').onclick=async()=>{if(!confirm('恢复为系统默认模板？'))return;delete CMS.data.templateOverrides[t.name];await saveContent();document.getElementById('cmsEditBody').value=CMS.baseGenerate(t);document.getElementById('previewContent').textContent=generate(t);renderExtras(t);notify('已恢复默认模板');};
  }
  function openCaseEditor(t,c){
    const f=document.getElementById('cmsCaseForm');f.reset();f.elements.caseId.value=c?.id||'';f.elements.title.value=c?.title||'';f.elements.description.value=c?.description||'';f.elements.published.checked=c?c.published!==false:true;
    document.getElementById('cmsCaseDialogTitle').textContent=c?'编辑案例':'添加案例';
    const dialog=document.getElementById('cmsCaseDialog');dialog.showModal();
    f.onsubmit=async(e)=>{
      e.preventDefault();const btn=document.getElementById('cmsCaseSave');btn.disabled=true;btn.textContent='保存中…';
      try{
        let images=c?.images?[...c.images]:[];for(const file of [...f.elements.images.files]){const prepared=await prepareImage(file);const u=await req('/api/upload',{method:'POST',body:JSON.stringify(prepared)});images.push(u.pathname);}
        const now=new Date().toISOString(),id=c?.id||('case_'+Date.now().toString(36)+Math.random().toString(36).slice(2,7));
        const item={id,template:t.name,title:f.elements.title.value.trim(),description:f.elements.description.value.trim(),images,published:f.elements.published.checked,createdAt:c?.createdAt||now,updatedAt:now};
        const i=CMS.data.cases.findIndex((x)=>x.id===id);if(i>=0)CMS.data.cases[i]=item;else CMS.data.cases.push(item);
        await saveContent();dialog.close();renderExtras(t);notify('案例已保存');
      }catch(ex){alert('保存失败：'+ex.message);}finally{btn.disabled=false;btn.textContent='保存案例';}
    };
  }
  async function deleteCase(id,t){if(!confirm('删除这个案例？'))return;CMS.data.cases=CMS.data.cases.filter((c)=>c.id!==id);await saveContent();renderExtras(t);notify('案例已删除');}
  async function prepareImage(file){
    if(!/^image\/(jpeg|png|webp)$/.test(file.type))throw new Error('仅支持 JPG、PNG、WebP');
    const img=await createImageBitmap(file);let w=img.width,h=img.height,max=1800;if(Math.max(w,h)>max){const ratio=max/Math.max(w,h);w=Math.round(w*ratio);h=Math.round(h*ratio);}
    const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;canvas.getContext('2d').drawImage(img,0,0,w,h);if(img.close)img.close();
    let blob=await new Promise((resolve)=>canvas.toBlob(resolve,'image/jpeg',0.88));if(blob.size>3000000)blob=await new Promise((resolve)=>canvas.toBlob(resolve,'image/jpeg',0.72));
    const data=await new Promise((resolve,reject)=>{const fr=new FileReader();fr.onload=()=>resolve(String(fr.result).split(',')[1]);fr.onerror=reject;fr.readAsDataURL(blob);});
    return {name:file.name.replace(/\.[^.]+$/,'')+'.jpg',type:'image/jpeg',data};
  }
  async function init(){
    makeDialogs();installDialogCloseHandlers();installAuthSlots();document.getElementById('cmsLoginForm').addEventListener('submit',login);
    try{const s=await fetch('/api/session',{credentials:'same-origin'}).then((r)=>r.json());CMS.auth=!!s.authenticated;CMS.user=s.user||null;}catch{}
    try{const c=await fetch('/api/content',{credentials:'same-origin',cache:'no-store'}).then((r)=>r.json());CMS.data={templateOverrides:c.templateOverrides||{},cases:c.cases||[]};}catch{}
    syncAuthUI();patchTemplates();
    window.dispatchEvent(new CustomEvent('hajimi:cms-ready'));
  }
  init();
})();