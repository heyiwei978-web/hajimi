import {readFileSync, writeFileSync, readdirSync, mkdirSync, rmSync, copyFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {compileClinicalSite} from './clinical-compiler.mjs';
import {compileEcg} from './ecg-compiler.mjs';

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
    for(const entry of readdirSync(new URL('../',import.meta.url),{withFileTypes:true})){
      if(entry.isFile()&&/\.(?:html|js|css)$/.test(entry.name)&&entry.name!=='index.html'){
        copyFileSync(new URL('../'+entry.name,import.meta.url),new URL(entry.name,directory));
      }
    }
    writeFileSync(new URL('index.html',directory),output);
    compileClinicalSite(readFileSync(new URL('../index.html',import.meta.url),'utf8'),directory);
    const ecg=compileEcg(directory);
    console.log('Built lightweight homepage and clinical library in dist/');
    console.log('Built ECG bundle assets/'+ecg.name+' ('+ecg.entries+' entries, '+Math.round(ecg.bytes/1024)+' KB)');
  }
}
