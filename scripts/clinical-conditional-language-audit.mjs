import fs from 'node:fs';
import {loadClinicalSource} from './clinical-compiler.mjs';

// A coarse editorial inventory, not a clinical diagnosis or an auto-rewriter.
// Conditions can be appropriate in consent/pre-op plans but misleading inside
// retrospective descriptions of surgery or treatment already completed.
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const {records}=loadClinicalSource(html);
const keywords=/如果|假如|若|必要时|如需|如见|如采用|可采用|可选择|可考虑|视情况|按需/g;
const bucket=(record)=>{
  const name=String(record.short||'');
  if(/手术记录/.test(name)&&record.type==='手术记录')return 'A. 已完成手术记录：重点审查';
  if(/术后.*(?:病程|查房)|出院.*(?:查房|小结)/.test(name))return 'B. 已发生术后/出院事实：审查';
  if(/术前讨论|选择治疗方案|知情同意|沟通记录|术前小结/.test(name))return 'C. 术前预案/知情沟通：可以合理出现';
  return 'D. 其他文书：按语境判别';
};
const stats = {};
let recordsWithTerms=0,occurrences=0;
for(const record of records){
  if(record.department!=='骨科'||typeof record.sourceBody!=='string')continue;
  const matches=[...record.sourceBody.matchAll(keywords)];
  if(!matches.length)continue;
  recordsWithTerms++;
  occurrences+=matches.length;
  const key=bucket(record);
  if(!stats[key])stats[key]={records:0,matches:0,byDocumentType:{}};
  stats[key].records++;
  stats[key].matches+=matches.length;
  const type=String(record.type||'其他');
  stats[key].byDocumentType[type]=(stats[key].byDocumentType[type]||0)+1;
}
console.log(JSON.stringify({
  scope:'Orthopedics; all document categories; keyword only',
  recordsWithTerms,occurrences,
  note:'These are editorial keyword matches. They do NOT prove the underlying chart is inaccurate. Do not mass-delete conditional clauses.',
  buckets:stats
},null,2));
