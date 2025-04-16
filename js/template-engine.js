/**
 * Template Engine Module
 * Lightweight and efficient string-based templating system with caching
 * @version 1.1.0
 */
 
const TemplateEngine = (function() {
  'use strict';
  
  // Cache for compiled templates
  const templateCache = new Map();
  
  return {
    /**
         * Render a template with data
         * @param {string} template - Template string with placeholders
         * @param {Object} data - Data to bind to the template
         * @param {Object} [options] - Rendering options
         * @param {boolean} [options.escapeHTML=true] - Whether to escape HTML in values
         * @return {string} - Rendered HTML
         */
    render: function(template, data, options = {}) {
      const renderOptions = {
        escapeHTML: true,
        ...options
      };
            
      // Check cache first
      const cacheKey = template + (renderOptions.escapeHTML ? ':escaped' : ':raw');
      if (templateCache.has(cacheKey)) {
        return templateCache.get(cacheKey)(data, renderOptions);
      }
      
      // Simple template syntax: {{variableName}}
      const compiled = this.compile(template, renderOptions);
      templateCache.set(cacheKey, compiled);
      
      return compiled(data, renderOptions);
    },
        
    /**
         * Sanitize a string to prevent HTML injection
         * @param {*} value - Value to escape
         * @return {string} - Escaped string
         */
    escape: function(value) {
      if (value === null || value === undefined) {
        return '';
      }
            
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    },
    
    /**
         * Compile a template into a reusable function
         * @param {string} template - Template string
         * @param {Object} [options] - Compilation options
         * @param {boolean} [options.escapeHTML=true] - Whether to escape HTML in values
         * @return {Function} - Compiled template function
         */
    compile: function(template, options = {}) {
      const compileOptions = {
        escapeHTML: true,
        ...options
      };
            
      // Replace {{var}} with property access and optional escaping
      const functionBody = 'return `' + 
                template
                  .replace(/\\/g, '\\\\')
                  .replace(/`/g, '\\`')
                  .replace(/\{\{(.+?)\}\}/g, function(match, expression) {
                    // Check for raw output marker {{{var}}}
                    if (expression.startsWith('!')) {
                      // Raw output without escaping, remove the ! marker
                      return '${data.' + expression.substring(1) + ' !== undefined ? data.' + expression.substring(1) + " : ''}";
                    }
                        
                    // Standard output with escaping
                    if (compileOptions.escapeHTML) {
                      return '${data.' + expression + ' !== undefined ? this.escape(data.' + expression + ") : ''}";
                    } else {
                      return '${data.' + expression + ' !== undefined ? data.' + expression + " : ''}";
                    }
                  }) + 
                '`;';
            
      const templateFunc = new Function('data', 'options', functionBody);
      
      return (data, renderOptions) => {
        try {
          return templateFunc.call(this, data || {}, renderOptions || {});
        } catch (e) {
          console.error('Template rendering error:', e);
          return 'Template Error';
        }
      };
    },
        
    /**
         * Clear template cache
         * @return {Object} - TemplateEngine instance for chaining
         */
    clearCache: function() {
      templateCache.clear();
      return this;
    }
  };
})();

// Add to ArtGallery namespace if available, otherwise expose globally
if (window.ArtGallery) {
  window.ArtGallery.TemplateEngine = TemplateEngine;
} else {
  window.TemplateEngine = TemplateEngine;
}