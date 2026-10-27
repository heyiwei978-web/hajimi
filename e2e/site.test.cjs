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
    const directFile=/^\/(?:assets\/)?[a-zA-Z0-9_-]+\.(?:html|js|css|json)$/.test(direct)&&fs.existsSync(path.join(publicRoot,direct.slice(1)));
    const target = directFile?direct:rewrite?.destination || pathname;
    if (!/^\/(?:assets\/)?[a-zA-Z0-9_-]+\.(?:html|js|css|json)$/.test(target)) {res.writeHead(404);res.end();return;}
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
async function openRecordDirectory(page){
  const panel=page.locator('#caseDirectoryPanel');
  if(await panel.count()&&!await panel.evaluate(element=>element.open))await page.locator('#caseDirectorySummary').click();
}
async function closeRecordDirectory(page){
  const summary=page.locator('#caseDirectorySummary');
  if(await summary.isVisible()&&await page.locator('#caseDirectoryPanel').evaluate(element=>element.open))await summary.click();
}

test('template totals count complete cases before and after catalogs load; utility records stay separate',async()=>{
  for(const width of [375,1440]){
    const {page,context,errors}=await pageFor(width);
    try{
      await page.goto(base+'/bl',{waitUntil:'networkidle'});
      assert.equal(await page.locator('#templateCount').innerText(),'193');
      assert.equal(await page.evaluate(()=>templates.length),0,'complete-case totals do not require chapter loading');
      assert.match(await page.locator('#resultCount').innerText(),/193 套完整病历模板/);
      assert.match(await page.locator('[data-department="骨科"]').innerText(),/190 套/);
      await page.goto(base+'/bl/guke',{waitUntil:'networkidle'});
      assert.equal(await page.locator('#templateCount').innerText(),'190');
      assert.deepEqual(await page.locator('.ortho-stats strong').allTextContents(),['190','188','2','1']);
      assert.doesNotMatch(await page.locator('#resultCount').innerText(),/5030|份模板/);
      assert.doesNotMatch(await page.locator('.ortho-category-head').allTextContents().then(xs=>xs.join(' ')),/份模板/);
      await page.goto(base+'/bl/puwai',{waitUntil:'networkidle'});
      assert.equal(await page.locator('#templateCount').innerText(),'1');
      await page.goto(base+'/bl/guke/'+encodeURIComponent('通用场景'),{waitUntil:'networkidle'});
      assert.equal(await page.locator('#templateCount').innerText(),'1 组');
      assert.match(await page.locator('#resultCount').innerText(),/4 条记录/);
      assert.doesNotMatch(await page.locator('.record-book-hero').innerText(),/1 套完整病历/);
      assert.deepEqual(errors,[]);
    }finally{await context.close();}
  }
});

test('search returns one standard TKA template and two distinct special templates with intact whole-case copying',async()=>{
  const {page,context,errors}=await pageFor(393);
  try{
    await page.goto(base+'/bl',{waitUntil:'networkidle'});
    await page.locator('#searchInput').fill('TKA');
    await page.waitForFunction(()=>document.querySelectorAll('.case-search-card').length===3);
    assert.match(await page.locator('#resultCount').innerText(),/3 套病历模板/);
    const entries=await page.evaluate(()=>window.HAJIMI.manifest.caseTemplates.items.filter(x=>x.group==='TKA'));
    const selected=entries.find(x=>x.caseType==='special');
    await page.locator('[data-case-id="'+encodeURIComponent(selected.caseId)+'"]').click();
    await page.waitForURL('**?case='+encodeURIComponent(selected.caseId));
    const book=page.locator('details.special-case-book').filter({has:page.locator('[data-special-key="'+selected.sourceCaseKey+'"]')});
    assert(await book.evaluate(el=>el.open));
    assert.equal(await book.locator('.record-book-section').count(),selected.chapterCount);
    assert.equal(await page.locator('#caseWorkspace .case-file-reader > .record-book-section').count(),40);
    await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async value=>{window.__completeCaseCopy=value;}}}));
    await book.locator('.copy-special-case').click();
    await page.waitForFunction(()=>typeof window.__completeCaseCopy==='string');
    assert.equal((await page.evaluate(()=>window.__completeCaseCopy)).match(/^第\d+章/gm).length,selected.chapterCount);
    await page.locator('#copyWholeRecord').click();
    assert.equal((await page.evaluate(()=>window.__completeCaseCopy)).match(/^第\d+章/gm).length,40,'standard copy never includes special-case chapters');
    assert.deepEqual(errors,[]);
  }finally{await context.close();}
});

test('chronic-condition resources are separate, selectable and never rewrite reviewed case copies',async()=>{
  for(const width of [375,1440]){
    const {page,context,errors}=await pageFor(width);
    try{
      await page.goto(base+'/bl/guke/'+encodeURIComponent('股骨转子间骨折'),{waitUntil:'networkidle'});
      const panel=page.locator('#comorbidityPanel');await panel.waitFor();
      assert.equal(await panel.locator('input[data-comorbidity]').count(),8);
      const first=page.locator('.case-file-reader > .record-book-section').first().locator('.record-book-body');
      const baseline=await first.textContent();
      const surgery=page.locator('.case-file-reader > .record-book-section').filter({has:page.getByRole('heading',{name:'手术记录',exact:true})}).first().locator('.record-book-body');
      const operation=await surgery.textContent();
      await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async value=>{window.__comorbidityCopy=value;}}}));
      await panel.locator('input[data-comorbidity="cad"]').check();
      await panel.locator('input[data-comorbidity="htn"]').check();
      assert.match(await panel.locator('#comorbidityNotes').innerText(),/冠心病/);
      assert.match(await panel.locator('#comorbidityNotes').innerText(),/心脏超声/);
      assert.match(await panel.locator('#comorbidityNotes').innerText(),/高血压/);
      assert.equal(await first.textContent(),baseline,'original patient history must not change');
      assert.equal(await surgery.textContent(),operation,'original operation must not change');
      await panel.locator('#copyComorbidities').click();
      await page.waitForFunction(()=>typeof window.__comorbidityCopy==='string');
      assert.match(await page.evaluate(()=>window.__comorbidityCopy),/冠心病/);
      assert.match(await page.evaluate(()=>window.__comorbidityCopy),/高血压/);
      await page.locator('#copyWholeRecord').click();
      assert.doesNotMatch(await page.evaluate(()=>window.__comorbidityCopy),/【冠心病｜独立补充模块】/,'full record copy must remain the original example');
      await panel.locator('#clearComorbidities').click();
      assert.equal(await panel.locator('#comorbiditySelectionStatus').textContent(),'0 项已选择');
      assert.equal(await panel.locator('#copyComorbidities').isDisabled(),true);
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      assert.deepEqual(errors,[]);
    }finally{await context.close();}
  }
});

test('reviewed intertrochanteric case exposes 30 consistent teaching chapters on phone and desktop',async()=>{
  for(const width of [320,1440]){
    const {page,context,errors}=await pageFor(width);
    try{
      await page.goto(base+'/bl/guke/'+encodeURIComponent('股骨转子间骨折'),{waitUntil:'networkidle'});
      const chapters=page.locator('article.record-book-section:not(.record-book-reserved)');
      await chapters.first().waitFor();assert.equal(await chapters.count(),30);
      const bodies=await chapters.locator('.record-book-body').allTextContents();
      assert(bodies.every(text=>text.startsWith('【完全虚构的教学标准病例｜第三轮修订】')));
      assert(!bodies.some(text=>/VAS|NRS|Hb\s*134|PLT\s*238|CRP\s*3\.6|手术日期：2026-09-08/.test(text)));
      const titles=await chapters.locator('h3').allTextContents();
      assert(titles.indexOf('术后第2天病程')<titles.indexOf('术后第2天晚间双下肢静脉彩超结果分析记录'));
      assert(titles.indexOf('术后第4天病程记录')<titles.indexOf('术后第5天病程'));
      assert(titles.indexOf('出院小结')<titles.indexOf('出院医嘱单（单独复制版）'));
      await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async value=>{window.__reviewedCaseCopy=value;}}}));
      await chapters.first().getByRole('button',{name:'复制本章节',exact:true}).click();
      await page.waitForFunction(()=>typeof window.__reviewedCaseCopy==='string');
      assert.match(await page.evaluate(()=>window.__reviewedCaseCopy),/完全虚构的教学标准病例/);
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      await openRecordDirectory(page);
      await page.locator('#recordBookToc a').filter({hasText:'出院医嘱单（单独复制版）'}).click();
      await settle(page);
      const last=chapters.filter({has:page.getByRole('heading',{name:'出院医嘱单（单独复制版）',exact:true})});
      assert(await last.isVisible());assert.deepEqual(errors,[]);
      if(process.env.HAJIMI_CASE_SCREENSHOT_ROOT){
        fs.mkdirSync(process.env.HAJIMI_CASE_SCREENSHOT_ROOT,{recursive:true});
        await page.screenshot({path:path.join(process.env.HAJIMI_CASE_SCREENSHOT_ROOT,'intertrochanteric-'+width+'.png')});
      }
    }finally{await context.close();}
  }
});

test('homepage is usable without JavaScript and avoids loading clinical data', async()=>{
  const {page,context}=await pageFor(393,{javaScriptEnabled:false});
  try {await page.goto(base+'/');assert(await page.locator('#portalHome').isVisible());
    assert.equal(await page.getByRole('link',{name:'病历模板',exact:true}).count(),1);
    assert.equal(await page.locator('script[src*="app.js"],script[src*="record-quality"],#libraryShell').count(),0);
    assert.equal(await page.locator('.official-feature').count(),6);
    assert.equal(await page.locator('a.card-classification[href="/classification"]').count(),1);
    assert.equal(await page.locator('a.card-ecg[href="/ecg"]').count(),1);
    assert.match(await page.locator('a.card-ecg p').innerText(),/从基础到围手术期/);
  } finally {await context.close();}
});

test('ECG routes share the public layout, expose learning sections, case practice and report pages',async()=>{
  for(const width of [320,1440]){
    const {page,context,errors}=await pageFor(width);
    try{
      const requests=[];page.on('request',request=>requests.push(new URL(request.url()).pathname));
      for(const [route,title] of [['','心电图'],['basics','基础学习'],['atlas','图谱库'],['periop','围手术期专区'],['tools','心电图工具'],['quiz','病例练习'],['report','报告范例'],['phenomena','常见心电现象']]){
        const response=await page.goto(base+'/ecg'+(route?'/'+route:''),{waitUntil:'networkidle'});
        assert.equal(response.status(),200);
        assert.equal(await page.locator('h1').innerText(),title);
        assert.equal(await page.locator('header nav a.active').getAttribute('href'),'/ecg');
        assert(await page.locator('header nav a.active').evaluate(element=>{const r=element.getBoundingClientRect(),nav=element.closest('nav').getBoundingClientRect();return r.left>=nav.left-1&&r.right<=nav.right+1;}));
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
        assert.match(await page.locator('#ecgReviewFooter').innerText(),/仅供临床参考，不替代医生判断/);
        assert.equal(await page.title(),(route?title+'｜':'')+'心电图 · 哈基米工作站');
      }
      await page.goto(base+'/ecg.html',{waitUntil:'networkidle'});
      assert.equal(await page.locator('h1').innerText(),'心电图','direct /ecg.html opens the ECG home, not 页面未找到');
      await page.goto(base+'/ecg/quiz',{waitUntil:'networkidle'});
      assert.match(await page.locator('#ecgApp').innerText(),/示意病例/);
      const first=page.locator('[data-case]').first();
      await first.getByRole('button',{name:'提交答案'}).click();
      assert(await first.locator('.ecg-case-error').isVisible(),'an answer is required');
      await first.locator('input[value="1"]').check();await first.getByRole('button',{name:'提交答案'}).click();
      assert.match(await first.locator('.ecg-case-feedback').innerText(),/回答正确[\s\S]*规范报告写法/);
      const second=page.locator('[data-case]').nth(1);
      await second.locator('input[value="0"]').check();await second.getByRole('button',{name:'提交答案'}).click();
      assert.match(await second.locator('.ecg-case-feedback').innerText(),/正确答案是 C/);
      assert.match(await page.locator('#ecgQuizScore').innerText(),/已答 2 \/ \d+ 题 · 答对 1 题/);
      await page.getByRole('button',{name:'重新开始'}).click();
      assert.match(await page.locator('#ecgQuizScore').innerText(),/已答 0/);
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      await page.goto(base+'/ecg/report',{waitUntil:'networkidle'});
      await page.locator('#ecgRpRate').fill('68');await page.locator('#ecgRpPr').fill('224');await page.locator('#ecgRpQt').fill('420');await page.locator('#ecgRpAxis').fill('75');
      await page.locator('#ecgRpConclusion').fill('窦性心律\n一度房室传导阻滞');
      await page.getByRole('button',{name:'生成报告'}).click();
      const reportText=await page.locator('#ecgRpResult').innerText();
      assert.match(reportText,/心率：68 次\/分/);assert.match(reportText,/QT\/QTc 420\/447 ms/);assert.match(reportText,/\+75°（正常电轴）/);assert.match(reportText,/2\. 一度房室传导阻滞/);
      await page.locator('#ecgRpRate').fill('');await page.getByRole('button',{name:'生成报告'}).click();
      assert.match(await page.locator('#ecgRpResult').innerText(),/需要同时填写心率/);
      await page.goto(base+'/ecg/basics',{waitUntil:'networkidle'});
      assert.equal(await page.locator('.ecg-steps>li').count(),6);
      for(const id of ['ecg-calibration','ecg-electrodes','ecg-axis','ecg-intervals','ecg-artifacts'])assert(await page.locator('#'+id).count()===1,id);
      assert(await page.locator('#ecg-artifacts svg[role="img"]').count()>=4);
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'basics stays within the viewport');
      assert.match(await page.locator('#ecg-leads').innerText(),/10 个电极/);
      assert.match(await page.locator('#ecg-paper').innerText(),/40 ms/);
      assert.match(await page.locator('#ecg-normal').innerText(),/120–200 ms/);
      await page.goto(base+'/ecg/periop',{waitUntil:'networkidle'});
      assert.equal(await page.locator('#ecg-scenarios .ecg-card').count(),6);
      assert(await page.locator('#ecg-abnormal .ecg-abnormal-item').count()>=15);
      assert(await page.locator('#ecg-anesthesia .ecg-abnormal-item').count()>=8);
      assert(await page.locator('#ecg-postop li').count()>=5);
      assert.match(await page.locator('#ecg-injury').innerText(),/肌钙蛋白/);
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'periop tables stay inside the page');
      assert.match(await page.locator('#ecg-oncall').innerText(),/术后胸痛/);
      assert.match(await page.locator('#ecg-oncall').innerText(),/术后气促/);
      assert.match(await page.locator('#ecg-oncall').innerText(),/术后心悸/);
      assert.equal(requests.filter(url=>/^\/(?:api\/|catalog-|records-|app-runtime-|department-runtime-)/.test(url)).length,0,'ECG remains independent of private administration and clinical-record loading');
      for(const route of ['/','/classification','/pathway','/tools','/duty']){
        await page.goto(base+route,{waitUntil:'networkidle'});
        assert.equal(await page.locator('header nav a[href="/ecg"]').count(),1,'public ECG navigation on '+route);
      }
      await page.goto(base+'/bl/guke',{waitUntil:'networkidle'});
      assert.equal(await page.locator('.library-top-actions a[href="/ecg"]').count(),1);
      if(width===320){await page.locator('#menuBtn').click();await page.locator('.mobile-drawer-shortcuts a[href="/ecg"]').click();await page.waitForURL(base+'/ecg');}
      await page.goto(base+'/ecg/atlas/not-a-category',{waitUntil:'networkidle'});
      assert.equal(await page.locator('h1').innerText(),'页面未找到');
      assert.deepEqual(errors,[]);
    }finally{await context.close();}
  }
});

test('ECG atlas searches Chinese and exact abbreviations, keeps query on refresh and opens category deep links',async()=>{
  for(const width of [375,1440]){
    const {page,context,errors}=await pageFor(width);
    try{
      await page.goto(base+'/ecg/atlas',{waitUntil:'networkidle'});
      assert.equal(await page.locator('.ecg-category-grid a').count(),8);
      assert.equal(await page.locator('[data-ecg-entry]:not([hidden])').count(),94);
      const search=page.getByRole('searchbox',{name:'搜索心电图图谱'});
      const searchBounds=await search.boundingBox();assert(searchBounds.y>0&&searchBounds.y+searchBounds.height<900,'atlas search is visible before scrolling through categories');
      // Exact abbreviations match one entry; common Chinese terms rank the title/alias match first.
      for(const [query,id,only] of [['房颤','atrial-fibrillation',false],['AF','atrial-fibrillation',true],['高钾','hyperkalemia',false],['低钾','hypokalemia',false],['文氏','second-degree-av-block',false],['LBBB','left-bundle-branch-block',false],['莫氏','second-degree-av-block',false],['PE','pulmonary-embolism',true],['Ｓ１Ｑ３Ｔ３','pulmonary-embolism',true]]){
        await search.fill(query);
        if(only)assert.equal(await page.locator('[data-ecg-entry]:not([hidden])').count(),1);
        assert.equal(await page.locator('[data-ecg-entry]:not([hidden])').first().getAttribute('data-ecg-entry'),id);
        assert.equal(new URL(page.url()).searchParams.get('q'),query);
      }
      await page.reload({waitUntil:'networkidle'});
      assert.equal(await search.inputValue(),'Ｓ１Ｑ３Ｔ３');
      assert.equal(await page.locator('[data-ecg-entry]:not([hidden])').count(),1);
      await search.fill('<img src=x onerror=alert(1)>');
      assert(await page.locator('#ecgSearchEmpty').isVisible());
      assert.equal(await page.locator('#ecgSearchResults img').count(),0);
      await page.getByRole('button',{name:'清空搜索'}).click();
      assert.equal(await page.locator('[data-ecg-entry]:not([hidden])').count(),94);
      assert.equal(new URL(page.url()).searchParams.has('q'),false);
      await page.locator('a[href="/ecg/atlas/conduction"]').click();
      await page.waitForURL(base+'/ecg/atlas/conduction',{waitUntil:'networkidle'});
      assert.equal(await page.locator('[data-ecg-entry]:not([hidden])').count(),15);
      assert(await page.locator('#ecgSearchEmpty').isHidden());
      await page.goto(base+'/ecg/atlas/pulmonary',{waitUntil:'networkidle'});
      await page.locator('a[href="/ecg/atlas/pulmonary/pulmonary-embolism"]').click();
      await page.waitForURL(base+'/ecg/atlas/pulmonary/pulmonary-embolism',{waitUntil:'networkidle'});
      assert.equal(await page.locator('h1').innerText(),'肺栓塞');
      await page.goBack();assert.equal(await page.locator('h1').innerText(),'肺循环与右心负荷');
      assert.deepEqual(errors,[]);
    }finally{await context.close();}
  }
});

test('ECG framework navigates in-page, searches the whole section from the keyboard and measures sketches with calipers',async()=>{
  for(const width of [375,1440]){
    const {page,context,errors}=await pageFor(width);
    try{
      const scripts=[];page.on('request',request=>{if(request.resourceType()==='script')scripts.push(new URL(request.url()).pathname);});
      await page.goto(base+'/ecg',{waitUntil:'networkidle'});
      const bundle=scripts.filter(item=>/^\/assets\/ecg-[0-9a-f]{20}\.js$/.test(item));
      assert.equal(bundle.length,1,'one hashed ECG bundle');
      assert.equal(scripts.filter(item=>/\/ecg-(?:data|book-data)/.test(item)).length,0,'source data files are bundled');
      // In-section links render without another document load or data download.
      await page.evaluate(()=>{window.__ecgMarker=1;});
      await page.locator('#ecgApp a[href="/ecg/atlas"]').first().click();
      await page.waitForURL(base+'/ecg/atlas');
      assert.equal(await page.locator('h1').innerText(),'图谱库');
      assert.equal(await page.evaluate(()=>window.__ecgMarker),1,'no full page reload');
      assert(await page.locator('#ecgGlobalSearchForm').isHidden(),'atlas uses its own filter');
      await page.locator('a[href="/ecg/atlas/pulmonary"]').first().click();
      await page.locator('a[href="/ecg/atlas/pulmonary/pulmonary-embolism"]').click();
      await page.waitForURL(base+'/ecg/atlas/pulmonary/pulmonary-embolism');
      assert.equal(await page.locator('h1').innerText(),'肺栓塞');
      assert.equal(await page.evaluate(()=>document.activeElement.id),'ecgTitle','focus moves to the new page heading');
      assert.match(await page.locator('#ecgReviewFooter').innerText(),/参考文献：\d+ 条/);
      // Pager links to neighbours in the same category.
      const next=page.locator('.ecg-pager a[rel="next"]');
      if(await next.count()){const title=(await next.innerText()).replace(/^下一条\s*/,'');await next.click();await settle(page);assert.equal(await page.locator('h1').innerText(),title.trim());await page.goBack();await settle(page);}
      assert.equal(await page.locator('h1').innerText(),'肺栓塞');
      await page.goBack();await settle(page);
      assert.equal(await page.locator('h1').innerText(),'肺循环与右心负荷');
      await page.goBack();await settle(page);await page.goBack();await settle(page);
      assert.equal(await page.locator('h1').innerText(),'心电图');
      assert.equal(await page.locator('#ecgReviewFooter').innerText().then(text=>/参考文献：见各栏目及词条/.test(text)),true,'footer metadata resets');
      assert.equal(scripts.filter(item=>item.startsWith('/assets/ecg-')).length,1,'bundle downloaded once');
      // Global search: "/" focuses, results span long-form pages, keyboard opens the result.
      await page.keyboard.press('/');
      assert.equal(await page.evaluate(()=>document.activeElement.id),'ecgGlobalSearch');
      await page.keyboard.type('隐匿性传导');
      const listbox=page.getByRole('listbox',{name:'搜索结果'});
      assert(await listbox.isVisible());
      assert.equal(await page.locator('#ecgGlobalSearch').getAttribute('aria-expanded'),'true');
      assert.match(await listbox.locator('[role="option"]').first().innerText(),/心电现象[\s\S]*隐匿性传导/);
      assert(await listbox.locator('mark').count()>=1);
      await page.keyboard.press('ArrowDown');
      assert.equal(await page.locator('#ecgGlobalSearch').getAttribute('aria-activedescendant'),'ecgGlobalOption0');
      await page.keyboard.press('Enter');
      await page.waitForURL(base+'/ecg/phenomena#ecg-ph-concealed');
      assert.equal(await page.locator('h1').innerText(),'常见心电现象');
      await page.locator('#ecgGlobalSearch').fill('<img src=x onerror=alert(1)>');
      assert.match(await listbox.innerText(),/没有找到/);
      assert.equal(await page.locator('#ecgGlobalResults img').count(),0);
      await page.keyboard.press('Escape');
      assert(await listbox.isHidden());
      // Exact abbreviation + Enter jumps straight to the entry.
      await page.locator('#ecgGlobalSearch').fill('LBBB');await page.keyboard.press('Enter');
      await page.waitForURL(/\/ecg\/atlas\/conduction\/left-bundle-branch-block$/);
      // Calipers read the default RR and move one small box per arrow key.
      const caliper=page.locator('#ecg-basic .ecg-caliper-toggle');
      await caliper.click();
      assert.equal(await caliper.getAttribute('aria-pressed'),'true');
      assert.match(await page.locator('#ecg-basic .ecg-caliper-readout').innerText(),/800 ms · 相当于 75 次\/分/);
      assert.equal(await page.locator('#ecg-basic svg[role="img"] title').count(),1,'calipers add no second labelled image');
      await page.locator('#ecg-basic svg.is-measuring').focus();await page.keyboard.press('ArrowRight');
      assert.match(await page.locator('#ecg-basic .ecg-caliper-readout').innerText(),/840 ms/);
      const sketch=page.locator('#ecg-basic svg.is-measuring'),size=await sketch.boundingBox();
      await sketch.click({position:{x:size.width*90/640,y:size.height*0.75}});
      assert.match(await page.locator('#ecg-basic .ecg-caliper-readout').innerText(),/16[34]\d ms/);
      await caliper.click();
      assert.equal(await page.locator('#ecg-basic .ecg-caliper').count(),0);
      assert.equal(await page.locator('#ecgPrint').count(),1);
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      assert.deepEqual(errors,[]);
    }finally{await context.close();}
  }
});

test('ECG draft dossiers keep the basic layer visible, synchronize keyboard folding and keep fixed review metadata readable',async()=>{
  const dossiers=[['arrhythmias','atrial-fibrillation','房颤'],['electrolytes','hyperkalemia','高钾血症'],['pulmonary','pulmonary-embolism','肺栓塞'],['conduction','second-degree-av-block','二度房室传导阻滞'],['pacing','ventricular-pacing','心室起搏心电图'],['arrhythmias','brugada','Brugada 图形'],['ischemia','inferior-stemi','下壁 ST 段抬高型心肌梗死']];
  for(const width of [320,375,768,1440]){
    const {page,context,errors}=await pageFor(width);
    try{
      for(const [category,id,title] of dossiers){
        await page.goto(base+'/ecg/atlas/'+category+'/'+id,{waitUntil:'networkidle'});await settle(page);
        assert.equal(await page.locator('h1').innerText(),title);
        assert(await page.locator('#ecg-basic').isVisible());
        assert.equal(await page.locator('#ecgPeriopLayer').evaluate(element=>element.open),false);
        assert.equal(await page.locator('#ecgLayerToggle').getAttribute('aria-expanded'),'false');
        assert.equal(await page.locator('#ecg-basic svg[role="img"] title').count(),1);
        assert.equal(await page.locator('#ecg-basic img').count(),0);
        const footer=page.locator('#ecgReviewFooter');
        const footerText=await footer.innerText();
        for(const text of ['仅供临床参考，不替代医生判断','参考文献：','待审核'])assert(footerText.includes(text));
        assert.match(footerText,/20\d\d-\d\d-\d\d/);
        assert.doesNotMatch(footerText,/待补充/);
        assert(await page.locator('#ecg-references a[target="_blank"]').count()>=1);
        assert(await footer.evaluate(element=>{const r=element.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight+1&&r.left>=0&&r.right<=innerWidth&&getComputedStyle(element).position==='fixed';}));
        await page.locator('#ecgLayerToggle').click();
        assert.equal(await page.locator('#ecgPeriopLayer').evaluate(element=>element.open),true);
        assert.equal(await page.locator('#ecgLayerToggle').getAttribute('aria-expanded'),'true');
        assert(await page.locator('#ecg-basic').isVisible());
        const summary=page.locator('#ecgPeriopLayer summary');await summary.focus();await page.keyboard.press('Enter');await settle(page);
        assert.equal(await page.locator('#ecgLayerToggle').getAttribute('aria-expanded'),'false');
        await summary.focus();await page.keyboard.press('Enter');await settle(page);
        assert.equal(await page.locator('#ecgLayerToggle').getAttribute('aria-expanded'),'true');
        assert.match(await page.locator('#ecgPeriopLayer').innerText(),/对手术时机的影响/);
        assert.match(await page.locator('#ecgPeriopLayer').innerText(),/何时会诊/);
        await page.locator('#ecgFooterReferences a').click();
        await page.waitForFunction(()=>{const r=document.querySelector('#ecg-references').getBoundingClientRect(),footer=document.querySelector('#ecgReviewFooter').getBoundingClientRect(),header=document.querySelector('header').getBoundingClientRect();return r.top>=header.bottom+8&&r.top+48<=footer.top;});
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'SVG scrolling stays inside the figure');
        assert(await page.locator('#ecg-basic p').first().evaluate(element=>parseFloat(getComputedStyle(element).fontSize)>=16));
      }
      assert.deepEqual(errors,[]);
    }finally{await context.close();}
  }
});

test('ECG tools calculate both QTc formulas and RR heart rate, discard stale results and link to the existing RCRI',async()=>{
  for(const width of [320,1440]){
    const {page,context,errors}=await pageFor(width);
    try{
      await page.goto(base+'/ecg/tools',{waitUntil:'networkidle'});
      await page.locator('#ecgQt').fill('400');await page.locator('#ecgQtRr').fill('800');await page.locator('#ecgQtRr').press('Enter');
      assert.match(await page.locator('#ecgQtResult').innerText(),/Bazett：447 ms/);
      assert.match(await page.locator('#ecgQtResult').innerText(),/Fridericia：431 ms/);
      assert.match(await page.locator('#ecgQtResult').innerText(),/Framingham：431 ms/);
      assert.match(await page.locator('#ecgQtResult').innerText(),/Hodges：426 ms/);
      await page.locator('#ecgQtRr').fill('1000');assert.equal(await page.locator('#ecgQtResult').isVisible(),false);
      await page.getByRole('button',{name:'计算 QTc'}).click();assert.match(await page.locator('#ecgQtResult').innerText(),/Bazett：400 ms/);
      await page.locator('#ecgQtRr').fill('0');await page.getByRole('button',{name:'计算 QTc'}).click();
      assert.match(await page.locator('#ecgQtResult').innerText(),/大于 0/);assert.doesNotMatch(await page.locator('#ecgQtResult').innerText(),/Infinity|NaN|400 ms/);
      await page.locator('#ecgHeartRr').fill('800');await page.getByRole('button',{name:'计算心率'}).click();
      assert.match(await page.locator('#ecgHeartResult').innerText(),/75.0 次\/分/);
      await page.locator('#ecgHeartRr').fill('');await page.getByRole('button',{name:'计算心率'}).click();assert.match(await page.locator('#ecgHeartResult').innerText(),/完整输入/);
      await page.locator('#ecgAxisI').fill('5');await page.locator('#ecgAxisF').fill('-5');await page.getByRole('button',{name:'计算电轴'}).click();
      assert.match(await page.locator('#ecgAxisResult').innerText(),/-45°[\s\S]*左偏/);
      await page.locator('#ecgGridBoxes').fill('5');await page.getByRole('button',{name:'换算间期'}).click();assert.match(await page.locator('#ecgGridResult').innerText(),/200 ms/);
      await page.locator('#ecgSixCount').fill('9');await page.getByRole('button',{name:'按 6 秒法计算'}).click();assert.match(await page.locator('#ecgSixResult').innerText(),/90 次/);
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      await page.getByRole('link',{name:'打开现有 RCRI 工具 →'}).click();
      await page.locator('#dlg').waitFor({state:'visible'});
      assert.match(await page.locator('#dtitle').innerText(),/Revised Cardiac Risk Index/);
      assert.equal(await page.locator('#dbody input[type="checkbox"]').count(),6);
      assert.deepEqual(errors,[]);
    }finally{await context.close();}
  }
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

test('every original orthopedic disease now explains fracture-line morphology and differentiates neighboring types', {timeout:120000}, async()=>{
 const {page,context,errors}=await pageFor(375);
 try{
  const cases=[
   ['femoral-neck',4,'Garden Ⅲ','骨折端'],
   ['intertrochanteric',8,'31A2.2','外侧壁'],
   ['distal-femur',9,'33B3','冠状'],
   ['tibial-plateau',7,'ⅢB型','皮质'],
   ['tibial-shaft',7,'42C3','节段'],
   ['pilon',6,'Rüedi–Allgöwer Ⅲ','粉碎'],
   ['patella',7,'儿童袖套型','软骨'],
   ['proximal-humerus',10,'四部分·外翻嵌插变型','内侧'],
   ['distal-humerus',9,'13C3','关节面'],
   ['clavicle',11,'Neer ⅡC（扩展型）','韧带'],
   ['distal-radius',11,'2R3A2.3','掌'],
   ['scaphoid',10,'Herbert B4','周月骨'],
   ['ankle',3,'Weber B','联合'],
   ['calcaneus',10,'Sanders ⅢBC','CT'],
   ['talus',5,'Hawkins ⅡB（修订）','距下'],
   ['pelvic-ring',8,'LC Ⅲ','对侧'],
   ['acetabulum',10,'联合型·双柱','关节']
  ];
  for(const [id,n,code,feature] of cases){
   await page.goto(base+'/classification/guke/'+id,{waitUntil:'domcontentloaded'});
   const cards=page.locator('.class-type-detailed');
   const actual=await cards.count();
   if(actual!==n){
     const body=await page.locator('#classificationApp').innerText().catch(()=>'app-missing');
     throw new Error('incorrect detail count for '+id+' ('+actual+' instead of '+n+') '+page.url()+'; page='+body.slice(0,400)+'; errors='+errors.join(' // '));
   }
   assert.match(await page.locator('#class-types').innerText(),new RegExp(feature),'missing fracture morphology for '+id);
   assert.equal(await cards.getByRole('heading',{name:code,exact:true}).count(),1,'missing expected subtype '+code);
   assert.equal(await cards.locator('.class-type-treatment').count(),n,'every subtype needs treatment '+id);
   assert.equal(await page.locator('.class-type-navigation a').count(),n,'every subtype needs a jump link '+id);
   assert.equal(await page.locator('.class-treatment-sources').count(),1,'missing treatment scope '+id);
   assert((await page.locator('.class-differentials li').count())>=2,'missing adjacent-type comparisons for '+id);
   assert((await page.locator('.class-classification-refs a').count())>=1,'missing authoritative classification reference for '+id);
   assert.equal(await page.locator('img').count(),0,'do not embed candidate x-rays without image permission');
   const spill=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);
   assert.equal(spill,false,'mobile horizontal overflow at '+id);
  }
  assert.deepEqual(errors,[]);
 }finally{await context.close();}
});

test('classification subtype search, comparison table and deep anchors work on phones and desktop',async()=>{
 for(const width of [320,375,1440]){
  const {page,context,errors}=await pageFor(width);
  try{
   await page.goto(base+'/classification/guke?q=Hoffa',{waitUntil:'networkidle'});
   assert.equal(await page.locator('.class-disease-card:not([hidden])').count(),1);
   assert.match(await page.locator('.class-disease-card:not([hidden])').innerText(),/股骨远端/);
   await page.locator('#diseaseFilter').fill('Garden IV');
   assert.equal(await page.locator('.class-disease-card:not([hidden])').count(),1,'ASCII roman numerals match the displayed Unicode subtype');
   await page.locator('.class-disease-card:not([hidden])').click();
   await page.locator('.class-type-navigation a').last().click();
   assert.equal(new URL(page.url()).hash,'#type-4');
   assert.equal(await page.evaluate(()=>document.activeElement.id),'type-4');
   await page.reload({waitUntil:'networkidle'});
   assert.equal(await page.evaluate(()=>document.activeElement.id),'type-4','refresh restores deep anchor focus');
   await page.locator('.class-comparison summary').click();
   assert.equal(await page.locator('.class-comparison tbody tr').count(),4);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false,'open table must not widen the page');
   const type=page.locator('#type-4');
   assert.match(await type.innerText(),/保守条件与处理/);
   assert.match(await type.innerText(),/手术判断/);
   assert.match(await type.innerText(),/可选方案/);
   await type.locator('.class-type-citation').click();
   assert.equal(new URL(page.url()).hash,'#class-treatment-sources');
   assert.match(await page.locator('#class-treatment-sources').innerText(),/55岁/);
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
      assert.equal(await page.locator('.ortho-disease-card').count(),189);
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

async function waitForOrthoCategory(page,key) {
  await page.waitForFunction(key=>{
    const target=document.getElementById('ortho-'+key);
    if(!target)return false;
    const top=target.getBoundingClientRect().top;
    const header=document.querySelector('.library-topbar').getBoundingClientRect().bottom;
    return top>=header+10&&top<=header+20;
  },key,{timeout:5000});
  await settle(page);
  assert(await page.locator('#ortho-'+key+' .ortho-category-head h3').isVisible());
}

test('orthopedic category links land on the selected heading without rebuilding the overview', {timeout:120000},async()=>{
  for(const width of [320,375,393,768,1440]){
    const {page,context,errors}=await pageFor(width,{reducedMotion:'no-preference',isMobile:width<=393,hasTouch:width<=393});
    try{
      await page.goto(base+'/bl/guke',{waitUntil:'networkidle'});
      await page.evaluate(()=>window.categoryOverview=document.querySelector('.ortho-sections'));
      // Jump to the last category first, before earlier cards have been scrolled into view.
      for(const key of ['soft','joint','trauma','pediatric','sports','hand','foot','spine','bone','soft']){
        await page.locator('.ortho-jump a[href="#ortho-'+key+'"]').click();
        await waitForOrthoCategory(page,key);
        assert.equal(new URL(page.url()).hash,'#ortho-'+key);
        assert(await page.evaluate(()=>window.categoryOverview===document.querySelector('.ortho-sections')),'a fragment change preserves the existing overview');
      }
      assert.equal(await page.locator('#ortho-soft .ortho-disease-card h3').innerText(),'通用场景');
      assert.deepEqual(errors,[]);
    }finally{await context.close();}
  }
});

test('orthopedic category deep links survive refresh and browser history, and open the matching records', {timeout:60000},async()=>{
  for(const width of [375,1440]){
    const {page,context,errors}=await pageFor(width,{reducedMotion:width===375?'no-preference':'reduce',isMobile:width===375,hasTouch:width===375});
    try{
      await page.goto(base+'/bl/guke#ortho-soft',{waitUntil:'networkidle'});
      await waitForOrthoCategory(page,'soft');
      await page.reload({waitUntil:'networkidle'});
      await waitForOrthoCategory(page,'soft');
      const joint=page.locator('.ortho-jump a[href="#ortho-joint"]');
      await joint.focus();await page.keyboard.press('Enter');
      await waitForOrthoCategory(page,'joint');
      await page.goBack();await waitForOrthoCategory(page,'soft');
      await page.goForward();await waitForOrthoCategory(page,'joint');
      await page.goBack();await waitForOrthoCategory(page,'soft');
      await page.locator('#ortho-soft .ortho-disease-card').click();
      await page.locator('#caseWorkspace').waitFor({state:'visible'});
      assert.equal(decodeURIComponent(new URL(page.url()).pathname),'/bl/guke/通用场景');
      assert.match(await page.title(),/通用场景/);
      await page.goBack();await waitForOrthoCategory(page,'soft');
      await page.goForward();await page.locator('#caseWorkspace').waitFor({state:'visible'});
      assert.equal(decodeURIComponent(new URL(page.url()).pathname),'/bl/guke/通用场景');
      assert.deepEqual(errors,[]);
    }finally{await context.close();}
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
    assert.equal(await page.evaluate(()=>templates.length),5057);
    assert.equal(await page.locator('.case-search-card').count(),1,'one case entry per disease, not fragmented records');
    assert.match(await page.locator('.case-search-card').first().innerText(),/肝脓肿/);
    assert(await page.locator('.case-search-card').evaluateAll(cards=>cards.every(card=>{
      const r=card.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&card.scrollWidth<=card.clientWidth+1;
    })));
    await page.locator('.case-search-card').first().click();
    await page.locator('#caseWorkspace').waitFor({state:'visible'});
    await openRecordDirectory(page);
    assert.match(await page.locator('#caseWorkspace .case-nav-family').first().innerText(),/临床病历/);
    assert.match(await page.locator('#caseWorkspace .case-nav-family').nth(1).innerText(),/知情同意/);
    const chapters=page.locator('#caseWorkspace .case-file-reader > .record-book-section');
    assert((await chapters.count())>1);
    assert.equal(await chapters.filter({visible:true}).count(),await chapters.count(),'a case opens with every chapter visible');
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

test('search previews show actual matching document names and highlight terms without fetching bodies',async()=>{
  for(const width of [320,1440]){
    const {page,context,errors}=await pageFor(width);
    try{
      const requests=[];page.on('request',request=>requests.push(new URL(request.url()).pathname));
      await page.goto(base+'/bl?q='+encodeURIComponent('tka 术后'),{waitUntil:'networkidle'});
      const cards=page.locator('.case-search-card');await cards.first().waitFor({state:'visible'});
      assert.equal(await cards.count(),3,'standard and both special templates are distinct results');
      const card=cards.first();
      assert.equal(await card.locator('.case-search-code .search-hit').innerText(),'TKA');
      assert((await card.locator('.case-search-matches .search-hit').count())>0);
      const names=await card.locator('.case-search-matches li b').allTextContents();
      const expected=await page.evaluate(()=>createHajimiSearch(templates)({group:'all',stage:'all',type:'all',q:'tka 术后'}).slice(0,3).map(t=>t.short||t.name));
      assert.deepEqual(names,expected);
      assert.equal(requests.filter(url=>url.startsWith('/records-')).length,0,'search stays metadata-only');
      assert(await card.evaluate(element=>element.scrollWidth<=element.clientWidth+1&&element.getBoundingClientRect().right<innerWidth));
      await page.locator('#searchInput').fill('肝脓肿');await page.waitForFunction(()=>document.querySelector('.case-search-card h3')?.textContent==='肝脓肿');
      assert.equal(await page.locator('.case-search-card h3 .search-hit').innerText(),'肝脓肿');
      await page.locator('#searchInput').fill('');await page.locator('#stageFilter').selectOption('术中');
      await page.locator('.case-search-matches').first().waitFor({state:'visible'});
      assert.equal(await page.locator('.case-search-matches h4').first().innerText(),'符合筛选的章节');
      assert.equal(await page.locator('.case-search-card .search-hit').count(),0,'clearing the query clears highlighting');
      assert.deepEqual(errors,[]);
    }finally{await context.close();}
  }
});

test('reading sizes update directory and preview, persist and leave copied and printed records unchanged',async()=>{
  for(const width of [320,375,768,1440]){
    const {page,context,errors}=await pageFor(width,{isMobile:width<=375,hasTouch:width<=375});
    try{
      await context.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.copiedClinicalText=text;}}}));
      await page.goto(base+'/bl/guke/TKA',{waitUntil:'networkidle'});
      const current=page.locator('#caseWorkspace .case-active'),body=current.locator('.record-book-body');
      const original=await body.textContent();
      const controls=page.locator('#recordBookToc .reading-font-controls');
      await openRecordDirectory(page);
      for(const size of [18,20,22]){
        await controls.locator('[data-reading-font="'+size+'"]').click();
        assert.equal(await body.evaluate(element=>getComputedStyle(element).fontSize),size+'px');
        assert.equal(await page.locator('.case-nav-item b').first().evaluate(element=>getComputedStyle(element).fontSize),size+'px');
        assert.equal(await controls.locator('[aria-pressed="true"]').count(),1);
        assert.equal(await body.textContent(),original);
      }
      const selected=page.locator('.case-nav-item[aria-current="location"]');
      assert(await selected.locator('.case-nav-current-label').isVisible(),'current selection has a text marker');
      await closeRecordDirectory(page);
      await current.locator('.copy').click();assert.equal(await page.evaluate(()=>window.copiedClinicalText),original);
      await current.locator('.preview').click();
      assert.equal(await page.locator('#previewContent').evaluate(element=>getComputedStyle(element).fontSize),'22px');
      await page.locator('#copyPreview').click();assert.equal(await page.evaluate(()=>window.copiedClinicalText),original);
      assert(await page.locator('#previewDialog').evaluate(dialog=>dialog.scrollWidth<=dialog.clientWidth+1));
      await page.emulateMedia({media:'print'});
      assert.equal(await page.locator('#previewContent').evaluate(element=>getComputedStyle(element).fontSize),'16px');
      assert.equal(await page.locator('#previewDialog .reading-font-slot').isVisible(),false);
      await page.emulateMedia({media:'screen'});await page.locator('#closePreview').click();
      await page.emulateMedia({media:'print'});
      assert.equal(await body.evaluate(element=>getComputedStyle(element).fontSize),'16px');
      assert.equal(await controls.isVisible(),false);
      await page.emulateMedia({media:'screen'});
      await page.reload({waitUntil:'networkidle'});
      assert.equal(await controls.locator('[data-reading-font="22"]').getAttribute('aria-pressed'),'true');
      assert.equal(await body.evaluate(element=>getComputedStyle(element).fontSize),'22px');
      assert.equal(await page.evaluate(()=>localStorage.getItem('hajimi-library-font-v1')),'22');
      assert(await page.locator('#caseWorkspace').evaluate(element=>element.scrollWidth<=element.clientWidth+1));
      assert.deepEqual(errors,[]);
    }finally{await context.close();}
  }
});

test('reading preferences synchronize between tabs and remain usable with invalid or blocked storage',async()=>{
  const {page,context,errors}=await pageFor(375);
  try{
    await page.goto(base+'/bl/guke/TKA',{waitUntil:'networkidle'});
    await page.evaluate(()=>localStorage.setItem('hajimi-library-font-v1','999; color:red'));
    await page.reload({waitUntil:'networkidle'});
    assert.equal(await page.locator('#recordBookToc [data-reading-font="18"]').getAttribute('aria-pressed'),'true');
    const other=await context.newPage();await other.goto(base+'/bl/puwai/'+encodeURIComponent('肝脓肿'),{waitUntil:'networkidle'});
    await openRecordDirectory(other);
    await other.locator('#recordBookToc [data-reading-font="20"]').click();
    await page.waitForFunction(()=>document.querySelector('#recordBookToc [data-reading-font="20"]').getAttribute('aria-pressed')==='true');
    await closeRecordDirectory(other);
    await other.locator('.record-book-section.case-active .preview').click();
    assert.equal(await other.locator('#previewContent').evaluate(element=>getComputedStyle(element).fontSize),'20px');
    await other.locator('#previewDialog [data-reading-font="22"]').click();
    await page.waitForFunction(()=>document.querySelector('#recordBookToc [data-reading-font="22"]').getAttribute('aria-pressed')==='true');
    await other.evaluate(()=>localStorage.removeItem('hajimi-library-font-v1'));
    await page.waitForFunction(()=>document.querySelector('#recordBookToc [data-reading-font="18"]').getAttribute('aria-pressed')==='true');
    assert.deepEqual(errors,[]);
  }finally{await context.close();}
  const blocked=await pageFor(320);
  try{
    await blocked.context.addInitScript(()=>{Storage.prototype.getItem=function(){throw new DOMException('Blocked','SecurityError');};Storage.prototype.setItem=function(){throw new DOMException('Blocked','SecurityError');};});
    await blocked.page.goto(base+'/bl/guke/TKA',{waitUntil:'networkidle'});
    await openRecordDirectory(blocked.page);
    await blocked.page.locator('#recordBookToc [data-reading-font="22"]').click();
    assert.equal(await blocked.page.locator('.case-active .record-book-body').evaluate(element=>getComputedStyle(element).fontSize),'22px');
    assert.equal(await blocked.page.locator('#recordBookToc .reading-font-note').innerText(),'仅本页生效');
    assert(await blocked.page.locator('#recordBookToc .reading-font-note').isVisible());
    assert.deepEqual(blocked.errors,[]);
  }finally{await blocked.context.close();}
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
    const selected=page.locator(await link.getAttribute('href'));assert(await selected.isVisible());assert.equal(await link.getAttribute('aria-current'),'location');assert.equal(await page.locator('#caseWorkspace .case-file-reader > .record-book-section:visible').count(),await page.locator('#caseWorkspace .case-file-reader > .record-book-section').count());
    await page.emulateMedia({media:'print'});assert.equal(await page.locator('.record-book-toc').evaluate(e=>getComputedStyle(e).display),'none');
    assert.equal(await page.locator('.record-book-body').first().evaluate(e=>getComputedStyle(e).fontSize),'16px');assert.deepEqual(errors,[]);
  } finally {await context.close();}
});

test('legacy chapter URLs and same-name TKA numeric/stable identities survive refresh on desktop and phone',async()=>{
  for(const width of [375,1440]){
    const {page,context,errors}=await pageFor(width);
    try{
      const missing=[];page.on('response',response=>{if(response.status()>=400&&new URL(response.url()).origin===base)missing.push(response.url());});
      await page.goto(base+'/bl/guke/TKA#record-0-入院记录',{waitUntil:'networkidle'});
      assert.equal(await page.locator('#caseWorkspace .case-active').getAttribute('id'),'record-0-入院记录');
      await page.goto(base+'/bl/guke/TKA#record-999-入院记录',{waitUntil:'networkidle'});
      assert.equal(await page.locator('#caseWorkspace .case-active').getAttribute('id'),'record-0-入院记录','a changed presentation ordinal still resolves the unique original chapter');
      const links=await page.evaluate(()=>[5159,5359,5360].map(id=>{
        const record=window.HAJIMI.findRecord(id),stable=window.HAJIMI.findRecord('clinical-v1-r'+String(id).padStart(6,'0'));
        const article=[...document.querySelectorAll('.record-book-section')].find(a=>templates[Number(a.dataset.recordIndex)]===record);
        return {id,same:record===stable,name:record.name,key:record.specialCaseKey||null,anchor:article?.id,body:article?.querySelector('.record-book-body')?.textContent};
      }));
      assert.deepEqual(links.map(item=>item.key),[null,'tka-special-wound-202607','tka-special-hemarthrosis-202609']);
      for(const link of links){
        assert(link.same);assert(link.anchor);assert.equal(link.name,'全膝关节置换 · 出院当天查房记录');
        await page.goto(base+'/bl/guke/TKA#'+encodeURIComponent(link.anchor),{waitUntil:'networkidle'});
        const article=page.locator('[id="'+link.anchor+'"]');assert(await article.isVisible());
        assert.equal(await article.locator('.record-book-body').textContent(),link.body);
        await page.reload({waitUntil:'networkidle'});assert(await article.isVisible());
        assert.equal(await page.evaluate(id=>window.HAJIMI.findRecord(id)._id,link.id),link.id);
      }
      assert.deepEqual(missing,[]);assert.deepEqual(errors,[]);
    }finally{await context.close();}
  }
});

test('complete records stay visible while directory jumps, scrolling and refresh update the current chapter',async()=>{
  for(const width of [320,375,768,1440]){
    const {page,context,errors}=await pageFor(width,{isMobile:width<=375,hasTouch:width<=375});
    try{
      await page.goto(base+'/bl/guke/TKA',{waitUntil:'networkidle'});
      const records=page.locator('#caseWorkspace .case-file-reader > .record-book-section');
      const ids=await records.evaluateAll(items=>items.map(item=>item.id));
      const original=await records.first().locator('.record-book-body').textContent();
      const current=page.locator('#caseWorkspace .case-file-reader > .case-active');
      const visibleAll=async()=>assert.equal(await records.filter({visible:true}).count(),ids.length);
      assert(ids.length>2);await visibleAll();
      assert.equal(await current.getAttribute('id'),ids[0]);
      assert(await page.locator('#casePrevious').isDisabled());
      assert.equal(await page.locator('#caseDirectoryPanel').evaluate(element=>element.open),width>720);
      assert.equal(await page.locator('#caseShowAll,#caseShowSelectedBottom').count(),0);
      await page.locator('#caseNext').click();await settle(page);
      assert.equal(await current.getAttribute('id'),ids[1]);await visibleAll();
      assert.equal(decodeURIComponent(new URL(page.url()).hash.slice(1)),ids[1]);
      assert(await current.locator('h3').evaluate(element=>element===document.activeElement));
      const header=await page.locator('.library-topbar').boundingBox();
      assert((await current.boundingBox()).y>=header.y+header.height+10,'chapter clears the measured header');
      await records.nth(2).evaluate(element=>element.scrollIntoView({block:'start'}));await settle(page);
      assert.equal(await current.getAttribute('id'),ids[2],'manual scrolling updates the directory marker');
      if(width<=720){
        const directory=await page.locator('#recordBookToc').boundingBox();
        assert(directory.y>=header.y+header.height,'mobile directory stays below the header');
        await page.locator('#caseDirectorySummary').click();
      }
      await page.locator('[data-case-record="'+ids.at(-1)+'"]').click();await settle(page);
      assert.equal(await current.getAttribute('id'),ids.at(-1));await visibleAll();
      assert.equal(await page.locator('#caseDirectoryPanel').evaluate(element=>element.open),width>720,'mobile directory closes after a jump');
      await page.reload({waitUntil:'networkidle'});
      assert.equal(await current.getAttribute('id'),ids.at(-1),'refresh restores the anchored chapter');await visibleAll();
      await page.locator('.case-file-bottom-nav').scrollIntoViewIfNeeded();await settle(page);
      assert(await page.locator('#caseNextBottom').isDisabled());
      assert(await page.locator('.case-file-bottom-actions button:visible').evaluateAll(buttons=>buttons.every(button=>{
        const r=button.getBoundingClientRect(),text=document.createRange();text.selectNodeContents(button);
        return r.left>=0&&r.right<=innerWidth&&r.height>=48&&text.getClientRects().length===1;
      })),`readable bottom actions at ${width}px`);
      await page.locator('#casePreviousBottom').click();await settle(page);
      assert.equal(await current.getAttribute('id'),ids.at(-2));await visibleAll();
      await page.locator('#caseBackToDirectory').click();await settle(page);
      assert(await page.locator('#caseDirectoryPanel').evaluate(element=>element.open));
      assert.equal(await current.getAttribute('id'),ids.at(-2),'opening the directory keeps the current chapter');
      const directoryTop=(await page.locator('#recordBookToc').boundingBox()).y,topbar=await page.locator('.library-topbar').boundingBox();
      assert(directoryTop>=topbar.y+topbar.height-1,`directory heading stays on screen at ${width}px`);
      assert(await page.locator('.case-nav-item[aria-current="location"]').evaluate(element=>{
        const r=element.getBoundingClientRect(),parent=element.closest('aside').getBoundingClientRect();
        return element===document.activeElement&&r.top>=parent.top&&r.bottom<=parent.bottom;
      }),'directory action focuses the visible current chapter');
      if(width<=720){await page.keyboard.press('Escape');assert.equal(await page.locator('#caseDirectoryPanel').evaluate(element=>element.open),false);}
      await page.evaluate(()=>{window.print=()=>{};});await page.locator('#printWholeRecord').click();await visibleAll();
      await page.emulateMedia({media:'print'});await visibleAll();
      assert.equal(await page.locator('.case-file-bottom-nav').isVisible(),false);
      assert.equal(await page.locator('#previewDialog').isVisible(),false);
      assert.equal(await records.first().locator('.record-book-body').evaluate(element=>getComputedStyle(element).fontSize),'16px');
      await page.emulateMedia({media:'screen'});await visibleAll();
      assert.equal(await records.first().locator('.record-book-body').textContent(),original);
      await records.first().locator('.preview').click();
      assert.equal(await page.locator('#previewContent').evaluate(element=>getComputedStyle(element).fontSize),'18px');
      await page.emulateMedia({media:'print'});
      assert(await page.locator('#previewContent').isVisible());
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
      await openRecordDirectory(page);
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

test('elements carrying the hidden attribute are never displayed, and the password result appears only after generating',async()=>{
  for(const width of [375,1440]){
    const {page,context,errors}=await pageFor(width);
    try{
      for(const route of ['/','/bl','/bl/guke','/bl/guke/TKA','/classification','/ecg','/pathway','/tools','/duty','/admin','/admin/password']){
        await page.goto(base+route,{waitUntil:'networkidle'});
        const shown=await page.evaluate(()=>[...document.querySelectorAll('[hidden]')].filter(element=>getComputedStyle(element).display!=='none').map(element=>element.id||element.className));
        assert.deepEqual(shown,[],route+' shows hidden elements');
      }
      assert(!await page.locator('#hashResult').isVisible());
      await page.locator('#pw1').fill('correct horse battery');
      await page.locator('#pw2').fill('correct horse battery');
      await page.locator('#hashForm button[type=submit]').click();
      await page.locator('#hashResult').waitFor({state:'visible'});
      assert.match(await page.getByLabel('密码校验码').inputValue(),/^pbkdf2\$/);
      assert.deepEqual(errors,[]);
    }finally{await context.close();}
  }
});

test('reviewed TKA chronology and specified operative design survive chapter copying on phone and desktop',async()=>{
 for(const width of [375,1440]){
  const {page,context,errors}=await pageFor(width);
  try{
   await page.goto(base+'/bl/guke/TKA',{waitUntil:'networkidle'});
   const chapters=page.locator('#caseWorkspace .case-file-reader > .record-book-section');
   await chapters.first().locator('.record-book-body').waitFor();
   await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async value=>{window.__reviewCopy=value;}}}));
   for(const [name,expected] of [['术后第1天病程',/120mL[^。；]*本日未拔管/],['术后第2天病程',/55mL[^。；]*本日未拔管/],['术后第3天病程',/09:30拔除引流管/],['出院当天查房记录',/术后第14天/],['手术记录',/后交叉韧带保留型/]]){
    const chapter=chapters.filter({has:page.getByRole('heading',{name,exact:true})});
    const text=await chapter.locator('.record-book-body').textContent();assert.match(text,expected);
    assert(!text.includes('右膝切口及引流/拔管过程平稳'));
    await page.evaluate(()=>{window.__reviewCopy=null;});
    await chapter.getByRole('button',{name:'复制本章节',exact:true}).click();
    await page.waitForFunction(()=>typeof window.__reviewCopy==='string');
    assert.equal(await page.evaluate(()=>window.__reviewCopy),text);
   }
   assert.deepEqual(errors,[]);
  }finally{await context.close();}
 }
});

test('TKA full stay shows forty chapters, daily POD1-14 and chronologically ordered reports with exact copying',async()=>{
 for(const width of [375,1440]){
  const {page,context,errors}=await pageFor(width);
  try{
   await page.goto(base+'/bl/guke/TKA',{waitUntil:'networkidle'});
   const chapters=page.locator('#caseWorkspace .case-file-reader > .record-book-section');
   assert.equal(await chapters.count(),40);
   const titles=await chapters.locator('h3').allTextContents();
   const texts=await chapters.locator('.record-book-body').allTextContents();
   assert(texts.every(t=>t.startsWith('【虚构教学标准病例')));
   assert(!texts.some(t=>/VAS|NRS|疼痛评分/.test(t)));
   assert(titles.indexOf('手术日术前查房记录')<titles.indexOf('手术记录'));
   assert(titles.indexOf('术后第2天病程')<titles.indexOf('术后第2天晚间右下肢静脉超声结果分析记录'));
   assert(titles.indexOf('术后第2天晚间右下肢静脉超声结果分析记录')<titles.indexOf('术后第3天病程'));
   assert(titles.indexOf('术后第14天病程')<titles.indexOf('出院当天查房记录'));
   assert(titles.indexOf('出院当天查房记录')<titles.indexOf('出院小结'));
   await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async t=>{window.__tkaDailyCopy=t;}}}));
   for(let d=1;d<=14;d++){
    const name='术后第'+d+'天病程';const i=titles.indexOf(name);assert(i>=0);
    const text=texts[i];assert(text.includes('记录时间：2026-09-'+String(d+4).padStart(2,'0')));
    assert(text.includes('主治医师查房后指出：'));
    await page.evaluate(()=>{window.__tkaDailyCopy=null;});
    await chapters.nth(i).getByRole('button',{name:'复制本章节',exact:true}).click();
    await page.waitForFunction(()=>typeof window.__tkaDailyCopy==='string');
    assert.equal(await page.evaluate(()=>window.__tkaDailyCopy),text);
   }
   assert.deepEqual(errors,[]);
  }finally{await context.close();}
 }
});

test('THA displays its own complete stay and daily rounds with exact copying on phone and desktop',async()=>{
 for(const width of [375,1440]){
  const {page,context,errors}=await pageFor(width);
  try{
   await page.goto(base+'/bl/guke/THA',{waitUntil:'networkidle'});
   const chapters=page.locator('#caseWorkspace .case-file-reader > .record-book-section');assert.equal(await chapters.count(),32);
   const names=await chapters.locator('h3').allTextContents(),texts=await chapters.locator('.record-book-body').allTextContents();
   assert(texts.every(t=>t.startsWith('【虚构教学标准病例｜THA')));assert(!texts.some(t=>/VAS|NRS|疼痛评分/.test(t)));
   assert(names.indexOf('手术日术前查房记录')<names.indexOf('手术记录'));
   assert(names.indexOf('术后第2天病程')<names.indexOf('术后第2天晚间右下肢静脉超声结果分析记录'));
   assert(names.indexOf('术后第2天晚间右下肢静脉超声结果分析记录')<names.indexOf('术后第3天病程'));
   assert(names.indexOf('出院当天查房记录')<names.indexOf('出院小结'));
   assert.match(texts[names.indexOf('出院小结')],/今日尚未拆线/);
   await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async t=>{window.__thaCopy=t;}}}));
   for(let d=1;d<=6;d++){
    const i=names.indexOf('术后第'+d+'天病程');assert(i>=0);assert(texts[i].includes('记录时间：2026-09-'+String(d+5).padStart(2,'0')));
    await page.evaluate(()=>{window.__thaCopy=null;});await chapters.nth(i).getByRole('button',{name:'复制本章节',exact:true}).click();await page.waitForFunction(()=>typeof window.__thaCopy==='string');assert.equal(await page.evaluate(()=>window.__thaCopy),texts[i]);
   }
   assert.deepEqual(errors,[]);
  }finally{await context.close();}
 }
});

test('clavicle complete case shows corrected chronology and exact chapter copying on desktop and phone',async()=>{
 for(const width of [375,1440]){
  const {page,context,errors}=await pageFor(width);
  try{
   await page.goto(base+'/bl/guke/'+encodeURIComponent('锁骨骨折'),{waitUntil:'networkidle'});
   const chapters=page.locator('#caseWorkspace .case-file-reader > .record-book-section');assert.equal(await chapters.count(),26);
   const names=await chapters.locator('h3').allTextContents(),texts=await chapters.locator('.record-book-body').allTextContents();
   assert(texts.every(t=>t.startsWith('【虚构教学标准病例｜锁骨骨折')));assert(!texts.some(t=>/VAS|NRS|疼痛评分|假体|____|医师核实并记录/.test(t)));
   assert(names.indexOf('术后第2天病程')<names.indexOf('影像复查及结果分析'));assert(names.indexOf('影像复查及结果分析')<names.indexOf('康复评估与训练记录'));assert(names.indexOf('出院当天查房记录')<names.indexOf('出院小结'));
   assert.match(texts[names.indexOf('出院小结')],/今日尚未拆线/);
   await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async t=>{window.__clavicleCopy=t;}}}));
   for(const n of ['手术记录','术后第1天病程','术后第2天病程','术后第3天病程','影像复查及结果分析','康复评估与训练记录','出院当天查房记录','出院小结']){
    const i=names.indexOf(n);assert(i>=0);await page.evaluate(()=>{window.__clavicleCopy=null;});await chapters.nth(i).getByRole('button',{name:'复制本章节',exact:true}).click();await page.waitForFunction(()=>typeof window.__clavicleCopy==='string');assert.equal(await page.evaluate(()=>window.__clavicleCopy),texts[i]);
   }
   assert.deepEqual(errors,[]);
  }finally{await context.close();}
 }
});
