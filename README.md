# HTML Slideshow

将Markdown格式的演示大纲，经过AI内容理解后，自动分页切分，根据每页的布局规划生成对应HTML结构，最终生成可交互的静态HTML幻灯片。

## 特性

- **严格16:9比例**：每页固定16:9，不滚动，完美适配演示屏
- **智能分页**：AI理解内容逻辑，自动切分成逻辑完整的页面
- **布局识别**：根据"页面布局规划"文字描述，生成对应HTML布局
- **完整键盘交互**：方向键、空格、回车、退格都支持翻页，F键全屏
- **多主题支持**：default(蓝色商务)、nvidia(绿色)、aliyun(橙色)、dark(深色)
- **静态输出**：纯HTML+CSS+JS，所有资源CDN加载，打开即可演示

## 使用方法

### 完整流程（从大纲到幻灯片）：

```bash
# 1. AI分析内容，理解重构+分页生成每页md
node scripts/split-slides.js \
  --input /path/to/outline.md \
  --output /path/to/output \
  --title "演示标题"

# 2. 根据每页md生成HTML
node scripts/generate-html.js \
  --input-dir /path/to/output/slides-md \
  --output /path/to/output \
  --title "演示标题" \
  --theme aliyun
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