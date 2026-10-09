import {guardRequest} from './_security.js';
import {isAdmin,readSession} from './_auth.js';
import {contentStore,ContentError} from './_content-store.js';

export function createContentHandler(store=contentStore){return async function handler(req,res){
  if(!guardRequest(req,res,{methods:['GET','PUT'],admin:req.method==='PUT',json:req.method==='PUT',bodyLimit:1500000}))return;
  try{
    if(req.method==='GET'){
      const current=await store.read();
      const data=isAdmin(req)?current.data:{...current.data,cases:current.data.cases.filter(item=>item.published!==false)};
      return res.status(200).json({...data,revision:current.revision,updatedAt:current.updatedAt||null});
    }
    return res.status(200).json(await store.save(req.body,req.body.revision,readSession(req).u));
  }catch(error){return res.status(error instanceof ContentError?error.status:503).json({error:error instanceof ContentError?error.message:'资料服务暂不可用，请稍后重试'});}
};}
export default createContentHandler();
