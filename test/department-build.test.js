import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';
import {DEPARTMENTS} from '../config/site-modules.mjs';
import {renderHomeDepartments,renderRouterDepartments,renderClassificationDepartments} from '../scripts/department-build.mjs';

const read = file => fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
const clone = () => structuredClone(DEPARTMENTS);
function routerRows(source) {
  const literal = /const departments=(\[[\s\S]*?\]);/.exec(source)[1];
  return JSON.parse(JSON.stringify(vm.runInNewContext('('+literal+')',{})));
}
function classificationRows(source) {
  const context = {window:{}};
  vm.runInNewContext(source,context);
  return JSON.parse(JSON.stringify(context.window.HAJIMI_CLASSIFICATION_DATA));
}

test('department projections preserve every byte with current registry data', () => {
  for (const file of ['index.html','home.html']) assert.equal(renderHomeDepartments(read(file)),read(file));
  assert.equal(renderRouterDepartments(read('departments.js')),read('departments.js'));
  assert.equal(renderClassificationDepartments(read('classification-data.js')),read('classification-data.js'));
});

test('each context uses its own registry text without changing classification entries', () => {
  const departments = clone();
  departments[0].presentation = {homeIcon:'示',homeDescription:'合成首页说明',recordsDescription:'合成病历目录说明',classificationDescription:'合成分型目录说明'};
  assert.match(renderHomeDepartments(read('index.html'),departments),/合成首页说明/);
  assert.equal(routerRows(renderRouterDepartments(read('departments.js'),departments))[0].desc,'合成病历目录说明');
  const before = classificationRows(read('classification-data.js'));
  const after = classificationRows(renderClassificationDepartments(read('classification-data.js'),departments));
  assert.equal(after.departments[0].description,'合成分型目录说明');
  assert.deepEqual(after.entries,before.entries);
});

test('presentation values are escaped for HTML and JavaScript contexts', () => {
  const departments = clone(), value = "测试'<script>&\\\n第二行";
  departments[0].presentation.homeDescription = value;
  departments[0].presentation.recordsDescription = value;
  departments[0].presentation.classificationDescription = value;
  const home = renderHomeDepartments(read('index.html'),departments);
  assert.ok(home.includes('测试&#39;&lt;script&gt;&amp;'));
  assert.equal(routerRows(renderRouterDepartments(read('departments.js'),departments))[0].desc,value);
  assert.equal(classificationRows(renderClassificationDepartments(read('classification-data.js'),departments)).departments[0].description,value);
});

test('missing, duplicated or malformed projection targets stop the build', () => {
  assert.throws(() => renderHomeDepartments(read('index.html').replace('class="home-quick-grid"','class="other-grid"')), /Expected one homepage/);
  assert.throws(() => renderRouterDepartments(read('departments.js')+read('departments.js')), /Expected one router/);
  assert.throws(() => renderClassificationDepartments(read('classification-data.js').replace('"departments":','"other":')), /Expected one classification/);
  const departments = clone();
  delete departments[0].presentation.homeIcon;
  assert.throws(() => renderHomeDepartments(read('index.html'),departments), /presentation missing/);
  departments[0].classification = 'ready';
  assert.throws(() => renderClassificationDepartments(read('classification-data.js'),departments), /must be boolean/);
});

test('home visibility does not remove clinical routes or classification placeholders', () => {
  const departments = clone();departments[0].records = false;departments[0].classification = false;
  const home = renderHomeDepartments(read('index.html'),departments);
  assert.equal([...home.matchAll(/href="\/bl\/guke"><span class="home-department-icon"/g)].length,0);
  assert.equal(routerRows(renderRouterDepartments(read('departments.js'),departments)).length,4);
  const classification = classificationRows(renderClassificationDepartments(read('classification-data.js'),departments));
  assert.equal(classification.departments.length,4);assert.equal(classification.departments[0].ready,false);
});

test('normal build projects registry metadata into home, router and classification while retaining clinical payloads', async t => {
  const parent = fs.realpathSync(os.tmpdir()), folder = fs.mkdtempSync(path.join(parent,'hajimi-department-build-'));
  t.after(() => {
    const resolved = fs.realpathSync(folder);assert.equal(path.dirname(resolved),parent);
    fs.rmSync(resolved,{recursive:true,force:true});
  });
  const root = fileURLToPath(new URL('../',import.meta.url));
  function copy(source,destination) {
    fs.mkdirSync(destination);
    for (const entry of fs.readdirSync(source,{withFileTypes:true})) {
      const from = path.join(source,entry.name),to = path.join(destination,entry.name);
      if (entry.isDirectory()) copy(from,to);
      else if (entry.isFile()) fs.copyFileSync(from,to);
      else assert.fail('Unexpected source entry: '+from);
    }
  }
  for (const entry of fs.readdirSync(root,{withFileTypes:true})) {
    const from = path.join(root,entry.name),to = path.join(folder,entry.name);
    if (entry.isFile() && (/\.(?:html|js|css)$/.test(entry.name)||['package.json','vercel.json'].includes(entry.name))) fs.copyFileSync(from,to);
    else if (entry.isDirectory() && ['scripts','config','content'].includes(entry.name)) copy(from,to);
  }
  const build = () => promisify(execFile)(process.execPath,['scripts/build-home.mjs'],{cwd:folder,timeout:60000,maxBuffer:1024*1024});
  function outputs(directory,prefix='') {
    return new Map(fs.readdirSync(directory,{withFileTypes:true}).flatMap(entry => {
      const name = prefix+entry.name,target=path.join(directory,entry.name);
      return entry.isDirectory() ? [...outputs(target,name+'/')] : [[name,fs.readFileSync(target)]];
    }));
  }
  function manifest(files) {
    const names = [...files.keys()].filter(name => /^library-manifest-[a-f0-9]+\.js$/.test(name));
    assert.equal(names.length,1);
    const context={window:{}};vm.runInNewContext(files.get(names[0]).toString('utf8'),context);
    return {name:names[0],value:JSON.parse(JSON.stringify(context.window.HAJIMI_MANIFEST))};
  }
  await build();
  const before = outputs(path.join(folder,'dist')), oldManifest = manifest(before);
  const config = path.join(folder,'config/site-modules.mjs');
  let text = fs.readFileSync(config,'utf8');
  const old = DEPARTMENTS[0].presentation;
  const values={homeDescription:'合成构建首页说明',recordsDescription:'合成构建病历说明',classificationDescription:'合成构建分型说明'};
  for (const [key,value] of Object.entries(values)) {
    const needle=key+": '"+old[key]+"'";assert.equal(text.split(needle).length,2);
    text=text.replace(needle,key+": '"+value+"'");
  }
  fs.writeFileSync(config,text);
  await build();
  const after = outputs(path.join(folder,'dist')), newManifest = manifest(after);
  const oldRouter=oldManifest.value.scripts.router.slice(1),newRouter=newManifest.value.scripts.router.slice(1);
  assert.notEqual(oldRouter,newRouter);
  assert.equal(routerRows(after.get(newRouter).toString('utf8'))[0].desc,values.recordsDescription);
  assert.deepEqual(Buffer.from(after.get(newRouter).toString('utf8').replace(values.recordsDescription,old.recordsDescription)),before.get(oldRouter));
  newManifest.value.scripts.router=oldManifest.value.scripts.router;
  assert.deepEqual(newManifest.value,oldManifest.value,'only the router content-hash reference changes');
  const added=[...after.keys()].filter(name=>!before.has(name)).sort();
  const removed=[...before.keys()].filter(name=>!after.has(name)).sort();
  assert.deepEqual(added,[newRouter,newManifest.name].sort());assert.deepEqual(removed,[oldRouter,oldManifest.name].sort());
  // Asset URLs carry content digests (scripts/asset-versions.mjs): only the
  // changed classification data gets a new version; everything else keeps its URL.
  const versions=html=>new Map([...html.matchAll(/\/([A-Za-z0-9_-]+\.(?:css|js))\?v=([0-9a-f]{12})/g)].map(match=>[match[1],match[2]]));
  const oldVersions=versions(before.get('classification.html').toString('utf8')),newVersions=versions(after.get('classification.html').toString('utf8'));
  assert.notEqual(newVersions.get('classification-data.js'),oldVersions.get('classification-data.js'));
  for (const [file,version] of newVersions) if (file!=='classification-data.js') assert.equal(version,oldVersions.get(file),file+' keeps its version');
  const sameDataVersion=html=>html.replace('/classification-data.js?v='+newVersions.get('classification-data.js'),'/classification-data.js?v='+oldVersions.get('classification-data.js'));
  for (const [name,bytes] of after) {
    if (!before.has(name)) continue;
    let normalized=name.endsWith('.html')?Buffer.from(sameDataVersion(bytes.toString('utf8'))):bytes;
    if (['index.html','home.html','library.html'].includes(name)) {
      const html=normalized.toString('utf8');assert.ok(html.includes(values.homeDescription));
      normalized=Buffer.from(html.replace(values.homeDescription,old.homeDescription).replace(newManifest.name,oldManifest.name));
    } else if (name==='classification-data.js') {
      const source=bytes.toString('utf8');assert.ok(source.includes(values.classificationDescription));
      normalized=Buffer.from(source.replace(values.classificationDescription,old.classificationDescription));
    }
    assert.deepEqual(normalized,before.get(name),name+' retains all other content');
  }
  for (const name of ['config/site-modules.mjs','scripts/department-build.mjs']) assert.ok(!after.has(name));
});
