/**
 * Performance optimizations for the application
 */
// Rename to avoid collision with built-in Performance API
const PerformanceManager = (function() {
    'use strict';
  
    return {
    /**
     * Initialize performance enhancements
     */
        init: function() {
            // Setup lazy loading
            this.setupLazyLoading();
      
            // Setup resource hints
            this.setupResourceHints();
      
            return this;
        },
    
        /**
     * Set up lazy loading for images
     */
        setupLazyLoading: function() {
            // Use IntersectionObserver if available
            if ('IntersectionObserver' in window) {
                const imageObserver = new IntersectionObserver((entries, observer) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const img = entry.target;
                            const src = img.getAttribute('data-src');
              
                            if (src) {
                                img.src = src;
                                img.removeAttribute('data-src');
                                imageObserver.unobserve(img);
                            }
                        }
                    });
                });
        
                // Observe all images with data-src
                document.querySelectorAll('img[data-src]').forEach(img => {
                    imageObserver.observe(img);
                });
            } else {
                // Fallback for browsers without IntersectionObserver
                this.setupLazyLoadingFallback();
            }
        },
    
        /**
     * Fallback lazy loading for older browsers
     */
        setupLazyLoadingFallback: function() {
            // Simple scroll-based loading
            const lazyLoadImages = function() {
                const lazyImages = document.querySelectorAll('img[data-src]');
                const scrollTop = window.pageYOffset;
        
                lazyImages.forEach(img => {
                    if (img.offsetTop < window.innerHeight + scrollTop) {
                        img.src = img.getAttribute('data-src');
                        img.removeAttribute('data-src');
                    }
                });
        
                // Clean up if all images are loaded
                if (lazyImages.length === 0) {
                    document.removeEventListener('scroll', lazyLoadImages);
                    window.removeEventListener('resize', lazyLoadImages);
                }
            };
      
            // Load images that are in view on page load
            lazyLoadImages();
      
            // Add event listeners for scrolling and resize
            document.addEventListener('scroll', Utils.debounce(lazyLoadImages, 200));
            window.addEventListener('resize', Utils.debounce(lazyLoadImages, 200));
        },
    
        /**
     * Set up resource hints for faster loading
     */
        setupResourceHints: function() {
            // Add preconnect for potential external resources
            const head = document.head;
      
            // Example: if you know you'll fetch from certain domains
            const domains = ['https://fonts.googleapis.com'];
      
            domains.forEach(domain => {
                const hint = document.createElement('link');
                hint.rel = 'preconnect';
                hint.href = domain;
                head.appendChild(hint);
            });
        }
    };
})();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    PerformanceManager.init();
});