import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {test} from 'node:test';

function load(){
  const context={window:{}};
  for(const file of ['ecg-data.js','ecg-cases-data.js','ecg-basics-data.js','ecg-periop-data.js','ecg-book-data.js','ecg-book-data-2.js','ecg-book-data-3.js','ecg-waveforms.js','ecg-calculators.js']){
    runInNewContext(readFileSync(new URL('../'+file,import.meta.url),'utf8'),context,{filename:file});
  }
  return context.window;
}

test('ECG formulas use milliseconds and return independently known QTc and heart-rate results',()=>{
  const calculator=load().HAJIMI_ECG_CALCULATORS;
  for(const [rr,rate] of [[1000,60],[800,75],[500,120],[2000,30]])assert.equal(calculator.heartRate(rr),rate);
  for(const [qt,rr,bazett,fridericia] of [[400,1000,400,400],[400,800,447.2135955,430.8869380],[400,2000,282.8427125,317.4802104]]){
    const result=calculator.qtc(qt,rr);
    assert(Math.abs(result.bazett-bazett)<0.000001);
    assert(Math.abs(result.fridericia-fridericia)<0.000001);
    assert.equal(result.rrSeconds,rr/1000);
  }
  assert.equal(calculator.heartRate('800'),75);
});

test('ECG calculations reject missing, nonpositive and nonfinite input instead of producing misleading results',()=>{
  const calculator=load().HAJIMI_ECG_CALCULATORS;
  for(const value of ['', ' ',0,-1,'not-a-number',null,undefined,NaN,Infinity,true]){
    assert.throws(()=>calculator.heartRate(value));
    assert.throws(()=>calculator.qtc(value,1000));
    assert.throws(()=>calculator.qtc(400,value));
  }
  assert.throws(()=>calculator.heartRate(Number.MIN_VALUE));
  assert.throws(()=>calculator.qtc(Number.MAX_VALUE,Number.MIN_VALUE));
});

test('all ECG atlas drafts keep valid categories, both clinical layers and explicit review metadata',()=>{
  const window=load(),data=window.HAJIMI_ECG_DATA;
  assert.equal(data.schema,1);
  assert.equal(data.entries.length,80);
  const ids=Array.from(data.entries,entry=>entry.id);
  assert.equal(new Set(ids).size,ids.length,'entry ids are unique');
  for(const id of ['atrial-fibrillation','hyperkalemia','pulmonary-embolism','stemi','complete-heart-block','ventricular-pacing'])assert(ids.includes(id));
  assert.equal(new Set(data.categories.map(category=>category.id)).size,8);
  for(const category of data.categories)assert(data.entries.some(entry=>entry.category===category.id),'category '+category.id+' has at least one entry');
  for(const scenario of data.periop.scenarios)if(scenario.entry)assert(ids.includes(scenario.entry),'scenario links to an existing entry');
  for(const entry of data.entries){
    assert(data.categories.some(category=>category.id===entry.category));
    assert.equal(entry.reviewStatus,'待审核');
    assert.match(entry.updatedAt,/^\d{4}-\d{2}-\d{2}$/);
    assert(entry.basic.diagnosticPoints.length>=3);
    assert(entry.basic.differentialPoints.length>=2);
    assert.equal(typeof entry.basic.diagram.kind,'string');
    assert(window.HAJIMI_ECG_WAVEFORMS.render(entry.basic.diagram.kind).startsWith('<svg'),'diagram exists for '+entry.id);
    assert(entry.title&&entry.basic.summary&&entry.aliases.length>0);
    for(const field of ['timing','anesthesia','postoperative','consultation'])assert(entry.periop[field].length>15);
    assert(Array.isArray(entry.references));
    assert(entry.references.length>=1,'every entry cites at least one source: '+entry.id);
    assert(['high','medium','low'].includes(entry.risk),'risk level for '+entry.id);
    for(const id of entry.related||[])assert(ids.includes(id),'related entry exists: '+entry.id+' -> '+id);
    if(entry.basic.criteria)for(const row of entry.basic.criteria){assert.equal(row.length,2);assert(row[0]&&row[1]);}
    for(const reference of entry.references){assert(reference.title);assert.equal(new URL(reference.url).protocol,'https:');}
  }
  assert.equal(data.basics.steps.length,6);
});

test('ECG drawings are accessible original inline vectors with unique IDs and no external image embeds',()=>{
  const window=load(),drawings=window.HAJIMI_ECG_WAVEFORMS;
  const identifiers=[];
  for(const kind of ['normal',...new Set(window.HAJIMI_ECG_DATA.entries.map(entry=>entry.basic.diagram.kind))]){
    const svg=drawings.render(kind);
    assert.match(svg,/<svg[^>]*role="img"[^>]*aria-labelledby=/);
    assert.match(svg,/<title[^>]*>.+<\/title>/);
    assert.match(svg,/<desc[^>]*>.+<\/desc>/);
    assert.match(svg,/<path/);
    assert.doesNotMatch(svg,/NaN|undefined/);
    assert.doesNotMatch(svg,/<(?:image|script|foreignObject)\b|\bon\w+=|\bhref=/i);
    identifiers.push(...Array.from(svg.matchAll(/\bid="([^"]+)"/g),match=>match[1]));
  }
  assert.equal(new Set(identifiers).size,identifiers.length);
  assert.equal(drawings.render('unknown'),'');
});

test('perioperative topic links only to existing entries and cites https sources',()=>{
  const data=load().HAJIMI_ECG_DATA,ids=new Set(data.entries.map(entry=>entry.id)),P=data.periop;
  assert(P.indications.points.length>=4);
  assert(P.abnormal.length>=15);
  for(const item of P.abnormal){assert(['proceed','evaluate','postpone'].includes(item.level));assert(ids.has(item.entry),item.entry);}
  for(const item of P.anesthesia){assert(item.title&&item.context&&item.ecg&&item.response);if(item.link)assert(ids.has(item.link),item.link);}
  assert(P.postopFlow.length>=5);
  assert(P.injury.rows.length>=4);
  for(const ref of P.references)assert.equal(new URL(ref.url).protocol,'https:');
});

test('new ECG calculators: four QTc formulas, frontal axis, grid conversion and rate estimates',()=>{
  const C=load().HAJIMI_ECG_CALCULATORS;
  const q=C.qtc(400,800);
  assert(Math.abs(q.framingham-430.8)<1e-9);
  assert(Math.abs(q.hodges-426.25)<1e-9);
  const atRate60=C.qtc(400,1000);for(const key of ['bazett','fridericia','framingham','hodges'])assert(Math.abs(atRate60[key]-400)<1e-9);
  for(const [i,f,deg,label] of [[5,0,0,'正常'],[0,5,90,'正常'],[5,-5,-45,'左偏'],[-5,5,135,'右偏'],[-5,-5,-135,'极度'],[5,-2.9,-30,'正常']]){
    const r=C.axis(i,f);assert.equal(r.degrees,deg);assert.match(r.category,new RegExp(label));
  }
  assert.throws(()=>C.axis(0,0));assert.throws(()=>C.axis('',3));assert.throws(()=>C.axis('x',3));
  assert.equal(C.boxesToMs(5,25),200);assert.equal(C.boxesToMs(5,50),100);
  assert.equal(C.mmToMv(10,10),1);assert.equal(C.mmToMv(10,5),2);assert.equal(C.mmToMv(-3,10),-0.3);
  assert.equal(C.heartRateFromBoxes(20,25),75);assert.equal(C.heartRateFromBoxes(40,50),75);
  assert.equal(C.heartRateSixSecond(8),80);assert.throws(()=>C.heartRateSixSecond(7.5));assert.throws(()=>C.boxesToMs(0));
});
test('basics data covers electrodes, reversals, axis, intervals and artifacts with drawable sketches',()=>{
  const window=load(),B=window.HAJIMI_ECG_DATA.basics,W=window.HAJIMI_ECG_WAVEFORMS;
  assert(B.electrodes.chest.length>=4&&B.electrodes.reversals.length>=5);
  assert.equal(B.axisGuide.ranges.length,4);
  assert(B.intervals.length>=6);
  for(const item of B.artifacts)assert(W.render(item.kind).startsWith('<svg'),item.kind);
  assert(W.render('lead-reversal').startsWith('<svg'));
  const svg=W.electrodes();assert.match(svg,/role="img"/);for(const lead of ['V1','V2','V3','V4','V5','V6'])assert(svg.includes('>'+lead+'<'));
  for(const ref of B.references)assert.equal(new URL(ref.url).protocol,'https:');
});

test('practice cases have four options, a valid answer, a sketch, a report and a working link',()=>{
  const window=load(),data=window.HAJIMI_ECG_DATA,ids=new Set(data.entries.map(entry=>entry.id));
  assert(data.cases.length>=12);
  assert.equal(new Set(data.cases.map(item=>item.id)).size,data.cases.length);
  for(const item of data.cases){
    assert.equal(item.options.length,4,item.id);
    assert(Number.isInteger(item.answer)&&item.answer>=0&&item.answer<4,item.id);
    assert(window.HAJIMI_ECG_WAVEFORMS.render(item.kind).startsWith('<svg'),item.kind);
    assert(item.vignette&&item.question&&item.explanation.length>40&&item.report,item.id);
    assert(item.link?item.link.url.startsWith('/ecg/'):ids.has(item.entry),item.id);
  }
  const answers=data.cases.map(item=>item.answer);assert(new Set(answers).size>=3,'answers are not all in the same position');
  assert(data.report.structure.length>=6&&data.report.rules.length>=4&&data.report.sample.conclusion.length>=2);
});

test('textbook batch: new entries, textbook citations, per-lead normals and phenomena are complete',()=>{
  const window=load(),data=window.HAJIMI_ECG_DATA,W=window.HAJIMI_ECG_WAVEFORMS,ids=new Set(data.entries.map(entry=>entry.id));
  for(const id of ['left-atrial-abnormality','right-atrial-abnormality','premature-atrial-contractions','premature-junctional-contractions','congenital-long-qt','short-qt','cpvt','left-posterior-fascicular-block','dextrocardia','low-voltage-effusion'])assert(ids.has(id),id);
  assert.match(data.textbook.title,/黄宛临床心电图学/);
  const cited=data.entries.filter(entry=>entry.textbook);
  assert(cited.length>=17);
  for(const entry of cited){assert.match(entry.textbook.chapter,/^第 \d+ 章/);assert.match(entry.textbook.pages,/^\d/);}
  assert(data.basics.textbookNormals.rows.length>=12);
  for(const row of data.basics.textbookNormals.rows)assert.equal(row.length,2);
  assert(data.basics.qrsNaming.length>=4);
  assert.equal(data.phenomena.items.length,11);
  assert.equal(new Set(data.phenomena.items.map(item=>item.id)).size,11);
  for(const item of data.phenomena.items){assert(item.title&&item.definition.length>20&&item.significance.length>20);assert(item.ecg.length>=1);}
  for(const kind of ['lae','rae','pac','pjc','lqts','sqts','cpvt','lpfb','dextrocardia','low-voltage'])assert(W.render(kind).startsWith('<svg'),kind);
  const lvh=data.entries.find(entry=>entry.id==='left-ventricular-hypertrophy');
  assert(lvh.basic.criteria.some(([name])=>name.includes('教材')));
});

test('textbook batch 7: arrhythmia chapters add entries, sketches and chapter citations without duplicating related links',()=>{
  const window=load(),data=window.HAJIMI_ECG_DATA,W=window.HAJIMI_ECG_WAVEFORMS,ids=new Set(data.entries.map(entry=>entry.id));
  const added=['sinoatrial-block','wandering-pacemaker','lgl-short-pr','mahaim','avrt','narrow-complex-tachycardia','idiopathic-vt','ventricular-flutter','nonparoxysmal-junctional-tachycardia','pjrt','sinus-node-reentry'];
  for(const id of added)assert(ids.has(id),id);
  for(const kind of ['sa-block','wandering','short-pr','mahaim','avrt','rvot-vt','vflutter','npjt','pjrt'])assert(W.render(kind).startsWith('<svg'),kind);
  for(const id of ['atrial-fibrillation','atrial-flutter','pre-excitation','wide-complex-tachycardia','ventricular-tachycardia','mobitz-i','complete-heart-block','svt','junctional-rhythm'])assert.match(data.entries.find(entry=>entry.id===id).textbook.chapter,/^第 1[3-9]|^第 2[01]/,id);
  for(const entry of data.entries){assert(!(entry.related||[]).includes(entry.id),entry.id);assert.equal(new Set(entry.related||[]).size,(entry.related||[]).length,entry.id);}
  const wct=data.entries.find(entry=>entry.id==='wide-complex-tachycardia');
  assert(wct.basic.criteria.some(([name])=>name.includes('Brugada')));
  assert(wct.basic.criteria.some(([name])=>name.includes('aVR')));
});

test('textbook batch 8: infarction, ischemia, pulmonary embolism and drug/electrolyte chapters',()=>{
  const window=load(),data=window.HAJIMI_ECG_DATA,W=window.HAJIMI_ECG_WAVEFORMS,ids=new Set(data.entries.map(entry=>entry.id));
  for(const id of ['mi-evolution','variant-angina','ventricular-aneurysm','pseudo-infarct-q','cns-t-waves','exercise-test','antiarrhythmic-drug-effects'])assert(ids.has(id),id);
  for(const kind of ['mi-evolution','variant-angina','aneurysm','pseudo-q','cns-t','exercise','antiarrhythmic'])assert(W.render(kind).startsWith('<svg'),kind);
  for(const id of ['stemi','old-mi','pulmonary-embolism','hyperkalemia','hypokalemia','calcium-disorders','digoxin-effect','nste-ischemia'])assert.match(data.entries.find(entry=>entry.id===id).textbook.chapter,/^第 [4569] 章/,id);
  const pe=data.entries.find(entry=>entry.id==='pulmonary-embolism');
  assert(pe.basic.criteria.some(([name])=>name.includes('21 分')));
});
