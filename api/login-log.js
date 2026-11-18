import {createClientErrorHandler} from './_client-error.js';
import {withMonitoring} from './_monitoring.js';
import {guardRequest} from './_security.js';
import {loginLog} from './_login-log.js';

// GET（仅管理员）：最近的登录成功记录和失败尝试。
export function createLoginLogHandler(log = loginLog) {
  return async function handler(req, res) {
    if (!guardRequest(req, res, {methods: ['GET'], admin: true})) return;
    res.setHeader('Cache-Control', 'private, no-store');
    try { return res.status(200).json(await log.read()); }
    catch { return res.status(503).json({error: '登录记录暂时无法读取，请稍后重试'}); }
  };
}
// 错误记录与登录记录同属"安全记录"，共用这个接口（Vercel 免费版每次部署最多 12 个函数，已用满）：
// /api/login-log?feed=errors 交给 _client-error.js 处理（公开 POST 上报；管理员 GET 查看、DELETE 清空）。
const feed = req => req.query?.feed ?? new URL(req.url || '/', 'http://local').searchParams.get('feed');
export function createSecurityLogHandler(login = withMonitoring('login-log', createLoginLogHandler()), errors = createClientErrorHandler()) {
  return (req, res) => feed(req) === 'errors' ? errors(req, res) : login(req, res);
}
export default createSecurityLogHandler();
