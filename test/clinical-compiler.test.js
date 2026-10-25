import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import test from 'node:test';
import {pathToFileURL} from 'node:url';
import {compileClinicalSite} from '../scripts/clinical-compiler.mjs';

test('compiled catalogs and per-disease bodies preserve every retained clinical record',t=>{
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'hajimi-clinical-'));
  t.after(()=>fs.rmSync(directory,{recursive:true,force:true}));
  const {source,manifest,publication}=compileClinicalSite(fs.readFileSync(new URL('../index.html',import.meta.url),'utf8'),pathToFileURL(directory+'/'));
  const records=[];
  const byId=new Map(publication.published.map(entry=>[entry.identity.legacyId,entry.record]));
  for(const department of Object.values(manifest.departments)){
    vm.runInNewContext(fs.readFileSync(path.join(directory,department.catalog.slice(1)),'utf8'),{window:{HAJIMI:{acceptCatalog(name,{strings,extras,rows}){
      for(const [id,group,short,stage,type,desc,title,extra,hasBody]of rows){
        const g=strings[group],label=g==='TKA'?'全膝关节置换':g==='THA'?'全髋关节置换':g;
        records[id]={...extras[extra],department:name,group:g,short:strings[short],stage:strings[stage],type:strings[type],desc:strings[desc],name:title<0?label+' · '+strings[short]:strings[title]};
        assert.equal(hasBody,!!byId.get(id).sourceBody);
      }
    }}}});
  }
  for(const file of Object.values(manifest.bodies)){
    for(const [id,body]of JSON.parse(fs.readFileSync(path.join(directory,file.slice(1)),'utf8')))records[id].sourceBody=body;
  }
  const newDischargeRounds=source.records.filter(r=>r.department==='骨科'&&r.short==='出院当天查房记录');
  assert.ok(newDischargeRounds.length>=200,'Every orthopedic model patient needs a discharge-day round');
  assert.equal(records.filter(Boolean).length,publication.published.length);
  // Convert cross-context objects before comparison; all public fields, flags,
  // special-case ordering and every body must survive the data split unchanged.
  assert.deepEqual(JSON.parse(JSON.stringify(records.filter(Boolean))),publication.published.map(entry=>entry.record));
  assert.equal(manifest.departments.guke.count,publication.published.filter(({record})=>record.department==='骨科').length);
  // Regression: these assertions read published per-disease JSON, not preview-only scripts.
  const femur=records.find(r=>r&&r.department==='骨科'&&r.group==='股骨转子间骨折'&&r.short==='手术记录'&&!r.specialCase);
  assert.ok(femur?.sourceBody,'股骨转子间骨折手术记录缺失');
  const start=femur.sourceBody.indexOf('手术经过：\n');
  assert.ok(start>=0,'手术经过缺失');
  const remaining=femur.sourceBody.slice(start+'手术经过：\n'.length);
  const end=remaining.search(/\n\n(?:术后计划|术后医嘱|术后处理|术者签名)[：:]/);
  const procedure=end<0?remaining:remaining.slice(0,end);
  assert.equal(procedure.split('\n\n').length,4,'手术经过必须为四个完整段落');
  assert.doesNotMatch(procedure,/^\s*\d+[.、．]/m,'正式发布JSON不得保留逐行编号步骤');
  assert.match(procedure,/大转子顶点/,'手术记录必须具有与术式匹配的具体解剖入路');

  const round=records.find(r=>r&&r.department==='骨科'&&r.group==='股骨转子间骨折'&&r.short==='主任医师首次查房记录');
  assert.ok(round?.sourceBody,'主任医师查房记录缺失');
  assert.match(round.sourceBody,/\n\n主诊断：[^\n]+\n\n病程记录：[^\n]+\n\n医师签名：________$/,'主诊断、正文与医师签名须分开');
  assert.match(round.sourceBody,/________主任医师查房后指出：/,'缺少主任查房后指出的具体表述');
  assert.equal(round.sourceBody.split('\n\n').length,4,'病程记录必须保持独立的主诊断、单段正文与医师签名');
  // Whole-library clinical style regression: verify the publishable JSON for all ordinary orthopedic surgery records.
  const ordinaryOperations=records.filter(r=>r.department==='骨科'&&/手术记录/.test(r.short||'')&&!r.specialCase&&typeof r.sourceBody==='string');
  assert.ok(ordinaryOperations.length>=180,'Too few retained orthopedic operation records were covered by the audit');
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
    // The explicitly fictional arthroplasty examples uses named sample clinicians.
    const body=['TKA','THA'].includes(r.group)?r.sourceBody.replace(/(?:陈某某|王某某)(主治医师|主任医师)/g,'________$1').replace('医师签名：刘某某住院医师','医师签名：________'):r.sourceBody;
    assert.match(body,/\n\n主诊断：[^\n]+\n\n病程记录：[^\n]+\n\n医师签名：________$/,r.group+'：主诊断、病程正文与签名未独立分段');
    assert.match(body,new RegExp('________'+expected+'查房后(?:指出|指示)'),r.group+'：查房后意见未用明确的标准表述');
  }

  const groupsNeedingDischarge=new Set(source.records.filter(r=>r.department==='骨科'&&!r.specialCase&&r.group!=='通用场景').map(r=>r.group));
  for(const group of groupsNeedingDischarge){
    const entries=source.records.filter(r=>r.department==='骨科'&&r.group===group&&!r.specialCase&&r.short==='出院当天查房记录');
    assert.equal(entries.length,1,group+'：必须有且仅有一份出院当天查房记录');
    assert.match(['TKA','THA'].includes(group)?entries[0].sourceBody.replace('医师签名：刘某某住院医师','医师签名：________'):entries[0].sourceBody,/\n\n主诊断：[^\n]+\n\n病程记录：[^\n]+\n\n医师签名：________$/);
  }
  const orthoProgress=source.records.filter(r=>r.department==='骨科'&&typeof r.sourceBody==='string'&&/病程|查房/.test(r.short||'')&&!r.specialCase);
  for(const r of orthoProgress){
    const body=['TKA','THA'].includes(r.group)?r.sourceBody.slice(r.sourceBody.indexOf('记录名称：')).replace('医师签名：刘某某住院医师','医师签名：________'):r.sourceBody;
    assert.match(body,/\n\n主诊断：[^\n]+\n\n病程记录：[^\n]+\n\n医师签名：________$/,r.group+' '+r.short+'：分区格式有误');
    assert.equal(body.split('\n\n').length,4,r.group+' '+r.short+'：病程正文不能再分段');
    assert.ok(r.sourceBody.includes('科别：骨科'),r.group+' '+r.short+'：须保留科别');
  }

  // Keep the original TKA complication cases intact while enforcing the same prose layout.
  const specialOperations=records.filter(r=>r.department==='骨科'&&r.specialCase&&r.type==='手术记录'&&/手术记录/.test(r.short||''));
  assert.ok(specialOperations.length>=2,'Missing the two preserved TKA operative records');
  for(const r of specialOperations){
    const section=r.sourceBody.match(/手术经过[：:]\s*([\s\S]*?)(?=\n\n术中出血量)/);
    assert.ok(section,r.short+'：手术过程正文缺失或结尾分隔不符合规范');
    const paragraphs=section[1].trim().split(/\n\s*\n/);
    assert.ok(paragraphs.length>=3&&paragraphs.length<=4,r.short+'：特殊手术经过需三至四段');
    assert.ok(paragraphs.every(p=>p.trim().length>=45),r.short+'：每段须包含完整临床操作描述');
    assert.doesNotMatch(section[1],/^\s*\d+[.、．]/m,r.short+'：不能保留编号式步骤');
  }
  // Guard against a generic operative route masking a more appropriate named approach.
  const scoliosis=records.find(r=>r&&r.department==='骨科'&&r.group==='脊柱侧弯'&&r.short==='手术记录');
  if(scoliosis)assert.match(scoliosis.sourceBody,/椎体去旋转|旋棒/, '脊柱侧弯矫形术应包含矫形与去旋转技术，不得退化为普通脊柱骨折固定');
  const haglund=records.find(r=>r&&r.department==='骨科'&&r.group&&/Haglund/.test(r.group)&&r.short==='手术记录');
  if(haglund)assert.match(haglund.sourceBody,/跟骨后上方|跟腱止点/,'Haglund成形不能套用单纯跟腱腱体缝合术');
  const entry=fs.readFileSync(path.join(directory,'library.html'),'utf8');
  assert(!entry.includes('/record-quality-v'));
  assert(!entry.includes('/orthopedic-expansion-'));
});
