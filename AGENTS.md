# AGENTS.md — 哈基米工作站（hajimi）协作说明

本文件写给在本仓库工作的 AI 编码助手（Codex、Claude Code 等）和协作者。开始任何修改前请完整读一遍。`CLAUDE.md` 通过 `@AGENTS.md` 引用本文件，两者内容一致，只维护这一份。

本文与 `README.md`、`docs/` 冲突时，以更具体、更新的 `docs/` 文档为准，并在汇报中指出冲突。

## 0. 分工与「先上传、审核后合并」（所有助手必读）

站点负责人规定的分工：

| 负责方 | 负责范围 | 不碰 |
| --- | --- | --- |
| **Claude**（Claude Code） | 代码：界面、样式、构建脚本、导航与注册表、接口 `api/`、测试、安全、依赖、部署配置 | 医学内容（第 6 节所列一切医学文字与资料） |
| **ChatGPT / Codex** | 内容：病历正文（`content/clinical-library/source/` 下各病种 JSON）、疾病分型与治疗方案、临床路径、心电图资料、临床工具公式及其参考来源 | 上述「代码」范围的文件，除非负责人在该任务中明确要求 |

一个任务若同时需要改内容和代码：内容方只改内容，在 PR 描述里写明需要的代码改动，由代码方另开 PR。

**所有改动一律「先上传、审核后合并」，没有例外：**

1. **先上传**：从最新 `main` 建分支，把改动推送到 GitHub 并开 PR 到 `main`。不得直接推送 `main`（仓库规则也会拒绝）。
2. **不得自行合并**：任何助手（包括 ChatGPT、Codex、Claude）都不能合并自己或别人的 PR。合并等于上线到 `wdyxzl.icu`。
3. **审核**：
   - 技术审核：CI（`unit-tests`）必须通过；Claude 负责检查内容 PR 是否误改代码、构建/测试/质量门禁是否通过、Vercel 预览页面显示是否正常，并把结论写在 PR 评论或汇报里。
   - 医学审核：涉及病历正文的 PR 必须按第 6.2 节流程，由站点负责人作为医学审核人确认；技术审核通过不等于医学内容正确，AI 不能代替负责人做医学审核。
4. **合并**：只有站点负责人明确说「合并/上线」某个 PR 后才能合并；合并后核对生产部署（第 9 节）。

PR 描述里写明：负责方（Claude / ChatGPT / Codex）、改动类型（代码 / 内容）、是否需要医学审核。

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
| `index.html` | 首页区块 + 完整病历库源页面；其中病历相关 `<script>` 是**已退役**的旧生成链（见第 6.3 节） |
| `home.html` | **由构建生成**（取自 `index.html` 首页区块），不要手改 |
| `content/clinical-library/source/` | **病历正文源数据**：每个科室一个目录、每个病种一个 JSON 文件；`index.json` 记录全部记录顺序；`legacy-rendered.json` 只供身份账本核对 |
| `record-*.js`、`ortho-*.js`、`orthopedic-expansion-*.js`、`ideal-*.js`、`tka-special-cases.js` | 已退役的旧生成链脚本，冻结不改（见第 6.3 节） |
| `ecg-*.js` | 心电图资料与功能，构建时由 `scripts/ecg-compiler.mjs` 编译成带哈希的包 |
| `classification-*.js` | 疾病分型资料与治疗方案 |
| `*.css` | 样式；`workspace-design.css` 是最后加载的公共界面样式，管理设计变量 |
| `config/site-modules.mjs` | **站点模块注册表**：栏目、科室、所有主导航位置的唯一来源 |
| `scripts/` | 构建、编译、审核脚本（不发布） |
| `content/clinical-library/` | 病历身份账本、修订记录与正文源数据（见第 6 节） |
| `api/` | 登录、会话、内容、图片、上传、私人图库接口；`_` 开头为共享模块 |
| `test/`、`e2e/` | 单元/运行时测试、浏览器回归测试 |
| `docs/` | 设计说明、内容审核记录、发布流程 |
| `security/`、`FIREWALL.md` | 防火墙规则定义与防护说明 |
| `dist/` | 构建产物，已在 `.gitignore`，不要提交 |

**根目录约定**：已退役的病历生成链脚本留在根目录、内容冻结——`baseline.json` 与 `source/index.json` 的 `retiredChain` 按文件名记录了它们的哈希，测试会检查不变。新增的页面脚本、样式也放在根目录并加入发布白名单；不要再新增"补丁式"脚本（运行时注入样式或改 DOM 修正别处问题），直接改对应模块。`record-quality-v2.js` 未被引用，但属于医学源资料，未经医学授权不删除。

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
- **缓存版本号**：构建时 `scripts/asset-versions.mjs` 把 `dist/` 页面里所有 `/文件.css|js?v=…` 替换为该文件内容的哈希。**不需要也不要手动改版本号**；源 HTML 里的 `?v=` 只在不构建直接预览源文件时起作用。新增引用时照样写 `?v=` 即可被接管。
- **顶栏**：官方页面（`official`）和工具页（`tools`）的整个 `<header>` 由 `scripts/navigation-build.mjs` 按模板生成：品牌区来自 `SITE_BRAND`，导航来自 `MODULES`；页面只能保留额外的 header 样式类和 `.official-nav-right` 里的专属按钮。往顶栏里加别的内容会让构建失败——需要的话先改模板。源文件里的顶栏与构建结果保持逐字节一致：改完注册表后运行 `npm run sync:nav` 同步源文件，再 `npm run build`（测试 `navigation-build` 会检查两者一致）。

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

### 6.3 病历正文源数据（2026-10-30 起）
- 病历正文的唯一来源是 `content/clinical-library/source/<科室>/<病种>.json`。构建、身份账本核对、质量门禁和修订预览都读这些文件（`scripts/clinical-source.mjs`）。
- 修改正文：直接编辑对应病种 JSON 里那一条记录的字段（通常是 `sourceBody`），**不增删字段、不改字段顺序、不移动记录**；然后按第 6.2 节流程预览、由负责人授权、追加修订批次。未经授权的正文改动会让构建失败（「propose and authorize a content revision」）。
- **新增病种**：只能用 `npm run clinical:new` 建立模板（按现有完整病例的章节结构），再填写正文、走第 6.2 节授权，详见 `docs/new-disease-workflow.md`。不要手写新病种的 JSON 结构或手改 `index.json`。构建拒绝发布仍含 `【待填写】` 的记录。
- `index.json` 的 `sequence` 决定全部记录的顺序，不要手改；`legacy-rendered.json` 只为旧账本核对保留，不是显示内容，不要编辑。
- 旧生成链（`index.html` 里的病历脚本和根目录 `record-*.js` 等）**已退役并冻结**：不要再新增修订脚本，也不要修改这些文件，测试会检查其哈希。`search-core.js`、`app.js`、`departments.js` 虽曾在链中执行，但仍是在用的页面代码（Claude 负责），不在冻结范围。`scripts/clinical-source-export.mjs` 只用于当初的一次性迁移，源数据存在时拒绝运行。
- 不要在 `index.html` 里加入与病历无关的 `<script>`。

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

- 工具页顶栏仍使用独立的 `tools` 结构与样式（tools-page.css）；如要与官方顶栏完全合并，需要同时调整样式并做视觉核对。
