/**
 * Template Engine Module
 */
// eslint-disable-next-line no-unused-vars
const TemplateEngine = (function() {
    'use strict';
  
    // Cache for compiled templates
    const templateCache = new Map();
  
    return {
    /**
     * Render a template with data
     * @param {string} template - Template string with placeholders
     * @param {Object} data - Data to bind to the template
     * @return {string} - Rendered HTML
     */
        render: function(template, data) {
            // Check cache first
            if (templateCache.has(template)) {
                return templateCache.get(template)(data);
            }
      
            // Simple template syntax: {{variableName}}
            const compiled = this.compile(template);
            templateCache.set(template, compiled);
      
            return compiled(data);
        },
    
        /**
     * Compile a template into a reusable function
     * @param {string} template - Template string
     * @return {Function} - Compiled template function
     */
        compile: function(template) {
            // Replace {{var}} with property access
            const templateFunc = new Function('data', 
                "return `" + 
        template
            .replace(/\\/g, "\\\\")
            .replace(/`/g, "\\`")
            .replace(/\{\{(.+?)\}\}/g, "${data.$1 !== undefined ? data.$1 : ''}") + 
        "`;");
      
            return function(data) {
                try {
                    return templateFunc(data || {});
                } catch (e) {
                    console.error('Template rendering error:', e);
                    return 'Template Error';
                }
            };
        }
    };
})();