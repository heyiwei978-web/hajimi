// 我的知识库：仅管理员本人登录后可用。正文只在内存中，不写入浏览器存储。
(function(){
  const KINDS=['书籍','指南','文献','笔记'],DEPTS=['骨科','普外科','肾内科','妇科','综合'];
  const $=id=>document.getElementById(id);
  const els={newBtn:$('kbNew'),signedOut:$('kbSignedOut'),status:$('kbStatus'),error:$('kbError'),list:$('kbList'),
    search:$('kbSearch'),kind:$('kbKind'),dept:$('kbDept'),summary:$('kbSummary'),items:$('kbItems'),
    reader:$('kbReader'),back:$('kbBack'),copy:$('kbCopy'),edit:$('kbEdit'),del:$('kbDelete'),meta:$('kbReaderMeta'),
    title:$('kbReaderTitle'),tags:$('kbReaderTags'),body:$('kbReaderBody'),dates:$('kbReaderDates'),
    editor:$('kbEditor'),editorTitle:$('kbEditorTitle'),fields:$('kbFields'),fTitle:$('kbTitle'),fKind:$('kbFormKind'),
    fDept:$('kbFormDept'),fSource:$('kbSource'),fTags:$('kbTags'),fBody:$('kbBody'),cancel:$('kbCancel'),save:$('kbSave')};
  let notes=[],revision=null,signedIn=false,dirty=false,busy=false,editing=null;
  const option=(select,values)=>values.forEach(value=>{const o=document.createElement('option');o.value=value;o.textContent=value;select.append(o);});
  option(els.kind,KINDS);option(els.dept,DEPTS);option(els.fKind,KINDS);option(els.fDept,DEPTS);
  els.fDept.value='骨科';els.fKind.value='笔记';

  function report(message){els.error.textContent=message||'';els.error.hidden=!message;}
  function say(message){els.status.textContent=message||'';}
  function show(view){
    els.list.hidden=view!=='list';els.reader.hidden=view!=='reader';els.editor.hidden=view!=='editor';
    els.newBtn.hidden=!signedIn||view==='editor';
  }
  function clearAll(){
    notes=[];revision=null;signedIn=false;dirty=false;editing=null;
    els.items.replaceChildren();els.body.replaceChildren();els.title.textContent='';els.editor.reset();
    show('none');els.signedOut.hidden=false;say('');
  }
  async function request(url,options={}){
    const response=await fetch(url,{credentials:'same-origin',cache:'no-store',...options,
      headers:{'Content-Type':'application/json','X-Hajimi-Admin':'1'}});
    if(response.status===401){clearAll();report('登录已失效，请重新登录。');throw new Error('auth');}
    const body=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(body.error||'知识库暂不可用，请稍后重试');
    return body;
  }
  const fmt=value=>{try{return new Date(value).toLocaleString('zh-CN',{hour12:false});}catch{return value;}};
  const terms=()=>els.search.value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const haystack=note=>(note.title+'\n'+note.source+'\n'+note.tags.join(' ')+'\n'+note.body).toLocaleLowerCase();
  // Builds text with <mark> around search terms, using text nodes only.
  function highlighted(text,words){
    const span=document.createDocumentFragment();
    if(!words.length){span.append(text);return span;}
    const lower=text.toLocaleLowerCase();let at=0;
    while(at<text.length){
      let next=-1,len=0;
      for(const w of words){const i=lower.indexOf(w,at);if(i>=0&&(next<0||i<next)){next=i;len=w.length;}}
      if(next<0){span.append(text.slice(at));break;}
      span.append(text.slice(at,next));const m=document.createElement('mark');m.textContent=text.slice(next,next+len);span.append(m);at=next+len;
    }
    return span;
  }
  function snippet(note,words){
    const flat=note.body.replace(/^#{1,3}\s+/gm,'').replace(/\s+/g,' ').trim(),lower=flat.toLocaleLowerCase();
    const hit=words.map(w=>lower.indexOf(w)).filter(i=>i>=0).sort((a,b)=>a-b)[0];
    if(hit===undefined)return flat.slice(0,90)+(flat.length>90?'…':'');
    const start=Math.max(0,hit-30);return (start?'…':'')+flat.slice(start,start+110)+(start+110<flat.length?'…':'');
  }
  function renderList(){
    const words=terms(),kind=els.kind.value,dept=els.dept.value;
    const shown=notes.filter(n=>(!kind||n.kind===kind)&&(!dept||n.department===dept)&&words.every(w=>haystack(n).includes(w)));
    els.items.replaceChildren();
    els.summary.textContent=notes.length?`共 ${notes.length} 条笔记`+(shown.length!==notes.length?`，符合条件 ${shown.length} 条`:''):'还没有笔记，点「新建笔记」开始记录。';
    for(const note of shown){
      const li=document.createElement('li');li.className='kb-item';
      const a=document.createElement('a');a.href='#note/'+note.id;
      const meta=document.createElement('p');meta.className='kb-meta';meta.textContent=[note.kind,note.department,note.source].filter(Boolean).join(' · ');
      const h=document.createElement('h3');h.append(highlighted(note.title,words));
      const p=document.createElement('p');p.append(highlighted(snippet(note,words),words));
      a.append(meta,h,p);
      if(note.tags.length){const ul=document.createElement('ul');ul.className='kb-tags';note.tags.forEach(t=>{const tag=document.createElement('li');tag.textContent=t;ul.append(tag);});a.append(ul);}
      li.append(a);els.items.append(li);
    }
  }
  function renderBody(text){
    els.body.replaceChildren();
    for(const block of text.split(/\n{2,}/)){
      const lines=block.split('\n');let para=[];
      const flush=()=>{if(para.length){const p=document.createElement('p');p.textContent=para.join('\n');els.body.append(p);para=[];}};
      for(const line of lines){
        if(/^#{1,3}\s+/.test(line)){flush();const h=document.createElement('h3');h.textContent=line.replace(/^#{1,3}\s+/,'');els.body.append(h);}
        else para.push(line);
      }
      flush();
    }
  }
  function openNote(id){
    const note=notes.find(n=>n.id===id);
    if(!note){location.hash='';return;}
    els.meta.textContent=[note.kind,note.department,note.source].filter(Boolean).join(' · ');
    els.title.textContent=note.title;
    els.tags.replaceChildren(...note.tags.map(t=>{const li=document.createElement('li');li.textContent=t;return li;}));
    els.tags.hidden=!note.tags.length;
    renderBody(note.body);
    els.dates.textContent='创建 '+fmt(note.createdAt)+' · 更新 '+fmt(note.updatedAt);
    show('reader');window.scrollTo(0,0);
  }
  function openEditor(note){
    editing=note?note.id:null;
    els.editorTitle.textContent=note?'编辑笔记':'新建笔记';
    els.fTitle.value=note?.title||'';els.fKind.value=note?.kind||'笔记';els.fDept.value=note?.department||'骨科';
    els.fSource.value=note?.source||'';els.fTags.value=note?note.tags.join(' '):'';els.fBody.value=note?.body||'';
    dirty=false;report('');show('editor');window.scrollTo(0,0);els.fTitle.focus();
  }
  function route(){
    if(!signedIn)return;
    const hash=decodeURIComponent(location.hash.slice(1));
    if(hash==='new')openEditor(null);
    else if(hash.startsWith('edit/')){const n=notes.find(x=>x.id===hash.slice(5));n?openEditor(n):(location.hash='');}
    else if(hash.startsWith('note/'))openNote(hash.slice(5));
    else{show('list');renderList();}
  }
  function leaveEditor(){
    if(dirty&&!window.confirm('有未保存的修改，确定放弃吗？'))return false;
    dirty=false;return true;
  }
  async function load(){
    say('正在读取知识库…');
    const data=await request('/api/knowledge');
    notes=data.notes;revision=data.revision;say('');route();
  }
  async function start(){
    try{
      const session=await fetch('/api/session',{credentials:'same-origin',cache:'no-store'}).then(r=>r.json());
      if(!session.authenticated){clearAll();return;}
      signedIn=true;els.signedOut.hidden=true;await load();
    }catch(error){if(error.message!=='auth'){say('');report(error.message==='Failed to fetch'?'网络连接失败，请稍后刷新':error.message);}}
  }

  els.search.addEventListener('input',renderList);els.kind.addEventListener('change',renderList);els.dept.addEventListener('change',renderList);
  els.newBtn.addEventListener('click',()=>{location.hash='new';});
  els.back.addEventListener('click',()=>{location.hash='';});
  els.edit.addEventListener('click',()=>{const id=decodeURIComponent(location.hash.slice(6));location.hash='edit/'+id;});
  els.copy.addEventListener('click',async()=>{
    const note=notes.find(n=>'#note/'+n.id===decodeURIComponent(location.hash));if(!note)return;
    try{await navigator.clipboard.writeText(note.body);say('已复制正文');}catch{report('复制失败，请长按正文手动复制');}
  });
  els.del.addEventListener('click',async()=>{
    const note=notes.find(n=>'#note/'+n.id===decodeURIComponent(location.hash));if(!note||busy)return;
    if(!window.confirm('确定删除「'+note.title+'」吗？删除前会自动备份。'))return;
    busy=true;els.del.disabled=true;report('');
    try{const data=await request('/api/knowledge',{method:'POST',body:JSON.stringify({action:'delete',id:note.id,revision})});
      notes=notes.filter(n=>n.id!==note.id);revision=data.revision;say('已删除');location.hash='';}
    catch(error){if(error.message!=='auth')report(error.message);}
    finally{busy=false;els.del.disabled=false;}
  });
  els.editor.addEventListener('input',()=>{dirty=true;});
  els.cancel.addEventListener('click',()=>{if(leaveEditor())location.hash=editing?'note/'+editing:'';});
  els.editor.addEventListener('submit',async event=>{
    event.preventDefault();if(busy)return;
    const note={title:els.fTitle.value.trim(),kind:els.fKind.value,department:els.fDept.value,source:els.fSource.value.trim(),
      tags:[...new Set(els.fTags.value.split(/[\s,，、;；]+/).map(t=>t.trim()).filter(Boolean))],body:els.fBody.value};
    if(!note.title||!note.body.trim()){report('请填写标题和正文');return;}
    busy=true;els.save.disabled=true;els.save.textContent='正在保存…';report('');
    try{
      const data=await request('/api/knowledge',{method:'POST',body:JSON.stringify({action:'save',id:editing,note,revision})});
      revision=data.revision;notes=[data.note,...notes.filter(n=>n.id!==data.note.id)];
      dirty=false;say('已保存');location.hash='note/'+data.note.id;
    }catch(error){if(error.message!=='auth')report(error.message+'（编辑内容仍保留在表单中）');}
    finally{busy=false;els.save.disabled=false;els.save.textContent='保存';}
  });
  window.addEventListener('hashchange',()=>{
    if(!els.editor.hidden&&dirty&&!location.hash.startsWith('#edit/')&&location.hash!=='#new'){
      if(!window.confirm('有未保存的修改，确定离开吗？')){history.replaceState(null,'',editing?'#edit/'+editing:'#new');return;}
      dirty=false;
    }
    route();
  });
  window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});
  // Re-check the session every minute while visible; clear notes as soon as it is gone.
  async function recheck(){
    if(!signedIn||document.hidden)return;
    try{const s=await fetch('/api/session',{credentials:'same-origin',cache:'no-store'}).then(r=>r.json());
      if(!s.authenticated){clearAll();report('登录已失效，内容已从页面清除。请重新登录。');}}catch{}
  }
  setInterval(recheck,60000);document.addEventListener('visibilitychange',recheck);
  start();
})();
