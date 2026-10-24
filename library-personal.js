(() => {
  const key='hajimi-library-personal-v1',departments={骨科:'guke',普外科:'puwai',肾内科:'shennei',妇科:'fuke'};
  let memory={favorites:[],recent:[]},available=true;
  const same=(a,b)=>a.department===b.department&&a.group===b.group;
  const clean=list=>{
    const result=[];
    for(const item of Array.isArray(list)?list:[]){
      if(!item||!Object.hasOwn(departments,item.department)||typeof item.group!=='string'||!item.group.trim()||item.group.length>180||/[\u0000-\u001f]/.test(item.group))continue;
      if(window.HAJIMI_MANIFEST?.withdrawnGroups?.some(value=>same(value,item)))continue;
      const value={department:item.department,group:item.group};
      if(!result.some(existing=>same(existing,value)))result.push(value);
    }
    return result;
  };
  function read(){
    try{const saved=JSON.parse(localStorage.getItem(key)||'null');if(saved)memory={favorites:clean(saved.favorites).slice(0,50),recent:clean(saved.recent).slice(0,12)};}
    catch{available=false;}
    return memory;
  }
  function write(next){
    memory=next;
    try{localStorage.setItem(key,JSON.stringify(next));available=true;}catch{available=false;}
    refresh();
  }
  const label=group=>group==='TKA'?'全膝关节置换':group==='THA'?'全髋关节置换':group;
  const url=item=>'/bl/'+departments[item.department]+'/'+encodeURIComponent(item.group);
  function element(tag,text,className){const node=document.createElement(tag);if(text)node.textContent=text;if(className)node.className=className;return node;}
  function listPanel(title,items,isFavorite){
    const panel=element('section',null,'personal-column'),head=element('div',null,'personal-column-head');head.append(element('h4',title));
    if(!isFavorite&&items.length){const clear=element('button','清空最近访问','inline-link');clear.type='button';clear.onclick=()=>{const current=read();write({...current,recent:[]});};head.append(clear);}
    panel.append(head);
    if(!items.length){panel.append(element('p',isFavorite?'打开病种后，点击“收藏病种”即可添加。':'打开病种后，会在这里显示最近访问的入口。','personal-empty'));return panel;}
    const list=element('ul',null,'personal-list');
    for(const item of items){
      const row=element('li'),link=element('a');link.href=url(item);link.append(element('strong',label(item.group)),element('small',item.department));row.append(link);
      if(isFavorite){const remove=element('button','×','personal-remove');remove.type='button';remove.setAttribute('aria-label','取消收藏 '+label(item.group));remove.onclick=()=>{const current=read();write({...current,favorites:current.favorites.filter(value=>!same(value,item))});};row.append(remove);}
      list.append(row);
    }
    panel.append(list);return panel;
  }
  function refresh(){
    const current=memory,mount=document.getElementById('libraryPersonal');
    if(mount){
      const head=element('div',null,'library-quick-head'),copy=element('div');copy.append(element('h3','我的常用入口'),element('p','收藏与访问记录保存在本机浏览器，可随时清空。'));head.append(copy);
      const grid=element('div',null,'personal-grid');grid.append(listPanel('收藏的病种',current.favorites,true),listPanel('最近访问',current.recent,false));
      mount.replaceChildren(head,grid);mount.append(element('p',available?'仅记录病种链接，不包含患者信息。':'浏览器暂不允许保存，收藏仅在当前页面内有效。','personal-storage-status'));
    }
    const button=document.getElementById('favoriteDisease');
    if(button){const active={department:button.dataset.department,group:button.dataset.group},selected=current.favorites.some(item=>same(item,active));button.textContent=selected?'★ 已收藏':'☆ 收藏病种';button.setAttribute('aria-pressed',String(selected));}
  }
  window.HAJIMI_PERSONAL={
    mount(){read();refresh();},
    remember(department,group){const item={department,group};if(!clean([item]).length)return;const current=read();write({...current,recent:[item,...current.recent.filter(value=>!same(value,item))].slice(0,12)});},
    bindFavorite(button,department,group){
      if(!button)return;button.dataset.department=department;button.dataset.group=group;
      button.onclick=()=>{const current=read(),item={department,group},selected=current.favorites.some(value=>same(value,item));
        if(!selected&&current.favorites.length>=50){if(typeof toast==='function')toast('最多收藏 50 个病种，请先移除不常用的收藏');return;}
        write({...current,favorites:selected?current.favorites.filter(value=>!same(value,item)):[item,...current.favorites]});
        if(typeof toast==='function')toast(available?(selected?'已取消收藏':'已收藏病种'):'浏览器无法保存，收藏仅在当前页面有效');
      };read();refresh();
    }
  };
  window.addEventListener('storage',event=>{if(event.key===key||event.key===null){memory={favorites:[],recent:[]};read();refresh();}});
})();
