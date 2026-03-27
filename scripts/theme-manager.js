#!/usr/bin/env node

/**
 * Theme Manager for html-slideshow v2.3
 * Manages theme loading, configuration, and CSS generation
 */

const fs = require('fs');
const path = require('path');

class ThemeManager {
  constructor() {
    this.themesDir = path.join(__dirname, '../themes');
    this.builtInThemes = new Map();
    this.customThemes = new Map();
    this.currentTheme = 'default';
  }

  /**
   * Initialize built-in themes
   */
  initializeBuiltInThemes() {
    // These are defined in component-registry.js
    // This method exists for future expansion
    console.log('✅ Built-in themes initialized');
  }

  /**
   * Load custom themes from themes directory
   */
  loadCustomThemes() {
    if (!fs.existsSync(this.themesDir)) {
      fs.mkdirSync(this.themesDir, { recursive: true });
      console.log(`📁 Created themes directory: ${this.themesDir}`);
    }
    
    const themeFiles = fs.readdirSync(this.themesDir)
      .filter(file => file.endsWith('.json') || file.endsWith('.js'));
    
    for (const themeFile of themeFiles) {
      try {
        const themePath = path.join(this.themesDir, themeFile);
        let themeConfig;
        
        if (themeFile.endsWith('.json')) {
          const themeContent = fs.readFileSync(themePath, 'utf8');
          themeConfig = JSON.parse(themeContent);
        } else if (themeFile.endsWith('.js')) {
          themeConfig = require(themePath);
        }
        
        const themeName = themeFile.replace(/\.(json|js)$/, '');
        this.customThemes.set(themeName, themeConfig);
        console.log(`✅ Loaded custom theme: ${themeName}`);
      } catch (error) {
        console.error(`❌ Failed to load theme ${themeFile}:`, error.message);
      }
    }
  }

  /**
   * Get theme configuration
   */
  getTheme(themeName) {
    // Check custom themes first
    if (this.customThemes.has(themeName)) {
      return this.customThemes.get(themeName);
    }
    
    // Check built-in themes (via component registry)
    const registry = require('./component-registry');
    if (registry.getThemeNames().includes(themeName)) {
      return registry.getCurrentTheme();
    }
    
    // Return default theme
    console.warn(`⚠️ Theme ${themeName} not found, using default`);
    return this.getDefaultTheme();
  }

  /**
   * Get default theme
   */
  getDefaultTheme() {
    return {
      name: 'default',
      colors: {
        primary: '#2563eb',
        secondary: '#1a1a1a',
        background: '#ffffff',
        text: '#1f2937',
        textLight: '#6b7280'
      },
      typography: {
        headingWeight: '700',
        bodyWeight: '400',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
      }
    };
  }

  /**
   * Generate CSS variables from theme
   */
  generateCSSVariables(theme) {
    const cssVars = [];
    
    // Colors
    if (theme.colors) {
      Object.entries(theme.colors).forEach(([key, value]) => {
        cssVars.push(`--${key}-color: ${value};`);
      });
    }
    
    // Typography
    if (theme.typography) {
      Object.entries(theme.typography).forEach(([key, value]) => {
        cssVars.push(`--${key}: ${value};`);
      });
    }
    
    // Custom variables
    if (theme.variables) {
      Object.entries(theme.variables).forEach(([key, value]) => {
        cssVars.push(`--${key}: ${value};`);
      });
    }
    
    return cssVars.join('\n  ');
  }

  /**
   * Generate complete CSS from theme
   */
  generateThemeCSS(theme) {
    const cssVars = this.generateCSSVariables(theme);
    return `
:root {
  ${cssVars}
}`;
  }

  /**
   * Set current theme
   */
  setTheme(themeName) {
    this.currentTheme = themeName;
    console.log(`🎨 Switched to theme: ${themeName}`);
  }

  /**
   * Get current theme
   */
  getCurrentTheme() {
    return this.getTheme(this.currentTheme);
  }

  /**
   * List all available themes
   */
  listThemes() {
    const registry = require('./component-registry');
    const builtIn = registry.getThemeNames();
    const custom = Array.from(this.customThemes.keys());
    return { builtIn, custom };
  }

  /**
   * Create a new theme template
   */
  createThemeTemplate(themeName) {
    const themeTemplate = {
      name: themeName,
      description: `Custom theme: ${themeName}`,
      colors: {
        primary: '#000000',
        secondary: '#333333',
        background: '#ffffff',
        text: '#000000',
        textLight: '#666666'
      },
      typography: {
        headingWeight: '700',
        bodyWeight: '400',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
      },
      components: {
        cover: `cover-${themeName}`,
        content: 'content-default',
        grid: 'grid-responsive'
      }
    };
    
    const themePath = path.join(this.themesDir, `${themeName}.json`);
    fs.writeFileSync(themePath, JSON.stringify(themeTemplate, null, 2));
    console.log(`✅ Created theme template: ${themePath}`);
    return themePath;
  }
}

module.exports = ThemeManager;