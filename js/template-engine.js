/**
 * Simple template engine with data binding
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

// Find your artwork template function

// Example of how to fix the artwork template function
const artworkTemplate = artwork => {
    // Ensure there's always an ID
    const safeId = artwork.id || `artwork-fallback-${Math.random().toString(36).substring(2, 9)}`;
    
    // For debugging only - log what we're rendering
    if (!artwork.id) {
        console.warn('Missing ID for artwork:', artwork.title);
    }
    
    return `
        <div class="artwork" data-id="${safeId}">
            <div class="artwork-image-container">
                <img 
                    class="artwork-image loading-image" 
                    src="./images/placeholder.svg" 
                    data-src="${artwork.imagePath || './images/placeholder.svg'}" 
                    alt="${artwork.title} by ${artwork.artist}"
                    loading="eager"
                >
                <div class="loading-indicator">
                    <div class="spinner"></div>
                </div>
            </div>
            <!-- Rest of your template -->
            <div class="artwork-details">
                <h3 class="artwork-title">${artwork.title}</h3>
                <p class="artwork-artist">${artwork.artist}</p>
                <!-- Additional details as needed -->
            </div>
        </div>
    `;
};