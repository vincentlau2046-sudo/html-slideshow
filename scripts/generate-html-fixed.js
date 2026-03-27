#!/usr/bin/env node

/**
 * HTML Slideshow v2.3 - FIXED version
 * 正确分离布局规划和内容，确保演示稿纯净
 */

const fs = require('fs');
const path = require('path');
const MarkdownValidator = require('./markdown-validator');
const LayoutParser = require('./layout-parser-fixed');

// Theme configurations (same as before)
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
 * Generate HTML for a specific layout
 */
function generateHTMLForLayout(layout, content, title) {
  switch (layout) {
    case 'split-2':
      return `
<div class="slide">
  <div id="md-content"></div>
  <div class="split-layout">
    <div class="column" id="col-1">
${getFirstPart(content)}
    </div>
    <div class="column" id="col-2">
${getSecondPart(content)}
    </div>
  </div>
</div>
`;

    case 'grid-2x2':
      return `
<div class="slide">
  <div id="md-content"></div>
  <div class="grid-4">
    <div class="grid-card" id="cell-1">${getNthPart(content, 0)}</div>
    <div class="grid-card" id="cell-2">${getNthPart(content, 1)}</div>
    <div class="grid-card" id="cell-3">${getNthPart(content, 2)}</div>
    <div class="grid-card" id="cell-4">${getNthPart(content, 3)}</div>
  </div>
</div>
`;

    case 'table-chart':
      return `
<div class="slide">
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
</div>
`;

    case 'vertical':
      return `
<div class="slide">
  <div class="full-content">
    <div id="md-content"></div>
${content}
  </div>
</div>
`;

    case 'full':
    default:
      return `
<div class="slide">
  <div class="full-content">
    <div id="md-content"></div>
${content}
  </div>
</div>
`;
  }
}

/**
 * Generate fallback HTML when main generation fails
 */
function generateFallbackHTML(content, title) {
  console.warn(`Using fallback HTML for: ${title}`);
  return `
<div class="slide">
  <div class="full-content">
    <h1>${title}</h1>
    <div id="md-content"></div>
${content}
  </div>
</div>
`;
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

  // Read slide template
  const slideTemplate = fs.readFileSync(path.join(__dirname, '../templates/slide.html'), 'utf8');
  
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
      
      // Parse layout and clean content properly
      const parser = new LayoutParser();
      const { layout, cleanContent } = parser.parse(content);
      
      // Validate that content is clean
      if (!parser.validateCleanContent(cleanContent)) {
        console.warn(`Content still contains layout directives for ${filename}`);
      }

      // Don't escape - marked will render correctly, HTML is allowed
      const contentRaw = cleanContent.trim();

      // Generate HTML with error handling
      let html;
      try {
        const layoutHTML = generateHTMLForLayout(layout, contentRaw, filename);
        html = slideTemplate
          .replace(/{{TITLE}}/g, filename.replace(/^\d+-/, '').replace(/\.md$/, '').replace(/-/g, ' '))
          .replace(/{{MAIN_TITLE}}/g, title)
          .replace(/{{PRIMARY_COLOR}}/g, themeConfig.primaryColor)
          .replace(/{{PRIMARY_COLOR_RGB}}/g, themeConfig.primaryColorRGB)
          .replace(/{{{CONTENT_RAW}}}/g, contentRaw)
          .replace(/<div class="slide">/, `<div class="slide" data-layout="${layout}">`);
      } catch (layoutError) {
        console.error(`Layout generation failed for ${filename}:`, layoutError.message);
        // Use fallback HTML
        html = slideTemplate
          .replace(/{{TITLE}}/g, filename.replace(/^\d+-/, '').replace(/\.md$/, '').replace(/-/g, ' '))
          .replace(/{{MAIN_TITLE}}/g, title)
          .replace(/{{PRIMARY_COLOR}}/g, themeConfig.primaryColor)
          .replace(/{{PRIMARY_COLOR_RGB}}/g, themeConfig.primaryColorRGB)
          .replace(/{{{CONTENT_RAW}}}/g, contentRaw);
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
        const fallbackHTML = slideTemplate
          .replace(/{{TITLE}}/g, filename.replace(/^\d+-/, '').replace(/\.md$/, '').replace(/-/g, ' '))
          .replace(/{{MAIN_TITLE}}/g, title)
          .replace(/{{PRIMARY_COLOR}}/g, themeConfig.primaryColor)
          .replace(/{{PRIMARY_COLOR_RGB}}/g, themeConfig.primaryColorRGB)
          .replace(/{{{CONTENT_RAW}}}/g, fallbackContent);

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