// 从备份恢复 Vercel Blob 数据（2026-11-18）。只供站点负责人在数据丢失时手动使用，见 docs/backup.md。
//   node scripts/restore-blob.mjs <已解密解压的备份目录>                 只校验并列出将要写回的文件，不写入
//   node scripts/restore-blob.mjs <目录> --apply --confirm=<备份创建时间>   真正写回（会覆盖同名文件）
// --confirm 必须等于 manifest.json 中的 createdAt，防止误用错误的备份。令牌只从 BLOB_READ_WRITE_TOKEN 读取。
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {verifyBackup, safeRelative} from './backup-blob.mjs';

const TYPES = {'.json': 'application/json; charset=utf-8', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp'};

export async function restoreBlobs({sdk, token, dir, apply = false, confirm, log = () => {}}) {
  const {manifest, problems} = verifyBackup(dir);
  if (problems.length) throw new Error('Backup failed verification:\n' + problems.join('\n'));
  if (!apply) return {manifest, written: 0};
  if (!token) throw new Error('BLOB_READ_WRITE_TOKEN is not set');
  if (confirm !== manifest.createdAt) throw new Error('--confirm must equal the backup createdAt: ' + manifest.createdAt);
  let written = 0;
  for (const file of manifest.files) {
    const relative = safeRelative(file.pathname);
    const body = fs.readFileSync(path.join(dir, 'files', ...relative.split('/')));
    await sdk.put(relative, body, {access: 'private', allowOverwrite: true, addRandomSuffix: false, token,
      contentType: TYPES[path.extname(relative).toLowerCase()] || 'application/octet-stream'});
    written++;
    if (written % 50 === 0) log(`已写回 ${written} / ${manifest.count}`);
  }
  return {manifest, written};
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2), dir = args.find(arg => !arg.startsWith('--'));
  if (!dir) throw new Error('Usage: node scripts/restore-blob.mjs <backup-dir> [--apply --confirm=<createdAt>]');
  const apply = args.includes('--apply'), confirm = args.find(arg => arg.startsWith('--confirm='))?.slice(10);
  const sdk = apply ? await import('@vercel/blob') : null;
  const {manifest, written} = await restoreBlobs({sdk, token: process.env.BLOB_READ_WRITE_TOKEN?.trim(), dir, apply, confirm, log: m => console.log(m)});
  console.log(apply ? `已写回 ${written} 个文件` : `校验通过：${manifest.count} 个文件（创建于 ${manifest.createdAt}）。确认后加 --apply --confirm=${manifest.createdAt} 写回。`);
}
