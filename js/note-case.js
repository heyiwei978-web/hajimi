(() => {
  const Core = globalThis.HajimiNoteCaseCore, page = globalThis.HajimiNotePage;
  if (!Core || !page) return;
  const get = id => document.getElementById(id), root = get('noteCaseFrame');
  const key = 'hajimi-note-case-frame-v1';
  const model = get('noteModel'), form = get('noteForm');
  const directory = get('noteFrameDirectory'), editor = get('noteFrameEditor');
  const rows = new Map();
  const filters = [...root.querySelectorAll('[data-frame-filter]')];
  let filter = 'all';
  let displayedSections, displayedSection, generatingId = '', feedbackId = '';
  let state = null, dirty = false, busy = false, stop = false, savedItems = [], libraryRequest = 0;
  const signature = facts => JSON.stringify(Core.facts(facts));
  function say(message,error=false,sectionId='') {
    feedbackId = sectionId;
    const status = get('noteFrameStatus');
    status.textContent = message;
    status.classList.toggle('note-error',error);
    renderFeedback();
  }
  function renderFeedback() {
    const status = get('noteFrameStatus'), local = get('noteFrameEditorStatus');
    const attached = !!feedbackId && state?.active === feedbackId && !!status.textContent;
    local.textContent = attached ? status.textContent : '';
    local.classList.toggle('note-error',status.classList.contains('note-error'));
    local.hidden = !attached;
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
    get('noteFrameSaveStatus').hidden=true;
    persist();
  }
  function ready(section) {
    return !!section.text.trim() && section.confirmed && !section.stale && section.factsKey===signature(state.facts);
  }
  function syncFacts() {
    if (!state || busy) return;
    const facts = Core.facts(page.collect());
    if (signature(facts)===signature(state.facts)) return;
    if (state.revision==='missing' && state.title===defaultTitle(state.facts)) state.title=defaultTitle(facts);
    state.facts = facts;
    state.sections.forEach(section=>{if (section.text.trim()) {section.stale=true;section.confirmed=false;}});
    if (hasFrameWork()) touch();
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
      active:definitions.some(item=>item.id===record.active)?record.active:'',finalConfirmed:false,saveAttempted:record.saveAttempted===true};
  }
  function hasFrameWork() {
    return !!state && (state.revision !== 'missing' || state.saveAttempted
      || state.title !== defaultTitle(state.facts) || state.sections.some(section => section.text.trim() || section.notes.trim()));
  }

  function defaultTitle(facts) {
    return (facts.diagnosis ? facts.diagnosis+'完整教学病历' : '完整教学病历').slice(0,100);
  }

  function emptyDraft(settings) {
    const facts = Core.facts(page.collect());
    return {
      id:crypto.randomUUID(),
      title:defaultTitle(facts),
      settings,facts,revision:'missing',active:'',finalConfirmed:false,
      sections:Core.build(settings).map(section => ({
        ...section,text:'',notes:'',model:'',confirmed:false,stale:false,factsKey:''
      }))
    };
  }

  function matchesFilter(section) {
    if (filter==='missing') return !section.text.trim();
    if (filter==='review') return !!section.text.trim() && !ready(section);
    return true;
  }

  function selectSection(id, {jump=false}={}) {
    state.active=id;
    if (hasFrameWork()) persist();
    render();
    if (!id) return;
    get('noteFrameSectionNotes').focus({preventScroll:true});
    if (jump) rows.get(id).row.scrollIntoView({block:'start'});
  }

  function nextIncomplete() {
    const start=state.sections.findIndex(section=>section.id===state.active)+1;
    const index=state.sections.findIndex((section,position)=>position>=start&&!ready(section));
    return index<0 ? state.sections.find(section=>!ready(section)) : state.sections[index];
  }

  function continueChecklist() {
    const next=nextIncomplete();
    if (next) {
      if (!matchesFilter(next)) filter='all';
      selectSection(next.id,{jump:true});
      return;
    }
    get('noteFrameFinalConfirm').focus({preventScroll:true});
    get('noteFrameCompletion').scrollIntoView({block:'start'});
  }

  function renderFilters() {
    const missing=state.sections.filter(section=>!section.text.trim()).length;
    const review=state.sections.filter(section=>section.text.trim()&&!ready(section)).length;
    const labels={all:'全部 '+state.sections.length,missing:'待填写 '+missing,review:'待核对 '+review};
    filters.forEach(button=>{
      button.textContent=labels[button.dataset.frameFilter];
      button.setAttribute('aria-pressed',String(filter===button.dataset.frameFilter));
    });
    let visible=0;
    for (const section of state.sections) {
      const item=rows.get(section.id);
      item.row.hidden=!matchesFilter(section)&&section.id!==state.active;
      if (!item.row.hidden) visible++;
    }
    for (const list of directory.querySelectorAll('.note-frame-stage')) {
      list.hidden=!list.querySelector('.note-frame-row:not([hidden])');
      list.previousElementSibling.hidden=list.hidden;
    }
    const empty=get('noteFrameFilterEmpty');
    empty.hidden=visible!==0;
    empty.textContent=visible?'':'当前没有此类文书。';
    return missing;
  }

  function renderRows() {
    if (displayedSections !== state.sections) {
      // Keep a single editor and move it to the selected row.
      get('noteFrameWorkspace').append(editor);
      directory.replaceChildren();
      rows.clear();
      let stage, list;
      for (const section of state.sections) {
        const group = ['internalConsult','mdt'].includes(section.id)
          ? section.mode==='surgery' ? '术前' : '住院'
          : section.stage;
        if (group !== stage) {
          stage = group;
          const heading = document.createElement('h3');
          heading.textContent = stage;
          list = document.createElement('ul');
          list.className = 'note-frame-stage';
          list.setAttribute('aria-label',stage+'文书');
          directory.append(heading,list);
        }
        const row = document.createElement('li');
        row.className = 'note-frame-row';
        row.dataset.section = section.id;
        const head = document.createElement('div');
        head.className = 'note-frame-row-head';
        const info = document.createElement('div');
        info.className = 'note-frame-row-info';
        const title = document.createElement('h4');
        title.textContent = section.title;
        const badge = document.createElement('span');
        badge.className = 'note-frame-row-status';
        info.append(title,badge);
        const actions = document.createElement('div');
        actions.className = 'note-frame-row-actions';
        const edit = document.createElement('button');
        edit.type = 'button';
        edit.className = 'note-button note-secondary';
        edit.setAttribute('aria-controls',editor.id);
        edit.addEventListener('click',()=>{
          if (busy) return;
          selectSection(state.active===section.id?'':section.id);
        });
        const generateButton = document.createElement('button');
        generateButton.type = 'button';
        generateButton.className = 'note-button';
        generateButton.addEventListener('click',()=>generate([section.id],{openEditor:true}));
        actions.append(edit,generateButton);
        head.append(info,actions);
        row.append(head);
        list.append(row);
        rows.set(section.id,{row,badge,edit,generateButton});
      }
      displayedSections = state.sections;
    }

    for (const section of state.sections) {
      const {row,badge,edit,generateButton} = rows.get(section.id);
      const hasText = !!section.text.trim();
      const active = section.id === state.active;
      const status = generatingId === section.id ? '生成中' : !hasText ? '待完善'
        : ready(section) ? '已核对' : section.stale ? '输入已变化' : '待核对';
      badge.textContent = status;
      badge.dataset.status = status;
      row.classList.toggle('is-open',active);
      edit.textContent = active ? '收起' : hasText ? '查看 / 编辑' : '填写要点';
      edit.setAttribute('aria-label',edit.textContent+'：'+section.title);
      edit.setAttribute('aria-expanded',String(active));
      edit.disabled = busy;
      generateButton.textContent = hasText ? '用 DeepSeek 重生成' : '用 DeepSeek 生成';
      generateButton.setAttribute('aria-label',generateButton.textContent+'：'+section.title);
      generateButton.disabled = busy;
    }
  }

  function render({keepEditor=false}={}) {
    get('noteFrameWorkspace').hidden=!state;
    if (!state) return;
    const section=current(), completed=state.sections.filter(ready).length;
    get('noteFrameProgress').textContent='已核对 '+completed+' / '+state.sections.length+' 项';
    const {mode,preDays,postDays,stayDays}=state.settings;
    get('noteFrameSettingsSummary').textContent=mode==='surgery'
      ? '手术 · 住院第 '+preDays+' 天手术 · 术后 '+postDays+' 天'
      : '非手术 · 住院 '+stayDays+' 天';
    renderRows();
    const missing=renderFilters();
    get('noteFrameNext').disabled=busy||completed===state.sections.length;
    editor.hidden=!section;
    if (section && editor.parentElement!==rows.get(section.id).row) rows.get(section.id).row.append(editor);
    if (section && (!keepEditor || displayedSection!==section)) {
      get('noteFrameSectionNotes').value=section.notes;
      get('noteFrameOutput').value=section.text;
    }
    displayedSection=section;
    if (!keepEditor) get('noteFrameTitle').value=state.title;
    get('noteFrameOutput').readOnly=busy;
    const examButton = get('noteFrameOrthoExam');
    examButton.hidden = section?.id !== 'specialExam' || !globalThis.HajimiOrthoExam;
    examButton.disabled = busy;
    get('noteFrameConfirmed').checked=!!section?.confirmed;
    get('noteFrameConfirmed').disabled=busy||!section?.text.trim();
    get('noteFrameConfirmNext').disabled=get('noteFrameConfirmed').disabled;
    get('noteFrameCopySection').disabled=get('noteFrameConfirmed').disabled;
    get('noteFrameNotesLabel').textContent=section?.day ? '本日病程要点 / 当日变化' : '本章补充要点';
    get('noteFrameSectionNotes').placeholder=section?.day
      ? '填写本日症状、查体、检查结果或处理变化'
      : '填写希望写入本章的事实与要点';
    const sectionModel = get('noteFrameSectionModel');
    sectionModel.hidden=!section?.model;
    sectionModel.textContent=section?.model ? '本章生成模型：'+section.model : '';
    renderFeedback();
    get('noteFrameFinalConfirm').checked=state.finalConfirmed;
    get('noteFrameComplete').disabled=busy||completed!==state.sections.length||!state.finalConfirmed||!state.title.trim();
    get('noteFrameCopy').disabled=busy||completed!==state.sections.length;
    get('noteFrameCompletionHint').textContent=missing?'还有 '+missing+' 章未生成或填写。':
      completed!==state.sections.length?'还有 '+(state.sections.length-completed)+' 章需要核对。':
      '章节已齐全。完成后按目录原样合并，保留你的修改，不再调用 AI 重写。';
    get('noteFrameGenerateMissing').disabled=busy||!missing;
    get('noteFramePreview').textContent=Core.combine(state.title,state.sections.map(item=>({...item,text:item.text||'【本章尚未完成】'})));
    const link=get('noteFrameSavedLink');
    link.hidden=state.revision==='missing'&&!state.saveAttempted;
    link.textContent=state.revision==='missing'?'打开链接核对本次保存结果':'打开已保存病历';
    get('noteFrameVerifySave').hidden=!state.saveAttempted&&state.revision==='missing';
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
      modeChanged();
      renderSaved();
    };
  }
  async function generate(ids,{openEditor=false}={}) {
    if (!state||busy||page.isBusy()) {say('请等待当前任务完成。',true);return;}
    syncFacts();
    const selected=ids.map(id=>state.sections.find(item=>item.id===id)).filter(Boolean);
    if (!selected.length) {say('没有待生成章节。');return;}
    if (selected.some(item=>item.text.trim())&&!window.confirm('重新生成会替换本章正文和手动修改，确定继续吗？')) return;
    if (openEditor) {
      state.active=selected[0].id;
      if (hasFrameWork()) persist();
      render();
    }
    const facts={...state.facts}, selectedModel=model.value;
    for (const section of selected) {
      const input=Core.inputFor(section,facts,section.notes,selectedModel);
      const problem=page.check(input,section.type);
      if (problem) {
        say(section.title+'：'+problem,true,openEditor?section.id:'');
        const field = !input.complaint ? 'complaint' : !input.diagnosis ? 'diagnosis'
          : problem.includes('手术方式') ? 'operation' : '';
        if (field) {
          get('noteSharedInputs').open=true;
          form.elements[field].focus();
        }
        return;
      }
    }
    const release=lock();
    stop=false;
    if (!openEditor) {
      get('noteFrameStop').hidden=false;
      get('noteFrameStop').disabled=false;
    }
    let finished=0;
    try {
      for (const section of selected) {
        if (stop) break;
        generatingId=section.id;
        render();
        const sectionId=openEditor?section.id:'';
        const report=message=>say((openEditor?'':(finished+1)+' / '+selected.length+' · ')+message,false,sectionId);
        const generated=await page.generateSection(Core.inputFor(section,facts,section.notes,selectedModel),section.title,report);
        section.text=generated.text;
        section.model=generated.model||selectedModel||'原配置默认模型';
        section.confirmed=false;section.stale=false;section.factsKey=signature(facts);
        touch();finished++;generatingId='';render();
      }
      say(stop?'已停止，已生成内容已保留，可继续补齐未完成章节。':'已生成 '+finished+' 章，请逐章核对。',false,openEditor?selected[0].id:'');
    } catch (error) {
      say(error.message+' 已生成章节与手动修改均已保留，可稍后继续。',true,openEditor?selected[0].id:'');
    } finally {
      generatingId='';
      get('noteFrameStop').hidden=true;
      release();
      if (hasFrameWork()) persist();
      if (openEditor) {
        const target=finished?get('noteFrameOutput'):rows.get(selected[0].id)?.generateButton;
        target?.focus({preventScroll:true});
      }
    }
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
      const data=await request('/api/note-generate?resource=cases');
      if (token!==libraryRequest) return;
      if (!Array.isArray(data?.items)) throw new Error('病历目录格式异常');
      savedItems=data.items.filter(item=>typeof item.id==='string'&&typeof item.title==='string');
      renderSaved();
      if (!savedItems.length) get('noteFrameLibraryStatus').textContent='尚无已保存病历。完成整套后会显示在这里。';
    } catch (error) {if (token===libraryRequest) get('noteFrameLibraryStatus').textContent=error.message;}
  }
  async function openSaved(id) {
    if (busy||page.isBusy()) return;
    if ((dirty||page.hasCaseDraft())&&!window.confirm('打开已保存病历会替换当前病情、框架草稿及单份文书；未保存的修改将被清空。确定继续吗？')) return;
    const release=lock();
    try {
      const data=await request('/api/note-generate?resource=cases&id='+encodeURIComponent(id));
      const next=hydrate(data.record,data.revision);
      next.active ||= next.sections[0].id;
      page.loadFacts(next.facts);
      state=next;dirty=false;filter='all';get('noteFrameSaveStatus').hidden=true;applyConfig(state.settings);persist();render();
      const url=new URL(location.href);url.searchParams.set('case',state.id);history.replaceState(null,'',url);
      say('已打开网站保存的整套病历，可连续阅读、复制或继续编辑。');
      get('noteFrameHeading').focus();
    } catch (error) {say(error.message,true);}
    finally {release();}
  }
  function saveFeedback(message,error=false) {
    say(message,error);
    const status=get('noteFrameSaveStatus');
    status.textContent=message;
    status.hidden=false;
    status.classList.toggle('note-error',error);
  }

  async function complete() {
    if (!state||busy||page.isBusy()) return;
    syncFacts();
    if (!state.sections.every(ready)||!state.finalConfirmed||!state.title.trim()) {say('请完成所有章节并逐章核对，再确认整套保存。',true);return;}
    state.saveAttempted=true;persist();render();
    const release=lock();
    try {
      saveFeedback('正在保存整套病历……');
      const data=await request('/api/note-generate?resource=cases',{id:state.id,title:state.title,settings:state.settings,
        facts:state.facts,sections:state.sections,confirmed:true,revision:state.revision});
      if (typeof data?.revision!=='string'||data?.record?.id!==state.id) throw new Error('保存结果待确认，请通过病历链接核对');
      state.revision=data.revision;dirty=false;persist();
      const url=new URL(location.href);url.searchParams.set('case',state.id);history.replaceState(null,'',url);
      saveFeedback(data.warning||'完整病历已保存到网站，仅本人登录后可见。');
      await reloadSaved();
    } catch (error) {saveFeedback(error.message+' 当前编辑内容已保留。',true);}
    finally {release();}
  }
  async function verifySave() {
    if (!state||busy||page.isBusy()) return;
    const release=lock();
    try {
      const data=await request('/api/note-generate?resource=cases&id='+encodeURIComponent(state.id));
      const view=value=>JSON.stringify({title:value.title,settings:value.settings,facts:Core.facts(value.facts),
        sections:value.sections.map(item=>({id:item.id,text:item.text,notes:item.notes||'',model:item.model||''}))});
      if (typeof data.revision!=='string'||!data.record||view(data.record)!==view(state)) {
        throw new Error('网站中的版本与当前编辑不同，未覆盖任何内容；请打开病历链接核对，或备份当前正文后从列表重新打开');
      }
      state.revision=data.revision;state.saveAttempted=true;dirty=false;persist();
      saveFeedback('已核实网站保存的正文与当前内容一致。可再次点击完成保存，补齐目录记录。');
      await reloadSaved();
    } catch (error) {saveFeedback(error.message+' 当前编辑内容已保留。',true);}
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
      else if (choice) {
        model.add(new Option('上次选择（当前不可用，请重新选择）：'+choice,choice));
        model.value=choice;
        status.textContent='上次选择的模型不在当前可用列表，请重新选择；尚未替换为默认模型。';
        return;
      }
      status.textContent='模型来自现有接口的可用列表；默认项沿用原配置。每次生成按当前选择执行。';
    } catch (error) {status.textContent=error.message+'；可继续使用原配置默认模型。';}
  }
  page.setFrameDraftCheck(hasFrameWork);
  filters.forEach(button=>button.addEventListener('click',()=>{
    filter=button.dataset.frameFilter;
    if (current()&&!matchesFilter(current())) selectSection('');
    else render({keepEditor:true});
  }));
  get('noteFrameNext').addEventListener('click',continueChecklist);
  get('noteOpenLegacy').addEventListener('click',event=>{
    event.preventDefault();
    get('noteSharedInputs').open=true;
    get('noteLegacyTools').open=true;
    const summary=get('noteLegacyTools').querySelector('summary');
    summary.focus({preventScroll:true});
    summary.scrollIntoView({block:'start'});
  });
  Core.optional.forEach(item=>{
    const label=document.createElement('label'),input=document.createElement('input');
    input.type='checkbox';input.value=item.id;if (item.surgery) input.dataset.surgery='true';
    label.append(input,document.createTextNode(item.title));get('noteFrameExtras').append(label);
  });
  get('noteFrameMode').addEventListener('change',modeChanged);
  get('noteFrameBuild').addEventListener('click',()=>{
    if (busy||page.isBusy()) return;
    try {
      const settings=readConfig();
      const changedMode=state.settings.mode!==settings.mode;
      const next=emptyDraft(settings);
      if (JSON.stringify(settings)===JSON.stringify(state.settings)) {
        get('noteFrameSettings').open=false;
        return;
      }
      if (changedMode) {
        if (hasFrameWork()&&!window.confirm('切换诊疗路径会新建一套框架。当前未保存的章节将被清空，确定继续吗？')) return;
        state=next;
        dirty=false;
        const url=new URL(location.href);url.searchParams.delete('case');history.replaceState(null,'',url);
      } else {
        const retained = new Set(next.sections.map(section=>section.id));
        const removed = state.sections.filter(section=>!retained.has(section.id)&&(section.text.trim()||section.notes.trim()));
        if (removed.length&&!window.confirm('减少章节会从当前框架移除 '+removed.length+' 份已编辑文书，确定继续吗？')) return;
        const existing = new Map(state.sections.map(section=>[section.id,section]));
        state.settings=settings;
        state.sections=next.sections.map(section=>existing.get(section.id)||section);
        if (!retained.has(state.active)) state.active='';
        dirty=true;
        state.finalConfirmed=false;
      }
      filter='all';get('noteFrameSaveStatus').hidden=true;
      persist();render();
      get('noteFrameSettings').open=false;
      get('noteFrameHeading').focus();
      say('清单已更新，共 '+state.sections.length+' 项。');
    } catch (error) {say(error.message,true);}
  });
  document.querySelector('.note-back-to-checklist').addEventListener('click',event=>{
    event.preventDefault();
    get('noteSharedInputs').open=false;
    get('noteFrameHeading').focus();
  });
  get('noteFrameGenerateMissing').addEventListener('click',()=>generate(state.sections.filter(section=>!section.text.trim()).map(section=>section.id)));
  get('noteFrameStop').addEventListener('click',()=>{stop=true;get('noteFrameStop').disabled=true;});
  get('noteFrameOutput').addEventListener('input',()=>{
    if (!state||busy) return;
    const section=current();section.text=get('noteFrameOutput').value;section.confirmed=false;
    section.stale=false;section.factsKey=signature(state.facts);touch();render({keepEditor:true});
  });
  get('noteFrameOrthoExam').addEventListener('click', () => {
    const draft = state;
    const section = current();
    if (busy || section?.id !== 'specialExam') return;
    globalThis.HajimiOrthoExam.open({apply(text) {
      if (busy || state !== draft || current() !== section) return false;
      if (section.text.trim() && !window.confirm('用查体书写器生成的正文替换当前专科检查？')) return false;
      const output = get('noteFrameOutput');
      section.model = '';
      output.value = text;
      output.dispatchEvent(new Event('input', {bubbles: true}));
      say('已填入专科检查，请核对本章正文。', false, section.id);
      return true;
    }});
  });
  get('noteFrameSectionNotes').addEventListener('input',()=>{
    if (!state||busy) return;
    const section=current();section.notes=get('noteFrameSectionNotes').value;section.confirmed=false;
    if (section.text.trim()) section.stale=true;
    touch();render({keepEditor:true});
  });
  function confirmSection(confirmed) {
    if (!state||busy) return;
    const section=current();section.confirmed=confirmed;
    if (section.confirmed) {section.stale=false;section.factsKey=signature(state.facts);}
    touch();render({keepEditor:true});
  }
  get('noteFrameConfirmed').addEventListener('change',()=>confirmSection(get('noteFrameConfirmed').checked));
  get('noteFrameConfirmNext').addEventListener('click',()=>{
    if (busy||!current()?.text.trim()) return;
    confirmSection(true);
    continueChecklist();
  });
  get('noteFrameCopySection').addEventListener('click',async()=>{
    const section=current();
    if (busy||!section?.text.trim()) return;
    try {await navigator.clipboard.writeText(section.text);say('已复制本章正文。',false,section.id);}
    catch {say('复制失败，请选中正文后使用系统复制。',true,section.id);}
  });
  get('noteFrameTitle').addEventListener('input',()=>{if (!state||busy) return;state.title=get('noteFrameTitle').value;touch();render({keepEditor:true});});
  get('noteFrameFinalConfirm').addEventListener('change',()=>{if (!state||busy) return;state.finalConfirmed=get('noteFrameFinalConfirm').checked;persist();render({keepEditor:true});});
  get('noteFrameComplete').addEventListener('click',complete);
  get('noteFrameVerifySave').addEventListener('click',verifySave);
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
    state=emptyDraft(state.settings);dirty=false;filter='all';get('noteFrameSaveStatus').hidden=true;
    try {sessionStorage.removeItem(key);} catch {}
    applyConfig(state.settings);render();
    say('已清空当前框架草稿，可以开始新病历。');
    const url=new URL(location.href);url.searchParams.delete('case');history.replaceState(null,'',url);
  });
  try {
    const draft=JSON.parse(sessionStorage.getItem(key)||'null');
    if (draft) {state=hydrate(draft,draft.revision);dirty=draft.dirty!==false;applyConfig(state.settings);syncFacts();render();say('已恢复本标签页的病历框架，未自动发送生成请求。');}
  } catch {say('框架草稿无法恢复，网站已保存的病历仍可从列表打开。',true);}
  if (!state) {state=emptyDraft(readConfig());render();}
  modeChanged();
  fetch('/api/session',{credentials:'same-origin'}).then(response=>response.json()).then(session=>{
    if (session.authenticated) {
      loadModels();reloadSaved();
      const id=new URL(location.href).searchParams.get('case');
      if (id&&(!state||state.id!==id)) openSaved(id);
    } else get('noteFrameLibraryStatus').textContent='登录管理入口后可读取本人已保存病历。';
  }).catch(()=>{get('noteFrameLibraryStatus').textContent='登录状态读取失败，可稍后刷新列表。';});
})();
