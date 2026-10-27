import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {test} from 'node:test';

// route-shell.js predicts, before first paint, the body classes that
// departments.js and ecg.js apply once a route has rendered. A wrong
// prediction would reintroduce the layout shift it exists to remove.
function load(){
  const context={window:{}};
  runInNewContext(readFileSync(new URL('../route-shell.js',import.meta.url),'utf8'),context,{filename:'route-shell.js'});
  return context.window.HAJIMI_ROUTE_SHELL.classesFor;
}

test('record library routes get their final layout classes before scripts run',()=>{
  const classesFor=load();
  const expected={
    '/bl':['department-no-sidebar','library-root-page'],
    '/bl/':['department-no-sidebar','library-root-page'],
    '/bl/unknown':['department-no-sidebar','library-root-page'],
    '/bl/guke':[],
    '/bl/guke/':[],
    '/bl/puwai':['department-no-sidebar'],
    '/bl/shennei':['department-no-sidebar'],
    '/bl/fuke':['department-no-sidebar'],
    '/bl/guke/%E8%82%A1%E9%AA%A8%E8%BD%AC%E5%AD%90%E9%97%B4%E9%AA%A8%E6%8A%98':['department-no-sidebar','disease-book-page'],
    '/bl/puwai/%E9%98%91%E5%B0%BE%E7%82%8E':['department-no-sidebar','disease-book-page'],
    '/':[], '/tools':[], '/duty':[]
  };
  for(const [path,classes] of Object.entries(expected))assert.deepEqual([...classesFor(path)],classes,path);
});

test('ECG routes get their final layout classes before scripts run',()=>{
  const classesFor=load();
  const expected={
    '/ecg':[], '/ecg/':[], '/ecg.html':[],
    '/ecg/basics':['ecg-subpage'],
    '/ecg/atlas':['ecg-subpage','ecg-atlas-list'],
    '/ecg/atlas/arrhythmia':['ecg-subpage','ecg-atlas-list'],
    '/ecg/atlas/arrhythmia/af':['ecg-subpage','ecg-entry-page']
  };
  for(const [path,classes] of Object.entries(expected))assert.deepEqual([...classesFor(path)],classes,path);
});

test('the class names it predicts are the ones the page scripts actually toggle',()=>{
  const departments=readFileSync(new URL('../departments.js',import.meta.url),'utf8');
  const ecg=readFileSync(new URL('../ecg.js',import.meta.url),'utf8');
  for(const name of ['department-no-sidebar','library-root-page','disease-book-page'])assert.match(departments,new RegExp("'"+name+"'"));
  for(const name of ['ecg-subpage','ecg-atlas-list','ecg-entry-page'])assert.match(ecg,new RegExp("'"+name+"'"));
  // Department slugs must stay in sync with the router.
  for(const slug of ['guke','puwai','shennei','fuke'])assert.match(departments,new RegExp(slug));
});

test('the library and ECG pages load it synchronously at the top of <body>',()=>{
  const ecg=readFileSync(new URL('../ecg.html',import.meta.url),'utf8');
  assert.match(ecg,/<body[^>]*>\n<script src="\/route-shell\.js\?v=[^"]+"><\/script>/);
  const compiler=readFileSync(new URL('../scripts/clinical-compiler.mjs',import.meta.url),'utf8');
  assert.match(compiler,/replace\('<body>','<body>\\n<script src="\/route-shell\.js\?v=[^"]+"><\/script>'\)/);
});
