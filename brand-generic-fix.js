(function(){
  const routeMap={guke:"骨科",puwai:"普外科",shennei:"肾内科",fuke:"妇科"};
  function currentDept(){
    const m=location.pathname.match(/^\/bl\/([^/?#]+)/);
    return m?(routeMap[m[1]]||null):null;
  }
  function apply(){
    if(!(location.pathname==='/bl'||location.pathname.startsWith('/bl/')))return;
    const dep=currentDept();
    const mark=document.querySelector('#libraryShell .brand-mark,.brand-mark');
    const strong=document.querySelector('#libraryShell .brand strong,.brand strong');
    const small=document.querySelector('#libraryShell .brand small,.brand small');
    const intro=document.querySelector('#libraryShell .article-intro h1,.article-intro h1');
    const crumb=document.querySelector('#libraryShell .breadcrumb,.breadcrumb');

    if(mark) mark.textContent='医';
    if(strong) strong.textContent=dep?dep+'病历模板库':'病历模板';
    if(small) small.textContent=dep?'按疾病 / 术式进入模板':'按科室进入模板库';
    if(intro) intro.textContent=dep?dep+'病历模板库':'病历模板库';
    if(crumb) crumb.textContent='MEDICAL RECORDS / TEMPLATE LIBRARY';
    document.title=dep?dep+'病历模板库 · hajimi':'病历模板库 · hajimi';
  }
  apply();
  window.addEventListener('popstate',apply);
})();