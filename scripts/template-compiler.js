#!/usr/bin/env node

/**
 * Template Compiler for html-slideshow v2.3
 * Compiles declarative templates into executable code
 */

const fs = require('fs');
const path = require('path');

class TemplateCompiler {
  constructor(componentRegistry) {
    this.registry = componentRegistry;
  }

  /**
   * Compile a template string into executable function
   */
  compile(templateString, options = {}) {
    try {
      // Parse the template
      const ast = this.parseTemplate(templateString);
      
      // Generate executable code
      const code = this.generateCode(ast, options);
      
      // Create and return executable function
      const compiledFunction = new Function('props', 'registry', code);
      
      return compiledFunction;
    } catch (error) {
      console.error('Template compilation failed:', error.message);
      throw error;
    }
  }

  /**
   * Parse template string into AST
   */
  parseTemplate(template) {
    // Simple parser for basic HTML with component tags
    const lines = template.split('\n');
    const ast = { type: 'document', children: [] };
    let currentElement = ast;
    const elementStack = [ast];

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Component tag detection
      if (trimmed.startsWith('<component ')) {
        const componentMatch = trimmed.match(/<component\s+name="([^"]+)"\s*(.*?)>/);
        if (componentMatch) {
          const componentName = componentMatch[1];
          const propsString = componentMatch[2] || '';
          
          // Parse props
          const props = {};
          const propMatches = propsString.matchAll(/(\w+)="([^"]*)"/g);
          for (const match of propMatches) {
            props[match[1]] = match[2];
          }
          
          const componentNode = {
            type: 'component',
            name: componentName,
            props: props,
            parent: currentElement
          };
          
          currentElement.children.push(componentNode);
        }
      } else if (trimmed.startsWith('</component>')) {
        // Close component (no-op in our simple model)
      } else if (trimmed.startsWith('<') && !trimmed.startsWith('</')) {
        // Regular HTML element
        const tagMatch = trimmed.match(/<(\w+)([^>]*)>/);
        if (tagMatch) {
          const tagName = tagMatch[1];
          const attrs = tagMatch[2] || '';
          
          const elementNode = {
            type: 'element',
            tagName: tagName,
            attributes: this.parseAttributes(attrs),
            children: [],
            parent: currentElement
          };
          
          currentElement.children.push(elementNode);
          elementStack.push(elementNode);
          currentElement = elementNode;
        }
      } else if (trimmed.startsWith('</')) {
        // Close HTML element
        if (elementStack.length > 1) {
          elementStack.pop();
          currentElement = elementStack[elementStack.length - 1];
        }
      } else if (trimmed !== '') {
        // Text content
        currentElement.children.push({
          type: 'text',
          content: trimmed,
          parent: currentElement
        });
      }
    }
    
    return ast;
  }

  /**
   * Parse HTML attributes into object
   */
  parseAttributes(attrsString) {
    const attrs = {};
    const matches = attrsString.matchAll(/(\w+)="([^"]*)"/g);
    for (const match of matches) {
      attrs[match[1]] = match[2];
    }
    return attrs;
  }

  /**
   * Generate executable code from AST
   */
  generateCode(ast, options) {
    const indent = (level) => '  '.repeat(level);
    let code = '';
    let level = 0;
    
    const generateNode = (node, currentLevel) => {
      switch (node.type) {
        case 'document':
          code += 'let output = "";\n';
          node.children.forEach(child => generateNode(child, currentLevel + 1));
          code += 'return output;\n';
          break;
          
        case 'element':
          code += `${indent(currentLevel)}output += '<${node.tagName}`;
          Object.entries(node.attributes).forEach(([key, value]) => {
            code += ` ${key}="${value}"`;
          });
          code += '>\\n';\n';
          node.children.forEach(child => generateNode(child, currentLevel + 1));
          code += `${indent(currentLevel)}output += '</${node.tagName}>\\n';\n`;
          break;
          
        case 'component':
          code += `${indent(currentLevel)}output += registry.render('${node.name}', {\n`;
          Object.entries(node.props).forEach(([key, value]) => {
            // Handle dynamic props (starting with :)
            if (value.startsWith(':')) {
              const propName = value.substring(1);
              code += `${indent(currentLevel + 1)}${key}: props.${propName},\n`;
            } else {
              code += `${indent(currentLevel + 1)}${key}: "${value}",\n`;
            }
          });
          code += `${indent(currentLevel)}});\n`;
          break;
          
        case 'text':
          code += `${indent(currentLevel)}output += \`${node.content}\\n\`;\n`;
          break;
      }
    };
    
    generateNode(ast, level);
    return code;
  }

  /**
   * Load template from file
   */
  loadTemplate(filePath) {
    try {
      const templateContent = fs.readFileSync(filePath, 'utf8');
      return this.compile(templateContent);
    } catch (error) {
      console.error(`Failed to load template ${filePath}:`, error.message);
      throw error;
    }
  }

  /**
   * Render template with props
   */
  render(templatePath, props, registry) {
    try {
      const compiledTemplate = this.loadTemplate(templatePath);
      return compiledTemplate(props, registry);
    } catch (error) {
      console.error('Template rendering failed:', error.message);
      return `<div class="template-error">Template rendering failed: ${error.message}</div>`;
    }
  }
}

module.exports = TemplateCompiler;