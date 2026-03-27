#!/usr/bin/env node

/**
 * HTML Slideshow v2.3 - Final fix for cover page
 * Direct template replacement without nested divs
 */

const fs = require('fs');
const path = require('path');
const MarkdownValidator = require('./markdown-validator');
const LayoutParser = require('./layout-parser');

// Theme configurations
const THEMES = {
  default: {
    primaryColor: '#2563eb',
    primaryColorRGB: '37, 99, 235'
  },
  nvidia: {
    primaryColor: '#76b900',
    primaryColorRGB: '118, 185, 0'
  },
  aliyun: {
    primaryColor: '#FF6A00',
    primaryColorRGB: '255, 106, 0'
  },
  dark: {
    primaryColor: '#60a5fa',
    primaryColorRGB: '96, 165, 250'
  },
  tech: {
    primaryColor: '#dc2626',
    primaryColorRGB: '220, 38, 38'
  }
};

/**
 * Get first part of content (for split layouts)
 */
function getFirstPart(content) {
  const sections = content.split('\n\n').filter(s => s.trim() !== '');
  if (sections.length === 0) return '';
  
  const mid = Math.ceil(sections.length / 2);
  return sections.slice(0, mid).join('\n\n');
}

/**
 * Get second part of content (for split layouts)
 */
function getSecondPart(content) {
  const sections = content.split('\n\n').filter(s => s.trim() !== '');
  if (sections.length === 0) return '';
  
  const mid = Math.floor(sections.length / 2);
  return sections.slice(mid).join('\n\n');
}

/**
 * Get nth part of content (for grid layouts)
 */
function getNthPart(content, index) {
  const sections = content.split('\n\n').filter(s => s.trim() !== '');
  if (sections.length === 0) return '';
  
  const parts = 4;
  const partSize = Math.ceil(sections.length / parts);
  const start = index * partSize;
  const end = Math.min(start + partSize, sections.length);
  return sections.slice(start, end).join('\n\n');
}

/**
 * Generate complete slide HTML based on layout
 */
function generateCompleteSlideHTML(layout, content, title, themeConfig) {
  // Read slide template
  const slideTemplate = fs.readFileSync(path.join(__dirname, '../templates/slide.html'), 'utf8');
  
  let slideContent;
  switch (layout) {
    case 'split-2':
      slideContent = `
<div id="md-content"></div>
<div class="split-layout">
  <div class="column" id="col-1">
${getFirstPart(content)}
  </div>
  <div class="column" id="col-2">
${getSecondPart(content)}
  </div>
</div>
`;
      break;

    case 'grid-2x2':
      slideContent = `
<div id="md-content"></div>
<div class="grid-4">
  <div class="grid-card" id="cell-1">${getNthPart(content, 0)}</div>
  <div class="grid-card" id="cell-2">${getNthPart(content, 1)}</div>
  <div class="grid-card" id="cell-3">${getNthPart(content, 2)}</div>
  <div class="grid-card" id="cell-4">${getNthPart(content, 3)}</div>
</div>
`;
      break;

    case 'table-chart':
      slideContent = `
<div id="md-content"></div>
<div class="chart-wrapper">
  <div class="table-side">
${content}
  </div>
  <div class="chart-side">
    <div class="chart-container">
      <canvas id="chart"></canvas>
    </div>
  </div>
</div>
`;
      break;

    case 'vertical':
      slideContent = `
<div class="full-content">
  <div id="md-content"></div>
${content}
</div>
`;
      break;

    case 'cover':
      slideContent = `
<div class="slide-content">
  <div id="md-content"></div>
</div>
`;
      break;

    case 'full':
    default:
      slideContent = `
<div class="full-content">
  <div id="md-content"></div>
${content}
</div>
`;
      break;
  }

  // Apply layout class to slide div
  let slideClass = 'slide';
  if (layout === 'cover') {
    slideClass += ' cover';
  }

  let html = slideTemplate
    .replace(/{{TITLE}}/g, title)
    .replace(/{{MAIN_TITLE}}/g, title)
    .replace(/{{PRIMARY_COLOR}}/g, themeConfig.primaryColor)
    .replace(/{{PRIMARY_COLOR_RGB}}/g, themeConfig.primaryColorRGB)
    .replace(/{{{CONTENT_RAW}}}/g, content)
    .replace(/<div class="slide">/, `<div class="${slideClass}">`)
    .replace(/<div id="content"><\/div>/, `<div id="content">${slideContent}</div>`);

  return html;
}

/**
 * Generate fallback HTML when main generation fails
 */
function generateFallbackHTML(content, title, themeConfig) {
  console.warn(`Using fallback HTML for: ${title}`);
  
  const slideTemplate = fs.readFileSync(path.join(__dirname, '../templates/slide.html'), 'utf8');
  return slideTemplate
    .replace(/{{TITLE}}/g, title)
    .replace(/{{MAIN_TITLE}}/g, title)
    .replace(/{{PRIMARY_COLOR}}/g, themeConfig.primaryColor)
    .replace(/{{PRIMARY_COLOR_RGB}}/g, themeConfig.primaryColorRGB)
    .replace(/{{{CONTENT_RAW}}}/g, content)
    .replace(/<div class="slide">/, `<div class="slide">`)
    .replace(/<div id="content"><\/div>/, `<div id="content"><div class="full-content"><h1>${title}</h1>${content}</div></div>`);
}

/**
 * Detect layout from filename
 */
function detectLayoutFromFilename(filename) {
  if (filename.toLowerCase().includes('cover')) {
    return 'cover';
  }
  return null;
}

/**
 * Main function to generate HTML slides
 */
function generateHTMLSlides(inputDir, htmlOutputDir, title, themeName) {
  const themeConfig = THEMES[themeName] || THEMES.default;
  
  // Ensure output directories exist
  const slidesHtmlDir = path.join(htmlOutputDir, 'slides');
  if (!fs.existsSync(slidesHtmlDir)) {
    fs.mkdirSync(slidesHtmlDir, { recursive: true });
  }

  // Validate and process each slide
  const validator = new MarkdownValidator();
  const mdFiles = fs.readdirSync(inputDir).filter(f => f.endsWith('.md'));
  const slideList = [];

  mdFiles.forEach((filename, index) => {
    console.log(`\nProcessing: ${filename}`);
    const filePath = path.join(inputDir, filename);
    
    // Validate markdown file
    if (!validator.validateFile(filePath)) {
      console.warn(`Validation warnings for ${filename}:`, validator.getWarnings());
      if (validator.getErrors().length > 0) {
        console.error(`Validation errors for ${filename}:`, validator.getErrors());
      }
    }

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // First, check filename for cover detection
      let layout = detectLayoutFromFilename(filename);
      let cleanContent = content;
      
      // If not cover, parse layout from content
      if (!layout) {
        const parser = new LayoutParser();
        const result = parser.parse(content);
        layout = result.layout;
        cleanContent = result.cleanContent;
      }

      // Don't escape - marked will render correctly, HTML is allowed
      const contentRaw = cleanContent.trim();

      // Generate HTML with error handling
      let html;
      try {
        html = generateCompleteSlideHTML(layout, contentRaw, filename.replace(/^\d+-/, '').replace(/\.md$/, '').replace(/-/g, ' '), themeConfig);
      } catch (layoutError) {
        console.error(`Layout generation failed for ${filename}:`, layoutError.message);
        // Use fallback HTML
        html = generateFallbackHTML(contentRaw, filename.replace(/^\d+-/, '').replace(/\.md$/, '').replace(/-/g, ' '), themeConfig);
      }

      // Write output
      const htmlFilename = filename.replace(/\.md$/, '.html');
      const outputPath = path.join(slidesHtmlDir, htmlFilename);
      fs.writeFileSync(outputPath, html, 'utf8');
      console.log(`  Generated: slides/${htmlFilename} (${layout})`);

      slideList.push(`slides/${htmlFilename}`);
    } catch (error) {
      console.error(`Failed to process ${filename}:`, error.message);
      // Create fallback slide
      try {
        const fallbackContent = `# Error Processing Slide\n\nFailed to process ${filename}. Please check the original markdown file.`;
        const fallbackHTML = generateFallbackHTML(fallbackContent, filename.replace(/^\d+-/, '').replace(/\.md$/, '').replace(/-/g, ' '), themeConfig);

        const htmlFilename = filename.replace(/\.md$/, '.html');
        const outputPath = path.join(slidesHtmlDir, htmlFilename);
        fs.writeFileSync(outputPath, fallbackHTML, 'utf8');
        console.log(`  Generated fallback: slides/${htmlFilename}`);
        slideList.push(`slides/${htmlFilename}`);
      } catch (fallbackError) {
        console.error(`Failed to create fallback for ${filename}:`, fallbackError.message);
        // Skip this slide entirely
      }
    }
  });

  // Generate index.html
  const indexTemplate = fs.readFileSync(path.join(__dirname, '../templates/index.html'), 'utf8');
  const slideListJS = slideList.map(s => `            '${s}'`).join(',\n');
  const indexHtml = indexTemplate
    .replace(/{{TITLE}}/g, title)
    .replace(/{{TOTAL_SLIDES}}/g, slideList.length)
    .replace(/{{SLIDE_LIST}}/g, slideListJS)
    .replace(/{{PRIMARY_COLOR}}/g, themeConfig.primaryColor);

  const indexPath = path.join(htmlOutputDir, 'index.html');
  fs.writeFileSync(indexPath, indexHtml, 'utf8');
  console.log(`\nGenerated: index.html`);

  return slideList;
}

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const argMap = {};
  for (let i = 0; i < args.length; i += 2) {
    argMap[args[i]] = args[i + 1];
  }

  const inputDir = argMap['--input-dir'];
  const output = argMap['--output'];
  const title = argMap['--title'] || 'Presentation';
  const theme = argMap['--theme'] || 'default';

  if (!inputDir || !output) {
    console.error('Usage: node generate-html.js --input-dir <dir> --output <dir> [--title "Title"] [--theme theme]');
    process.exit(1);
  }

  console.log(`Generating HTML from: ${inputDir}`);
  console.log(`Theme: ${theme}`);
  
  try {
    generateHTMLSlides(inputDir, output, title, theme);
    console.log('\n✅ Done! Open ' + path.join(output, 'index.html') + ' in browser to view');
  } catch (error) {
    console.error('Fatal error:', error.message);
    process.exit(1);
  }
}

module.exports = { generateHTMLSlides };