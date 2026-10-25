import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import test from 'node:test';
import {pathToFileURL} from 'node:url';
import {auditClinicalLibrary} from '../scripts/audit-clinical-library.mjs';
import {identityKey,planClinicalPublication} from '../scripts/clinical-inventory.mjs';
import {compileClinicalSite} from '../scripts/clinical-compiler.mjs';

const current=auditClinicalLibrary();
const expectedGroups=['胸腰椎爆裂骨折','骨质疏松性椎体压缩骨折','腰椎间盘突出症','腰椎管狭窄症',
  '腰椎滑脱症','腰椎峡部裂伴滑脱','腰椎感染','退变性腰椎侧弯','巨大腰椎间盘突出伴马尾综合征',
  '椎管内神经鞘瘤','脊柱硬膜外脓肿','神经肌肉性脊柱侧弯'];

test('lumbar withdrawal removes exactly 12 complete cases and preserves unrelated cases and permanent IDs',()=>{
  const {plan,source,inventory}=current;
  assert.deepEqual([...new Set(plan.withdrawn.map(e=>e.record.group))].sort(),[...expectedGroups].sort());
  assert.equal(plan.withdrawn.length,324);
  assert.equal(plan.published.length,5052);
  assert.equal(plan.published.filter(e=>e.record.department==='骨科').length,5025);
  assert.equal(plan.archived.length,0);
  for(const decision of inventory.policy.withdrawals){
    const actual=plan.withdrawn.filter(e=>e.identity.caseId===decision.caseId);
    assert.deepEqual(actual.map(e=>e.identity.recordId).sort(),[...plan.state.cases.get(decision.caseId).recordIds].sort());
    assert(actual.some(e=>e.record.short==='入院记录'));
    assert(actual.some(e=>e.record.short==='手术记录'));
    assert(actual.some(e=>e.record.short==='出院当天查房记录'));
    assert(actual.some(e=>e.record.type==='出院小结'));
  }
  for(const group of ['TKA','THA','股骨转子间骨折','舟骨骨折','骶骨骨折','骶髂关节脱位','脊柱侧弯',
    '脊髓型颈椎病','胸椎黄韧带骨化症','脊柱结核','脊柱转移瘤']){
    assert(plan.published.some(e=>e.record.group===group),group+' must remain published');
  }
  const byIdentity=new Map(source.records.map(record=>[identityKey(record),record]));
  for(const entry of [...plan.published,...plan.withdrawn]){
    assert.deepEqual(entry.record,byIdentity.get(identityKey(entry.record)));
    assert.equal(entry.identity.recordId,'clinical-v1-r'+String(entry.identity.legacyId).padStart(6,'0'));
  }
  assert.equal(plan.published.filter(e=>e.record.specialCase).length,44);
  const restored=structuredClone(inventory);restored.policy.withdrawals=[];
  assert.equal(planClinicalPublication(source,restored).published.length,source.records.length);
});

test('partial, unapproved, stale or duplicate withdrawals fail instead of dropping arbitrary records',()=>{
  const reject=change=>{
    const inventory=structuredClone(current.inventory);change(inventory.policy.withdrawals,inventory);
    assert.throws(()=>planClinicalPublication(current.source,inventory),/withdraw/);
  };
  reject(list=>list[0].recordIds.pop());
  reject(list=>list[0].recordIds.push(list[0].recordIds[0]));
  reject(list=>list[0].recordIds[0]='clinical-v1-r999999');
  reject(list=>list[0].authorizedBy='');
  reject(list=>list[0].authorizationReference='');
  reject(list=>list[0].group='TKA');
  reject(list=>list.push(structuredClone(list[0])));
  reject((list,inventory)=>inventory.policy.withdrawals={});
});

test('published catalogs, seeds and downloadable bodies contain no withdrawn documents',t=>{
  const folder=fs.mkdtempSync(path.join(os.tmpdir(),'lumbar-withdrawal-'));
  t.after(()=>fs.rmSync(folder,{recursive:true,force:true}));
  const directory=pathToFileURL(folder+'/');
  const {manifest,publication}=compileClinicalSite(fs.readFileSync(new URL('../index.html',import.meta.url),'utf8'),directory);
  const publicIds=[];
  for(const department of Object.values(manifest.departments)){
    vm.runInNewContext(fs.readFileSync(new URL(department.catalog.slice(1),directory),'utf8'),{
      window:{HAJIMI:{acceptCatalog(name,{rows}){publicIds.push(...rows.map(row=>row[0]));}}}
    });
  }
  const bodies=new Map(Object.values(manifest.bodies).flatMap(file=>JSON.parse(fs.readFileSync(new URL(file.slice(1),directory),'utf8'))));
  assert.equal(publicIds.length,publication.published.length);
  for(const {record,identity}of publication.withdrawn){
    assert(!publicIds.includes(identity.legacyId));
    assert(!bodies.has(identity.legacyId));
    assert(!manifest.groups.includes(record.group));
    assert(!Object.hasOwn(manifest.seeds,record.group));
    assert(!Object.hasOwn(manifest.bodies,record.department+'\0'+record.group));
  }
  for(const {record,identity}of publication.published){
    assert(publicIds.includes(identity.legacyId));
    if(record.sourceBody)assert.equal(bodies.get(identity.legacyId),record.sourceBody);
  }
  assert.deepEqual(manifest.withdrawnGroups.map(item=>item.group).sort(),[...expectedGroups].sort());
});

test('favorites and recent visits no longer offer withdrawn disease links',()=>{
  let saved={favorites:[{department:'骨科',group:'腰椎间盘突出症'},{department:'骨科',group:'TKA'}],
    recent:[{department:'骨科',group:'椎管内神经鞘瘤'}]};
  const context={window:{HAJIMI_MANIFEST:{withdrawnGroups:expectedGroups.map(group=>({department:'骨科',group}))},addEventListener(){}},
    document:{getElementById(){return null;}},localStorage:{getItem(){return JSON.stringify(saved);},setItem(key,value){saved=JSON.parse(value);}}};
  vm.runInNewContext(fs.readFileSync(new URL('../library-personal.js',import.meta.url),'utf8'),context);
  context.window.HAJIMI_PERSONAL.remember('骨科','THA');
  assert.deepEqual(saved.favorites,[{department:'骨科',group:'TKA'}]);
  assert.deepEqual(saved.recent,[{department:'骨科',group:'THA'}]);
});

test('old lumbar URLs show a withdrawal notice while retained disease URLs still open their records',async()=>{
  const source=fs.readFileSync(new URL('../departments.js',import.meta.url),'utf8');
  const start=source.indexOf('async function applyRoute(){');
  const end=source.indexOf('\n    function renderSearchResults(',start);
  assert(start>=0&&end>start);
  for(const group of ['腰椎间盘突出症','椎管内神经鞘瘤','TKA']){
    const rendered=[],notices=[],grid={classList:{remove(){}},insertAdjacentHTML(position,text){notices.push(text);}};
    const context={window:{HAJIMI_MANIFEST:{withdrawnGroups:expectedGroups.map(group=>({department:'骨科',group}))},
      HAJIMI:{async ensureDepartment(){},async ensureGroup(){}}},location:{pathname:'/bl/guke/'+encodeURIComponent(group),search:'?q=腰椎'},
      document:{title:'',getElementById(){return grid;}},disposeCaseReader(){},activeRoute:'',routeGeneration:0,currentDept:null,
      pathState:()=>({page:'library',department:'骨科',disease:group}),setShell(){},labelFor:value=>value,
      deptToSlug:{'骨科':'guke'},resetState(){},allDisease:()=>['TKA'],state:{},
      renderDisease(){rendered.push('case');},renderDepartmentIndex(){rendered.push('index');},
      applyRouteSearch(){rendered.push('search');},escapeHtml:value=>value};
    vm.createContext(context);
    vm.runInContext(source.slice(start,end)+'\nglobalThis.openRoute=applyRoute;',context);
    await context.openRoute();
    if(group==='TKA'){
      assert.deepEqual(rendered,['case']);assert.equal(notices.length,0);
    }else{
      assert.deepEqual(rendered,['index']);assert.match(notices.join(''),/该病种已移出病历库/);
      assert.equal(context.document.title,'病种已移出 · 哈基米工作站');
    }
  }
});
