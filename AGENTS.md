# AGENTS.md — 哈基米工作站（hajimi）协作说明

本文件写给在本仓库工作的 AI 编码助手（Codex、Claude Code 等）和协作者。开始任何修改前请完整读一遍。`CLAUDE.md` 通过 `@AGENTS.md` 引用本文件，两者内容一致，只维护这一份。

本文与 `README.md`、`docs/` 冲突时，以更具体、更新的 `docs/` 文档为准，并在汇报中指出冲突。

---

## 1. 项目是什么

- 私有临床工作台网站「哈基米工作站」，生产域名 `wdyxzl.icu`，部署在 Vercel。
- 栏目：总首页 `/`、病历模板 `/bl`（骨科、普外科、肾内科、妇科）、疾病分型 `/classification`、心电图 `/ecg`、临床路径 `/pathway`、值班资料 `/duty`、临床工具 `/tools`、管理后台 `/admin`，以及 `/api/*` 接口。
- 内容是**教学示例病历和临床参考资料**，不是真实患者病历。站点不收集、不保存任何真实患者信息。

## 2. 技术栈与硬性约束

- 原生 HTML / CSS / JavaScript，**不引入前端框架、UI 库、外部字体、CDN 资源或新的运行时依赖**。新增 npm 依赖需在任务中被明确允许。
- 服务端为 Vercel Serverless Functions（`api/`），存储用 `@vercel/blob`。
- Node 22（与 CI 一致）。测试用 Node 内置 `node --test`，浏览器回归用 Playwright。
- `vercel.json` 的 CSP 为 `script-src 'self'`、`connect-src 'self'`：
  - 不写内联 `<script>`，不用 `eval` / `new Function`，不在 HTML 属性里写 `onclick=` 等内联事件。
  - 不请求第三方域名。
- 使用本机中文字体栈；图标只按需内联 Tabler SVG，并保留 `THIRD_PARTY_NOTICES.md` 中的许可说明。

## 3. 目录速览

| 位置 | 作用 |
| --- | --- |
| `*.html`（根目录） | 各栏目页面源文件 |
| `index.html` | 首页区块 + 完整病历库源页面；其中 `<script>` 顺序就是病历生成链 |
| `home.html` | **由构建生成**（取自 `index.html` 首页区块），不要手改 |
| `record-*.js`、`ortho-*.js`、`orthopedic-expansion-*.js`、`ideal-*.js`、`tka-special-cases.js` | 病历正文与逐轮质量修订脚本（医学内容，见第 6 节） |
| `ecg-*.js` | 心电图资料与功能，构建时由 `scripts/ecg-compiler.mjs` 编译成带哈希的包 |
| `classification-*.js` | 疾病分型资料与治疗方案 |
| `*.css` | 样式；`workspace-design.css` 是最后加载的公共界面样式，管理设计变量 |
| `config/site-modules.mjs` | **站点模块注册表**：栏目、科室、所有主导航位置的唯一来源 |
| `scripts/` | 构建、编译、审核脚本（不发布） |
| `content/clinical-library/` | 病历身份账本与修订记录（见第 6 节） |
| `api/` | 登录、会话、内容、图片、上传、私人图库接口；`_` 开头为共享模块 |
| `test/`、`e2e/` | 单元/运行时测试、浏览器回归测试 |
| `docs/` | 设计说明、内容审核记录、发布流程 |
| `security/`、`FIREWALL.md` | 防火墙规则定义与防护说明 |
| `dist/` | 构建产物，已在 `.gitignore`，不要提交 |

## 4. 构建、测试与本地预览

```bash
npm ci                       # 安装依赖
npm run build                # 生成 home.html 与 dist/（Vercel 部署时自动运行）
npm test                     # 单元与运行时测试（安全边界、病历生成链、导航、构建等）
npm run audit:quality:check  # 病历质量门禁（CI 必跑）
npx playwright install chromium && npm run test:browser   # 构建后跑手机/电脑浏览器回归
```

其他审核命令：`npm run audit:clinical`（身份账本与修订流程）、`npm run audit:quality`、`npm run audit:operative`、`npm run audit:conditional`。

- 本地预览要服务 `dist/`，并按 `vercel.json` 的 rewrites 路由；不要直接打开源文件判断最终效果。
- CI（`.github/workflows/security-smoke.yml`）在 PR 到 `main` 时运行：`npm test` → `npm run audit:quality:check` → `npm run test:browser`。**提交前本地先跑通这三项。**
- 依赖 `@vercel/blob` 的测试（blob-auth、content-store、private-gallery、security）在无法安装依赖的环境会失败；这是环境问题，汇报时如实说明，不要为了通过而改测试。

## 5. 生成与注册机制（改之前先确认源头）

- **导航**：所有页面的主导航链接由 `scripts/navigation-build.mjs` 按 `config/site-modules.mjs` 在构建时生成。
  - 增删改栏目、改导航顺序、改当前项 → 只改注册表，不要手改各页面的导航链接。
  - 导航顺序也是界面约定：`styles.css` 在 640px 以下隐藏第 4 个导航项，`ui-polish.css` 再为官方导航恢复；调整顺序要在手机宽度下验证。
  - 注册表的 `routes` 要与 `vercel.json` 的 rewrites 保持一致；新增路由两处都要改。
- **科室**：科室卡片、路由元数据、分型列表由 `scripts/department-build.mjs` 依据注册表的 `DEPARTMENTS` 生成。
- **发布白名单**：`scripts/public-assets.mjs` 是公开文件的显式白名单。新增要公开的页面、样式或脚本，必须加入对应列表，否则不会进入 `dist/`。病历源脚本、`config/`、`scripts/`、`docs/`、`content/` 和所有 `.md` 都不得公开。
- **心电图**：`ecg.html` 的脚本顺序必须与 `scripts/ecg-compiler.mjs` 中的 `ECG_SOURCES` 一致，否则构建失败；编译期会校验词条 id、分类、示意图、相关链接、参考文献（必须 https）和日期格式。
- **首页**：首页样式和入口内容维护在 `index.html`；`home.html` 由构建生成。
- **缓存版本号**：页面用 `?v=日期-说明` 做缓存刷新。修改某个 CSS/JS 后，同步更新**所有**引用它的页面上的版本号，保持一致。

## 6. 医学内容（最高风险，必须遵守）

### 6.1 默认不改医学正文
除非任务**明确授权修改医学内容**，否则：
- 不改病历正文、病例事实、检验数值、用药、诊断、手术经过、日期等任何医学文字；
- 不改分型定义、治疗方案、临床路径、计算公式及其参考来源；
- 界面、样式、性能、重构类任务只能改展示方式，**输出给用户的复制/打印正文必须逐字不变**。

### 6.2 身份账本不可改写
- `content/clinical-library/baseline.json` 与 `records.jsonl` 必须**逐字节保持不变**；`scripts/clinical-baseline.mjs` 固定了它们的哈希，改动会阻止构建。不得尝试重新初始化。
- `revisions.json` 只能追加经审核的批次。
- 每条文书有永久稳定 ID（`clinical-v1-rNNNNNN`）和原数字 ID，不得重编号、复用或改变病例归属、排序、名称、阶段、类型。
- 修改医学正文必须走 `docs/clinical-identity-ledger-update-plan.md` 的流程：生成仓库外的差异预览 → 医学审核人明确授权 → 用审核过的 `proposalHash` 应用。**AI 不能自行充当审核人或替用户授权。**

### 6.3 生成链顺序
- `index.html` 里病历相关 `<script>` 的顺序就是生成链，由 `scripts/clinical-compiler.mjs` 执行。现有顺序（包括 `record-quality-v24.js` 排在 `v23` 之前）是有意保留的，**不要"整理"或重排**。
- 新的修订脚本追加在链尾，并按第 6.2 节流程审核。
- 不要在 `index.html` 里加入与病历无关的 `<script>`——那里的每个脚本都会被编译器当作病历链执行。

### 6.4 写作与安全原则
- 只修正与原病例事实一致的内容；不能用"术式常规"替代病例事实，不能把可选操作写成已完成。不确定处保留【待核实】字段。
- 合并慢性病补充模块与原始示例病历**完全分开**：不把慢性病文本拼进原病历，原章节的显示、预览、单章复制、整套复制必须逐字保持（见 `docs/comorbidity-modules-v1.md`）。
- TKA 标准病例与两套 TKA 特殊病例是三套独立身份，不得混合。
- 腰椎相关病例已按政策移出公开页面（`docs/lumbar-withdrawal-20261024.md`），不要恢复。
- 改动医学内容后必须跑 `npm run audit:quality:check` 及相关 `audit:*` 和测试。审核通过只代表技术与一致性检查，不等于临床医师签字认证；汇报时不要夸大。

## 7. 安全与隐私

- **绝不提交**：密码、哈希、会话密钥、Token、`.env`、Cookie、Vercel 环境变量的值、真实患者信息或未脱敏图片。敏感配置只存于 Vercel Environment Variables（`HAJIMI_ADMIN_USER`、`HAJIMI_SESSION_SECRET`、`HAJIMI_ADMIN_PASSWORD_HASH` 等，只写变量名）。
- 不放宽 `vercel.json` 的安全响应头、CSP、`routes` 拦截规则；如确需修改，在 PR 中单独说明理由。
- 接口约定（见 `FIREWALL.md`）：写操作要求同源 Origin / Fetch Metadata 和管理请求标识；请求体有大小上限；图片只接受 JPG/PNG/WebP 并校验文件签名；未发布案例和私人图库仅管理员可见；私人图库与公开 CMS 数据完全隔离。改 `api/` 时保持这些边界，并补充对应测试。
- 浏览器存储：收藏/字号等偏好只存标识，不存患者信息或正文；值班草稿只存 `sessionStorage`。
- 不要在测试或脚本中登录生产后台、写生产 Blob 或访问生产私有数据。测试使用随机密钥、虚构凭据、合成数据和内存存储。

## 8. 界面与前端规范

- 参考 `docs/interface-design.md`：移动端优先、单列起步；统一蓝白配色、卡片、按钮、标题和间距；手机导航在自身区域横向滚动。
- 病历阅读字号 18/20/22px 三档，目录、正文、预览同步；字号与高亮只改显示，不影响复制和打印。
- 无障碍基线（不得倒退）：每页 `lang="zh-CN"`、跳到主内容链接、全局 `:focus-visible` 焦点框、`prefers-reduced-motion` 全局降级、表单都有 label、提示信息用 `role="status"`/`aria-live`、破坏性操作先确认。
- 不禁止缩放（不写 `user-scalable=no` / `maximum-scale=1`），不用 `transition: all`，不用可点击的 `<div>`/`<span>` 代替按钮或链接。
- 所有页面使用了 `viewport-fit=cover`，固定或吸顶/吸底元素要处理 `env(safe-area-inset-*)`。
- 每次界面改动都要在手机（约 390px 宽）和电脑宽度下检查：无横向滚动、组件边界正常、搜索、病历预览/复制/打印、临床工具可用。
- 打印样式由各模块维护，改布局时确认打印不受影响。

## 9. Git、PR 与发布

- **不要直接推送到 `main`。** 从最新 `main` 建分支，命名沿用：`feat/`、`fix/`、`perf/`、`refactor/`、`security/`、`content/`、`clinical/`、`docs/`、`chore/`，可加日期后缀，例如 `fix/nav-consistency-20261030`。
- 一个 PR 只做一件事。医学内容改动与界面/代码改动分开提交、分开 PR。
- 提交信息用简短前缀 + 中文或英文说明，例如 `fix(ui): toast 读屏播报`、`clinical: …`、`docs: …`。
- PR 描述写清：改了什么、为什么、影响哪些页面、跑了哪些检查及结果、截图（界面改动时）、未完成或有风险的地方。
- **合并即上线**：`main` 已启用 Vercel 自动部署，PR 合并到 `main` 后会自动发布到生产（`wdyxzl.icu`）。因此：
  - 合并 PR 等于发布上线。**不要自行合并 PR**，除非任务明确授权合并该 PR。
  - 合并前确认 CI 全部通过、Vercel 预览部署检查无误；涉及医学内容的 PR 须已完成医学审核授权。
  - 合并后核对对应提交的生产部署为 READY、正式域名改动生效；失败时查看构建与运行日志并汇报，不要自行回滚。
  - 不要手动创建生产部署、提升（promote）、回滚或修改别名/域名，除非任务明确授权该具体操作。
  - `vercel.json` 的 `git.deploymentEnabled` 中仍禁用的历史分支规则保留，不要删除。
  - 详细要求见 `docs/deployment-workflow.md`。
- 不要改写历史记录类文档（例如 `docs/` 中的审核记录、发布收据）；有新进展时新增记录。

## 10. 任务完成的标准

完成后在汇报中逐项说明：
1. 改了哪些文件，每处改动的目的；
2. 运行了哪些命令，结果如何（失败的测试要写原因，不能隐瞒或删除测试）；
3. 界面改动在手机和电脑宽度下的检查结果；
4. 是否触及医学内容、身份账本、安全边界或发布配置（默认应为"否"）；
5. 未完成事项、不确定之处和建议的后续步骤。

遇到以下情况，**停下来询问，不要猜测**：任务需要修改医学内容但未授权；需要改动身份账本、安全配置或发布设置；需求与本文件冲突；需要访问生产数据或凭据。

## 11. 已知待办（供参考，不代表已授权）

- 导航收尾：管理后台导航补齐、所有页面当前项加 `aria-current`、副标题统一、清理 `index.html` 中旧的 `#dutyPage` 区块（见 `config/site-modules.mjs` 中记录的已知不一致）。
- 模块化第二阶段：顶栏外层结构共用、各页面 CSS 版本号统一并由构建集中注入。
