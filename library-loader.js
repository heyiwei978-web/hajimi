(() => {
  const manifest=window.HAJIMI_MANIFEST,records=[],byId=new Map(),catalogs=new Map(),bodies=new Map();
  function script(url){return new Promise((resolve,reject)=>{const element=document.createElement('script');element.src=url;element.onload=resolve;element.onerror=()=>{element.remove();reject(new Error('资料加载失败，请检查网络后重试'));};document.head.append(element);});}
  const H=window.HAJIMI={records,manifest,
    acceptCatalog(department,{strings,extras,rows}){
      for(const [id,group,short,stage,type,desc,name,extra,hasBody]of rows){
        if(byId.has(id))continue;
        const g=strings[group],label=g==='TKA'?'全膝关节置换':g==='THA'?'全髋关节置换':g;
        const record={...extras[extra],_id:id,_hasBody:hasBody,department,group:g,short:strings[short],stage:strings[stage],type:strings[type],desc:strings[desc],name:name<0?label+' · '+strings[short]:strings[name]};
        byId.set(id,record);records.push(record);
      }
      records.sort((a,b)=>a._id-b._id);
    },
    ensureDepartment(slug){
      const department=manifest.departments[slug];if(!department)return Promise.resolve();
      if(!catalogs.has(slug))catalogs.set(slug,script(department.catalog).catch(error=>{catalogs.delete(slug);throw error;}));
      return catalogs.get(slug);
    },
    ensureAllDepartments(){return Promise.all(Object.keys(manifest.departments).map(slug=>H.ensureDepartment(slug)));},
    async ensureGroup(department,group){
      const slug=Object.keys(manifest.departments).find(key=>manifest.departments[key].name===department);
      await H.ensureDepartment(slug);
      const key=department+'\0'+group,url=manifest.bodies[key];if(!url)return;
      if(!bodies.has(key))bodies.set(key,(async()=>{
        const response=await fetch(url);if(!response.ok)throw new Error('病历正文加载失败，请检查网络后重试');
        const values=await response.json();
        if(!Array.isArray(values)||values.some(([id,body])=>!byId.has(id)||typeof body!=='string'))throw new Error('病历正文加载异常，请刷新后重试');
        for(const [id,body]of values)byId.get(id).sourceBody=body;
      })().catch(error=>{bodies.delete(key);throw error;}));
      return bodies.get(key);
    },
    ensureRecord(record){return H.ensureGroup(record.department,record.group);},
    hasAllDepartments(){return records.length===manifest.total;}
  };
  window.HAJIMI_IDEAL_CASES={seeds:manifest.seeds};
  window.HAJIMI_BOOTSTRAP=true;
  (async()=>{
    const parts=location.pathname.split('/').filter(Boolean),slug=parts[0]==='bl'?parts[1]:null;
    if(slug)await H.ensureDepartment(slug);
    await script(manifest.scripts.app);
    if(slug&&parts[2])await H.ensureGroup(manifest.departments[slug]?.name,decodeURIComponent(parts.slice(2).join('/')));
    await script(manifest.scripts.router);
    await script(manifest.scripts.cms);
  })().catch(error=>{
    console.error(error);
    const grid=document.getElementById('templateGrid');grid.replaceChildren();
    const message=document.createElement('p');message.className='library-loading';message.setAttribute('role','alert');message.textContent=error.message;
    const retry=document.createElement('button');retry.className='btn ghost';retry.textContent='重新加载';retry.onclick=()=>location.reload();
    grid.append(message,retry);document.getElementById('libraryShell').setAttribute('aria-busy','false');
  });
})();
