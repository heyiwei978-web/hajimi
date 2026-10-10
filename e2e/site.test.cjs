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
    assert.equal(await page.locator('.official-feature').count(),5);
    assert.equal(await page.locator('a.card-classification[href="/classification"]').count(),1);
  } finally {await context.close();}
});

test('classification is a separate department-first hub with 17 orthopedic dossiers, references, and deep links',async()=>{
 for(const width of [375,1440]){
  const {page,context,errors}=await pageFor(width);
  try{
    await page.goto(base+'/classification',{waitUntil:'networkidle'});
    assert.equal(await page.locator('.class-dept-card').count(),4);
    assert.equal(await page.locator('a.class-dept-card[href="/classification/guke"]').count(),1);
    assert.equal(await page.locator('.class-dept-card.is-pending').count(),3);
    assert.equal(await page.locator('.class-disease-card').count(),0,'root must first select a department');
    await page.locator('a.class-dept-card[href="/classification/guke"]').click();
    await page.waitForURL(/\/classification\/guke$/);
    assert.equal(await page.locator('.class-disease-card').count(),17);
    assert.equal(await page.locator('.class-area').count(),5);
    await page.locator('#diseaseFilter').fill('Schatzker');
    assert.equal(await page.locator('.class-disease-card:not([hidden])').count(),1);
    await page.locator('#diseaseFilter').fill('');
    await page.locator('a.class-disease-card[href="/classification/guke/femoral-neck"]').click();
    await page.waitForURL(/femoral-neck$/);
    assert.equal(await page.locator('.class-type').count(),4);
    assert.match(await page.locator('#class-images').innerText(),/Figure 1a/);
    assert.match(await page.locator('#class-sources').innerText(),/AAOS/);
    assert.equal(await page.locator('img').count(),0,'unlicensed clinical radiographs must not be embedded');
    await page.goto(base+'/classification/shennei',{waitUntil:'networkidle'});
    assert.match(await page.locator('.class-error').innerText(),/待建设/);
    assert.deepEqual(errors,[]);
  }finally{await context.close();}
 }
});

test('homepage search opens shareable clinical results and reset restores department selection',async()=>{
  for(const width of [320,375,1440]){
    const {page,context,errors}=await pageFor(width);
    try{
      const requests=[];page.on('request',request=>requests.push(new URL(request.url()).pathname));
      await page.goto(base+'/',{waitUntil:'networkidle'});
      assert.equal(requests.filter(url=>/^\/(?:catalog-|records-|app-runtime-|department-runtime-)/.test(url)).length,0,'landing stays independent of clinical data');
      const search=page.getByRole('searchbox',{name:'搜索病历模板',exact:true});
      const bounds=await search.boundingBox();assert(bounds.y>0&&bounds.y+bounds.height<900,'homepage search is in the initial viewport');
      assert.equal(await page.locator('.home-quick-grid a').count(),4);
      await search.fill('肝脓肿');await page.locator('.home-search button').click();
      await page.waitForURL(/\/bl\?q=/);await page.locator('.case-search-card').waitFor({state:'visible'});
      assert.equal(await page.locator('#searchInput').inputValue(),'肝脓肿');
      assert.equal(await page.locator('.case-search-card').count(),1);
      assert.match(await page.locator('.case-search-card').innerText(),/肝脓肿/);
      await page.locator('.library-guidance summary').click();
      assert(await page.locator('.library-guidance>span').isVisible(),'complete original usage instructions remain accessible');
      assert.match(await page.locator('.library-guidance>span').innerText(),/真实病历必须结合患者实际病史/);
      await page.reload({waitUntil:'networkidle'});await page.locator('.case-search-card').waitFor({state:'visible'});
      assert.equal(await page.locator('#searchInput').inputValue(),'肝脓肿','refresh restores the search query');
      await page.locator('#resetFilters').click();
      assert.equal(new URL(page.url()).searchParams.has('q'),false);
      assert.equal(await page.locator('[data-department]').count(),4);
      assert.equal(await page.locator('#searchInput').inputValue(),'');
      assert.deepEqual(errors,[]);
    }finally{await context.close();}
  }
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

test('cross-department search groups templates into complete case files; filters and empty reset work',async()=>{
  const {page,context,errors}=await pageFor(393);
  try {
    await page.goto(base+'/bl',{waitUntil:'networkidle'});
    assert.equal(await page.evaluate(()=>templates.length),0);
    const search=page.getByRole('textbox',{name:'搜索病历模板'});
    await search.fill('肝脓肿');
    await page.waitForFunction(()=>document.querySelector('#resultTitle').textContent.includes('搜索结果'));
    assert((await page.evaluate(()=>templates.length))>=5359);
    assert.equal(await page.locator('.case-search-card').count(),1,'one case entry per disease, not fragmented records');
    assert.match(await page.locator('.case-search-card').first().innerText(),/肝脓肿/);
    assert(await page.locator('.case-search-card').evaluateAll(cards=>cards.every(card=>{
      const r=card.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&card.scrollWidth<=card.clientWidth+1;
    })));
    await page.locator('.case-search-card').first().click();
    await page.locator('#caseWorkspace').waitFor({state:'visible'});
    assert.match(await page.locator('#caseWorkspace .case-nav-family').first().innerText(),/临床病历/);
    assert.match(await page.locator('#caseWorkspace .case-nav-family').nth(1).innerText(),/知情同意/);
    assert.equal(await page.locator('#caseWorkspace .case-file-reader > .record-book-section:visible').count(),1);
    await page.locator('#caseShowAll').click();
    assert((await page.locator('#caseWorkspace .case-file-reader > .record-book-section:visible').count())>1);
    await page.goto(base+'/bl',{waitUntil:'networkidle'});
    await page.locator('#searchInput').fill('术前');
    await page.waitForFunction(()=>document.querySelectorAll('.case-search-card').length===24);
    await page.getByRole('button',{name:'显示更多',exact:true}).click();
    assert.equal(await page.locator('.case-search-card').count(),48);
    await page.locator('#searchInput').fill('不存在的资料xyz');
    await page.waitForSelector('#emptyState:visible');
    assert.equal(await page.locator('.case-search-card').count(),0);
    await page.getByRole('button',{name:'重置',exact:true}).click();
    assert.equal(await page.locator('[data-department]').count(),4);
    assert.equal(await page.locator('#searchInput').inputValue(),'');
    await page.locator('#stageFilter').selectOption('术中');
    await page.waitForFunction(()=>document.querySelectorAll('.case-search-card').length>0);
    assert((await page.locator('.case-search-card').count())>0);
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

test('disease favorites persist, recent visits deduplicate and another tab reflects removal',async()=>{
  for(const width of [375,1440]){
    const {page,context,errors}=await pageFor(width);
    try{
      await page.goto(base+'/bl/guke/TKA',{waitUntil:'networkidle'});
      await page.getByRole('button',{name:'患者信息',exact:true}).click();await page.locator('#patientForm input[name="name"]').fill('仅会话内的示例姓名');await page.locator('#savePatient').click();
      const favorite=page.locator('#favoriteDisease');await favorite.click();assert.equal(await favorite.getAttribute('aria-pressed'),'true');
      await page.reload({waitUntil:'networkidle'});assert.equal(await favorite.getAttribute('aria-pressed'),'true');
      await page.goto(base+'/bl/guke/THA',{waitUntil:'networkidle'});
      const other=await context.newPage();await other.goto(base+'/bl',{waitUntil:'networkidle'});
      const columns=other.locator('#libraryPersonal .personal-column');assert.equal(await columns.nth(0).locator('a').count(),1);assert.equal(await columns.nth(1).locator('a').count(),2);
      assert.match(await columns.nth(1).locator('a').first().innerText(),/全髋/);
      const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('hajimi-library-personal-v1')));
      for(const value of [...saved.favorites,...saved.recent])assert.deepEqual(Object.keys(value).sort(),['department','group']);
      assert(!JSON.stringify(saved).includes('示例姓名'));
      await page.goto(base+'/bl/guke/TKA',{waitUntil:'networkidle'});
      await other.getByRole('button',{name:'取消收藏 全膝关节置换',exact:true}).click();await page.waitForFunction(()=>document.getElementById('favoriteDisease').getAttribute('aria-pressed')==='false');
      await other.getByRole('button',{name:'清空最近访问',exact:true}).click();assert.equal(await columns.nth(1).locator('a').count(),0);
      assert(await other.locator('#libraryPersonal').evaluate(panel=>panel.scrollWidth<=panel.clientWidth+1));assert.deepEqual(errors,[]);
    }finally{await context.close();}
  }
});

test('blocked browser storage leaves favorites usable in the current page',async()=>{
  const {page,context,errors}=await pageFor(375);
  try{
    await context.addInitScript(()=>{Storage.prototype.getItem=function(){throw new DOMException('Blocked','SecurityError');};Storage.prototype.setItem=function(){throw new DOMException('Blocked','SecurityError');};});
    await page.goto(base+'/bl/guke/TKA',{waitUntil:'networkidle'});await page.locator('#favoriteDisease').click();
    assert.equal(await page.locator('#favoriteDisease').getAttribute('aria-pressed'),'true');
    await page.locator('#departmentBack').click();await page.locator('#departmentBack').click();await page.locator('#libraryPersonal').waitFor();
    assert.match(await page.locator('.personal-storage-status').innerText(),/暂不允许保存/);assert.equal(await page.locator('#libraryPersonal .personal-column').first().locator('a').count(),1);
    assert.deepEqual(errors,[]);
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

test('duty drafts survive refresh, export accurate handoffs and remain isolated to the tab',async()=>{
  for(const width of [320,375,1440]){
    const {page,context,errors}=await pageFor(width);
    try{
      const requests=[];page.on('request',request=>requests.push(new URL(request.url()).pathname));
      await page.goto(base+'/duty',{waitUntil:'networkidle'});assert(!requests.some(url=>url.startsWith('/catalog-')||url.startsWith('/records-')||url==='/api/content'));
      await page.locator('[data-check]').first().check();await page.locator('#dutyTaskForm input[name="title"]').fill('核对待回报检查');await page.locator('#dutyTaskForm input[name="due"]').fill('2020-01-01T09:00');await page.getByRole('button',{name:'添加待办',exact:true}).click();
      await page.locator('#dutyTaskForm input[name="title"]').fill('整理交班材料');await page.getByRole('button',{name:'添加待办',exact:true}).click();await page.getByRole('checkbox',{name:'完成 整理交班材料',exact:true}).check();await page.locator('#dutyNotes').fill('复评后更新交班记录');
      await page.reload({waitUntil:'networkidle'});assert(await page.locator('[data-check]').first().isChecked());assert.equal(await page.locator('#dutyTaskCount').innerText(),'1 项待办');assert.match(await page.locator('.time-due').innerText(),/时间已到/);assert.equal(await page.locator('#dutyNotes').inputValue(),'复评后更新交班记录');
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      await page.getByRole('button',{name:'生成交班摘要',exact:true}).click();const summary=await page.locator('#dutySummaryText').inputValue();assert.match(summary,/交班核对：1 \/ 12 项/);assert.match(summary,/未完成事项：\n□ 核对待回报检查/);assert.match(summary,/已完成事项：\n✓ 整理交班材料/);assert.match(summary,/复评后更新交班记录/);
      const downloading=page.waitForEvent('download');await page.getByRole('button',{name:'下载文本',exact:true}).click();const download=await downloading;assert.equal(fs.readFileSync(await download.path(),'utf8'),summary);await page.keyboard.press('Escape');
      await page.evaluate(()=>window.dispatchEvent(new Event('beforeprint')));await page.emulateMedia({media:'print'});assert(await page.locator('#dutyPrintSummary').isVisible());assert.match(await page.locator('#dutyPrintSummary').innerText(),/核对待回报检查/);assert.equal(await page.locator('.duty-tasks').isVisible(),false);await page.emulateMedia({media:'screen'});
      const another=await context.newPage();await another.goto(base+'/duty',{waitUntil:'networkidle'});assert.equal(await another.locator('#dutyTaskList li').count(),0);assert.equal(await another.locator('#dutyNotes').inputValue(),'');assert.equal(await page.evaluate(()=>localStorage.getItem('hajimi-duty-session-v1')),null);
      page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:'清空本班草稿',exact:true}).click();assert.equal(await page.locator('#dutyTaskList li').count(),0);assert.equal(await page.locator('#dutyNotes').inputValue(),'');assert.deepEqual(errors,[]);
    }finally{await context.close();}
  }
});

test('duty tool links open the requested calculator, and blocked storage or clipboard is explained',async()=>{
  const {page,context,errors}=await pageFor(375);
  try{
    await context.addInitScript(()=>{Storage.prototype.setItem=function(){throw new DOMException('Blocked','SecurityError');};Object.defineProperty(navigator,'clipboard',{value:{writeText:async()=>{throw new Error('Blocked');}}});});
    await page.goto(base+'/duty',{waitUntil:'networkidle'});await page.locator('#dutyNotes').fill('示例交班备注');assert(await page.locator('#dutyStorageStatus').isVisible());
    await page.locator('#dutySummaryButton').click();await page.locator('#dutyCopy').click();assert.match(await page.locator('#dutyCopyStatus').innerText(),/系统复制/);await page.keyboard.press('Escape');
    await page.getByRole('link',{name:/NEWS2/}).click();await page.getByRole('dialog',{name:'NEWS2',exact:true}).waitFor({state:'visible'});assert.deepEqual(errors,[]);
    await page.goto(base+'/tools?tool=constructor',{waitUntil:'networkidle'});assert.equal(await page.locator('#dlg').isVisible(),false);
  }finally{await context.close();}
});

test('disease navigation starts at the top, preserves record content and chapter anchors',async()=>{
  const {page,context,errors}=await pageFor(1440);
  try {await page.goto(base+'/bl/guke',{waitUntil:'networkidle'});await page.locator('.ortho-disease-card').first().click();
    await page.locator('.record-book-body').first().waitFor({state:'visible'});
    assert.equal(await page.evaluate(()=>scrollY),0);assert.match(await page.title(),/全膝关节置换/);
    assert((await page.locator('.record-book-body').first().textContent()).length>100);
    const link=page.locator('.record-book-toc a').nth(10);await link.click();await settle(page);
    const selected=page.locator(await link.getAttribute('href'));assert(await selected.isVisible());assert.equal(await link.getAttribute('aria-current'),'location');assert.equal(await page.locator('#caseWorkspace .case-file-reader > .record-book-section:visible').count(),1);
    await page.emulateMedia({media:'print'});assert.equal(await page.locator('.record-book-toc').evaluate(e=>getComputedStyle(e).display),'none');
    assert.equal(await page.locator('.record-book-body').first().evaluate(e=>getComputedStyle(e).fontSize),'16px');assert.deepEqual(errors,[]);
  } finally {await context.close();}
});

test('bottom reading actions follow document order, keep directory selection and preserve print and expanded modes',async()=>{
  for(const width of [320,768,1440]){
    const {page,context,errors}=await pageFor(width,{isMobile:width===320,hasTouch:width===320});
    try{
      await page.goto(base+'/bl/guke/TKA',{waitUntil:'networkidle'});
      const records=page.locator('#caseWorkspace .case-file-reader > .record-book-section');
      const ids=await records.evaluateAll(items=>items.map(item=>item.id));
      const original=await records.first().locator('.record-book-body').textContent();
      const current=page.locator('#caseWorkspace .case-file-reader > .case-active');
      assert(ids.length>2);
      assert.equal(await current.getAttribute('id'),ids[0]);
      assert(await page.locator('#casePreviousBottom').isDisabled());
      assert(await page.locator('#casePrevious').isDisabled());
      assert(await page.locator('.case-nav-item b').evaluateAll(items=>items.every(item=>parseFloat(getComputedStyle(item).fontSize)>=17)));
      await page.locator('.case-file-bottom-nav').scrollIntoViewIfNeeded();await settle(page);
      assert(await page.locator('.case-file-bottom-actions button:visible').evaluateAll(buttons=>buttons.every(button=>{
        const r=button.getBoundingClientRect(),text=document.createRange();text.selectNodeContents(button);
        return r.left>=0&&r.right<=innerWidth&&r.height>=48&&text.getClientRects().length===1;
      })),`readable bottom actions at ${width}px`);
      await page.locator('#caseNextBottom').click();await settle(page);
      assert.equal(await current.getAttribute('id'),ids[1]);
      assert.equal(decodeURIComponent(new URL(page.url()).hash.slice(1)),ids[1]);
      assert.match(await page.locator('#caseBottomSection').innerText(),/02 \/ /);
      assert(await current.locator('h3').evaluate(element=>element===document.activeElement));
      const record=await current.boundingBox(),header=await page.locator('.library-topbar').boundingBox();
      assert(record.y>=header.y+header.height+10,'next document clears the header');
      await page.locator('#casePreviousBottom').click();await settle(page);
      assert.equal(await current.getAttribute('id'),ids[0]);
      assert.equal(await current.locator('.record-book-body').textContent(),original);
      await page.locator('#caseBackToDirectory').click();await settle(page);
      const sidebar=await page.locator('#recordBookToc').boundingBox();
      assert(sidebar.y>=header.y+header.height+10,'return places directory below header');
      assert(await page.locator('.case-nav-item[aria-current="location"]').evaluate(element=>{
        const r=element.getBoundingClientRect(),parent=element.closest('aside').getBoundingClientRect();
        return element===document.activeElement&&r.top>=parent.top&&r.bottom<=parent.bottom;
      }),'return focuses the visible selected document');
      // Directory groups differ from chronological reading order.
      await page.locator('[data-case-record="'+ids.at(-1)+'"]').click();
      assert.equal(await current.getAttribute('id'),ids.at(-1));
      assert(await page.locator('#caseNextBottom').isDisabled());
      assert(await page.locator('#caseNext').isDisabled());
      await page.reload({waitUntil:'networkidle'});
      assert.equal(await current.getAttribute('id'),ids.at(-1),'refresh restores the selected document');
      await page.locator('#caseShowAll').click();
      assert.equal(await records.filter({visible:true}).count(),ids.length);
      assert.equal(await page.locator('#caseNextBottom').isVisible(),false);
      assert(await page.locator('#caseShowSelectedBottom').isVisible());
      await page.locator('#caseShowSelectedBottom').click();await settle(page);
      assert.equal(await records.filter({visible:true}).count(),1);
      assert.equal(await current.getAttribute('id'),ids.at(-1));
      await page.evaluate(()=>{window.print=()=>{};});
      await page.locator('#printWholeRecord').click();
      assert.equal(await records.filter({visible:true}).count(),1,'print does not change reading mode');
      await page.emulateMedia({media:'print'});
      assert.equal(await records.filter({visible:true}).count(),ids.length,'print includes the complete case file');
      assert.equal(await page.locator('.case-file-bottom-nav').isVisible(),false);
      assert.equal(await page.locator('#previewDialog').isVisible(),false,'closed preview does not add duplicate printed content');
      assert.equal(await records.first().locator('.record-book-body').evaluate(element=>getComputedStyle(element).fontSize),'16px');
      await page.emulateMedia({media:'screen'});
      assert.equal(await records.filter({visible:true}).count(),1);
      assert.equal(await current.locator('.record-book-body').evaluate(element=>getComputedStyle(element).fontSize),'18px');
      await current.locator('.preview').click();
      assert.equal(await page.locator('#previewContent').evaluate(element=>getComputedStyle(element).fontSize),'18px');
      await page.emulateMedia({media:'print'});
      assert(await page.locator('#previewContent').isVisible(),'preview printing shows the selected document');
      assert.equal(await records.filter({visible:true}).count(),0,'preview printing excludes the complete case file');
      assert.deepEqual(errors,[]);
    }finally{await context.close();}
  }
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

test('central management searches, paginates, edits templates and cases, and maintains image references',async()=>{
  for(const width of [320,1440]){
    const {page,context,errors}=await pageFor(width);
    try{
      let data={version:1,revision:'fixture-v1',templateOverrides:{'示例病种 · 入院记录':{body:'原有自定义正文'}},cases:Array.from({length:54},(_,index)=>({id:'case-'+index,template:'示例病种 · 入院记录',title:'案例 '+index,description:'经过脱敏的说明',published:index!==0,images:index<2?['cases/shared.jpg']:[],createdAt:'2026-01-01T00:00:00Z'}))},writes=0,uploads=[];
      await context.route('**/api/session',route=>route.fulfill({json:{authenticated:true,user:'fixture-admin'}}));
      await context.route('**/api/content-history*',route=>route.fulfill({json:{revision:data.revision,history:[]}}));
      await context.route('**/api/content',route=>{
        if(route.request().method()==='PUT'){const next=route.request().postDataJSON();assert.equal(next.revision,data.revision);writes++;data={...next,revision:'fixture-v'+(writes+1)};}
        return route.fulfill({json:data});
      });
      await context.route('**/api/upload',route=>{uploads.push(route.request().postDataJSON());return route.fulfill({json:{pathname:'cases/new-upload.jpg'}});});
      await context.route('**/api/image?*',route=>route.fulfill({status:404,body:''}));
      await page.goto(base+'/admin',{waitUntil:'networkidle'});await page.locator('#managerList .manager-item').waitFor();
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.getByRole('button',{name:'编辑正文',exact:true}).click();assert(await page.getByRole('button',{name:'保存正文',exact:true}).evaluate(button=>button.getBoundingClientRect().bottom<=innerHeight));await page.locator('#managedTemplateBody').fill('更新后的自定义正文');await page.getByRole('button',{name:'保存正文',exact:true}).click();await page.waitForSelector('#managedTemplateDialog:not([open])',{state:'attached'});await page.waitForFunction(()=>!document.getElementById('managerControls').disabled);assert.equal(data.templateOverrides['示例病种 · 入院记录'].body,'更新后的自定义正文');
      page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:'恢复默认',exact:true}).click();await page.waitForFunction(()=>document.getElementById('overrideCount').textContent==='0');assert.equal(Object.keys(data.templateOverrides).length,0);
      await page.locator('#managerKind').selectOption('cases');assert.equal(await page.locator('#managerList .manager-item').count(),50);await page.locator('#managerMore').click();assert.equal(await page.locator('#managerList .manager-item').count(),54);await page.locator('#managerPublish').selectOption('draft');assert.equal(await page.locator('#managerList .manager-item').count(),1);
      await page.getByRole('button',{name:'编辑案例',exact:true}).click();await page.locator('#managedCaseForm input[name="title"]').fill('脱敏演示案例');await page.locator('#managedCaseForm textarea[name="description"]').fill('更新后的案例说明');await page.locator('#managedCaseForm input[name="published"]').check();await page.getByRole('button',{name:'移除引用',exact:true}).click();
      const png=await page.evaluate(()=>{const canvas=document.createElement('canvas');canvas.width=2000;canvas.height=1000;canvas.getContext('2d').fillRect(0,0,2000,1000);return canvas.toDataURL('image/png').split(',')[1];});
      await page.locator('#managedCaseForm input[name="images"]').setInputFiles({name:'演示图片.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});await page.getByRole('button',{name:'保存案例',exact:true}).click();await page.waitForSelector('#managedCaseDialog:not([open])',{state:'attached'});await page.waitForFunction(()=>!document.getElementById('managerControls').disabled);
      assert.equal(uploads.length,1);assert.equal(uploads[0].type,'image/jpeg');assert.deepEqual([...Buffer.from(uploads[0].data,'base64').subarray(0,3)],[255,216,255]);
      const size=await page.evaluate(async data=>{const image=await createImageBitmap(new Blob([Uint8Array.from(atob(data),char=>char.charCodeAt(0))],{type:'image/jpeg'}));const size=[image.width,image.height];image.close();return size;},uploads[0].data);assert.deepEqual(size,[1800,900]);
      assert.equal(data.cases.length,54);assert.equal(data.cases[0].published,true);assert.equal(data.cases[0].createdAt,'2026-01-01T00:00:00Z');assert.deepEqual(data.cases[0].images,['cases/new-upload.jpg']);assert.deepEqual(data.cases[1].images,['cases/shared.jpg']);
      await page.locator('#managerKind').selectOption('images');assert.equal(await page.locator('#managerList .manager-item').count(),2);await page.locator('#managerSearch').fill('shared');assert.equal(await page.locator('#managerList .manager-item').count(),1);assert.match(await page.locator('#managerList').innerText(),/1 个案例引用/);
      assert(await page.locator('#managerList .manager-item').evaluateAll(rows=>rows.every(row=>row.scrollWidth<=row.clientWidth+1&&row.getBoundingClientRect().right<=innerWidth)));
      await page.getByRole('button',{name:/案例 1 · 管理引用/}).click();assert.equal(await page.locator('#managedCaseForm input[name="title"]').inputValue(),'案例 1');await page.keyboard.press('Escape');
      await page.locator('#managerKind').selectOption('cases');await page.locator('#managerPublish').selectOption('all');await page.locator('#managerSearch').fill('脱敏演示案例');assert.equal(await page.locator('#managerList .manager-item').count(),1);page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:'删除案例',exact:true}).click();await page.waitForFunction(()=>document.getElementById('caseCount').textContent==='53');assert.equal(data.cases.some(item=>item.id==='case-0'),false);assert.deepEqual(errors,[]);
    }finally{await context.close();}
  }
});

test('central editor preserves a conflicting draft and exports it without overwriting newer data',async()=>{
  const {page,context,errors}=await pageFor(375);
  try{
    const name='示例病种 · 入院记录';let attempts=0,lastPayload;
    await context.route('**/api/session',route=>route.fulfill({json:{authenticated:true,user:'fixture-admin'}}));
    await context.route('**/api/content-history*',route=>route.fulfill({json:{revision:'fixture-v1',history:[]}}));
    await context.route('**/api/content',route=>{if(route.request().method()==='PUT'){attempts++;lastPayload=route.request().postDataJSON();return route.fulfill({status:409,json:{error:'资料已在其他页面更新'}});}return route.fulfill({json:{version:1,revision:'fixture-v1',templateOverrides:{[name]:{body:'旧正文'}},cases:[]}});});
    await page.goto(base+'/admin',{waitUntil:'networkidle'});await page.getByRole('button',{name:'编辑正文',exact:true}).click();await page.locator('#managedTemplateBody').fill('待核对的编辑草稿');await page.getByRole('button',{name:'保存正文',exact:true}).click();await page.waitForSelector('#managedTemplateError:visible');assert.equal(lastPayload.revision,'fixture-v1');assert.equal(await page.locator('#managedTemplateBody').inputValue(),'待核对的编辑草稿');assert.match(await page.locator('#managedTemplateError').innerText(),/下载本次草稿/);
    const downloading=page.waitForEvent('download');await page.getByRole('button',{name:'下载本次草稿',exact:true}).click();const downloaded=JSON.parse(fs.readFileSync(await (await downloading).path(),'utf8'));assert.deepEqual(downloaded,{template:name,body:'待核对的编辑草稿'});
    await page.getByRole('button',{name:'保存正文',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('#managedTemplateForm button[type=submit]').disabled);assert.equal(attempts,2);assert.equal(lastPayload.revision,'fixture-v1');assert.deepEqual(errors,[]);
  }finally{await context.close();}
});

test('case retry reuses an uploaded image and logout clears private lists and editor drafts',async()=>{
  const {page,context,errors}=await pageFor(375);
  try{
    let authenticated=true,uploads=0,writes=0,data={version:1,revision:'fixture-v1',templateOverrides:{},cases:[{id:'private-case',template:'示例模板',title:'私有案例',description:'私有草稿说明',published:false,images:[]}]};
    await context.route('**/api/session',route=>route.fulfill({json:{authenticated,user:'fixture-admin'}}));await context.route('**/api/logout',route=>{authenticated=false;return route.fulfill({json:{ok:true}});});await context.route('**/api/content-history*',route=>route.fulfill({json:{revision:data.revision,history:[]}}));
    await context.route('**/api/content',route=>{if(route.request().method()==='PUT'){writes++;if(writes===1)return route.fulfill({status:503,json:{error:'备份失败，未保存'}});data={...route.request().postDataJSON(),revision:'fixture-v2'};}return route.fulfill({json:data});});
    await context.route('**/api/upload',route=>{uploads++;return route.fulfill({json:{pathname:'cases/upload-once.jpg'}});});await context.route('**/api/image?*',route=>route.fulfill({status:404}));
    await page.goto(base+'/admin',{waitUntil:'networkidle'});await page.locator('#managerKind').selectOption('cases');await page.getByRole('button',{name:'编辑案例',exact:true}).click();const png=await page.evaluate(()=>{const canvas=document.createElement('canvas');canvas.width=2;canvas.height=2;return canvas.toDataURL('image/png').split(',')[1];});await page.locator('#managedCaseForm input[name="images"]').setInputFiles({name:'retry.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});await page.locator('#managedCaseForm input[name="title"]').fill('保留的案例草稿');await page.getByRole('button',{name:'保存案例',exact:true}).click();await page.waitForSelector('#managedCaseError:visible');assert.equal(uploads,1);assert.equal(await page.locator('#managedCaseForm input[name="title"]').inputValue(),'保留的案例草稿');assert.equal(data.cases[0].title,'私有案例');
    await page.getByRole('button',{name:'保存案例',exact:true}).click();await page.waitForSelector('#managedCaseDialog:not([open])',{state:'attached'});await page.waitForFunction(()=>!document.getElementById('managerControls').disabled);assert.equal(uploads,1);assert.deepEqual(data.cases[0].images,['cases/upload-once.jpg']);assert.equal(data.cases[0].published,false);
    await page.getByRole('button',{name:'退出登录',exact:true}).click();await page.waitForSelector('#loginPanel:visible');assert.equal(await page.locator('#managerList .manager-item').count(),0);assert.equal(await page.locator('#managedCaseForm input[name="title"]').inputValue(),'');assert.equal(await page.locator('#managedCaseForm textarea[name="description"]').inputValue(),'');assert.equal(await page.locator('#managedCaseImages img').count(),0);assert.deepEqual(errors,[]);
  }finally{await context.close();}
});

test('failed admin reads disable management; late responses after logout cannot expose private data',async()=>{
  const {page,context,errors}=await pageFor(375);
  try{
    await context.route('**/api/session',route=>route.fulfill({json:{authenticated:true,user:'fixture-admin'}}));
    await context.route('**/api/content',route=>route.fulfill({status:503,json:{error:'资料读取失败'}}));await context.route('**/api/content-history*',route=>route.fulfill({status:503,json:{error:'历史读取失败'}}));
    await page.goto(base+'/admin',{waitUntil:'networkidle'});assert(await page.locator('#adminDataError').isVisible());assert.equal(await page.locator('#overrideCount').innerText(),'—');assert(await page.locator('#managerSearch').isDisabled());assert(await page.locator('#managerControls').evaluate(element=>element.disabled));assert(await page.locator('#downloadCurrent').isDisabled());assert.equal(await page.locator('#managerList .manager-item').count(),0);
    let release,authenticated=true;const pending=new Promise(resolve=>release=resolve);
    await context.route('**/api/session',route=>route.fulfill({json:{authenticated,user:'fixture-admin'}}));await context.route('**/api/logout',route=>{authenticated=false;return route.fulfill({json:{ok:true}});});
    await context.route('**/api/content',async route=>{await pending;return route.fulfill({json:{version:1,revision:'fixture-v1',templateOverrides:{private:{body:'私有模板正文'}},cases:[{id:'private',template:'private',title:'私有案例标题',published:false}]}});});
    await context.route('**/api/content-history*',async route=>{await pending;return route.fulfill({json:{revision:'fixture-v1',history:[]}});});
    await page.reload({waitUntil:'domcontentloaded'});await page.waitForSelector('#dashboardPanel:not([hidden])');await page.getByRole('button',{name:'退出登录',exact:true}).click();await page.waitForSelector('#loginPanel:visible');release();await page.waitForLoadState('networkidle');
    assert.equal(await page.locator('#dashboardPanel').isVisible(),false);assert.equal(await page.locator('#managerList .manager-item').count(),0);assert.equal(await page.locator('#managedTemplateBody').inputValue(),'');assert(!((await page.locator('body').innerText()).includes('私有案例标题')));assert.deepEqual(errors,[]);
  }finally{await context.close();}
});

test('library logout reports failures, then removes unpublished cases and clears their editor drafts',async()=>{
  const {page,context,errors}=await pageFor(375);
  try{
    let logouts=0;await context.route('**/api/session',route=>route.fulfill({json:{authenticated:true,user:'fixture-admin'}}));
    await context.route('**/api/logout',route=>{logouts++;return route.fulfill(logouts===1?{status:503,json:{error:'暂不可用'}}:{json:{ok:true}});});
    await context.route('**/api/content',async route=>{const name=await page.evaluate(()=>templates[+document.querySelector('.record-book-section .preview').dataset.index].name);return route.fulfill({json:{version:1,revision:'fixture-v1',templateOverrides:{},cases:[{id:'private',template:name,title:'未发布测试案例',description:'待清理的私有草稿',published:false,images:[]},{id:'public',template:name,title:'公开案例',published:true,images:[]}]}});});
    await page.goto(base+'/bl/guke/TKA',{waitUntil:'networkidle'});await page.locator('.record-book-section .preview').first().click();const privateCase=page.locator('.cms-case-card').filter({hasText:'未发布测试案例'});await privateCase.getByRole('button',{name:'编辑',exact:true}).click();assert.equal(await page.locator('#cmsCaseForm input[name="title"]').inputValue(),'未发布测试案例');await page.keyboard.press('Escape');await page.keyboard.press('Escape');
    await page.locator('#libraryShell [data-cms-logout]').click();await page.waitForFunction(()=>document.getElementById('toast').textContent.includes('退出失败'));assert.match(await page.locator('#toast').innerText(),/退出失败/);assert(await page.locator('#libraryShell [data-cms-badge]').isVisible());
    await page.locator('#libraryShell [data-cms-logout]').click();await page.waitForSelector('#libraryShell [data-cms-login]:not([hidden])');assert.equal(await page.locator('#cmsCaseForm input[name="title"]').inputValue(),'');assert.equal(await page.locator('#cmsCaseForm textarea[name="description"]').inputValue(),'');
    await page.locator('.record-book-section .preview').first().click();assert.equal(await privateCase.count(),0);assert.match(await page.locator('#cmsCases').innerText(),/公开案例/);assert.equal(await page.locator('#cmsEditTemplate,#cmsAddCase').count(),0);assert.deepEqual(errors,[]);
  }finally{await context.close();}
});

test('signed-in clinical headers, preview actions and editors remain usable on narrow and short screens',async()=>{
  for(const [width,height]of [[320,740],[375,812],[812,375],[1024,600]]){
    const {page,context,errors}=await pageFor(width,{viewport:{width,height},isMobile:width<400,hasTouch:width<400});
    try{
      await context.route('**/api/session',route=>route.fulfill({json:{authenticated:true,user:'fixture-admin'}}));
      await context.route('**/api/content',async route=>{
        const name=await page.evaluate(()=>templates[+document.querySelector('.record-book-section .preview').dataset.index].name);
        return route.fulfill({json:{version:1,revision:'fixture-v1',templateOverrides:{},cases:[{id:'long-title',template:name,title:'界面演示'+ 'A'.repeat(180),description:'https://example.invalid/'+ 'b'.repeat(240),published:true,images:[]}]}});
      });
      await page.goto(base+'/bl/guke/TKA',{waitUntil:'networkidle'});await settle(page);
      assert(await page.locator('.library-brand-copy strong').evaluate(element=>element.clientWidth>=element.scrollWidth),`visible signed-in title at ${width}px`);
      if(width<=900){
        await page.locator('#menuBtn').click();await settle(page);
        const header=await page.locator('.library-topbar').boundingBox(),drawer=await page.locator('#sidebar').boundingBox();
        assert(drawer.y>=header.y+header.height-1);assert(drawer.y+drawer.height<=height+1);
        await page.emulateMedia({media:'print'});assert.equal(await page.locator('#sidebar').isVisible(),false);assert.equal(await page.locator('#drawerMask').isVisible(),false);assert.equal(await page.evaluate(()=>getComputedStyle(document.body).overflow),'visible');
        await page.emulateMedia({media:'screen'});await page.keyboard.press('Escape');
      }
      await page.locator('.record-book-toc a').first().click();await settle(page);
      const record=await page.locator('#caseWorkspace .case-active').boundingBox(),header=await page.locator('.library-topbar').boundingBox();
      assert(record.y>=header.y+header.height+10,`case directory clears the signed-in header at ${width}px`);
      assert.equal(await page.locator('#caseWorkspace .case-active .record-book-body').evaluate(element=>getComputedStyle(element).fontSize),'18px');
      await page.locator('.record-book-section .preview').first().click();await settle(page);
      assert(await page.locator('.preview-tools button').evaluateAll(buttons=>buttons.every(button=>{
        const text=document.createRange();text.selectNodeContents(button);const r=button.getBoundingClientRect(),dialog=button.closest('dialog').getBoundingClientRect();
        return text.getClientRects().length===1&&r.height>=44&&r.left>=dialog.left&&r.right<=dialog.right;
      })),`readable preview buttons at ${width}px`);
      await page.locator('#cmsCases').scrollIntoViewIfNeeded();await settle(page);
      assert(await page.locator('.cms-case-card').evaluate(element=>element.scrollWidth<=element.clientWidth+1));
      if(width<400){
        const tools=await page.locator('.preview-tools').boundingBox(),head=await page.locator('#previewDialog .modal-head').boundingBox();
        assert(tools.y>=head.y+head.height-1,'sticky controls stay below the complete preview title');
      }
      await page.locator('#cmsEditTemplate').click();await settle(page);
      const editor=page.locator('#cmsEditDialog');
      assert.equal(await page.locator('#cmsEditBody').evaluate(element=>getComputedStyle(element).fontSize),'16px');
      const save=await editor.getByRole('button',{name:'保存修改',exact:true}).boundingBox(),dialog=await editor.boundingBox();
      assert(save.y>=dialog.y&&save.y+save.height<=dialog.y+dialog.height,`save is visible at ${width} × ${height}`);
      assert(await editor.evaluate(element=>element.scrollWidth<=element.clientWidth+1));
      await page.keyboard.press('Escape');await page.locator('#cmsAddCase').click();await settle(page);
      assert.equal(await page.locator('#cmsCaseForm input[name="title"]').evaluate(element=>getComputedStyle(element).fontSize),'16px');
      assert(await page.locator('#cmsCaseDialog').evaluate(element=>element.scrollWidth<=element.clientWidth+1));
      await page.keyboard.press('Escape');await page.keyboard.press('Escape');assert.deepEqual(errors,[]);
    }finally{await context.close();}
  }
});

test('pathway directory selections and direct links leave their title cards below the current header',async()=>{
  for(const [width,height]of [[320,740],[375,812],[812,375],[1024,600],[1440,900]]){
    const {page,context,errors}=await pageFor(width,{viewport:{width,height},isMobile:width<400,hasTouch:width<400});
    try{
      await page.goto(base+'/pathway',{waitUntil:'networkidle'});await page.locator('#jumpTka').click();await settle(page);
      for(const target of ['#tkaPathway','#dynamicPathway']){
        if(target==='#dynamicPathway')await page.locator('[data-key="tha"]').click();await settle(page);
        const card=await page.locator(target+' .pathway-title-card').boundingBox(),header=await page.locator('header').boundingBox();
        assert(card.y>=header.y+header.height+10,`unobscured pathway title at ${width} × ${height}`);
        if(width>820){const sidebar=await page.locator('.pathway-sidebar').boundingBox();assert(sidebar.y>=header.y+header.height+10);assert(sidebar.y+sidebar.height<=height+1);}
      }
      await page.goto(base+'/pathway?p=tha',{waitUntil:'networkidle'});await settle(page);
      const card=await page.locator('#dynamicPathway .pathway-title-card').boundingBox(),header=await page.locator('header').boundingBox();assert(card.y>=header.y+header.height+10);
      assert.deepEqual(errors,[]);
    }finally{await context.close();}
  }
});

test('the active navigation link stays visible after loading and resizing each standalone page',async()=>{
  const {page,context,errors}=await pageFor(320);
  try{
    for(const route of ['/tools','/admin','/pathway','/duty']){
      await page.setViewportSize({width:320,height:740});await page.goto(base+route,{waitUntil:'networkidle'});
      for(const width of [320,768,1440,375]){
        await page.setViewportSize({width,height:740});await settle(page);
        assert(await page.locator('.official-links,.nav nav').evaluate(element=>{
          const item=element.querySelector('a.active').getBoundingClientRect(),bounds=element.getBoundingClientRect();
          return item.left>=bounds.left-1&&item.right<=bounds.right+1;
        }),`visible selected navigation on ${route} at ${width}px`);
        assert.equal(await page.evaluate(()=>scrollY),0,'horizontal navigation does not scroll the page');
      }
      assert.equal(await page.locator('header a[href="/duty"]').count(),1);
    }
    assert.deepEqual(errors,[]);
  }finally{await context.close();}
});
