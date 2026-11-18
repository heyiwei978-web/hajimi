// 异地备份：把 Vercel Blob 中的站点数据完整下载到本地目录（2026-11-18）。
// 由 .github/workflows/blob-backup.yml 定时运行，下载后加密打包，存为 GitHub Actions 构件。
// 用法见 docs/backup.md：
//   node scripts/backup-blob.mjs <输出目录>        下载全部数据并生成 manifest.json
//   node scripts/backup-blob.mjs --verify <目录>   按 manifest.json 校验每个文件的大小和 SHA-256
// 令牌只从环境变量 BLOB_READ_WRITE_TOKEN 读取，不打印、不写入备份。
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

// 限流计数器是临时数据，不需要备份。
export const EXCLUDED_PREFIXES = ['monitoring/rate/', 'security/login-rate/', 'security/note-rate/'];
const sha256 = buffer => crypto.createHash('sha256').update(buffer).digest('hex');

// 备份里的路径来自 Blob 的 pathname，写盘前确认它不会跳出备份目录。
export function safeRelative(pathname) {
  if (typeof pathname !== 'string' || !pathname || pathname.length > 512) return null;
  if (pathname.startsWith('/') || pathname.includes('\\') || pathname.includes('\0')) return null;
  const parts = pathname.split('/');
  if (parts.some(part => !part || part === '.' || part === '..')) return null;
  return parts.join('/');
}

async function readBody(result) {
  if (!result || result.statusCode !== 200 || !result.stream) return null;
  return Buffer.from(await new Response(result.stream).arrayBuffer());
}

export async function backupBlobs({sdk, token, outDir, now = () => new Date(), log = () => {}}) {
  if (!token) throw new Error('BLOB_READ_WRITE_TOKEN is not set');
  const filesDir = path.join(outDir, 'files');
  fs.mkdirSync(filesDir, {recursive: true});
  const files = [], skipped = [];
  let cursor;
  do {
    const page = await sdk.list({token, cursor, limit: 1000});
    for (const item of page.blobs || []) {
      const pathname = item.pathname;
      if (EXCLUDED_PREFIXES.some(prefix => String(pathname).startsWith(prefix))) continue;
      const relative = safeRelative(pathname);
      if (!relative) { skipped.push({pathname: String(pathname).slice(0, 200), reason: 'unsafe pathname'}); continue; }
      let body = await readBody(await sdk.get(pathname, {access: 'private', token, useCache: false}).catch(() => null));
      if (!body) body = await readBody(await sdk.get(pathname, {access: 'public', token, useCache: false}).catch(() => null));
      if (!body) throw new Error('Could not download blob: ' + relative);
      const target = path.join(filesDir, ...relative.split('/'));
      fs.mkdirSync(path.dirname(target), {recursive: true});
      fs.writeFileSync(target, body);
      files.push({pathname: relative, size: body.length, sha256: sha256(body), uploadedAt: item.uploadedAt ? new Date(item.uploadedAt).toISOString() : null});
    }
    cursor = page.hasMore ? page.cursor : undefined;
    log(`已下载 ${files.length} 个文件`);
  } while (cursor);
  files.sort((a, b) => a.pathname.localeCompare(b.pathname, 'en'));
  const manifest = {schemaVersion: 1, createdAt: now().toISOString(), count: files.length,
    totalBytes: files.reduce((sum, file) => sum + file.size, 0), excludedPrefixes: EXCLUDED_PREFIXES, skipped, files};
  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 1) + '\n');
  return manifest;
}

// 校验备份完整：manifest 里的每个文件都存在且大小、哈希一致，且没有多余文件。
export function verifyBackup(dir) {
  const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
  const problems = [];
  const expected = new Set();
  for (const file of manifest.files) {
    const relative = safeRelative(file.pathname);
    if (!relative) { problems.push('unsafe pathname in manifest: ' + file.pathname); continue; }
    expected.add(relative);
    const target = path.join(dir, 'files', ...relative.split('/'));
    if (!fs.existsSync(target)) { problems.push('missing: ' + relative); continue; }
    const body = fs.readFileSync(target);
    if (body.length !== file.size || sha256(body) !== file.sha256) problems.push('changed: ' + relative);
  }
  const walk = (base, prefix = '') => fs.readdirSync(base, {withFileTypes: true}).flatMap(entry =>
    entry.isDirectory() ? walk(path.join(base, entry.name), prefix + entry.name + '/') : [prefix + entry.name]);
  const filesDir = path.join(dir, 'files');
  if (fs.existsSync(filesDir)) for (const extra of walk(filesDir).filter(name => !expected.has(name))) problems.push('unexpected: ' + extra);
  if (manifest.count !== manifest.files.length) problems.push('count mismatch');
  return {manifest, problems};
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args[0] === '--verify') {
    const {manifest, problems} = verifyBackup(args[1] || 'backup');
    if (problems.length) { console.error(problems.join('\n')); process.exitCode = 1; }
    else console.log(`备份校验通过：${manifest.count} 个文件，${manifest.totalBytes} 字节，创建于 ${manifest.createdAt}`);
  } else {
    const outDir = args[0] || 'backup';
    if (fs.existsSync(outDir) && fs.readdirSync(outDir).length) throw new Error('Output directory must be empty: ' + outDir);
    const sdk = await import('@vercel/blob');
    const manifest = await backupBlobs({sdk, token: process.env.BLOB_READ_WRITE_TOKEN?.trim(), outDir, log: message => console.log(message)});
    const {problems} = verifyBackup(outDir);
    if (problems.length) { console.error(problems.join('\n')); process.exitCode = 1; }
    else console.log(`备份完成：${manifest.count} 个文件，${manifest.totalBytes} 字节${manifest.skipped.length ? `，跳过 ${manifest.skipped.length} 个异常路径` : ''}`);
  }
}
