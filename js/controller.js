/**
 * Main Application Controller
 * Coordinates module initialization and application flow
 * @version 1.1.0
 */
const Controller = (function() {
  'use strict';
    
  // Module references
  let dataLoader = null;
  let virtualScroll = null;
  let imageHandler = null;
  let initialized = false;
  let loadingTimeout = null;
  
  /**
   * Safely get module references whether they're global or in ArtGallery namespace
   * @private
   * @param {string} moduleName - The name of the module to resolve
   * @returns {Object|null} - The module reference or null if not found
   */
  function getModuleReference(moduleName) {
    return window.ArtGallery ? 
      window.ArtGallery[moduleName] : 
      window[moduleName];
  }
  
  /**
   * Sanitize string data to prevent XSS
   * @private
   * @param {string} str - The string to sanitize
   * @returns {string} - Sanitized string
   */
  function sanitize(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  
  /**
   * Show error message in the UI
   * @private
   * @param {string} message - Error message to display
   */
  function showErrorUI(message) {
    const container = document.getElementById('gallery-container');
    if (!container) return;
    
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.setAttribute('role', 'alert');
    errorElement.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <p>${sanitize(message)}</p>
      <button id="retry-button">Retry</button>
    `;
    
    container.innerHTML = '';
    container.appendChild(errorElement);
    
    // Add retry functionality
    document.getElementById('retry-button').addEventListener('click', function() {
      init();
    });
  }
    
  /**
   * Initialize the application
   * @public
   * @async
   */
  async function init() {
    if (initialized) {
      console.log('Controller already initialized');
      return;
    }
    
    console.log('Controller initializing...');
    
    // Clear any previous error state
    const container = document.getElementById('gallery-container');
    if (container) {
      container.innerHTML = `<div class="loading-indicator">Loading gallery...</div>`;
    }
    
    // Get module references
    dataLoader = getModuleReference('DataLoader');
    virtualScroll = getModuleReference('VirtualScroll');
    imageHandler = getModuleReference('ImageHandler');
    
    // Verify dependencies
    if (!dataLoader) {
      const errorMsg = 'DataLoader not found. Cannot initialize application.';
      console.error(errorMsg);
      showErrorUI(errorMsg);
      return;
    }
    
    // Set loading timeout
    loadingTimeout = setTimeout(() => {
      showErrorUI('Loading is taking longer than expected. The server might be slow.');
    }, 10000); // 10-second timeout
    
    try {
      // Load artwork data
      const artworks = await dataLoader.loadArtworks();
      clearTimeout(loadingTimeout);
      
      console.log('Successfully loaded', artworks.length, 'artworks');
      window.allArtworks = artworks; // Make available for debugging
      
      // Initialize gallery
      initGallery(artworks);
      initialized = true;
    } catch (error) {
      clearTimeout(loadingTimeout);
      console.error('Failed to load artworks:', error);
      showErrorUI('Failed to load artwork data. Please try again later.');
    }
  }
    
  /**
   * Initialize the gallery with loaded artworks
   * @private
   * @param {Array} artworks - The loaded artwork data
   */
  function initGallery(artworks) {
    const galleryContainer = document.getElementById('gallery-container');
        
    if (!galleryContainer) {
      console.error('Gallery container not found');
      return;
    }
        
    // Initialize virtual scroll if available
    if (virtualScroll && virtualScroll.init) {
      console.log('Initializing virtual scroll with', artworks.length, 'items');
      virtualScroll.init(galleryContainer, artworks);
    } else {
      console.warn('VirtualScroll not available, falling back to basic rendering');
      renderBasicGallery(galleryContainer, artworks);
    }
        
    // Announce to screen readers
    const announcer = document.getElementById('sr-announcer');
    if (announcer) {
      announcer.textContent = `Gallery loaded with ${artworks.length} artworks.`;
    }
    
    // Delay splash screen hiding for better user experience
    setTimeout(() => {
      const splash = document.getElementById('splash-screen');
      if (splash) {
        splash.classList.add('hidden');
        console.log('Splash screen hidden after timed delay');
      }
    }, 2500); // 2.5 seconds - balanced timing for branding recognition
  }
    
  /**
   * Basic gallery renderer as fallback
   * @private
   * @param {HTMLElement} container - Gallery container
   * @param {Array} artworks - Artwork data to render
   */
  function renderBasicGallery(container, artworks) {
    // Clear container
    container.innerHTML = '';
        
    // Show first 20 artworks
    const fragment = document.createDocumentFragment();
    const limit = Math.min(artworks.length, 20);
        
    for (let i = 0; i < limit; i++) {
      const artwork = artworks[i];
      const element = document.createElement('div');
      element.className = 'artwork';
      element.setAttribute('data-id', sanitize(artwork.id || `art-${i}`));
            
      const imgContainer = document.createElement('div');
      imgContainer.className = 'artwork-image-container';
            
      const img = document.createElement('img');
      img.className = 'artwork-image';
      img.setAttribute('alt', sanitize(artwork.Title || 'Artwork'));
      img.setAttribute('data-src', sanitize(artwork.imagePath || ''));
      img.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzIDIiPjxyZWN0IHdpZHRoPSIzIiBoZWlnaHQ9IjIiIGZpbGw9IiNlZWUiLz48L3N2Zz4=';
      
      // Add timeout for image loading
      if (imageHandler && imageHandler.lazyLoadImage) {
        const loadingTimeout = setTimeout(() => {
          img.setAttribute('data-error', 'true');
          img.setAttribute('alt', 'Image loading failed');
          clearTimeout(loadingTimeout);
        }, 15000); // 15-second timeout
        
        img.addEventListener('load', () => clearTimeout(loadingTimeout));
        img.addEventListener('error', () => clearTimeout(loadingTimeout));
        
        imageHandler.lazyLoadImage(img);
      }
            
      imgContainer.appendChild(img);
      element.appendChild(imgContainer);
      fragment.appendChild(element);
    }
        
    container.appendChild(fragment);
  }
  
  /**
   * Clean up resources and prepare for destruction
   * @public
   */
  function destroy() {
    // Clear any pending timeouts
    if (loadingTimeout) {
      clearTimeout(loadingTimeout);
    }
    
    // Clean up VirtualScroll if it exists and has a destroy method
    if (virtualScroll && typeof virtualScroll.destroy === 'function') {
      virtualScroll.destroy();
    }
    
    // Remove global debug reference
    delete window.allArtworks;
    
    // Reset state
    initialized = false;
    
    console.log('Controller destroyed');
  }
    
  // Public API
  return {
    init: init,
    destroy: destroy
  };
})();

// Add to ArtGallery namespace if available, otherwise expose globally
if (window.ArtGallery) {
  window.ArtGallery.Controller = Controller;
} else {
  window.Controller = Controller;
}

console.log('Controller module loaded');