import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

function element(extra={}){
  return {
    hidden:false,disabled:false,textContent:'',innerHTML:'',isConnected:true,dataset:{},attrs:{},handlers:{},
    classList:{set:new Set(),toggle(name,on){on?this.set.add(name):this.set.delete(name);},contains(name){return this.set.has(name);}},
    setAttribute(name,value){this.attrs[name]=String(value);},
    addEventListener(event,handler){this.handlers[event]=handler;},
    focus(){},
    ...extra
  };
}

function fixture(){
  const source=fs.readFileSync(new URL('../comorbidity-modules.js',import.meta.url),'utf8');
  const context={window:{},navigator:{clipboard:{writeText:async value=>{context.copied=value;}}}};
  vm.runInNewContext(source,context);
  const m=context.window.HAJIMI_COMORBIDITIES;
  const controls=m.modules.map(entry=>element({dataset:{comorbidity:entry.id},checked:false}));
  const tabs=m.stages.map(stage=>element({dataset:{comorbidityStage:stage.id}}));
  const workspace=element();
  const parts={
    '#comorbidityNotes':element(),'#comorbiditySelectionStatus':element(),'#copyComorbidities':element(),
    '#comorbidityFollowText':element(),'#comorbidityFollow':element(),'#closeComorbiditySide':element(),
    '#comorbiditySideTitle':element()
  };
  const side=element({
    closest:()=>workspace,
    querySelector:selector=>parts[selector],
    querySelectorAll:()=>tabs
  });
  const clear=element();
  const panel=element({querySelectorAll:()=>controls,querySelector:selector=>selector==='#clearComorbidities'?clear:null});
  const fab=element(),fabCount=element();
  const ids={comorbidityPanel:panel,comorbiditySide:side,openComorbiditySide:fab,comorbidityFabCount:fabCount};
  context.document={getElementById:id=>ids[id]||null};
  m.bind();
  return {m,context,controls,tabs,workspace,side,fab,fabCount,clear,
    notes:parts['#comorbidityNotes'],status:parts['#comorbiditySelectionStatus'],copy:parts['#copyComorbidities'],
    followText:parts['#comorbidityFollowText'],followButton:parts['#comorbidityFollow'],
    choose(id){const input=controls.find(item=>item.dataset.comorbidity===id);input.checked=true;input.handlers.change();},
    tab(id){tabs.find(item=>item.dataset.comorbidityStage===id).handlers.click();}};
}

test('eight optional conditions are offered above the record; side panel stays hidden until one is chosen',()=>{
  const f=fixture();
  assert.deepEqual(Array.from(f.m.modules,item=>item.name),[
    '冠心病','高血压','脑梗死病史','糖尿病',
    '心力衰竭','心房颤动','慢性肾脏病','慢性阻塞性肺疾病'
  ]);
  assert.match(f.m.html(),/合并慢性病（可多选）/);
  assert.match(f.m.html(),/否认慢性病史/);
  assert.equal((f.m.html().match(/data-comorbidity="/g)||[]).length,8);
  assert.match(f.m.sideHtml(),/id="comorbiditySide"[^>]*hidden/);
  assert.equal(f.side.hidden,true);
  assert.equal(f.fab.hidden,true);
  assert.equal(f.workspace.classList.contains('has-comorbidity-side'),false);
  assert.equal(f.copy.disabled,true);
  assert.equal(f.m.separateText(),'');
});

test('choosing conditions shows the side panel with boxes for the chapter being read',()=>{
  const f=fixture();f.choose('cad');f.choose('dm');
  assert.equal(f.side.hidden,false);
  assert.equal(f.workspace.classList.contains('has-comorbidity-side'),true);
  assert.equal(f.fab.hidden,false);
  assert.equal(f.fabCount.textContent,'2');
  assert.equal(f.status.textContent,'2 项已选择');
  assert.equal(f.copy.disabled,false);
  assert.match(f.notes.innerHTML,/冠心病/);
  assert.match(f.notes.innerHTML,/糖尿病/);
  assert.match(f.notes.innerHTML,/入院记录与既往史/);
  assert.doesNotMatch(f.notes.innerHTML,/术后病程与监测/);

  f.m.setChapter({stage:'术前',title:'术前小结'});
  assert.equal(f.m.stage(),'preop');
  assert.match(f.notes.innerHTML,/术前查房、术前小结及风险评估/);
  assert.match(f.notes.innerHTML,/专科会诊申请与检查理由/);
  assert.match(f.notes.innerHTML,/心脏超声/);
  assert.match(f.followText.textContent,/术前小结/);

  f.m.setChapter({stage:'术中',title:'手术记录'});
  assert.equal(f.m.stage(),'preop');
  f.m.setChapter({stage:'术后',title:'术后首次病程记录'});
  assert.equal(f.m.stage(),'postop');
  assert.match(f.notes.innerHTML,/术后病程与监测/);
  f.m.setChapter({stage:'术后',title:'出院记录'});
  assert.equal(f.m.stage(),'discharge');
  assert.match(f.notes.innerHTML,/出院当天查房及随访/);
});

test('manual stage tabs stop following until the reader asks to follow again',()=>{
  const f=fixture();f.choose('htn');
  f.tab('all');
  assert.equal(f.m.stage(),'all');
  assert.equal(f.followButton.hidden,false);
  for(const title of ['入院记录与既往史','术前查房、术前小结及风险评估','专科会诊申请与检查理由','术后病程与监测','出院当天查房及随访'])
    assert.ok(f.notes.innerHTML.includes(title),title);
  f.m.setChapter({stage:'术后',title:'术后病程'});
  assert.equal(f.m.stage(),'all','manual choice is kept while reading');
  f.followButton.handlers.click();
  assert.equal(f.m.stage(),'postop');
  assert.equal(f.followButton.hidden,true);
});

test('box copy returns only that paragraph; full copy stays a separate module',async()=>{
  const f=fixture();f.choose('stroke');
  assert.equal(f.m.boxText('stroke','history'),f.m.modules.find(item=>item.id==='stroke').history);
  assert.equal(f.m.boxText('stroke','nope'),'');
  await f.copy.handlers.click();
  assert.match(f.context.copied,/【脑梗死病史｜独立补充模块】/);
  assert.match(f.status.textContent,/已复制 1 项/);
});

test('the sample record text is never rewritten by the supplements',()=>{
  const f=fixture();f.choose('cad');f.choose('htn');
  const original='科别：骨科\n\n主诊断：骨折\n\n病程记录：患者否认冠心病、高血压史。\n\n医师签名：________';
  const record={department:'骨科',group:'股骨转子间骨折',short:'首次病程记录',stage:'入院',type:'病程'};
  assert.equal(f.m.compose(record,original),original);
  assert.equal(f.m.compose({...record,short:'手术记录',stage:'术中',type:'手术记录'},original),original);
  assert.equal(f.m.compose({...record,specialCase:true},original),original);
});

test('clearing the selections hides the panel again',()=>{
  const f=fixture();f.choose('stroke');f.choose('af');
  f.clear.handlers.click();
  assert.deepEqual(Array.from(f.m.selected()),[]);
  assert.equal(f.side.hidden,true);
  assert.equal(f.fab.hidden,true);
  assert.equal(f.copy.disabled,true);
  assert.equal(f.status.textContent,'0 项已选择');
  assert.match(f.notes.innerHTML,/尚未选择/);
});

test('medical supplement text is escaped when rendered',()=>{
  const f=fixture();f.choose('ckd');
  assert.doesNotMatch(f.m.renderSelected('all'),/<script/i);
});

test('a newly opened record follows its chapters again and boxes are not rebuilt within one stage',()=>{
  const f=fixture();f.choose('dm');
  f.tab('all');
  assert.equal(f.m.stage(),'all');
  f.m.setChapter({stage:'术后',title:'术后病程'});
  f.m.bind();
  assert.equal(f.m.stage(),'postop');
  f.notes.innerHTML='SENTINEL';
  f.m.setChapter({stage:'术后',title:'术后主刀查房记录'});
  assert.equal(f.notes.innerHTML,'SENTINEL','same stage and selection keep existing boxes');
  f.m.setChapter({stage:'入院',title:'入院记录'});
  assert.match(f.notes.innerHTML,/入院记录与既往史/);
});

test('three-day workup sections follow the admission and pre-operative chapters in reading order',()=>{
  const f=fixture();f.choose('cad');
  const order=[
    ['入院','入院记录','admission'],['入院','主治医师首次查房记录','day1'],['入院','主任医师首次查房记录','day2'],
    ['术前','选择治疗方案沟通记录','day2'],['术前','术前主刀查房','day2'],['术前','多学科术前讨论','consultRecord'],
    ['术前','手术知情同意记录','day3'],['术前','麻醉术前访视记录','day3'],['术前','术前小结','preop']
  ];
  for(const [stage,title,expected] of order){
    f.m.setChapter({stage,title});
    assert.equal(f.m.stage(),expected,title);
  }
  f.m.setChapter({stage:'入院',title:'主治医师首次查房记录'});
  assert.match(f.notes.innerHTML,/入院第1天 · 主治医师查房（完善检查）/);
  assert.match(f.notes.innerHTML,/患者既往冠心病病史/);
  f.m.setChapter({stage:'入院',title:'主任医师首次查房记录'});
  assert.match(f.notes.innerHTML,/第2天 · 检查结果回报及会诊申请/);
  assert.match(f.notes.innerHTML,/请【内科\/麻醉科】会诊/);
  f.m.setChapter({stage:'术前',title:'多学科术前讨论'});
  assert.match(f.notes.innerHTML,/会诊记录（内科\/麻醉科）/);
  assert.match(f.notes.innerHTML,/会诊意见/);
  f.m.setChapter({stage:'术前',title:'麻醉术前访视记录'});
  assert.match(f.notes.innerHTML,/第3天 · 根据会诊意见调整（查房记录）/);
});

test('workup templates insert only the condition name and leave blanks; full copy keeps timeline order',()=>{
  const f=fixture();f.choose('stroke');
  const day1=f.m.boxText('stroke','day1Round');
  assert.match(day1,/患者既往脑梗死病史/);
  assert.doesNotMatch(day1,/病史病史/);
  assert.match(day1,/【检查项目】/);
  const text=f.m.separateText();
  const positions=['入院记录与既往史','入院第1天','第2天','会诊记录（内科/麻醉科）','第3天','术前查房','专科会诊申请','术后病程与监测','出院当天查房'].map(title=>text.indexOf(title));
  assert.ok(positions.every(index=>index>=0),'every section is copied');
  assert.deepEqual([...positions].sort((a,b)=>a-b),positions,'sections follow the inpatient timeline');
  assert.match(text,/【脑梗死病史｜独立补充模块】/);
});

test('original eight-condition text is unchanged',()=>{
  const source=fs.readFileSync(new URL('../comorbidity-modules.js',import.meta.url),'utf8');
  const data=source.split('\n').slice(0,53).join('\n')+'\n';
  assert.equal(crypto.createHash('sha256').update(data).digest('hex'),'1a4dc7dda37da09fe013ead422c72cd0004504a4f8c09d6ef6489259eaa4d073');
});

test('a merged admission round chapter maps by its first record name',()=>{
  const f=fixture();f.choose('dm');
  f.m.setChapter({stage:'入院',title:'入院查房记录',record:'主治医师首次查房记录'});
  assert.equal(f.m.stage(),'day1');
  assert.match(f.followText.textContent,/入院查房记录/);
});
