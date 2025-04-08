/**
 * Image handling module with placeholder support
 */
const ImageHandler = (function() {
    'use strict';
    
    // Placeholder image path
    const PLACEHOLDER_IMAGE = './images/placeholder.jpg';
    
    /**
     * Check if an image exists
     * @param {string} url - Image URL to check
     * @return {Promise} - Promise resolving to boolean
     */
    const imageExists = function(url) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = function() { resolve(true); };
            img.onerror = function() { resolve(false); };
            img.src = url;
        });
    };
    
    return {
        /**
         * Load image with placeholder fallback
         * @param {string} imagePath - Primary image path
         * @param {HTMLImageElement} imgElement - Image element to update
         * @return {Promise} - Promise resolving when image is loaded
         */
        loadImage: function(imagePath, imgElement) {
            // If path is invalid, use placeholder immediately
            if (!imagePath) {
                imgElement.src = PLACEHOLDER_IMAGE;
                imgElement.classList.add('placeholder');
                return Promise.resolve(false);
            }
            
            return imageExists(imagePath)
                .then(exists => {
                    imgElement.src = exists ? imagePath : PLACEHOLDER_IMAGE;
                    imgElement.classList.toggle('placeholder', !exists);
                    return exists;
                })
                .catch(() => {
                    imgElement.src = PLACEHOLDER_IMAGE;
                    imgElement.classList.add('placeholder');
                    return false;
                });
        },
        
        /**
         * Preload a batch of images
         * @param {Array} imagePaths - Array of image paths to preload
         * @param {Function} progressCallback - Callback for progress updates
         * @return {Promise} - Promise resolving when all images are checked
         */
        preloadImages: function(imagePaths, progressCallback) {
            let loaded = 0;
            const total = imagePaths.length;
            
            return Promise.all(
                imagePaths.map(path => 
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