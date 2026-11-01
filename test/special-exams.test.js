import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

function element(extra={}){
  return {hidden:false,disabled:false,textContent:'',innerHTML:'',isConnected:true,dataset:{},handlers:{},
    classList:{set:new Set(),toggle(name,on){on?this.set.add(name):this.set.delete(name);},contains(name){return this.set.has(name);}},
    setAttribute(){},addEventListener(event,handler){this.handlers[event]=handler;},focus(){},...extra};
}
function load(){
  const context={window:{},navigator:{clipboard:{writeText:async value=>{context.copied=value;}}}};
  vm.runInNewContext(fs.readFileSync(new URL('../special-exams.js',import.meta.url),'utf8'),context);
  vm.runInNewContext(fs.readFileSync(new URL('../comorbidity-modules.js',import.meta.url),'utf8'),context);
  return context;
}
function fixture(){
  const context=load(),m=context.window.HAJIMI_COMORBIDITIES,items=context.window.HAJIMI_SPECIAL_ITEMS;
  const examInputs=items.map(item=>element({dataset:{exam:item.id},checked:false}));
  const parts={'#comorbidityNotes':element(),'#comorbiditySelectionStatus':element(),'#copyComorbidities':element(),
    '#comorbidityFollowText':element(),'#comorbidityFollow':element(),'#closeComorbiditySide':element(),'#comorbiditySideTitle':element(),
    '.comorbidity-stage-tabs':element(),'.comorbidity-follow':element()};
  const side=element({closest:()=>element(),querySelector:sel=>parts[sel],querySelectorAll:()=>[]});
  const panel=element({querySelectorAll:()=>[],querySelector:sel=>sel==='#clearComorbidities'?element():null});
  const clearExams=element();
  const examPanel=element({querySelectorAll:()=>examInputs,querySelector:sel=>sel==='#clearExams'?clearExams:null});
  const ids={comorbidityPanel:panel,comorbiditySide:side,specialExamPanel:examPanel,openComorbiditySide:element(),comorbidityFabCount:element()};
  context.document={getElementById:id=>ids[id]||null};
  m.bind();
  return {context,m,items,side,parts,clearExams,
    pick(id){const input=examInputs.find(x=>x.dataset.exam===id);input.checked=true;input.handlers.change();}};
}

test('18 order reasons in four groups, each with reason, required notes and caution',()=>{
  const items=load().window.HAJIMI_SPECIAL_ITEMS;
  assert.equal(items.length,18);
  const groups=[...new Set(items.map(item=>item.cat))];
  assert.deepEqual(groups,['影像检查','其他检查','用药理由','会诊申请']);
  assert.equal(new Set(items.map(item=>item.id)).size,18,'ids are unique');
  for(const item of items){
    for(const field of ['reason','record','caution'])assert.ok(String(item[field]).length>=20,item.id+' '+field);
    assert.match(item.reason,/【[^】]+】/,item.id+' leaves blanks for the real patient');
  }
  for(const name of ['头颅 MRI','胸部 CT / CTPA','用药理由（通用）','麻醉科会诊'])assert.ok(items.some(item=>item.name===name),name);
});

test('the 特殊检查 column sits beside the chronic-condition options and grouped checkboxes start empty',()=>{
  const {m}=fixture();
  const html=m.html();
  assert.match(html,/class="supplement-pickers"/);
  assert.ok(html.indexOf('id="comorbidityPanel"')<html.indexOf('id="specialExamPanel"'));
  assert.match(html,/特殊检查（可多选）/);
  assert.equal((html.match(/data-exam="/g)||[]).length,18);
  assert.doesNotMatch(html,/data-exam="[^"]+" checked/);
});

test('choosing exams shows their boxes without stage buttons; copy includes them',async()=>{
  const f=fixture();
  f.pick('mri-head');f.pick('drug');
  assert.equal(f.side.hidden,false);
  assert.equal(f.parts['#comorbiditySelectionStatus'].textContent,'2 项已选择');
  assert.equal(f.parts['.comorbidity-stage-tabs'].hidden,true,'stage buttons are for chronic conditions only');
  const notes=f.parts['#comorbidityNotes'].innerHTML;
  assert.match(notes,/特殊检查 · 用药 · 会诊理由/);
  assert.match(notes,/头颅 MRI/);
  assert.match(notes,/用药理由（通用）/);
  assert.match(notes,/申请理由（可改用）/);
  assert.equal(f.m.boxText('x~mri-head','reason'),f.items.find(i=>i.id==='mri-head').reason);
  assert.equal(f.m.boxText('x~nope','reason'),'');
  await f.parts['#copyComorbidities'].handlers.click();
  assert.match(f.context.copied,/【头颅 MRI｜影像检查】/);
  assert.match(f.context.copied,/【用药理由（通用）｜用药理由】/);
  f.clearExams.handlers.click();
  assert.equal(f.side.hidden,true);
});
