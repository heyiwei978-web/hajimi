import loginHandler from './login.js';
import contentHandler from './content.js';

function mockRes(){
  return {
    statusCode:200,
    headers:{},
    body:null,
    setHeader(k,v){this.headers[String(k).toLowerCase()]=String(v);},
    status(n){this.statusCode=n;return this;},
    json(v){this.body=v;return this;}
  };
}
async function run(handler,req){
  const res=mockRes();
  await handler(req,res);
  return {status:res.statusCode,retryAfter:res.headers['retry-after']||null,body:res.body};
}
function req(method,headers={},body){
  return {
    method,
    headers:{
      host:'wdyxzl.icu',
      'x-forwarded-proto':'https',
      ...headers
    },
    body,
    socket:{encrypted:true}
  };
}

export default async function handler(_req,res){
  const marker={'x-hajimi-admin':'1'};
  const same={origin:'https://wdyxzl.icu',...marker,'content-type':'application/json'};
  const results={};

  results.unauthenticatedContentWrite=await run(
    contentHandler,
    req('PUT',same,{templateOverrides:{},cases:[]})
  );

  results.crossSiteLogin=await run(
    loginHandler,
    req('POST',{
      origin:'https://evil.example',
      'sec-fetch-site':'cross-site',
      ...marker,
      'content-type':'application/json'
    },{username:'security-selftest',password:'wrong'})
  );

  results.wrongMethodLogin=await run(loginHandler,req('GET',{}));

  results.wrongContentTypeLogin=await run(
    loginHandler,
    req('POST',{origin:'https://wdyxzl.icu',...marker,'content-type':'text/plain'},'x')
  );

  const oversized={username:'security-selftest',password:'x'.repeat(5000)};
  results.oversizedLogin=await run(
    loginHandler,
    req('POST',{...same,'content-length':String(Buffer.byteLength(JSON.stringify(oversized)))},oversized)
  );

  const probeIp='203.0.113.254';
  const attempts=[];
  for(let i=1;i<=11;i++){
    const out=await run(
      loginHandler,
      req('POST',{...same,'x-forwarded-for':probeIp},{username:'security-selftest',password:'wrong-'+i})
    );
    attempts.push({attempt:i,status:out.status,retryAfter:out.retryAfter,body:out.body});
  }
  results.bruteForce=attempts;

  const pass={
    unauthenticatedContentWrite:results.unauthenticatedContentWrite.status===401,
    crossSiteLogin:results.crossSiteLogin.status===403,
    wrongMethodLogin:results.wrongMethodLogin.status===405,
    wrongContentTypeLogin:results.wrongContentTypeLogin.status===415,
    oversizedLogin:results.oversizedLogin.status===413,
    bruteForce:attempts.some(x=>x.status===429)&&attempts[10].status===429
  };
  res.setHeader('Cache-Control','no-store');
  res.status(200).json({ok:Object.values(pass).every(Boolean),pass,results});
}