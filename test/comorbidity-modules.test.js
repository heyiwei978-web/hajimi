import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

function fixture(){
  const controls=[],status={textContent:''},notes={innerHTML:''},copy={disabled:false,addEventListener(event,handler){this.handler=handler;}};
  const clear={addEventListener(event,handler){this.handler=handler;}};
  const panel={
    querySelectorAll(){return controls;},
    querySelector(selector){return ({
      '#comorbiditySelectionStatus':status,
      '#comorbidityNotes':notes,
      '#copyComorbidities':copy,
      '#clearComorbidities':clear
    })[selector];}
  };
  const context={window:{},document:{getElementById(id){return id==='comorbidityPanel'?panel:null;}}};
  vm.runInNewContext(fs.readFileSync(new URL('../comorbidity-modules.js',import.meta.url),'utf8'),context);
  const m=context.window.HAJIMI_COMORBIDITIES;
  for(const entry of m.modules){
    controls.push({
      dataset:{comorbidity:entry.id},checked:false,
      addEventListener(event,handler){this.handler=handler;}
    });
  }
  m.bind();
  return {m,controls,status,notes,copy,clear,choose(id){
    const input=controls.find(item=>item.dataset.comorbidity===id);
    input.checked=true;input.handler();
  }};
}

test('all eight optional conditions are shown only in a separate panel, default empty',()=>{
  const f=fixture();
  assert.deepEqual(Array.from(f.m.modules,item=>item.name),[
    '冠心病','高血压','脑梗死病史','糖尿病',
    '心力衰竭','心房颤动','慢性肾脏病','慢性阻塞性肺疾病'
  ]);
  assert.match(f.m.html(),/病历后查阅独立的慢性病补充资料/);
  assert.match(f.m.html(),/否认慢性病史/);
  assert.equal(f.copy.disabled,true);
  assert.equal(f.m.separateText(),'');
});

test('selected conditions create stage-specific standalone notes without altering record body',()=>{
  const f=fixture();f.choose('cad');f.choose('htn');
  assert.equal(f.status.textContent,'2 项已选择');
  assert.equal(f.copy.disabled,false);
  assert.match(f.notes.innerHTML,/冠心病/);
  assert.match(f.notes.innerHTML,/高血压/);
  assert.match(f.notes.innerHTML,/专科会诊申请与检查理由/);
  assert.match(f.notes.innerHTML,/心脏超声/);
  assert.match(f.m.separateText(),/独立补充模块/);
  assert.match(f.m.separateText(),/既往史/);
  const original='科别：骨科\n\n主诊断：骨折\n\n病程记录：患者否认冠心病、高血压史。\n\n医师签名：________';
  const record={department:'骨科',group:'股骨转子间骨折',short:'首次病程记录',stage:'入院',type:'病程'};
  assert.equal(f.m.compose(record,original),original);
  assert.equal(f.m.compose({...record,short:'手术记录',stage:'术中',type:'手术记录'},original),original);
  assert.equal(f.m.compose({...record,specialCase:true},original),original);
});

test('clearing the selections empties the standalone content and never changes surgical facts',()=>{
  const f=fixture();f.choose('stroke');f.choose('af');
  assert.match(f.m.separateText(),/脑梗死/);
  assert.match(f.m.separateText(),/心房颤动/);
  f.clear.handler();
  assert.deepEqual(Array.from(f.m.selected()),[]);
  assert.equal(f.copy.disabled,true);
  assert.equal(f.status.textContent,'0 项已选择');
  assert.match(f.notes.innerHTML,/尚未选择/);
});
