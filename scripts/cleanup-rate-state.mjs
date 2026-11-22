// 清理过期的限流状态文件（2026-11-21，优化方案 P0-5）。
// 登录失败、AI 生成、前端报错上报三处限流按网络地址摘要各存一个 Blob 文件，窗口最长 15 分钟，
// 但文件本身从不删除，会一直累积。本脚本只在 GitHub Actions 中运行（.github/workflows/blob-backup.yml，
// 每周备份成功之后），列出这三个前缀下的文件，删除超过 MIN_AGE_MS 未更新的那些。
//
// 安全边界：
// - 只处理 RATE_STATE_PREFIXES 中的三个前缀；列表结果里出现其他前缀的文件也一律不删。
// - 只删超过 1 天未更新的文件（远大于 15 分钟窗口），正在计数的地址不受影响；
//   误删也只是让该地址的计数从零开始，与限流存储故障时的放行策略一致。
// - 单次最多删除 MAX_DELETES 个，防止异常时大批删除。
// - 默认只演示（列出将删除的数量）；加 --apply 才真正删除。
// - 网站的接口（api/_blob-auth.js）仍然只有 get/put，不获得列出和删除的能力。
// 令牌只从环境变量 BLOB_READ_WRITE_TOKEN 读取，不打印。
import {fileURLToPath} from 'node:url';

export const RATE_STATE_PREFIXES = Object.freeze(['security/login-rate/', 'security/note-rate/', 'monitoring/rate/']);
export const MIN_AGE_MS = 24 * 60 * 60 * 1000;
export const MAX_DELETES = 5000;
const BATCH = 100;

export async function cleanupRateState({sdk, token, apply = false, now = () => Date.now(), log = () => {}}) {
  if (!token) throw new Error('BLOB_READ_WRITE_TOKEN is not set');
  const cutoff = now() - MIN_AGE_MS;
  const stale = [];
  let kept = 0, capped = false;
  for (const prefix of RATE_STATE_PREFIXES) {
    let cursor;
    do {
      const page = await sdk.list({token, prefix, cursor, limit: 1000});
      for (const item of page.blobs || []) {
        // 双重确认前缀：即使列表接口返回了范围外的文件，也绝不删除。
        if (typeof item.pathname !== 'string' || !item.pathname.startsWith(prefix) || !/^[a-f0-9]{64}\.json$/.test(item.pathname.slice(prefix.length))) { kept++; continue; }
        const updated = Date.parse(item.uploadedAt);
        if (!Number.isFinite(updated) || updated > cutoff) { kept++; continue; }
        if (stale.length >= MAX_DELETES) { capped = true; continue; }
        stale.push(item.url || item.pathname);
      }
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor && !capped);
  }
  if (apply) for (let i = 0; i < stale.length; i += BATCH) await sdk.del(stale.slice(i, i + BATCH), {token});
  const summary = {stale: stale.length, kept, deleted: apply ? stale.length : 0, capped};
  log(`限流状态文件：过期 ${summary.stale} 个，保留 ${summary.kept} 个，${apply ? `已删除 ${summary.deleted} 个` : '演示模式未删除'}${capped ? `（已达单次上限 ${MAX_DELETES}）` : ''}`);
  return summary;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const sdk = await import('@vercel/blob');
  await cleanupRateState({sdk, token: process.env.BLOB_READ_WRITE_TOKEN?.trim(), apply: process.argv.includes('--apply'), log: message => console.log(message)});
}
