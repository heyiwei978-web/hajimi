// Private knowledge base: book, guideline and personal notes for the single
// site administrator. Stored as one private Blob document, separate from the
// public CMS and the private gallery. Every write is backed up first and uses
// an ETag condition so two open pages cannot overwrite each other.
//
// This module has no storage-SDK import so it can be tested with an in-memory
// backend; api/knowledge.js wires the real private Blob client.
import {randomUUID} from 'node:crypto';
import {readSession} from './_auth.js';
import {guardRequest} from './_security.js';

export const KNOWLEDGE_INDEX='knowledge/index.json';
export const KNOWLEDGE_HISTORY='knowledge/history/';
export const KINDS=['书籍','指南','文献','笔记'];
export const DEPARTMENTS=['骨科','普外科','肾内科','妇科','综合'];
export const LIMITS=Object.freeze({notes:3000,title:120,source:200,tags:12,tag:20,body:60000,document:12000000,history:30});
const EMPTY='missing';
const isObject=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
const ID=/^[a-f0-9-]{36}$/;
const STAMP=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;

export class KnowledgeError extends Error{constructor(status,message){super(message);this.status=status;}}

function cleanTags(tags){
  if(!Array.isArray(tags))return null;
  const out=[...new Set(tags.map(tag=>typeof tag==='string'?tag.trim():null))];
  if(out.some(tag=>tag===null||!tag||tag.length>LIMITS.tag)||out.length>LIMITS.tags)return null;
  return out;
}
// Normalizes an editor submission; returns null when anything is invalid.
export function cleanNote(input){
  if(!isObject(input))return null;
  const title=typeof input.title==='string'?input.title.trim():'';
  const source=typeof input.source==='string'?input.source.trim():'';
  const body=typeof input.body==='string'?input.body.replace(/\r\n?/g,'\n'):'';
  const tags=cleanTags(input.tags??[]);
  if(!title||title.length>LIMITS.title||source.length>LIMITS.source||!body.trim()||body.length>LIMITS.body
    ||!KINDS.includes(input.kind)||!DEPARTMENTS.includes(input.department)||!tags)return null;
  return {title,kind:input.kind,source,department:input.department,tags,body};
}
function validNote(note){
  return isObject(note)&&ID.test(note.id)&&STAMP.test(note.createdAt)&&STAMP.test(note.updatedAt)&&!!cleanNote(note)
    &&cleanNote(note).title===note.title&&cleanNote(note).body===note.body;
}
function validate(document){
  if(!isObject(document)||document.version!==1||!Array.isArray(document.notes)||document.notes.length>LIMITS.notes
    ||!document.notes.every(validNote)||new Set(document.notes.map(note=>note.id)).size!==document.notes.length)
    throw new KnowledgeError(503,'知识库数据格式异常，已停止修改；现有资料未被改动');
  const history=document._history||[];
  if(!Array.isArray(history)||history.some(item=>!isObject(item)||!/^\d{13}-[a-f0-9-]{36}$/.test(item.id)))
    throw new KnowledgeError(503,'知识库备份记录异常，已停止修改');
  return {notes:document.notes,history};
}

export function createKnowledgeStore(storage){
  async function read(){
    let result;
    try{result=await storage.get(KNOWLEDGE_INDEX,{access:'private',useCache:false});}
    catch{throw new KnowledgeError(503,'知识库读取失败，请稍后重试');}
    if(result===null)return {notes:[],history:[],revision:EMPTY};
    if(result?.statusCode!==200||!result.blob?.etag)throw new KnowledgeError(503,'知识库读取失败，请稍后重试');
    let document;
    try{document=JSON.parse(await new Response(result.stream).text());}
    catch{throw new KnowledgeError(503,'知识库数据无法读取，已停止修改');}
    return {...validate(document),revision:result.blob.etag};
  }
  async function save(current,notes,user,action){
    const now=new Date().toISOString(),id=Date.now()+'-'+randomUUID();
    if(current.revision!==EMPTY){
      // Back up the version being replaced before touching the index.
      try{await storage.put(KNOWLEDGE_HISTORY+id+'.json',JSON.stringify({metadata:{id,createdAt:now,user,action},notes:current.notes}),
        {access:'private',addRandomSuffix:false,allowOverwrite:false,contentType:'application/json; charset=utf-8'});}
      catch{throw new KnowledgeError(503,'自动备份失败，本次未保存；现有资料未被改动');}
    }
    const history=current.revision===EMPTY?current.history:[{id,createdAt:now,user,action},...current.history].slice(0,LIMITS.history);
    const text=JSON.stringify({version:1,notes,_history:history,_updatedAt:now});
    if(Buffer.byteLength(text)>LIMITS.document)throw new KnowledgeError(413,'知识库已达容量上限，本次未保存');
    let result;
    try{result=await storage.put(KNOWLEDGE_INDEX,text,{access:'private',addRandomSuffix:false,
      allowOverwrite:current.revision!==EMPTY,...(current.revision!==EMPTY?{ifMatch:current.revision}:{}),contentType:'application/json; charset=utf-8'});}
    catch(error){
      if(error?.name==='BlobPreconditionFailedError')throw new KnowledgeError(409,'知识库已在其他页面更新，本次未保存；请复制当前内容后刷新');
      throw new KnowledgeError(503,'保存结果待确认，请刷新核对后再操作');
    }
    if(!result?.etag)throw new KnowledgeError(503,'保存结果待确认，请刷新核对后再操作');
    return {notes,revision:result.etag};
  }
  return {read,save};
}

export function createKnowledgeHandler({store}){
  return async function handler(req,res){
    if(!guardRequest(req,res,{methods:['GET','POST'],admin:true,json:req.method==='POST',bodyLimit:200000}))return;
    res.setHeader('Cache-Control','private, no-store');
    res.setHeader('X-Robots-Tag','noindex, nofollow, noarchive');
    const user=readSession(req)?.u;
    if(!user)return res.status(401).json({error:'未登录或会话已失效'});
    try{
      if(req.method==='GET'){
        const current=await store.read();
        return res.status(200).json({notes:current.notes,revision:current.revision});
      }
      const {action,revision,id}=req.body;
      if(typeof revision!=='string'||!revision)return res.status(428).json({error:'请先加载知识库再保存'});
      const current=await store.read();
      if(current.revision!==revision)throw new KnowledgeError(409,'知识库已在其他页面更新，本次未保存；请复制当前内容后刷新');
      const now=new Date().toISOString();
      if(action==='delete'){
        if(typeof id!=='string'||!current.notes.some(note=>note.id===id))return res.status(404).json({error:'笔记不存在或已删除'});
        const result=await store.save(current,current.notes.filter(note=>note.id!==id),user,'delete');
        return res.status(200).json({revision:result.revision,deleted:id});
      }
      if(action!=='save')return res.status(400).json({error:'未知操作'});
      const note=cleanNote(req.body.note);
      if(!note)return res.status(400).json({error:'请填写标题（≤120字）、类型、科室和正文（≤6万字）；标签最多12个、每个≤20字'});
      let saved,notes;
      if(id===undefined||id===null){
        if(current.notes.length>=LIMITS.notes)throw new KnowledgeError(413,'知识库已达条目上限');
        saved={id:randomUUID(),...note,createdAt:now,updatedAt:now};
        notes=[saved,...current.notes];
      }else{
        const prior=current.notes.find(item=>item.id===id);
        if(!prior)return res.status(404).json({error:'笔记不存在或已删除'});
        saved={id,...note,createdAt:prior.createdAt,updatedAt:now};
        notes=[saved,...current.notes.filter(item=>item.id!==id)];
      }
      const result=await store.save(current,notes,user,id?'edit':'create');
      return res.status(id?200:201).json({note:saved,revision:result.revision});
    }catch(error){
      return res.status(error instanceof KnowledgeError?error.status:503).json({error:error instanceof KnowledgeError?error.message:'知识库暂不可用，请稍后重试'});
    }
  };
}
