/**
 * Image Handler Module
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
    
    /**
     * Checks if an image exists
     * @param {string} url - Image URL to check
     * @return {Promise} - Promise resolving to boolean
     */
    const imageExists = function(url) {
        if (!url || typeof url !== 'string' || url === './images/placeholder.svg') {
            return Promise.resolve(false);
        }

        // Properly encode the URL, especially the filename part
        let encodedUrl = url;
        if (url.startsWith('./images_scraped/')) {
            try {
                const parts = url.split('/');
                // Decode first in case it's already partially encoded, then re-encode fully
                const filename = encodeURIComponent(decodeURIComponent(parts.pop() || ''));
                encodedUrl = parts.join('/') + '/' + filename;
            } catch (e) {
                console.error(`Error encoding URL in imageExists: ${url}`, e);
                // Proceed with potentially problematic URL, might fail
            }
        } else {
            // For non-local URLs, basic encoding might suffice, but be cautious
            try {
                encodedUrl = encodeURI(url); // encodeURI is generally safer for full URLs
            } catch (e) {
                console.error(`Error encoding URL with encodeURI: ${url}`, e);
            }
        }

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
            // Use the correctly encoded URL
            img.src = encodedUrl + (encodedUrl.includes('?') ? '&' : '?') + '_cache=' + Date.now();
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
            
            return new Promise((resolve, _reject) => {
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

        // New method to handle prefetching (lower priority than preload)
        prefetchImages: function(imagePaths) {
            if (!Array.isArray(imagePaths) || imagePaths.length === 0) return;
            
            imagePaths.forEach(path => {
                if (!path) return;
                
                const link = document.createElement('link');
                link.rel = 'prefetch'; // Use prefetch instead of preload
                link.as = 'image';
                link.href = path;
                link.fetchpriority = 'low';
                document.head.appendChild(link);
            });
        },

        // Core preloading implementation
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
                    
                    // Handle special characters in URLs
                    let encodedPath = path;
                    if (path.includes('#')) {
                        encodedPath = path.replace(/#/g, '%23');
                    }
                    if (path.includes('$')) {
                        encodedPath = encodedPath.replace(/\$/g, '%24');
                    }
                    
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
         * Add a new method for lazy loading
         * @param {HTMLImageElement} img - Image element
         */
        lazyLoadImage: function(img) {
            if (!img.dataset.src) return;
            
            const observer = new IntersectionObserver(entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        img.src = img.dataset.src;
                        observer.unobserve(img);
                    }
                });
            });
            
            observer.observe(img);
        }
    };
})();
window.ImageHandler = ImageHandler;

// Auto-initialize lazy loading when the script loads
document.addEventListener('DOMContentLoaded', function() {
    ImageHandler.setupLazyLoading();
});

window.ImageHandler = ImageHandler;