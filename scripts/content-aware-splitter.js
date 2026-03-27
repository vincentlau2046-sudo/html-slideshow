#!/usr/bin/env node

/**
 * Content-Aware Splitter for html-slideshow - FIXED
 * 正确处理封面页和内容页
 */

class ContentAwareSplitter {
  /**
   * 主分页函数
   */
  splitContent(content) {
    const lines = content.split('\n');
    
    // 检查是否以 # 开头（封面页）
    let coverContent = '';
    let mainContentStart = 0;
    
    if (lines[0] && lines[0].trim().startsWith('# ')) {
      // 找到第一个二级标题或内容段落
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('## ') || (line !== '' && !line.startsWith('#'))) {
          mainContentStart = i;
          break;
        }
      }
      
      // 封面页只包含标题和摘要（如果有）
      const coverLines = lines.slice(0, mainContentStart);
      coverContent = coverLines.join('\n');
    }
    
    const slides = [];
    
    // 添加封面页
    if (coverContent.trim() !== '') {
      slides.push({
        title: 'cover',
        content: coverContent,
        layout: 'cover'
      });
    }
    
    // 处理主内容
    if (mainContentStart < lines.length) {
      const mainContent = lines.slice(mainContentStart).join('\n');
      const contentSlides = this.splitMainContent(mainContent);
      slides.push(...contentSlides);
    }
    
    return slides;
  }

  /**
   * 分割主内容（非封面部分）
   */
  splitMainContent(content) {
    const lines = content.split('\n');
    const slides = [];
    let currentSlide = { title: '', content: [], level: 0 };
    let topLevelHeadingFound = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // 检测标题层级
      if (trimmed.startsWith('#')) {
        const headingLevel = this.getHeadingLevel(trimmed);
        const headingText = trimmed.replace(/^#+\s*/, '');

        // 如果是顶级标题（#），开始新slide
        if (headingLevel === 1) {
          if (currentSlide.content.length > 0) {
            slides.push(this.createSlide(currentSlide));
          }
          currentSlide = { 
            title: headingText, 
            content: [line], 
            level: headingLevel,
            startIndex: i
          };
          topLevelHeadingFound = true;
        } 
        // 如果是二级标题（##），且已经有顶级标题，也考虑分页
        else if (headingLevel === 2 && topLevelHeadingFound) {
          // 检查当前slide内容是否过多
          if (currentSlide.content.length > 15 || this.shouldSplitAtLevel2(currentSlide)) {
            if (currentSlide.content.length > 0) {
              slides.push(this.createSlide(currentSlide));
            }
            currentSlide = { 
              title: headingText, 
              content: [line], 
              level: headingLevel,
              startIndex: i
            };
          } else {
            // 二级标题添加到当前slide
            currentSlide.content.push(line);
          }
        } else {
          // 三级及以下标题添加到当前slide
          currentSlide.content.push(line);
        }
      } else {
        // 非标题行添加到当前slide
        currentSlide.content.push(line);
      }
    }

    // 添加最后一个slide
    if (currentSlide.content.length > 0) {
      slides.push(this.createSlide(currentSlide));
    }

    return slides;
  }

  /**
   * 获取标题层级
   */
  getHeadingLevel(headingLine) {
    return headingLine.match(/^#+/)[0].length;
  }

  /**
   * 判断是否应该在二级标题处分页
   */
  shouldSplitAtLevel2(slide) {
    // 如果当前slide已经很长，或者包含多个重要段落
    const contentLength = slide.content.join('\n').length;
    const paragraphCount = (slide.content.join('\n').match(/\n\n/g) || []).length + 1;
    
    return contentLength > 800 || paragraphCount > 6;
  }

  /**
   * 创建slide对象
   */
  createSlide(slideData) {
    // 清理空行
    const cleanedContent = slideData.content.filter(line => line.trim() !== '');
    
    // 提取标题（如果第一行是标题）
    let title = slideData.title;
    if (cleanedContent.length > 0 && cleanedContent[0].trim().startsWith('#')) {
      title = cleanedContent[0].replace(/^#+\s*/, '').trim();
    }
    
    return {
      title: title,
      content: cleanedContent.join('\n'),
      layout: this.detectLayout(cleanedContent)
    };
  }

  /**
   * 检测布局类型
   */
  detectLayout(contentLines) {
    const content = contentLines.join('\n');
    
    // 检测是否有表格
    if (content.includes('|') && content.includes('---')) {
      return 'table-chart';
    }
    
    // 检测列表数量
    const listItems = (content.match(/^- /g) || []).length;
    if (listItems >= 6) {
      return 'vertical';
    }
    
    // 检测是否适合分栏（有明显的两部分结构）
    const paragraphs = content.split('\n\n').filter(p => p.trim() !== '');
    if (paragraphs.length >= 4 && paragraphs.length <= 8) {
      return 'split-2';
    }
    
    return 'full';
  }
}

module.exports = ContentAwareSplitter;