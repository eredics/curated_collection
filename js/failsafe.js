/* global CONSTANTS, Utils */

/**
 * Failsafe Module
 * Provides error handling and fallback mechanisms.
 */
// eslint-disable-next-line no-unused-vars
const Failsafe = (function() {
    'use strict';
    
    // Private variables
    let _errorCount = 0;
    const _maxErrors = 10;
    
    return {
        /**
         * Initialize the failsafe system
         */
        init: function() {
            // Set up global error handlers
            window.onerror = this.handleGlobalError.bind(this);
            window.addEventListener('unhandledrejection', this.handlePromiseRejection.bind(this));
            
            // Create offline notification element
            this.createOfflineNotification();
            
            // Check for localStorage availability
            this.checkLocalStorage();
            
            return this;
        },
        
        /**
         * Handle specific errors with context
         * @param {Error} error - The error object
         * @param {string} context - Description of where the error occurred
         */
        handleError: function(error, context = 'Unknown context') {
            _errorCount++;
            
            // Log the error with context
            console.error(`Error in ${context}:`, error);
            
            // If too many errors occur, perform recovery
            if (_errorCount > _maxErrors) {
                this.performRecovery();
            }
        },
        
        /**
         * Handle global uncaught errors
         * @param {string} message - Error message
         * @param {string} source - Error source
         * @param {number} lineno - Line number
         * @param {number} colno - Column number
         * @param {Error} error - Error object
         */
        handleGlobalError: function(message, source, lineno, colno, error) {
            this.handleError(error || new Error(message), `Global error at ${source}:${lineno}:${colno}`);
            
            // Return true to prevent default browser error handling
            return true;
        },
        
        /**
         * Handle unhandled Promise rejections
         * @param {PromiseRejectionEvent} event - The rejection event
         */
        handlePromiseRejection: function(event) {
            this.handleError(event.reason, 'Unhandled Promise rejection');
            
            // Prevent default handling
            event.preventDefault();
        },
        
        /**
         * Perform recovery actions when too many errors occur
         */
        performRecovery: function() {
            console.warn('Performing application recovery...');
            
            // Reset error count
            _errorCount = 0;
            
            // Clear potentially corrupted data
            try {
                // Only clear app-specific data, not all localStorage
                localStorage.removeItem(CONSTANTS.STORAGE_KEY);
            } catch (_e) {
                // Using void to indicate intentional non-use
                void _e;
                return false;
            }
            
            // Notify user
            this.showRecoveryNotification();
        },
        
        /**
         * Check if localStorage is available
         * @return {boolean} - Whether localStorage is available
         */
        checkLocalStorage: function() {
            try {
                const testKey = '_test_ls_';
                localStorage.setItem(testKey, testKey);
                localStorage.removeItem(testKey);
                return true;
            } catch (_e) {
                void _e; // Acknowledge intentional non-use
                return false;
            }
        },
        
        /**
         * Create offline notification element
         */
        createOfflineNotification: function() {
            // Create notification element if it doesn't exist
            if (!document.querySelector('.offline-indicator')) {
                const notification = document.createElement('div');
                notification.className = 'offline-indicator';
                notification.textContent = 'You are currently offline. Some features may be unavailable.';
                document.body.insertBefore(notification, document.body.firstChild);
            }
        },
        
        /**
         * Show offline notification
         */
        showOfflineNotification: function() {
            const notification = document.querySelector('.offline-indicator');
            if (notification) {
                Utils.addClass(notification, 'show');
            }
        },
        
        /**
         * Hide offline notification
         */
        hideOfflineNotification: function() {
            const notification = document.querySelector('.offline-indicator');
            if (notification) {
                Utils.removeClass(notification, 'show');
            }
        },
        
        /**
         * Show recovery notification
         */
        showRecoveryNotification: function() {
            alert('The application has recovered from an error. Some data may have been reset.');
        },

        /**
         * Comprehensive error logging with analytics
         * @param {Error} error - The error object
         * @param {string} context - Additional context
         * @param {boolean} isFatal - Whether error is fatal to application
         */
        logError: function(error, context, isFatal = false) {
            const errorInfo = {
                message: error.message,
                stack: error.stack,
                context: context,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                isFatal: isFatal
            };
            
            // Log to console
            console.error('Application Error:', errorInfo);
            
            // Store in local error log
            let errorLog = [];
            try {
                const storedLog = localStorage.getItem('errorLog');
                if (storedLog) {
                    errorLog = JSON.parse(storedLog);
                }
                
                // Keep log size manageable
                if (errorLog.length > 20) {
                    errorLog = errorLog.slice(-20);
                }
                
                errorLog.push(errorInfo);
                localStorage.setItem('errorLog', JSON.stringify(errorLog));
            } catch (_e) {
                void _e; // Acknowledge intentional non-use
                return false;
            }
            
            // If online, could send to server analytics
            if (navigator.onLine && !isFatal) {
                // Implement sending to analytics when online
            }
        },

        /**
         * Show user-friendly error notification
         * @param {string} message - User-friendly error message
         * @param {boolean} isRecoverable - Whether error is recoverable
         */
        showUserErrorNotification: function(message, isRecoverable = true) {
            // Create notification element if it doesn't exist
            if (!document.querySelector('.error-notification')) {
                const notification = document.createElement('div');
                notification.className = 'error-notification';
                
                const messageEl = document.createElement('p');
                notification.appendChild(messageEl);
                
                if (isRecoverable) {
                    const button = document.createElement('button');
                    button.textContent = 'Retry';
                    button.onclick = () => {
                        notification.remove();
                        window.location.reload();
                    };
                    notification.appendChild(button);
                }
                
                document.body.appendChild(notification);
            }
            
            // Update message
            const messageEl = document.querySelector('.error-notification p');
            messageEl.textContent = message;
            
            // Show notification
            document.querySelector('.error-notification').classList.add('show');
        }
    };
})();

/**
 * Aggressively suppress offline warnings
 */
(function suppressOfflineWarnings() {
    // Force online status
    Object.defineProperty(navigator, 'onLine', {
        get: function() {
            return true; 
        },
        configurable: true
    });
    
    // Capture and block offline events
    window.addEventListener('offline', function(_e) {
        _e.stopImmediatePropagation();
        _e.preventDefault();
        return false;
    }, true);
    
    // Find and remove offline messages periodically
    function removeOfflineMessages() {
        // Use more specific selectors instead of checking all elements
        const possibleOfflineElements = document.querySelectorAll('.offline-indicator, [class*="offline-message"]');
        possibleOfflineElements.forEach(el => {
            if (el.parentNode) {
                el.style.display = 'none';
            }
        });
        
        // Run less frequently - increase to 30 seconds
        setTimeout(removeOfflineMessages, 30000);
    }
    
    // Run once, then use setTimeout instead of setInterval
    removeOfflineMessages();
})();

/**
 * Setup watchdog to monitor application health
 */
function setupWatchdog() {
    // Use a more reasonable interval (at least 1000ms)
    const watchdogInterval = setInterval(() => {
        // Schedule the actual check during idle time
        if (window.requestIdleCallback) {
            requestIdleCallback(() => {
                checkApplicationHealth();
            }, { timeout: 10000 });
        } else {
            // Fallback to lightweight check if requestIdleCallback isn't available
            const startTime = performance.now();
            
            // Only do the full check if we have time
            if (performance.now() - startTime < 10) {
                checkApplicationHealth();
            } else {
                // Do minimal check to avoid freezing the UI
                const minimalCheck = getMinimalHealthCheck();
                if (!minimalCheck.healthy) {
                    console.warn('Minimal health check failed:', minimalCheck.reason);
                }
            }
        }
    }, 10000); // Increase interval to at least 2 seconds
    
    return watchdogInterval;
}

// Create a lightweight version of your health check
function getMinimalHealthCheck() {
    // Implement a very lightweight check that won't block the main thread
    return {
        healthy: document.getElementById('app-content') !== null,
        reason: document.getElementById('app-content') ? 'OK' : 'Missing app-content element'
    };
}