/**
 * VirtualScroll - Efficient image gallery rendering with infinite scrolling
 * 
 * This module handles large datasets by:
 * - Loading images in batches as the user scrolls
 * - Using a flexbox layout with configurable element dimensions
 * - Leveraging the ImageHandler module for optimized image loading
 * - Managing scroll events with throttling
 * 
 * Performance optimizations include:
 * - Minimizing DOM operations with document fragments
 * - Using placeholder images during loading
 * - Preventing multiple simultaneous batch loads
 */

// Renamed to GalleryScroll to avoid conflict with built-in VirtualScroll
const GalleryScroll = (function() {
  // Private variables
  let container = null;
  let allItems = [];
  let loadedCount = 0;
  let isScrollListenerActive = false;
  let isLoading = false; // Prevent multiple simultaneous loads
    
  // Configuration with configurable dimensions
  const config = {
    initialItems: 40,
    batchSize: 40,
    scrollThreshold: 400,
    maxItems: Infinity,
    itemWidth: 220,  // Configurable width
    itemHeight: 240, // Configurable height
    useImageHandler: true // Toggle to use ImageHandler module
  };
    
  /**
     * Add the required CSS styles to the document
     * @private
     */
  function injectStyles() {
    if (document.getElementById('virtual-scroll-styles')) return;
        
    const styleEl = document.createElement('style');
    styleEl.id = 'virtual-scroll-styles';
    styleEl.textContent = `
            .vs-container {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                padding: 0;
                margin: 0;
            }
            
            .vs-artwork {
                flex: 0 0 ${config.itemWidth}px;
                height: ${config.itemHeight}px;
                margin: 0;
                padding: 0;
                border: 1px solid #ddd;
                border-radius: 4px;
                background: #f5f5f5;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                overflow: hidden;
            }
            
            .vs-image-container {
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .vs-artwork-image {
                max-width: 100%;
                max-height: 100%;
                object-fit: contain;
            }
        `;
        
    document.head.appendChild(styleEl);
  }
    
  /**
     * Initialize the virtual scroll with container and items
     * @param {HTMLElement} containerEl - The container element
     * @param {Array} items - Array of items to render
     * @param {Object} [options] - Optional configuration
     * @return {boolean} - Success status
     */
  function init(containerEl, items, options = {}) {
    console.log('VirtualScroll.init called with', items.length, 'items');
        
    if (!containerEl || !items || !items.length) {
      console.error('VirtualScroll init failed: missing container or items');
      return false;
    }
        
    // Update configuration with any provided options
    Object.assign(config, options);
        
    // Inject styles with updated config dimensions
    injectStyles();
        
    // Store references
    container = containerEl;
    allItems = items;
    loadedCount = 0;
        
    // Reset container
    container.innerHTML = '';
        
    // Apply container class
    container.className = container.className + ' vs-container';
        
    // Render initial batch of items
    loadMoreItems();
        
    // Set up scroll event listener
    if (!isScrollListenerActive) {
      window.addEventListener('scroll', checkScrollPosition);
      isScrollListenerActive = true;
      console.log('Scroll listener activated for infinite loading');
    }
        
    return true;
  }
    
  /**
     * Load more items when scrolling
     * @private
     */
  function loadMoreItems() {
    // Don't try to load if we're already loading
    if (isLoading) return;
        
    // Don't load more if we've loaded all items
    if (loadedCount >= allItems.length) {
      console.log('All items loaded:', loadedCount, 'of', allItems.length);
      return;
    }
        
    // Set loading flag
    isLoading = true;
        
    const endIndex = Math.min(loadedCount + config.batchSize, allItems.length);
    console.log(`Loading more items: ${loadedCount} to ${endIndex-1} (${endIndex-loadedCount} items)`);
        
    const fragment = document.createDocumentFragment();
        
    for (let i = loadedCount; i < endIndex; i++) {
      const artwork = allItems[i];
      const element = renderItem(artwork, i);
      fragment.appendChild(element);
    }
        
    container.appendChild(fragment);
    loadedCount = endIndex;
        
    console.log(`Now showing ${loadedCount} of ${allItems.length} items`);
        
    // Clear loading flag
    isLoading = false;
        
    // Immediately check if we need to load more (in case the page is still not filled)
    if (document.body.offsetHeight <= window.innerHeight && loadedCount < allItems.length) {
      console.log('Page not filled, loading more items immediately');
      setTimeout(loadMoreItems, 100);
    }
  }
    
  /**
     * Create a single artwork element
     * @private
     * @param {Object} artwork - Artwork data
     * @param {number} index - Item index
     * @return {HTMLElement} - Rendered element
     */
  function renderItem(artwork, index) {
    const element = document.createElement('div');
    element.className = 'vs-artwork';
    element.setAttribute('data-id', artwork.id || `art-${index}`);
        
    // Process image path
    let imagePath = '';
    if (artwork.imagePath) {
      try {
        // Handle encoding for spaces and special characters
        const parts = artwork.imagePath.split('/');
        const filename = encodeURIComponent(parts[parts.length - 1]);
        imagePath = parts.slice(0, -1).join('/') + '/' + filename;
      } catch (e) {
        console.error('Error encoding image path:', e);
      }
    }
        
    // Image container
    const imgContainer = document.createElement('div');
    imgContainer.className = 'vs-image-container';
        
    // Image element
    const img = document.createElement('img');
    img.className = 'vs-artwork-image';
    img.setAttribute('alt', artwork.title || 'Artwork');
        
    if (config.useImageHandler && window.ArtGallery && window.ArtGallery.ImageHandler) {
      // Use ImageHandler for optimized loading
      img.setAttribute('data-src', imagePath);
            
      // Set a tiny placeholder SVG
      img.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzIDIiPjxyZWN0IHdpZHRoPSIzIiBoZWlnaHQ9IjIiIGZpbGw9IiNlZWUiLz48L3N2Zz4=';
            
      // Use staggered loading to prevent network congestion
      setTimeout(() => {
        if (window.ArtGallery.ImageHandler.lazyLoadImage) {
          window.ArtGallery.ImageHandler.lazyLoadImage(img);
        }
      }, 100 + (index % 10) * 100);
    } else {
      // Fallback to simple lazy loading if ImageHandler not available
      img.setAttribute('data-src', imagePath);
      img.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzIDIiPjxyZWN0IHdpZHRoPSIzIiBoZWlnaHQ9IjIiIGZpbGw9IiNlZWUiLz48L3N2Zz4=';
            
      // Implement simple lazy loading
      const loadImage = function() {
        const dataSrc = img.getAttribute('data-src');
        if (dataSrc) {
          img.src = dataSrc;
        }
      };
            
      // Lazy load with staggered timing
      setTimeout(loadImage, 100 + (index % 10) * 100);
    }
        
    // Build DOM structure
    imgContainer.appendChild(img);
    element.appendChild(imgContainer);
        
    return element;
  }
    
  /**
     * Check if we need to load more items based on scroll position
     * @private
     */
  function checkScrollPosition() {
    if (loadedCount >= allItems.length) {
      // We've loaded all items, remove the listener
      window.removeEventListener('scroll', checkScrollPosition);
      isScrollListenerActive = false;
      return;
    }
        
    const scrollPosition = window.innerHeight + window.scrollY;
    const contentHeight = document.body.offsetHeight;
        
    // Load more when we're near the bottom
    if (contentHeight - scrollPosition < config.scrollThreshold) {
      console.log('Near bottom of page, loading more items');
      loadMoreItems();
    }
  }
    
  /**
     * Update configuration
     * @public
     * @param {Object} newConfig - New configuration options
     * @return {Object} - The VirtualScroll module for chaining
     */
  function configure(newConfig) {
    Object.assign(config, newConfig);
        
    // If dimensions changed, update the CSS
    if (newConfig.itemWidth || newConfig.itemHeight) {
      injectStyles();
    }
        
    return GalleryScroll; // For chaining
  }
    
  /**
     * Get current configuration
     * @public
     * @return {Object} - Copy of current configuration
     */
  function getConfig() {
    return { ...config };
  }
    
  // Public API
  return {
    init: init,
    loadMore: loadMoreItems,
    checkScroll: checkScrollPosition,
    forceLoad: loadMoreItems,
    configure: configure,
    getConfig: getConfig
  };
})();

// Add to ArtGallery namespace if available, otherwise expose globally
if (window.ArtGallery) {
  window.ArtGallery.VirtualScroll = GalleryScroll; // Keep compatible API
} else {
  window.VirtualScroll = GalleryScroll; // Maintain backward compatibility
}

// Confirm the module is loaded
console.log('VirtualScroll module loaded and ready:', typeof window.VirtualScroll === 'object');