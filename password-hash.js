// Builds the HAJIMI_ADMIN_PASSWORD_HASH value in the browser. The password never leaves this page.
(function (root) {
  const ITERATIONS = 600000;
  const b64url = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  async function makeHash(password, salt = root.crypto.getRandomValues(new Uint8Array(16))) {
    const key = await root.crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await root.crypto.subtle.deriveBits({name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITERATIONS}, key, 256);
    return 'pbkdf2$' + ITERATIONS + '$' + b64url(salt) + '$' + b64url(bits);
  }
  root.hajimiMakePasswordHash = makeHash;

  if (typeof document === 'undefined') return;
  const form = document.getElementById('hashForm');
  const first = document.getElementById('pw1'), second = document.getElementById('pw2');
  const error = document.getElementById('hashError'), result = document.getElementById('hashResult');
  const output = document.getElementById('hashOutput'), copy = document.getElementById('copyHash');
  form.addEventListener('submit', async event => {
    event.preventDefault();
    error.hidden = true; result.hidden = true;
    const password = first.value;
    let message = '';
    if (password.length < 12) message = '密码至少需要 12 个字符。';
    else if (password !== second.value) message = '两次输入的密码不一致。';
    if (message) { error.textContent = message; error.hidden = false; return; }
    const button = form.querySelector('button[type=submit]');
    button.disabled = true; button.textContent = '正在生成…';
    try {
      output.value = await makeHash(password);
      result.hidden = false;
      first.value = ''; second.value = '';
    } catch {
      error.textContent = '当前浏览器不支持，请换用最新版 Chrome、Edge 或 Safari。'; error.hidden = false;
    } finally {
      button.disabled = false; button.textContent = '生成';
    }
  });
  copy.addEventListener('click', async () => {
    output.select();
    try { await navigator.clipboard.writeText(output.value); copy.textContent = '已复制'; }
    catch { document.execCommand('copy'); copy.textContent = '已复制'; }
    setTimeout(() => { copy.textContent = '复制'; }, 2000);
  });
})(globalThis);
