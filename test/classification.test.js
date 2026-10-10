import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {test} from 'node:test';
const files=[
 'classification-data.js',
 'classification-detail-v2-lower.js',
 'classification-detail-v2-upper.js',
 'classification-detail-v2-pelvis-foot.js'
];
function catalog(){
 const context={window:{}};
 for(const f of files)runInNewContext(readFileSync(new URL('../'+f,import.meta.url),'utf8'),context,{filename:f});
 return {data:context.window.HAJIMI_CLASSIFICATION_DATA,details:context.window.HAJIMI_CLASSIFICATION_DETAILS};
}
test('17 orthopedic disease dossiers each have detailed fracture morphology, differentiators and references',()=>{
 const {data,details}=catalog();
 assert.equal(data.entries.length,17);
 assert.equal(Object.keys(details).length,17);
 const ids=data.entries.map(x=>x.id);
 assert.equal(new Set(ids).size,17);
 let n=0;
 for(const disease of data.entries){
   const d=details[disease.id];
   assert.ok(d, disease.id+' details missing');
   assert.match(d.standard,/.{12}/u,disease.id+' missing classification version');
   assert.match(d.guide,/.{15}/u,disease.id+' missing image reading approach');
   assert.ok(d.compare.length>=2,disease.id+' insufficient adjacent-type comparisons');
   assert.ok(d.types.length>=3,disease.id+' insufficient subtype details');
   for(const [code,morphology,distinction,view] of d.types){
     assert.ok(code.length>=2&&morphology.length>=12&&distinction.length>=10&&view.length>=4, disease.id+' '+code+' has an incomplete morphology/differentiation/DR or CT guide');
     assert.ok(!/<[^>]*>/.test(morphology+distinction+view),'raw markup disallowed');
   }
   for(const [title,url] of d.sources){
     assert.ok(title.length>2&&url.startsWith('https://'),'nontraceable classification reference '+disease.id);
   }
   n+=d.types.length;
 }
 assert.ok(n>=125,'expect substantive details, got '+n);
});
test('AO/OTA 2018 tibial shaft and intertrochanteric classifications avoid deleted or phantom subtypes',()=>{
 const {details}=catalog();
 const codes=id=>details[id].types.map(x=>x[0]);
 assert.equal(codes('tibial-shaft').join(','),['42A1','42A2','42A3','42B2','42B3','42C2','42C3'].join(','));
 assert.equal(codes('intertrochanteric').join(','),['31A1.1','31A1.2','31A1.3','31A2.2','31A2.3','31A3.1','31A3.2','31A3.3'].join(','));
});
test('pelvic and acetabular systems keep major subtypes and genuine CT-specific Sanders groups',()=>{
 const {details}=catalog();
 const has=(id,name)=>details[id].types.some(x=>x[0]===name);
 assert.equal(details.acetabulum.types.length,10,'5 elementary + 5 associated acetabular patterns');
 for(const code of ['Sanders ⅡA','Sanders ⅡB','Sanders ⅡC','Sanders ⅢAB','Sanders ⅢAC','Sanders ⅢBC'])assert.ok(has('calcaneus',code));
 for(const code of ['Hawkins ⅡA（修订）','Hawkins ⅡB（修订）'])assert.ok(has('talus',code));
});
