import {createSession,verifyPassword} from './_auth.js';
import {guardRequest} from './_security.js';
import {checkLoginThrottle,recordLoginFailure,clearLoginFailures} from './_rate-limit.js';

export default async function handler(req,res) {
  if (!guardRequest(req,res,{methods:['POST'],json:true})) return;
  const throttle = await checkLoginThrottle(req);
  if (!throttle.allowed) {
    res.setHeader('Retry-After',String(throttle.retryAfter));
    return res.status(429).json({error:'登录尝试过于频繁，请稍后再试'});
  }
  const {username, password} = req.body;
  if (typeof username !== 'string' || typeof password !== 'string') return res.status(400).json({error:'用户名和密码格式错误'});
  if (password.length > 1024) return res.status(400).json({error:'用户名和密码格式错误'});
  // Always run the password check so a wrong username takes as long as a wrong password.
  const passwordOk = verifyPassword(password);
  if (username !== (process.env.HAJIMI_ADMIN_USER || 'admin') || !passwordOk) {
    const failed = await recordLoginFailure(req);
    if (failed.blocked) res.setHeader('Retry-After',String(failed.retryAfter));
    return res.status(failed.blocked ? 429 : 401).json({error:failed.blocked ? '登录尝试过于频繁，请稍后再试' : '用户名或密码错误'});
  }
  await clearLoginFailures(req);
  let token;
  try { token = createSession(username); }
  catch { return res.status(503).json({error:'管理登录尚未配置'}); }
  res.setHeader('Set-Cookie','hajimi_session='+encodeURIComponent(token)+'; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=604800');
  return res.status(200).json({ok:true,user:username});
}
