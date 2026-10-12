# 工作站界面设计

本次调整只涉及导航、入口、布局和显示样式。病历正文、模板分类、路径资料、公式及计算逻辑继续使用原有内容。

## 官方参考资料

研究采用 GOV.UK 和英国 NHS 官方设计系统的公开源码。当前环境无法直接访问部分参考官网，因此没有以无法核实的页面截图作为依据。

- [GOV.UK：布局](https://github.com/alphagov/govuk-design-system/blob/main/src/styles/layout/index.md)：从小屏幕单列布局开始；限制阅读行长；用布局区分主要内容与辅助内容。
- [GOV.UK：字号层级](https://github.com/alphagov/govuk-design-system/blob/main/src/styles/type-scale/index.md)：字号、行高和间距保持一致的节奏，方便扫读。
- [NHS：排版](https://github.com/nhsuk/nhsuk-service-manual/blob/main/app/views/design-system/styles/typography/index.njk)：一致的标题层级、表单标签和段落样式帮助用户辨认内容结构。
- [NHS：布局](https://github.com/nhsuk/nhsuk-service-manual/blob/main/app/views/design-system/styles/layout/index.njk)：根据屏幕宽度调整列数，并让长文保持合适的阅读宽度。

## 在本站的应用

- 首页直接提供病历搜索和四个科室入口，用可操作的导航替代占据主要空间的装饰图。
- 各模块统一导航、蓝白配色、卡片、按钮、标题和间距；手机导航在自己的区域横向滚动。
- 病历库收紧重复介绍区域；使用说明保留为可展开的原文；科室选择先于收藏和最近访问展示。
- 病历目录、正文和预览默认 18px，可统一调为 20px 或 22px。阅读页面继续支持底部切换、目录定位和打印。
- 工具、路径、值班和管理页面使用相同的页面宽度与标题层级，保留各自的计算、草稿和编辑功能。
- 使用本机中文字体，不引入外部字体、图片库或界面框架；首页继续独立于完整病历数据加载。

## 维护方式

`workspace-design.css` 是各页面最后加载的公共界面样式，管理设计变量、模块视觉和屏幕布局。打印样式由已有模块继续管理。临床正文生成脚本和接口无需跟随视觉调整而修改。

## 病历选择与阅读 MVP

基于现有 HTML/CSS/JS 和 Vercel 部署继续改造，保留现有病历数据、搜索规则及管理接口。
参考 [Tabler](https://github.com/tabler/tabler) 的卡片、列表与小尺寸操作组件布局；仅内联使用
[Tabler Icons](https://github.com/tabler/tabler-icons) 的 `file-text`、`typography` 和 `chevron-right`。
图标的 MIT 版权与许可声明保存在 `library-ui.js` 和 `THIRD_PARTY_NOTICES.md`。

搜索卡片列出实际匹配文书，以转义后的文字标记关键词，不索引患者信息或提前读取正文。
阅读字号为 18、20、22 像素，目录和预览同步；字体偏好与临床内容分开保存，存储失败时仍可在当前页面调整。
手机保持单列卡片与可换行的操作区，当前目录项增加文字标记；屏幕字号调整不影响打印和复制。

## 心电图栏目框架 v2（2026-10-12）

心电图栏目的资料由多批文件叠加生成（基础数据、教材各批扩充、示意图、计算器和界面）。v2 保留原有写作方式，只调整加载和运行框架：

- **构建期编译**：`scripts/ecg-compiler.mjs` 在 `npm run build` 中执行所有资料文件，校验合并结果，并在 `dist/assets/` 输出一个带内容哈希的脚本。校验内容包括：词条 id 唯一、分类存在、示意图存在、相关词条和围手术期链接有效、参考文献使用 https、日期格式正确。任何一项不合格，构建即失败。`/assets/*` 设置一年 `immutable` 缓存；内容变化时文件名随之改变。
- **栏目内路由**：`/ecg` 下的链接由 `history.pushState` 在页面内切换，资料只下载和解析一次。每次切换先重置页眉、页脚和监听器，再把焦点移到新页面标题。返回时恢复原滚动位置。新标签页、下载链接和站外链接仍由浏览器处理。
- **全栏目搜索**（`ecg-search.js`）：参考 [MiniSearch](https://github.com/lucaong/minisearch) 和 [Fuse.js](https://github.com/krisk/Fuse) 的字段加权思路，按以下顺序排序：标题完全匹配、别名完全匹配、标题前缀、包含匹配、正文匹配。多个关键词须全部命中。英文短缩写（AF、PE）按整词匹配。代码为自写，不引入依赖，符合 `script-src 'self'`。高亮先转义再加 `<mark>`。搜索框按 [WAI-ARIA APG 组合框（列表自动完成）](https://w3c.github.io/wai-website/ARIA/apg/patterns/combobox/examples/combobox-autocomplete-list/)实现，支持 `/` 键、↑↓、回车和 Esc。
- **电子卡尺**（`ecg-calipers.js`）：思路来自 [EP Calipers](https://github.com/mannd/epcalipers)（Apache-2.0）：两条测量线，读取间期和对应心率。本站代码独立实现，未复制其源码。读数按示意图网格换算（1 小格 = 40 ms），只用于练习测量方法。
- **词条阅读**：同类词条之间有上一条 / 下一条导航，可打印本词条。打印样式会隐藏导航、按钮和固定页脚，自动展开围手术期层，并在外链后附上网址。

源码模式（未执行构建）下，`ecg.html` 仍逐个加载源文件，便于调试。`ecg.html` 中的脚本顺序须与 `ECG_SOURCES` 保持一致，否则构建会报错。
