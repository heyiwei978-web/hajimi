import {readSession} from './_auth.js';
import {guardRequest} from './_security.js';
import {ContentError} from './_content-store.js';
import {createNoteCaseRepository} from './_note-cases.js';

export function createNoteCasesHandler({repositoryFor=createNoteCaseRepository}={}) {
  return async function handler(req,res) {
    if (!guardRequest(req,res,{methods:['GET','POST'],admin:true,json:req.method==='POST',bodyLimit:1500000})) return;
    res.setHeader('Cache-Control','private, no-store');
    const user = readSession(req)?.u;
    if (!user) return res.status(401).json({error:'未登录或会话已失效'});
    try {
      const repository = repositoryFor(user);
      if (req.method==='GET') {
        if (req.query?.id !== undefined) return res.status(200).json(await repository.get(req.query.id));
        return res.status(200).json({items:await repository.list()});
      }
      return res.status(200).json(await repository.save(req.body));
    } catch (error) {
      return res.status(error instanceof ContentError ? error.status : 503).json({
        error:error instanceof ContentError ? error.message : '病历存储暂不可用，当前编辑内容已保留，请稍后重试'
      });
    }
  };
}
export default createNoteCasesHandler();
