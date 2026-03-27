---
name: html-slideshow
description: 将Markdown演示大纲转换为HTML静态幻灯片，自动分页、理解布局规划、生成对应HTML结构
metadata: {"openclaw":{"emoji":"🖥️","requires":{"bins":["node"]}}}
---

# HTML Slideshow

将Markdown格式的演示大纲，经过AI内容理解后，自动分页切分，根据每页的布局规划生成对应HTML结构，最终生成可交互的静态HTML幻灯片。

## 优化后的工作流程

### 1️⃣ 内容理解

读取完整大纲/主题文稿，**AI理解内容逻辑**，从材料内容角度查漏补缺，将内容按照**PPTX幻灯片的诉求**重新梳理成完整大纲及内容。

**核心要点**：

- 不是简单复制原文，而是按PPT展示逻辑重构(财报类的模版financial.md）
- 提炼核心观点，每个章节/重点清晰呈现
- 补充必要的背景说明和过渡语句

### 2️⃣ 内容分页

根据新的完整大纲，AI理解内容逻辑，**合理切分成页**，每页单独保存md文件到 `slides-md/` 目录。

**分页原则**：

- 每页一个独立完整的主题
- 逻辑连贯，避免内容割裂
- 适当留白，保持视觉呼吸感

### 3️⃣ 布局解析

读取每页md文件，解析"**页面布局规划**"字段，生成具体HTML布局结构（分栏、网格等）。

**支持的布局**：

- 左右分栏 / 两栏布局
- 2×2网格 / 四格布局
- 上中下纵向分布
- 左侧内容+右侧图表
- 表格展示、图表集成

### 4️⃣ 样式统一

全局CSS统一风格，支持**多主题**（default/nvidia/aliyun/dark），保持配色一致。

### 5️⃣ 交互完整

键盘翻页、全屏演示，支持**任何现代浏览器**。

---

## 特性

- **严格16:9比例**：每页固定16:9，不滚动，完美适配演示屏
- **智能分页**：AI理解内容逻辑，自动切分成逻辑完整的页面
- **布局识别**：根据"页面布局规划"文字描述，生成对应HTML布局
- **完整键盘交互**：方向键、空格、回车、退格都支持翻页，F键全屏
- **多主题支持**：default(蓝色商务)、nvidia(绿色)、aliyun(橙色)、dark(深色)、tech(科技风格-白色主色调/黑色字体/红色高亮)
- **静态输出**：纯HTML+CSS+JS，所有资源CDN加载，打开即可演示

## 使用方法

### 完整流程（从大纲到幻灯片）：

```bash
# 1. AI分析内容，理解重构+分页生成每页md
node /home/Vincent/.openclaw/workspace/skills/html-slideshow/scripts/split-slides.js \
  --input /path/to/outline.md \
  --output /path/to/output \
  --title "演示标题"

# 2. 根据每页md生成HTML
node /home/Vincent/.openclaw/workspace/skills/html-slideshow/scripts/generate-html.js \
  --input-dir /path/to/output/slides-md \
  --output /path/to/output/html \
  --title "演示标题" \
  --theme tech  # 或 aliyun/nvidia/dark/default
```

## 支持的布局

根据"页面布局规划"文字自动识别：

| 描述                       | 生成布局                             |
| ------------------------ | -------------------------------- |
| "左右分栏" / "两栏布局"          | `grid-template-columns: 1fr 1fr` |
| "2×2网格" / "四四布局"         | 2行2列网格                           |
| "上中下" / "顶部标题+中部内容+底部总结" | flex纵向分布                         |
| "左侧表格右侧图表"               | 左侧表格 + 右侧图表容器                    |

## 交互快捷键

| 按键                           | 功能   |
| ---------------------------- | ---- |
| → / Space / Enter / PageDown | 下一页  |
| ← / Backspace / PageUp       | 上一页  |
| F / f                        | 切换全屏 |
| Esc                          | 退出全屏 |

## 输出结构

```
output/
├── slides-md/              # 每页拆分后的markdown
│   ├── 01-cover.md
│   ├── 02-overview.md
│   └── ...
└── html/                   # 最终HTML输出
    ├── index.html
    └── slides/
        ├── 01-cover.html
        ├── 02-overview.html
        └── ...
```

## 依赖

- Node.js
- Chart.js (CDN)
- Marked (CDN)

## 示例

examples 目录包含完整示例。