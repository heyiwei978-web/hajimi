(() => {
  const Core = globalThis.HajimiNoteCaseCore, page = globalThis.HajimiNotePage;
  if (!Core || !page) return;
  const get = id => document.getElementById(id), root = get('noteCaseFrame');
  const key = 'hajimi-note-case-frame-v1';
  const model = get('noteModel'), form = get('noteForm');
  let state = null, dirty = false, busy = false, stop = false, savedItems = [], libraryRequest = 0;
  const signature = facts => JSON.stringify(Core.facts(facts));
  function say(message,error=false) {
    get('noteFrameStatus').textContent = message;
    get('noteFrameStatus').classList.toggle('note-error',error);
  }
  function persist() {
    try {
      if (state) {state.dirty=dirty;sessionStorage.setItem(key,JSON.stringify(state));}
      else sessionStorage.removeItem(key);
    } catch { say('本标签页暂存失败，请保留正文；已保存到网站的病历不受影响。',true); }
  }
  function current() { return state?.sections.find(section=>section.id===state.active); }
  function touch() {
    dirty = true;
    state.finalConfirmed = false;
    persist();
  }
  function ready(section) {
    return !!section.text.trim() && section.confirmed && !section.stale && section.factsKey===signature(state.facts);
  }
  function syncFacts() {
    if (!state || busy) return;
    const facts = Core.facts(page.collect());
    if (signature(facts)===signature(state.facts)) return;
    state.facts = facts;
    state.sections.forEach(section=>{if (section.text.trim()) {section.stale=true;section.confirmed=false;}});
    touch();
    render();
  }
  function readConfig() {
    return Core.settings({mode:get('noteFrameMode').value,preDays:get('noteFramePreDays').value,
      postDays:get('noteFramePostDays').value,stayDays:get('noteFrameStayDays').value,
      extras:[...get('noteFrameExtras').querySelectorAll('input:checked')].map(input=>input.value)});
  }
  function applyConfig(settings) {
    get('noteFrameMode').value=settings.mode;
    get('noteFramePreDays').value=settings.preDays;
    get('noteFramePostDays').value=settings.postDays;
    get('noteFrameStayDays').value=settings.stayDays;
    get('noteFrameExtras').querySelectorAll('input').forEach(input=>{input.checked=settings.extras.includes(input.value);});
    modeChanged();
  }
  function modeChanged() {
    const surgery = get('noteFrameMode').value==='surgery';
    get('noteFramePreWrap').hidden=get('noteFramePostWrap').hidden=!surgery;
    get('noteFrameStayWrap').hidden=surgery;
    get('noteFrameExtras').querySelectorAll('input[data-surgery]').forEach(input=>{
      input.disabled=!surgery;
      if (!surgery) input.checked=false;
    });
  }
  function hydrate(record,revision) {
    const settings=Core.settings(record.settings), definitions=Core.build(settings);
    if (!record || !/^[a-f0-9-]{36}$/.test(record.id || '') || typeof record.title!=='string'
      || typeof revision!=='string' || !Array.isArray(record.sections)
      || record.sections.length!==definitions.length) throw new Error('病历格式异常，未替换当前内容');
    const facts=Core.facts(record.facts);
    const sections=definitions.map((definition,index)=>{
      const item=record.sections[index];
      if (item?.id!==definition.id || typeof item.text!=='string' || item.text.length>16000
        || (item.notes!==undefined && (typeof item.notes!=='string'||item.notes.length>600))) throw new Error('章节格式异常，未替换当前内容');
      return {...definition,text:item.text,notes:item.notes || '',model:typeof item.model==='string'?item.model:'',
        confirmed:item.confirmed===true,stale:item.stale===true,factsKey:typeof item.factsKey==='string'?item.factsKey:signature(facts)};
    });
    return {id:record.id,title:record.title.slice(0,100),settings,facts,sections,revision,
      active:definitions.some(item=>item.id===record.active)?record.active:definitions[0].id,finalConfirmed:false};
  }
  function render({keepEditor=false}={}) {
    get('noteFrameWorkspace').hidden=!state;
    if (!state) return;
    const section=current(), completed=state.sections.filter(ready).length;
    const missing=state.sections.filter(item=>!item.text.trim()).length;
    get('noteFrameProgress').textContent='已核对 '+completed+' / '+state.sections.length+' 章';
    get('noteFrameDirectory').replaceChildren();
    for (const item of state.sections) {
      const button=document.createElement('button');
      button.type='button';
      button.textContent=item.title+' · '+(!item.text.trim()?'待生成':ready(item)?'已核对':item.stale?'输入已变化':'待核对');
      button.setAttribute('aria-current',item.id===state.active?'true':'false');
      button.disabled=busy;
      button.addEventListener('click',()=>{
        state.active=item.id;persist();render();get('noteFrameSectionTitle').focus();
      });
      get('noteFrameDirectory').append(button);
    }
    get('noteFrameSectionTitle').textContent=section.title;
    if (!keepEditor) {
      get('noteFrameSectionNotes').value=section.notes;
      get('noteFrameOutput').value=section.text;
      get('noteFrameTitle').value=state.title;
    }
    get('noteFrameOutput').readOnly=busy;
    get('noteFrameConfirmed').checked=section.confirmed;
    get('noteFrameConfirmed').disabled=busy||!section.text.trim();
    get('noteFrameFinalConfirm').checked=state.finalConfirmed;
    get('noteFrameSectionModel').textContent=section.model?'本章生成模型：'+section.model:'';
    get('noteFrameComplete').disabled=busy||completed!==state.sections.length||!state.finalConfirmed||!state.title.trim();
    get('noteFrameCopy').disabled=busy||completed!==state.sections.length;
    get('noteFrameCompletionHint').textContent=missing?'还有 '+missing+' 章未生成或填写。':
      completed!==state.sections.length?'还有 '+(state.sections.length-completed)+' 章需要核对。':
      '章节已齐全。完成后按目录原样合并，保留你的修改，不再调用 AI 重写。';
    get('noteFrameGenerateOne').textContent=section.text.trim()?'AI 重新生成本章':'AI 生成本章';
    get('noteFrameGenerateMissing').disabled=busy||!missing;
    get('noteFramePreview').textContent=Core.combine(state.title,state.sections.map(item=>({...item,text:item.text||'【本章尚未完成】'})));
    const link=get('noteFrameSavedLink');
    link.hidden=state.revision==='missing';
    link.href='/note?case='+encodeURIComponent(state.id);
  }
  async function request(url,body) {
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),25000);
    try {
      const response=await fetch(url,{credentials:'same-origin',signal:controller.signal,
        ...(body?{method:'POST',headers:{'Content-Type':'application/json','X-Hajimi-Admin':'1'},body:JSON.stringify(body)}:{})});
      const data=await response.json().catch(()=>null);
      if (!response.ok) throw new Error(data?.error||(response.status===401?'请先登录管理入口':'请求失败，请稍后重试'));
      return data;
    } catch (error) {
      if (controller.signal.aborted) throw new Error('请求超时，当前内容已保留；保存操作请先通过病历链接核对结果再重试');
      throw error;
    } finally {clearTimeout(timer);}
  }
  function lock() {
    const releasePage=page.lock();
    busy=true;
    const controls=[...root.querySelectorAll('input,select,textarea,button')].map(element=>[element,element.disabled]);
    controls.forEach(([element])=>{element.disabled=true;});
    root.setAttribute('aria-busy','true');
    return ()=>{
      busy=false;
      controls.forEach(([element,disabled])=>{element.disabled=disabled;});
      releasePage();
      root.setAttribute('aria-busy','false');
      render();
      renderSaved();
    };
  }
  async function generate(ids) {
    if (!state||busy||page.isBusy()) {say('请等待当前任务完成。',true);return;}
    syncFacts();
    const selected=ids.map(id=>state.sections.find(item=>item.id===id)).filter(Boolean);
    if (!selected.length) {say('没有待生成章节。');return;}
    if (selected.some(item=>item.text.trim())&&!window.confirm('重新生成会替换本章正文和手动修改，确定继续吗？')) return;
    const facts={...state.facts}, selectedModel=model.value;
    for (const section of selected) {
      const problem=page.check(Core.inputFor(section,facts,section.notes,selectedModel),section.type);
      if (problem) {say(section.title+'：'+problem,true);return;}
    }
    const release=lock();
    stop=false;
    get('noteFrameStop').hidden=false;
    get('noteFrameStop').disabled=false;
    let finished=0;
    try {
      for (const section of selected) {
        if (stop) break;
        state.active=section.id;
        render();
        say('正在生成 '+(finished+1)+' / '+selected.length+'：'+section.title);
        const generated=await page.generateSection(Core.inputFor(section,facts,section.notes,selectedModel),section.title);
        section.text=generated.text;
        section.model=generated.model||selectedModel||'原配置默认模型';
        section.confirmed=false;section.stale=false;section.factsKey=signature(facts);
        touch();finished++;render();
      }
      say(stop?'已停止，已生成内容已保留，可继续补齐未完成章节。':'已生成 '+finished+' 章，请逐章核对。');
    } catch (error) {say(error.message+' 已生成章节与手动修改均已保留，可稍后继续。',true);}
    finally {get('noteFrameStop').hidden=true;release();persist();}
  }
  function renderSaved() {
    const term=get('noteFrameSearch').value.trim().toLowerCase();
    get('noteFrameSavedList').replaceChildren();
    const items=savedItems.filter(item=>[item.title,item.diagnosis,item.department].join(' ').toLowerCase().includes(term));
    for (const item of items) {
      const button=document.createElement('button');
      button.type='button';button.className='note-frame-saved-item';button.disabled=busy;
      const title=document.createElement('strong');title.textContent=item.title;
      const detail=document.createElement('span');
      detail.textContent=[item.department,item.sectionCount+' 章',item.completedAt?new Date(item.completedAt).toLocaleDateString('zh-CN',{timeZone:'Asia/Shanghai'}):''].filter(Boolean).join(' · ');
      button.append(title,detail);button.addEventListener('click',()=>openSaved(item.id));
      get('noteFrameSavedList').append(button);
    }
    if (savedItems.length) get('noteFrameLibraryStatus').textContent='共 '+savedItems.length+' 套，当前显示 '+items.length+' 套。';
  }
  async function reloadSaved() {
    const token=++libraryRequest;
    get('noteFrameLibraryStatus').textContent='正在读取已保存病历……';
    try {
      const data=await request('/api/note-cases');
      if (token!==libraryRequest) return;
      if (!Array.isArray(data?.items)) throw new Error('病历目录格式异常');
      savedItems=data.items.filter(item=>typeof item.id==='string'&&typeof item.title==='string');
      renderSaved();
      if (!savedItems.length) get('noteFrameLibraryStatus').textContent='尚无已保存病历。完成整套后会显示在这里。';
    } catch (error) {if (token===libraryRequest) get('noteFrameLibraryStatus').textContent=error.message;}
  }
  async function openSaved(id) {
    if (busy||page.isBusy()) return;
    if (dirty&&!window.confirm('打开已保存病历会替换当前框架草稿，确定继续吗？')) return;
    const release=lock();
    try {
      const data=await request('/api/note-cases?id='+encodeURIComponent(id));
      const next=hydrate(data.record,data.revision);
      page.loadFacts(next.facts);
      state=next;dirty=false;applyConfig(state.settings);persist();render();
      const url=new URL(location.href);url.searchParams.set('case',state.id);history.replaceState(null,'',url);
      say('已打开网站保存的整套病历，可连续阅读、复制或继续编辑。');
    } catch (error) {say(error.message,true);}
    finally {release();}
  }
  async function complete() {
    if (!state||busy||page.isBusy()) return;
    syncFacts();
    if (!state.sections.every(ready)||!state.finalConfirmed||!state.title.trim()) {say('请完成所有章节并逐章核对，再确认整套保存。',true);return;}
    const release=lock();
    try {
      say('正在保存整套病历……');
      const data=await request('/api/note-cases',{id:state.id,title:state.title,settings:state.settings,
        facts:state.facts,sections:state.sections,confirmed:true,revision:state.revision});
      if (typeof data?.revision!=='string'||data?.record?.id!==state.id) throw new Error('保存结果待确认，请通过病历链接核对');
      state.revision=data.revision;dirty=false;persist();
      const url=new URL(location.href);url.searchParams.set('case',state.id);history.replaceState(null,'',url);
      say(data.warning||'完整病历已保存到网站，仅本人登录后可见。');
      await reloadSaved();
    } catch (error) {say(error.message+' 当前编辑内容已保留。',true);}
    finally {release();}
  }
  async function loadModels() {
    const status=get('noteModelStatus'), previous=model.value;
    try {
      const data=await request('/api/note-generate');
      if (!Array.isArray(data.models)) throw new Error('模型列表暂不可用');
      model.replaceChildren(new Option('原配置默认模型（'+data.defaultModel+'）',''));
      for (const item of data.models) model.add(new Option(item.name+' · '+item.id,item.id));
      let saved='';
      try {saved=JSON.parse(sessionStorage.getItem('hajimi-note-draft-v1')||'null')?.model||'';} catch {}
      const choice=previous||saved;
      if (data.models.some(item=>item.id===choice)) model.value=choice;
      status.textContent='模型来自现有接口的可用列表；默认项沿用原配置。每次生成按当前选择执行。';
    } catch (error) {status.textContent=error.message+'；可继续使用原配置默认模型。';}
  }
  Core.optional.forEach(item=>{
    const label=document.createElement('label'),input=document.createElement('input');
    input.type='checkbox';input.value=item.id;if (item.surgery) input.dataset.surgery='true';
    label.append(input,document.createTextNode(item.title));get('noteFrameExtras').append(label);
  });
  get('noteFrameMode').addEventListener('change',modeChanged);
  get('noteFrameBuild').addEventListener('click',()=>{
    if (busy||page.isBusy()) return;
    if (state&&!window.confirm('重新建立框架会清空当前框架草稿，网站已保存的病历保留。确定继续吗？')) return;
    try {
      const settings=readConfig(),facts=Core.facts(page.collect()),sections=Core.build(settings);
      state={id:crypto.randomUUID(),title:(facts.diagnosis?facts.diagnosis+'完整教学病历':'完整教学病历').slice(0,100),
        settings,facts,sections:sections.map(section=>({...section,text:'',notes:'',model:'',confirmed:false,stale:false,factsKey:''})),
        revision:'missing',active:sections[0].id,finalConfirmed:false};
      dirty=true;persist();render();
      const url=new URL(location.href);url.searchParams.delete('case');history.replaceState(null,'',url);
      say('已建立 '+sections.length+' 章框架，可逐章生成，也可补齐未完成章节。');
    } catch (error) {say(error.message,true);}
  });
  get('noteFrameGenerateOne').addEventListener('click',()=>generate([state.active]));
  get('noteFrameGenerateMissing').addEventListener('click',()=>generate(state.sections.filter(section=>!section.text.trim()).map(section=>section.id)));
  get('noteFrameStop').addEventListener('click',()=>{stop=true;get('noteFrameStop').disabled=true;});
  get('noteFrameOutput').addEventListener('input',()=>{
    if (!state||busy) return;
    const section=current();section.text=get('noteFrameOutput').value;section.confirmed=false;
    section.stale=false;section.factsKey=signature(state.facts);touch();render({keepEditor:true});
  });
  get('noteFrameSectionNotes').addEventListener('input',()=>{
    if (!state||busy) return;
    const section=current();section.notes=get('noteFrameSectionNotes').value;section.confirmed=false;
    if (section.text.trim()) section.stale=true;
    touch();render({keepEditor:true});
  });
  get('noteFrameConfirmed').addEventListener('change',()=>{
    if (!state||busy) return;
    const section=current();section.confirmed=get('noteFrameConfirmed').checked;
    if (section.confirmed) {section.stale=false;section.factsKey=signature(state.facts);}
    touch();render({keepEditor:true});
  });
  get('noteFrameTitle').addEventListener('input',()=>{if (!state||busy) return;state.title=get('noteFrameTitle').value;touch();render({keepEditor:true});});
  get('noteFrameFinalConfirm').addEventListener('change',()=>{if (!state||busy) return;state.finalConfirmed=get('noteFrameFinalConfirm').checked;persist();render({keepEditor:true});});
  get('noteFrameComplete').addEventListener('click',complete);
  get('noteFrameCopy').addEventListener('click',async()=>{
    if (!state||!state.sections.every(ready)) return;
    const text=Core.combine(state.title,state.sections);
    try {await navigator.clipboard.writeText(text);say('已复制整套病历正文。');}
    catch {say('复制失败，请展开连续预览，使用系统选择并复制正文。',true);}
  });
  get('noteFrameReload').addEventListener('click',()=>{loadModels();reloadSaved();});
  get('noteFrameSearch').addEventListener('input',renderSaved);
  form.addEventListener('input',syncFacts);form.addEventListener('change',syncFacts);
  window.addEventListener('hajimi:note-case-reset',()=>{
    state=null;dirty=false;persist();get('noteFrameWorkspace').hidden=true;say('已清空当前框架草稿。');
    const url=new URL(location.href);url.searchParams.delete('case');history.replaceState(null,'',url);
  });
  try {
    const draft=JSON.parse(sessionStorage.getItem(key)||'null');
    if (draft) {state=hydrate(draft,draft.revision);dirty=draft.dirty!==false;applyConfig(state.settings);syncFacts();render();say('已恢复本标签页的病历框架，未自动发送生成请求。');}
  } catch {say('框架草稿无法恢复，网站已保存的病历仍可从列表打开。',true);}
  modeChanged();
  fetch('/api/session',{credentials:'same-origin'}).then(response=>response.json()).then(session=>{
    if (session.authenticated) {
      loadModels();reloadSaved();
      const id=new URL(location.href).searchParams.get('case');
      if (id&&(!state||state.id!==id)) openSaved(id);
    } else get('noteFrameLibraryStatus').textContent='登录管理入口后可读取本人已保存病历。';
  }).catch(()=>{get('noteFrameLibraryStatus').textContent='登录状态读取失败，可稍后刷新列表。';});
})();
