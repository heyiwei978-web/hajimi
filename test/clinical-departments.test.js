import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {DEPARTMENTS} from '../config/site-modules.mjs';
import {clinicalDepartmentSlugs,compileClinicalSite} from '../scripts/clinical-compiler.mjs';
import {createInventory} from '../scripts/clinical-inventory.mjs';

test('clinical department names, URLs and order retain their established contract', () => {
  assert.deepEqual(Object.entries(clinicalDepartmentSlugs()), [
    ['骨科','guke'], ['普外科','puwai'], ['肾内科','shennei'], ['妇科','fuke']
  ]);
});

test('UI capability flags cannot hide a department from clinical compilation', () => {
  const hidden = DEPARTMENTS.map(department => ({...department,records:false,classification:false,pathway:false}));
  const published = DEPARTMENTS.map(({name}) => ({record:{department:name}}));
  assert.deepEqual(clinicalDepartmentSlugs(published,hidden), clinicalDepartmentSlugs(published));
});

test('invalid or duplicated department mappings stop instead of overwriting catalogs', () => {
  const first = {...DEPARTMENTS[0]};
  assert.throws(() => clinicalDepartmentSlugs([],[]), /registry is empty/);
  assert.throws(() => clinicalDepartmentSlugs([],[first,{...first,slug:'other'}]), /duplicate department name/);
  assert.throws(() => clinicalDepartmentSlugs([],[first,{...first,name:'合成科室'}]), /duplicate department slug/);
  for (const invalid of [{...first,name:''}, {...first,name:' 骨科'}, {...first,slug:'../guke'}]) {
    assert.throws(() => clinicalDepartmentSlugs([],[invalid]), /invalid department name or slug/);
  }
});

test('an unmapped published department is rejected before any clinical output is written', t => {
  const parent = fs.realpathSync(os.tmpdir());
  const folder = fs.mkdtempSync(path.join(parent,'hajimi-department-'));
  t.after(() => {
    const resolved = fs.realpathSync(folder);
    assert.equal(path.dirname(resolved),parent,'cleanup remains inside the temporary parent');
    fs.rmSync(resolved,{recursive:true,force:true});
  });
  const records = [{department:'合成未登记科室',group:'合成术式',completeCaseKey:'synthetic',idealCase:true,
    name:'合成病例 · 入院',short:'入院',stage:'入院',type:'入院记录',sourceBody:'仅存在于合成测试。'}];
  const source = {records,renderedBodies:records.map(record => record.sourceBody),sourceFiles:[],origins:['synthetic-test']};
  const commit = '0'.repeat(40);
  const inventory = {...createInventory(source,commit),policy:{schemaVersion:1,baselineCommit:commit,decisions:[]}};
  assert.throws(() => compileClinicalSite('',pathToFileURL(folder+'/'),{source,inventory}), /unmapped department: 合成未登记科室/);
  assert.deepEqual(fs.readdirSync(folder),[],'no catalog, body or manifest was written');
});
