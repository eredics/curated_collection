/**
 * Enhanced image handling module with lazy loading
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
        retryDelay: 1000 // ms
    };
    
    // Track which images have been processed
    const processedImages = new Set();
    
    // IntersectionObserver instance
    let observer = null;
    
    /**
     * Initialize the Intersection Observer
     */
    const initObserver = function() {
        if (observer) return observer;
        
        observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const dataSrc = img.dataset.src;
                    
                    if (dataSrc && !processedImages.has(img)) {
                        loadImage(dataSrc, img);
                        processedImages.add(img);
                        observer.unobserve(img);
                    }
                }
            });
        }, {
            rootMargin: '200px 0px', // Start loading when image is 200px away
            threshold: 0.01 // Trigger when at least 1% of the image is visible
        });
        
        return observer;
    };
    
    /**
     * Checks if an image exists
     * @param {string} url - Image URL to check
     * @return {Promise} - Promise resolving to boolean
     */
    const imageExists = function(url) {
        return new Promise((resolve) => {
            const img = new Image();
            
            img.onload = function() { 
                resolve(true); 
            };
            
            img.onerror = function() { 
                resolve(false); 
            };
            
            // Set cache-busting parameter for better testing
            img.src = url + (url.includes('?') ? '&' : '?') + '_cache=' + new Date().getTime();
        });
    };
    
    /**
     * Apply error styling and placeholder to failed image
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
     * @param {string} imagePath - Path to image
     * @param {HTMLImageElement} imgElement - Image element
     * @param {number} attemptNum - Current attempt number
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
        
        // Check if image exists
        return imageExists(imagePath)
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
                    };
                    
                    tempImg.src = imagePath;
                    return true;
                } else if (attemptNum < config.retryLimit) {
                    // Retry loading after delay
                    console.log(`Retrying image load (${attemptNum + 1}/${config.retryLimit}): ${imagePath}`);
                    return new Promise((resolve) => {
                        setTimeout(() => {
                            resolve(loadImage(imagePath, imgElement, attemptNum + 1));
                        }, config.retryDelay);
                    });
                } else {
                    // All retries failed, use placeholder
                    console.warn(`Failed to load image after ${attemptNum} attempts: ${imagePath}`);
                    applyErrorState(imgElement, originalAlt);
                    return false;
                }
            })
            .catch(() => {
                // Handle unexpected errors
                console.error(`Error checking image: ${imagePath}`);
                applyErrorState(imgElement, originalAlt);
                return false;
            });
    };
    
    return {
        /**
         * Setup lazy loading for all images with data-src
         * @return {Object} - ImageHandler instance for chaining
         */
        setupLazyLoading: function() {
            // Initialize observer
            const observer = initObserver();
            
            // Find all images with data-src attribute
            document.querySelectorAll('img[data-src]:not([data-observed])').forEach(img => {
                // Mark as observed to prevent double processing
                img.setAttribute('data-observed', 'true');
                
                // Set native lazy loading attribute for browsers that support it
                img.setAttribute('loading', 'lazy');
                
                // Add loading class initially
                img.classList.add(config.loadingClass);
                
                // Observe the image
                observer.observe(img);
            });
            
            return this;
        },
        
        /**
         * Manually load an image without using the observer
         * @param {string} imagePath - Path to image
         * @param {HTMLImageElement} imgElement - Image element
         * @return {Promise} - Promise resolving when image loading is complete
         */
        loadImage: function(imagePath, imgElement) {
            // Skip if no path
            if (!imagePath) {
                applyErrorState(imgElement, imgElement.alt);
                return Promise.resolve(false);
            }
            
            // Mark as processed
            processedImages.add(imgElement);
            
            // Load the image
            return loadImage(imagePath, imgElement);
        },
        
        /**
         * Force loading of all observed images regardless of visibility
         * Useful when quickly populating a gallery
         */
        loadAllImages: function() {
            document.querySelectorAll('img[data-src][data-observed]:not([data-loaded])').forEach(img => {
                if (img.dataset.src && !processedImages.has(img)) {
                    loadImage(img.dataset.src, img);
                    processedImages.add(img);
                    if (observer) {
                        observer.unobserve(img);
                    }
                }
            });
        },
        
        /**
         * Preload a batch of images for critical resources
         * @param {Array} imagePaths - Array of image paths
         * @param {Function} progressCallback - Progress callback
         * @return {Promise} - Promise resolving to results array
         */
        preloadImages: function(imagePaths, progressCallback) {
            const validPaths = imagePaths.filter(path => path);
            let loaded = 0;
            const total = validPaths.length;
            
            return Promise.all(
                validPaths.map(path => 
                    imageExists(path)
                        .then(exists => {
                            loaded++;
                            if (progressCallback) {
                                progressCallback(loaded / total, exists ? path : null);
                            }
                            return { path, exists };
                        })
                )
            );
        }
    };
})();

// Auto-initialize lazy loading when the script loads
document.addEventListener('DOMContentLoaded', function() {
    ImageHandler.setupLazyLoading();
});