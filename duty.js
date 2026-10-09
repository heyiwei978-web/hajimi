(() => {
  const key='hajimi-duty-session-v1',checks=[...document.querySelectorAll('[data-check]')],notes=document.getElementById('dutyNotes'),form=document.getElementById('dutyTaskForm'),list=document.getElementById('dutyTaskList'),dialog=document.getElementById('dutySummaryDialog');
  let data={checked:[],tasks:[],notes:''};
  function storageWarning(){const node=document.getElementById('dutyStorageStatus');node.hidden=false;node.textContent='浏览器无法保存草稿，刷新或离开本页后会丢失。请先复制交班摘要。';}
  try{
    const saved=JSON.parse(sessionStorage.getItem(key)||'null');
    if(saved){data.checked=Array.isArray(saved.checked)?saved.checked.filter(id=>checks.some(input=>input.dataset.check===id)):[];data.notes=typeof saved.notes==='string'?saved.notes.slice(0,5000):'';
      data.tasks=(Array.isArray(saved.tasks)?saved.tasks:[]).filter(item=>item&&typeof item.id==='string'&&typeof item.title==='string').slice(0,100).map(item=>({id:item.id,title:item.title.slice(0,200),due:typeof item.due==='string'&&Number.isFinite(Date.parse(item.due))?item.due:'',done:item.done===true}));}
  }catch{storageWarning();}
  notes.value=data.notes;checks.forEach(input=>input.checked=data.checked.includes(input.dataset.check));
  function persist(){try{sessionStorage.setItem(key,JSON.stringify(data));}catch{storageWarning();}}
  function notify(message){const node=document.getElementById('dutyToast');node.textContent=message;node.classList.add('show');clearTimeout(window.__dutyToast);window.__dutyToast=setTimeout(()=>node.classList.remove('show'),2200);}
  const time=value=>value?new Date(value).toLocaleString('zh-CN',{hour12:false}):'未设置时间';
  function render(){
    const focused=document.activeElement,focusId=focused?.dataset.taskId,focusAction=focused?.dataset.action;let focusControl=null;
    document.getElementById('checklistProgress').textContent='已核对 '+data.checked.length+' / '+checks.length+' 项';
    document.getElementById('dutyTaskCount').textContent=data.tasks.filter(task=>!task.done).length+' 项待办';document.getElementById('dutyTaskEmpty').hidden=data.tasks.length>0;list.replaceChildren();
    const ordered=[...data.tasks].sort((a,b)=>Number(a.done)-Number(b.done)||(a.due?Date.parse(a.due):Infinity)-(b.due?Date.parse(b.due):Infinity));
    for(const task of ordered){
      const row=document.createElement('li');row.className='duty-task-item'+(task.done?' completed':'');
      const label=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.checked=task.done;input.setAttribute('aria-label','完成 '+task.title);input.onchange=()=>{task.done=input.checked;persist();render();};
      input.dataset.taskId=task.id;input.dataset.action='complete';if(focusId===task.id&&focusAction==='complete')focusControl=input;
      const copy=document.createElement('span'),title=document.createElement('strong'),detail=document.createElement('small');title.textContent=task.title;detail.textContent=time(task.due);
      if(!task.done&&task.due&&Date.parse(task.due)<=Date.now()){detail.textContent+=' · 时间已到';detail.className='time-due';}copy.append(title,detail);label.append(input,copy);
      const remove=document.createElement('button');remove.type='button';remove.textContent='×';remove.setAttribute('aria-label','删除 '+task.title);remove.onclick=()=>{data.tasks=data.tasks.filter(item=>item.id!==task.id);persist();render();};row.append(label,remove);list.append(row);
      remove.dataset.taskId=task.id;remove.dataset.action='remove';if(focusId===task.id&&focusAction==='remove')focusControl=remove;
    }
    focusControl?.focus({preventScroll:true});
  }
  checks.forEach(input=>input.onchange=()=>{data.checked=checks.filter(item=>item.checked).map(item=>item.dataset.check);persist();render();});
  notes.addEventListener('input',()=>{data.notes=notes.value;persist();});
  form.onsubmit=event=>{event.preventDefault();const error=document.getElementById('dutyTaskError');error.hidden=true;const values=new FormData(form),title=String(values.get('title')).trim(),due=String(values.get('due')||'');
    if(!title)return;if(data.tasks.length>=100){error.hidden=false;error.textContent='最多保留 100 项，请先删除已完成的待办。';return;}
    data.tasks.push({id:crypto.randomUUID(),title,due,done:false});persist();render();form.reset();form.elements.title.focus();
  };
  function summary(){
    const pending=data.tasks.filter(task=>!task.done),done=data.tasks.filter(task=>task.done),lines=['值班交班摘要','生成时间：'+time(new Date().toISOString()),'','交班核对：'+data.checked.length+' / '+checks.length+' 项','未核对事项：'];
    const unchecked=checks.filter(input=>!input.checked);lines.push(...(unchecked.length?unchecked.map(input=>'□ '+input.closest('label').textContent.trim()):['全部已核对']));
    lines.push('','未完成事项：',...(pending.length?pending.map(task=>'□ '+task.title+'（'+time(task.due)+'）'):['无']),'','已完成事项：',...(done.length?done.map(task=>'✓ '+task.title):['无']),'','交班备注：',data.notes.trim()||'无');return lines.join('\n');
  }
  document.getElementById('dutySummaryButton').onclick=()=>{document.getElementById('dutySummaryText').value=summary();document.getElementById('dutyCopyStatus').textContent='';dialog.showModal();};
  document.getElementById('dutySummaryClose').onclick=()=>dialog.close();
  document.getElementById('dutyCopy').onclick=async()=>{const text=document.getElementById('dutySummaryText');try{await navigator.clipboard.writeText(text.value);document.getElementById('dutyCopyStatus').textContent='摘要已复制';}catch{ text.focus();text.select();document.getElementById('dutyCopyStatus').textContent='无法自动复制，摘要已选中，请使用系统复制。';}};
  document.getElementById('dutyDownload').onclick=()=>{const link=document.createElement('a'),url=URL.createObjectURL(new Blob([document.getElementById('dutySummaryText').value],{type:'text/plain;charset=utf-8'}));link.href=url;link.download='值班交班摘要-'+new Date().toISOString().slice(0,10)+'.txt';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  window.addEventListener('beforeprint',()=>document.getElementById('dutyPrintSummary').textContent=summary());
  document.getElementById('dutyPrint').onclick=()=>{document.getElementById('dutyPrintSummary').textContent=summary();window.print();};
  document.getElementById('dutyClear').onclick=()=>{if(!confirm('清空本标签页的交班清单、待办和备注？'))return;data={checked:[],tasks:[],notes:''};checks.forEach(input=>input.checked=false);notes.value='';form.reset();persist();render();notify('本班草稿已清空');};
  render();setInterval(render,60000);
})();
