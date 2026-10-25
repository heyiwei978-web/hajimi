import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {loadClinicalSource} from '../scripts/clinical-compiler.mjs';
import {auditClinicalLibrary} from '../scripts/audit-clinical-library.mjs';
import {identityKey,metadataHash} from '../scripts/clinical-inventory.mjs';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const tag='<script defer src="/record-clavicle-complete-v33.js?v=20261025-clavicle1"></script>';
const before=loadClinicalSource(html.replace(tag,''),{audit:true});
const current=auditClinicalLibrary(),after=current.source;
const rows=after.records.filter(r=>r.group==='锁骨骨折'&&!r.specialCase),get=n=>rows.find(r=>r.short===n);
const time=n=>get(n).sourceBody.match(/记录时间：(\d{4}-\d{2}-\d{2} \d{2}:\d{2})/)[1];
test('clavicle revision replaces exactly 26 bodies while preserving all identities, special cases and other rendered records',()=>{
 assert.equal(after.records.length,before.records.length);let changes=0;
 for(let i=0;i<after.records.length;i++){
  const a=after.records[i],b=before.records[i];assert.equal(identityKey(a),identityKey(b));assert.equal(metadataHash(a),metadataHash(b));
  if(a.group==='锁骨骨折'&&!a.specialCase){assert.notEqual(a.sourceBody,b.sourceBody);assert.equal(a.sourceBody,after.renderedBodies[i]);changes++;}
  else{assert.deepEqual(a,b);assert.equal(after.renderedBodies[i],before.renderedBodies[i]);}
 }
 assert.equal(changes,26);assert.equal(rows.length,26);assert.equal(new Set(current.plan.published.filter(e=>e.record.group==='锁骨骨折').map(e=>e.identity.caseId)).size,1);
});
test('clavicle case has coherent daily chronology and specific discharge rather than copied writing instructions',()=>{
 const dates=new Set(rows.map(r=>r.sourceBody.match(/记录时间：(\d{4}-\d{2}-\d{2})/)[1]));for(let d=16;d<=21;d++)assert(dates.has('2026-09-'+d));
 for(const r of rows){assert(r.sourceBody.startsWith('【虚构教学标准病例｜锁骨骨折'));assert.match(r.sourceBody,/右锁骨中段闭合性粉碎性骨折/);assert(!/VAS|NRS|疼痛评分|____|假体|医师核实并记录|按实际情况|关节面/.test(r.sourceBody));}
 for(let d=1;d<=3;d++){const body=get('术后第'+d+'天病程').sourceBody;assert.match(body,/今日随陈某某主治医师查房/);assert.match(body,/陈某某主治医师查房后指出：/);assert(!body.split('病程记录：')[1].split('\n\n医师签名')[0].includes('\n'));}
 assert.match(get('术后第2天病程').sourceBody,/09:30已拔除引流管/);assert(time('术后第2天病程')<time('影像复查及结果分析'));assert(time('影像复查及结果分析')<time('康复评估与训练记录'));assert(time('康复评估与训练记录')<time('术后第3天病程'));assert(time('术后第3天病程')<time('出院当天查房记录'));assert(time('出院当天查房记录')<time('出院小结'));
 assert.match(get('出院小结').sourceBody,/今日尚未拆线/);assert.match(get('出院小结').sourceBody,/2026-09-30至10-02/);
});
test('clavicle operation, block recovery, implant count and rehabilitation remain mutually consistent',()=>{
 const op=get('手术记录').sourceBody,counts=get('手术清点记录').sourceBody;
 assert.equal(op.split('手术经过：')[1].split('\n\n术后计划：')[0].trim().split(/\n\s*\n/).length,4);
 for(const t of [op,counts]){assert.match(t,/8孔解剖锁定钢板1块/);assert.match(t,/共7枚螺钉/);assert.match(t,/未使用克氏针/);}
 assert.match(op,/获得双皮质固定/);assert.match(op,/钻头失控越过远侧皮质/);assert(!/必要时|或拉力螺钉|原病例记录/.test(op));
 assert.match(get('术后首次病程记录').sourceBody,/尚不能据此完成术后神经功能评价/);assert.match(get('术后主刀查房记录').sourceBody,/阻滞消退后目前神经血管检查正常/);
 assert.match(get('影像复查及结果分析').sourceBody,/骨折线仍可见/);assert.match(get('康复评估与训练记录').sourceBody,/前屈60°、外展40°/);assert.match(get('出院小结').sourceBody,/不继续预防性抗菌药物/);
});
