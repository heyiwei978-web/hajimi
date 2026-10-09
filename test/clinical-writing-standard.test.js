import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const load=(name)=>fs.readFileSync(new URL('../'+name,import.meta.url),'utf8');

test('orthopedic writing standard is loaded after the case generators but before CMS',()=>{
  const html=load('index.html');
  const p=html.indexOf('surgery-techniques-reviewed.js');
  const q=html.indexOf('clinical-record-standard.js');
  const r=html.indexOf('cms-core.js');
  assert(p>html.indexOf('tka-special-cases.js'));
  assert(p<q&&q<r);
});

test('single paragraph normalization retains demographic header and clinical judgments',()=>{
  const ctx={window:{HAJIMI_IDEAL_CASES:{seeds:{'胫骨干骨折':{procedure:'经髌韧带旁髓内钉固定',surgery:'胫骨干骨折闭合复位髓内钉内固定术'}}}},
    HAJIMI_REVIEWED_SURGERIES:null},
    templates:[
      {department:'骨科',group:'胫骨干骨折',short:'术后第1天病程',type:'术后病程',
        sourceBody:'记录名称：术后第1天病程\n患者：甲某某\n记录时间：2026-10-01 09:00\n\n今日王某某主任医师查房。\n\n查体：切口干燥。\n\n分析：病情稳定。\n处理意见：继续观察。\n主任医师：王某某'},
      {department:'骨科',group:'胫骨干骨折',short:'手术记录',type:'手术记录',
        sourceBody:'记录名称：手术记录\n\n手术经过：\n1. 麻醉及摆位。\n2. 显露。\n3. 胫骨髓内钉置入。\n4. 冲洗缝合。'},
      {department:'普外科',group:'其他',short:'主治查房',type:'查房',sourceBody:'身份信息\n\n甲。\n\n乙。'}
    ],
    generate:t=>t.sourceBody};
  vm.createContext(ctx);
  vm.runInContext(load('surgery-techniques-reviewed.js'),ctx);
  vm.runInContext(load('clinical-record-standard.js'),ctx);
  const a=ctx.templates[0].sourceBody;
  const parts=a.split(/\n\s*\n/);
  assert.equal(parts.length,3,'header, continuous narrative and signature');
  assert(!parts[1].includes('\n'),'progress note narrative must be one paragraph');
  assert.match(parts[1],/查体：切口干燥/);
  assert.match(parts[1],/分析：病情稳定/);
  assert.match(parts[1],/处理意见：继续观察/);
  assert.match(a,/主任医师：________/);
  assert(!a.includes('王某某主任医师'));
  assert.match(ctx.templates[1].sourceBody,/术式专项操作细节/);
  assert.match(ctx.templates[1].sourceBody,/胫骨近端/);
  assert.equal(ctx.templates[2].sourceBody,'身份信息\n\n甲。\n\n乙。');
  assert(ctx.window.HAJIMI_RECORD_STANDARD.stats.progress>=1);
});

test('reviewed operative techniques include group-specific steps but do not invent details for unmatched cases',()=>{
  const ctx={window:{}};
  vm.createContext(ctx);
  vm.runInContext(load('surgery-techniques-reviewed.js'),ctx);
  const s=ctx.window.HAJIMI_REVIEWED_SURGERIES;
  assert(s.detailedGroups.length>=20);
  assert(Object.keys(s.sourceURLs).length>=4);
  assert.match(s.getDetail({group:'胫骨平台骨折'},{procedure:'外侧胫骨平台抬高及钢板内固定',surgery:'胫骨平台骨折切开复位内固定术'}),/半月板下/);
  assert.equal(s.getDetail({group:'骨肿瘤'},{procedure:'手术',surgery:'手术'}),'');
  assert.equal(s.getDetail({group:'桡骨头骨折'},{procedure:'置换',surgery:'桡骨头置换术'}),'');
});

test('CMS overrides pass through the same formatter as default records',()=>{
  const cms=load('cms-core.js');
  assert.match(cms,/HAJIMI_RECORD_STANDARD\?\.format\?\.\(t,body\)/);
});
