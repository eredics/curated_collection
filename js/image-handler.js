/**
 * Enhanced image handling module with error handling
 */
const ImageHandler = (function() {
    'use strict';
    
    // Configuration
    const config = {
        placeholderPath: 'images/placeholder.svg',
        errorClass: 'error-image',
        errorAltText: 'Image unavailable',
        loadingClass: 'loading-image',
        retryLimit: 2,
        retryDelay: 1000 // ms
    };
    
    // In-memory tracking of image load attempts
    const loadAttempts = new Map();
    
    /**
     * Checks if an image at the given URL exists and is loadable
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
            
            // Set source to trigger loading
            img.src = url;
        });
    };
    
    /**
     * Apply error styling and placeholder to failed image
     * @param {HTMLImageElement} imgElement - The image element
     * @param {string} originalAlt - Original alt text
     */
    const applyErrorState = function(imgElement, originalAlt = '') {
        // Set placeholder image
        imgElement.src = config.placeholderPath;
        
        // Update alt text to indicate error while preserving original info
        imgElement.alt = `${config.errorAltText} - ${originalAlt}`;
        
        // Add error class for styling
        imgElement.classList.add(config.errorClass);
        
        // Remove loading state if present
        imgElement.classList.remove(config.loadingClass);
        
        // Dispatch custom event for other components
        imgElement.dispatchEvent(new CustomEvent('imageLoadError'));
    };
    
    /**
     * Attempt to load an image with retry capability
     * @param {string} imagePath - Path to image
     * @param {HTMLImageElement} imgElement - Image element
     * @param {number} attemptNum - Current attempt number
     */
    const attemptImageLoad = function(imagePath, imgElement, attemptNum = 0) {
        // Store original alt for later use
        const originalAlt = imgElement.dataset.originalAlt || imgElement.alt;
        
        // Save original alt if not already saved
        if (!imgElement.dataset.originalAlt) {
            imgElement.dataset.originalAlt = originalAlt;
        }
        
        // Add loading class
        imgElement.classList.add(config.loadingClass);
        
        // Check if image exists
        return imageExists(imagePath)
            .then(exists => {
                if (exists) {
                    // Image loaded successfully
                    imgElement.src = imagePath;
                    imgElement.classList.remove(config.loadingClass, config.errorClass);
                    return true;
                } else if (attemptNum < config.retryLimit) {
                    // Retry loading after delay
                    console.log(`Retrying image load (${attemptNum + 1}/${config.retryLimit}): ${imagePath}`);
                    return new Promise((resolve) => {
                        setTimeout(() => {
                            resolve(attemptImageLoad(imagePath, imgElement, attemptNum + 1));
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
         * Load image with error handling
         * @param {string} imagePath - Path to image
         * @param {HTMLImageElement} imgElement - Image element
         * @return {Promise} - Promise resolving when image loading is complete
         */
        loadImage: function(imagePath, imgElement) {
            // Skip loading if no path provided
            if (!imagePath) {
                applyErrorState(imgElement, imgElement.alt);
                return Promise.resolve(false);
            }
            
            // Initialize load attempts tracking
            if (!loadAttempts.has(imagePath)) {
                loadAttempts.set(imagePath, 0);
            }
            
            return attemptImageLoad(imagePath, imgElement);
        },
        
        /**
         * Preload a batch of images
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
        },
        
        /**
         * Setup global error handling for all images
         * Sets up error handling for dynamically added images too
         */
        setupGlobalErrorHandling: function() {
            // Handle existing images
            document.querySelectorAll('img').forEach(img => {
                if (!img.dataset.errorHandled) {
                    img.dataset.errorHandled = 'true';
                    img.addEventListener('error', function() {
                        applyErrorState(this, this.alt);
                    });
                }
            });
            
            // Set up mutation observer for future images
            const observer = new MutationObserver(mutations => {
                mutations.forEach(mutation => {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach(node => {
                            // Check if node is an element
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                // Handle direct img elements
                                if (node.tagName === 'IMG' && !node.dataset.errorHandled) {
                                    node.dataset.errorHandled = 'true';
                                    node.addEventListener('error', function() {
                                        applyErrorState(this, this.alt);
                                    });
                                }
                                
                                // Handle images within added elements
                                node.querySelectorAll('img').forEach(img => {
                                    if (!img.dataset.errorHandled) {
                                        img.dataset.errorHandled = 'true';
                                        img.addEventListener('error', function() {
                                            applyErrorState(this, this.alt);
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            });
            
            // Start observing
            observer.observe(document.body, { childList: true, subtree: true });
            
            return this;
        }
    };
})();

// Auto-initialize global error handling when the script loads
document.addEventListener('DOMContentLoaded', function() {
    ImageHandler.setupGlobalErrorHandling();
});