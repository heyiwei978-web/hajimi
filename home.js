(() => {
  // The homepage needs session status, but no clinical templates or content API.
  const slots = document.querySelectorAll('[data-auth-slot]');
  for (const slot of slots) {
    const link = document.createElement('a');
    link.href = '/admin';
    link.textContent = '登录';
    link.className = 'cms-login-btn';
    link.setAttribute('aria-label', '进入网站管理');
    slot.classList.add('cms-auth-slot');
    slot.replaceChildren(link);
  }
  fetch('/api/session', {credentials:'same-origin', cache:'no-store'})
    .then(response => response.ok ? response.json() : null)
    .then(session => {
      if (!session?.authenticated) return;
      for (const slot of slots) slot.querySelector('a').textContent = '管理后台';
    })
    .catch(() => {});
})();
