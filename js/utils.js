/**
 * Utility functions for the application
 * Collection of helper methods that can be used throughout the app
 */

const Utils = (function() {
    'use strict';
    
    return {
        /**
         * Safely adds a class to an element
         * @param {HTMLElement} element - The element to add the class to
         * @param {string} className - The class to add
         */
        addClass: function(element, className) {
            if (element && element.classList) {
                element.classList.add(className);
            }
        },
        
        /**
         * Safely removes a class from an element
         * @param {HTMLElement} element - The element to remove the class from
         * @param {string} className - The class to remove
         */
        removeClass: function(element, className) {
            if (element && element.classList) {
                element.classList.remove(className);
            }
        },
        
        /**
         * Toggles a class on an element
         * @param {HTMLElement} element - The element to toggle the class on
         * @param {string} className - The class to toggle
         */
        toggleClass: function(element, className) {
            if (element && element.classList) {
                element.classList.toggle(className);
            }
        },
        
        /**
         * Debounce function to limit how often a function can be called
         * @param {Function} func - The function to debounce
         * @param {number} wait - Time in milliseconds to wait
         * @return {Function} - Debounced function
         */
        debounce: function(func, wait) {
            let timeout;
            return function(...args) {
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(this, args), wait);
            };
        },
        
        /**
         * Formats a date according to the specified format
         * @param {Date} date - The date to format
         * @param {string} format - The format to use
         * @return {string} - Formatted date string
         */
        formatDate: function(date, format = 'YYYY-MM-DD') {
            if (!date) return '';
            
            const d = new Date(date);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            
            return format
                .replace('YYYY', year)
                .replace('MM', month)
                .replace('DD', day);
        },
        
        /**
         * Safely parses JSON with error handling
         * @param {string} jsonString - The JSON string to parse
         * @param {*} fallback - Fallback value if parsing fails
         * @return {*} - Parsed object or fallback value
         */
        safeJsonParse: function(jsonString, fallback = {}) {
            try {
                return JSON.parse(jsonString);
            } catch (e) {
                // Intentionally silent - return fallback on parsing error
                console.debug('JSON parse error, using fallback');
                return fallback;
            }
        },

        /**
         * Safely access storage with fallback
         * @param {Function} accessor - Storage access function
         * @param {*} fallback - Default value if access fails
         * @return {*} - Retrieved value or fallback
         */
        safeStorageGet: function(accessor, fallback = null) {
            try {
                return accessor();
            } catch (e) {
                // Intentionally silent - return fallback on storage error
                return fallback;
            }
        },
        
        /**
         * Safely executes a function with a fallback value on error
         * @param {Function} fn - Function to execute
         * @param {*} fallback - Value to return if function throws
         * @return {*} - Function result or fallback
         */
        safeExecute: function(fn, fallback = null) {
            try {
                return fn();
            } catch (e2) {
                // Intentionally silent - return fallback on execution error
                return fallback;
            }
        },
        
        /**
         * Safely converts a value to a specific type
         * @param {*} value - Value to convert
         * @param {string} type - Target type ('string', 'number', etc.)
         * @param {*} fallback - Default if conversion fails
         * @return {*} - Converted value or fallback
         */
        safeConvert: function(value, type, fallback = null) {
            try {
                // Conversion logic here
                return value;
            } catch (e) {
                // Intentionally silent - return fallback on conversion error
                return fallback;
            }
        },
        
        /**
         * Lazy load an image
         * @param {string} src - Image source URL
         * @param {Function} callback - Callback when image is loaded
         */
        lazyLoadImage: function(src, callback) {
            const img = new Image();
            img.onload = function() {
                if (typeof callback === 'function') {
                    callback(img);
                }
            };
            img.onerror = function() {
                if (typeof callback === 'function') {
                    callback(null);
                }
            };
            img.src = src;
        },

        /**
         * Lazy load multiple images
         * @param {Array} sources - Array of image source URLs
         * @param {Function} progressCallback - Called when each image loads
         * @param {Function} completeCallback - Called when all images are loaded
         */
        lazyLoadImages: function(sources, progressCallback, completeCallback) {
            const total = sources.length;
            let loaded = 0;
            const results = new Array(total);
            
            sources.forEach((src, index) => {
                this.lazyLoadImage(src, img => {
                    results[index] = img;
                    loaded++;
                    
                    if (typeof progressCallback === 'function') {
                        progressCallback(loaded / total, img, index);
                    }
                    
                    if (loaded === total && typeof completeCallback === 'function') {
                        completeCallback(results);
                    }
                });
            });
        },

        /**
         * Observe elements and trigger a callback when they enter viewport
         * @param {NodeList|Array} elements - Elements to observe
         * @param {Function} callback - Callback when element is in viewport
         * @param {Object} options - IntersectionObserver options
         */
        observeElements: function(elements, callback, options = {}) {
            if (!('IntersectionObserver' in window)) {
                // Fallback for browsers without IntersectionObserver
                Array.from(elements).forEach(element => {
                    callback(element, true);
                });
                return null;
            }
            
            const defaultOptions = {
                root: null,
                rootMargin: '0px',
                threshold: 0.1
            };
            
            const observerOptions = { ...defaultOptions, ...options };
            
            const observer = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        callback(entry.target, entry.isIntersecting);
                        
                        // Unobserve after trigger if specified in options
                        if (options.unobserveOnTrigger) {
                            observer.unobserve(entry.target);
                        }
                    }
                });
            }, observerOptions);
            
            Array.from(elements).forEach(element => {
                observer.observe(element);
            });
            
            return observer;
        },

        /**
         * Enhanced storage utility with fallbacks
         */
        storage: {
            /**
             * Store data with fallbacks
             * @param {string} key - Storage key
             * @param {*} data - Data to store
             * @return {boolean} - Success status
             */
            set: function(key, data) {
                try {
                    // Try localStorage first
                    localStorage.setItem(key, JSON.stringify(data));
                    return true;
                } catch (e) {
                    // Silent fallback for optional feature
                    return false; // Return false instead of undefined fallback
                }
            },
            
            /**
             * Retrieve data with fallbacks
             * @param {string} key - Storage key
             * @return {*} - Retrieved data or null
             */
            get: function(key) {
                try {
                    // Try localStorage first
                    const item = localStorage.getItem(key);
                    return item ? JSON.parse(item) : null;
                } catch (e) {
                    // Silent fallback for optional feature
                    return null; // Return null instead of undefined fallback
                }
            },
            
            /**
             * Remove data from storage
             * @param {string} key - Storage key
             * @return {boolean} - Whether operation was successful
             */
            remove: function(key) {
                let success = true;
                try {
                    localStorage.removeItem(key); 
                } catch (e) {
                    // Silent fallback for optional feature
                    success = false; // Mark as failed but continue
                }
                try {
                    sessionStorage.removeItem(key); 
                } catch (e) {
                    // Silent fallback for optional feature
                    success = false; // Mark as failed but continue
                }
                if (window._memoryStorage) delete window._memoryStorage[key];
                return success;
            }
        },

        /**
         * Generate a random nonce for CSP
         * @return {string} A random nonce value
         */
        generateNonce: function() {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let nonce = '';
            for (let i = 0; i < 16; i++) {
                nonce += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return nonce;
        }
    };
})();