import fs from 'node:fs';

// 构建时把前端报错上报脚本注入每个发布页面 <head> 的最前面（紧跟 charset 声明），
// 这样页面后续脚本的报错都能被捕获。源 HTML 不改，避免在病历库 index.html 里加入与病历无关的脚本。
export const REPORTER_TAG = '<script src="/error-report.js?v=1"></script>';

export function injectReporter(html) {
  if (html.includes('/error-report.js')) return html;
  const charset = html.match(/<meta charset="[^"]*">\n?/i);
  if (!charset) throw new Error('Page has no <meta charset> to anchor the error reporter');
  const at = charset.index + charset[0].length;
  return html.slice(0, at) + (charset[0].endsWith('\n') ? '' : '\n') + REPORTER_TAG + '\n' + html.slice(at);
}

export function writeErrorReporter(directory) {
  const pages = fs.readdirSync(directory).filter(file => file.endsWith('.html'));
  for (const file of pages) {
    const url = new URL(file, directory);
    fs.writeFileSync(url, injectReporter(fs.readFileSync(url, 'utf8')));
  }
  return pages.length;
}
