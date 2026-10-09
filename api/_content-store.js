import {randomUUID} from 'node:crypto';
import {get,put,BlobPreconditionFailedError} from '@vercel/blob';

const CURRENT='cms/content.json';
const PREFIX='cms/history/';
const EMPTY_REVISION='missing';
const MAX_BYTES=1500000;
const isObject=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
export class ContentError extends Error {
  constructor(status,message){super(message);this.status=status;}
}
function validate(data,status=400){
  if(!isObject(data)||!isObject(data.templateOverrides)||!Array.isArray(data.cases)||data.cases.length>500
    ||Object.values(data.templateOverrides).some(value=>!isObject(value)||typeof value.body!=='string')
    ||data.cases.some(value=>!isObject(value)||typeof value.id!=='string'||typeof value.template!=='string')){
    throw new ContentError(status,status===400?'资料格式错误，未保存':'已保存资料格式异常，已停止修改');
  }
  return {version:1,templateOverrides:data.templateOverrides,cases:data.cases};
}
export function createContentStore(storage={get,put}){
  async function read(){
    let result;
    try{result=await storage.get(CURRENT,{access:'private',useCache:false});}
    catch{throw new ContentError(503,'资料读取失败，请稍后重试；现有资料未被修改');}
    if(result===null)return {data:{version:1,templateOverrides:{},cases:[]},revision:EMPTY_REVISION,history:[]};
    if(result?.statusCode!==200||!result.blob?.etag)throw new ContentError(503,'资料读取失败，已停止修改');
    let document;
    try{document=JSON.parse(await new Response(result.stream).text());}
    catch{throw new ContentError(503,'已保存资料无法读取，已停止修改');}
    const data=validate(document,503);
    const history=document._history||[];
    if(!Array.isArray(history)||history.some(item=>!isObject(item)||!/^\d{13}-[a-f0-9-]{36}$/.test(item.id))){
      throw new ContentError(503,'修改历史格式异常，已停止修改');
    }
    return {data,revision:result.blob.etag,history,updatedAt:document._updatedAt||null};
  }
  async function snapshot(current,user,action){
    const now=new Date().toISOString();
    const id=Date.now()+'-'+randomUUID();
    const metadata={id,createdAt:now,user,action,templateCount:Object.keys(current.data.templateOverrides).length,caseCount:current.data.cases.length};
    try{await storage.put(PREFIX+id+'.json',JSON.stringify({metadata,content:current.data}),{
      access:'private',addRandomSuffix:false,allowOverwrite:false,contentType:'application/json; charset=utf-8'
    });}catch{throw new ContentError(503,'自动备份失败，已停止保存；现有资料未被修改');}
    return metadata;
  }
  async function save(data,revision,user,action='save',current=null){
    if(typeof revision!=='string'||!revision)throw new ContentError(428,'请刷新页面后再保存，避免覆盖已有资料');
    const next=validate(data);
    if(Buffer.byteLength(JSON.stringify(next))>MAX_BYTES)throw new ContentError(413,'内容数据过大');
    current=current||await read();
    if(revision!==current.revision)throw new ContentError(409,'资料已在其他页面更新，请先备份本次修改并刷新后重试');
    const backup=await snapshot(current,user,action);
    const history=[backup,...current.history].slice(0,50);
    const updatedAt=new Date().toISOString();
    const document={...next,_history:history,_updatedAt:updatedAt};
    let result;
    try{result=await storage.put(CURRENT,JSON.stringify(document),{
      access:'private',addRandomSuffix:false,allowOverwrite:current.revision!==EMPTY_REVISION,
      ...(current.revision!==EMPTY_REVISION?{ifMatch:current.revision}:{}),contentType:'application/json; charset=utf-8'
    });}catch(error){
      if(error instanceof BlobPreconditionFailedError)throw new ContentError(409,'资料已在其他页面更新，本次修改未保存');
      const latest=await read();
      if(latest.revision!==current.revision)throw new ContentError(409,'资料已在其他页面更新，本次修改未保存');
      throw new ContentError(503,'保存失败，请稍后重试；修改前的资料已备份');
    }
    if(!result.etag)throw new ContentError(503,'保存结果待确认，请刷新页面核对后再操作');
    return {...next,revision:result.etag,updatedAt};
  }
  async function historyContent(id,current){
    if(typeof id!=='string'||!current.history.some(item=>item.id===id))throw new ContentError(404,'备份不存在');
    try{
      const result=await storage.get(PREFIX+id+'.json',{access:'private',useCache:false});
      if(!result||result.statusCode!==200)throw new ContentError(404,'备份不存在');
      const document=JSON.parse(await new Response(result.stream).text());
      return validate(document.content,503);
    }catch(error){if(error instanceof ContentError)throw error;throw new ContentError(503,'备份读取失败，请稍后重试');}
  }
  return {read,save,historyContent,async restore(id,revision,user){
    const current=await read();
    if(revision!==current.revision)throw new ContentError(409,'资料已更新，请刷新后再恢复');
    return save(await historyContent(id,current),revision,user,'restore',current);
  }};
}
export const contentStore=createContentStore();
