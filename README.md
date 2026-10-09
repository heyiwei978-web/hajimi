# hajimi

私有临床工作台网站源码。

## 页面结构

- `/`：总首页
- `/bl`：病历模板科室入口
- `/bl/guke`：骨科
- `/bl/puwai`：普外科
- `/bl/shennei`：肾内科
- `/bl/fuke`：妇科
- `/tools`：临床工具
- `/api/*`：登录、内容、图片与上传接口

## 部署

生产平台：Vercel  
生产域名：`wdyxzl.icu`

此仓库作为 hajimi 网站的唯一源码。后续修改优先提交到 GitHub，再由 Vercel 自动部署。

敏感配置只保存在 Vercel Environment Variables，不提交到仓库。

Git integration status: connected to Vercel for automatic deployment.


## 开发与检查

- `npm run build`：从 `index.html` 的首页区块生成轻量的 `home.html`，避免首页加载病历脚本。Vercel 部署时自动运行。
- `npm test`：验证安全边界、病历生成链、首页构建与搜索过滤。
- `npx playwright install chromium` 后执行 `npm run test:browser`：验证手机和电脑卡片边框、中文搜索、分页、弹窗、键盘操作和打印布局。可通过 `CHROMIUM_EXECUTABLE_PATH` 使用本机 Chromium。GitHub Actions 自动运行这两类检查。
- 病历数据仍通过 `/bl` 加载；首页样式与入口内容继续维护在 `index.html`，不要直接修改生成的 `home.html`。
- 修改 HTML 后请先运行构建，再检查电脑和手机端的组件边界、搜索、病历预览及临床工具。
