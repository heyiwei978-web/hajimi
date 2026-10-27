import {readFileSync, writeFileSync, mkdirSync, rmSync, copyFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {compileClinicalSite} from './clinical-compiler.mjs';
import {compileEcg} from './ecg-compiler.mjs';
import {PUBLIC_FILES} from './public-assets.mjs';
import {assertPublicResources} from './public-resources.mjs';
import {writeBuiltNavigation} from './navigation-build.mjs';
import {writeBuiltDepartmentPages} from './department-build.mjs';

// Keep homepage markup in index.html as the single source for both entry points.
export function buildHome(source) {
  const headEnd = source.indexOf('</head>');
  const start = source.indexOf('<div id="portalHome"');
  const end = source.indexOf('<div id="dutyPage"');
  if (headEnd < 0 || start < headEnd || end <= start) {
    throw new Error('Homepage sections missing from index.html');
  }
  // The homepage renders no record reader or favorites panel; skip their
  // render-blocking stylesheets (the library page still loads them).
  const head = source.slice(0, headEnd + '</head>'.length)
    .replace(/<link rel="stylesheet" href="\/(?:library-personal|case-workspace-preview)\.css[^"]*">\n?/g, '');
  const portal = source.slice(start, end).trim().replace(/^(<div id="portalHome"[^>]*?) hidden/, '$1');
  return `${head}\n<body class="portal-mode">\n<a class="skip-link" href="#homeContent">跳到主要内容</a>\n${portal}\n<script defer src="/workspace.js?v=20261009-layout1"></script>\n<script defer src="/home.js?v=20261009-quality1"></script>\n</body></html>\n`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const output = buildHome(readFileSync(new URL('../index.html', import.meta.url), 'utf8'));
  const target = new URL('../home.html', import.meta.url);
  if (process.argv.includes('--check')) {
    if (readFileSync(target, 'utf8') !== output) throw new Error('Run npm run build to refresh home.html');
  } else {
    writeFileSync(target, output);
    const directory=new URL('../dist/',import.meta.url);
    // Vercel serves existing index.html before rewrites. Publish the lightweight
    // page as index.html, and keep the complete library at a separate path.
    rmSync(directory,{recursive:true,force:true});
    mkdirSync(directory,{recursive:true});
    for(const file of PUBLIC_FILES)copyFileSync(new URL('../'+file,import.meta.url),new URL(file,directory));
    writeFileSync(new URL('home.html',directory),output);
    writeFileSync(new URL('index.html',directory),output);
    const {manifest}=compileClinicalSite(readFileSync(new URL('../index.html',import.meta.url),'utf8'),directory);
    const ecg=compileEcg(directory);
    writeBuiltNavigation(directory);
    writeBuiltDepartmentPages(directory);
    assertPublicResources(directory,JSON.parse(readFileSync(new URL('../vercel.json',import.meta.url),'utf8')),manifest);
    console.log('Built lightweight homepage and clinical library in dist/');
    console.log('Built ECG bundle assets/'+ecg.name+' ('+ecg.entries+' entries, '+Math.round(ecg.bytes/1024)+' KB)');
  }
}
