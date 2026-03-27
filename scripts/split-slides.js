#!/usr/bin/env node

/**
 * HTML Slideshow v2.2 - Split slides script with smart splitting
 * Read full markdown outline, split into individual slide markdown files
 * Using intelligent content analysis and layout detection
 */

const fs = require('fs');
const path = require('path');
const SmartSplitter = require('./smart-splitter');
const LayoutAnalyzer = require('./layout-analyzer');

/**
 * Split markdown into slides using smart content analysis
 */
function splitMarkdownToSlides(content) {
  const splitter = new SmartSplitter({
    minContentUnitsPerSlide: 3,
    maxContentUnitsPerSlide: 8,
    preserveLists: true,
    preserveTables: true
  });
  
  const slides = splitter.splitIntoSlides(content);
  
  // Add layout planning to each slide
  const analyzer = new LayoutAnalyzer();
  return slides.map(slide => {
    const layout = analyzer.analyzeLayout(slide.content);
    let finalContent = slide.content;
    
    // Add layout planning if not already present
    if (!finalContent.includes('页面布局规划') && !finalContent.includes('layout:')) {
      finalContent += `\n\n### 页面布局规划\n${analyzer.getLayoutDescription(layout).split(' - ')[0]}`;
    }
    
    return {
      title: `Slide ${slide.index}`,
      content: finalContent,
      layout: layout
    };
  });
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
      const filename = `${String(index + 1).padStart(2, '0')}-${slide.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.md`;
      const filePath = path.join(slidesMdDir, filename);
      
      // Prepend title as H1 if not already present
      let finalContent = slide.content;
      if (!finalContent.trim().startsWith('# ')) {
        finalContent = `# ${slide.title}\n\n${finalContent}`;
      }
      
      fs.writeFileSync(filePath, finalContent, 'utf8');
      console.log(`Generated: ${filename} (${slide.layout})`);
    });

    console.log(`\n✅ Done! Slides saved to ${slidesMdDir}`);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

module.exports = { splitMarkdownToSlides };