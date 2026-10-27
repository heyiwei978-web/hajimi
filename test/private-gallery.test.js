import assert from 'node:assert/strict';
import test from 'node:test';
import {createHmac,randomBytes} from 'node:crypto';
import {BlobPreconditionFailedError} from '@vercel/blob';
import {createSession} from '../api/_auth.js';
import {createContentStore} from '../api/_content-store.js';
import {createPrivateGalleryHandler} from '../api/private-gallery.js';
import {createPrivateImageHandler} from '../api/private-image.js';
import {createImageHandler} from '../api/image.js';
import {createContentHandler} from '../api/content.js';

const INDEX='private-gallery/index.json',HISTORY='private-gallery/history/';
const PNG=Buffer.from([137,80,78,71,13,10,26,10,0,0,0,0]);
function res(){return {code:200,headers:{},setHeader(k,v){this.headers[k.toLowerCase()]=v;},status(n){this.code=n;return this;},json(b){this.body=b;return this;},end(b){this.body=b;return this;}};}
function req(cookie='',extra={}){return {method:'GET',query:{},...extra,headers:{host:'local.test','x-forwarded-proto':'https','content-type':'application/json','x-hajimi-admin':'1',cookie,...extra.headers}};}
function auth(t){
  const keys=['HAJIMI_SESSION_SECRET','HAJIMI_ADMIN_USER'],prior=keys.map(k=>process.env[k]);
  process.env.HAJIMI_SESSION_SECRET=randomBytes(32).toString('hex');process.env.HAJIMI_ADMIN_USER='fixture-owner';
  t.after(()=>keys.forEach((k,i)=>prior[i]===undefined?delete process.env[k]:process.env[k]=prior[i]));
  return 'hajimi_session='+createSession('fixture-owner');
}
function fixture(){
  const objects=new Map(),calls=[];let serial=0;
  const backend={objects,calls,failBackup:false,failIndex:false,failGet:false,
    async get(path,options){calls.push(['get',path,options]);if(backend.failGet)throw new Error('offline');const value=objects.get(path);return value?{statusCode:200,blob:{etag:value.etag,contentType:value.type},stream:new Response(value.body).body}:null;},
    async put(path,body,options){
      calls.push(['put',path,options]);assert.equal(options.access,'private');
      if(path.startsWith(HISTORY)&&backend.failBackup||path===INDEX&&backend.failIndex)throw new Error('offline');
      const prior=objects.get(path);if(prior&&(!options.allowOverwrite||options.ifMatch&&options.ifMatch!==prior.etag))throw new BlobPreconditionFailedError();
      const etag='"'+(++serial)+'"';objects.set(path,{body,type:options.contentType,etag});return {etag,pathname:path};
    }
  };
  const store=createContentStore(backend,{currentPath:INDEX,historyPrefix:HISTORY});
  return {backend,store,gallery:createPrivateGalleryHandler({store,blob:backend}),image:createPrivateImageHandler({store,blob:backend})};
}
const payload={title:'Synthetic DR',description:'Fixture only',category:'DR',type:'image/png',data:PNG.toString('base64'),revision:'missing'};
async function upload(f,cookie,body=payload){const out=res();await f.gallery(req(cookie,{method:'POST',body}),out);return out;}

test('gallery metadata and image bytes deny missing, forged, expired and wrong-user sessions before storage',async t=>{
  const cookie=auth(t),f=fixture();
  const expiredPayload=Buffer.from(JSON.stringify({u:'fixture-owner',exp:Date.now()-1000})).toString('base64url');
  const expired='hajimi_session='+expiredPayload+'.'+createHmac('sha256',process.env.HAJIMI_SESSION_SECRET).update(expiredPayload).digest('base64url');
  for(const token of ['',cookie+'x',expired,'hajimi_session='+createSession('another-user')]){
    for(const [handler,method] of [[f.gallery,'GET'],[f.gallery,'POST'],[f.image,'GET']]){
      const out=res();await handler(req(token,{method,body:payload,query:{path:'private-gallery/images/00000000-0000-0000-0000-000000000000.png'}}),out);
      assert.equal(out.code,401);assert.match(out.headers['cache-control'],/no-store/);
    }
  }
  assert.equal(f.backend.calls.length,0);
});
test('authenticated uploads reject CSRF, missing markers, bad JSON, SVG, invalid bytes and oversized bodies without storage',async t=>{
  const cookie=auth(t),f=fixture();
  const samples=[
    [{headers:{origin:'https://evil.example'}},403],
    [{headers:{'x-hajimi-admin':undefined}},403],
    [{headers:{'content-type':'text/plain'}},415],
    [{body:'{'},400],
    [{body:{...payload,type:'image/svg+xml'}},400],
    [{body:{...payload,data:Buffer.from('<svg/>').toString('base64')}},400],
    [{body:{...payload,data:'bad base64'}},400],
    [{body:{...payload,title:''}},400],
    [{body:{...payload,revision:null}},428],
    [{headers:{'content-length':'4400001'}},413],
    [{body:{...payload,data:Buffer.alloc(3000001).toString('base64')}},413]
  ];
  for(const [extra,status] of samples){const out=res();await f.gallery(req(cookie,{method:'POST',body:payload,...extra}),out);assert.equal(out.code,status);}
  assert.equal(f.backend.calls.length,0);
});
test('save/read/image roundtrip uses only private gallery paths and cannot appear in public content or image routes',async t=>{
  const cookie=auth(t),f=fixture(),out=await upload(f,cookie);assert.equal(out.code,201);
  const path=out.body.item.images[0];assert.match(path,/^private-gallery\/images\//);
  const current=res();await f.gallery(req(cookie),current);assert.equal(current.body.items.length,1);assert.equal(current.body.items[0].title,payload.title);
  assert.equal(current.body.items[0].template,undefined);assert.equal(current.body.items[0].published,undefined);
  const image=res();await f.image(req(cookie,{query:{path}}),image);assert.equal(image.code,200);assert.deepEqual(image.body,PNG);
  assert.equal(image.headers['cache-control'],'private, no-store');assert.equal(image.headers['x-content-type-options'],'nosniff');
  const denied=res();await createImageHandler({store:f.store,blob:f.backend})(req(cookie,{query:{path}}),denied);assert.equal(denied.code,400);
  const publicOut=res();await createContentHandler(createContentStore(f.backend))(req(),publicOut);assert.deepEqual(publicOut.body.cases,[]);
  assert.ok(!f.backend.calls.some(([method,path])=>method==='put'&&path.startsWith('cms/')));
  const before=await f.store.read();assert.equal(before.history.length,1);assert.deepEqual((await f.store.historyContent(before.history[0].id,before)).cases,[]);
});
test('image endpoint rejects traversal, public paths, arrays, unindexed private objects and invalid MIME',async t=>{
  const cookie=auth(t),f=fixture(),saved=await upload(f,cookie),path=saved.body.item.images[0];
  for(const input of ['cases/a.png','private-gallery/index.json','private-gallery/images/../index.json',[path]]){
    const out=res();await f.image(req(cookie,{query:{path:input}}),out);assert.equal(out.code,400);
  }
  const orphan='private-gallery/images/00000000-0000-0000-0000-000000000000.png';
  f.backend.objects.set(orphan,{body:PNG,type:'image/png',etag:'orphan'});
  const absent=res();await f.image(req(cookie,{query:{path:orphan}}),absent);assert.equal(absent.code,404);
  f.backend.objects.get(path).type='image/svg+xml';const mime=res();await f.image(req(cookie,{query:{path}}),mime);assert.equal(mime.code,404);
});
test('stale revisions block uploads; concurrent initial saves preserve one winner',async t=>{
  const cookie=auth(t),f=fixture();await upload(f,cookie);const count=f.backend.objects.size;
  assert.equal((await upload(f,cookie)).code,409);assert.equal(f.backend.objects.size,count);
  const concurrent=fixture(),results=await Promise.all([upload(concurrent,cookie),upload(concurrent,cookie)]);
  assert.deepEqual(results.map(x=>x.code).sort(),[201,409]);assert.equal((await concurrent.store.read()).data.cases.length,1);
});
test('backup and storage failures preserve prior index; orphan bytes cannot be read',async t=>{
  const cookie=auth(t),f=fixture();f.backend.failBackup=true;const failure=await upload(f,cookie);assert.equal(failure.code,503);
  assert.equal((await f.store.read()).revision,'missing');
  const orphan=[...f.backend.objects.keys()].find(x=>x.startsWith('private-gallery/images/'));
  const denied=res();await f.image(req(cookie,{query:{path:orphan}}),denied);assert.equal(denied.code,404);
  f.backend.failGet=true;const read=res();await f.gallery(req(cookie),read);assert.equal(read.code,503);
});
