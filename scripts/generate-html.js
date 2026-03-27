#!/usr/bin/env node

/**
 * HTML Slideshow v2.3 - Component-based template system
 * Parse layout description and generate corresponding HTML structure
 * Using component registry and theme management
 */

const fs = require('fs');
const path = require('path');
const MarkdownValidator = require('./markdown-validator');
const LayoutAnalyzer = require('./layout-analyzer');
const ComponentRegistry = require('./component-registry');
const ThemeManager = require('./theme-manager');

// Initialize theme manager
const themeManager = new ThemeManager();
themeManager.initializeBuiltInThemes();
themeManager.loadCustomThemes();

/**
 * Get theme configuration with fallbacks
 */
function getThemeConfig(themeName) {
  const builtInThemes = {
    default: {
      primaryColor: '#2563eb',
      primaryColorRGB: '37, 99, 235',
      secondaryColor: '#1a1a1a',
      textColor: '#1f2937',
      textLight: '#6b7280',
      bgColor: '#ffffff'
    },
    nvidia: {
      primaryColor: '#76b900',
      primaryColorRGB: '118, 185, 0',
      secondaryColor: '#1a1a1a',
      textColor: '#1f2937',
      textLight: '#6b7280',
      bgColor: '#ffffff'
    },
    aliyun: {
      primaryColor: '#FF6A00',
      primaryColorRGB: '255, 106, 0',
      secondaryColor: '#1a1a1a',
      textColor: '#1f2937',
      textLight: '#6b7280',
      bgColor: '#ffffff'
    },
    dark: {
      primaryColor: '#60a5fa',
      primaryColorRGB: '96, 165, 250',
      secondaryColor: '#ffffff',
      textColor: '#ffffff',
      textLight: '#a0a0a0',
      bgColor: '#1a1a1a'
    },
    tech: {
      primaryColor: '#dc2626',
      primaryColorRGB: '220, 38, 38',
      secondaryColor: '#000000',
      textColor: '#000000',
      textLight: '#333333',
      bgColor: '#ffffff'
    }
  };

  return builtInThemes[themeName] || builtInThemes.default;
}

/**
 * Parse layout description from markdown with enhanced detection
 */
function parseLayoutDescription(content) {
  const analyzer = new LayoutAnalyzer();
  const layout = analyzer.analyzeLayout(content);
  
  return { layout: layout, contentWithoutLayout: content };
}

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
 * Generate HTML for a specific layout using components
 */
function generateHTMLForLayout(layout, content, title) {
  const registry = ComponentRegistry;
  
  switch (layout) {
    case 'split-2':
      return registry.render('split-layout', {
        left: getFirstPart(content),
        right: getSecondPart(content)
      });

    case 'grid-2x2':
      return registry.render('grid', {
        columns: 2,
        items: [
          getNthPart(content, 0),
          getNthPart(content, 1), 
          getNthPart(content, 2),
          getNthPart(content, 3)
        ]
      });

    case 'table-chart':
      return `
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

    case 'vertical':
      return `<div class="full-content">${content}</div>`;

    case 'full':
    default:
      return `<div class="full-content">${content}</div>`;
  }
}

/**
 * Generate fallback HTML when main generation fails
 */
function generateFallbackHTML(content, title) {
  console.warn(`Using fallback HTML for: ${title}`);
  return `<div class="slide"><div class="full-content"><h1>${title}</h1>${content}</div></div>`;
}

/**
 * Apply theme variables to template
 */
function applyThemeToTemplate(template, themeConfig) {
  let result = template;
  
  // Replace theme variables
  result = result.replace(/{{PRIMARY_COLOR}}/g, themeConfig.primaryColor);
  result = result.replace(/{{PRIMARY_COLOR_RGB}}/g, themeConfig.primaryColorRGB);
  result = result.replace(/{{SECONDARY_COLOR}}/g, themeConfig.secondaryColor);
  result = result.replace(/{{TEXT_COLOR}}/g, themeConfig.textColor);
  result = result.replace(/{{TEXT_LIGHT}}/g, themeConfig.textLight);
  result = result.replace(/{{BG_COLOR}}/g, themeConfig.bgColor);
  
  // Set font family
  const fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
  result = result.replace(/var\(--font-family,[^)]+\)/g, fontFamily);
  
  return result;
}

/**
 * Main function to generate HTML slides
 */
function generateHTMLSlides(inputDir, htmlOutputDir, title, themeName) {
  const themeConfig = getThemeConfig(themeName);
  
  // Ensure output directories exist
  const slidesHtmlDir = path.join(htmlOutputDir, 'slides');
  if (!fs.existsSync(slidesHtmlDir)) {
    fs.mkdirSync(slidesHtmlDir, { recursive: true });
  }

  // Read slide template (v2.3 version)
  const slideTemplatePath = path.join(__dirname, '../templates/slide-v2.3.html');
  let slideTemplate = fs.readFileSync(slideTemplatePath, 'utf8');
  
  // Apply theme to template
  slideTemplate = applyThemeToTemplate(slideTemplate, themeConfig);
  
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

      // Parse layout with enhanced detection
      const { layout, contentWithoutLayout } = parseLayoutDescription(content);

      // Don't escape - marked will render correctly, HTML is allowed
      const contentRaw = contentWithoutLayout.trim();

      // Generate HTML with error handling
      let html;
      try {
        const layoutHTML = generateHTMLForLayout(layout, contentRaw, filename);
        html = slideTemplate
          .replace(/{{TITLE}}/g, filename.replace(/^\d+-/, '').replace(/\.md$/, '').replace(/-/g, ' '))
          .replace(/{{MAIN_TITLE}}/g, title)
          .replace(/{{{CONTENT_RAW}}}/g, contentRaw)
          .replace(/<div class="slide"/, `<div class="slide" data-layout="${layout}"`);
      } catch (layoutError) {
        console.error(`Layout generation failed for ${filename}:`, layoutError.message);
        // Use fallback HTML
        html = slideTemplate
          .replace(/{{TITLE}}/g, filename.replace(/^\d+-/, '').replace(/\.md$/, '').replace(/-/g, ' '))
          .replace(/{{MAIN_TITLE}}/g, title)
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