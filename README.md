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

- `npm run build`：从 `index.html` 的首页区块生成轻量的 `home.html`，并生成 `dist/` 发布目录。发布目录的 `index.html` 是轻量首页，`library.html` 保留完整病历，避免静态首页覆盖路由规则。Vercel 部署时自动运行。
- `npm test`：验证安全边界、病历生成链、首页构建与搜索过滤。
- `npx playwright install chromium` 后执行 `npm run test:browser`：验证手机和电脑卡片边框、中文搜索、分页、弹窗、键盘操作和打印布局。可通过 `CHROMIUM_EXECUTABLE_PATH` 使用本机 Chromium。GitHub Actions 自动运行这两类检查。
- 病历数据仍通过 `/bl` 加载；首页样式与入口内容继续维护在 `index.html`，不要直接修改生成的 `home.html`。
- 本地预览应服务 `dist/`，根据 `vercel.json` 路由到对应页面；API 仍位于仓库根目录的 `api/`。
- 修改 HTML 后请先运行构建，再检查电脑和手机端的组件边界、搜索、病历预览及临床工具。

## 管理资料保护

- 管理页面的“备份与修改历史”支持下载当前资料、下载历史备份和恢复最近 50 个版本。
- 每次保存或恢复前，服务器先创建私有备份；备份或读取失败时停止修改。
- 保存需要当前资料版本，并通过 Blob 条件写入防止多个页面相互覆盖。出现版本冲突时，请复制保留编辑中的草稿后刷新。
- 修改历史和恢复接口仅向已登录管理员开放，公开浏览不会返回未发布案例。
- 备份包含模板自定义正文和案例资料；图片沿用原有私有存储文件，恢复不会删除图片。
