import assert from 'node:assert/strict';
import test from 'node:test';
import {randomBytes} from 'node:crypto';
import {createSession} from '../api/_auth.js';
import {KNOWLEDGE_HISTORY,KNOWLEDGE_INDEX,cleanNote,createKnowledgeHandler,createKnowledgeStore} from '../api/_knowledge.js';

function res(){return {code:200,headers:{},setHeader(k,v){this.headers[k.toLowerCase()]=v;},status(n){this.code=n;return this;},json(b){this.body=b;return this;},end(b){this.body=b;return this;}};}
function req(cookie='',extra={}){return {method:'GET',query:{},...extra,headers:{host:'local.test','x-forwarded-proto':'https','content-type':'application/json','x-hajimi-admin':'1',cookie,...extra.headers}};}
function auth(t){
  const keys=['HAJIMI_SESSION_SECRET','HAJIMI_ADMIN_USER'],prior=keys.map(k=>process.env[k]);
  process.env.HAJIMI_SESSION_SECRET=randomBytes(32).toString('hex');process.env.HAJIMI_ADMIN_USER='fixture-owner';
  t.after(()=>keys.forEach((k,i)=>prior[i]===undefined?delete process.env[k]:process.env[k]=prior[i]));
  return 'hajimi_session='+createSession('fixture-owner');
}
class BlobPreconditionFailedError extends Error{constructor(){super('precondition');this.name='BlobPreconditionFailedError';}}
function fixture(){
  const objects=new Map(),calls=[];let serial=0;
  const backend={objects,calls,failBackup:false,failIndex:false,
    async get(path,options){calls.push(['get',path]);assert.equal(options.access,'private');const v=objects.get(path);
      return v?{statusCode:200,blob:{etag:v.etag,contentType:v.type},stream:new Response(v.body).body}:null;},
    async put(path,body,options){
      calls.push(['put',path]);assert.equal(options.access,'private');
      if(path.startsWith(KNOWLEDGE_HISTORY)&&backend.failBackup||path===KNOWLEDGE_INDEX&&backend.failIndex)throw new Error('offline');
      const prior=objects.get(path);if(prior&&(!options.allowOverwrite||options.ifMatch&&options.ifMatch!==prior.etag))throw new BlobPreconditionFailedError();
      const etag='"'+(++serial)+'"';objects.set(path,{body,type:options.contentType,etag});return {etag};
    }};
  return {backend,handler:createKnowledgeHandler({store:createKnowledgeStore(backend)})};
}
const note={title:'股骨转子间骨折抗凝要点',kind:'指南',source:'示例指南（虚构，2026）',department:'骨科',tags:['抗凝','髋部骨折'],body:'术后12小时后开始药物预防。\n第二行'};
async function call(f,cookie,method='GET',body){const out=res();await f.handler(req(cookie,{method,body}),out);return out;}

test('notes are only readable and writable by the signed-in administrator, before any storage access',async t=>{
  const cookie=auth(t),f=fixture();
  for(const token of ['',cookie+'x','hajimi_session='+createSession('another-user')]){
    for(const method of ['GET','POST']){
      const out=await call(f,token,method,{action:'save',note,revision:'missing'});
      assert.equal(out.code,401);assert.match(out.headers['cache-control'],/no-store/);
    }
  }
  const csrf=res();await f.handler(req(cookie,{method:'POST',body:{action:'save',note,revision:'missing'},headers:{origin:'https://evil.example'}}),csrf);
  assert.equal(csrf.code,403);
  const marker=res();await f.handler(req(cookie,{method:'POST',body:{action:'save',note,revision:'missing'},headers:{'x-hajimi-admin':undefined}}),marker);
  assert.equal(marker.code,403);
  assert.equal(f.backend.calls.length,0);
});

test('create, edit and delete keep a private backup of every replaced version',async t=>{
  const cookie=auth(t),f=fixture();
  let out=await call(f,cookie);assert.equal(out.code,200);assert.deepEqual(out.body.notes,[]);
  assert.equal(out.headers['x-robots-tag'],'noindex, nofollow, noarchive');
  out=await call(f,cookie,'POST',{action:'save',note,revision:out.body.revision});
  assert.equal(out.code,201);const id=out.body.note.id;assert.match(id,/^[a-f0-9-]{36}$/);assert.deepEqual(out.body.note.tags,['抗凝','髋部骨折']);
  out=await call(f,cookie,'POST',{action:'save',id,note:{...note,body:'修改后的正文'},revision:out.body.revision});
  assert.equal(out.code,200);assert.equal(out.body.note.body,'修改后的正文');
  const second=await call(f,cookie,'POST',{action:'save',note:{...note,title:'第二条'},revision:out.body.revision});
  let list=await call(f,cookie);assert.deepEqual(list.body.notes.map(n=>n.title),['第二条','股骨转子间骨折抗凝要点']);
  out=await call(f,cookie,'POST',{action:'delete',id,revision:second.body.revision});assert.equal(out.code,200);
  list=await call(f,cookie);assert.deepEqual(list.body.notes.map(n=>n.title),['第二条']);
  const backups=[...f.backend.objects.keys()].filter(key=>key.startsWith(KNOWLEDGE_HISTORY));
  assert.equal(backups.length,3,'edit, second create and delete each backed up the previous version');
  const last=JSON.parse(f.backend.objects.get(backups.at(-1)).body);assert.equal(last.metadata.action,'delete');assert.equal(last.notes.length,2);
});

test('stale pages, failed backups and invalid notes never change the saved knowledge base',async t=>{
  const cookie=auth(t),f=fixture();
  const first=await call(f,cookie,'POST',{action:'save',note,revision:'missing'});
  const before=f.backend.objects.get(KNOWLEDGE_INDEX).body;
  assert.equal((await call(f,cookie,'POST',{action:'save',note,revision:'missing'})).code,409);
  assert.equal((await call(f,cookie,'POST',{action:'save',note,revision:'"stale"'})).code,409);
  f.backend.failBackup=true;
  const failed=await call(f,cookie,'POST',{action:'save',note,revision:first.body.revision});
  assert.equal(failed.code,503);assert.match(failed.body.error,/备份失败/);
  f.backend.failBackup=false;
  for(const bad of [{...note,title:''},{...note,kind:'小说'},{...note,department:'眼科'},{...note,body:' '},{...note,tags:['a'.repeat(21)]},
    {...note,tags:Array.from({length:13},(_,i)=>'t'+i)},{...note,body:'x'.repeat(60001)}]){
    assert.equal((await call(f,cookie,'POST',{action:'save',note:bad,revision:first.body.revision})).code,400);
  }
  assert.equal((await call(f,cookie,'POST',{action:'delete',id:'00000000-0000-0000-0000-000000000000',revision:first.body.revision})).code,404);
  assert.equal((await call(f,cookie,'POST',{action:'drop',revision:first.body.revision})).code,400);
  assert.equal(f.backend.objects.get(KNOWLEDGE_INDEX).body,before);
});

test('a corrupted stored document stops all writes instead of overwriting it',async t=>{
  const cookie=auth(t),f=fixture();
  f.backend.objects.set(KNOWLEDGE_INDEX,{body:JSON.stringify({version:1,notes:[{id:'bad'}]}),etag:'"x"',type:'application/json'});
  assert.equal((await call(f,cookie)).code,503);
  assert.equal((await call(f,cookie,'POST',{action:'save',note,revision:'"x"'})).code,503);
  assert.equal(f.backend.objects.get(KNOWLEDGE_INDEX).etag,'"x"');
});

test('note cleaning trims fields, removes duplicate tags and normalizes line endings',()=>{
  assert.deepEqual(cleanNote({...note,title:'  标题 ',tags:[' 抗凝','抗凝 '],body:'a\r\nb'}),
    {title:'标题',kind:'指南',source:'示例指南（虚构，2026）',department:'骨科',tags:['抗凝'],body:'a\nb'});
  assert.equal(cleanNote(null),null);
});
