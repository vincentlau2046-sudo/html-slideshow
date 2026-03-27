#!/usr/bin/env node

/**
 * HTML Slideshow - Generate HTML from split markdown slides
 * Parse layout description and generate corresponding HTML structure
 */

const fs = require('fs');
const path = require('path');

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
 * Parse layout description from markdown
 * Returns layout structure
 */
function parseLayoutDescription(content) {
  // Extract the page layout planning section
  const lines = content.split('\n');
  let inLayout = false;
  const layoutLines = [];

  for (const line of lines) {
    if (line.includes('### 页面布局规划') || line.includes('页面布局规划')) {
      inLayout = true;
      continue;
    }
    if (inLayout) {
      layoutLines.push(line.trim());
    }
  }

  // Remove the layout section from content
  const contentWithoutLayout = lines.filter(line => {
    if (line.includes('### 页面布局规划') || line.includes('页面布局规划')) {
      return false;
    }
    return true;
  }).join('\n');

  const layoutText = layoutLines.join(' ').toLowerCase();

  // Detect layout type
  let layout = {
    type: 'full', // full width
    structure: []
  };

  if (layoutText.includes('左右分栏') || layoutText.includes('两栏布局') || layoutText.includes('左.*右')) {
    layout.type = 'two-column';
  } else if (layoutText.includes('2.*2') || layoutText.includes('网格') || layoutText.includes('四四')) {
    layout.type = 'grid-2x2';
  } else if (layoutText.includes('三栏') || layoutText.includes('左.*中.*右')) {
    layout.type = 'three-column';
  } else if (layoutText.includes('左侧表格.*右侧图表') || layoutText.includes('左表格.*右图表')) {
    layout.type = 'table-chart';
  } else if (layoutText.includes('上中下') || layoutText.includes('顶部.*中部.*底部')) {
    layout.type = 'top-middle-bottom';
  }

  console.log(`  Layout detected: ${layout.type}`);
  return { layout, contentWithoutLayout };
}

/**
 * Generate HTML content based on layout type
 */
function generateLayoutHTML(content, layout, themeConfig) {
  const primary = themeConfig.primaryColor;

  switch (layout.type) {
    case 'two-column':
      return `
<div class="slide">
  <div id="md-content"></div>
  <div class="grid-2">
    <div class="column" id="col-1">
      <!-- Left column content will be rendered from markdown -->
${getFirstPart(content)}
    </div>
    <div class="column" id="col-2">
      <!-- Right column content -->
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
      <!-- Table content -->
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

// Simple helpers to split content - in real usage markdown is rendered by marked
function getFirstPart(content) {
  // For now, we let marked handle all markdown rendering
  return content;
}
function getSecondPart(content) {
  return content;
}
function getNthPart(content, n) {
  return content;
}

/**
 * Convert title to slug
 */
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5\s]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 35);
}

/**
 * Main generation
 */
function generateHTMLSlides(options) {
  const { inputDir, outputDir, title, theme } = options;

  console.log(`Generating HTML from: ${inputDir}`);
  console.log(`Theme: ${theme}`);

  const themeConfig = THEMES[theme];

  // Read all markdown slides
  const mdFiles = fs.readdirSync(inputDir)
    .filter(f => f.endsWith('.md'))
    .sort();

  console.log(`Found ${mdFiles.length} markdown slides`);

  // Create output directories
  const htmlOutputDir = path.join(outputDir, 'html');
  const slidesHtmlDir = path.join(htmlOutputDir, 'slides');
  if (!fs.existsSync(slidesHtmlDir)) {
    fs.mkdirSync(slidesHtmlDir, { recursive: true });
  }

  // Read slide template
  const slideTemplate = fs.readFileSync(path.join(__dirname, '../templates/slide.html'), 'utf8');

  // Process each slide
  const slideList = [];
  mdFiles.forEach((filename, index) => {
    console.log(`\nProcessing: ${filename}`);
    const filePath = path.join(inputDir, filename);
    const content = fs.readFileSync(filePath, 'utf8');

    // Parse layout
    const { layout, contentWithoutLayout } = parseLayoutDescription(content);

    // Don't escape - marked will render correctly, HTML is allowed
    const contentRaw = contentWithoutLayout.trim();

    // Generate HTML
    const slideTitle = filename.replace(/^\d+-/, '').replace(/\.md$/, '').replace(/-/g, ' ');
    let html = slideTemplate
      .replace(/{{TITLE}}/g, slideTitle)
      .replace(/{{MAIN_TITLE}}/g, title)
      .replace(/{{PRIMARY_COLOR}}/g, themeConfig.primaryColor)
      .replace(/{{PRIMARY_COLOR_RGB}}/g, themeConfig.primaryColorRGB)
      .replace(/{{{CONTENT_RAW}}}/g, contentRaw);

    // Write output
    const htmlFilename = filename.replace(/\.md$/, '.html');
    const outputPath = path.join(slidesHtmlDir, htmlFilename);
    fs.writeFileSync(outputPath, html, 'utf8');
    console.log(`  Generated: slides/${htmlFilename}`);

    slideList.push(`slides/${htmlFilename}`);
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

  console.log(`\n✅ Done! Open ${indexPath} in browser to view`);

  return {
    slideCount: slideList.length,
    indexPath,
    outputDir: htmlOutputDir
  };
}

// CLI entry
if (require.main === module) {
  const args = process.argv.slice(2);
  let inputDir = null;
  let outputDir = null;
  let title = null;
  let theme = 'default';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--input-dir' && i + 1 < args.length) {
      inputDir = args[++i];
    } else if (args[i] === '--output' && i + 1 < args.length) {
      outputDir = args[++i];
    } else if (args[i] === '--title' && i + 1 < args.length) {
      title = args[++i];
    } else if (args[i] === '--theme' && i + 1 < args.length) {
      theme = args[++i];
    }
  }

  if (!inputDir || !outputDir || !title) {
    console.log(`
Usage: node generate-html.js --input-dir <slides-md-dir> --output <output-dir> --title "Presentation Title" [--theme default|nvidia|aliyun|dark]

Example:
  node generate-html.js \\
    --input-dir ./my-presentation/slides-md \\
    --output ./my-presentation \\
    --title "My Presentation" \\
    --theme aliyun
`);
    process.exit(1);
  }

  if (!THEMES[theme]) {
    console.error(`Unknown theme: ${theme}. Available: ${Object.keys(THEMES).join(', ')}`);
    process.exit(1);
  }

  generateHTMLSlides({ inputDir, outputDir, title, theme });
}

module.exports = { generateHTMLSlides };
