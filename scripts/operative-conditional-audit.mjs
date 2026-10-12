import fs from 'node:fs';
import {loadClinicalSource} from './clinical-compiler.mjs';

// Read-only audit: summaries contain disease/record metadata, never patient
// identifiers, full surgical narratives, incision details or laboratory values.
const html = fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const {records} = loadClinicalSource(html);
const findings = [];
let surgeries=0,modelSurgeries=0,conditionallyWritten=0;
const matchers = [
  ['IF',/如果|假如|若|如需|如见|如采用/g],
  ['OPTIONAL',/必要时|可采用|可选择|可考虑|视情况|按需/g],
  ['ALTERNATIVES',/采用[^；。\n]{2,60}或[^；。\n]{2,60}/g],
  ['UNCONFIRMED_PROMPT',/【[^】]{0,100}(?:待核实|据实填写|按实际|实际手术)[^】]{0,100}】/g]
];
for(const record of records) {
  if(record.department!=='骨科'||record.type!=='手术记录'||!/手术记录/.test(record.short||''))continue;
  surgeries++;
  if(record.idealCase===true&&!record.specialCase)modelSurgeries++;
  const full=String(record.sourceBody||'');
  const surgery=full.match(/手术经过[：:]\s*\n([\s\S]*?)(?=\n\n(?:术后计划|术后医嘱|术后处理|术者签名|手术者签名)[：:]|$)/)?.[1] || '';
  if(!surgery)continue;
  const categories = {};
  for(const [key,pattern] of matchers) {
    pattern.lastIndex=0;
    const hits = [...surgery.matchAll(pattern)];
    if(hits.length)categories[key]=hits.length;
  }
  if(Object.keys(categories).length) {
    conditionallyWritten++;
    findings.push({
      department:record.department,group:record.group,
      document:record.short,
      source:record.specialCase?'special-case':record.idealCase?'model-example':'other',
      categories
    });
  }
}
const totalByCategory = {};
for(const item of findings)for(const [type,count] of Object.entries(item.categories)){
  totalByCategory[type]=(totalByCategory[type]||0)+count;
}
console.log(JSON.stringify({
  scope:'Orthopedic completed-operation narratives only',
  totalOperativeRecords:surgeries,
  modelExamples:modelSurgeries,
  recordsRequiringReview:conditionallyWritten,
  totalByCategory,
  caveat:'Matches are editorial flags, not proof that clinical decisions were incorrect. Special cases were not modified.',
  findings:process.argv.includes('--detail')?findings.slice(0,200):undefined
},null,2));
