import {readFileSync, writeFileSync, mkdirSync, rmSync, copyFileSync} from 'node:fs';
import {writeErrorReporter} from './error-reporter.mjs';
import {fileURLToPath} from 'node:url';
import {compileClinicalSite} from './clinical-compiler.mjs';
import {compileEcg} from './ecg-compiler.mjs';
import {PUBLIC_FILES} from './public-assets.mjs';
import {assertPublicResources} from './public-resources.mjs';
import {MODULES, SITE_BRAND} from '../config/site-modules.mjs';
import {renderWorkspaceNav, writeBuiltNavigation} from './navigation-build.mjs';
import {writeBuiltDepartmentPages} from './department-build.mjs';
import {writeAssetVersions} from './asset-versions.mjs';
import {writeSiteSearch} from './site-search-build.mjs';

// Keep homepage markup in index.html as the single source for both entry points.
export function buildHome(source) {
  const headEnd = source.indexOf('</head>');
  const start = source.indexOf('<div id="portalHome"');
  const end = source.indexOf('<div id="libraryShell"');
  if (headEnd < 0 || start < headEnd || end <= start) {
    throw new Error('Homepage sections missing from index.html');
  }
  const head = source.slice(0, headEnd)
    .replace(/<link rel="stylesheet"[^>]*>\n/g, '')
    .replace(/(<meta name="theme-color" content=")[^"]+/, '$1#f5f8f7');
  const portal = source.slice(start, end).trim().replace(/^(<div id="portalHome"[^>]*?) hidden/, '$1');
  const scripts = workspaceScripts('home');
  return `${head}<link rel="stylesheet" href="/personal-workstation.css?v=1">
</head>
<body>
<a class="ws-skip" href="#homeContent">跳到主要内容</a>
${portal}
${scripts}</body></html>
`;
}

function workspaceScripts(id) {
  if (id !== 'home' && id !== 'personal') return '';
  return '<script defer src="/library-personal.js?v=1"></script>\n'
    + '<script defer src="/workstation-cases.js?v=1"></script>\n'
    + '<script defer src="/home.js?v=20261009-quality1"></script>\n';
}

function writeWorkspaceSections(directory, home, source, manifest) {
  const published = new Map();
  for (const {department, group} of manifest.caseTemplates.items) {
    const dep = Object.entries(manifest.departments).find(([, entry]) => entry.name === department);
    published.set(department + '\0' + group, '/bl/' + dep[0] + '/' + encodeURIComponent(group));
  }
  writeFileSync(new URL('workstation-cases.js',directory),
    'window.HAJIMI_WORKSTATION_CASES=' + JSON.stringify(Object.fromEntries(published)) + ';\n');
  const sections = new Map([...source.matchAll(/<template id="([a-z]+)">([\s\S]*?)<\/template>/g)]
    .map(([, id, html]) => [id, html.trim()]));
  for (const {id, workspace} of MODULES.filter(module => module.workspace && module.id !== 'home')) {
    if (!sections.has(id)) throw new Error(`Missing workstation section: ${id}`);
    const html = renderWorkspaceNav(home
      .replace('<title>' + SITE_BRAND.name + '</title>', `<title>${workspace} · ${SITE_BRAND.name}</title>`)
      .replace(/(<main id="homeContent"[^>]*>)[\s\S]*?(  <footer class="ws-footer">)/,
        (_, main, footer) => main + '\n  ' + sections.get(id) + '\n' + footer)
      .replace(workspaceScripts('home'), workspaceScripts(id)), id);
    writeFileSync(new URL(id + '.html',directory), html);
  }
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
    const {manifest,publication}=compileClinicalSite(readFileSync(new URL('../index.html',import.meta.url),'utf8'),directory);
    const records=new Map(publication.published.map(({record,identity})=>[identity.legacyId,record]));
    const noteCases=manifest.caseTemplates.items.map(item=>{
      const chapters=item.chapterIds.map(id=>({id,title:records.get(id)?.short||records.get(id)?.name||'文书',hasBody:!!records.get(id)?.sourceBody}));
      const operationRecord=chapters.find(chapter=>chapter.title==='手术记录');
      const operationBody=records.get(operationRecord?.id)?.sourceBody||'';
      const operation=(operationBody.match(/(?:^|\n)[ \t]*(?:手术名称|手术方式)[ \t]*[：:][ \t]*([^\n]+)/)?.[1]||'').split(/　| {2,}/)[0].trim().slice(0,160);
      return {id:item.caseId,title:item.title,department:item.department,caseType:item.caseType,operation,
        bodyUrl:manifest.bodies[item.department+'\0'+item.group]||null,chapters};
    });
    writeFileSync(new URL('note-cases.json',directory),JSON.stringify(noteCases));
    const ecg=compileEcg(directory);
    // Written before asset versioning so /search picks up a content-hashed URL.
    const search=writeSiteSearch(directory,manifest,publication.published);
    writeBuiltNavigation(directory);
    writeBuiltDepartmentPages(directory);
    writeWorkspaceSections(directory, readFileSync(new URL('home.html',directory), 'utf8'),
      readFileSync(new URL('../workstation-sections.html',import.meta.url), 'utf8'), manifest);
    writeErrorReporter(directory);
    writeAssetVersions(directory);
    assertPublicResources(directory,JSON.parse(readFileSync(new URL('../vercel.json',import.meta.url),'utf8')),manifest);
    console.log('Built lightweight homepage and clinical library in dist/');
    console.log('Built site search index ('+search.documents.length+' entries)');
    console.log('Built ECG bundle assets/'+ecg.name+' ('+ecg.entries+' entries, '+Math.round(ecg.bytes/1024)+' KB)');
  }
}
