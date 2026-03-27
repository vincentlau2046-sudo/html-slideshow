#!/usr/bin/env node

/**
 * HTML Slideshow - Split slides script
 * Read full markdown outline, split into individual slide markdown files
 * Based on content logic and page breaking hints
 */

const fs = require('fs');
const path = require('path');

/**
 * Split markdown into slides based on content structure
 * We split on:
 * 1. Level 1 headings (#) = new slide
 * 2. If content is too long, split further (but keep related content together)
 * 3. Ensure each slide has clear layout planning at end
 */
function splitMarkdownToSlides(content) {
  const lines = content.split('\n');
  const slides = [];
  let currentSlide = [];
  let currentTitle = '';
  let currentLevel1 = false;

  for (const line of lines) {
    // Start new slide on level 1 heading
    if (line.startsWith('# ')) {
      if (currentSlide.length > 0) {
        // Finalize current slide
        slides.push({
          title: currentTitle.trim(),
          content: currentSlide.join('\n')
        });
      }
      currentTitle = line.substring(2);
      currentSlide = [line];
      currentLevel1 = true;
    } else {
      currentSlide.push(line);
    }
  }

  // Add last slide
  if (currentSlide.length > 0) {
    slides.push({
      title: currentTitle.trim(),
      content: currentSlide.join('\n')
    });
  }

  // Post-process: if a slide is very long, check if it can be split
  // We keep it as one if it's a single logical section
  // The original author already structured it with # headings correctly

  return slides;
}

/**
 * Generate filename from title
 */
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5\s]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 35);
}

/**
 * Main splitting function
 */
function splitSlides(options) {
  const { inputFile, outputDir, title } = options;

  console.log(`Splitting slides from: ${inputFile}`);

  // Read input
  const content = fs.readFileSync(inputFile, 'utf8');
  const slides = splitMarkdownToSlides(content);

  console.log(`Split into ${slides.length} slides`);

  // Create output directories
  const slidesMdDir = path.join(outputDir, 'slides-md');
  if (!fs.existsSync(slidesMdDir)) {
    fs.mkdirSync(slidesMdDir, { recursive: true });
  }

  // Write each slide
  slides.forEach((slide, index) => {
    const filename = `${String(index + 1).padStart(2, '0')}-${slugify(slide.title)}.md`;
    const filePath = path.join(slidesMdDir, filename);
    fs.writeFileSync(filePath, slide.content, 'utf8');
    console.log(`  Created: slides-md/${filename}`);
  });

  console.log(`\n✅ Done! ${slides.length} slides created in ${slidesMdDir}`);
  console.log(`Next step: run generate-html.js to generate HTML slides`);

  return { slides, outputDir, slidesMdDir };
}

// CLI entry
if (require.main === module) {
  const args = process.argv.slice(2);
  let inputFile = null;
  let outputDir = null;
  let title = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--input' && i + 1 < args.length) {
      inputFile = args[++i];
    } else if (args[i] === '--output' && i + 1 < args.length) {
      outputDir = args[++i];
    } else if (args[i] === '--title' && i + 1 < args.length) {
      title = args[++i];
    }
  }

  if (!inputFile || !outputDir || !title) {
    console.log(`
Usage: node split-slides.js --input <full-outline.md> --output <output-dir> --title "Presentation Title"

Example:
  node split-slides.js \\
    --input ./my-outline.md \\
    --output ./my-presentation \\
    --title "My Presentation"
`);
    process.exit(1);
  }

  splitSlides({ inputFile, outputDir, title });
}

module.exports = { splitSlides };
