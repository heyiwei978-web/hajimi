// 旧病历生成链（2026-11-18 起已从工作区删除）的历史版本读取工具，供核对历次医学修订的测试使用。
// 这些测试用旧生成链还原"修订前"的病历，再与现在的 JSON 源数据比对。
// 文件统一从删除前的提交 LEGACY_COMMIT 读取；浅克隆（CI）缺少该提交时会自动按需拉取。
// 不是测试文件（npm test 只运行 test/*.test.js）。
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {sourcePath} from '../scripts/public-assets.mjs';

export const LEGACY_COMMIT = '540efe1ea9ad2d2fafce0d007f31713605318646';
const cwd = fileURLToPath(new URL('../', import.meta.url));
const git = args => execFileSync('git', args, {cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe']});
let ready = false;
const hasCommit = () => { try { git(['cat-file', '-e', LEGACY_COMMIT + '^{commit}']); return true; } catch { return false; } };
const pause = ms => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
// npm test 会并行运行多个测试文件，它们可能同时拉取同一个提交；
// 并发的 git fetch 会因浅克隆文件被改动而失败（"shallow file has changed"），这里重试并重新确认。
function ensureCommit() {
  if (ready) return;
  for (let attempt = 0; !hasCommit(); attempt++) {
    try { git(['fetch', '--quiet', '--depth=1', 'origin', LEGACY_COMMIT]); }
    catch (error) {
      if (attempt >= 8) throw error;
      pause(200 + Math.floor(Math.random() * 400) * (attempt + 1));
    }
  }
  ready = true;
}
const cache = new Map();
// 读取删除前提交里的文件（相对仓库根目录的路径）。
// 并行拉取时，提交对象可能已经写入、但它的文件树还没写完，此时 git show 报 "bad object"（CI 浅克隆中出现过）。
// 失败时等待片刻、重新拉取后再读；文件确实不存在时，多次重试后仍会抛出原始错误。
export function readLegacy(file) {
  if (!cache.has(file)) {
    ensureCommit();
    for (let attempt = 0; ; attempt++) {
      try { cache.set(file, git(['show', LEGACY_COMMIT + ':' + file])); break; }
      catch (error) {
        if (attempt >= 8) throw error;
        pause(200 + Math.floor(Math.random() * 400) * (attempt + 1));
        try { git(['fetch', '--quiet', '--depth=1', 'origin', LEGACY_COMMIT]); } catch {}
      }
    }
  }
  return cache.get(file);
}
// 删除前的病历库页面，包含完整的旧生成链 <script> 列表。
export const legacyIndexHtml = () => readLegacy('index.html');
// 供 loadClinicalSource 的 readSource 使用：页面里的 /xxx.js 在该提交中位于根目录（旧生成链）或 js/（在用脚本）。
export const readLegacySource = file => readLegacy(sourcePath(file));
