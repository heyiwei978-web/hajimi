import {readFileSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

// Keep homepage markup in index.html as the single source for both entry points.
export function buildHome(source) {
  const headEnd = source.indexOf('</head>');
  const start = source.indexOf('<div id="portalHome"');
  const end = source.indexOf('<div id="dutyPage"');
  if (headEnd < 0 || start < headEnd || end <= start) {
    throw new Error('Homepage sections missing from index.html');
  }
  const head = source.slice(0, headEnd + '</head>'.length);
  const portal = source.slice(start, end).trim().replace(/^(<div id="portalHome"[^>]*?) hidden/, '$1');
  return `${head}\n<body class="portal-mode">\n<a class="skip-link" href="#homeContent">跳到主要内容</a>\n${portal}\n<script defer src="/workspace.js?v=20261009-quality1"></script>\n<script defer src="/home.js?v=20261009-quality1"></script>\n</body></html>\n`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const output = buildHome(readFileSync(new URL('../index.html', import.meta.url), 'utf8'));
  const target = new URL('../home.html', import.meta.url);
  if (process.argv.includes('--check')) {
    if (readFileSync(target, 'utf8') !== output) throw new Error('Run npm run build to refresh home.html');
  } else {
    writeFileSync(target, output);
    console.log('Built lightweight homepage from index.html');
  }
}
