#!/usr/bin/env node

/**
 * Markdown Validator for html-slideshow v2.1
 * Validates markdown structure before processing
 */

const fs = require('fs');
const path = require('path');

class MarkdownValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  validateFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return this.validateContent(content);
    } catch (error) {
      this.errors.push(`Failed to read file: ${error.message}`);
      return false;
    }
  }

  validateContent(content) {
    this.errors = [];
    this.warnings = [];

    // Check for basic structure
    if (!content || content.trim().length === 0) {
      this.errors.push('Empty content');
      return false;
    }

    // Validate heading hierarchy
    this.validateHeadings(content);

    // Validate lists
    this.validateLists(content);

    // Validate tables
    this.validateTables(content);

    // Validate layout planning section
    this.validateLayoutPlanning(content);

    return this.errors.length === 0;
  }

  validateHeadings(content) {
    const lines = content.split('\n');
    let currentLevel = 0;
    let hasTopLevelHeading = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('#')) {
        const level = line.match(/^#+/)[0].length;
        
        // Check if top level heading exists
        if (level === 1) {
          hasTopLevelHeading = true;
        }

        // Check heading hierarchy (should not jump more than 1 level)
        if (level > currentLevel + 1) {
          this.warnings.push(`Heading hierarchy jump at line ${i + 1}: level ${currentLevel} to ${level}`);
        }
        currentLevel = level;
      }
    }

    if (!hasTopLevelHeading) {
      this.warnings.push('No top-level heading (#) found');
    }
  }

  validateLists(content) {
    const lines = content.split('\n');
    let inList = false;
    let listIndent = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (trimmed.startsWith('- ') || trimmed.match(/^\d+\./)) {
        inList = true;
        listIndent = line.length - trimmed.length;
      } else if (inList && line.trim() === '') {
        // Empty line in list is ok
        continue;
      } else if (inList && line.length > 0) {
        const currentIndent = line.length - line.trimLeft().length;
        if (currentIndent < listIndent) {
          inList = false;
        }
      }
    }
  }

  validateTables(content) {
    const lines = content.split('\n');
    let inTable = false;
    let tableHeader = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('|') && line.endsWith('|')) {
        if (!inTable) {
          inTable = true;
          tableHeader = true;
        } else if (tableHeader && line.includes('---')) {
          tableHeader = false;
        }
      } else if (inTable) {
        inTable = false;
        tableHeader = false;
      }
    }
  }

  validateLayoutPlanning(content) {
    const layoutPatterns = [
      /页面布局规划/i,
      /layout:/i,
      /分栏/i,
      /网格/i,
      /纵向分布/i
    ];

    const hasLayoutPlanning = layoutPatterns.some(pattern => pattern.test(content));
    
    if (!hasLayoutPlanning) {
      this.warnings.push('No layout planning section found, will use default full layout');
    }
  }

  getErrors() {
    return this.errors;
  }

  getWarnings() {
    return this.warnings;
  }

  isValid() {
    return this.errors.length === 0;
  }
}

module.exports = MarkdownValidator;