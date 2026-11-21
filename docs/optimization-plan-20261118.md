# 全站代码检查与深度优化方案（2026-11-18）

本文件只是检查结论和后续方案，**不授权任何改动**。每一项实施时都要单独开 PR、走「先上传、审核后合并」（AGENTS.md 第 0 节）。凡涉及 `api/`、`vercel.json`、环境变量或 WAF 的项目，要先由负责人确认后才能动手。本次检查没有修改任何医学内容、身份账本、安全配置或发布配置。

## 一、检查范围与基线

检查基于 `main` 最新提交 `b23c4ac`，用干净安装（`npm ci`）跑完以下命令：

| 命令 | 结果 |
| --- | --- |
| `npm run build` | 通过 |
| `npm test` | 364/364 通过 |
| `npm run lint`（代码规范 + 样式防叠加） | 通过：没有被覆盖的声明，没有无人使用的规则 |
| `npm run audit:quality:check` | 通过：348 条记录，0 项阻断，0 项人工复核，2 条提示（EXAMPLE_LAB_VALUES） |
| `npm run test:browser` | 99/99 通过（本机需设 `CHROMIUM_EXECUTABLE_PATH=/opt/pw-browsers/chromium`，原因是锁定的 Playwright 版本与预装浏览器版本不一致；CI 不受影响） |

总体判断：仓库的工程化程度已经很高。安全边界（同源校验、管理请求标识、请求体上限、图片签名校验、Blob 凭据锁定）、身份账本、样式与代码预算都有测试守着。下面的问题集中在**容量与成本边界、会话生命周期、缓存策略、首屏体积和历史遗留的可维护性**上，没有发现可以直接利用的高危漏洞。

## 二、问题清单与优化方案

优先级：P0 = 建议尽快处理（关系到稳定性或安全余量），P1 = 明显收益的性能项，P2 = 可维护性和长期治理。

### P0-1 Serverless 函数数量已经用满（12/12）

- 证据：`api/` 下有 12 个不带 `_` 前缀的入口文件；`api/login-log.js`、`api/_client-error.js` 的注释已经说明为此把错误上报合进了登录记录接口。现在再增加任何接口都会导致部署失败。
- `api/logout.js` 只有一行，压缩写法，并且**没有用 `withMonitoring` 包住**，不符合第 7 节「新接口默认导出用 `withMonitoring` 包住」的约定。
- 方案：把退出登录合进 `api/session.js`（`DELETE /api/session`），把 `api/content-history.js` 合进 `api/content.js`（`?feed=history` 分发，沿用 `login-log` 的写法），可以腾出 2 个名额。前端 `cms-core.js`、`admin.js` 同步改调用路径。旧路径不保留：保留旧文件就腾不出名额；页面和脚本随同一次部署更新，只有部署时正好开着的旧页面点「退出」或看备份会失败，刷新即可恢复。
- 状态：已实施（分支 `claude/cool-bell-pgtjgs`），函数数量 12 → 10。`security/vercel-firewall-rules.json` 与 `FIREWALL.md` 的写操作限流条件已从 `/api/logout` + POST 改为 `/api/session` + DELETE；如果 Vercel 控制台已经应用过该规则，需要负责人同步修改。
- 验证：`test/security*.test.js` 补退出与历史接口的同源、方法、未登录用例；e2e 登录/退出流程。

### P0-2 管理会话无法单独作废

- 证据：`api/_auth.js` 的会话是无状态 HMAC 令牌，有效期 7 天。`logout` 只是让浏览器删掉 Cookie，令牌本身仍然有效。一旦 Cookie 泄露，唯一的作废手段是更换 `HAJIMI_SESSION_SECRET` 并重新部署。
- 方案（需负责人选定）：
  1. **会话版本号**：在令牌里加 `v` 字段，与环境变量 `HAJIMI_SESSION_VERSION` 比对；需要强制下线时只改这个变量，不用换签名密钥。改动小，不新增存储。
  2. **缩短有效期 + 滑动续期**：例如 12 小时，每次管理操作续期；配合版本号使用。
  3. 后台「安全自检」（`securityChecks`）里显示会话有效期和版本号，方便核对。
- 验证：`test/blob-auth`、`test/security` 补过期、版本不符、篡改用例。

### P0-3 限流计数不是原子操作，并且在 Blob 故障时放行

- 证据：`api/_rate-limit.js`（登录）、`api/_note-limit.js`（AI 生成）、`api/_monitoring.js` 的 `allowReport`（错误上报）都是「读 Blob → 加一 → 覆盖写」。并发请求会读到同一个旧计数，造成漏计。登录和 AI 生成在存储故障时放行。AI 生成部分已有 `docs/note-rate-limit-followup.md` 记录，登录部分同样存在。
- 方案：
  1. **首选 Vercel WAF 速率限制规则**（`/api/login` 的 POST、`/api/note-generate`、`/api/login-log?feed=errors` 的 POST）作为第一道防线，函数内计数只作为第二道。这是控制台配置，由负责人操作。
  2. 函数内增加**每个实例的内存预计数**，同一实例里的突发请求不必经过 Blob 也能拦下。
  3. 故障策略按 `note-rate-limit-followup.md` 的建议由负责人决定；本方案不擅自改为拒绝。

### P0-4 公开错误上报会消耗 Blob 操作额度

- 证据：每条被接受的前端报错要做 2 次读、2 次写（限流状态 + 错误列表），`put` 属于计费的高级操作。按网络地址限流对轮换地址无效；如果额度被耗尽，CMS 保存、图片上传、登录限流都会一起受影响。
- 方案：
  1. 实例内去重：同一 `fingerprint` 在 N 分钟内只写一次，其余只在内存累加次数，下次写入时合并。
  2. 增加全站每日上报上限（例如 500 条），超过后直接返回 204 不写入。
  3. 与 P0-3 的 WAF 规则一起实施。
  4. 维持 `FIREWALL.md` 现有限制，不放宽。

### P0-5 限流状态文件只增不减

- 证据：`security/login-rate/`、`security/note-rate/`、`monitoring/rate/` 按网络地址摘要各存一个文件，没有清理机制，会长期累积，也会进入每周备份。
- 方案：备份脚本跳过这三个前缀；另外新增定期清理（每周备份任务里顺带删除超过 1 天的状态文件）。清理需要给 `_blob-auth.js` 的白名单加 `list`/`del`，属于安全边界改动，必须单独评审，并限定只能操作这三个前缀。

### P1-1 带内容哈希的静态文件只缓存 1 天

- 证据：`vercel.json` 只对 `/records-*.json` 和 `/assets/*` 设置了 `immutable`。`department-runtime-<hash>.js`、`app-runtime-<hash>.js`、`catalog-*-<hash>.js`、`library-manifest-<hash>.js` 以及所有带 `?v=<内容哈希>` 的 CSS/JS 都只按 `max-age=86400` 缓存。这些文件的网址会随内容变化，可以放心长期缓存。
- 方案：
  1. 增加规则，让文件名里带 20 位哈希的 `.js` 使用 `public, max-age=31536000, immutable`。
  2. 带 `?v=` 查询参数的请求用 `has: [{type: 'query', key: 'v'}]` 设置同样的缓存头；不带参数的旧网址保持现状。
  3. 不改其他安全响应头。属于发布配置改动，PR 中单独说明理由，合并后核对响应头。
- 收益：二次访问和跨页面跳转时，`styles.css` + `theme.css`（约 116 KB）等公共资源不再每天重新校验。

### P1-2 发布了 14 个没有页面引用的心电图源文件

- 证据：`scripts/public-assets.mjs` 的 `PRESERVED_ECG_ASSETS` 把 `ecg-data.js`（149 KB）、`ecg-book-data*.js` 等 14 个源文件原样复制进 `dist/`。`ecg.html` 实际只加载编译后的 `/assets/ecg-<hash>.js`；在 `dist/` 里全文搜索，这些文件名没有被任何页面、脚本或样式引用。合计约 520 KB 的无用公开文件。
- 方案：确认没有外部书签依赖后，从 `PUBLIC_FILES` 中移除 `PRESERVED_ECG_ASSETS`（源文件仍然留在 `js/` 供编译和测试使用），并补一条测试：`dist/` 中不存在未被引用的 `ecg-*.js`。

### P1-3 心电图和疾病分型页首屏体积偏大

按 `dist/` 中各页面直接加载的 HTML+CSS+JS 统计（gzip -9 估算）：

| 页面 | 原始 | gzip |
| --- | --- | --- |
| `/ecg` | 687 KB | 202 KB |
| `/classification` | 270 KB | 78 KB |
| `/bl` | 245 KB | 69 KB（病历正文另按科室懒加载） |
| `/note` | 227 KB | 60 KB |
| 首页 `/` | 29 KB | 10 KB |

- 心电图：`ecg-compiler.mjs` 把全部词条、书籍资料、病例、波形打成一个包。方案是拆成「核心运行时 + 目录索引」首包，加上「书籍资料 / 病例 / 围术期」按需包，在打开相应分区或搜索时再加载（沿用病历库 `library-manifest` 的哈希清单做法）。编译期校验不变，展示内容必须逐字一致。
- 疾病分型：`classification-detail-v2-upper/lower/pelvis-foot.js` 三个文件在列表页就全部加载。方案是按路由 `/classification/guke/<病种>` 只加载对应部位的文件。
- 两项都只改加载方式，不改资料内容；e2e 要补「直接打开深链接」「离线后再展开」的用例。

### P1-4 公共样式在不需要的页面也加载

- `styles.css`（60 KB）+ `theme.css`（57 KB）几乎每页都加载。`styles.css` 中 `!important` 有 74 处、写死的颜色有 348 处，是预算里最大的一项。
- 方案：按 `docs/interface-design.md` 的两层结构，逐步把只属于病历库的规则移到病历库自己的样式文件；同时按 `config/css-budget.json` 只减不增的规则，每个 PR 削减一批 `!important` 和写死颜色，用 `node scripts/css-guard.mjs` 和手机/电脑截图对比验证。

### P2-1 收紧 CSP：去掉 `style-src 'unsafe-inline'`

- 证据：全站 HTML 和脚本里，只有 `password-hash.html` 有一个 `<style>` 块和一处 `style="justify-self:start"`。脚本通过 `element.style` 修改样式不受 CSP 限制。
- 方案：把这两处移进样式文件，再从 CSP 中去掉 `'unsafe-inline'`。另外加一条测试，阻止以后出现内联 `style`。这是安全配置收紧（不是放宽），仍须在 PR 中单独说明，并在预览部署上逐页检查控制台有没有 CSP 报错。

### P2-2 压缩写法的源文件难以审核

- 证据：`app.js`（97 KB，47 行超过 400 字符）、`js/tools-page.js`（40 行）、`js/ecg.js`（24 行）、`api/logout.js` 都是压缩写法，差异审核和定位报错都很困难。
- 方案：用一次性的「只改空白」提交重新格式化，PR 中附上 AST 等价校验（格式化前后语法树一致），并跑全量测试和 e2e。`app.js` 的路径写在身份账本里，只格式化、不移动、不改名。`js/tools-page.js` 含有临床计算公式，必须做到逐字符语义不变，并补一组计算结果快照测试。

### P2-3 可点击卡片使用 `role="button"` 的 `<article>`

- 证据：`app.js:251`、`departments.js:222/237/251/1032` 生成的卡片是 `<article role="button" tabindex="0">`，里面嵌了标题和段落，需要手写键盘处理。AGENTS.md 第 8 节要求不用非按钮元素充当按钮。
- 方案：改成卡片内放一个真正的 `<a href="/bl/...">`（可以深链接，中键可在新标签打开），再用伪元素把点击区域扩到整张卡片。保留现有样式类名；手机和电脑宽度下截图核对，读屏核对卡片名称。

### P2-4 逐步减少 `innerHTML`

- `config/code-budget.json` 中 `js/ecg.js` 有 25 处、`departments.js` 有 12 处。现有代码已经统一转义（`escapeHtml` / `esc`，搜索高亮先转义再加 `<mark>`），没有发现注入点。
- 方案：随功能改动顺带改用 `textContent` 和 DOM 方法，每次同步下调预算。不单独为此开大 PR。

### P2-5 测试与开发体验

- 在 `e2e/README` 或 `docs/deployment-workflow.md` 中补一句：预装浏览器版本与锁定版本不一致时，用 `CHROMIUM_EXECUTABLE_PATH` 指定浏览器。
- `MIGRATION_STATUS.md` 只有两行，内容已经过时；建议在 `docs/` 新增一条记录说明迁移已完成，再由负责人决定是否删除该文件。

## 三、建议实施顺序

每一步一个 PR，按 AGENTS.md 第 9 节命名：

1. `security/session-version`：P0-2（先确定方案 1 或方案 1+2）。
2. `refactor/api-consolidation`：P0-1，腾出函数名额。
3. `security/report-quota`：P0-4、P0-3 第 2 条；同时请负责人在 Vercel WAF 配置速率限制（P0-3 第 1 条）。
4. `perf/immutable-cache`：P1-1。
5. `perf/drop-unused-ecg-assets`：P1-2。
6. `perf/ecg-split`、`perf/classification-lazy`：P1-3。
7. `security/csp-style`：P2-1。
8. `refactor/format-sources`：P2-2（只改空白）。
9. `fix/a11y-card-links`：P2-3。
10. 持续进行：P1-4、P2-4（随日常改动下调预算）。

## 四、不在本方案范围内

- 病历正文、分型、临床路径、计算公式等医学内容：本次没有审核，也没有修改。
- 站内 AI 病历生成的模型、提示词和输出协议：保持不变（AGENTS.md 第 0 节）。
- 生产数据、生产后台和 Blob：本次检查没有访问。

## 五、实施进展（2026-11-21）

每项一个 PR，均未合并，等待负责人审核：

| 项目 | PR | 状态 |
| --- | --- | --- |
| P0-1 函数名额 | #141 | 已提交（本 PR） |
| P0-2 会话版本号 + 12 小时滑动续期 | #142 | 已提交；有效期按负责人选择 |
| P0-3 / P0-4 内存计数、上报去重与每日上限 | #143 | 已提交；存储故障继续放行（负责人决定）；WAF 规则仍需负责人在控制台启用 |
| P0-5 限流状态清理 | #151 | 已提交；改为在每周备份工作流中清理，接口不新增列出/删除能力 |
| P1-1 长期缓存 | #145 | 已提交；顺带修复病历库清单中 cms-core.js 的固定版本号 |
| P1-2 不发布心电图源文件 | #144 | 已提交；实为 13 个、约 484 KB（ecg-search.js 仍由 /search 使用） |
| P1-3 疾病分型按需加载 | #147 | 已提交；入口页变快、目录/病种页慢约 50~75 ms，负责人知情后决定提交 |
| P1-3 心电图拆包 | #148 | 已提交；首页 1600 → 746 ms（慢速 4G），直接打开子页面持平 |
| P1-4 写死颜色改用变量 | #153 | 已提交；7 个文件减少 245 处；`!important` 未处理 |
| P2-1 CSP 去掉 style-src 'unsafe-inline' | #146 | 已提交 |
| P2-2 压缩写法源文件排版 | — | **暂缓**，见下 |
| P2-3 卡片改为链接 | #149 | 已提交 |
| P2-4 减少 innerHTML | #152 | 已提交；减少 5 处 |
| P2-5 测试与文档整理 | #150 | 已提交；另修复一个时序不稳的 e2e 用例 |

**P2-2 暂缓的原因**：剩下的压缩写法集中在 `app.js`、`js/tools-page.js`、`js/ecg.js`，直接排版会破坏现有依赖：

- `scripts/clinical-compiler.mjs` 和 `scripts/clinical-source.mjs` 用 `app.js` 中的固定文本（如 `const templates=makeTemplates();`、`function patient(){`）切片并渲染病历正文，身份账本审核还会从历史提交读取 `app.js`；
- `test/labs-audit.test.js` 用正则从 `js/tools-page.js` 源码中提取计算公式进行医学审核断言；
- `js/ecg.js` 正被 #148 修改。

建议先把这些「按源码文本匹配」的地方改成按函数或数据结构访问（单独 PR，测试断言不变），等 #148 合并后，再做只改格式的排版。
