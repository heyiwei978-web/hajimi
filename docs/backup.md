# 异地备份（2026-11-18）

站点数据都在 Vercel Blob 里：后台内容及其历史版本、值班医嘱、AI 病历案例、私人图库、登录记录和错误记录。原数据和 Vercel 自带的历史版本都在 Vercel，为防止账号、存储或误操作出问题，每周另存一份到 GitHub。

## 怎么运行

- `.github/workflows/blob-backup.yml` 每周六 19:17 UTC（北京时间周日 03:17）自动运行，也可以在 GitHub → Actions → Offsite data backup → Run workflow 手动运行。
- 流程：用 `scripts/backup-blob.mjs` 完整下载所有数据，限流计数器除外；逐个计算 SHA-256 并写入 `manifest.json`，再校验一遍；打包后用 AES-256 加密（openssl，PBKDF2 迭代 60 万次）；删除未加密的副本；上传加密文件和它的 SHA-256，作为 Actions 构件保留 90 天。
- **只上传加密后的文件**。本仓库是公开的，登录 GitHub 的人都可能下载到构件，没有口令无法解密。

## 首次设置（站点负责人）

1. 在 Vercel 项目 Settings → Environment Variables 中找到 `BLOB_READ_WRITE_TOKEN` 的值。
2. 生成一个至少 20 个字符的随机口令，**离线保存**在密码管理器或纸质记录里。口令丢失后，备份就无法解密。
3. 在 GitHub 仓库 Settings → Secrets and variables → Actions → New repository secret 中添加两项：`BLOB_READ_WRITE_TOKEN`（上面的值）和 `BACKUP_PASSPHRASE`（口令）。
4. 到 Actions 手动运行一次，确认成功，并在运行页面底部看到构件 `hajimi-blob-日期`。

令牌和口令只存在 GitHub Secrets 中，不写进仓库，也不会出现在日志里。

## 下载和解密

```bash
# 从 Actions 运行页面下载构件并解压，得到 hajimi-blob-XXXX.tar.gz.enc 和 .sha256
sha256sum -c hajimi-blob-XXXX.sha256
mkdir backup
openssl enc -d -aes-256-cbc -pbkdf2 -iter 600000 -in hajimi-blob-XXXX.tar.gz.enc | tar -xzf - -C backup   # 会提示输入口令
node scripts/backup-blob.mjs --verify backup
```

`backup/files/` 下的目录结构与 Blob 中的路径一致，JSON 可以直接打开查看。

## 恢复（仅在数据丢失时由负责人手动操作）

```bash
node scripts/restore-blob.mjs backup                                    # 只校验并列出，不写入
BLOB_READ_WRITE_TOKEN=... node scripts/restore-blob.mjs backup --apply --confirm=<manifest 里的 createdAt>
```

恢复会覆盖同名文件，备份之后新增的文件不会被删除。`--confirm` 必须填入该备份的创建时间，防止用错备份。恢复后到 `/admin` 核对内容。AI 助手不得自行运行恢复（AGENTS.md §7）。

## 局限

- 每周一次：两次备份之间的改动，要靠 Vercel Blob 自身和后台的历史版本兜底。
- 每份构件保留 90 天，所以最多能找回约 13 份。需要更长期保存的，请定期下载到本地。

## 限流状态清理（2026-11-21，优化方案 P0-5）

登录失败、AI 生成和前端报错上报的限流计数按网络地址摘要各存一个文件（`security/login-rate/`、`security/note-rate/`、`monitoring/rate/`），窗口最长 15 分钟，但文件本身原先从不删除。现在 `blob-backup.yml` 在备份任务成功后再运行一个 `cleanup-rate-state` 任务（`scripts/cleanup-rate-state.mjs --apply`）：

- 只列出上述三个前缀，并再次核对路径必须是「前缀 + 64 位十六进制 + `.json`」，其他文件一律不删；
- 只删除超过 1 天未更新的文件，单次最多 5000 个；
- 这些文件本来就不进入备份，误删也只是让该地址的计数从零开始；
- 网站接口（`api/_blob-auth.js`）仍然只有读取和写入，不具备列出或删除的能力。

本地可以不加 `--apply` 运行，只统计将删除的数量；但不要在会话中用生产令牌运行（AGENTS.md 第 7 节）。
