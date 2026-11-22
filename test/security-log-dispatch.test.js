import test from 'node:test';
import assert from 'node:assert/strict';
import {createSecurityLogHandler} from '../api/login-log.js';

// Vercel 免费版每次部署最多 12 个函数；错误记录与登录记录共用 /api/login-log。
test('/api/login-log?feed=errors 交给错误记录处理，其余仍是登录记录', async () => {
  const calls = [];
  const handler = createSecurityLogHandler(async () => calls.push('login'), async () => calls.push('errors'));
  await handler({url: '/api/login-log?feed=errors', query: {feed: 'errors'}, headers: {}}, {});
  await handler({url: '/api/login-log?feed=errors', headers: {}}, {});
  await handler({url: '/api/login-log', query: {}, headers: {}}, {});
  assert.deepEqual(calls, ['errors', 'errors', 'login']);
});
