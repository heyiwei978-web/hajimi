# 新增病种病历：固定流程

适用：在病历模板中新增一个病种的**完整病例**（入院 → 术前 → 手术 → 术后 → 出院）。修改已有病种正文见 AGENTS.md 第 6.3 节。

负责方：ChatGPT / Codex（内容）。所有改动先开 PR，由负责人医学审核、明确说「合并」后才上线。

## 1. 建立模板（工具自动完成，不要手写 JSON 结构）

```bash
npm run clinical:new -- --department=骨科 --group=病种名称 --category=创伤骨科 [--like=参照病种]
```

- `--department`：骨科、普外科、肾内科、妇科。
- `--category`（骨科必填）：关节置换、创伤骨科、运动医学、儿童骨科、手外科、脊柱外科、足踝外科、骨肿瘤与骨病、骨感染、骨病与保髋。决定病种出现在骨科页的哪个分区。
- `--like`：章节结构的参照病种，默认「锁骨骨折」（26 章，创伤手术病例）。关节置换建议用 `TKA` 或 `THA`；需要出院医嘱单的创伤病例可用「股骨转子间骨折」。

工具会：

- 在 `content/clinical-library/source/<科室>/<病种>.json` 建立与参照病种**相同章节**（名称、阶段、类型、顺序）的记录；
- 每章正文是统一格式的骨架，待写处为 `【待填写】`；
- 在 `index.json` 登记文件、顺序、骨科分区；
- 如果这个病种以前有已下架的旧病例，新病例单独建档（记录名称带「（完整病例）」），旧病例保持下架、不受影响。

## 2. 填写正文

- 只把每章 `sourceBody` 中的 `【待填写】` 替换成正文；**不要增删记录、不改字段名和字段顺序、不改 `recordOrder`**。
- 保持开头的虚构声明、`记录名称`、`患者`、`科别`、`记录时间：YYYY-MM-DD HH:MM` 等行的格式，与参照病种同名章节的写法一致。
- 同一病例前后的患者身份、日期、检查数值、手术方式要一致；术后第 N 天病程按天连续。
- 不确定处写【待核实】（允许上线，提醒使用者核对）；**`【待填写】` 一处都不能留**——构建会拒绝发布仍含 `【待填写】` 的记录。
- 遵守 AGENTS.md 第 6.4 节写作与安全原则。

## 3. 生成审核预览、交负责人授权

```bash
npm run audit:clinical -- --propose-update --output=/tmp/clinical-review.json
```

把预览中的 `proposalHash` 与新增章节清单交给负责人。负责人审核后明确授权，再运行：

```bash
npm run audit:clinical -- --apply-update=/tmp/clinical-review.json \
  --authorize='<负责人确认的 proposalHash>' --reviewed-by='<负责人>' \
  --reason='新增病种：<病种名称>' --review-reference='<审核记录编号>'
```

AI 不能替负责人授权。未经授权，新记录无法通过构建。

## 4. 检查并开 PR

```bash
npm run build && npm test && npm run audit:quality:check && npm run test:browser
```

PR 描述写明：负责方 Codex、改动类型「内容」、需要医学审核、新增病种名称与章节数。合并（上线）由负责人决定。

## 自动把关

| 情况 | 结果 |
| --- | --- |
| 仍有 `【待填写】` | 构建失败，不能上线 |
| 未经授权的新增或修改 | 构建失败（propose and authorize a content revision） |
| 删改了已有记录、改了名称/顺序 | 预览阶段拒绝 |
| 病种名称、科室、分区写错 | 建立模板时拒绝，不写入任何文件 |
