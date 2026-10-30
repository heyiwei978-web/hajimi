(function cmsMain(){
  const CMS={dataReady:false,auth:false,user:null,data:{templateOverrides:{},cases:[]},activeTemplate:null,baseGenerate:null,baseOpenPreview:null};
  const esc=(s)=>String(s??'').replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  async function req(url,options={}){
    const r=await fetch(url,{credentials:'same-origin',...options,headers:{'Content-Type':'application/json','X-Hajimi-Admin':'1',...(options.headers||{})}});
    const ct=r.headers.get('content-type')||'';
    const body=ct.includes('application/json')?await r.json():await r.text();
    if(!r.ok){const error=new Error(body?.error||body||'请求失败');error.status=r.status;throw error;}
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
      <dialog id="cmsLoginDialog" class="cms-dialog" aria-labelledby="cmsLoginTitle"><form id="cmsLoginForm">
        <div class="cms-dialog-head"><div><strong id="cmsLoginTitle">开发者登录</strong><span>登录后才能修改模板、添加案例和图片</span></div><button type="button" class="cms-x" data-dialog-close aria-label="关闭">×</button></div>
        <label>用户名<input name="username" autocomplete="username" value="admin"></label>
        <label>密码<input name="password" type="password" autocomplete="current-password" required></label>
        <div id="cmsLoginError" class="cms-error" role="alert" hidden></div>
        <div class="cms-actions"><button type="button" class="btn ghost" data-dialog-close>取消</button><button type="submit" class="btn primary">登录</button></div>
      </form></dialog>
      <dialog id="cmsEditDialog" class="cms-dialog cms-edit-dialog" aria-labelledby="cmsEditDialogTitle"><form id="cmsEditForm">
        <div class="cms-dialog-head"><div><strong id="cmsEditDialogTitle">编辑模板正文</strong><span id="cmsEditTitle"></span></div><button type="button" class="cms-x" data-dialog-close aria-label="关闭">×</button></div>
        <textarea id="cmsEditBody" rows="24"></textarea><p id="cmsEditError" class="cms-error" role="alert" hidden></p>
        <div class="cms-actions"><button type="button" id="cmsRestoreDefault" class="btn ghost">恢复默认</button><span class="cms-spacer"></span><button type="button" class="btn ghost" data-dialog-close>取消</button><button type="submit" class="btn primary">保存修改</button></div>
      </form></dialog>
      <dialog id="cmsCaseDialog" class="cms-dialog" aria-labelledby="cmsCaseDialogTitle"><form id="cmsCaseForm">
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
      CMS.auth=true;CMS.user=s.user||'admin';CMS.dataReady=false;
      CMS.data=await req('/api/content',{cache:'no-store'});CMS.dataReady=true;
      syncAuthUI();document.getElementById('cmsLoginDialog').close();f.reset();notify('已进入开发者模式');if(CMS.activeTemplate)renderExtras(CMS.activeTemplate);
    }catch(ex){err.textContent=ex.message;err.hidden=false;}
  }
  async function logout(){
    try{await req('/api/logout',{method:'POST',body:'{}'});}catch(ex){notify('退出失败：'+ex.message);return;}
    CMS.auth=false;CMS.user=null;CMS.data.cases=CMS.data.cases.filter(item=>item.published!==false);
    for(const id of ['cmsEditDialog','cmsCaseDialog'])document.getElementById(id)?.close();
    const editForm=document.getElementById('cmsEditForm'),caseForm=document.getElementById('cmsCaseForm');editForm.reset();caseForm.reset();editForm.onsubmit=null;caseForm.onsubmit=null;
    document.getElementById('cmsEditTitle').textContent='';document.getElementById('cmsEditBody').value='';
    syncAuthUI();notify('已退出开发者模式');if(CMS.activeTemplate)renderExtras(CMS.activeTemplate);
  }
  // A saved admin override takes precedence over compiled JSON. Normalize its copy text too.
  // This changes the preview/copy presentation only; the original editable draft is kept intact.
  function normalizeClinicalOverride(t,body){
    let s=String(body||'').replace(/\r\n?/g,'\n');
    if(t.department!=='骨科')return s;
    const isOperation=/手术记录/.test(t.short||'')&&(t.type==='手术记录'||t.short==='手术记录'||t.short==='完整手术记录');
    const isCourse=/病程|查房/.test(t.short||'')&&!/手术记录|讨论|知情同意|出院小结/.test(t.short||'');
    if(isOperation){
      const i=s.search(/手术经过[：:]/);if(i<0)return s;
      const before=s.slice(0,i),remain=s.slice(i).replace(/^手术经过[：:]\s*/,'');
      const end=/\n\s*(?:术后计划|术后医嘱|术后处理|术者签名|手术者签名)[：:]/.exec(remain);
      const operative=end?remain.slice(0,end.index):remain;
      const tail=end?remain.slice(end.index).trim():'';
      const lines=operative.split('\n').map(v=>v.trim()).filter(Boolean),steps=[],heading=[];
      for(const line of lines){
        const m=line.match(/^\d{1,2}[.、．]\s*(.+)$/);
        if(m)steps.push(m[1]);
        else if(steps.length)steps[steps.length-1]+=' '+line;
        else heading.push(line);
      }
      if(steps.length<4)return s;
      const blocks=[[],[],[],[]];
      heading.forEach(v=>blocks[0].push(v));
      steps.forEach((v,index)=>blocks[Math.min(3,Math.floor(index*4/steps.length))].push(v));
      return before+'手术经过：\n'+blocks.map(v=>v.join('')).filter(Boolean).join('\n\n')+(tail?'\n\n'+tail:'');
    }
    if(isCourse){
      const lines=s.split('\n'),head=[],bodyLines=[];
      const header=/^(记录名称|记录时间|患者|患者信息|主诊断|主要诊断|住院号|入院日期|手术日期|出院日期)[：:]/;
      let bodyStarted=false;
      for(const line of lines){
        if(!bodyStarted&&(header.test(line.trim())||(!line.trim()&&head.length))){
          if(line.trim())head.push(line.trim());
        }else{bodyStarted=true;if(line.trim())bodyLines.push(line.trim());}
      }
      const role=/主任医师/.test(t.short)?'主任医师':/主治医师/.test(t.short)?'主治医师':/主刀医师/.test(t.short)?'主刀医师':'';
      const namePattern=/[赵钱孙李周吴郑王冯陈褚卫蒋沈韩杨朱秦许何吕施张孔曹严华金魏陶姜戚谢邹喻柏水窦章云苏潘葛范彭郎鲁韦昌马苗凤花方俞任袁柳唐罗薛伍余米贝姚孟顾尹江钟汪田石董梁宋杜肖贺耿][\u4e00-\u9fa5]{1,2}(主任医师|主治医师)(?=查房|指出|指示|认为|分析|意见|：|:)/g;
      const prose=bodyLines.filter(x=>!/^((主任|主治|主刀)医师)(?:签名)?[：:]/.test(x)).join(' ').replace(namePattern,'________$1');
      return (head.length?head.join('\n')+'\n\n':'')+prose+(role?'\n\n'+role+'：________':'');
    }
    return s;
  }
  function patchTemplates(){
    if(typeof generate!=='function'||typeof openPreview!=='function')return;
    if(!CMS.baseGenerate){
      CMS.baseGenerate=generate;
      generate=function(t){
        const o=CMS.data.templateOverrides[t.name];
        return o&&o.body?normalizeClinicalOverride(t,o.body):CMS.baseGenerate(t);
      };
    }
    if(!CMS.baseOpenPreview){CMS.baseOpenPreview=openPreview;openPreview=function(t){CMS.activeTemplate=t;CMS.baseOpenPreview(t);renderExtras(t);};}
  }
  async function saveContent(next){
    if(!CMS.dataReady)throw new Error('内容未加载完成，请刷新页面后重试');
    const out=await req('/api/content',{method:'PUT',body:JSON.stringify({...next,revision:CMS.data.revision})});
    CMS.data=out;
  }
  function renderExtras(t){
    const dlg=document.getElementById('previewDialog');if(!dlg)return;
    dlg.querySelectorAll('.cms-preview-admin,#cmsCases').forEach((e)=>e.remove());
    if(CMS.auth&&CMS.dataReady){
      const tools=dlg.querySelector('.preview-tools');
      if(tools){
        tools.insertAdjacentHTML('beforeend','<span class="cms-preview-admin"><button class="btn ghost" id="cmsEditTemplate">编辑正文</button><button class="btn ghost" id="cmsAddCase">添加案例/图片</button></span>');
        document.getElementById('cmsEditTemplate').onclick=()=>openTemplateEditor(t);
        document.getElementById('cmsAddCase').onclick=()=>openCaseEditor(t,null);
      }
    }
    const cases=CMS.data.cases.filter((c)=>c.template===t.name&&(CMS.auth||c.published!==false));if(!cases.length)return;
    const cards=cases.map((c)=>{
      const images=(c.images||[]).map((p)=>'<a href="/api/image?path='+encodeURIComponent(p)+'" target="_blank" rel="noopener"><img src="/api/image?path='+encodeURIComponent(p)+'" loading="lazy" decoding="async" alt="'+esc(c.title||'案例图片')+'"></a>').join('');
      const admin=CMS.auth?'<div class="cms-case-admin"><button aria-label="编辑：'+esc(c.title||'案例')+'" data-edit-case="'+esc(c.id)+'">编辑</button><button aria-label="删除：'+esc(c.title||'案例')+'" data-delete-case="'+esc(c.id)+'">删除</button></div>':'';
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
    const error=document.getElementById('cmsEditError');error.hidden=true;
    const run=async(operation)=>{
      const buttons=[...form.querySelectorAll('button')];buttons.forEach(button=>button.disabled=true);error.hidden=true;
      try{await operation();}catch(ex){error.textContent=ex.message;error.hidden=false;}finally{buttons.forEach(button=>button.disabled=false);}
    };
    form.onsubmit=async(e)=>{e.preventDefault();await run(async()=>{
      const overrides={...CMS.data.templateOverrides,[t.name]:{body:document.getElementById('cmsEditBody').value,updatedAt:new Date().toISOString()}};
      await saveContent({...CMS.data,templateOverrides:overrides});dialog.close();document.getElementById('previewContent').textContent=generate(t);renderExtras(t);notify('模板已更新，修改前资料已备份');
    });};
    document.getElementById('cmsRestoreDefault').onclick=async()=>{if(!confirm('恢复为系统默认模板？修改前资料会自动备份。'))return;await run(async()=>{
      const overrides={...CMS.data.templateOverrides};delete overrides[t.name];await saveContent({...CMS.data,templateOverrides:overrides});
      document.getElementById('cmsEditBody').value=CMS.baseGenerate(t);document.getElementById('previewContent').textContent=generate(t);renderExtras(t);notify('已恢复默认模板');
    });};
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
        const cases=[...CMS.data.cases],i=cases.findIndex((x)=>x.id===id);if(i>=0)cases[i]=item;else cases.push(item);
        await saveContent({...CMS.data,cases});dialog.close();renderExtras(t);notify('案例已保存，修改前资料已备份');
      }catch(ex){alert('保存失败：'+ex.message);}finally{btn.disabled=false;btn.textContent='保存案例';}
    };
  }
  async function deleteCase(id,t){if(!confirm('删除这个案例？修改前资料会自动备份。'))return;try{await saveContent({...CMS.data,cases:CMS.data.cases.filter((c)=>c.id!==id)});renderExtras(t);notify('案例已删除');}catch(ex){notify(ex.message);}}
  async function prepareImage(file){
    return window.HAJIMI_IMAGE.prepare(file);
  }
  async function init(){
    makeDialogs();installDialogCloseHandlers();installAuthSlots();document.getElementById('cmsLoginForm').addEventListener('submit',login);
    const [session,content]=await Promise.allSettled([
      req('/api/session',{cache:'no-store'}),req('/api/content',{cache:'no-store'})
    ]);
    if(session.status==='fulfilled'){CMS.auth=!!session.value.authenticated;CMS.user=session.value.user||null;}
    if(content.status==='fulfilled'){CMS.data=content.value;CMS.dataReady=true;}
    else notify('资料加载失败，请刷新页面后重试');
    syncAuthUI();patchTemplates();
    if(typeof state!=='undefined'&&state.activeTemplate&&document.getElementById('previewDialog')?.open){
      CMS.activeTemplate=state.activeTemplate;document.getElementById('previewContent').textContent=generate(state.activeTemplate);renderExtras(state.activeTemplate);
    }
    window.dispatchEvent(new CustomEvent('hajimi:cms-ready'));
  }
  init();
})();
