// One-time migration: export the legacy generation chain to per-disease JSON.
// Refuses to run once the JSON source exists, so the chain cannot overwrite edits.
import fs from 'node:fs';
import {loadClinicalSource} from './clinical-compiler.mjs';
import {CLINICAL_SOURCE_DIR,exportClinicalSource,hasClinicalJsonSource,writeClinicalSource} from './clinical-source.mjs';

if(hasClinicalJsonSource())throw new Error('Clinical source already exists; the chain is retired. Edit the JSON files instead.');
writeClinicalSource(exportClinicalSource(loadClinicalSource(fs.readFileSync(new URL('../index.html',import.meta.url),'utf8'),{audit:true})));
console.log('Exported clinical source to '+CLINICAL_SOURCE_DIR);
