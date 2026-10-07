import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {guardRequest} from './_security.js';

export default function handler(req,res){
  if(!guardRequest(req,res,{methods:['GET'],admin:true}))return;
  try{
    const root=process.cwd();
    const files=[
      'ideal-cases.js',
      'orthopedic-expansion-a.js','orthopedic-expansion-b.js','orthopedic-expansion-c.js','orthopedic-expansion-d.js','orthopedic-expansion-e.js',
      'orthopedic-expansion-f.js','orthopedic-expansion-g.js',
      'record-quality-v3.js','record-quality-v4.js','record-quality-v5.js','record-quality-v6.js','record-quality-v7.js','record-quality-v8.js',
      'record-quality-v9.js','record-quality-v10.js','record-quality-v11.js','record-quality-v12.js','record-quality-v13.js','record-quality-v14.js',
      'record-quality-v15.js','record-quality-v16.js','record-quality-v17.js','record-quality-v18.js','record-quality-v19.js','record-quality-v20.js',
      'record-quality-v21.js','record-quality-v22.js','record-quality-v24.js','record-quality-v23.js'
    ];
    const traumaGroups=[
      '股骨转子间骨折','股骨大粗隆骨折','股骨干骨折','胫骨干骨折','胫骨平台骨折','踝关节三踝骨折',
      '跟骨骨折','桡骨远端骨折','桡骨头骨折','肱骨近端骨折','肱骨干骨折','锁骨骨折','尺桡骨干骨折',
      '髌骨骨折','掌骨骨折','指骨骨折','跖骨骨折','趾骨骨折','骨盆骨折'
    ];
    const context={
      templates:[],
      traumaGroups:traumaGroups.slice(),
      groups:['TKA','THA','人工股骨头置换',...traumaGroups],
      profile:{},
      labelFor:(g)=>g==='TKA'?'全膝关节置换':g==='THA'?'全髋关节置换':g,
      window:{},
      console:{log:()=>{},warn:()=>{},error:()=>{}},
      Set,Map,Date,Math,Number,String,RegExp,Array,Object,JSON
    };
    vm.createContext(context);
    const runtime=[];
    for(const f of files){
      const p=path.join(root,f);
      const src=fs.readFileSync(p,'utf8');
      try{
        vm.runInContext(src,context,{filename:f,timeout:5000});
        runtime.push({file:f,ok:true});
      }catch(e){
        runtime.push({file:f,ok:false,error:String(e&&e.stack||e)});
        throw new Error(f+': '+e.message);
      }
    }
    const q=context.window.HAJIMI_RECORD_QUALITY_V23||{};
    const categories={};
    const seeds=context.window.HAJIMI_IDEAL_CASES&&context.window.HAJIMI_IDEAL_CASES.seeds||{};
    Object.keys(seeds).forEach(g=>{
      const cat=seeds[g].category||'原有成熟病种';
      categories[cat]=(categories[cat]||0)+1;
    });
    res.status(200).json({
      ok:true,
      seedCount:Object.keys(seeds).length,
      orthopedicRecordCount:context.templates.filter(t=>t.department==='骨科').length,
      standardRecordCount:context.templates.filter(t=>t.department==='骨科'&&!t.specialCase).length,
      categories,
      audit:q,
      qualityLayers:Object.keys(context.window).filter(k=>/^HAJIMI_RECORD_QUALITY_V\d+$/.test(k)).sort(),
      runtime
    });
  }catch(e){
    console.error('Orthopedic runtime audit failed',e);
    res.status(500).json({ok:false,error:'审计执行失败'});
  }
}
