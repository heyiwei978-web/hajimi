import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import test from 'node:test';
import {assertPublicResources} from '../scripts/public-resources.mjs';

test('built HTML, CSS, rewrites and lazy manifests cannot reference missing public resources',t=>{
  const folder=fs.mkdtempSync(path.join(os.tmpdir(),'public-resources-'));t.after(()=>fs.rmSync(folder,{recursive:true,force:true}));
  const directory=pathToFileURL(folder+'/');
  const files={'index.html':'<link href="/style.css?v=1"><a href="/bl/guke/TKA#record-0">case</a><script src="/runtime.js"></script>',
    'library.html':'<img src="/image.svg">','style.css':'a{background:url(/image.svg)}','image.svg':'<svg/>','runtime.js':'', 'catalog.js':'','body.json':'[]'};
  for(const [file,text]of Object.entries(files))fs.writeFileSync(new URL(file,directory),text);
  const config={rewrites:[{source:'/bl/:path*',destination:'/library.html'}]};
  const manifest={departments:{guke:{catalog:'/catalog.js'}},bodies:{case:'/body.json'},scripts:{app:'/runtime.js'}};
  assert.doesNotThrow(()=>assertPublicResources(directory,config,manifest));
  for(const file of ['style.css','image.svg','runtime.js','catalog.js','body.json','library.html']){
    fs.unlinkSync(new URL(file,directory));
    assert.throws(()=>assertPublicResources(directory,config,manifest),new RegExp(file.replace('.','\\.')));
    fs.writeFileSync(new URL(file,directory),files[file]);
  }
});
