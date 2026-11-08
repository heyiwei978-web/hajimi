import {randomUUID} from 'node:crypto';
import {BlobPreconditionFailedError} from '@vercel/blob';
import {blob} from './_blob-auth.js';
import {ContentError} from './_content-store.js';
import SEED,{ADDITIONS} from './_duty-orders-seed.js';

// 内科医嘱参考：仅管理员可读写。与公开 CMS 资料分开存放，有自己的备份。
// 私有存储里还没有资料时，用随接口部署的初始资料（_duty-orders-seed.js）。
const CURRENT='duty-orders/current.json';
const PREFIX='duty-orders/history/';
const SEED_REVISION='seed';
export const MAX_BYTES=1500000;
const LIMITS={sheets:30,title:40,columns:20,column:100,rows:3000,totalRows:10000,cell:10000};
const isObject=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
const strongEtag=etag=>String(etag).replace(/^W\//,'');
const isText=(value,max)=>typeof value==='string'&&value.length<=max;

export function validateSheets(sheets,status=400){
  const fail=()=>{throw new ContentError(status,status===400?'资料格式错误，未保存':'已保存资料格式异常，已停止修改');};
  if(!Array.isArray(sheets)||!sheets.length||sheets.length>LIMITS.sheets)fail();
  let total=0;
  const clean=sheets.map(sheet=>{
    if(!isObject(sheet)||!isText(sheet.title,LIMITS.title)||!sheet.title.trim())fail();
    const {columns,rows}=sheet;
    if(!Array.isArray(columns)||!columns.length||columns.length>LIMITS.columns||!columns.every(item=>isText(item,LIMITS.column)))fail();
    if(!Array.isArray(rows)||rows.length>LIMITS.rows)fail();
    total+=rows.length;
    if(!rows.every(row=>Array.isArray(row)&&row.length===columns.length&&row.every(cell=>isText(cell,LIMITS.cell))))fail();
    return {title:sheet.title.trim(),columns:[...columns],rows:rows.map(row=>[...row])};
  });
  if(total>LIMITS.totalRows)fail();
  if(Buffer.byteLength(JSON.stringify(clean))>MAX_BYTES)throw new ContentError(413,'资料过大，未保存');
  return clean;
}

// 把尚未补充过的分页插到指定分页之后（找不到则放在最后）。
export function withAdditions(sheets,applied,additions){
  const out=[...sheets];
  for(const addition of additions){
    if(applied.includes(addition.id))continue;
    const at=out.findIndex(sheet=>sheet.title===addition.after);
    out.splice(at<0?out.length:at+1,0,...addition.sheets);
  }
  return out;
}

export function createDutyOrdersStore(storage=blob,{seed=SEED,additions=ADDITIONS,currentPath=CURRENT,historyPrefix=PREFIX}={}){
  const additionIds=additions.map(addition=>addition.id);
  async function read(){
    let result;
    try{result=await storage.get(currentPath,{access:'private',useCache:false});}
    catch{throw new ContentError(503,'资料读取失败，请稍后重试');}
    if(result===null)return {sheets:validateSheets(withAdditions(seed,[],additions),503),revision:SEED_REVISION,history:[],updatedAt:null};
    if(result?.statusCode!==200||!result.blob?.etag)throw new ContentError(503,'资料读取失败，已停止修改');
    let document;
    try{document=JSON.parse(await new Response(result.stream).text());}
    catch{throw new ContentError(503,'已保存资料无法读取，已停止修改');}
    if(!isObject(document))throw new ContentError(503,'已保存资料格式异常，已停止修改');
    const applied=Array.isArray(document._appliedAdditions)?document._appliedAdditions.filter(id=>typeof id==='string'):[];
    const sheets=validateSheets(withAdditions(validateSheets(document.sheets,503),applied,additions),503);
    const history=document._history||[];
    if(!Array.isArray(history)||history.some(item=>!isObject(item)||!/^\d{13}-[a-f0-9-]{36}$/.test(item.id))){
      throw new ContentError(503,'修改历史格式异常，已停止修改');
    }
    return {sheets,revision:strongEtag(result.blob.etag),history,updatedAt:document._updatedAt||null};
  }
  async function snapshot(current,user,action){
    const id=Date.now()+'-'+randomUUID();
    const metadata={id,createdAt:new Date().toISOString(),user,action,
      rowCount:current.sheets.reduce((sum,sheet)=>sum+sheet.rows.length,0)};
    try{await storage.put(historyPrefix+id+'.json',JSON.stringify({metadata,sheets:current.sheets}),{
      access:'private',addRandomSuffix:false,allowOverwrite:false,contentType:'application/json; charset=utf-8'
    });}catch{throw new ContentError(503,'自动备份失败，已停止保存；现有资料未被修改');}
    return metadata;
  }
  async function save(sheets,revision,user,action='save',current=null){
    if(typeof revision!=='string'||!revision)throw new ContentError(428,'请刷新页面后再保存，避免覆盖已有资料');
    const next=validateSheets(sheets);
    current=current||await read();
    if(revision!==current.revision)throw new ContentError(409,'资料已在其他页面更新，请复制本次修改后刷新页面再保存');
    const backup=await snapshot(current,user,action);
    const history=[backup,...current.history].slice(0,50);
    const updatedAt=new Date().toISOString();
    let result;
    try{result=await storage.put(currentPath,JSON.stringify({version:1,sheets:next,_appliedAdditions:additionIds,_history:history,_updatedAt:updatedAt}),{
      access:'private',addRandomSuffix:false,allowOverwrite:current.revision!==SEED_REVISION,
      ...(current.revision!==SEED_REVISION?{ifMatch:current.revision}:{}),contentType:'application/json; charset=utf-8'
    });}catch(error){
      if(error instanceof BlobPreconditionFailedError)throw new ContentError(409,'资料已在其他页面更新，本次修改未保存');
      throw new ContentError(503,'保存失败，请稍后重试；修改前的资料已备份');
    }
    if(!result?.etag)throw new ContentError(503,'保存结果待确认，请刷新页面核对后再操作');
    return {sheets:next,revision:strongEtag(result.etag),history,updatedAt};
  }
  async function historyContent(id,current){
    if(typeof id!=='string'||!current.history.some(item=>item.id===id))throw new ContentError(404,'备份不存在');
    try{
      const result=await storage.get(historyPrefix+id+'.json',{access:'private',useCache:false});
      if(!result||result.statusCode!==200)throw new ContentError(404,'备份不存在');
      const document=JSON.parse(await new Response(result.stream).text());
      return validateSheets(document.sheets,503);
    }catch(error){if(error instanceof ContentError)throw error;throw new ContentError(503,'备份读取失败，请稍后重试');}
  }
  return {read,save,historyContent,async restore(id,revision,user){
    const current=await read();
    if(revision!==current.revision)throw new ContentError(409,'资料已更新，请刷新后再恢复');
    return save(await historyContent(id,current),revision,user,'restore',current);
  }};
}
export const dutyOrdersStore=createDutyOrdersStore();
