# 2026-11-01 删除全部已下线病历

负责人要求（2026-11-01 09:17）：「把那些不显示的病历都去掉，以后重新添加」，并选择「从网站文件里彻底删掉」。

## 做了什么

- 删除 192 个已下线病例（5,073 份文书）的正文源数据：`content/clinical-library/source/` 只保留网站上显示的 12 个病种文件（308 份文书）。
  - 2026-10-24 下线的 12 个腰椎相关病例；
  - 2026-10-27 骨科瘦身下线的 180 个病例。
- `publication.json` 中这 192 条下线记录各加 `removedFromSource`（原因、授权人、授权依据）。下线记录本身保留，网站仍会对旧链接显示「该病种已移出病历库」。
- `index.json` 的 `sequence`、`origins`、`files`、`groups`、`traumaGroups`、`seeds` 和 `legacy-rendered.json` 的序号同步重排，只去掉被删记录。

## 没有改动

- 网站上显示的内容：删除前后 `npm run build` 生成的 `dist/` 全部文件逐字节相同。
- 身份账本 `baseline.json`、`records.jsonl` 逐字节不变；`revisions.json` 不变。被删病例的永久编号（`clinical-v1-rNNNNNN`）和记录名称继续保留、**永不复用**。
- 已退役的旧生成链脚本（根目录 `record-*.js` 等和 `index.html` 中的旧脚本）仍冻结保留，它们不是正文来源，也不发布。

## 规则（构建自动把关）

- 只有带 `removedFromSource` 授权的下线病例可以不在源数据里；其余任何记录缺失都会让构建失败。
- 被删病例要么整套不在，要么整套都在（旧版本源数据），只留一部分会失败。
- 质量门禁的防缩水基线改为当前保留量：总计 308 份、骨科 281 份。

## 以后重新添加

按 `docs/new-disease-workflow.md` 用 `npm run clinical:new` 新建。以前删过的病种会单独建档（记录名称带「（完整病例）」、使用新的永久编号），然后照常走医学审核授权。

旧正文需要参考时，可从删除前的提交 `9beaeec7dda169003f12c858153e98bc60f9fa2e` 中找回：
`git show 9beaeec:content/clinical-library/source/guke/<病种>.json`。
