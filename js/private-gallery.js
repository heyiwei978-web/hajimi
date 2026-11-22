(function(){
  const root=document.getElementById('privateGallery'),form=document.getElementById('privateUploadForm');
  const fields=document.getElementById('privateUploadFields'),refresh=document.getElementById('privateRefresh');
  const list=document.getElementById('privateList'),summary=document.getElementById('privateSummary');
  const error=document.getElementById('privateError'),progress=document.getElementById('privateProgress');
  const search=document.getElementById('privateSearch'),category=document.getElementById('privateCategory');
  const more=document.getElementById('privateMore'),uploadButton=document.getElementById('privateUploadButton');
  const dialog=document.createElement('dialog');dialog.className='private-image-dialog';
  const head=document.createElement('div');head.className='admin-card-head';
  const heading=document.createElement('h2');heading.id='privatePreviewTitle';dialog.setAttribute('aria-labelledby',heading.id);
  const close=document.createElement('button');close.type='button';close.className='admin-secondary';close.textContent='关闭';close.onclick=()=>dialog.close();
  const preview=document.createElement('img');head.append(heading,close);dialog.append(head,preview);document.body.append(dialog);
  dialog.addEventListener('close',()=>preview.removeAttribute('src'));
  let items=[],revision=null,epoch=0,renderEpoch=0,active=false,busy=false,limit=24,pending=null;
  const urls=new Set();let controller=new AbortController();
  function releaseImages(){renderEpoch++;dialog.close();preview.removeAttribute('src');for(const url of urls)URL.revokeObjectURL(url);urls.clear();list.replaceChildren();}
  function report(message){error.textContent=message;error.hidden=!message;}
  function clear(){
    epoch++;active=false;busy=false;revision=null;items=[];pending=null;controller.abort();controller=new AbortController();
    root.hidden=true;fields.disabled=true;releaseImages();form.reset();search.value='';category.value='';progress.textContent='';summary.textContent='';report('');
    refresh.disabled=false;uploadButton.textContent='保存到私人图片库';
  }
  function expired(){clear();window.dispatchEvent(new Event('hajimi:auth-lost'));}
  async function request(url,options={}){
    const response=await fetch(url,{credentials:'same-origin',cache:'no-store',signal:controller.signal,...options,headers:{'Content-Type':'application/json','X-Hajimi-Admin':'1'}});
    if(response.status===401){expired();throw new Error('登录已失效，请重新登录');}
    const body=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(body.error||'图片库暂不可用，请稍后重试');
    return body;
  }
  async function renderImage(item,button,generation){
    try{
      const response=await fetch('/api/private-image?path='+encodeURIComponent(item.images[0]),{credentials:'same-origin',cache:'no-store',signal:controller.signal});
      if(generation!==renderEpoch||!active)return;
      if(response.status===401){expired();return;}
      if(!response.ok)throw new Error('图片读取失败');
      const data=await response.blob();if(generation!==renderEpoch||!active)return;
      const url=URL.createObjectURL(data);urls.add(url);
      const image=document.createElement('img');image.src=url;image.alt=item.title;button.replaceChildren(image);
      button.onclick=()=>{heading.textContent=item.title;preview.alt=item.title;preview.src=url;dialog.showModal();};
    }catch(ex){if(generation===renderEpoch&&active&&ex.name!=='AbortError'){button.textContent='图片暂不可用，请刷新';button.disabled=true;}}
  }
  function render(){
    releaseImages();if(!active)return;
    const query=search.value.trim().toLocaleLowerCase(),selected=category.value;
    const filtered=items.filter(item=>(!selected||item.category===selected)&&(!query||(item.title+' '+item.description).toLocaleLowerCase().includes(query)));
    summary.textContent=items.length?'共 '+items.length+' 张私人图片，本次筛选 '+filtered.length+' 张':'暂无私人图片，选择上方图片后即可保存。';
    more.hidden=filtered.length<=limit;
    for(const item of filtered.slice(0,limit)){
      const card=document.createElement('article');card.className='private-image-card';
      const button=document.createElement('button');button.type='button';button.textContent='正在读取图片…';button.setAttribute('aria-label','放大查看：'+item.title);
      const copy=document.createElement('div');copy.className='private-image-copy';
      const title=document.createElement('h3');title.textContent=item.title;
      const meta=document.createElement('small');meta.textContent=item.category+' · '+new Date(item.createdAt).toLocaleDateString('zh-CN');copy.append(title,meta);
      if(item.description){const description=document.createElement('p');description.textContent=item.description;copy.append(description);}
      card.append(button,copy);list.append(card);renderImage(item,button,renderEpoch);
    }
  }
  async function read(generation){
    const current=await request('/api/private-gallery');if(generation!==epoch||!active)return false;
    items=current.items;revision=current.revision;render();return true;
  }
  async function load(){
    clear();active=true;root.hidden=false;const generation=epoch;summary.textContent='正在加载私人图片库…';refresh.disabled=true;
    try{if(await read(generation))fields.disabled=false;}
    catch(ex){if(generation===epoch&&active){summary.textContent='图片库暂未加载。';report(ex.message);}}
    finally{if(generation===epoch&&active)refresh.disabled=false;}
  }
  refresh.onclick=async()=>{
    if(busy||!active)return;const generation=epoch;refresh.disabled=true;fields.disabled=true;report('');
    try{if(await read(generation))fields.disabled=false;}catch(ex){if(generation===epoch&&active)report(ex.message);}
    finally{if(generation===epoch&&active)refresh.disabled=false;}
  };
  form.elements.images.addEventListener('change',()=>{pending=null;uploadButton.textContent='保存到私人图片库';});
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(busy||!active||!revision)return;
    const files=pending||Array.from(form.elements.images.files);if(!files.length)return;
    const generation=epoch,values={title:form.elements.title.value,description:form.elements.description.value,category:form.elements.category.value};
    busy=true;fields.disabled=true;refresh.disabled=true;report('');let saved=0;
    try{
      for(let index=0;index<files.length;index++){
        progress.textContent='正在处理第 '+(index+1)+' / '+files.length+' 张…';
        const prepared=await window.HAJIMI_IMAGE.prepare(files[index]);if(generation!==epoch||!active)return;
        const result=await request('/api/private-gallery',{method:'POST',body:JSON.stringify({...prepared,...values,revision})});
        if(generation!==epoch||!active)return;
        revision=result.revision;items.unshift(result.item);saved++;pending=files.slice(saved);render();
      }
      form.reset();pending=null;uploadButton.textContent='保存到私人图片库';progress.textContent='已保存 '+saved+' 张，仅管理员可查看。';
    }catch(ex){
      if(generation!==epoch||!active)return;
      pending=files.slice(saved);progress.textContent='本次已确认保存 '+saved+' 张。';
      // A failed response may follow a committed write. Require the owner to inspect before retrying.
      report(ex.message+'；请先刷新核对。剩余 '+pending.length+' 张仍保留在本页。');
      uploadButton.textContent='继续上传剩余 '+pending.length+' 张';revision=null;
    }finally{if(generation===epoch&&active){busy=false;fields.disabled=!revision;refresh.disabled=false;}}
  });
  search.oninput=category.onchange=()=>{limit=24;render();};more.onclick=()=>{limit+=24;render();};
  window.HAJIMI_PRIVATE_GALLERY={load,clear};
})();
