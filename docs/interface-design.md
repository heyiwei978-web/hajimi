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
