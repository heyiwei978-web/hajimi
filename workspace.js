(() => {
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
