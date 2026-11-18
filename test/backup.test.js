import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {backupBlobs, verifyBackup, safeRelative, EXCLUDED_PREFIXES} from '../scripts/backup-blob.mjs';
import {restoreBlobs} from '../scripts/restore-blob.mjs';

// 异地备份（docs/backup.md）。全部使用内存模拟的 Blob，不访问生产数据。
function fakeBlob(entries, pageSize = 2) {
  const store = new Map(Object.entries(entries).map(([k, v]) => [k, Buffer.from(v)]));
  const puts = [];
  return {
    store, puts,
    async list({token, cursor, limit}) {
      assert.equal(token, 'tok');
      const names = [...store.keys()].sort(), start = cursor ? Number(cursor) : 0, end = Math.min(start + Math.min(limit, pageSize), names.length);
      return {blobs: names.slice(start, end).map(pathname => ({pathname, size: store.get(pathname).length, uploadedAt: '2026-11-18T00:00:00Z'})), hasMore: end < names.length, cursor: String(end)};
    },
    async get(pathname, {access, token}) {
      assert.equal(token, 'tok');
      return access === 'private' && store.has(pathname) ? {statusCode: 200, stream: store.get(pathname)} : null;
    },
    async put(pathname, body, options) { puts.push({pathname, body: Buffer.from(body), options}); return {pathname}; }
  };
}
const temp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'hajimi-backup-'));
const DATA = {
  'cms/content.json': '{"cases":[]}', 'cms/history/a.json': '{}', 'private-gallery/images/x.webp': 'RIFF....WEBP',
  'security/login-log.json': '{"success":[]}', 'monitoring/rate/abc.json': '{"count":1}', 'security/login-rate/x.json': '{}', 'security/note-rate/y.json': '{}'
};

test('完整下载（跨分页）、跳过限流计数器、生成可校验的清单', async () => {
  const dir = temp();
  try {
    const manifest = await backupBlobs({sdk: fakeBlob(DATA), token: 'tok', outDir: dir, now: () => new Date('2026-11-18T03:17:00Z')});
    assert.deepEqual(manifest.files.map(f => f.pathname), ['cms/content.json', 'cms/history/a.json', 'private-gallery/images/x.webp', 'security/login-log.json']);
    assert.equal(manifest.createdAt, '2026-11-18T03:17:00.000Z');
    assert.equal(fs.readFileSync(path.join(dir, 'files/cms/content.json'), 'utf8'), '{"cases":[]}');
    assert.ok(EXCLUDED_PREFIXES.every(prefix => !manifest.files.some(f => f.pathname.startsWith(prefix))));
    assert.deepEqual(verifyBackup(dir).problems, []);
    assert.ok(!JSON.stringify(manifest).includes('tok'), 'token is never written');
  } finally { fs.rmSync(dir, {recursive: true, force: true}); }
});

test('校验能发现被改动、缺失和多出来的文件', async () => {
  const dir = temp();
  try {
    await backupBlobs({sdk: fakeBlob(DATA), token: 'tok', outDir: dir});
    fs.writeFileSync(path.join(dir, 'files/cms/content.json'), 'tampered');
    fs.rmSync(path.join(dir, 'files/security/login-log.json'));
    fs.writeFileSync(path.join(dir, 'files/extra.json'), '{}');
    assert.deepEqual(verifyBackup(dir).problems.sort(), ['changed: cms/content.json', 'missing: security/login-log.json', 'unexpected: extra.json']);
  } finally { fs.rmSync(dir, {recursive: true, force: true}); }
});

test('不安全的路径不会写到备份目录之外', async () => {
  for (const bad of ['../etc/passwd', '/abs', 'a//b', 'a/./b', 'a\\b', '']) assert.equal(safeRelative(bad), null, bad);
  assert.equal(safeRelative('cms/history/1.json'), 'cms/history/1.json');
  const dir = temp();
  try {
    const manifest = await backupBlobs({sdk: fakeBlob({'../escape.json': 'x', 'ok.json': '{}'}), token: 'tok', outDir: dir});
    assert.deepEqual(manifest.files.map(f => f.pathname), ['ok.json']);
    assert.equal(manifest.skipped.length, 1);
    assert.ok(!fs.existsSync(path.join(dir, '..', 'escape.json')));
  } finally { fs.rmSync(dir, {recursive: true, force: true}); }
});

test('缺少令牌或下载失败时报错，不会生成残缺的"成功"备份', async () => {
  const dir = temp();
  try {
    await assert.rejects(backupBlobs({sdk: fakeBlob(DATA), token: '', outDir: dir}), /BLOB_READ_WRITE_TOKEN/);
    const sdk = fakeBlob({'a.json': '{}'});
    sdk.get = async () => null;
    await assert.rejects(backupBlobs({sdk, token: 'tok', outDir: dir}), /Could not download/);
  } finally { fs.rmSync(dir, {recursive: true, force: true}); }
});

test('恢复默认只校验不写入；写回必须确认备份时间', async () => {
  const dir = temp();
  try {
    await backupBlobs({sdk: fakeBlob(DATA), token: 'tok', outDir: dir, now: () => new Date('2026-11-18T03:17:00Z')});
    const target = fakeBlob({});
    assert.equal((await restoreBlobs({sdk: target, token: 'tok', dir})).written, 0);
    await assert.rejects(restoreBlobs({sdk: target, token: 'tok', dir, apply: true, confirm: 'wrong'}), /--confirm/);
    assert.equal(target.puts.length, 0);
    const {written} = await restoreBlobs({sdk: target, token: 'tok', dir, apply: true, confirm: '2026-11-18T03:17:00.000Z'});
    assert.equal(written, 4);
    assert.deepEqual(target.puts.map(p => [p.pathname, p.options.access, p.options.contentType]).sort(), [
      ['cms/content.json', 'private', 'application/json; charset=utf-8'], ['cms/history/a.json', 'private', 'application/json; charset=utf-8'],
      ['private-gallery/images/x.webp', 'private', 'image/webp'], ['security/login-log.json', 'private', 'application/json; charset=utf-8']]);
    fs.writeFileSync(path.join(dir, 'files/cms/content.json'), 'tampered');
    await assert.rejects(restoreBlobs({sdk: target, token: 'tok', dir}), /verification/);
  } finally { fs.rmSync(dir, {recursive: true, force: true}); }
});

test('备份工作流：只读权限、加密后再上传、令牌不出现在命令行', () => {
  const yml = fs.readFileSync(new URL('../.github/workflows/blob-backup.yml', import.meta.url), 'utf8');
  assert.match(yml, /permissions:\n  contents: read/);
  assert.match(yml, /openssl enc -aes-256-cbc -pbkdf2 -iter 600000 -salt -pass env:BACKUP_PASSPHRASE/);
  assert.match(yml, /retention-days: 90/);
  assert.match(yml, /rm -rf "\$RUNNER_TEMP\/backup"/, 'plaintext copy is removed before upload');
  assert.doesNotMatch(yml, /echo[^\n]*\$\{?(BLOB_READ_WRITE_TOKEN|BACKUP_PASSPHRASE)/);
  assert.doesNotMatch(yml, /path:[^\n]*backup\/?$/m, 'only the encrypted output is uploaded');
});
