import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import test from 'node:test';
import {pathToFileURL} from 'node:url';
import {compileClinicalSite} from '../scripts/clinical-compiler.mjs';

test('compiled catalogs and per-disease bodies preserve every original clinical record',t=>{
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'hajimi-clinical-'));
  t.after(()=>fs.rmSync(directory,{recursive:true,force:true}));
  const {source,manifest}=compileClinicalSite(fs.readFileSync(new URL('../index.html',import.meta.url),'utf8'),pathToFileURL(directory+'/'));
  const records=[];
  for(const department of Object.values(manifest.departments)){
    vm.runInNewContext(fs.readFileSync(path.join(directory,department.catalog.slice(1)),'utf8'),{window:{HAJIMI:{acceptCatalog(name,{strings,extras,rows}){
      for(const [id,group,short,stage,type,desc,title,extra,hasBody]of rows){
        const g=strings[group],label=g==='TKA'?'全膝关节置换':g==='THA'?'全髋关节置换':g;
        records[id]={...extras[extra],department:name,group:g,short:strings[short],stage:strings[stage],type:strings[type],desc:strings[desc],name:title<0?label+' · '+strings[short]:strings[title]};
        assert.equal(hasBody,!!source.records[id].sourceBody);
      }
    }}}});
  }
  for(const file of Object.values(manifest.bodies)){
    for(const [id,body]of JSON.parse(fs.readFileSync(path.join(directory,file.slice(1)),'utf8')))records[id].sourceBody=body;
  }
  assert.equal(records.length,5159);
  // Convert cross-context objects before comparison; all public fields, flags,
  // special-case ordering and every body must survive the data split unchanged.
  assert.deepEqual(JSON.parse(JSON.stringify(records)),source.records);
  assert.equal(manifest.departments.guke.count,5132);
  // Regression: these assertions read published per-disease JSON, not preview-only scripts.
  const femur=records.find(r=>r.department==='骨科'&&r.group==='股骨转子间骨折'&&r.short==='手术记录'&&!r.specialCase);
  assert.ok(femur?.sourceBody,'股骨转子间骨折手术记录缺失');
  const start=femur.sourceBody.indexOf('手术经过：\n');
  assert.ok(start>=0,'手术经过缺失');
  const remaining=femur.sourceBody.slice(start+'手术经过：\n'.length);
  const end=remaining.search(/\n\n(?:术后计划|术后医嘱|术后处理|术者签名)[：:]/);
  const procedure=end<0?remaining:remaining.slice(0,end);
  assert.equal(procedure.split('\n\n').length,4,'手术经过必须为四个完整段落');
  assert.doesNotMatch(procedure,/^\s*\d+[.、．]/m,'正式发布JSON不得保留逐行编号步骤');
  assert.match(procedure,/大转子顶点/,'手术记录必须具有与术式匹配的具体解剖入路');

  const round=records.find(r=>r.department==='骨科'&&r.group==='股骨转子间骨折'&&r.short==='主任医师首次查房记录');
  assert.ok(round?.sourceBody,'主任医师查房记录缺失');
  assert.match(round.sourceBody,/\n\n主任医师：________$/,'主任签名须留空');
  assert.equal(round.sourceBody.split('\n\n').length,3,'病程正文必须为一个自然段');
  // Whole-library clinical style regression: verify the publishable JSON for all ordinary orthopedic surgery records.
  const ordinaryOperations=records.filter(r=>r.department==='骨科'&&/手术记录/.test(r.short||'')&&!r.specialCase&&typeof r.sourceBody==='string');
  assert.ok(ordinaryOperations.length>=200,'Too few orthopedic operation records were covered by the audit');
  for(const r of ordinaryOperations){
    const match=r.sourceBody.match(/手术经过[：:]\s*\n([\s\S]*?)(?=\n\n(?:术后计划|术后医嘱|术后处理|术者签名|手术者签名)[：:]|$)/);
    assert.ok(match,r.group+'：缺少手术经过');
    const paragraphs=match[1].trim().split(/\n\s*\n/);
    assert.equal(paragraphs.length,4,r.group+'：手术经过须写成四个自然长段');
    assert.doesNotMatch(match[1],/^\s*(?:\d+|[一二三四五六七八九十]+)[.、．]\s*/m,r.group+'：不得一条一段');
    assert.ok(paragraphs.every(p=>p.length>=45),r.group+'：含过短、无操作细节的段落');
  }
  const physicianCourses=records.filter(r=>r.department==='骨科'&&/主任医师.*查房记录|主治医师.*查房记录/.test(r.short||'')&&typeof r.sourceBody==='string'&&!r.specialCase);
  assert.ok(physicianCourses.length>100,'No physician progress notes checked');
  for(const r of physicianCourses){
    const expected=/主任医师/.test(r.short)?'主任医师':'主治医师';
    assert.match(r.sourceBody,new RegExp('\\n\\n'+expected+'：________$'),r.group+'：查房医师姓名或签名未留空');
  }
  const entry=fs.readFileSync(path.join(directory,'library.html'),'utf8');
  assert(!entry.includes('/record-quality-v'));
  assert(!entry.includes('/orthopedic-expansion-'));
});
