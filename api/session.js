import {withMonitoring} from './_monitoring.js';
import {readSession,securityChecks} from './_auth.js';
import {guardRequest} from './_security.js';

// GET：当前登录状态（已登录时附带配置自检）。
// DELETE：退出登录，清除会话 Cookie（原 /api/logout 合并到这里，Vercel 免费版每次部署最多 12 个函数）。
//   DELETE 属于写操作，guardRequest 同样要求同源和管理请求标识。
async function handler(req,res){
  if(!guardRequest(req,res,{methods:['GET','DELETE']}))return;
  if(req.method==='DELETE'){
    res.setHeader('Set-Cookie','hajimi_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0');
    return res.status(200).json({ok:true});
  }
  const session=readSession(req);
  // The configuration self-check is for the signed-in administrator only; anonymous
  // visitors learn nothing about how the login is set up.
  return res.status(200).json({authenticated:!!session,user:session?.u||null,...(session?{security:securityChecks()}:{})});
}
export default withMonitoring('session', handler);
