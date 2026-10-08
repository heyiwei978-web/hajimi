import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const traumaGroups=[
  '股骨转子间骨折','股骨大粗隆骨折','股骨干骨折','胫骨干骨折','胫骨平台骨折','踝关节三踝骨折',
  '跟骨骨折','桡骨远端骨折','桡骨头骨折','肱骨近端骨折','肱骨干骨折','锁骨骨折','尺桡骨干骨折',
  '髌骨骨折','掌骨骨折','指骨骨折','跖骨骨折','趾骨骨折','骨盆骨折'
];

function loadedClinicalScripts(){
  const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
  return [...html.matchAll(/<script\s+src="\/([^?"]+)(?:\?[^"]*)?"/g)]
    .map(match=>match[1])
    .filter(file=>/^(ideal-cases|orthopedic-expansion-[a-z]|record-quality-v\d+)\.js$/.test(file));
}

test('all clinical generation scripts parse and execute in site load order',()=>{
  const files=loadedClinicalScripts();
  const context={
    templates:[],
    traumaGroups:traumaGroups.slice(),
    groups:['TKA','THA','人工股骨头置换',...traumaGroups],
    profile:{},
    labelFor:(g)=>g==='TKA'?'全膝关节置换':g==='THA'?'全髋关节置换':g,
    window:{},
    console:{log(){},warn(){},error(){}},
    Set,Map,Date,Math,Number,String,RegExp,Array,Object,JSON
  };
  vm.createContext(context);

  const runtime=[];
  for(const file of files){
    const source=fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
    assert.doesNotThrow(()=>new vm.Script(source,{filename:file}),file+' should parse');
    try{
      vm.runInContext(source,context,{filename:file,timeout:5000});
      runtime.push({file,ok:true});
    }catch(error){
      runtime.push({file,ok:false,error:String(error?.stack||error)});
      throw error;
    }
  }

  assert.deepEqual(runtime.map(entry=>entry.file),files);
  assert(runtime.every(entry=>entry.ok));

  const seeds=context.window.HAJIMI_IDEAL_CASES?.seeds||{};
  const audit=context.window.HAJIMI_RECORD_QUALITY_V23;
  assert.equal(Object.keys(seeds).length,200);
  assert(audit,'quality V23 audit should exist');
  assert.equal(audit.stats.diseases,200);
  assert.equal(audit.stats.records,context.templates.filter(t=>t.department==='骨科'&&!t.specialCase).length);
  assert.equal(audit.stats.issueCount,0,JSON.stringify(audit.issues,null,2));
  assert.deepEqual(Array.from(audit.issues),[]);
});

test('index contains no escaped newline artifacts between script tags',()=>{
  const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
  assert.equal((html.match(/\\n/g)||[]).length,0);
});
