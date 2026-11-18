(() => {
  const mounts = [...document.querySelectorAll('[data-workstation-list]')];
  const emptyStates = mounts.map(mount => [...mount.childNodes]);
  const history = window.HAJIMI_PERSONAL;
  const published = window.HAJIMI_WORKSTATION_CASES;

  function renderLists() {
    if (!history || !published) return;
    const state = history.snapshot();
    mounts.forEach((mount, index) => {
      const items = state[mount.dataset.workstationList]
        .filter(({department, group}) => Object.hasOwn(published, department + '\0' + group));
      if (!items.length) {
        mount.replaceChildren(...emptyStates[index]);
        return;
      }
      const list = document.createElement('ul');
      for (const {department, group} of items.slice(0, Number(mount.dataset.limit) || items.length)) {
        const item = document.createElement('li');
        const link = document.createElement('a');
        link.href = published[department + '\0' + group];
        link.className = 'ws-row';
        const copy = document.createElement('span');
        const title = document.createElement('strong');
        title.textContent = history.label(group);
        const subtitle = document.createElement('small');
        subtitle.textContent = department + ' · 病历模板';
        const arrow = document.createElement('b');
        arrow.textContent = '›';
        arrow.setAttribute('aria-hidden', 'true');
        copy.append(title, subtitle);
        link.append(copy, arrow);
        item.append(link);
        list.append(item);
      }
      mount.replaceChildren(list);
    });
  }

  renderLists();
  window.addEventListener('pageshow', event => {
    if (event.persisted) renderLists();
  });
  window.addEventListener('storage', renderLists);

  const account = document.querySelector('[data-workstation-account]');
  if (!account) return;
  fetch('/api/session', {credentials:'same-origin', cache:'no-store'})
    .then(response => response.ok ? response.json() : null)
    .then(session => {
      if (session?.authenticated) account.textContent = '打开管理后台';
    })
    .catch(() => {});
})();
