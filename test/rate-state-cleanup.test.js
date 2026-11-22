import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {cleanupRateState, RATE_STATE_PREFIXES, MIN_AGE_MS, MAX_DELETES} from '../scripts/cleanup-rate-state.mjs';
import {EXCLUDED_PREFIXES} from '../scripts/backup-blob.mjs';

// 优化方案 P0-5：全部使用内存模拟的 Blob，不访问生产数据。
const NOW = Date.parse('2026-11-21T00:00:00Z');
const hex = n => String(n).padStart(64, '0');
function fakeBlob(items, {leakOtherPrefixes = false} = {}) {
  const deleted = [], lists = [];
  return {
    deleted, lists,
    async list({token, prefix, cursor, limit}) {
      assert.equal(token, 'tok'); lists.push(prefix);
      const matching = items.filter(item => leakOtherPrefixes || item.pathname.startsWith(prefix));
      const start = cursor ? Number(cursor) : 0, end = Math.min(start + Math.min(limit, 2), matching.length);
      return {blobs: matching.slice(start, end), hasMore: end < matching.length, cursor: String(end)};
    },
    async del(urls, {token}) { assert.equal(token, 'tok'); assert(Array.isArray(urls) && urls.length <= 100); deleted.push(...urls); }
  };
}
const item = (pathname, ageMs) => ({pathname, url: 'https://blob.example/' + pathname, uploadedAt: new Date(NOW - ageMs).toISOString()});

test('只删除三个限流前缀下超过 1 天未更新的文件；默认演示模式不删除', async () => {
  const day = MIN_AGE_MS;
  const items = [
    item('security/login-rate/' + hex(1) + '.json', day + 1), item('security/login-rate/' + hex(2) + '.json', 60_000),
    item('security/note-rate/' + hex(3) + '.json', 3 * day), item('monitoring/rate/' + hex(4) + '.json', 10 * day),
    item('monitoring/rate/' + hex(5) + '.json', day - 1),
    item('cms/content.json', 30 * day), item('security/login-log.json', 30 * day), item('monitoring/errors.json', 30 * day)
  ];
  const dry = fakeBlob(items);
  const preview = await cleanupRateState({sdk: dry, token: 'tok', now: () => NOW});
  assert.deepEqual(preview, {stale: 3, kept: 2, deleted: 0, capped: false});
  assert.deepEqual(dry.deleted, []);
  assert.deepEqual(dry.lists, [...RATE_STATE_PREFIXES], 'only the three prefixes are listed');
  const sdk = fakeBlob(items);
  assert.deepEqual(await cleanupRateState({sdk, token: 'tok', apply: true, now: () => NOW}), {stale: 3, kept: 2, deleted: 3, capped: false});
  assert.deepEqual(sdk.deleted.sort(), ['monitoring/rate/' + hex(4), 'security/login-rate/' + hex(1), 'security/note-rate/' + hex(3)].map(p => 'https://blob.example/' + p + '.json').sort());
});

test('即使列表返回了范围外或格式异常的文件，也绝不删除', async () => {
  const old = 30 * MIN_AGE_MS;
  const sdk = fakeBlob([item('cms/content.json', old), item('private-gallery/index.json', old), item('security/login-rate/../cms/content.json', old),
    item('security/login-rate/not-a-hash.json', old), {pathname: 'security/note-rate/' + hex(9) + '.json', url: 'x', uploadedAt: 'garbage'}], {leakOtherPrefixes: true});
  const result = await cleanupRateState({sdk, token: 'tok', apply: true, now: () => NOW});
  assert.equal(result.deleted, 0);
  assert.deepEqual(sdk.deleted, []);
});

test('单次删除有上限，分批调用删除接口；缺少令牌时拒绝运行', async () => {
  const items = Array.from({length: MAX_DELETES + 7}, (_, i) => item('monitoring/rate/' + hex(i) + '.json', 2 * MIN_AGE_MS));
  const sdk = fakeBlob(items);
  const result = await cleanupRateState({sdk, token: 'tok', apply: true, now: () => NOW});
  assert.equal(result.deleted, MAX_DELETES); assert.equal(result.capped, true);
  assert.equal(sdk.deleted.length, MAX_DELETES);
  await assert.rejects(cleanupRateState({sdk, token: '', now: () => NOW}), /BLOB_READ_WRITE_TOKEN/);
});

test('清理范围与备份排除的前缀一致；接口仍只能 get/put；清理只在备份成功后运行', () => {
  assert.deepEqual([...RATE_STATE_PREFIXES].sort(), [...EXCLUDED_PREFIXES].sort());
  const auth = fs.readFileSync(new URL('../api/_blob-auth.js', import.meta.url), 'utf8');
  assert.doesNotMatch(auth, /\b(list|del)\b\s*[:(,]/, 'api/_blob-auth.js must not gain list or delete');
  const workflow = fs.readFileSync(new URL('../.github/workflows/blob-backup.yml', import.meta.url), 'utf8');
  assert.match(workflow, /cleanup-rate-state:\n    needs: backup\n/);
  assert.match(workflow, /run: node scripts\/cleanup-rate-state\.mjs --apply/);
});
