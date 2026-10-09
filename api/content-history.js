import {guardRequest} from './_security.js';
import {readSession} from './_auth.js';
import {contentStore,ContentError} from './_content-store.js';

export function createHistoryHandler(store=contentStore){return async function handler(req,res){
  if(!guardRequest(req,res,{methods:['GET','POST'],admin:true,json:req.method==='POST'}))return;
  try{
    if(req.method==='POST')return res.status(200).json(await store.restore(req.body.id,req.body.revision,readSession(req).u));
    const current=await store.read();
    if(req.query?.id!==undefined)return res.status(200).json(await store.historyContent(req.query.id,current));
    return res.status(200).json({revision:current.revision,updatedAt:current.updatedAt||null,history:current.history});
  }catch(error){return res.status(error instanceof ContentError?error.status:503).json({error:error instanceof ContentError?error.message:'备份服务暂不可用，请稍后重试'});}
};}
export default createHistoryHandler();
