import assert from 'node:assert/strict';
import test from 'node:test';
import {BlobPreconditionFailedError} from '@vercel/blob';
import {createContentStore} from '../api/_content-store.js';
import {createContentHandler} from '../api/content.js';
import {createHistoryHandler} from '../api/content-history.js';

const path='cms/content.json';
const original={version:1,templateOverrides:{sample:{body:'Original record'}},cases:[{id:'c1',template:'sample',published:true},{id:'c2',template:'sample',published:false}]};
function storage(seed=original){
  const blobs=new Map(seed===null?[]:[[path,{text:JSON.stringify(seed),etag:'"initial"'}]]);
  let serial=0;
  const adapter={blobs,failReads:false,failBackups:false,failWrites:false,
    async get(key){if(adapter.failReads)throw new Error('Storage offline');const blob=blobs.get(key);return blob?{statusCode:200,blob:{etag:blob.etag},stream:new Response(blob.text).body}:null;},
    async put(key,text,options){
      if(key!==path&&adapter.failBackups||key===path&&adapter.failWrites)throw new Error('Storage offline');
      const prior=blobs.get(key);
      if(prior&&(!options.allowOverwrite||options.ifMatch&&prior.etag!==options.ifMatch))throw new BlobPreconditionFailedError();
      const etag='"v'+(++serial)+'"';blobs.set(key,{text,etag});return {etag};
    }
  };return adapter;
}
const replacement={version:1,templateOverrides:{sample:{body:'Updated record'}},cases:original.cases};

test('only a confirmed missing blob becomes an empty library; read and parse failures block edits',async()=>{
  const missing=createContentStore(storage(null));assert.equal((await missing.read()).revision,'missing');
  const backend=storage(),store=createContentStore(backend);backend.failReads=true;
  await assert.rejects(store.read(),error=>error.status===503);await assert.rejects(store.save(replacement,'"initial"','admin'),error=>error.status===503);
  assert.equal(backend.blobs.size,1);backend.failReads=false;backend.blobs.get(path).text='{invalid';
  await assert.rejects(store.read(),error=>error.status===503);assert.equal(backend.blobs.size,1);
});
test('save requires a loaded revision and valid content before touching storage',async()=>{
  const backend=storage(),store=createContentStore(backend);
  await assert.rejects(store.save(replacement,null,'admin'),error=>error.status===428);
  await assert.rejects(store.save({},'"initial"','admin'),error=>error.status===400);
  await assert.rejects(store.save(replacement,'"stale"','admin'),error=>error.status===409);
  assert.equal(backend.blobs.size,1);assert.deepEqual((await store.read()).data,original);
});
test('backup is immutable and must succeed before current content is changed',async()=>{
  const backend=storage(),store=createContentStore(backend);backend.failBackups=true;
  await assert.rejects(store.save(replacement,'"initial"','admin'),error=>error.status===503);assert.deepEqual((await store.read()).data,original);
  backend.failBackups=false;const result=await store.save(replacement,'"initial"','admin');assert.notEqual(result.revision,'"initial"');
  const current=await store.read();assert.equal(current.history.length,1);assert.deepEqual(await store.historyContent(current.history[0].id,current),original);
});
test('concurrent editors use atomic conditional writes and cannot overwrite each other',async()=>{
  const backend=storage(),store=createContentStore(backend);
  const outcomes=await Promise.allSettled([store.save(replacement,'"initial"','admin'),store.save({...replacement,cases:[]},'"initial"','admin')]);
  assert.equal(outcomes.filter(result=>result.status==='fulfilled').length,1);
  assert.equal(outcomes.find(result=>result.status==='rejected').reason.status,409);
  assert.deepEqual((await store.read()).data,replacement);
});
test('concurrent first writes cannot replace an initial creation',async()=>{
  const backend=storage(null),store=createContentStore(backend);
  const results=await Promise.allSettled([store.save(original,'missing','admin'),store.save(replacement,'missing','admin')]);
  assert.equal(results.filter(result=>result.status==='fulfilled').length,1);assert.equal(results.find(result=>result.status==='rejected').reason.status,409);
  assert.deepEqual((await store.read()).data,original);
});
test('restore checks current revision and creates another backup before reverting',async()=>{
  const backend=storage(),store=createContentStore(backend);await store.save(replacement,'"initial"','admin');
  const current=await store.read(),id=current.history[0].id;
  await assert.rejects(store.restore(id,'"stale"','admin'),error=>error.status===409);
  await assert.rejects(store.historyContent('../content',current),error=>error.status===404);
  await store.restore(id,current.revision,'admin');const restored=await store.read();assert.deepEqual(restored.data,original);assert.equal(restored.history.length,2);
  assert.equal(restored.history[0].action,'restore');assert.deepEqual(await store.historyContent(restored.history[0].id,restored),replacement);
});
test('failed current write preserves the current data and its backup',async()=>{
  const backend=storage(),store=createContentStore(backend);backend.failWrites=true;
  await assert.rejects(store.save(replacement,'"initial"','admin'),error=>error.status===503);
  assert.deepEqual((await store.read()).data,original);assert.equal(backend.blobs.size,2);
});
function response(){return {code:200,body:null,setHeader(){},status(code){this.code=code;return this;},json(body){this.body=body;return this;}};}
test('public content hides unpublished cases and backup metadata; history requires authentication',async()=>{
  const backend=storage(),store=createContentStore(backend);await store.save(replacement,'"initial"','admin');
  const req={method:'GET',headers:{},query:{}},res=response();await createContentHandler(store)(req,res);
  assert.equal(res.code,200);assert.equal(res.body.cases.length,1);assert.equal(res.body._history,undefined);
  const denied=response();await createHistoryHandler(store)(req,denied);assert.equal(denied.code,401);
});
