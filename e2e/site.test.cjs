const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {test, before, after} = require('node:test');
const {chromium} = require('playwright');
const root = path.resolve(__dirname, '..');
let server, browser, base;

before(async () => {
  const config = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json')));
  const publicRoot=path.join(root,config.outputDirectory);
  server = http.createServer((req, res) => {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    const rewrite = config.rewrites.find(rule => rule.source.endsWith(':path*')
      ? pathname.startsWith(rule.source.slice(0, -':path*'.length)) : pathname === rule.source);
    const direct=pathname==='/'?'/index.html':pathname;
    // Match Vercel's filesystem precedence so the homepage cannot silently
    // fall back to the much heavier clinical entry point after deployment.
    const directFile=/^\/[a-zA-Z0-9_-]+\.(?:html|js|css|json)$/.test(direct)&&fs.existsSync(path.join(publicRoot,direct.slice(1)));
    const target = directFile?direct:rewrite?.destination || pathname;
    if (!/^\/[a-zA-Z0-9_-]+\.(?:html|js|css|json)$/.test(target)) {res.writeHead(404);res.end();return;}
    const file = path.join(publicRoot, target.slice(1));
    if (!fs.existsSync(file)) {res.writeHead(404);res.end();return;}
    for (const header of config.headers.find(rule=>rule.source==='/(.*)')?.headers || []) res.setHeader(header.key,header.value);
    const type = target.endsWith('.css') ? 'text/css' : target.endsWith('.js') ? 'application/javascript' : target.endsWith('.json')?'application/json':'text/html';
    res.setHeader('Content-Type', type+'; charset=utf-8');
    fs.createReadStream(file).pipe(res);
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  base = 'http://127.0.0.1:'+server.address().port;
  browser = await chromium.launch({headless:true,
    ...(process.env.CHROMIUM_EXECUTABLE_PATH ? {executablePath:process.env.CHROMIUM_EXECUTABLE_PATH} : {}),
    args:['--no-sandbox']});
});
after(async()=>{await browser?.close();if(server)await new Promise(resolve=>server.close(resolve));});

async function pageFor(width=1440, options={}) {
  const context = await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce',...options});
  // Anonymous/read-only content fixtures keep these UI tests independent of private storage.
  // API authorization is exercised by test/security.test.js, rather than this static server.
  await context.route('**/api/session',route=>route.fulfill({json:{authenticated:false,user:null}}));
  await context.route('**/api/content',route=>route.fulfill({json:{version:1,revision:'fixture-v1',templateOverrides:{},cases:[]}}));
  const page = await context.newPage();
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  return {page, context, errors};
}
async function settle(page) {await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));}

test('homepage is usable without JavaScript and avoids loading clinical data', async()=>{
  const {page,context}=await pageFor(393,{javaScriptEnabled:false});
  try {await page.goto(base+'/');assert(await page.locator('#portalHome').isVisible());
    assert.equal(await page.getByRole('link',{name:'病历模板',exact:true}).count(),1);
    assert.equal(await page.locator('script[src*="app.js"],script[src*="record-quality"],#libraryShell').count(),0);
    assert.equal(await page.locator('.official-feature').count(),4);
  } finally {await context.close();}
});

test('every orthopedic card keeps both borders inside its category on phones and computers', {timeout:120000}, async()=>{
  for(const width of [320,375,393,768,1280,1440,1920]) {
    const {page,context,errors}=await pageFor(width);
    try {await page.goto(base+'/bl/guke',{waitUntil:'networkidle'});
      assert.equal(await page.locator('.ortho-disease-card').count(),201);
      const categories=page.locator('.ortho-category');
      for(let i=0;i<await categories.count();i++) {
        await categories.nth(i).scrollIntoViewIfNeeded();await settle(page);
        const cards=await categories.nth(i).evaluate(category=>{
          const parent=category.getBoundingClientRect();
          return [...category.querySelectorAll('.ortho-disease-card')].map(card=>{
            const r=card.getBoundingClientRect();return {left:r.left,right:r.right,parentLeft:parent.left,parentRight:parent.right,scroll:card.scrollWidth,client:card.clientWidth};
          });
        });
        for(const card of cards) {assert(card.left>card.parentLeft&&card.right<card.parentRight,`card border at ${width}px`);
          assert(card.right<width,`right border outside viewport at ${width}px`);assert(card.scroll<=card.client+1,`card text overflow at ${width}px`);}
      }
      assert.deepEqual(errors,[]);
    } finally {await context.close();}
  }
});

test('cross-department search, filters, pagination, preview and empty-state reset work',async()=>{
  const {page,context,errors}=await pageFor(393);
  try {await page.goto(base+'/bl',{waitUntil:'networkidle'});
    assert.equal(await page.evaluate(()=>templates.length),0);
    const search=page.getByRole('textbox',{name:'搜索病历模板'});
    await search.fill('肝脓肿');await page.waitForFunction(()=>document.querySelector('#resultTitle').textContent.includes('搜索结果'));
    assert.equal(await page.evaluate(()=>templates.length),5159);
    assert.equal(await search.inputValue(),'肝脓肿');assert((await page.locator('#templateGrid').innerText()).includes('普外科'));
    assert(await page.locator('#templateGrid .card').evaluateAll(cards=>cards.every(card=>{const r=card.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&card.scrollWidth<=card.clientWidth+1;})));
    await page.locator('#templateGrid .preview').first().click();await page.getByRole('dialog',{name:/肝脓肿/}).waitFor({state:'visible'});await page.keyboard.press('Escape');
    await search.fill('术前');await page.waitForFunction(()=>document.querySelectorAll('#templateGrid .card').length===60);
    await page.getByRole('button',{name:'显示更多',exact:true}).click();assert.equal(await page.locator('#templateGrid .card').count(),120);
    await search.fill('不存在的资料xyz');await page.waitForSelector('#emptyState:visible');assert.equal(await page.locator('#templateGrid .card').count(),0);
    await page.getByRole('button',{name:'重置',exact:true}).click();assert.equal(await page.locator('[data-department]').count(),4);assert.equal(await search.inputValue(),'');
    await page.locator('#stageFilter').selectOption('术中');await page.waitForFunction(()=>document.querySelectorAll('#templateGrid .card').length===60);
    assert(await page.locator('#templateGrid .tag.stage').evaluateAll(tags=>tags.every(tag=>tag.textContent==='术中')));
    assert.deepEqual(errors,[]);
  } finally {await context.close();}
});

test('department browsing loads only its catalog; record bodies arrive on demand and can retry',async()=>{
  const {page,context,errors}=await pageFor(393);
  try{
    const requests=[];page.on('request',request=>requests.push(new URL(request.url()).pathname));
    await page.goto(base+'/bl/puwai',{waitUntil:'networkidle'});
    assert.equal(await page.evaluate(()=>templates.length),9);
    assert.equal(requests.filter(url=>url.startsWith('/catalog-')).length,1);
    assert(requests.some(url=>url.startsWith('/catalog-puwai-')));assert(!requests.some(url=>url.startsWith('/records-')));
    let failed=false;
    await context.route('**/records-*.json',route=>{if(!failed){failed=true;return route.fulfill({status:503,json:{error:'Temporary failure'}});}return route.continue();});
    await page.locator('[data-disease]').first().click();await page.locator('#retryRecords').waitFor({state:'visible'});
    assert.equal(await page.locator('.record-book-body').count(),0);
    await page.getByRole('button',{name:'重试',exact:true}).click();await page.locator('.record-book-body').first().waitFor({state:'visible'});
    assert((await page.locator('.record-book-body').first().textContent()).length>100);assert.deepEqual(errors,[]);
  }finally{await context.close();}
});

test('a slow earlier disease request cannot replace the newer selection',async()=>{
  const {page,context,errors}=await pageFor(1440);
  try{
    await page.goto(base+'/bl/guke',{waitUntil:'networkidle'});
    const url=await page.evaluate(()=>window.HAJIMI.manifest.bodies['骨科\0TKA']);
    await context.route('**'+url,async route=>{await new Promise(resolve=>setTimeout(resolve,200));await route.continue();});
    await page.locator('[data-ortho-route="TKA"]').click();await page.locator('[data-ortho-route="THA"]').click();
    await page.waitForFunction(()=>document.querySelector('#resultTitle').textContent.includes('全髋'));
    await page.waitForTimeout(250);assert((await page.locator('#resultTitle').innerText()).includes('全髋'));
    assert.match(await page.title(),/全髋/);assert.deepEqual(errors,[]);
  }finally{await context.close();}
});

test('patient summary stays hidden until supplied and disappears after clearing',async()=>{
  const {page,context,errors}=await pageFor(375);
  try {await page.goto(base+'/bl',{waitUntil:'networkidle'});assert.equal(await page.locator('#patientStrip').isVisible(),false);
    await page.getByRole('button',{name:'患者信息',exact:true}).click();
    await page.locator('#patientForm input[name="name"]').fill('示例患者');
    await page.locator('#savePatient').click();assert(await page.locator('#patientStrip').isVisible());
    assert((await page.locator('#patientStrip').innerText()).includes('示例患者'));
    await page.getByRole('button',{name:'患者信息',exact:true}).click();await page.locator('#clearPatientBtn').click();
    assert.equal(await page.locator('#patientStrip').isVisible(),false);assert.deepEqual(errors,[]);
  }finally{await context.close();}
});

test('Chinese composition completes before search results are replaced',async()=>{
  const {page,context}=await pageFor();
  try {await page.goto(base+'/bl',{waitUntil:'networkidle'});
    await page.locator('#searchInput').evaluate(input=>{input.value='肝脓肿';input.dispatchEvent(new InputEvent('input',{bubbles:true,isComposing:true}));});
    await page.waitForTimeout(160);assert.equal(await page.locator('[data-department]').count(),4);
    await page.locator('#searchInput').dispatchEvent('compositionend');await page.waitForFunction(()=>document.querySelector('#resultTitle').textContent.includes('搜索结果'));
    assert((await page.locator('#templateGrid').innerText()).includes('肝脓肿'));
  } finally {await context.close();}
});

test('keyboard skip link, named dialogs and Enter calculation are usable',async()=>{
  const {page,context,errors}=await pageFor();
  try {await page.goto(base+'/tools',{waitUntil:'networkidle'});await page.keyboard.press('Tab');assert(await page.getByRole('link',{name:'跳到主要内容'}).evaluate(e=>e===document.activeElement));
    await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>document.activeElement.tagName),'MAIN');
    for(const [name,fields,result]of [
      ['打开 成人 BMI',{h:'180',w:'81'},/25\.0/],
      ['打开 体表面积 · Mosteller',{h:'180',w:'81'},/2\.01/],
      ['打开 阴离子间隙',{na:'140',cl:'104',hco3:'24'},/12/],
      ['打开 平均动脉压 MAP',{sbp:'120',dbp:'80'},/93\.3/],
      ['打开 休克指数 Shock Index',{hr:'90',sbp:'120'},/0\.75/]
    ]) {await page.getByRole('button',{name,exact:true}).click();assert(await page.locator('#dlg').isVisible());
      assert.equal(await page.evaluate(()=>document.activeElement.tagName),'INPUT');
      for(const [id,value]of Object.entries(fields))await page.locator('#'+id).fill(value);
      await page.keyboard.press('Enter');assert.match(await page.getByRole('status').filter({has:page.locator('strong')}).innerText(),result);await page.keyboard.press('Escape');}
    assert.deepEqual(errors,[]);
  } finally {await context.close();}
});

test('disease navigation starts at the top, preserves record content and chapter anchors',async()=>{
  const {page,context,errors}=await pageFor(1440);
  try {await page.goto(base+'/bl/guke',{waitUntil:'networkidle'});await page.locator('.ortho-disease-card').first().click();
    await page.locator('.record-book-body').first().waitFor({state:'visible'});
    assert.equal(await page.evaluate(()=>scrollY),0);assert.match(await page.title(),/全膝关节置换/);
    assert((await page.locator('.record-book-body').first().textContent()).length>100);
    const link=page.locator('.record-book-toc a').nth(10);await link.click();await settle(page);
    const top=await page.locator(await link.getAttribute('href')).evaluate(e=>e.getBoundingClientRect().top);assert(top>=60&&top<150);
    await page.emulateMedia({media:'print'});assert.equal(await page.locator('.record-book-toc').evaluate(e=>getComputedStyle(e).display),'none');
    assert.equal(await page.locator('.record-book-body').first().evaluate(e=>getComputedStyle(e).fontSize),'16px');assert.deepEqual(errors,[]);
  } finally {await context.close();}
});

test('failed content loading keeps administrator editing unavailable',async()=>{
  const {page,context,errors}=await pageFor();
  try {await context.route('**/api/session',route=>route.fulfill({json:{authenticated:true,user:'fixture-admin'}}));
    await context.route('**/api/content',route=>route.fulfill({status:503,json:{error:'Temporary storage failure'}}));
    await page.goto(base+'/bl/guke/TKA',{waitUntil:'networkidle'});await page.locator('.record-book-section .preview').first().click();
    assert.equal(await page.locator('#cmsEditTemplate,#cmsAddCase').count(),0);assert((await page.locator('#toast').textContent()).includes('加载失败'));assert.deepEqual(errors,[]);
  } finally {await context.close();}
});

test('failed template saves preserve the draft and preview; successful retry carries the loaded revision',async()=>{
  const {page,context,errors}=await pageFor(393);
  try{
    await context.route('**/api/session',route=>route.fulfill({json:{authenticated:true,user:'fixture-admin'}}));
    let writes=0,payload;
    await context.route('**/api/content',route=>{
      if(route.request().method()==='PUT'){
        payload=route.request().postDataJSON();writes++;
        return route.fulfill(writes===1?{status:503,json:{error:'备份失败，未保存'}}:{json:{...payload,revision:'fixture-v2'}});
      }
      return route.fulfill({json:{version:1,revision:'fixture-v1',templateOverrides:{},cases:[]}});
    });
    await page.goto(base+'/bl/guke/TKA',{waitUntil:'networkidle'});await page.locator('.record-book-section .preview').first().click();
    const before=await page.locator('#previewContent').innerText();await page.getByRole('button',{name:'编辑正文',exact:true}).click();
    await page.locator('#cmsEditBody').fill('测试草稿：保存失败后仍保留。');await page.getByRole('button',{name:'保存修改',exact:true}).click();
    await page.waitForSelector('#cmsEditError:visible');assert.equal(payload.revision,'fixture-v1');
    assert.equal(await page.locator('#cmsEditBody').inputValue(),'测试草稿：保存失败后仍保留。');assert.equal(await page.locator('#previewContent').innerText(),before);
    await page.getByRole('button',{name:'保存修改',exact:true}).click();await page.waitForSelector('#cmsEditDialog:not([open])',{state:'attached'});
    assert.equal(await page.locator('#previewContent').innerText(),'测试草稿：保存失败后仍保留。');assert.deepEqual(errors,[]);
  }finally{await context.close();}
});

test('administrator can download a backup and restore it with revision protection on phones and computers',async()=>{
  for(const width of [375,1440]){
    const {page,context,errors}=await pageFor(width);
    try{
      await context.route('**/api/session',route=>route.fulfill({json:{authenticated:true,user:'fixture-admin'}}));
      let revision='fixture-v1',restored=false,restorePayload;
      const backup={id:'1791500000000-550e8400-e29b-41d4-a716-446655440000',createdAt:'2026-10-09T00:00:00Z',user:'fixture-admin',action:'save',templateCount:1,caseCount:0};
      await context.route('**/api/content',route=>route.fulfill({json:{version:1,revision,templateOverrides:restored?{}:{sample:{body:'Fixture record'}},cases:[]}}));
      await context.route('**/api/content-history*',route=>{
        if(route.request().method()==='POST'){restorePayload=route.request().postDataJSON();revision='fixture-v2';restored=true;return route.fulfill({json:{ok:true}});}
        if(new URL(route.request().url()).searchParams.has('id'))return route.fulfill({json:{version:1,templateOverrides:{},cases:[]}});
        return route.fulfill({json:{revision,history:[backup]}});
      });
      await page.goto(base+'/admin',{waitUntil:'networkidle'});await page.waitForSelector('.admin-history-item');
      assert.equal(await page.locator('#overrideCount').innerText(),'1');
      const downloadEvent=page.waitForEvent('download');await page.getByRole('button',{name:'下载当前资料备份',exact:true}).click();
      assert.match((await downloadEvent).suggestedFilename(),/^hajimi-content-.*\.json$/);
      page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:'恢复此版本',exact:true}).click();
      await page.waitForFunction(()=>document.querySelector('#overrideCount').textContent==='0');assert.deepEqual(restorePayload,{id:backup.id,revision:'fixture-v1'});
      assert(await page.locator('.admin-history-item').evaluateAll(items=>items.every(item=>item.getBoundingClientRect().right<=innerWidth)));
      assert.deepEqual(errors,[]);
    }finally{await context.close();}
  }
});
