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
