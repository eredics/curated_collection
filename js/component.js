/* global TemplateEngine */

/**
 * Component system for creating reusable UI components
 * @version 1.1.0
 */
 
const Component = (function() {
  'use strict';
    
  // Local reference to TemplateEngine or fallback implementation
  // eslint-disable-next-line no-unused-vars
  const templateRenderer = (typeof TemplateEngine !== 'undefined') ? TemplateEngine : {
    render: function(template) {
      return template; // Simple fallback if TemplateEngine isn't available
    }
  };
    
  // Rest of your code...
})();

// Add to ArtGallery namespace if available, otherwise expose globally
if (window.ArtGallery) {
  window.ArtGallery.Component = Component;
} else {
  window.Component = Component;
}