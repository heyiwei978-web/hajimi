# 网站防护

防护范围：保持首页、病历模板、临床工具和公开内容可浏览，重点保护管理接口。

## 随代码部署的防护

- 登录、退出、内容写入和上传只允许指定 HTTP 方法；写入要求管理请求标识，并拒绝跨站 Origin / Fetch Metadata。
- 登录 JSON 上限 4 KiB、内容 JSON 上限 1,500,000 字节、上传请求上限 4,400,000 字节（包含 base64 开销）。图片只接受 JPG、PNG、WebP，并检查文件签名。
- 未配置 `HAJIMI_SESSION_SECRET` 时拒绝验证或签发会话；过期、篡改、格式错误的会话无效。审计 API 也要求管理员身份，避免匿名请求触发大批模板执行。
- `Content-Security-Policy` 只允许本站脚本及连接；保留页面需要的内联样式和本地图片预览。禁止 iframe 嵌入、对象插件及跨站表单提交。

- 案例图片 `/api/image` 只向访客提供已发布案例引用的图片；草稿、已删除案例及未关联的上传图片仅管理员可见。图片只允许浏览器私有缓存，取消发布后最长 10 分钟内失效，不进入共享 CDN 缓存。

生产登录使用 Vercel 项目的 `HAJIMI_ADMIN_USER`、`HAJIMI_SESSION_SECRET`，以及管理员密码哈希：

- 推荐：`HAJIMI_ADMIN_PASSWORD_HASH`，加盐 scrypt 哈希。在本地运行 `node scripts/hash-password.mjs` 生成（密码至少 12 个字符），填入 Vercel 后重新部署，再删除旧的 `HAJIMI_ADMIN_PASSWORD_SHA256`。
- 兼容：未设置上述变量时，仍使用 `HAJIMI_ADMIN_PASSWORD_SHA256`（无盐 SHA-256，泄露后易被离线破解，建议尽快替换）。

会话密钥应使用至少 32 字节的随机值。会话有效期 7 天，“退出”只清除当前浏览器的 Cookie；如怀疑会话被盗用，更换 `HAJIMI_SESSION_SECRET` 并重新部署，即可让所有已签发会话立即失效。敏感值只在 Vercel Environment Variables 中安全填写，不提交到 GitHub。

## Vercel 边缘防火墙：需要单独启用

`security/vercel-firewall-rules.json` 是待应用的规则定义。**提交此文件不会启用 Vercel WAF 或限流。** 分布式限流必须由 Vercel 防火墙执行，应用没有使用不可靠的单实例计数器。

在绑定 `wdyxzl.icu` 的 Vercel 项目打开 **Firewall**，保留现有规则，新建下表规则。每个条件组内为 AND，不同条件组为 OR。仅对相应接口计数，不限制正常页面浏览。

| 规则名 | 条件 | 每个 IP 的上限 | 超限动作 |
| --- | --- | --- | --- |
| hajimi-login-limit | Path = `/api/login` 且 Method = POST | 10 次 / 60 秒 | Deny |
| hajimi-upload-limit | Path = `/api/upload` 且 Method = POST | 30 次 / 60 秒 | Deny |
| hajimi-admin-write-limit | `/api/content` + PUT，或 `/api/logout` + POST | 两类请求合计 60 次 / 60 秒 | Deny |
| hajimi-audit-limit | `/api/ortho-audit-runtime` + GET | 3 次 / 60 秒 | Deny |
| hajimi-block-scanner-paths | Path 匹配 JSON 中的正则：WordPress、phpMyAdmin、Git 和环境文件探测 | 直接拦截 | Deny |

使用固定时间窗口、按 IP 分组。保存并发布规则后，在项目 Firewall 事件列表确认规则已经生效。自定义限流的可用性和额度取决于项目套餐；未应用规则前，不应声称这些速率限制已开启。

如启用 Vercel 托管 OWASP 规则，先观察 Log 事件并检查正常病历文本、中文内容和图片上传是否误报，再针对已确认的攻击规则启用 Deny。不要直接对全站开启浏览器挑战，以免影响管理接口和正常使用。不要覆盖已有防火墙或添加全站 Bypass。

自动管理平台规则需要具有该项目防火墙权限的 Vercel API 凭据。当前环境没有此凭据。可以在云环境设置中安全添加 `VERCEL_FIREWALL_TOKEN`（仅用于 `api.vercel.com`），不在聊天中发送令牌；接入后先读取项目及现有 active/draft 配置，再增量应用这些规则并核验，避免发布其他尚未审核的草稿变更。配置模板依据官方 `@vercel/sdk` 1.28.41 的规则模型准备；API 服务端及套餐校验尚未执行。

## 验证

在仓库根目录执行 `node --test test/*.test.js`。测试覆盖正常登录、Cookie 属性、会话伪造、跨站写入、异常 JSON、体积限制、图片伪装、路径越界及管理员审计。

上线后检查页面、安全响应头和上述拒绝行为。登录或上传的边缘限流验证应在预览/测试环境使用测试账号完成，避免锁住生产管理员。HTTP 401 表示身份保护，HTTP 403 表示来源或管理标识拦截，HTTP 413 表示请求过大；这些应用层响应不能替代 WAF 限流事件的验证。
