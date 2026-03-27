/**
 * 正确的布局解析器 - 移除布局规划部分，只保留纯内容
 */

class LayoutParser {
  /**
   * 解析Markdown内容，提取布局信息并移除布局规划部分
   */
  parse(content) {
    let cleanContent = content;
    let layout = 'full';
    
    // 方法1: 移除 "### 页面布局规划" 及其后续内容直到下一个标题
    const layoutSectionRegex = /(?:^|\n)#{1,3}\s*页面布局规划\s*\n[\s\S]*?(?=\n#{1,3}|\n$)/g;
    const layoutSectionMatch = content.match(layoutSectionRegex);
    
    if (layoutSectionMatch) {
      // 提取布局描述
      const layoutText = layoutSectionMatch[0].replace(/.*页面布局规划\s*\n/, '').trim();
      layout = this.detectLayoutFromText(layoutText);
      
      // 从内容中完全移除布局规划部分
      cleanContent = content.replace(layoutSectionRegex, '');
    }
    
    // 方法2: 移除行内 layout: 声明
    const inlineLayoutRegex = /\n?[ \t]*layout:\s*\S+[ \t]*\n?/gi;
    cleanContent = cleanContent.replace(inlineLayoutRegex, '\n');
    
    // 清理多余的空行
    cleanContent = cleanContent.replace(/\n{3,}/g, '\n\n').trim();
    
    return {
      layout: layout,
      cleanContent: cleanContent
    };
  }
  
  /**
   * 从布局文本中检测布局类型
   */
  detectLayoutFromText(layoutText) {
    const text = layoutText.toLowerCase();
    
    if (text.includes('左右分栏') || text.includes('两栏')) {
      return 'split-2';
    } else if (text.includes('2x2') || text.includes('四格')) {
      return 'grid-2x2';
    } else if (text.includes('上中下') || text.includes('纵向')) {
      return 'vertical';
    } else if (text.includes('表格') && text.includes('图表')) {
      return 'table-chart';
    } else {
      return 'full';
    }
  }
  
  /**
   * 验证内容是否纯净（不含布局指令）
   */
  validateCleanContent(content) {
    const forbiddenPatterns = [
      /页面布局规划/,
      /layout:/,
      /split-2/,
      /grid-2x2/,
      /table-chart/,
      /vertical/
    ];
    
    for (const pattern of forbiddenPatterns) {
      if (pattern.test(content)) {
        console.warn(`⚠️ Clean content still contains layout directive: ${pattern}`);
        return false;
      }
    }
    return true;
  }
}

module.exports = LayoutParser;