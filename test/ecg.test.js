import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {test} from 'node:test';

function load(){
  const context={window:{}};
  for(const file of ['ecg-data.js','ecg-waveforms.js','ecg-calculators.js']){
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

test('all three ECG drafts keep valid categories, both clinical layers and explicit review metadata',()=>{
  const data=load().HAJIMI_ECG_DATA;
  assert.equal(data.schema,1);
  assert.equal(data.entries.length,3);
  assert.deepEqual(Array.from(data.entries,entry=>entry.id).sort(),['atrial-fibrillation','hyperkalemia','pulmonary-embolism']);
  assert.equal(new Set(data.categories.map(category=>category.id)).size,7);
  for(const entry of data.entries){
    assert(data.categories.some(category=>category.id===entry.category));
    assert.equal(entry.reviewStatus,'待审核');
    assert.match(entry.updatedAt,/^\d{4}-\d{2}-\d{2}$/);
    assert(entry.basic.diagnosticPoints.length>=3);
    assert(entry.basic.differentialPoints.length>=2);
    assert.equal(typeof entry.basic.diagram.kind,'string');
    for(const field of ['timing','anesthesia','postoperative','consultation'])assert(entry.periop[field].length>15);
    assert(Array.isArray(entry.references));
    for(const reference of entry.references){assert(reference.title);assert.equal(new URL(reference.url).protocol,'https:');}
  }
  assert.equal(data.basics.steps.length,6);
});

test('ECG drawings are accessible original inline vectors with unique IDs and no external image embeds',()=>{
  const drawings=load().HAJIMI_ECG_WAVEFORMS;
  const identifiers=[];
  for(const kind of ['normal','af','hyperkalemia','pe']){
    const svg=drawings.render(kind);
    assert.match(svg,/<svg[^>]*role="img"[^>]*aria-labelledby=/);
    assert.match(svg,/<title[^>]*>.+<\/title>/);
    assert.match(svg,/<desc[^>]*>.+<\/desc>/);
    assert.match(svg,/<path/);
    assert.doesNotMatch(svg,/<(?:image|script|foreignObject)\b|\bon\w+=|\bhref=/i);
    identifiers.push(...Array.from(svg.matchAll(/\bid="([^"]+)"/g),match=>match[1]));
  }
  assert.equal(new Set(identifiers).size,identifiers.length);
  assert.equal(drawings.render('unknown'),'');
});
