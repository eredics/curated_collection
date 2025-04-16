/**
 * Image Handler Module
 * Handles efficient image loading with lazy loading and error handling
 * @version 1.1.0
 */
 
const ImageHandler = (function() {
  'use strict';
    
  // Configuration
  const config = {
    placeholderPath: 'images/placeholder.svg',
    errorClass: 'error-image',
    loadingClass: 'loading-image',
    loadedClass: 'loaded-image',
    errorAltText: 'Image unavailable',
    retryLimit: 2,
    retryDelay: 1000, // ms
    maxConcurrentLoads: 3, // Only load 3 images at a time
    intersectionRootMargin: '200px 0px', // Load images 200px before they enter the viewport
    intersectionThreshold: 0.01 // Trigger when even a small part of the image is visible
  };
    
  // Track which images have been processed
  const processedImages = new Set();
    
  // Create reusable IntersectionObserver instance
  let observer = null;
    
  /**
     * Safely encode image path, handling special characters
     * @private
     * @param {string} url - Image URL to encode
     * @return {string} - Properly encoded URL
     */
  const encodeImagePath = function(url) {
    if (!url || typeof url !== 'string' || url === './images/placeholder.svg') {
      return url;
    }
        
    let encodedUrl = url;
        
    // Special handling for images in scraped folder
    if (url.startsWith('./images_scraped/')) {
      try {
        const parts = url.split('/');
        // Decode first in case it's already partially encoded, then re-encode fully
        const filename = encodeURIComponent(decodeURIComponent(parts.pop() || ''));
        encodedUrl = parts.join('/') + '/' + filename;
      } catch (e) {
        console.error(`Error encoding URL: ${url}`, e);
        // Proceed with potentially problematic URL, might fail
      }
    } else {
      // For non-local URLs, basic encoding might suffice
      try {
        encodedUrl = encodeURI(url); // encodeURI is generally safer for full URLs
      } catch (e) {
        console.error(`Error encoding URL: ${url}`, e);
      }
    }
        
    return encodedUrl;
  };
    
  /**
     * Checks if an image exists
     * @private
     * @param {string} url - Image URL to check
     * @return {Promise} - Promise resolving to boolean
     */
  const imageExists = function(url) {
    if (!url || typeof url !== 'string' || url === './images/placeholder.svg') {
      return Promise.resolve(false);
    }

    // Encode the URL properly
    const encodedUrl = encodeImagePath(url);

    // Prevent requests for clearly invalid paths
    if (!encodedUrl || encodedUrl === './images_scraped/') {
      console.warn(`Skipping imageExists check for invalid URL: ${url}`);
      return Promise.resolve(false);
    }

    return new Promise(resolve => {
      const img = new Image();
      img.onload = function() {
        resolve(true);
      };
      img.onerror = function() {
        // Log the failed URL for debugging
        console.log(`imageExists check failed for: ${encodedUrl}`);
        resolve(false);
      };

      // Set cache-busting parameter for better testing
      img.src = encodedUrl + (encodedUrl.includes('?') ? '&' : '?') + '_cache=' + Date.now();
    });
  };
    
  /**
     * Apply error styling and placeholder to failed image
     * @private
     * @param {HTMLImageElement} imgElement - The image element
     * @param {string} originalAlt - Original alt text
     */
  const applyErrorState = function(imgElement, originalAlt = '') {
    // Remove loading state
    imgElement.classList.remove(config.loadingClass);
        
    // Set placeholder image
    imgElement.src = config.placeholderPath;
        
    // Update alt text
    imgElement.alt = `${config.errorAltText} - ${originalAlt}`;
        
    // Add error class for styling
    imgElement.classList.add(config.errorClass);
        
    // Trigger custom event
    imgElement.dispatchEvent(new CustomEvent('imageLoadError'));
  };
    
  /**
     * Load image with retry capability
     * @private
     * @param {string} imagePath - Path to image
     * @param {HTMLImageElement} imgElement - Image element
     * @param {number} attemptNum - Current attempt number
     * @return {Promise} - Promise resolving to success status
     */
  const loadImage = function(imagePath, imgElement, attemptNum = 0) {
    // Save original alt text
    const originalAlt = imgElement.dataset.originalAlt || imgElement.alt;
    if (!imgElement.dataset.originalAlt) {
      imgElement.dataset.originalAlt = originalAlt;
    }
        
    // Add loading class for styling
    imgElement.classList.add(config.loadingClass);
        
    // Create blur-up effect with tiny preview if available
    if (imgElement.dataset.preview) {
      imgElement.src = imgElement.dataset.preview;
    }
        
    return new Promise(resolve => {
      // Check if image exists
      imageExists(imagePath)
        .then(exists => {
          if (exists) {
            // Create new image object to preload
            const tempImg = new Image();
                        
            tempImg.onload = function() {
              // Remove loading class when loaded
              imgElement.classList.remove(config.loadingClass);
              imgElement.classList.add(config.loadedClass);
                            
              // Set the final image
              imgElement.src = imagePath;
                            
              // Mark as loaded with data attribute for potential later use
              imgElement.dataset.loaded = 'true';
                            
              // Dispatch custom event
              imgElement.dispatchEvent(new CustomEvent('imageLoaded'));
                            
              resolve({ success: true, element: imgElement });
            };
                        
            tempImg.onerror = function() {
              // Handle unexpected load error
              console.error(`Unexpected error loading image: ${imagePath}`);
              applyErrorState(imgElement, originalAlt);
              resolve({ success: false, element: imgElement, error: 'Load error' });
            };
                        
            tempImg.src = encodeImagePath(imagePath);
          } else if (attemptNum < config.retryLimit) {
            // Retry loading after delay
            console.log(`Retrying image load (${attemptNum + 1}/${config.retryLimit}): ${imagePath}`);
            setTimeout(() => {
              loadImage(imagePath, imgElement, attemptNum + 1)
                .then(resolve);
            }, config.retryDelay);
          } else {
            // All retries failed, use placeholder
            console.warn(`Failed to load image after ${attemptNum} attempts: ${imagePath}`);
            applyErrorState(imgElement, originalAlt);
            resolve({ success: false, element: imgElement, error: 'All retries failed' });
          }
        })
        .catch(error => {
          // Handle unexpected errors
          console.error(`Error checking image: ${imagePath}`, error);
          applyErrorState(imgElement, originalAlt);
          resolve({ success: false, element: imgElement, error: error.message });
        });
    });
  };
    
  /**
     * Initialize the IntersectionObserver if needed
     * @private
     * @returns {IntersectionObserver} - The observer instance
     */
  const getObserver = function() {
    if (!observer) {
      observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src && !img.dataset.loaded) {
              publicApi.loadImage(img);
              obs.unobserve(img); // Stop observing once loading started
            }
          }
        });
      }, {
        rootMargin: config.intersectionRootMargin,
        threshold: config.intersectionThreshold
      });
    }
    return observer;
  };

  // Public API
  const publicApi = {
    /**
         * Setup lazy loading for all images with data-src
         * @return {Object} - ImageHandler instance for chaining
         */
    setupLazyLoading: function() {
      // First, prioritize currently visible images
      const visibleImages = Array.from(document.querySelectorAll('img[data-src]')).filter(img => {
        const rect = img.getBoundingClientRect();
        return (
          rect.top >= -100 &&
                    rect.left >= 0 &&
                    rect.bottom <= (window.innerHeight + 100) &&
                    rect.right <= window.innerWidth
        );
      });
            
      // Load visible images immediately
      visibleImages.forEach(img => {
        this.loadImage(img);
        processedImages.add(img);
      });
            
      // Use the shared observer for remaining images
      const obs = getObserver();
            
      // Observe all images with data-src attribute
      document.querySelectorAll('img[data-src]').forEach(img => {
        if (!processedImages.has(img)) {
          img.dataset.observed = 'true';
          obs.observe(img);
        }
      });
            
      return this;
    },
        
    /**
         * Manually load an image without using the observer
         * @param {HTMLImageElement} imgElement - Image element
         * @return {Promise} - Promise resolving with status object
         */
    loadImage: function(imgElement) {
      if (!imgElement || !imgElement.dataset.src) {
        return Promise.resolve({ 
          success: false, 
          element: imgElement, 
          error: 'Invalid image element or missing data-src' 
        });
      }
            
      const src = imgElement.dataset.src;
            
      // Check if image already loaded or empty src
      if (!src || imgElement.classList.contains(config.loadedClass)) {
        return Promise.resolve({ 
          success: true, 
          element: imgElement,
          alreadyLoaded: true 
        });
      }
            
      // Mark as being processed
      processedImages.add(imgElement);
            
      // Use the central loading function
      return loadImage(src, imgElement);
    },
        
    /**
         * Force loading of all observed images regardless of visibility
         * Useful when quickly populating a gallery
         * @return {Promise} - Promise resolving when all images are processed
         */
    loadAllImages: function() {
      const promises = [];
            
      document.querySelectorAll('img[data-src][data-observed]:not([data-loaded])').forEach(img => {
        if (img.dataset.src && !img.dataset.loaded) {
          promises.push(this.loadImage(img));
                    
          // Stop observing since we're manually loading
          if (observer) {
            observer.unobserve(img);
          }
        }
      });
            
      return Promise.all(promises);
    },
        
    /**
         * Preload a batch of images for critical resources
         * @param {Array} imagePaths - Array of image paths
         * @param {Function} progressCallback - Progress callback
         * @return {Promise} - Promise resolving to results array
         */
    preloadImages: function(imagePaths, progressCallback) {
      if (!Array.isArray(imagePaths) || imagePaths.length === 0) {
        return Promise.resolve([]);
      }
            
      // Only preload the first 10 images (visible in initial view)
      const initialBatch = imagePaths.slice(0, 10);
      const remainingBatch = imagePaths.slice(10);
            
      // Use prefetch for remaining images instead of preload
      if (remainingBatch.length > 0) {
        setTimeout(() => {
          this.prefetchImages(remainingBatch);
        }, 2000); // Delay prefetching to prioritize initial render
      }
            
      // Only preload initial batch
      return this.preloadImagesCore(initialBatch, progressCallback);
    },

    /**
         * Prefetch images for later use (lower priority than preload)
         * @param {Array} imagePaths - Array of image paths to prefetch
         * @return {Object} - ImageHandler instance for chaining
         */
    prefetchImages: function(imagePaths) {
      if (!Array.isArray(imagePaths) || imagePaths.length === 0) {
        return this;
      }
            
      imagePaths.forEach(path => {
        if (!path) return;
                
        const encodedPath = encodeImagePath(path);
                
        const link = document.createElement('link');
        link.rel = 'prefetch'; // Use prefetch instead of preload
        link.as = 'image';
        link.href = encodedPath;
        link.fetchpriority = 'low';
        document.head.appendChild(link);
      });
            
      return this;
    },

    /**
         * Core preloading implementation
         * @param {Array} imagePaths - Array of image paths
         * @param {Function} progressCallback - Progress callback
         * @return {Promise} - Promise resolving to results array
         */
    preloadImagesCore: function(imagePaths, progressCallback) {
      if (!Array.isArray(imagePaths) || imagePaths.length === 0) {
        return Promise.resolve([]);
      }
            
      const total = imagePaths.length;
      let completed = 0;
            
      // Create array of promises for each image load
      const promises = imagePaths.map(path => {
        return new Promise((resolve) => {
          // Skip invalid paths
          if (!path) {
            completed++;
            if (progressCallback) {
              progressCallback(completed / total);
            }
            resolve({ path: null, success: false });
            return;
          }
                    
          // Use central encoding function
          const encodedPath = encodeImagePath(path);
                    
          const img = new Image();
                    
          img.onload = function() {
            completed++;
            if (progressCallback) {
              progressCallback(completed / total);
            }
            resolve({ path, success: true });
          };
                    
          img.onerror = function() {
            completed++;
            if (progressCallback) {
              progressCallback(completed / total);
            }
            console.warn('Failed to preload image:', path);
            resolve({ path, success: false });
          };
                    
          img.src = encodedPath;
        });
      });
            
      return Promise.all(promises);
    },

    /**
         * Add a single image to lazy loading system
         * @param {HTMLImageElement} img - Image element
         * @return {Object} - ImageHandler instance for chaining
         */
    lazyLoadImage: function(img) {
      if (!img || !img.dataset.src || processedImages.has(img)) {
        return this;
      }
            
      const obs = getObserver();
      img.dataset.observed = 'true';
      obs.observe(img);
            
      return this;
    },
        
    /**
         * Configure the image handler
         * @param {Object} options - Configuration options
         * @return {Object} - ImageHandler instance for chaining
         */
    configure: function(options) {
      Object.assign(config, options);
      return this;
    },
        
    /**
         * Get current configuration
         * @return {Object} - Copy of current configuration
         */
    getConfig: function() {
      return { ...config };
    }
  };
    
  return publicApi;
})();

// Export to namespace or global
if (window.ArtGallery) {
  window.ArtGallery.ImageHandler = ImageHandler;
} else {
  window.ImageHandler = ImageHandler;
}

// Auto-initialize lazy loading when the script loads
document.addEventListener('DOMContentLoaded', function() {
  ImageHandler.setupLazyLoading();
});