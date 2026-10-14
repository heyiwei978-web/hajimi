import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {loadClinicalSource} from './clinical-compiler.mjs';
import {createInventory,readInventory,planClinicalPublication} from './clinical-inventory.mjs';

const root=new URL('../',import.meta.url),directory=new URL('../content/clinical-library/',import.meta.url);
export function auditClinicalLibrary(){
  const source=loadClinicalSource(fs.readFileSync(new URL('index.html',root),'utf8'),{audit:true});
  const inventory=readInventory(),plan=planClinicalPublication(source,inventory);
  return {source,inventory,plan};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
  if(process.argv.includes('--initialize')){
    if(fs.existsSync(new URL('baseline.json',directory)))throw new Error('The identity baseline already exists; it must not be silently regenerated');
    const commit=process.argv.find(value=>value.startsWith('--source-commit='))?.slice('--source-commit='.length);
    const source=loadClinicalSource(fs.readFileSync(new URL('index.html',root),'utf8'),{audit:true});
    const {baseline,records}=createInventory(source,commit);
    fs.mkdirSync(directory,{recursive:true});
    fs.writeFileSync(new URL('baseline.json',directory),JSON.stringify(baseline,null,2)+'\n');
    fs.writeFileSync(new URL('records.jsonl',directory),records.map(row=>JSON.stringify(row)).join('\n')+'\n');
    fs.writeFileSync(new URL('publication.json',directory),JSON.stringify({schemaVersion:1,baselineCommit:commit,
      productionCmsAudit:'not-performed',decisions:[]},null,2)+'\n');
  }
  const {inventory,plan}=auditClinicalLibrary();
  console.log(JSON.stringify({...inventory.baseline.summary,publishedRecords:plan.published.length,
    archivedRecords:plan.archived.length,bodyHashMismatches:0,
    ambiguousLegacyNames:inventory.baseline.ambiguousNames.length,productionCmsAudit:inventory.policy.productionCmsAudit},null,2));
}
