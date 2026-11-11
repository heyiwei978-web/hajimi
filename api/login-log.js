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
export default createLoginLogHandler();
