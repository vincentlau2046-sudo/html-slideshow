#!/usr/bin/env node

/**
 * Cover-Aware Split Slides Script
 * 正确处理封面页和内容页
 */

const fs = require('fs');
const path = require('path');
const ContentAwareSplitter = require('./content-aware-splitter-fixed');

function splitMarkdownToSlides(content) {
  const splitter = new ContentAwareSplitter();
  return splitter.splitContent(content);
}

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const argMap = {};
  for (let i = 0; i < args.length; i += 2) {
    argMap[args[i]] = args[i + 1];
  }

  const input = argMap['--input'];
  const output = argMap['--output'];
  const title = argMap['--title'] || 'Presentation';

  if (!input || !output) {
    console.error('Usage: node split-slides.js --input <file> --output <dir> [--title "Title"]');
    process.exit(1);
  }

  console.log(`Splitting slides from: ${input}`);
  
  try {
    const content = fs.readFileSync(input, 'utf8');
    const slides = splitMarkdownToSlides(content);
    
    // Create output directory
    if (!fs.existsSync(output)) {
      fs.mkdirSync(output, { recursive: true });
    }
    
    // Create slides-md directory
    const slidesMdDir = path.join(output, 'slides-md');
    if (!fs.existsSync(slidesMdDir)) {
      fs.mkdirSync(slidesMdDir, { recursive: true });
    }

    // Process and save each slide
    slides.forEach((slide, index) => {
      let filename;
      if (slide.title === 'cover') {
        filename = '01-cover.md';
      } else {
        // 清理标题中的特殊字符
        const cleanTitle = slide.title.replace(/[^a-z0-9\u4e00-\u9fa5]/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
        filename = `${String(index + 1).padStart(2, '0')}-${cleanTitle || `slide-${index + 1}`}.md`;
      }
      
      const filePath = path.join(slidesMdDir, filename);
      fs.writeFileSync(filePath, slide.content, 'utf8');
      console.log(`Generated: ${filename} (${slide.layout})`);
    });

    console.log(`\n✅ Done! Slides saved to ${slidesMdDir}`);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

module.exports = { splitMarkdownToSlides };