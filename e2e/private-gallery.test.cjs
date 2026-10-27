const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {pathToFileURL}=require('node:url');
const {randomBytes}=require('node:crypto');
const {test,before,after}=require('node:test');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
let server,browser,base,objects,priorEnv;

before(async()=>{
  const load=p=>import(pathToFileURL(path.join(root,p)).href);
  const {createContentStore}=await load('api/_content-store.js');
  const {createPrivateGalleryHandler}=await load('api/private-gallery.js');
  const {createPrivateImageHandler}=await load('api/private-image.js');
  const {createContentHandler}=await load('api/content.js');
  const {createHistoryHandler}=await load('api/content-history.js');
  const {sha256}=await load('api/_auth.js');
  const {BlobPreconditionFailedError}=await import('@vercel/blob');
  const keys=['HAJIMI_ADMIN_USER','HAJIMI_ADMIN_PASSWORD_SHA256','HAJIMI_ADMIN_PASSWORD_HASH','HAJIMI_SESSION_SECRET','BLOB_READ_WRITE_TOKEN'];
  priorEnv=Object.fromEntries(keys.map(key=>[key,process.env[key]]));keys.forEach(key=>delete process.env[key]);
  Object.assign(process.env,{HAJIMI_ADMIN_USER:'fixture-owner',HAJIMI_ADMIN_PASSWORD_SHA256:sha256('fixture-only'),HAJIMI_SESSION_SECRET:randomBytes(32).toString('hex')});
  objects=new Map();let serial=0;
  const storage={
    async get(key){const o=objects.get(key);return o?{statusCode:200,blob:{etag:o.etag,contentType:o.type},stream:new Response(o.body).body}:null;},
    async put(key,body,options){const old=objects.get(key);if(old&&(!options.allowOverwrite||options.ifMatch&&options.ifMatch!==old.etag))throw new BlobPreconditionFailedError();const etag='"'+(++serial)+'"';objects.set(key,{body,type:options.contentType,etag});return {etag,pathname:key};}
  };
  const privateStore=createContentStore(storage,{currentPath:'private-gallery/index.json',historyPrefix:'private-gallery/history/'}),publicStore=createContentStore(storage);
  const routes={
    '/api/private-gallery':createPrivateGalleryHandler({store:privateStore,blob:storage}),
    '/api/private-image':createPrivateImageHandler({store:privateStore,blob:storage}),
    '/api/content':createContentHandler(publicStore),'/api/content-history':createHistoryHandler(publicStore)
  };
  for(const name of ['login','session','logout'])routes['/api/'+name]=(await load('api/'+name+'.js')).default;
  const config=JSON.parse(fs.readFileSync(path.join(root,'vercel.json')));
  server=http.createServer(async(req,res)=>{
    try{
      const url=new URL(req.url,'http://localhost');
      if(routes[url.pathname]){
        req.query=Object.fromEntries(url.searchParams);const chunks=[];for await(const chunk of req)chunks.push(chunk);req.body=Buffer.concat(chunks).toString();
        res.status=code=>{res.statusCode=code;return res;};res.json=body=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(body));return res;};
        return await routes[url.pathname](req,res);
      }
      const target=url.pathname==='/admin'?'/admin.html':url.pathname;
      if(!/^\/[a-zA-Z0-9_-]+\.(?:html|css|js)$/.test(target)){res.writeHead(404);return res.end();}
      const file=path.join(root,'dist',target.slice(1));if(!fs.existsSync(file)){res.writeHead(404);return res.end();}
      for(const header of config.headers.find(rule=>rule.source==='/(.*)').headers)res.setHeader(header.key,header.value);
      res.setHeader('Content-Type',target.endsWith('.js')?'text/javascript':target.endsWith('.css')?'text/css':'text/html');fs.createReadStream(file).pipe(res);
    }catch{res.writeHead(500);res.end();}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base='http://localhost:'+server.address().port;
  browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{}),args:['--no-sandbox',...(process.env.CHROMIUM_SINGLE_PROCESS==='1'?['--no-zygote','--single-process','--disable-gpu','--disable-software-rasterizer']:[])]});
});
after(async()=>{await browser?.close();if(server)await new Promise(resolve=>server.close(resolve));if(priorEnv)for(const [key,value] of Object.entries(priorEnv))value===undefined?delete process.env[key]:process.env[key]=value;});

test('private gallery: anonymous hidden, real API upload, preview/search, re-login persistence and expiry cleanup',async()=>{
  const context=await browser.newContext({viewport:{width:375,height:850}}),page=await context.newPage();const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  async function login(){await page.locator('#adminLoginForm [name=username]').fill('fixture-owner');await page.locator('#adminLoginForm [name=password]').fill('fixture-only');await page.locator('#adminLoginForm button[type=submit]').click();await page.locator('#privateUploadFields').waitFor({state:'visible'});await page.waitForFunction(()=>!document.getElementById('privateUploadFields').disabled);}
  try{
    await page.goto(base+'/admin');await page.locator('#loginPanel').waitFor({state:'visible'});assert.equal(await page.locator('#privateGallery').isVisible(),false);
    assert.equal((await context.request.get(base+'/api/private-gallery')).status(),401);
    await login();
    const png=await page.evaluate(()=>{const canvas=document.createElement('canvas');canvas.width=80;canvas.height=80;const ctx=canvas.getContext('2d');ctx.fillStyle='#164888';ctx.fillRect(0,0,80,80);return canvas.toDataURL('image/png').split(',')[1];});
    await page.locator('#privateUploadForm [name=title]').fill('Synthetic DR fixture');
    await page.locator('#privateUploadForm [name=description]').fill('Synthetic image, no patient data');
    await page.locator('#privateUploadForm [name=images]').setInputFiles([1,2].map(n=>({name:'fixture-'+n+'.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')})));
    await page.locator('#privateUploadButton').click();await page.waitForFunction(()=>document.getElementById('privateProgress').textContent.includes('已保存 2 张'));
    await page.waitForFunction(()=>document.querySelectorAll('#privateList img').length===2);
    assert.equal(objects.has('cms/content.json'),false);assert.equal(objects.has('private-gallery/index.json'),true);
    const index=JSON.parse(objects.get('private-gallery/index.json').body),imagePath=index.cases[0].images[0];
    assert(index.cases.every(item=>item.published===false));assert.equal((await context.request.get(base+'/api/private-image?path='+encodeURIComponent(imagePath))).status(),200);
    assert.deepEqual((await (await context.request.get(base+'/api/content')).json()).cases,[]);
    await page.locator('#privateCategory').selectOption('外伤');assert.equal(await page.locator('.private-image-card').count(),0);
    await page.locator('#privateCategory').selectOption('DR');await page.locator('#privateSearch').fill('no match');assert.equal(await page.locator('.private-image-card').count(),0);
    await page.locator('#privateSearch').fill('Synthetic');await page.locator('#privateList img').first().waitFor();
    await page.locator('#privateList button').first().click();assert(await page.locator('.private-image-dialog').isVisible());await page.locator('.private-image-dialog button').click();
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.setViewportSize({width:1440,height:950});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    if(process.env.PRIVATE_GALLERY_SCREENSHOT)await page.screenshot({path:process.env.PRIVATE_GALLERY_SCREENSHOT,fullPage:true});
    await page.locator('#adminLogout').click();await page.locator('#loginPanel').waitFor({state:'visible'});assert.equal(await page.locator('#privateList img').count(),0);
    assert.equal((await context.request.get(base+'/api/private-image?path='+encodeURIComponent(imagePath))).status(),401);
    await login();await page.waitForFunction(()=>document.querySelectorAll('#privateList img').length===2);
    let posts=0;
    await page.route('**/api/private-gallery',route=>{
      if(route.request().method()==='POST'&&++posts===2)return route.fulfill({status:503,json:{error:'Synthetic interruption'}});
      return route.continue();
    });
    await page.locator('#privateUploadForm [name=title]').fill('Synthetic interrupted batch');
    await page.locator('#privateUploadForm [name=images]').setInputFiles([3,4].map(n=>({name:'fixture-'+n+'.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')})));
    await page.locator('#privateUploadButton').click();await page.waitForFunction(()=>document.getElementById('privateError').textContent.includes('Synthetic interruption'));
    assert.equal(JSON.parse(objects.get('private-gallery/index.json').body).cases.length,3);
    assert.match(await page.locator('#privateUploadButton').textContent(),/剩余 1 张/);
    await page.locator('#privateRefresh').click();await page.waitForFunction(()=>!document.getElementById('privateUploadFields').disabled);
    await page.locator('#privateUploadButton').click();await page.waitForFunction(()=>document.getElementById('privateProgress').textContent.includes('已保存 1 张'));
    assert.equal(JSON.parse(objects.get('private-gallery/index.json').body).cases.length,4);
    await context.clearCookies();await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));await page.locator('#loginPanel').waitFor({state:'visible'});
    assert.equal(await page.locator('#privateGallery').isVisible(),false);assert.equal(await page.locator('#privateList img').count(),0);
    assert.deepEqual(errors,[]);
  }finally{await context.close();}
});
