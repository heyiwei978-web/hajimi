import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

function fixture(){
  const controls=[],status={textContent:''},clear={addEventListener(event,handler){this.handler=handler;}};
  const panel={
    querySelectorAll(){return controls;},
    querySelector(selector){return selector==='#comorbiditySelectionStatus'?status:clear;}
  };
  const context={
    window:{},
    document:{getElementById(id){return id==='comorbidityPanel'?panel:null;}}
  };
  vm.runInNewContext(fs.readFileSync(new URL('../comorbidity-modules.js',import.meta.url),'utf8'),context);
  const m=context.window.HAJIMI_COMORBIDITIES;
  for(const entry of m.modules){
    controls.push({
      dataset:{comorbidity:entry.id},checked:false,
      addEventListener(event,handler){this.handler=handler;}
    });
  }
  let refreshes=0;m.bind(()=>{refreshes++;});
  return {m,controls,status,clear,refreshes:()=>refreshes,choose(id){
    const input=controls.find(item=>item.dataset.comorbidity===id);
    input.checked=true;input.handler();
  }};
}

const base={department:'骨科',group:'股骨转子间骨折'};

test('eight chronic diseases appear as explicit opt-in, and no selection preserves source text',()=>{
  const f=fixture();
  assert.deepEqual(Array.from(f.m.modules,item=>item.name),['冠心病','高血压','脑梗死病史','糖尿病','心力衰竭','心房颤动','慢性肾脏病','慢性阻塞性肺疾病']);
  const original='主诊断：右股骨转子间骨折\n\n病程记录：今日查房。\n\n医师签名：________';
  assert.equal(f.m.compose({...base,short:'主任医师首次查房记录',stage:'入院',type:'查房'},original),original);
  assert.match(f.m.html(),/可选|勾选患者已确诊的慢性病/);
});

test('selected conditions apply to relevant chapters, preserve original note and signature format',()=>{
  const f=fixture();f.choose('cad');f.choose('htn');
  assert.equal(f.status.textContent,'2 项已选择');assert.equal(f.refreshes(),2);
  const admission=f.m.compose({...base,short:'入院记录',stage:'入院',type:'入院记录'},'原始入院正文');
  assert.match(admission,/冠心病/);assert.match(admission,/高血压/);assert.match(admission,/原始入院正文/);
  const discuss=f.m.compose({...base,short:'多学科术前讨论',stage:'术前',type:'术前讨论'},'术前原文');
  assert.match(discuss,/心脏超声/);assert.match(discuss,/心内科/);
  const note='科别：骨科\n\n主诊断：骨折\n\n病程记录：患者术后一般情况平稳。\n\n医师签名：________';
  const composed=f.m.compose({...base,short:'术后第1天病程',stage:'术后',type:'病程'},note);
  assert.match(composed,/病程记录：患者术后一般情况平稳。 合并慢性病评估与处理/);
  assert.ok(composed.endsWith('\n\n医师签名：________'));
  assert.equal(composed.split('\n\n').length,4,'progress note paragraph structure changed');
  assert.equal(note,'科别：骨科\n\n主诊断：骨折\n\n病程记录：患者术后一般情况平稳。\n\n医师签名：________','original record mutated');
});

test('surgical, consent, special case, scenario and other departments remain untouched',()=>{
  const f=fixture();f.choose('stroke');
  for(const record of [
    {...base,short:'手术记录',stage:'术中',type:'手术记录'},
    {...base,short:'手术知情同意书',stage:'术前',type:'同意书'},
    {...base,short:'出院当天查房记录',stage:'术后',type:'查房',specialCase:true},
    {...base,group:'通用场景',short:'内科会诊',stage:'术前',type:'会诊'},
    {...base,department:'普外科',short:'术前查房',stage:'术前',type:'查房'}
  ])assert.equal(f.m.compose(record,'原始不变'),'原始不变');
  f.clear.handler();
  assert.deepEqual(f.m.selected(),[]);assert.equal(f.refreshes(),2);
});
