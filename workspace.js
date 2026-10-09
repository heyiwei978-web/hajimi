(() => {
  const headers=[...document.querySelectorAll('.official-nav,.library-topbar,.nav')];
  function fitNavigation(){
    const header=headers.find(element=>element.getBoundingClientRect().height>0);
    if(header)document.documentElement.style.setProperty('--site-header-height',header.getBoundingClientRect().height+'px');
    for(const nav of document.querySelectorAll('.official-links,.nav nav')){
      const active=nav.querySelector('a.active');
      if(!active||nav.scrollWidth<=nav.clientWidth)continue;
      const item=active.getBoundingClientRect(),bounds=nav.getBoundingClientRect();
      if(item.left<bounds.left||item.right>bounds.right){
        nav.scrollTo({left:nav.scrollLeft+item.left-bounds.left-(nav.clientWidth-item.width)/2,behavior:'instant'});
      }
    }
  }
  fitNavigation();
  if(typeof ResizeObserver==='function'){
    const observer=new ResizeObserver(fitNavigation);
    headers.forEach(header=>observer.observe(header));
    const previewHead=document.querySelector('#previewDialog .modal-head');
    if(previewHead)new ResizeObserver(()=>{
      const height=previewHead.getBoundingClientRect().height;
      if(height)previewHead.closest('dialog').style.setProperty('--preview-header-height',height+'px');
    }).observe(previewHead);
  }else window.addEventListener('resize',fitNavigation);
  document.querySelector('.skip-link')?.addEventListener('click', event => {
    const main = [...document.querySelectorAll('main')].find(element => !element.closest('[hidden]'));
    if (!main) return;
    event.preventDefault();
    main.tabIndex = -1;
    main.focus({preventScroll:true});
    main.scrollIntoView({behavior:'instant', block:'start'});
  });
  document.querySelectorAll('nav a.active').forEach(link => link.setAttribute('aria-current', 'page'));
  document.querySelectorAll('[data-auth-slot] a').forEach(link => link.setAttribute('aria-label','进入网站管理'));
  // Report notifications without moving keyboard focus away from the current task.
  document.querySelectorAll('.toast,.portal-toast').forEach(element => {
    element.setAttribute('role', 'status');
    element.setAttribute('aria-live', 'polite');
  });
})();
