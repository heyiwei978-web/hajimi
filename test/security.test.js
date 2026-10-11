import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import test from 'node:test';
import {createSession,readSession,sha256,hashPassword,verifyPassword} from '../api/_auth.js';
import {guardRequest} from '../api/_security.js';
import login from '../api/login.js';
import logout from '../api/logout.js';
import session from '../api/session.js';
import content from '../api/content.js';
import history from '../api/content-history.js';
import upload from '../api/upload.js';
import image,{createImageHandler} from '../api/image.js';

function response() {
  return {
    code:200, headers:{}, body:null,
    setHeader(key,value) { this.headers[key.toLowerCase()] = value; },
    status(code) { this.code = code; return this; },
    json(body) { this.body = body; return this; },
    end(body) { this.body = body; return this; }
  };
}

function request(extra = {}) {
  return {method:'POST',body:{},query:{},...extra,headers:{
    host:'wdyxzl.icu','x-forwarded-proto':'https','content-type':'application/json','x-hajimi-admin':'1',...extra.headers
  }};
}

function adminEnvironment(t) {
  const names = ['HAJIMI_ADMIN_USER','HAJIMI_ADMIN_PASSWORD_SHA256','HAJIMI_SESSION_SECRET'];
  const previous = Object.fromEntries(names.map(name => [name,process.env[name]]));
  process.env.HAJIMI_ADMIN_USER = 'test-admin';
  process.env.HAJIMI_ADMIN_PASSWORD_SHA256 = sha256('test-password');
  process.env.HAJIMI_SESSION_SECRET = crypto.randomBytes(32).toString('hex');
  t.after(() => names.forEach(name => {
    if (previous[name] === undefined) delete process.env[name];
    else process.env[name] = previous[name];
  }));
  return 'hajimi_session=' + createSession('test-admin');
}

test('same-origin admin login works and creates a protected cookie', async t => {
  adminEnvironment(t);
  const res = response();
  await login(request({headers:{origin:'https://wdyxzl.icu'},body:{username:'test-admin',password:'test-password'}}),res);
  assert.equal(res.code,200);
  assert.match(res.headers['set-cookie'],/HttpOnly; Secure; SameSite=Strict/);
  const cookie = res.headers['set-cookie'].split(';')[0];
  assert.equal(readSession(request({headers:{cookie}})).u,'test-admin');
  const sessionResponse = response();
  await session(request({method:'GET',headers:{cookie}}),sessionResponse);
  assert.equal(sessionResponse.body.authenticated,true);
});

test('missing signing secret rejects an empty-key forgery and prevents new sessions', async t => {
  adminEnvironment(t);
  delete process.env.HAJIMI_SESSION_SECRET;
  const payload = Buffer.from(JSON.stringify({u:'test-admin',exp:Date.now()+60000})).toString('base64url');
  const signature = crypto.createHmac('sha256','').update(payload).digest('base64url');
  assert.equal(readSession(request({headers:{cookie:'hajimi_session='+payload+'.'+signature}})),null);
  assert.throws(() => createSession('test-admin'));
  const res = response();
  await login(request({body:{username:'test-admin',password:'test-password'}}),res);
  assert.equal(res.code,503);
  assert.equal(res.headers['set-cookie'],undefined);
});

test('expired, tampered, extra-part and malformed-cookie sessions are rejected', t => {
  const cookie = adminEnvironment(t);
  const valid = cookie.slice('hajimi_session='.length);
  const expiredPayload = Buffer.from(JSON.stringify({u:'test-admin',exp:Date.now()-1000})).toString('base64url');
  const expired = expiredPayload+'.'+crypto.createHmac('sha256',process.env.HAJIMI_SESSION_SECRET).update(expiredPayload).digest('base64url');
  for (const token of [valid+'.extra','x'+valid,expired,'%E0%A4%A']) {
    assert.equal(readSession(request({headers:{cookie:'hajimi_session='+token}})),null);
  }
});

test('cross-site requests and spoofed origins cannot perform admin writes', async t => {
  const cookie = adminEnvironment(t);
  for (const handler of [login,logout,content,history,upload]) {
    for (const headers of [{origin:'https://attacker.example'},{origin:'null'},{'sec-fetch-site':'cross-site'},{origin:'https://wdyxzl.icu.attacker.example'}]) {
      const res = response();
      await handler(request({method:handler === content ? 'PUT' : 'POST',headers:{cookie,...headers}}),res);
      assert.equal(res.code,403);
      assert.equal(res.headers['set-cookie'],undefined);
    }
  }
});

test('login rejects unsupported methods, missing marker, non-JSON, malformed and oversized bodies', async () => {
  const inputs = [
    [request({method:'GET'}),405],
    [request({headers:{'x-hajimi-admin':undefined}}),403],
    [request({headers:{'content-type':'text/plain'}}),415],
    [request({body:'{"username":'}),400],
    [request({body:[]}),400],
    [request({body:{username:'admin',password:'x'.repeat(4096)}}),413],
    [request({headers:{'content-length':'5000'},body:{}}),413]
  ];
  for (const [req,code] of inputs) {
    const res = response(); await login(req,res); assert.equal(res.code,code);
    assert.equal(res.headers['set-cookie'],undefined);
  }
});

test('public session remains readable while admin writes require authentication', async () => {
  const res = response();
  await session(request({method:'GET',headers:{cookie:''}}),res);
  assert.equal(res.code,200); assert.equal(res.body.authenticated,false);
  for (const [handler,method] of [[content,'PUT'],[upload,'POST']]) {
    const denied = response(); await handler(request({method,headers:{cookie:''}}),denied);
    assert.equal(denied.code,401);
  }
});

test('valid same-origin admin JSON passes the guard; wrong method and oversized writes do not', t => {
  const cookie = adminEnvironment(t);
  const req = request({method:'PUT',body:'{"cases":[]}',headers:{cookie,origin:'https://wdyxzl.icu'}});
  assert.equal(guardRequest(req,response(),{methods:['PUT'],admin:true,json:true}),true);
  assert.deepEqual(req.body,{cases:[]});
  const oversized = response();
  assert.equal(guardRequest(request({method:'PUT',headers:{cookie},body:{cases:['x'.repeat(5000)]}}),oversized,{methods:['PUT'],admin:true,json:true}),false);
  assert.equal(oversized.code,413);
});

test('upload rejects disguised SVG, invalid base64 and oversized bodies before contacting storage', async t => {
  const cookie = adminEnvironment(t);
  for (const [body,code] of [
    [{type:'image/png',data:Buffer.from('<svg onload="alert(1)"></svg>').toString('base64')},400],
    [{type:'image/svg+xml',data:'AAAA'},400],
    [{type:'image/jpeg',data:'not valid base64!'},400],
    [{type:'image/jpeg',data:'A'.repeat(4400000)},413]
  ]) {
    const res = response(); await upload(request({headers:{cookie},body}),res); assert.equal(res.code,code);
  }
});

test('image paths cannot request other storage files, traversal or SVG content', async () => {
  for (const path of ['cms/content.json','cases/../content.json','cases/hidden.svg',['cases/a.jpg','cms/content.json']]) {
    const res = response(); await image(request({method:'GET',query:{path}}),res); assert.equal(res.code,400);
  }
  const wrongMethod = response();
  await image(request({method:'POST',query:{path:'cases/a.jpg'}}),wrongMethod);
  assert.equal(wrongMethod.code,405);
});

function imageFixture(cases) {
  const reads = {store:0};
  const store = {async read() { reads.store++; return {data:{templateOverrides:{},cases}}; }};
  const blob = {async get() {
    return {statusCode:200,blob:{contentType:'image/png'},stream:new Blob([Buffer.from([137,80,78,71,13,10,26,10])]).stream()};
  }};
  return {store,blob,reads};
}

test('anonymous viewers only get images referenced by a published case', async t => {
  const fixture = imageFixture([
    {id:'1',template:'t',images:['cases/public.png']},
    {id:'2',template:'t',published:false,images:['cases/draft.png']}
  ]);
  const handler = createImageHandler(fixture);
  const ok = response(); await handler(request({method:'GET',query:{path:'cases/public.png'}}),ok);
  assert.equal(ok.code,200);
  assert.equal(ok.headers['cache-control'],'private, max-age=600');
  for (const path of ['cases/draft.png','cases/orphan.png']) {
    const res = response(); await handler(request({method:'GET',query:{path}}),res); assert.equal(res.code,404);
  }
  assert.equal(fixture.reads.store,1,'published image index is cached between requests');
  const cookie = adminEnvironment(t);
  const admin = response(); await handler(request({method:'GET',query:{path:'cases/orphan.png'},headers:{cookie}}),admin);
  assert.equal(admin.code,200);
  assert.equal(admin.headers['cache-control'],'private, no-store');
});

test('salted scrypt admin password hash is preferred and legacy SHA-256 still works', () => {
  const hash = hashPassword('correct horse battery');
  assert.match(hash,/^scrypt\$[A-Za-z0-9_-]+\$[A-Za-z0-9_-]{43}$/);
  assert.notEqual(hash,hashPassword('correct horse battery'),'each hash uses a fresh salt');
  assert.equal(verifyPassword('correct horse battery',{HAJIMI_ADMIN_PASSWORD_HASH:hash}),true);
  assert.equal(verifyPassword('wrong',{HAJIMI_ADMIN_PASSWORD_HASH:hash}),false);
  assert.equal(verifyPassword('legacy',{HAJIMI_ADMIN_PASSWORD_HASH:hash,HAJIMI_ADMIN_PASSWORD_SHA256:sha256('legacy')}),false,'new hash replaces the legacy value');
  assert.equal(verifyPassword('legacy',{HAJIMI_ADMIN_PASSWORD_SHA256:sha256('legacy')}),true);
  assert.equal(verifyPassword('x',{HAJIMI_ADMIN_PASSWORD_HASH:'garbage'}),false);
  assert.equal(verifyPassword('',{}),false);
});
