// 前端报错上报（2026-11-18）。构建时由 scripts/error-reporter.mjs 注入所有页面 <head> 的最前面。
// 只上报本站脚本的报错摘要：报错文字、出错文件路径和行列号、当前页面路径。
// 不读取页面内容、输入框、存储和 Cookie；地址只取路径部分，去掉 ?查询 和 #片段；
// 报错文字里 6 位以上的连续数字会被替换掉，避免带出编号类信息。服务端还会再清理一遍。
(function () {
  'use strict';
  var MAX_PER_PAGE = 5, sent = 0, seen = {};
  var origin = location.origin;
  function pathOnly(url) {
    try {
      var u = new URL(String(url || ''), location.href);
      return u.origin === origin ? u.pathname.slice(0, 200) : '';
    } catch (e) { return ''; }
  }
  function tidy(text) {
    return String(text || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\d{6,}/g, '#').slice(0, 300);
  }
  function report(kind, message, file, line, column) {
    if (sent >= MAX_PER_PAGE) return;
    var entry = {kind: kind, message: tidy(message), file: pathOnly(file), line: +line || 0, column: +column || 0, page: pathOnly(location.href)};
    if (!entry.message) return;
    var key = entry.kind + '|' + entry.message + '|' + entry.file + '|' + entry.line;
    if (seen[key]) return;
    seen[key] = 1; sent++;
    try {
      fetch('/api/client-error', {
        method: 'POST', keepalive: true, credentials: 'same-origin',
        headers: {'Content-Type': 'application/json', 'X-Hajimi-Report': '1'},
        body: JSON.stringify(entry)
      }).catch(function () {});
    } catch (e) {}
  }
  window.addEventListener('error', function (event) {
    // 资源加载失败（图片、脚本、样式）没有 message，记录元素地址。
    var target = event.target;
    if (target && target !== window && (target.src || target.href)) {
      var url = target.src || target.href;
      if (pathOnly(url)) report('resource', (target.tagName || '资源').toLowerCase() + ' 加载失败', url, 0, 0);
      return;
    }
    // 跨域脚本只给出 "Script error."，没有可用信息；只记录本站脚本。
    if (!event.filename || !pathOnly(event.filename)) return;
    report('error', event.message || (event.error && event.error.name) || 'Error', event.filename, event.lineno, event.colno);
  }, true);
  window.addEventListener('unhandledrejection', function (event) {
    var reason = event.reason, message = reason && (reason.message || reason.name) || String(reason || 'Promise rejected');
    var stack = reason && typeof reason.stack === 'string' ? reason.stack : '';
    var match = stack.match(/(https?:\/\/[^\s)]+):(\d+):(\d+)/);
    report('rejection', message, match ? match[1] : '', match ? match[2] : 0, match ? match[3] : 0);
  });
})();
