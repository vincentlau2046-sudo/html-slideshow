#!/usr/bin/env node

/**
 * Layout Analyzer for html-slideshow v2.2
 * Advanced layout detection and recommendation
 */

class LayoutAnalyzer {
  constructor() {
    this.layoutPatterns = {
      'split-2': [
        /左右分栏/i,
        /两栏布局/i,
        /split[-\s]?2/i,
        /two[-\s]?column/i
      ],
      'grid-2x2': [
        /2x2网格/i,
        /四格布局/i,
        /grid[-\s]?2x2/i,
        /four[-\s]?grid/i
      ],
      'vertical': [
        /上中下/i,
        /纵向分布/i,
        /vertical/i,
        /top[-\s]?middle[-\s]?bottom/i
      ],
      'table-chart': [
        /表格.*图表/i,
        /左侧.*右侧.*图表/i,
        /table[-\s]?chart/i
      ],
      'full': [
        /全屏/i,
        /完整内容/i,
        /full/i
      ]
    };
    
    this.contentBasedRules = [
      { pattern: /对比|comparison/i, layout: 'split-2' },
      { pattern: /步骤|流程|steps|process/i, layout: 'vertical' },
      { pattern: /数据|data|statistics/i, layout: 'table-chart' },
      { pattern: /要点|key points|summary/i, layout: 'grid-2x2' }
    ];
  }

  /**
   * Analyze content and detect layout intent
   */
  analyzeLayout(content) {
    // First, check for explicit layout declarations
    const explicitLayout = this.detectExplicitLayout(content);
    if (explicitLayout) {
      return explicitLayout;
    }
    
    // Second, analyze content structure
    const structuralLayout = this.analyzeContentStructure(content);
    if (structuralLayout) {
      return structuralLayout;
    }
    
    // Third, use content-based heuristics
    const heuristicLayout = this.applyContentHeuristics(content);
    if (heuristicLayout) {
      return heuristicLayout;
    }
    
    // Default to full layout
    return 'full';
  }

  /**
   * Detect explicit layout declarations
   */
  detectExplicitLayout(content) {
    // Check for "页面布局规划" section
    const layoutSectionMatch = content.match(/###?\s*页面布局规划\s*\n([\s\S]*?)(\n##|\n$)/i);
    if (layoutSectionMatch) {
      const layoutText = layoutSectionMatch[1];
      for (const [layout, patterns] of Object.entries(this.layoutPatterns)) {
        if (patterns.some(pattern => pattern.test(layoutText))) {
          return layout;
        }
      }
    }
    
    // Check for inline layout declarations
    for (const [layout, patterns] of Object.entries(this.layoutPatterns)) {
      if (patterns.some(pattern => pattern.test(content))) {
        return layout;
      }
    }
    
    // Check for layout: syntax
    const layoutDirective = content.match(/layout:\s*(\S+)/i);
    if (layoutDirective) {
      const layoutValue = layoutDirective[1].toLowerCase();
      if (this.layoutPatterns[layoutValue]) {
        return layoutValue;
      }
    }
    
    return null;
  }

  /**
   * Analyze content structure to infer layout
   */
  analyzeContentStructure(content) {
    const lines = content.split('\n');
    const headings = lines.filter(line => line.trim().startsWith('#'));
    const lists = lines.filter(line => line.trim().match(/^(\d+\.|-)\s/));
    const tables = lines.filter(line => line.trim().startsWith('|') && line.trim().endsWith('|'));
    
    // If there are multiple major sections, suggest grid layout
    const majorHeadings = headings.filter(h => h.startsWith('# ') || h.startsWith('## '));
    if (majorHeadings.length >= 4) {
      return 'grid-2x2';
    }
    
    // If there's a clear two-part structure, suggest split layout
    if (majorHeadings.length === 2) {
      return 'split-2';
    }
    
    // If there are many list items, suggest vertical layout
    if (lists.length >= 6) {
      return 'vertical';
    }
    
    // If there are tables and data, suggest table-chart layout
    if (tables.length > 0) {
      return 'table-chart';
    }
    
    return null;
  }

  /**
   * Apply content-based heuristics
   */
  applyContentHeuristics(content) {
    const lowerContent = content.toLowerCase();
    
    for (const rule of this.contentBasedRules) {
      if (rule.pattern.test(lowerContent)) {
        return rule.layout;
      }
    }
    
    return null;
  }

  /**
   * Get layout description for user feedback
   */
  getLayoutDescription(layout) {
    const descriptions = {
      'split-2': '左右分栏布局 - 适合对比分析或并行内容',
      'grid-2x2': '2×2网格布局 - 适合展示多个要点或分类信息',
      'vertical': '纵向分布布局 - 适合流程、步骤或层次化内容',
      'table-chart': '表格+图表布局 - 适合数据展示和分析',
      'full': '全屏内容布局 - 适合单一主题或简单内容'
    };
    
    return descriptions[layout] || '默认布局';
  }
}

module.exports = LayoutAnalyzer;