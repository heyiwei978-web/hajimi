import {withMonitoring} from './_monitoring.js';
import {guardRequest} from './_security.js';
import {isAdmin,readSession} from './_auth.js';
import {contentStore,ContentError} from './_content-store.js';
import {createHistoryHandler} from './_content-history.js';

export {createHistoryHandler};

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
// /api/content?feed=history 交给 _content-history.js（内容备份历史，仅管理员）；其他请求是资料本身。
// 两者共用一个函数，Vercel 免费版每次部署最多 12 个函数。
const feed = req => req.query?.feed ?? new URL(req.url || '/', 'http://local').searchParams.get('feed');
export function createContentApi(content = withMonitoring('content', createContentHandler()), history = withMonitoring('content-history', createHistoryHandler())) {
  return (req, res) => feed(req) === 'history' ? history(req, res) : content(req, res);
}
export default createContentApi();
