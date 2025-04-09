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
        retryDelay: 1000, // ms
        maxConcurrentLoads: 3, // Only load 3 images at a time
        retryAttempts: 2
    };
    
    // Track which images have been processed
    const processedImages = new Set();
    
    // IntersectionObserver instance
    let observer = null;
    
    let loadQueue = [];
    let activeLoads = 0;
    
    // Process next items in the queue
    const processQueue = function() {
        if (loadQueue.length === 0 || activeLoads >= config.maxConcurrentLoads) return;
        
        while (loadQueue.length > 0 && activeLoads < config.maxConcurrentLoads) {
            const imgElement = loadQueue.shift();
            activeLoads++;
            
            // Actually load the image
            doLoadImage(imgElement)
                .finally(() => {
                    activeLoads--;
                    // Process next batch when this one finishes
                    setTimeout(processQueue, 10);
                });
        }
    };
    
    // Actual image loading logic
    const doLoadImage = function(imgElement) {
        const imgSrc = imgElement.dataset.src;
        
        // If source is empty or just a partial ID (like "00044_"), use placeholder
        if (!imgSrc || imgSrc.match(/images_scraped\/\d{5}_$/)) {
            imgElement.src = config.placeholderPath;
            imgElement.classList.add('error-image');
            return Promise.resolve(imgElement);
        }
        
        // Mark as processed
        processedImages.add(imgElement);
        
        // Load the image
        return loadImage(imgSrc, imgElement);
    };
    
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
            // Make sure URL is properly encoded
            const encodedUrl = url.includes('%') ? url : encodeURI(url);
            
            const img = new Image();
            
            img.onload = function() { 
                resolve(true); 
            };
            
            img.onerror = function() { 
                resolve(false); 
            };
            
            // Set cache-busting parameter for better testing
            img.src = encodedUrl + '?_cache=' + new Date().getTime();
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
            visibleImages.forEach(img => this.loadImage(img));
            
            // Then set up observer for remaining images
            const options = {
                // Adjust rootMargin to start loading images before they enter the viewport
                rootMargin: '200px 0px', // Load images 200px before they come into view
                threshold: 0.01 // Trigger when even a small part of the image is visible
            };
            
            const observer = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        this.loadImage(img);
                        observer.unobserve(img); // Stop observing once loaded
                    }
                });
            }, options);
            
            // Observe all images with data-src attribute
            document.querySelectorAll('img[data-src]').forEach(img => {
                observer.observe(img);
            });
        },
        
        /**
         * Manually load an image without using the observer
         * @param {string} imagePath - Path to image
         * @param {HTMLImageElement} imgElement - Image element
         * @return {Promise} - Promise resolving when image loading is complete
         */
        loadImage: function(imgElement) {
            if (!imgElement || !imgElement.dataset.src) {
                return Promise.reject('Invalid image element');
            }
            
            return new Promise((resolve, reject) => {
                const src = imgElement.dataset.src;
                
                // Check if image source is empty or already loaded
                if (!src || imgElement.classList.contains('loaded')) {
                    resolve(imgElement);
                    return;
                }
                
                // Set actual src from data-src
                imgElement.onload = function() {
                    // Mark as loaded and remove placeholder
                    imgElement.classList.add('loaded');
                    
                    // If there's a loading indicator, hide it
                    const loadingIndicator = imgElement.nextElementSibling;
                    if (loadingIndicator && loadingIndicator.classList.contains('loading-indicator')) {
                        loadingIndicator.style.display = 'none';
                    }
                    
                    resolve(imgElement);
                };
                
                imgElement.onerror = function() {
                    console.warn('Failed to load image:', src);
                    imgElement.src = './images/placeholder.svg';
                    imgElement.classList.add('error');
                    resolve(imgElement); // Resolve anyway to prevent promise chain issues
                };
                
                // Set the actual src to trigger loading
                imgElement.src = src;
            });
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