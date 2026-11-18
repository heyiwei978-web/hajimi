# 删除旧病历生成链（2026-11-18）

负责人在会话中确认：删除已退役的旧病历生成链，历史核对改为读取 Git。

## 删除内容

- 根目录 48 个旧生成链脚本：`ideal-cases.js`、`ideal-other-cases.js`、`orthopedic-expansion-a~g.js`、`ortho-protocols-*.js`、`record-quality-v3~v24.js`、`record-clinical-style-v25/v26.js`、`record-course-v27.js`、`record-tka-refinement-v28.js`、`record-operative-reality-v29.js`、`record-intertrochanteric-v28.js`、`record-tka-complete-v31.js`、`record-tha-complete-v32.js`、`record-clavicle-complete-v33.js`、`tka-special-cases.js`。
- `index.html` 中这 48 个脚本的 `<script>` 标签。
- 一次性迁移脚本 `scripts/clinical-source-export.mjs` 及其测试，它依赖旧生成链。

## 保留内容

- `app.js`、`search-core.js`、`departments.js`：仍是在用代码，路径写在身份账本里。
- `record-quality-v2.js`：医学源资料。负责人选择保留。
- `baseline.json`、`records.jsonl`、`revisions.json`、`source/index.json`（含 `retiredChain` 历史记录）、`legacy-rendered.json`：逐字节不变。

## 验证

- 删除前后分别构建，`dist/` 逐字节一致，即发布的网站完全不变。
- 核对锁骨、THA、TKA、转子间、手术记录、出院记录等历次修订的测试，改为通过 `test/legacy-chain.mjs` 从删除前的提交 `540efe1` 读取旧脚本，核对内容不变；CI 是浅克隆，会按需拉取这个提交。
- `audit:quality:check`、`audit:clinical`、`audit:operative`、`audit:conditional` 正常完成。
- 新增测试：已删除的旧脚本不得恢复。

## 找回

`git show 540efe1:<文件名>`。
