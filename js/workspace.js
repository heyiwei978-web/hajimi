(() => {
  // Sticky offsets (--site-header-height) follow the header that is showing.
  // The five-entry main navigation fits without scrolling, so nothing else to fit.
  const headers=[...document.querySelectorAll('.site-header,.library-topbar')];
  function measureHeader(){
    const header=headers.find(element=>element.getBoundingClientRect().height>0);
    if(header)document.documentElement.style.setProperty('--site-header-height',header.getBoundingClientRect().height+'px');
  }
  measureHeader();
  if(typeof ResizeObserver==='function'){
    const observer=new ResizeObserver(measureHeader);
    headers.forEach(header=>observer.observe(header));
    const previewHead=document.querySelector('#previewDialog .modal-head');
    if(previewHead)new ResizeObserver(()=>{
      const height=previewHead.getBoundingClientRect().height;
      if(height)previewHead.closest('dialog').style.setProperty('--preview-header-height',height+'px');
    }).observe(previewHead);
  }else window.addEventListener('resize',measureHeader);
  document.querySelector('.skip-link')?.addEventListener('click', event => {
    const main = [...document.querySelectorAll('main')].find(element => !element.closest('[hidden]'));
    if (!main) return;
    event.preventDefault();
    main.tabIndex = -1;
    main.focus({preventScroll:true});
    main.scrollIntoView({behavior:'instant', block:'start'});
  });
  document.querySelectorAll('[data-auth-slot] a').forEach(link => link.setAttribute('aria-label','进入网站管理'));
  // Report notifications without moving keyboard focus away from the current task.
  document.querySelectorAll('.toast,.portal-toast').forEach(element => {
    element.setAttribute('role', 'status');
    element.setAttribute('aria-live', 'polite');
  });
})();
