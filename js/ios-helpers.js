/**
 * iOS-specific helper functions
 */
const iOSHelpers = (function() {
    'use strict';
    
    // Check if the device is running iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    return {
        /**
         * Initialize iOS-specific adjustments
         */
        init: function() {
            if (!isIOS) return;
            
            // Add iOS-specific class to the body
            document.body.classList.add('ios-device');
            
            // Fix for viewport height issues with keyboards
            this.setupKeyboardHandling();
            
            // Fix for iOS specific gestures
            this.setupGestureHandling();
            
            // Add viewport-fit meta to handle the notch
            this.setupViewportForNotch();
        },
        
        /**
         * Handle keyboard appearance/disappearance
         */
        setupKeyboardHandling: function() {
            // Track inputs and textareas for focus events
            const inputs = document.querySelectorAll('input, textarea');
            
            inputs.forEach(input => {
                // On focus (keyboard appears)
                input.addEventListener('focus', () => {
                    // Add class to help CSS adjustments
                    document.body.classList.add('keyboard-visible');
                    
                    // Scroll the input into view with a delay
                    setTimeout(() => {
                        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 300);
                });
                
                // On blur (keyboard disappears)
                input.addEventListener('blur', () => {
                    document.body.classList.remove('keyboard-visible');
                });
            });
        },
        
        /**
         * Handle iOS-specific gestures
         */
        setupGestureHandling: function() {
            // Prevent double-tap zoom on buttons and clickable elements
            const clickables = document.querySelectorAll('button, a, [role="button"]');
            clickables.forEach(el => {
                el.addEventListener('touchend', e => {
                    e.preventDefault();
                    // Trigger click after preventing default
                    setTimeout(() => {
                        if (document.activeElement !== el) {
                            el.click();
                        }
                    }, 0);
                });
            });
            
            // Add momentum scrolling to scrollable areas
            const scrollables = document.querySelectorAll('.scrollable');
            scrollables.forEach(el => {
                el.style.webkitOverflowScrolling = 'touch';
            });
        },
        
        /**
         * Set up viewport for devices with notches
         */
        setupViewportForNotch: function() {
            // Add or update viewport meta tag
            let viewportMeta = document.querySelector('meta[name="viewport"]');
            if (!viewportMeta) {
                viewportMeta = document.createElement('meta');
                viewportMeta.name = 'viewport';
                document.head.appendChild(viewportMeta);
            }
            
            // Add viewport-fit=cover to handle the notch
            const content = viewportMeta.getAttribute('content') || '';
            if (!content.includes('viewport-fit=cover')) {
                viewportMeta.setAttribute('content', 
                    content + (content ? ', ' : '') + 'viewport-fit=cover');
            }
        },
        
        /**
         * Fix for specific gesture on an element
         * @param {HTMLElement} element - Element to apply fixes to
         */
        fixElementGestures: function(element) {
            if (!isIOS || !element) return;
            
            // Prevent default touch behavior on this element
            element.addEventListener('touchstart', e => e.stopPropagation());
            element.addEventListener('touchmove', e => e.stopPropagation(), { passive: false });
        }
    };
})();

// Initialize iOS helpers when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    iOSHelpers.init();
});