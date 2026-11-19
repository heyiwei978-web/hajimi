import {withMonitoring} from './_monitoring.js';
import {readSession,renewSession,securityChecks} from './_auth.js';
import {guardRequest} from './_security.js';

async function handler(req,res){
  if(!guardRequest(req,res,{methods:['GET']}))return;
  const session=readSession(req);
  // 打开管理页面也算一次使用：为会话滑动续期（见 _auth.js）。
  if(session)renewSession(req,res);
  // The configuration self-check is for the signed-in administrator only; anonymous
  // visitors learn nothing about how the login is set up.
  return res.status(200).json({authenticated:!!session,user:session?.u||null,...(session?{security:securityChecks()}:{})});
}
export default withMonitoring('session', handler);
