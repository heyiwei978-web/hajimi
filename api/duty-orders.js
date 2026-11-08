import {guardRequest} from './_security.js';
import {readSession} from './_auth.js';
import {ContentError} from './_content-store.js';
import {dutyOrdersStore,MAX_BYTES} from './_duty-orders-store.js';

// GET 读取（仅管理员）；PUT 保存整份资料；POST {action:'restore'} 恢复备份。
export function createDutyOrdersHandler(store=dutyOrdersStore){return async function handler(req,res){
  const json=req.method==='PUT'||req.method==='POST';
  if(!guardRequest(req,res,{methods:['GET','PUT','POST'],admin:true,json,bodyLimit:req.method==='PUT'?MAX_BYTES+4096:4096}))return;
  res.setHeader('Cache-Control','private, no-store');
  const user=readSession(req)?.u;
  if(!user)return res.status(401).json({error:'未登录或会话已失效'});
  try{
    if(req.method==='GET'){
      const current=await store.read();
      if(req.query?.history!==undefined)return res.status(200).json({sheets:await store.historyContent(req.query.history,current)});
      return res.status(200).json(current);
    }
    if(req.method==='PUT')return res.status(200).json(await store.save(req.body.sheets,req.body.revision,user));
    if(req.body.action!=='restore')return res.status(400).json({error:'不支持的操作'});
    return res.status(200).json(await store.restore(req.body.id,req.body.revision,user));
  }catch(error){
    return res.status(error instanceof ContentError?error.status:503).json({error:error instanceof ContentError?error.message:'资料服务暂不可用，请稍后重试'});
  }
};}
export default createDutyOrdersHandler();
