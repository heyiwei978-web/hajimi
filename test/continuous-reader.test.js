import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

const source=fs.readFileSync(new URL('../departments.js',import.meta.url),'utf8');
const reader=source.slice(source.indexOf('    function bindCaseFileReader(){'),source.indexOf('\n    function renderDisease(){'));
const recordId=source.slice(source.indexOf('    function recordBookId('),source.indexOf('    function recordBookText('));
const specialId=source.slice(source.indexOf('    function specialRecordId('),source.indexOf('    function specialRecordChapter('));

// A DOM boundary fixture exercises the real reader's event handlers, focus,
// geometry and history without a browser, network or production data.
class Element{
  constructor(id=''){
    this.id=id;this.dataset={};this.textContent='';this.hidden=false;this.disabled=false;
    this.open=false;this.scrollTop=0;this.isConnected=true;this.listeners=new Map();this.attributes=new Map();this.selectors=new Map();
    const values=new Set();
    this.classList={add(...names){names.forEach(name=>values.add(name));},remove(...names){names.forEach(name=>values.delete(name));},contains(name){return values.has(name);},toggle(name,force){const on=force??!values.has(name);if(on)values.add(name);else values.delete(name);return on;}};
  }
  addEventListener(type,listener){if(!this.listeners.has(type))this.listeners.set(type,new Set());this.listeners.get(type).add(listener);}
  removeEventListener(type,listener){this.listeners.get(type)?.delete(listener);}
  emit(type,event={}){for(const listener of this.listeners.get(type)||[])listener({preventDefault(){},...event});}
  querySelector(selector){return this.selectors.get(selector)||null;}
  querySelectorAll(selector){return this.selectors.get(selector)||[];}
  setAttribute(key,value){this.attributes.set(key,value);}
  removeAttribute(key){this.attributes.delete(key);}
  getAttribute(key){return this.attributes.get(key)||null;}
  getBoundingClientRect(){return {top:80,bottom:680,height:600};}
  scrollIntoView(){}
  focus(){}
}

function fixture({width=1440,hash='',empty=false}={}){
  const root=new Element('caseWorkspace'),directory=new Element('recordBookToc'),panel=new Element('caseDirectoryPanel'),summary=new Element('caseDirectorySummary');
  const env={scrollTop:0,scrolls:[],focus:null,history:[],frames:new Map(),nextFrame:0};
  const names=empty?[]:['入院记录','首次病程','出院当天查房记录'];
  const records=names.map(short=>({short,name:short,sourceBody:'原始正文：'+short}));
  const articles=records.map((record,i)=>{
    const article=new Element('record-'+i+'-'+record.short),heading=new Element();heading.textContent=record.short;
    heading.focus=()=>{env.focus=heading;};article.selectors.set('h3',heading);article.dataset.recordIndex=String(i);
    article.getBoundingClientRect=()=>({top:300+i*1000-env.scrollTop,bottom:1100+i*1000-env.scrollTop,height:800});
    article.scrollIntoView=()=>{env.scrolls.push(article.id);env.scrollTop=300+i*1000-(width<=720?154:78);win.emit('scroll');};
    return article;
  });
  const links=articles.map((article,i)=>{
    const link=new Element(),group=new Element();link.dataset.caseRecord=article.id;link.closest=()=>group;
    link.focus=()=>{env.focus=link;};link.getBoundingClientRect=()=>({top:90+i*50-directory.scrollTop,bottom:140+i*50-directory.scrollTop,height:50});return link;
  });
  const buttons=[-1,1,-1,1].map(step=>{const button=new Element();button.dataset.caseStep=String(step);return button;});
  const back=new Element('caseBackToDirectory'),status=new Element('caseCurrentSection'),bottom=new Element('caseBottomSection'),compactStatus=new Element('caseDirectoryCurrent');
  root.selectors.set('.case-file-reader > .record-book-section',articles);root.selectors.set('[data-case-record]',links);
  root.selectors.set('[data-case-step]',buttons);root.selectors.set('.case-file-tools button,.case-file-bottom-nav button',buttons);
  root.selectors.set('#caseBackToDirectory,.record-back-toc',[back]);
  for(const element of [directory,panel,summary,status,bottom,compactStatus])root.selectors.set('#'+element.id,element);
  directory.getBoundingClientRect=()=>({top:70,bottom:width<=720?126:680,height:width<=720?56:610});
  summary.focus=()=>{env.focus=summary;};
  const specialBooks=[new Element(),new Element()];
  const specialArticles=['case-a','case-b'].map((key,i)=>{
    const record={short:'出院当天查房记录',specialCaseKey:key};records.push(record);
    const article=new Element('special-'+key+'-0-出院当天查房记录');article.dataset.recordIndex=String(records.length-1);
    article.classList.add('special-record-section');article.closest=()=>specialBooks[i];
    article.scrollIntoView=()=>env.scrolls.push(article.id);return article;
  });
  const win=new Element(),media=new Element();media.matches=width<=720;win.innerWidth=width;win.innerHeight=900;env.pageScrolls=[];
  Object.defineProperty(win,'scrollY',{get:()=>env.scrollTop});
  win.scrollBy=({top})=>{env.pageScrolls.push(top);env.scrollTop+=top;win.emit('scroll');};
  win.matchMedia=()=>media;win.requestAnimationFrame=callback=>{const id=++env.nextFrame;env.frames.set(id,callback);return id;};win.cancelAnimationFrame=id=>env.frames.delete(id);
  const header=new Element();header.getBoundingClientRect=()=>({top:0,bottom:62,height:62});
  const location={pathname:'/bl/guke/TKA',search:'',hash};
  const context={window:win,document:{getElementById:id=>id==='caseWorkspace'?root:null,querySelector:selector=>selector==='.library-topbar'?header:null,querySelectorAll:()=>specialArticles},
    location,templates:records,history:{state:{},replaceState(state,title,url){env.history.push(url);location.hash=url.slice(url.indexOf('#'));}},console};
  vm.createContext(context);vm.runInContext('let disposeCaseReader=()=>{};\n'+recordId+specialId+reader+'\nbindCaseFileReader();globalThis.disposeReader=()=>disposeCaseReader();',context);
  const flush=()=>{for(let n=0;env.frames.size&&n<10;n++){const tasks=[...env.frames.values()];env.frames.clear();tasks.forEach(callback=>callback());}};
  return {root,directory,panel,summary,status,bottom,compactStatus,records,articles,links,buttons,back,win,media,env,context,location,specialBooks,specialArticles,flush};
}

test('opening a case keeps all chapters in continuous mode on desktop and phone',()=>{
  for(const width of [320,375,768,1440]){
    const f=fixture({width});
    assert(f.root.classList.contains('case-show-all'));assert(f.root.classList.contains('case-continuous-reader'));
    assert.equal(f.articles.filter(article=>article.classList.contains('case-active')).length,1);
    assert(f.articles.every(article=>!article.hidden));assert.equal(f.panel.open,width>720);
    assert.equal(f.status.textContent,'整套病历 · 3 章');assert.equal(f.env.scrolls.length,0);
  }
});

test('directory clicks scroll to the chapter itself without hiding adjacent text',()=>{
  for(const width of [320,1440]){
    const f=fixture({width}),original=JSON.stringify(f.records);f.panel.open=true;
    f.links[1].emit('click');f.flush();
    assert.deepEqual(f.env.scrolls,[f.articles[1].id]);assert.equal(f.env.focus,f.articles[1].querySelector('h3'));
    assert.equal(f.links[1].getAttribute('aria-current'),'location');assert.equal(f.links[0].getAttribute('aria-current'),null);
    assert(f.root.classList.contains('case-show-all'));assert(f.articles.every(article=>!article.hidden));
    assert.equal(f.panel.open,width>720);assert.equal(JSON.stringify(f.records),original);
    assert.equal(decodeURIComponent(f.location.hash.slice(1)),f.articles[1].id);
  }
});

test('manual scrolling updates the current marker without rewriting history or moving focus',()=>{
  const f=fixture();f.env.scrollTop=2250;f.win.emit('scroll');f.flush();
  assert.equal(f.links[2].getAttribute('aria-current'),'location');assert.match(f.bottom.textContent,/03 \/ 3/);
  assert.equal(f.env.focus,null);assert.deepEqual(f.env.history,[]);assert(f.root.classList.contains('case-show-all'));
});

test('chapter navigation still scrolls and focuses when history is unavailable',()=>{
  const f=fixture({width:375});f.context.history.replaceState=()=>{throw new Error('History blocked');};
  f.links[1].emit('click');f.flush();assert.deepEqual(f.env.scrolls,[f.articles[1].id]);
  assert.equal(f.env.focus,f.articles[1].querySelector('h3'));assert(f.root.classList.contains('case-show-all'));
});

test('an open phone directory preserves the selected chapter while the user browses it',()=>{
  const f=fixture({width:375});f.links[1].emit('click');f.flush();f.panel.open=true;
  f.env.scrollTop=0;f.win.emit('scroll');f.flush();assert.equal(f.links[1].getAttribute('aria-current'),'location');
  f.panel.open=false;f.panel.emit('toggle');f.flush();assert.equal(f.links[0].getAttribute('aria-current'),'location');
});

test('previous and next jump within the complete record and honor both boundaries',()=>{
  const f=fixture();assert(f.buttons[0].disabled);f.buttons[1].onclick();f.flush();
  assert.equal(f.links[1].getAttribute('aria-current'),'location');f.buttons[0].onclick();f.flush();
  assert.equal(f.links[0].getAttribute('aria-current'),'location');f.links[2].emit('click');f.flush();
  assert(f.buttons[1].disabled);assert(f.buttons[3].disabled);assert(f.root.classList.contains('case-show-all'));
});

test('legacy ordinal links locate their original chapter while leaving the whole case visible',()=>{
  const f=fixture({hash:'#'+encodeURIComponent('record-999-首次病程')});
  assert.equal(f.links[1].getAttribute('aria-current'),'location');assert.equal(f.env.scrolls[0],f.articles[1].id);
  assert.equal(decodeURIComponent(f.location.hash.slice(1)),'record-999-首次病程');assert(f.root.classList.contains('case-show-all'));
});

test('same-name special-case links open only the matching patient book',()=>{
  const f=fixture({hash:'#'+encodeURIComponent('special-case-b-999-出院当天查房记录')});
  assert.equal(f.specialBooks[0].open,false);assert.equal(f.specialBooks[1].open,true);
  assert.deepEqual(f.env.scrolls,[f.specialArticles[1].id]);assert(f.root.classList.contains('case-show-all'));
});

test('malformed chapter fragments and an empty standard case remain usable',()=>{
  const bad=fixture({hash:'#%E0%A4%A'});assert.equal(bad.links[0].getAttribute('aria-current'),'location');
  const empty=fixture({empty:true});assert.equal(empty.status.textContent,'暂无标准文书');assert(empty.buttons.every(button=>button.disabled));
});

test('phone directory can be reopened from the current chapter and closed with Escape',()=>{
  const f=fixture({width:320});f.links[1].emit('click');f.flush();f.back.onclick({preventDefault(){}});
  assert(f.panel.open);assert.equal(f.env.focus,f.links[1]);f.directory.emit('keydown',{key:'Escape'});
  assert.equal(f.panel.open,false);assert.equal(f.env.focus,f.summary);
});

test('desktop directory button keeps the reading position, current chapter and focus together',()=>{
  const f=fixture({width:1440});f.links[1].emit('click');f.flush();
  f.directory.scrollIntoView=()=>f.env.pageScrolls.push('directory.scrollIntoView');
  const before=f.env.scrollTop;f.back.onclick({preventDefault(){}});f.flush();
  assert.deepEqual(f.env.pageScrolls,[],'a visible sticky directory does not move the page');
  assert.equal(f.env.scrollTop,before);assert.equal(f.links[1].getAttribute('aria-current'),'location');assert.equal(f.env.focus,f.links[1]);
});

test('a directory pushed above the header is brought back without changing the current chapter',()=>{
  for(const width of [375,1440]){
    const f=fixture({width});f.links[1].emit('click');f.flush();
    f.directory.getBoundingClientRect=()=>({top:-345,bottom:472,height:817});
    f.back.onclick({preventDefault(){}});f.flush();
    assert.deepEqual(f.env.pageScrolls,[-345-62-8]);assert(f.panel.open);
    assert.equal(f.links[1].getAttribute('aria-current'),'location');assert.equal(f.env.focus,f.links[1]);
  }
});

test('a chosen chapter stays current after a jump that cannot reach the top, until the reader scrolls',()=>{
  const f=fixture({width:1440});
  // At the end of the page the browser clamps the jump: the next chapter already crosses the marker line.
  f.articles[1].scrollIntoView=()=>{f.env.scrolls.push(f.articles[1].id);f.env.scrollTop=2250;f.win.emit('scroll');};
  f.links[1].emit('click');f.flush();
  assert.equal(f.links[1].getAttribute('aria-current'),'location');assert.equal(f.env.focus,f.articles[1].querySelector('h3'));
  f.env.scrollTop=2260;f.win.emit('scroll');f.flush();
  assert.equal(f.links[2].getAttribute('aria-current'),'location','manual scrolling resumes the marker');
});

test('responsive changes expand the desktop directory and leave continuous reading intact',()=>{
  const f=fixture({width:320});assert.equal(f.panel.open,false);f.media.matches=false;f.media.emit('change');
  assert.equal(f.panel.open,true);assert(f.root.classList.contains('case-show-all'));assert(f.articles.every(article=>!article.hidden));
});

test('leaving the case removes its scroll, hash, resize and media listeners and pending work',()=>{
  const f=fixture();f.win.emit('scroll');assert.equal(f.env.frames.size,1);f.context.disposeReader();
  assert.equal(f.env.frames.size,0);for(const name of ['scroll','resize','hashchange'])assert.equal(f.win.listeners.get(name)?.size||0,0);
  assert.equal(f.media.listeners.get('change')?.size||0,0);f.win.emit('scroll');assert.equal(f.env.frames.size,0);
});
