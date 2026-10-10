/* Tabler Icons — MIT License
Copyright (c) 2020-2026 Paweł Kuna

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
(() => {
  const sizes = [18, 20, 22], storageKey = 'hajimi-library-font-v1';
  let fontSize = 18, persistent = true;
  const readSize = value => sizes.includes(Number(value)) ? Number(value) : 18;
  try { fontSize = readSize(localStorage.getItem(storageKey)); } catch { persistent = false; }

  // Tabler Icons (MIT), https://github.com/tabler/tabler-icons.
  // The complete copyright and permission notice is in THIRD_PARTY_NOTICES.md.
  const paths = {
    typography: '<path d="M4 20l3 0"/><path d="M14 20l7 0"/><path d="M6.9 15l6.9 0"/><path d="M10.2 6.3l5.8 13.7"/><path d="M5 20l6 -16l2 0l7 16"/>',
    file: '<path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2"/><path d="M9 9l1 0"/><path d="M9 13l6 0"/><path d="M9 17l6 0"/>',
    next: '<path d="M9 6l6 6l-6 6"/>'
  };
  const icon = name => '<svg class="clinical-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + (paths[name] || '') + '</svg>';
  function controls() {
    return '<div class="reading-font-controls" role="group" aria-label="病历字号">' +
      '<span class="reading-font-label">' + icon('typography') + '字号</span>' +
      sizes.map(size => '<button type="button" data-reading-font="' + size + '" aria-label="病历字号 ' + size + ' 像素" aria-pressed="' + (size === fontSize) + '">' + size + '</button>').join('') +
      '<small class="reading-font-note"' + (persistent ? ' hidden' : '') + '>仅本页生效</small></div>';
  }
  function apply() {
    document.documentElement.style.setProperty('--clinical-font-size', fontSize + 'px');
    document.querySelectorAll('[data-reading-font]').forEach(button => {
      button.setAttribute('aria-pressed', String(Number(button.dataset.readingFont) === fontSize));
    });
    document.querySelectorAll('.reading-font-note').forEach(note => { note.hidden = persistent; });
  }
  function mount() {
    document.querySelectorAll('.reading-font-slot:empty').forEach(slot => { slot.innerHTML = controls(); });
    apply();
  }
  window.HAJIMI_UI = {icon, mount};
  apply();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, {once:true});
  else mount();
  document.addEventListener('click', event => {
    const button = event.target.closest?.('[data-reading-font]');
    if (!button) return;
    fontSize = readSize(button.dataset.readingFont);
    try { localStorage.setItem(storageKey, String(fontSize)); persistent = true; } catch { persistent = false; }
    apply();
  });
  window.addEventListener('storage', event => {
    if (event.key !== storageKey && event.key !== null) return;
    fontSize = readSize(event.key === null ? null : event.newValue);
    apply();
  });
})();
