# HTML Slideshow

将Markdown演示大纲转换为HTML静态幻灯片，自动分页，根据布局描述生成对应HTML结构。

## 版本历史

| 版本 | 日期 | 更新内容 | 作者 |
|------|------|----------|------|
| 0.2.0 | 2026-03-26 | 重构为两步流程：先AI理解分页，再生成独立md，最后生成HTML，支持布局描述识别 | 零壹 |
| 0.1.0 | 2026-03-26 | 初始版本 | 零壹 |

## 变更日志

### v0.2.0 (2026-03-26)
- 🎯 重构为两步流程：
  1. `split-slides.js`：读取完整大纲，按一级标题分页，每页保存独立md文件
  2. `generate-html.js`：读取每页md，解析布局描述，生成对应HTML
- 🔍 自动识别布局：支持左右分栏、2×2网格、表格+图表等
- 🎨 四种主题：default(蓝色)、nvidia(绿色)、aliyun(橙色)、dark(深色)
- ⌨️ 完整键盘交互，修复全屏翻页问题
- 📝 保留每页原始md便于后续编辑

## 使用流程

```bash
# 第一步：分页拆分
node skills/html-slideshow/scripts/split-slides.js \
  --input /path/to/full-outline.md \
  --output /path/to/project \
  --title "演示标题"

# 第二步：生成HTML
node skills/html-slideshow/scripts/generate-html.js \
  --input-dir /path/to/project/slides-md \
  --output /path/to/project \
  --title "演示标题" \
  --theme aliyun
```

打开 `project/html/index.html` 即可开始演示。

## 布局识别

在每页markdown末尾添加：

```
### 页面布局规划
- 顶部：大标题
- 左半部：表格数据，右半部：饼图
- 底部：三点总结
```

脚本能自动识别描述中的关键词：
- `左右分栏` / `两栏` → 两栏布局
- `2×2网格` / `四四布局` → 2×2网格
- `左侧表格右侧图表` → 表格+图表布局
- `三栏` → 三栏布局

## License

MIT
