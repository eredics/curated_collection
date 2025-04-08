/**
 * Failsafe module for error handling and recovery
 * Provides mechanisms to handle errors gracefully and maintain app functionality
 */

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
            } catch (e) {
                // Intentionally empty: we're testing feature availability
                // and silently falling back to alternatives
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
            } catch (e) {
                // Intentionally empty: we're testing feature availability
                // and silently falling back to alternatives
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
            } catch (e) {
                // Intentionally empty: we're testing feature availability
                // and silently falling back to alternatives
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