import {guardRequest, sameOrigin} from './_security.js';
import {monitor, normalizeReport} from './_monitoring.js';

// /api/login-log?feed=errors（由 login-log.js 分发；原计划的独立接口会超出 Vercel 免费版 12 个函数的上限）
//   POST（公开）：前端 error-report.js 上报本站脚本的报错摘要。这是唯一不需要登录的写入接口，
//                 因此单独设限：只接受同源请求和 X-Hajimi-Report 标识、JSON 正文不超过 2 KB、
//                 字段逐项校验清理、同一网络地址 10 分钟内最多 20 次；任何不合格的请求都不写入。
//                 成功与否都只返回 204，不回显内容。
//   GET（仅管理员）：查看错误记录。DELETE（仅管理员）：问题处理完后清空。
export const REPORT_BODY_LIMIT = 2048;

function readReport(req) {
  if (!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type'] || '')) return null;
  const declared = req.headers['content-length'];
  if (declared !== undefined && (!/^\d+$/.test(String(declared)) || Number(declared) > REPORT_BODY_LIMIT)) return null;
  try {
    const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? null);
    if (typeof raw !== 'string' || Buffer.byteLength(raw) > REPORT_BODY_LIMIT) return null;
    return normalizeReport(typeof req.body === 'string' ? JSON.parse(raw) : req.body);
  } catch { return null; }
}

export function createClientErrorHandler(target = monitor) {
  return async function handler(req, res) {
    if (req.method === 'POST') {
      res.setHeader('Cache-Control', 'no-store');
      if (!sameOrigin(req) || req.headers['x-hajimi-report'] !== '1') return res.status(403).json({error: '禁止跨站操作'});
      const report = readReport(req);
      if (report && await target.allowReport(req)) await target.record(report, req);
      return res.status(204).end();
    }
    if (!guardRequest(req, res, {methods: ['GET', 'DELETE'], admin: true})) return;
    res.setHeader('Cache-Control', 'private, no-store');
    try {
      if (req.method === 'DELETE') { await target.clear(); return res.status(200).json({entries: []}); }
      return res.status(200).json(await target.read());
    } catch { return res.status(503).json({error: '错误记录暂时无法读取，请稍后重试'}); }
  };
}
export default createClientErrorHandler();
