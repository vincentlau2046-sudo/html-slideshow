#!/usr/bin/env node

/**
 * HTML Slideshow v2.3 - FIXED split slides script
 * Read full markdown outline, split into individual slide markdown files
 * Using intelligent content analysis WITHOUT polluting content with layout directives
 */

const fs = require('fs');
const path = require('path');
const SmartSplitter = require('./smart-splitter');
const LayoutAnalyzer = require('./layout-analyzer');

/**
 * Split markdown into slides using smart content analysis
 * Returns slides with layout metadata but WITHOUT layout directives in content
 */
function splitMarkdownToSlides(content) {
  const splitter = new SmartSplitter({
    minContentUnitsPerSlide: 3,
    maxContentUnitsPerSlide: 8,
    preserveLists: true,
    preserveTables: true
  });
  
  const slides = splitter.splitIntoSlides(content);
  
  // Analyze layout for each slide but DO NOT add layout directives to content
  const analyzer = new LayoutAnalyzer();
  return slides.map(slide => {
    const layout = analyzer.analyzeLayout(slide.content);
    return {
      title: `Slide ${slide.index}`,
      content: slide.content,  // Keep content clean!
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

    // Process and save each slide (clean content only)
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