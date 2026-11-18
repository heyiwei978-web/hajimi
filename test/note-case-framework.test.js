import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {BlobPreconditionFailedError} from '@vercel/blob';
import '../note-case-core.js';
import {createSession} from '../api/_auth.js';
import {createNoteHandler,validateInput,buildMessages} from '../api/note-generate.js';
import {createModelCatalog} from '../api/_note-models.js';
import {createNoteCaseRepository,validateCompletedCase} from '../api/_note-cases.js';
import {createNoteCasesHandler} from '../api/_note-case-handler.js';
const Core=globalThis.HajimiNoteCaseCore;
const id='11111111-1111-4111-8111-111111111111';
const facts=Core.facts({department:'骨科',complaint:'虚构右髋部疼痛',diagnosis:'虚构教学诊断',operation:'虚构手术'});
function body(overrides={}) {
  const settings=Core.settings({mode:'medical',stayDays:1,extras:[]});
  return {id,title:'完整教学示例',settings,facts,confirmed:true,revision:'missing',
    sections:Core.build(settings).map(section=>({...section,text:section.title+'\n右侧 3*4 cm；> 5 mm\n医师签名：________',
      notes:'',model:'deepseek-flash',confirmed:true,stale:false,factsKey:JSON.stringify(facts)})),...overrides};
}
function storage() {
  const blobs=new Map();let serial=0;
  return {blobs,failReads:false,failIndex:false,
    async get(path,options) {
      assert.equal(options.access,'private');assert.equal(options.useCache,false);
      if(this.failReads)throw new Error('offline');
      const value=blobs.get(path);
      return value?{statusCode:200,blob:{etag:value.etag},stream:new Response(value.text).body}:null;
    },
    async put(path,text,options) {
      assert.equal(options.access,'private');assert.equal(options.addRandomSuffix,false);
      if(this.failIndex&&path.endsWith('/index.json'))throw new Error('index unavailable');
      const prior=blobs.get(path);
      if(prior&&(!options.allowOverwrite||(options.ifMatch&&options.ifMatch!==prior.etag)))throw new BlobPreconditionFailedError();
      const etag='"v'+(++serial)+'"';blobs.set(path,{text,etag});return {etag};
    }
  };
}
function response() {return {code:200,headers:{},setHeader(name,value){this.headers[name.toLowerCase()]=value;},
  status(code){this.code=code;return this;},json(body){this.body=body;return this;}};}
function auth(t) {
  const keys=['HAJIMI_SESSION_SECRET','HAJIMI_ADMIN_USER'],old=keys.map(key=>process.env[key]);
  process.env.HAJIMI_SESSION_SECRET=randomBytes(32).toString('hex');process.env.HAJIMI_ADMIN_USER='fixture-owner';
  t.after(()=>keys.forEach((key,index)=>old[index]===undefined?delete process.env[key]:process.env[key]=old[index]));
  return 'hajimi_session='+createSession('fixture-owner');
}
function request(cookie,method='POST',data={}) {
  return {method,body:data,query:{},headers:{cookie,host:'local.test','x-forwarded-proto':'https',origin:'https://local.test',
    'sec-fetch-site':'same-origin','content-type':'application/json','x-hajimi-admin':'1'}};
}
test('framework covers the surgical timeline and excludes consent and communication documents',()=>{
  const sections=Core.build({mode:'surgery',preDays:3,postDays:14,extras:[]});
  assert.equal(sections.length,26);
  assert.equal(sections.filter(item=>item.type==='preDaily').length,2);
  assert.equal(sections.filter(item=>item.type==='postDaily').length,14);
  assert(sections.some(item=>item.title==='术前讨论'));
  assert(sections.some(item=>item.title==='出院记录'));
  assert(!sections.some(item=>/知情|同意|医患沟通/.test(item.title)));
  for(const item of sections)assert.equal(validateInput(Core.inputFor(item,facts,'虚构本章要点')).error,undefined,item.title);
});
test('nonoperative framework has no operative chapters or misleading postoperative phase',()=>{
  const sections=Core.build({mode:'medical',stayDays:3,extras:['internalConsult','summary']});
  assert.equal(sections.filter(item=>item.day).length,3);
  assert(!sections.some(item=>/术前|术后|手术记录/.test(item.title)));
  const input=Core.inputFor(sections.find(item=>item.day),facts,'虚构当天变化');
  assert.equal(input.dailyPhase,'');
  assert.equal(validateInput(input).error,undefined);
  assert(!buildMessages(validateInput(input))[1].content.includes('当日变化所属阶段：术前'));
});
test('invalid days and arbitrary framework extras are rejected',()=>{
  for(const value of [0,91,1.5,'1e1','01','-1'])assert.throws(()=>Core.build({mode:'medical',stayDays:value}));
  assert.throws(()=>Core.build({mode:'medical',stayDays:1,extras:['anesthesiaConsult']}));
  assert.throws(()=>Core.build({mode:'medical',stayDays:1,extras:['communication']}));
});
test('chapter input contains only its own notes and never earlier generated text',()=>{
  const sections=Core.build({mode:'medical',stayDays:2,extras:[]});
  const one=Core.inputFor(sections[0],facts,'仅入院要点','deepseek-flash');
  const two=Core.inputFor(sections.find(item=>item.day==='2'),facts,'第二天变化','deepseek-v4-pro');
  assert.equal(one.sectionNotes,'仅入院要点');assert.equal(two.sectionNotes,'');assert.equal(two.daily,'第二天变化');
  assert(!JSON.stringify(two).includes('仅入院要点'));
  assert.equal(one.model,'deepseek-flash');
});
test('completion validates every canonical chapter and preserves edited plain text exactly',()=>{
  const data=body(),record=validateCompletedCase(data);
  assert.equal(record.text,Core.combine(data.title,data.sections));
  assert.equal(record.published,false);assert.equal(record.status,'completed');
  assert(record.text.includes('3*4 cm；> 5 mm\n医师签名：________'));
  for(const mutate of [
    value=>value.sections.pop(),value=>value.sections[1].id=value.sections[0].id,
    value=>value.sections[0].text='',value=>value.sections[0].confirmed=false,
    value=>value.sections[0].stale=true,value=>value.sections[0].factsKey='old facts',
    value=>value.confirmed=false,value=>value.title='',
    value=>value.sections[0].notes='x'.repeat(601),value=>value.sections[0].text='x'.repeat(16001),
    value=>value.sections[0].text='联系 13800138000',value=>value.id='../cms'
  ]) {const invalid=structuredClone(data);mutate(invalid);assert.throws(()=>validateCompletedCase(invalid));}
});
test('private case persistence, retrieval, per-record revisions and directory metadata are isolated',async()=>{
  const backend=storage(),repo=createNoteCaseRepository('owner',backend);
  assert.deepEqual(await repo.list(),[]);
  const saved=await repo.save(body());
  assert.equal(saved.indexed,true);assert.notEqual(saved.revision,'missing');
  assert.equal((await repo.get(id)).record.text,saved.record.text);
  const listed=await repo.list();assert.equal(listed.length,1);assert.equal(listed[0].title,'完整教学示例');
  assert(!JSON.stringify(listed).includes('3*4 cm'));
  assert([...backend.blobs.keys()].every(path=>path.startsWith('private-note-cases/')));
  assert.deepEqual(await createNoteCaseRepository('different-owner',backend).list(),[]);
  await assert.rejects(createNoteCaseRepository('different-owner',backend).get(id),error=>error.status===404);
  await assert.rejects(repo.save(body()),error=>error.status===409);
  const changed=body({revision:saved.revision,title:'修改名称'});
  await repo.save(changed);assert.equal((await repo.get(id)).record.title,'修改名称');
  const history=[...backend.blobs.entries()].filter(([path,value])=>path.includes('/'+id+'/history/')&&value.text.includes('完整教学示例'));
  assert(history.length>0,'the previous completed record is backed up before modification');
});
test('concurrent first completion cannot overwrite another saved record',async()=>{
  const backend=storage(),repo=createNoteCaseRepository('owner',backend);
  const outcomes=await Promise.allSettled([repo.save(body()),repo.save(body({title:'另一份同编号'}))]);
  assert.equal(outcomes.filter(item=>item.status==='fulfilled').length,1);
  assert.equal(outcomes.find(item=>item.status==='rejected').reason.status,409);
});
test('storage read failures block writes, and index failure reports recoverable partial success',async()=>{
  const backend=storage(),repo=createNoteCaseRepository('owner',backend);
  backend.failReads=true;await assert.rejects(repo.save(body()),error=>error.status===503);assert.equal(backend.blobs.size,0);
  backend.failReads=false;backend.failIndex=true;
  const saved=await repo.save(body());assert.equal(saved.indexed,false);assert.match(saved.warning,/正文已保存/);
  assert.equal((await repo.get(id)).record.id,id);
  backend.failIndex=false;await repo.save(body({revision:saved.revision}));assert.equal((await repo.list()).length,1);
});
test('case API protects both reads and writes before touching storage',async t=>{
  const cookie=auth(t);let calls=0;
  const handler=createNoteCasesHandler({repositoryFor:()=>{calls++;return {list:async()=>[],save:async()=>({}),get:async()=>({})};}});
  for(const method of ['GET','POST']) {
    const denied=response();await handler(request('',method,body()),denied);assert.equal(denied.code,401);
  }
  assert.equal(calls,0);
  const cross=request(cookie);cross.headers.origin='https://other.test';const denied=response();
  await handler(cross,denied);assert.equal(denied.code,403);assert.equal(calls,0);
  const noMarker=request(cookie);delete noMarker.headers['x-hajimi-admin'];
  const marker=response();await handler(noMarker,marker);assert.equal(marker.code,403);assert.equal(calls,0);
  const tooLarge=request(cookie);tooLarge.headers['content-length']='1500001';
  const large=response();await handler(tooLarge,large);assert.equal(large.code,413);assert.equal(calls,0);
  const ok=response();await handler(request(cookie,'GET'),ok);assert.equal(ok.code,200);assert.equal(ok.headers['cache-control'],'private, no-store');
});
test('model discovery uses the existing server-only key, filters provider models and caches safely',async()=>{
  const calls=[];let clock=1000;
  const catalog=createModelCatalog(async(url,options)=>{calls.push({url,options});return {ok:true,json:async()=>({data:[
    {id:'deepseek-flash',name:'DeepSeek Flash'},{id:'foreign-model'},{id:'deepseek-flash'},{id:'deepseek-v4-pro'}
  ]})};},{now:()=>clock});
  const config={url:'https://fixture.test/v1/chat/completions',key:'fixture-key',model:'fixture-default'};
  assert.deepEqual((await catalog(config)).map(item=>item.id),['deepseek-flash','deepseek-v4-pro']);
  await catalog(config);assert.equal(calls.length,1);assert.equal(calls[0].url,'https://fixture.test/v1/models');
  assert.equal(calls[0].options.headers.Authorization,'Bearer fixture-key');
  clock+=300001;await catalog(config);assert.equal(calls.length,2);
});
test('model picker is authenticated and selected DeepSeek uses the same generation endpoint',async t=>{
  const cookie=auth(t),calls=[],env={NOTE_AI_API_KEY:'fixture-key',NOTE_AI_BASE_URL:'https://fixture.test/v1',NOTE_AI_MODEL:'original-default'};
  const handler=createNoteHandler({env,quota:async()=>({allowed:true}),
    modelCatalog:async()=>[{id:'deepseek-flash',name:'DeepSeek Flash'}],
    fetchImpl:async(url,options)=>{calls.push({url,options});return {ok:true,json:async()=>({choices:[{finish_reason:'stop',message:{content:'完整虚构正文'}}]})};}});
  const anonymous=response();await handler(request('','GET'),anonymous);assert.equal(anonymous.code,401);
  const listing=response();await handler(request(cookie,'GET'),listing);assert.equal(listing.code,200);
  assert.equal(listing.body.defaultModel,'original-default');assert(!JSON.stringify(listing.body).includes('fixture-key'));
  const source=Core.inputFor(Core.build({mode:'medical',stayDays:1})[0],facts);
  const selected=response();await handler(request(cookie,'POST',{...source,model:'deepseek-flash'}),selected);
  assert.equal(selected.code,200);assert.equal(selected.body.model,'deepseek-flash');
  assert.equal(calls[0].url,'https://fixture.test/v1/chat/completions');
  assert.equal(JSON.parse(calls[0].options.body).model,'deepseek-flash');
  const original=response();await handler(request(cookie,'POST',source),original);
  assert.equal(JSON.parse(calls[1].options.body).model,'original-default');
  for(const model of ['foreign-model','deepseek-does-not-exist',{},'https://other.test']) {
    const rejected=response();await handler(request(cookie,'POST',{...source,model}),rejected);assert.equal(rejected.code,400);
  }
  assert.equal(calls.length,2);
});

test('an older completion cannot roll the directory metadata back after a newer save',async()=>{
  const backend=storage(),get=backend.get.bind(backend),repo=createNoteCaseRepository('owner',backend);
  let entered,release,hold=true;
  const paused=new Promise(resolve=>{entered=resolve;}),resume=new Promise(resolve=>{release=resolve;});
  backend.get=async(path,options)=>{
    if(hold&&path.endsWith('/index.json')){hold=false;entered();await resume;}
    return get(path,options);
  };
  const older=repo.save(body({title:'旧名称'}));
  await paused;
  const version=await repo.get(id);
  await repo.save(body({revision:version.revision,title:'新名称'}));
  release();await older;
  assert.equal((await repo.get(id)).record.title,'新名称');
  assert.equal((await repo.list())[0].title,'新名称');
});

test('private case actions reuse the existing note endpoint without requiring AI configuration',async()=>{
  let calls=0;
  const handler=createNoteHandler({env:{},caseHandler:async(req,res)=>{calls++;return res.status(200).json({items:[]});}});
  const req=request('','GET');req.query.resource='cases';
  const res=response();await handler(req,res);
  assert.equal(calls,1);assert.deepEqual(res.body,{items:[]});
});

test('the delegated private case route still rejects anonymous reads and writes before storage',async()=>{
  let calls=0;
  const handler=createNoteHandler({env:{},fetchImpl:async()=>{calls++;throw new Error('unexpected upstream call');}});
  for(const method of ['GET','POST']) {
    const req=request('',method,body());req.query.resource='cases';
    const res=response();await handler(req,res);assert.equal(res.code,401);
  }
  assert.equal(calls,0);
});
