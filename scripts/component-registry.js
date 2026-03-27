#!/usr/bin/env node

/**
 * Component Registry for html-slideshow v2.3
 * Manages reusable UI components and theme integration
 */

class ComponentRegistry {
  constructor() {
    this.components = new Map();
    this.themes = new Map();
    this.currentTheme = null;
  }

  /**
   * Register a component
   */
  register(name, component) {
    if (typeof component !== 'function' && typeof component !== 'string') {
      throw new Error(`Component ${name} must be a function or string template`);
    }
    this.components.set(name, component);
    console.log(`✅ Registered component: ${name}`);
  }

  /**
   * Get a component by name
   */
  get(name) {
    return this.components.get(name);
  }

  /**
   * Check if component exists
   */
  has(name) {
    return this.components.has(name);
  }

  /**
   * Render a component with props
   */
  render(componentName, props = {}) {
    const component = this.get(componentName);
    if (!component) {
      console.warn(`Component ${componentName} not found, using fallback`);
      return `<div class="component-fallback">Component ${componentName} not found</div>`;
    }

    if (typeof component === 'function') {
      return component(props);
    } else if (typeof component === 'string') {
      // String template with placeholder replacement
      let result = component;
      for (const [key, value] of Object.entries(props)) {
        const placeholderRegex = new RegExp(`{{${key}}}`, 'g');
        result = result.replace(placeholderRegex, value || '');
      }
      return result;
    }
    
    return component.toString();
  }

  /**
   * Register a theme
   */
  registerTheme(name, themeConfig) {
    this.themes.set(name, themeConfig);
    console.log(`✅ Registered theme: ${name}`);
  }

  /**
   * Set current theme
   */
  setTheme(themeName) {
    if (!this.themes.has(themeName)) {
      console.warn(`Theme ${themeName} not found, using default`);
      return;
    }
    this.currentTheme = themeName;
  }

  /**
   * Get current theme config
   */
  getCurrentTheme() {
    if (!this.currentTheme) {
      return null;
    }
    return this.themes.get(this.currentTheme);
  }

  /**
   * Get theme variable
   */
  getThemeVar(varName, defaultValue = '') {
    const theme = this.getCurrentTheme();
    if (!theme) return defaultValue;
    
    // Support nested properties (e.g., 'colors.primary')
    const keys = varName.split('.');
    let value = theme;
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return defaultValue;
      }
    }
    return value;
  }

  /**
   * Get all registered component names
   */
  getComponentNames() {
    return Array.from(this.components.keys());
  }

  /**
   * Get all registered theme names
   */
  getThemeNames() {
    return Array.from(this.themes.keys());
  }
}

// Create global registry instance
const registry = new ComponentRegistry();

// Register built-in components
registry.register('title', (props) => {
  const { text, level = 1, className = '' } = props;
  const tag = `h${Math.min(Math.max(level, 1), 6)}`;
  return `<${tag} class="${className}">${text}</${tag}>`;
});

registry.register('paragraph', (props) => {
  const { text, className = '' } = props;
  return `<p class="${className}">${text}</p>`;
});

registry.register('list', (props) => {
  const { items, ordered = false, className = '' } = props;
  const tag = ordered ? 'ol' : 'ul';
  const itemsHtml = items.map(item => `<li>${item}</li>`).join('');
  return `<${tag} class="${className}">${itemsHtml}</${tag}>`;
});

registry.register('table', (props) => {
  const { headers, rows, className = '' } = props;
  const headerHtml = headers ? `<thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>` : '';
  const bodyHtml = `<tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody>`;
  return `<table class="${className}">${headerHtml}${bodyHtml}</table>`;
});

registry.register('chart', (props) => {
  const { type = 'bar', data, options = {}, className = '' } = props;
  return `
<div class="chart-container ${className}">
  <canvas id="chart-${Date.now()}"></canvas>
  <script>
    const ctx = document.getElementById('chart-${Date.now()}').getContext('2d');
    new Chart(ctx, {
      type: '${type}',
      data: ${JSON.stringify(data)},
      options: ${JSON.stringify(options)}
    });
  </script>
</div>
`;
});

registry.register('grid', (props) => {
  const { columns = 2, items, className = '' } = props;
  const gridClass = `grid-${columns}x${Math.ceil(items.length / columns)}`;
  const itemsHtml = items.map(item => `<div class="grid-card">${item}</div>`).join('');
  return `<div class="grid-wrapper ${gridClass} ${className}">${itemsHtml}</div>`;
});

registry.register('split-layout', (props) => {
  const { left, right, className = '' } = props;
  return `
<div class="split-layout ${className}">
  <div class="column">${left}</div>
  <div class="column">${right}</div>
</div>
`;
});

// Register built-in themes
registry.registerTheme('default', {
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
  },
  components: {
    cover: 'cover-default',
    content: 'content-default',
    grid: 'grid-responsive'
  }
});

registry.registerTheme('tech', {
  name: 'tech',
  colors: {
    primary: '#dc2626',
    secondary: '#000000',
    background: '#ffffff',
    text: '#000000',
    textLight: '#333333'
  },
  typography: {
    headingWeight: '700',
    bodyWeight: '400',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
  },
  components: {
    cover: 'cover-tech',
    content: 'content-tech',
    grid: 'grid-responsive'
  }
});

registry.registerTheme('nvidia', {
  name: 'nvidia',
  colors: {
    primary: '#76b900',
    secondary: '#1a1a1a',
    background: '#ffffff',
    text: '#1f2937',
    textLight: '#6b7280'
  },
  typography: {
    headingWeight: '700',
    bodyWeight: '400',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
  },
  components: {
    cover: 'cover-nvidia',
    content: 'content-default',
    grid: 'grid-responsive'
  }
});

registry.registerTheme('aliyun', {
  name: 'aliyun',
  colors: {
    primary: '#FF6A00',
    secondary: '#1a1a1a',
    background: '#ffffff',
    text: '#1f2937',
    textLight: '#6b7280'
  },
  typography: {
    headingWeight: '700',
    bodyWeight: '400',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
  },
  components: {
    cover: 'cover-aliyun',
    content: 'content-default',
    grid: 'grid-responsive'
  }
});

registry.registerTheme('dark', {
  name: 'dark',
  colors: {
    primary: '#60a5fa',
    secondary: '#ffffff',
    background: '#1a1a1a',
    text: '#ffffff',
    textLight: '#a0a0a0'
  },
  typography: {
    headingWeight: '700',
    bodyWeight: '400',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
  },
  components: {
    cover: 'cover-dark',
    content: 'content-dark',
    grid: 'grid-responsive'
  }
});

module.exports = registry;