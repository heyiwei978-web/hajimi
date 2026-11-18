import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DIRECTORY_SCRIPTS, SCRIPT_DIRECTORY, sourcePath} from '../scripts/public-assets.mjs';

// 目录约定（2026-11-18）：在用的页面脚本放在 js/，发布后网址仍是根路径（/note.js）。
// 根目录只保留路径写在身份账本里的 app.js、search-core.js、departments.js 和医学源资料 record-quality-v2.js（旧生成链已删除）。
const root = new URL('../', import.meta.url);
const index = JSON.parse(fs.readFileSync(new URL('content/clinical-library/source/index.json', root), 'utf8'));
const FROZEN_ROOT = new Set([...index.retiredChain.map(item => item.path), 'record-quality-v2.js']);

test('新页面脚本放进 js/，根目录不再新增 .js 文件', () => {
  const rootScripts = fs.readdirSync(root).filter(file => file.endsWith('.js'));
  assert.deepEqual(rootScripts.filter(file => !FROZEN_ROOT.has(file)), [],
    '根目录出现了新的 .js 文件：页面脚本请放进 js/ 并登记到 scripts/public-assets.mjs 的 DIRECTORY_SCRIPTS');
});

test('js/ 下的文件与登记清单一一对应', () => {
  const files = fs.readdirSync(new URL(SCRIPT_DIRECTORY, root)).filter(file => file.endsWith('.js')).sort();
  assert.deepEqual(files, [...DIRECTORY_SCRIPTS].sort());
  for (const file of DIRECTORY_SCRIPTS) assert.equal(sourcePath(file), SCRIPT_DIRECTORY + file);
  assert.equal(sourcePath('app.js'), 'app.js', 'frozen and root runtime files resolve to the root');
});

test('接口代码里引用的本地文件都存在（移动脚本后不留断链）', () => {
  const api = new URL('api/', root);
  for (const file of fs.readdirSync(api).filter(name => name.endsWith('.js'))) {
    const source = fs.readFileSync(new URL(file, api), 'utf8');
    for (const [, spec] of source.matchAll(/(?:import|from)\s*\(?\s*['"](\.{1,2}\/[^'"]+)['"]/g)) {
      assert.ok(fs.existsSync(new URL(spec, new URL(file, api))), `api/${file} 引用的 ${spec} 不存在`);
    }
  }
});
