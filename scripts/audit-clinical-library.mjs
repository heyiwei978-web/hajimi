import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {loadClinicalSource,loadBuildSource} from './clinical-compiler.mjs';
import {CLINICAL_SOURCE_DIR,loadClinicalJsonSource} from './clinical-source.mjs';
import {fail,readInventory,planClinicalPublication} from './clinical-inventory.mjs';
import {applyClinicalUpdate,persistClinicalRevision,proposeClinicalUpdate} from './clinical-updates.mjs';

const root=new URL('../',import.meta.url),directory=new URL('../content/clinical-library/',import.meta.url);
export function auditClinicalLibrary(){
  const source=loadBuildSource(fs.readFileSync(new URL('index.html',root),'utf8'));
  const inventory=readInventory(),plan=planClinicalPublication(source,inventory);
  return {source,inventory,plan};
}
const execute=promisify(execFile);
async function git(args){
  return (await execute('git',args,{cwd:fileURLToPath(root),encoding:'utf8',maxBuffer:16*1024*1024,timeout:30000})).stdout;
}
async function previousSource(commit){
  if(!/^[a-f0-9]{40}$/.test(commit))fail('source-commit must be a full previous approved Git commit');
  // Commits after the JSON migration hold the flat per-disease source.
  const index=await git(['show',commit+':'+CLINICAL_SOURCE_DIR+'index.json']).catch(()=>null);
  if(index!==null){
    const names=[...JSON.parse(index).files,'legacy-rendered.json'],files=new Map([['index.json',index]]),code=new Map();
    for(const name of names){
      if(!/^[a-z]+\/[^/]+\.json$|^legacy-rendered\.json$/.test(name)||name.includes('..'))fail('invalid historical source path');
      files.set(name,await git(['show',commit+':'+CLINICAL_SOURCE_DIR+name]));
    }
    for(const file of ['search-core.js','app.js'])code.set(file,await git(['show',commit+':'+file]));
    return loadClinicalJsonSource({audit:true,read:name=>{if(!files.has(name))fail('missing historical source');return files.get(name);},readSource:file=>code.get(file)});
  }
  const html=await git(['show',commit+':index.html']),cache=new Map();
  const files=[...html.matchAll(/<script\s+[^>]*?src="\/([^?"]+)(?:\?[^"]*)?"/g)].map(match=>match[1]);
  for(let start=0;start<files.length;start+=8)await Promise.all(files.slice(start,start+8).map(async file=>{
    if(!/^[a-zA-Z0-9._/-]+$/.test(file)||file.split('/').includes('..'))fail('invalid historical source path');
    cache.set(file,await git(['show',commit+':'+file]));
  }));
  return loadClinicalSource(html,{audit:true,readSource:file=>{if(!cache.has(file))fail('missing historical source');return cache.get(file);}});
}
export function parseClinicalAuditOptions(args){
  const result={},values=new Set(['apply-update','output','source-commit','authorize','reviewed-by','reason','review-reference']);
  for(let i=0;i<args.length;i++){
    const [flag,...parts]=args[i].split('='),key=flag.slice(2);
    if(key==='initialize')fail('identity ledger reinitialization is disabled; restore the original files from Git');
    if(!flag.startsWith('--')||Object.hasOwn(result,key))fail('unknown or duplicate argument: '+flag);
    if(key==='propose-update'&&!parts.length){result[key]=true;continue;}
    if(!values.has(key))fail('unknown argument: '+flag);
    const value=parts.length?parts.join('='):args[++i];
    if(!value||value.startsWith('--'))fail('missing value: '+flag);
    result[key]=value;
  }
  if(result['apply-update']&&result['propose-update'])fail('choose preview or apply, not both');
  return result;
}
async function main(args){
  const opts=parseClinicalAuditOptions(args);
  if(opts['propose-update']||opts['apply-update']){
    const inventory=readInventory(),commit=opts['source-commit']||(opts['apply-update']
      ?JSON.parse(fs.readFileSync(opts['apply-update'],'utf8')).sourceCommit:(await git(['rev-parse','HEAD'])).trim());
    const previous=await previousSource(commit);
    const source=loadBuildSource(fs.readFileSync(new URL('index.html',root),'utf8'));
    if(opts['propose-update']){
      if(!opts.output)fail('preview requires --output to a private local JSON file outside the repository');
      const output=path.join(fs.realpathSync(path.dirname(path.resolve(opts.output))),path.basename(opts.output));
      const relative=path.relative(fs.realpathSync(root),output);
      if(!relative.startsWith('..'+path.sep)&&!path.isAbsolute(relative))fail('keep medical review proposals outside the repository and public resources');
      const proposal=proposeClinicalUpdate(source,previous,inventory,{sourceCommit:commit});
      fs.writeFileSync(output,JSON.stringify(proposal,null,2)+'\n',{flag:'wx',mode:0o600});
      console.log(JSON.stringify({proposalHash:proposal.proposalHash,updates:proposal.updates.length,additions:proposal.additions.length,output},null,2));
      return;
    }
    const proposal=JSON.parse(fs.readFileSync(opts['apply-update'],'utf8'));
    if(commit!==proposal.sourceCommit)fail('source-commit does not match reviewed proposal');
    const next=applyClinicalUpdate(source,previous,inventory,proposal,{authorizedProposalHash:opts.authorize,
      reviewedBy:opts['reviewed-by'],reason:opts.reason,reviewReference:opts['review-reference']});
    persistClinicalRevision(directory,proposal.expectedRevision,next);
    console.log('Applied reviewed revision '+proposal.proposalHash+'; original identities, sources and CMS unchanged.');
    return;
  }
  if(Object.keys(opts).length)fail('update arguments require --propose-update or --apply-update');
  const {inventory,plan}=auditClinicalLibrary(),rows=[...plan.state.identities.values()],cases=[...plan.state.cases.values()];
  console.log(JSON.stringify({...inventory.baseline.summary,records:rows.length,standardCases:cases.filter(c=>c.caseType==='standard').length,
    projectGroups:new Set(rows.map(r=>r.department+'\0'+r.group)).size,
    diseaseOrProcedureGroups:new Set(rows.filter(r=>r.caseType!=='utility').map(r=>r.department+'\0'+r.group)).size,
    standardRecords:rows.filter(r=>r.caseType==='standard').length,utilityRecords:rows.filter(r=>r.caseType==='utility').length,
    specialCases:cases.filter(c=>c.caseType==='special').length,specialRecords:rows.filter(r=>r.specialCase).length,publishedRecords:plan.published.length,
    archivedRecords:plan.archived.length,withdrawnRecords:plan.withdrawn.length,
    withdrawnCases:new Set(plan.withdrawn.map(entry=>entry.identity.caseId)).size,bodyHashMismatches:0,
    approvedRevisionBatches:inventory.revisions.batches.length,ledgerRevision:plan.state.revision,
    ambiguousLegacyNames:inventory.baseline.ambiguousNames.length,productionCmsAudit:inventory.policy.productionCmsAudit},null,2));
}
if(process.argv[1]===fileURLToPath(import.meta.url))main(process.argv.slice(2)).catch(error=>{console.error(error.message);process.exitCode=1;});
