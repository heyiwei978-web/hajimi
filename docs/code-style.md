# 代码规范（2026-11-18）

仓库不引入 ESLint 等第三方依赖，规范由 `scripts/code-style.mjs` 检查，`test/code-style.test.js` 在每个 PR 的 CI 中强制执行。本地运行 `npm run lint` 可以一次列出全部问题，样式规则也一并检查。编辑器读取 `.editorconfig` 后会自动遵守格式规则。

## 规则

1. **文本格式**（所有代码、样式、页面、JSON、文档）：
   - 无 BOM 的 UTF-8，LF 换行，文件末尾有换行；
   - 用空格缩进，不用 Tab，Markdown 除外；
   - 行尾不留空格。Markdown 和 `content/` 下的病历数据不查这一项，因为病历正文的空格属于内容，不能改动。
   - JSON 必须能被解析。
2. **语法**：所有 `.js/.mjs/.cjs` 都要能被解析。浏览器经典脚本（`js/` 和根目录）按经典脚本检查，其余按 ES 模块用 `node --check` 检查。
3. **禁止的写法**：
   - 脚本：`eval`、`new Function`、`document.write`、`debugger`、给 `setTimeout`/`setInterval` 传字符串。页面脚本和 `api/` 里不留 `console.log`，需要记录问题时用 `console.error`/`console.warn`；构建、审核脚本是命令行工具，可以打印。
   - 页面：内联 `<script>`、`onclick=` 等内联事件、`user-scalable=no` / `maximum-scale=1`。
   - 样式：`transition: all`。
4. **直接拼接 HTML 只减不增**：`innerHTML`/`outerHTML` 赋值和 `insertAdjacentHTML` 容易引入 XSS。每个文件现有的处数记在 `config/code-budget.json`，只能减少。新代码请用 `textContent`、`createElement`、`replaceChildren` 等 DOM 方法。

`record-quality-v2.js`（医学源资料，不改）和构建生成的 `home.html` 不在检查范围内。

## 确需例外时

在 PR 中说明理由，同步修改 `config/code-budget.json` 或检查规则，由审核者确认。
