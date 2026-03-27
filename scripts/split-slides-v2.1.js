#!/usr/bin/env node

/**
 * HTML Slideshow v2.1 - Split slides script with validation
 * Read full markdown outline, split into individual slide markdown files
 * Based on content logic and page breaking hints
 */

const fs = require('fs');
const path = require('path');
const MarkdownValidator = require('./markdown-validator');

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

  return slides;
}

/**
 * Validate and enhance slide content
 */
function validateAndEnhanceSlide(slide, index) {
  const validator = new MarkdownValidator();
  
  // Validate content
  if (!validator.validateContent(slide.content)) {
    console.warn(`Validation warnings for slide ${index + 1} (${slide.title}):`, validator.getWarnings());
  }

  // Ensure each slide has a title
  if (!slide.title || slide.title.trim() === '') {
    slide.title = `Slide ${index + 1}`;
  }

  // Add layout planning if missing
  if (!slide.content.includes('页面布局规划') && !slide.content.includes('layout:')) {
    // Auto-detect layout based on content length and structure
    const contentLength = slide.content.length;
    const paragraphCount = (slide.content.match(/\n\n/g) || []).length + 1;
    
    if (paragraphCount >= 4) {
      // Long content, suggest split layout
      slide.content += '\n\n### 页面布局规划\n左右分栏';
    } else if (paragraphCount >= 6) {
      // Very long content, suggest grid layout
      slide.content += '\n\n### 页面布局规划\n2×2网格';
    }
    // Otherwise, keep default full layout
  }

  return slide;
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
      const validatedSlide = validateAndEnhanceSlide(slide, index);
      const filename = `${String(index + 1).padStart(2, '0')}-${validatedSlide.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.md`;
      const filePath = path.join(slidesMdDir, filename);
      
      // Prepend title as H1 if not already present
      let finalContent = validatedSlide.content;
      if (!finalContent.trim().startsWith('# ')) {
        finalContent = `# ${validatedSlide.title}\n\n${finalContent}`;
      }
      
      fs.writeFileSync(filePath, finalContent, 'utf8');
      console.log(`Generated: ${filename}`);
    });

    console.log(`\n✅ Done! Slides saved to ${slidesMdDir}`);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}