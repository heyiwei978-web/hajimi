const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {pathToFileURL}=require('node:url');
const {randomBytes}=require('node:crypto');
const {test,before,after}=require('node:test');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
let server,browser,base,objects,priorEnv,createSession;

// Real knowledge handler and session endpoint, in-memory private storage,
// synthetic notes only. No production login or Blob access.
before(async()=>{
  const load=p=>import(pathToFileURL(path.join(root,p)).href);
  const {createKnowledgeHandler,createKnowledgeStore}=await load('api/_knowledge.js');
  ({createSession}=await load('api/_auth.js'));
  const keys=['HAJIMI_ADMIN_USER','HAJIMI_SESSION_SECRET'];
  priorEnv=Object.fromEntries(keys.map(key=>[key,process.env[key]]));
  Object.assign(process.env,{HAJIMI_ADMIN_USER:'fixture-owner',HAJIMI_SESSION_SECRET:randomBytes(32).toString('hex')});
  objects=new Map();let serial=0;
  class BlobPreconditionFailedError extends Error{constructor(){super('precondition');this.name='BlobPreconditionFailedError';}}
  const storage={
    async get(key){const o=objects.get(key);return o?{statusCode:200,blob:{etag:o.etag,contentType:o.type},stream:new Response(o.body).body}:null;},
    async put(key,body,options){const old=objects.get(key);if(old&&(!options.allowOverwrite||options.ifMatch&&options.ifMatch!==old.etag))throw new BlobPreconditionFailedError();
      const etag='"'+(++serial)+'"';objects.set(key,{body,type:options.contentType,etag});return {etag};}
  };
  const routes={'/api/knowledge':createKnowledgeHandler({store:createKnowledgeStore(storage)}),'/api/session':(await load('api/session.js')).default};
  const config=JSON.parse(fs.readFileSync(path.join(root,'vercel.json')));
  server=http.createServer(async(req,res)=>{
    try{
      const url=new URL(req.url,'http://localhost');
      if(routes[url.pathname]){
        req.query=Object.fromEntries(url.searchParams);const chunks=[];for await(const chunk of req)chunks.push(chunk);req.body=Buffer.concat(chunks).toString();
        res.status=code=>{res.statusCode=code;return res;};res.json=body=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(body));return res;};
        return await routes[url.pathname](req,res);
      }
      const rewrite=config.rewrites.find(rule=>rule.source===url.pathname);
      const target=rewrite?rewrite.destination:url.pathname;
      if(!/^\/[a-zA-Z0-9_-]+\.(?:html|css|js)$/.test(target)){res.writeHead(404);return res.end();}
      const file=path.join(root,'dist',target.slice(1));if(!fs.existsSync(file)){res.writeHead(404);return res.end();}
      for(const header of config.headers.find(rule=>rule.source==='/(.*)').headers)res.setHeader(header.key,header.value);
      res.setHeader('Content-Type',target.endsWith('.js')?'text/javascript':target.endsWith('.css')?'text/css':'text/html');fs.createReadStream(file).pipe(res);
    }catch{res.writeHead(500);res.end();}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base='http://localhost:'+server.address().port;
  browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{}),args:['--no-sandbox']});
});
after(async()=>{await browser?.close();if(server)await new Promise(resolve=>server.close(resolve));if(priorEnv)for(const [key,value] of Object.entries(priorEnv))value===undefined?delete process.env[key]:process.env[key]=value;});

async function signedInContext(width){
  const context=await browser.newContext({viewport:{width,height:850}});
  await context.addCookies([{name:'hajimi_session',value:createSession('fixture-owner'),url:base}]);
  return context;
}

test('knowledge base: anonymous visitors see no notes; the owner creates, searches, edits and deletes on phone and desktop',async()=>{
  for(const width of [375,1440]){
    objects.clear();
    const anonymous=await browser.newContext({viewport:{width,height:850}}),guest=await anonymous.newPage();
    await guest.goto(base+'/kb');await guest.locator('#kbSignedOut').waitFor({state:'visible'});
    assert.equal(await guest.locator('#kbList').isVisible(),false);assert.equal(await guest.locator('#kbNew').isVisible(),false);
    const direct=await guest.request.get(base+'/api/knowledge',{headers:{'X-Hajimi-Admin':'1'}});assert.equal(direct.status(),401);
    await anonymous.close();

    const context=await signedInContext(width),page=await context.newPage();const errors=[];
    page.on('pageerror',error=>errors.push(error.message));page.on('dialog',dialog=>dialog.accept());
    try{
      await page.goto(base+'/kb');await page.locator('#kbList').waitFor({state:'visible'});
      assert.match(await page.locator('#kbSummary').textContent(),/还没有笔记/);
      await page.locator('#kbNew').click();await page.locator('#kbEditor').waitFor({state:'visible'});
      await page.locator('#kbTitle').fill('转子间骨折抗凝（合成笔记）');await page.locator('#kbFormKind').selectOption('指南');
      await page.locator('#kbSource').fill('示例指南（虚构）');await page.locator('#kbTags').fill('抗凝，髋部骨折 抗凝');
      await page.locator('#kbBody').fill('# 要点\n术后药物预防为合成示例。\n\n第二段：出血风险评估。');
      await page.locator('#kbSave').click();await page.locator('#kbReader').waitFor({state:'visible'});
      assert.equal(await page.locator('#kbReaderTitle').textContent(),'转子间骨折抗凝（合成笔记）');
      assert.deepEqual(await page.locator('#kbReaderTags li').allTextContents(),['抗凝','髋部骨折']);
      assert.equal(await page.locator('#kbReaderBody h3').textContent(),'要点');
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal scroll at '+width);
      const shots=process.env.HAJIMI_KB_SCREENSHOT_ROOT;
      if(shots){fs.mkdirSync(shots,{recursive:true});await page.screenshot({path:path.join(shots,'kb-reader-'+width+'.png')});}
      await page.reload();await page.locator('#kbReader').waitFor({state:'visible'});
      assert.equal(await page.locator('#kbReaderTitle').textContent(),'转子间骨折抗凝（合成笔记）','note survives a reload');

      await page.locator('#kbBack').click();await page.locator('#kbList').waitFor({state:'visible'});
      await page.locator('#kbSearch').fill('出血 风险');
      assert.equal(await page.locator('.kb-item').count(),1);
      if(shots)await page.screenshot({path:path.join(shots,'kb-search-'+width+'.png')});assert(await page.locator('.kb-item mark').count()>=2);
      await page.locator('#kbSearch').fill('不存在的词');assert.equal(await page.locator('.kb-item').count(),0);
      await page.locator('#kbSearch').fill('');await page.locator('#kbDept').selectOption('妇科');assert.equal(await page.locator('.kb-item').count(),0);
      await page.locator('#kbDept').selectOption('');

      await page.locator('.kb-item a').first().click();await page.locator('#kbEdit').click();
      await page.locator('#kbEditor').waitFor({state:'visible'});
      await page.locator('#kbTitle').fill('转子间骨折抗凝（已修改）');await page.locator('#kbSave').click();
      await page.locator('#kbReader').waitFor({state:'visible'});
      assert.equal(await page.locator('#kbReaderTitle').textContent(),'转子间骨折抗凝（已修改）');
      assert(await page.locator('#kbReaderDates').textContent());

      await page.locator('#kbDelete').click();await page.locator('#kbList').waitFor({state:'visible'});
      assert.equal(await page.locator('.kb-item').count(),0);
      assert([...objects.keys()].filter(key=>key.startsWith('knowledge/history/')).length>=2,'edit and delete were backed up');
      assert.deepEqual(errors,[]);
    }finally{await context.close();}
  }
});

test('knowledge base: an expired session clears notes from the page',async()=>{
  objects.clear();
  const context=await signedInContext(375),page=await context.newPage();page.on('dialog',dialog=>dialog.accept());
  try{
    await page.goto(base+'/kb');await page.locator('#kbNew').click();
    await page.locator('#kbTitle').fill('合成笔记');await page.locator('#kbBody').fill('合成正文');await page.locator('#kbSave').click();
    await page.locator('#kbReader').waitFor({state:'visible'});
    await context.clearCookies();
    await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
    await page.locator('#kbSignedOut').waitFor({state:'visible'});
    assert.equal(await page.locator('#kbReaderTitle').textContent(),'');
    assert.equal(await page.locator('.kb-item').count(),0);
    assert.match(await page.locator('#kbError').textContent(),/登录已失效/);
  }finally{await context.close();}
});
