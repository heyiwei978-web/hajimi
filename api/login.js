import {createSession,sha256,safeEqHex} from './_auth.js';
import {guardRequest} from './_security.js';

export default async function handler(req,res) {
  if (!guardRequest(req,res,{methods:['POST'],json:true})) return;
  const {username, password} = req.body;
  if (typeof username !== 'string' || typeof password !== 'string') return res.status(400).json({error:'用户名和密码格式错误'});
  if (username !== (process.env.HAJIMI_ADMIN_USER || 'admin') || !safeEqHex(sha256(password), process.env.HAJIMI_ADMIN_PASSWORD_SHA256 || '')) {
    return res.status(401).json({error:'用户名或密码错误'});
  }
  let token;
  try { token = createSession(username); }
  catch { return res.status(503).json({error:'管理登录尚未配置'}); }
  res.setHeader('Set-Cookie','hajimi_session='+encodeURIComponent(token)+'; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=604800');
  return res.status(200).json({ok:true,user:username});
}
