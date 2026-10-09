(() => {
  const controls=document.getElementById('managerControls'),kind=document.getElementById('managerKind'),search=document.getElementById('managerSearch'),publish=document.getElementById('managerPublish'),list=document.getElementById('managerList'),summary=document.getElementById('managerSummary'),error=document.getElementById('managerError'),more=document.getElementById('managerMore');
  const templateDialog=document.getElementById('managedTemplateDialog'),templateForm=document.getElementById('managedTemplateForm'),caseDialog=document.getElementById('managedCaseDialog'),caseForm=document.getElementById('managedCaseForm');
  let current=null,hooks=null,limit=50,busy=false,generation=0,editor=null;
  const node=(tag,text,className)=>{const element=document.createElement(tag);if(text!==undefined)element.textContent=text;if(className)element.className=className;return element;};
  const validImage=path=>typeof path==='string'&&/^cases\/[A-Za-z0-9_/-]+\.(?:jpe?g|png|webp)$/.test(path)&&!path.includes('..');
  const imageURL=path=>'/api/image?path='+encodeURIComponent(path);
  const images=item=>Array.isArray(item.images)?item.images:[];
  const date=value=>value&&Number.isFinite(Date.parse(value))?new Date(value).toLocaleString('zh-CN',{hour12:false}):'未记录时间';
  function button(text,action){const element=node('button',text,'admin-secondary');element.type='button';element.onclick=action;element.disabled=busy;return element;}
  function download(data,name){const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),link=node('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  function showError(target,failure){target.textContent=failure.message+(failure.status===409?(target===error?' 请刷新资料，核对后再操作。':' 请下载本次草稿，关闭编辑并刷新，再核对后重新保存。'):'');target.hidden=false;}
  async function run(operation,target=error){
    if(busy)return;busy=true;target.hidden=true;const stamp=generation;
    document.querySelectorAll('.admin-manager button,.manager-dialog button,.manager-dialog input,.manager-dialog textarea').forEach(element=>element.disabled=true);controls.disabled=true;
    try{await operation(stamp);}catch(failure){if(stamp===generation)showError(target,failure);}
    finally{busy=false;document.querySelectorAll('.admin-manager button,.manager-dialog button,.manager-dialog input,.manager-dialog textarea').forEach(element=>element.disabled=false);controls.disabled=!current;}
  }
  function saved(data,stamp,message){
    if(stamp!==generation)return;current=data;editor=null;templateDialog.close();caseDialog.close();render();hooks.notify(message+'，修改前资料已备份');hooks.refresh();
  }
  function imageIndex(){
    const result=new Map();for(const item of current.cases)for(const path of images(item)){
      if(!validImage(path))continue;if(!result.has(path))result.set(path,{path,owners:[]});const entry=result.get(path);if(!entry.owners.some(owner=>owner.id===item.id))entry.owners.push(item);
    }return [...result.values()];
  }
  function templateRow([name,value]){
    const row=node('article',undefined,'manager-item'),copy=node('div',undefined,'manager-item-copy');copy.append(node('h3',name),node('p','自定义正文 '+value.body.length+' 字 · '+date(value.updatedAt)));row.append(copy);
    const actions=node('div',undefined,'manager-actions');actions.append(button('编辑正文',()=>editTemplate(name)),button('恢复默认',()=>{
      if(!confirm('恢复“'+name+'”的系统默认正文？修改前资料会自动备份。'))return;const base=current,overrides={...base.templateOverrides};delete overrides[name];run(async stamp=>saved(await hooks.save({...base,templateOverrides:overrides},base.revision),stamp,'已恢复默认正文'));
    }));row.append(actions);return row;
  }
  function caseRow(item){
    const row=node('article',undefined,'manager-item'),copy=node('div',undefined,'manager-item-copy');copy.append(node('h3',item.title||'未命名案例'),node('p',item.template),node('p',(item.published===false?'未发布':'浏览者可见')+' · '+images(item).length+' 张图片 · '+date(item.updatedAt||item.createdAt)));row.append(copy);
    const actions=node('div',undefined,'manager-actions');actions.append(button('编辑案例',()=>editCase(item)),button('删除案例',()=>{
      if(!confirm('删除“'+(item.title||'此案例')+'”？修改前资料会自动备份，图片文件会保留。'))return;const base=current;run(async stamp=>saved(await hooks.save({...base,cases:base.cases.filter(value=>value.id!==item.id)},base.revision),stamp,'案例已删除'));
    }));row.append(actions);return row;
  }
  function imageRow(item){
    const row=node('article',undefined,'manager-item manager-image-item'),link=node('a');link.href=imageURL(item.path);link.target='_blank';link.rel='noopener';link.setAttribute('aria-label','打开案例图片');
    const image=node('img');image.src=imageURL(item.path);image.alt=item.owners[0].title||'案例图片';image.loading='lazy';image.decoding='async';link.append(image);row.append(link);
    const copy=node('div',undefined,'manager-item-copy');copy.append(node('h3',item.path),node('p',item.owners.length+' 个案例引用此图片'));for(const owner of item.owners)copy.append(button((owner.title||'未命名案例')+' · 管理引用',()=>editCase(owner)));row.append(copy);return row;
  }
  function render(){
    list.replaceChildren();more.hidden=true;document.getElementById('managerPublishLabel').hidden=kind.value!=='cases';controls.disabled=!current||busy;
    if(!current){summary.textContent='资料尚未加载完成，请使用备份区的刷新按钮重试。';return;}
    const query=search.value.trim().toLocaleLowerCase();let values,makeRow;
    if(kind.value==='templates'){values=Object.entries(current.templateOverrides).filter(([name])=>name.toLocaleLowerCase().includes(query));makeRow=templateRow;}
    else if(kind.value==='cases'){values=current.cases.filter(item=>(publish.value==='all'||(publish.value==='draft'?item.published===false:item.published!==false))&&[item.title,item.template,item.description].join(' ').toLocaleLowerCase().includes(query));makeRow=caseRow;}
    else{values=imageIndex().filter(item=>[item.path,...item.owners.flatMap(owner=>[owner.title,owner.template])].join(' ').toLocaleLowerCase().includes(query));makeRow=imageRow;}
    const shown=values.slice(0,limit);summary.textContent='共 '+values.length+' 项，显示 '+shown.length+' 项'+(kind.value==='images'?'。图片引用可在所属案例中维护。':'');
    if(!shown.length)list.append(node('p',query?'没有找到匹配资料，请调整搜索条件。':'暂无此类资料。新增内容可从病历库选择模板后添加。','manager-empty'));else shown.forEach(value=>list.append(makeRow(value)));
    more.hidden=limit>=values.length;more.onclick=()=>{limit+=50;render();};
  }
  function editTemplate(name){
    const base=current;editor={mode:'template',base,name};document.getElementById('managedTemplateName').textContent=name;document.getElementById('managedTemplateBody').value=base.templateOverrides[name].body;document.getElementById('managedTemplateError').hidden=true;templateDialog.showModal();
  }
  function renderCaseImages(){
    const mount=document.getElementById('managedCaseImages');mount.replaceChildren();
    for(const [index,path]of editor.paths.entries()){
      const row=node('div',undefined,'manager-edit-image');if(validImage(path)){const image=node('img');image.src=imageURL(path);image.alt='现有案例图片 '+(index+1);image.loading='lazy';row.append(image);}else row.append(node('span','无法预览的旧图片引用'));
      row.append(button('移除引用',()=>{editor.paths.splice(index,1);renderCaseImages();}));mount.append(row);
    }
  }
  function editCase(item){
    editor={mode:'case',base:current,item,paths:[...images(item)],uploaded:new Map()};caseForm.reset();caseForm.elements.title.value=item.title||'';caseForm.elements.description.value=item.description||'';caseForm.elements.published.checked=item.published!==false;document.getElementById('managedCaseTemplate').textContent='所属模板：'+item.template;document.getElementById('managedCaseError').hidden=true;document.getElementById('managedCaseProgress').textContent='';renderCaseImages();caseDialog.showModal();
  }
  function caseDraft(){return {...editor.item,title:caseForm.elements.title.value.trim(),description:caseForm.elements.description.value.trim(),published:caseForm.elements.published.checked,images:[...editor.paths,...[...caseForm.elements.images.files].map(file=>editor.uploaded.get(file)).filter(Boolean)],updatedAt:new Date().toISOString()};}
  templateForm.onsubmit=event=>{event.preventDefault();const draft=editor,body=document.getElementById('managedTemplateBody').value,target=document.getElementById('managedTemplateError');
    if(!body.trim()){showError(target,new Error('正文不能为空'));return;}
    run(async stamp=>{const overrides={...draft.base.templateOverrides,[draft.name]:{...draft.base.templateOverrides[draft.name],body,updatedAt:new Date().toISOString()}};saved(await hooks.save({...draft.base,templateOverrides:overrides},draft.base.revision),stamp,'正文已保存');},target);
  };
  caseForm.onsubmit=event=>{event.preventDefault();const draft=editor,target=document.getElementById('managedCaseError'),files=[...caseForm.elements.images.files];
    run(async stamp=>{
      if(!caseForm.elements.title.value.trim())throw new Error('案例标题不能为空');
      for(const [index,file]of files.entries()){
        if(draft.uploaded.has(file))continue;document.getElementById('managedCaseProgress').textContent='正在处理图片 '+(index+1)+' / '+files.length+'…';
        const result=await hooks.upload(await window.HAJIMI_IMAGE.prepare(file));if(stamp!==generation)return;if(!validImage(result.pathname))throw new Error('上传结果异常，请重试');draft.uploaded.set(file,result.pathname);
      }
      document.getElementById('managedCaseProgress').textContent='正在保存案例…';const item=caseDraft();const cases=draft.base.cases.map(value=>value.id===item.id?item:value);saved(await hooks.save({...draft.base,cases},draft.base.revision),stamp,'案例已保存');
    },target).finally(()=>document.getElementById('managedCaseProgress').textContent='');
  };
  document.getElementById('managedTemplateDraft').onclick=()=>download({template:editor.name,body:document.getElementById('managedTemplateBody').value},'hajimi-template-draft.json');
  document.getElementById('managedCaseDraft').onclick=()=>download({...caseDraft(),pendingFiles:[...caseForm.elements.images.files].filter(file=>!editor.uploaded.has(file)).map(file=>file.name)},'hajimi-case-draft.json');
  document.querySelectorAll('[data-manager-close]').forEach(element=>element.onclick=()=>element.closest('dialog').close());
  for(const dialog of [templateDialog,caseDialog])dialog.addEventListener('cancel',event=>{if(busy)event.preventDefault();});
  for(const element of [kind,search,publish])element.addEventListener(element===search?'input':'change',()=>{limit=50;error.hidden=true;render();});
  window.HAJIMI_ADMIN_CONTENT={setContent(data,callbacks){current=data;if(callbacks)hooks=callbacks;render();},clear(){generation++;current=null;editor=null;limit=50;search.value='';publish.value='all';kind.value='templates';templateDialog.close();caseDialog.close();templateForm.reset();caseForm.reset();document.getElementById('managedTemplateName').textContent='';document.getElementById('managedCaseTemplate').textContent='';document.getElementById('managedCaseImages').replaceChildren();error.hidden=true;render();}};
})();
