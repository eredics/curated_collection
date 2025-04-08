/**
 * iOS compatibility enhancements
 */
const iOSCompat = (function() {
    'use strict';
  
    // Detect iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  
    return {
        init: function() {
            if (!isIOS) return; // Only apply to iOS
      
            // Fix for 100vh issue on iOS (viewport height)
            this.setupViewportFix();
      
            // Setup iOS gesture handlers
            this.setupGestureHandlers();
      
            // Fix for virtual keyboard issues
            this.setupKeyboardFix();
        },
    
        // Fix for viewport height issues on iOS
        setupViewportFix: function() {
            // Immediately adjust viewport height
            this.fixViewportHeight();
      
            // Recalculate on orientation change and resize
            window.addEventListener('resize', this.fixViewportHeight);
            window.addEventListener('orientationchange', () => {
                // Small delay needed for iOS to complete orientation change
                setTimeout(this.fixViewportHeight, 300);
            });
        },
    
        // Adjust CSS variables for real viewport height
        fixViewportHeight: function() {
            // Set CSS variable to actual viewport height
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        },
    
        // Setup handlers for iOS-specific gestures
        setupGestureHandlers: function() {
            // Prevent default on common gestures
            document.addEventListener('touchstart', function(e) {
                // Prevent zooming when double-tapping inputs
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                    e.target.style.fontSize = '16px'; // Prevents zoom on focus
                }
            }, { passive: false });
      
            // Prevent pull-to-refresh
            document.body.addEventListener('touchmove', function(e) {
                if (e.touches.length > 1) {
                    e.preventDefault(); // Prevent pinch zoom
                }
            }, { passive: false });
        },
    
        // Fix for virtual keyboard issues
        setupKeyboardFix: function() {
            const inputs = document.querySelectorAll('input, textarea');
      
            inputs.forEach(input => {
                // Scroll field into view when focused
                input.addEventListener('focus', function() {
                    // Delayed scrollIntoView for iOS keyboard
                    setTimeout(() => {
                        this.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center'
                        });
                    }, 300);
                });
        
                // Reset scroll position after blur
                input.addEventListener('blur', function() {
                    window.scrollTo(0, 0);
                });
            });
        }
    };
})();

// Initialize iOS compatibility when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    iOSCompat.init();
});