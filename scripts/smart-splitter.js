#!/usr/bin/env node

/**
 * Smart Splitter for html-slideshow v2.2
 * Intelligent content splitting based on semantic analysis
 */

class SmartSplitter {
  constructor(options = {}) {
    this.contentDensityThreshold = options.contentDensityThreshold || 0.7;
    this.minContentUnitsPerSlide = options.minContentUnitsPerSlide || 3;
    this.maxContentUnitsPerSlide = options.maxContentUnitsPerSlide || 8;
    this.preserveLists = options.preserveLists !== false; // default true
    this.preserveTables = options.preserveTables !== false; // default true
  }

  /**
   * Analyze content structure and density
   */
  analyzeContent(content) {
    const lines = content.split('\n');
    const blocks = this.extractBlocks(lines);
    const analysis = {
      blocks: blocks,
      totalBlocks: blocks.length,
      contentDensity: this.calculateContentDensity(blocks),
      semanticBoundaries: this.findSemanticBoundaries(blocks),
      logicalSections: this.identifyLogicalSections(blocks)
    };
    
    return analysis;
  }

  /**
   * Extract content blocks (paragraphs, lists, tables, etc.)
   */
  extractBlocks(lines) {
    const blocks = [];
    let currentBlock = { type: 'paragraph', content: [], startLine: 0 };
    let inList = false;
    let inTable = false;
    let listIndent = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Skip empty lines at the beginning of content
      if (blocks.length === 0 && trimmed === '') {
        continue;
      }

      // Table detection
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        if (!inTable) {
          // Start new table block
          if (currentBlock.content.length > 0) {
            blocks.push(currentBlock);
            currentBlock = { type: 'table', content: [line], startLine: i };
          } else {
            currentBlock.type = 'table';
            currentBlock.content.push(line);
          }
          inTable = true;
        } else {
          // Continue table block
          currentBlock.content.push(line);
        }
        continue;
      } else if (inTable) {
        // End of table
        inTable = false;
        if (currentBlock.content.length > 0) {
          blocks.push(currentBlock);
          currentBlock = { type: 'paragraph', content: [], startLine: i };
        }
      }

      // List detection
      if (trimmed.startsWith('- ') || trimmed.match(/^\d+\./)) {
        const indent = line.length - trimmed.length;
        if (!inList || indent <= listIndent) {
          // Start new list or continue at same/less indent level
          if (currentBlock.content.length > 0) {
            blocks.push(currentBlock);
            currentBlock = { type: 'list', content: [line], startLine: i };
          } else {
            currentBlock.type = 'list';
            currentBlock.content.push(line);
          }
          inList = true;
          listIndent = indent;
        } else {
          // Continue nested list
          currentBlock.content.push(line);
        }
        continue;
      } else if (inList && trimmed !== '') {
        // Check if this line continues the list (indented)
        const currentIndent = line.length - line.trimLeft().length;
        if (currentIndent > listIndent) {
          currentBlock.content.push(line);
          continue;
        } else {
          // End of list
          inList = false;
          listIndent = 0;
        }
      }

      // Heading detection
      if (trimmed.startsWith('#')) {
        if (currentBlock.content.length > 0) {
          blocks.push(currentBlock);
        }
        currentBlock = { type: 'heading', content: [line], startLine: i };
        continue;
      }

      // Code block detection
      if (trimmed.startsWith('```')) {
        const codeBlock = [line];
        let j = i + 1;
        while (j < lines.length && !lines[j].trim().startsWith('```')) {
          codeBlock.push(lines[j]);
          j++;
        }
        if (j < lines.length) {
          codeBlock.push(lines[j]);
          j++;
        }
        if (currentBlock.content.length > 0) {
          blocks.push(currentBlock);
        }
        blocks.push({ type: 'code', content: codeBlock, startLine: i });
        currentBlock = { type: 'paragraph', content: [], startLine: j };
        i = j - 1;
        continue;
      }

      // Regular paragraph content
      if (trimmed !== '') {
        currentBlock.content.push(line);
      } else if (currentBlock.content.length > 0) {
        // Empty line ends current paragraph
        blocks.push(currentBlock);
        currentBlock = { type: 'paragraph', content: [], startLine: i + 1 };
      }
    }

    // Add final block if it has content
    if (currentBlock.content.length > 0) {
      blocks.push(currentBlock);
    }

    return blocks;
  }

  /**
   * Calculate content density (ratio of meaningful content to total lines)
   */
  calculateContentDensity(blocks) {
    if (blocks.length === 0) return 0;
    
    const meaningfulBlocks = blocks.filter(block => 
      block.type !== 'paragraph' || block.content.some(line => line.trim() !== '')
    );
    
    return meaningfulBlocks.length / blocks.length;
  }

  /**
   * Find semantic boundaries where content can be naturally split
   */
  findSemanticBoundaries(blocks) {
    const boundaries = [];
    
    for (let i = 1; i < blocks.length; i++) {
      const prevBlock = blocks[i - 1];
      const currBlock = blocks[i];
      
      // Good split points:
      // - After conclusion or summary sections
      // - Before new major headings
      // - Between unrelated topics
      
      if (currBlock.type === 'heading' && this.getHeadingLevel(currBlock.content[0]) <= 2) {
        // Major heading - good split point
        boundaries.push(i);
      }
      
      // Look for conclusion keywords in previous block
      const prevText = prevBlock.content.join(' ').toLowerCase();
      if (prevText.includes('总结') || prevText.includes('结论') || prevText.includes('summary') || prevText.includes('conclusion')) {
        boundaries.push(i);
      }
    }
    
    return boundaries;
  }

  /**
   * Get heading level from heading line
   */
  getHeadingLevel(headingLine) {
    return headingLine.match(/^#+/)[0].length;
  }

  /**
   * Identify logical sections in the content
   */
  identifyLogicalSections(blocks) {
    const sections = [];
    let currentSection = { blocks: [], start: 0 };
    
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      
      if (block.type === 'heading' && this.getHeadingLevel(block.content[0]) === 1) {
        // New top-level section
        if (currentSection.blocks.length > 0) {
          sections.push(currentSection);
        }
        currentSection = { blocks: [block], start: i };
      } else {
        currentSection.blocks.push(block);
      }
    }
    
    if (currentSection.blocks.length > 0) {
      sections.push(currentSection);
    }
    
    return sections;
  }

  /**
   * Find optimal split points for slides
   */
  findOptimalSplitPoints(analysis) {
    const { blocks, semanticBoundaries, logicalSections } = analysis;
    const splitPoints = [];
    
    // If content is short enough, don't split
    if (blocks.length <= this.maxContentUnitsPerSlide) {
      return [blocks.length];
    }
    
    // Start with logical sections
    let currentPos = 0;
    
    for (const section of logicalSections) {
      const sectionEnd = currentPos + section.blocks.length;
      
      // If section fits in one slide, add it
      if (section.blocks.length <= this.maxContentUnitsPerSlide) {
        splitPoints.push(sectionEnd);
        currentPos = sectionEnd;
      } else {
        // Section is too long, need to split it further
        const sectionBlocks = section.blocks;
        let sectionPos = 0;
        
        while (sectionPos < sectionBlocks.length) {
          let nextSplit = Math.min(
            sectionPos + this.maxContentUnitsPerSlide,
            sectionBlocks.length
          );
          
          // Try to find a better split point near the ideal position
          const idealSplit = sectionPos + this.minContentUnitsPerSlide;
          let bestSplit = nextSplit;
          
          // Look for semantic boundaries near the ideal split
          for (const boundary of semanticBoundaries) {
            const boundaryIndex = blocks.indexOf(sectionBlocks[boundary - currentPos]);
            if (boundaryIndex >= sectionPos && boundaryIndex <= nextSplit) {
              bestSplit = Math.max(boundaryIndex, idealSplit);
              break;
            }
          }
          
          splitPoints.push(currentPos + bestSplit);
          sectionPos = bestSplit;
        }
        
        currentPos = sectionEnd;
      }
    }
    
    return splitPoints;
  }

  /**
   * Split content into slides based on analysis
   */
  splitIntoSlides(content) {
    const analysis = this.analyzeContent(content);
    const splitPoints = this.findOptimalSplitPoints(analysis);
    const blocks = analysis.blocks;
    const slides = [];
    
    let startPos = 0;
    let slideIndex = 1;
    
    for (const splitPoint of splitPoints) {
      const slideBlocks = blocks.slice(startPos, splitPoint);
      const slideContent = slideBlocks.map(block => block.content.join('\n')).join('\n\n');
      
      slides.push({
        index: slideIndex++,
        content: slideContent,
        blockCount: slideBlocks.length
      });
      
      startPos = splitPoint;
    }
    
    return slides;
  }
}

module.exports = SmartSplitter;