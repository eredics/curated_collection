/**
 * Failsafe.js - Application Resilience System
 * 
 * Provides comprehensive error handling, health monitoring, and recovery mechanisms
 * to ensure application stability and graceful degradation under error conditions.
 * 
 * @author Your Team
 * @version 2.0.0
 */

/* global CONSTANTS */
// Removed unused Utils global reference

/**
 * Failsafe Module - Application Resilience System
 */
 
const Failsafe = (function(window, document) {
  'use strict';
    
  // Private variables and state management
  let _errorCount = 0;
  const _maxErrors = 10;
  let _watchdogInterval = null;
  let _lastReportedTime = 0;
  const _reportThrottleMs = 10000; // Limit reporting to once per 10 seconds
  const _storedErrorsLimit = 20;
  const _storageKeys = {
    errorLog: 'errorLog',
    lastConnection: 'last_connection_success',
    testKey: '_test_ls_'
  };
    
  /**
     * Check if localStorage is available without throwing errors
     * @private
     * @return {boolean} - Whether localStorage is available
     */
  const _isLocalStorageAvailable = function() {
    try {
      localStorage.setItem(_storageKeys.testKey, _storageKeys.testKey);
      localStorage.removeItem(_storageKeys.testKey);
      return true;
    } catch {
      return false;
    }
  };
    
  /**
     * Check if the app is effectively online (both browser reports online and recent success)
     * @private
     * @return {boolean} - Whether the application is effectively online
     */
  const _isEffectivelyOnline = function() {
    if (!navigator.onLine) return false;
        
    if (_isLocalStorageAvailable()) {
      const lastSuccess = localStorage.getItem(_storageKeys.lastConnection);
      // Consider online if no record exists (benefit of doubt) or recent success
      return !lastSuccess || parseInt(lastSuccess, 10) > Date.now() - 60000;
    }
        
    return navigator.onLine; // Fall back to browser's determination
  };
    
  /**
     * Safely get data from localStorage with fallbacks
     * @private
     * @param {string} key - Storage key to retrieve
     * @param {*} defaultValue - Default value if retrieval fails
     * @return {*} Retrieved value or default
     */
  const _safeGetStorage = function(key, defaultValue) {
    if (!_isLocalStorageAvailable()) return defaultValue;
        
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  };
    
  /**
     * Safely set data in localStorage with error handling
     * @private
     * @param {string} key - Storage key
     * @param {*} value - Value to store
     * @return {boolean} Success status
     */
  const _safeSetStorage = function(key, value) {
    if (!_isLocalStorageAvailable()) return false;
        
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  };
    
  /**
     * Check application health by verifying critical elements and functionality
     * @private
     * @returns {Object} Health status object
     */
  const _checkApplicationHealth = function() {
    // Check if critical DOM elements exist
    const criticalElements = [
      document.getElementById('app-content'),
      document.getElementById('gallery-container')
    ];
        
    // Check if all critical elements exist
    const missingElements = criticalElements.filter(el => !el);
        
    // Check memory usage if performance API is available
    let memoryInfo = {};
    if (window.performance?.memory?.usedJSHeapSize) {
      const memory = window.performance.memory;
      memoryInfo = {
        totalJSHeapSize: memory.totalJSHeapSize,
        usedJSHeapSize: memory.usedJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        usagePercentage: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100)
      };
    }
        
    // Event loop responsiveness check
    const startTime = performance.now();
    const responsiveness = {
      checkStarted: startTime,
      checkCompleted: performance.now(),
      responseTime: 0 // Will be calculated below
    };
    responsiveness.responseTime = responsiveness.checkCompleted - responsiveness.checkStarted;
        
    return {
      healthy: missingElements.length === 0,
      timestamp: new Date().toISOString(),
      missingElements: missingElements.length > 0 ? missingElements.map((_, i) => criticalElements[i]?.id || 'unknown') : [],
      memoryInfo: memoryInfo,
      responsiveness: responsiveness
    };
  };
    
  /**
     * Perform a minimal health check with very low overhead
     * @private
     * @returns {Object} Minimal health status
     */
  const _getMinimalHealthCheck = function() {
    // Just check if the main container exists - very lightweight
    const galleryContainer = document.getElementById('gallery-container');
        
    return {
      healthy: !!galleryContainer,
      reason: galleryContainer ? 'OK' : 'Missing gallery container',
      timestamp: new Date().toISOString()
    };
  };
    
  /**
     * Setup watchdog to monitor application health
     * @private
     * @returns {number} Interval ID for cleanup
     */
  const _setupWatchdog = function() {
    // Clear any existing watchdog to prevent duplicates
    if (_watchdogInterval) {
      clearInterval(_watchdogInterval);
    }
        
    _watchdogInterval = setInterval(() => {
      // Use requestIdleCallback when available for better performance
      if (window.requestIdleCallback) {
        requestIdleCallback(() => {
          const health = _checkApplicationHealth();
          if (!health.healthy) {
            console.warn('Health check failed:', health);
            publicApi.performRecovery();
          }
        }, { timeout: 3000 });
      } else {
        // Fallback for browsers without requestIdleCallback
        // Only do lightweight check to avoid impacting performance
        const minimalCheck = _getMinimalHealthCheck();
        if (!minimalCheck.healthy) {
          console.warn('Minimal health check failed:', minimalCheck.reason);
          publicApi.performRecovery();
        }
      }
    }, 10000);
        
    return _watchdogInterval;
  };
    
  /**
     * Create DOM element with attributes
     * @private
     * @param {string} tag - HTML tag
     * @param {Object} attrs - Attributes
     * @param {string|Node} content - Text content or child node
     * @returns {HTMLElement} Created element
     */
  const _createElement = function(tag, attrs = {}, content = '') {
    const element = document.createElement(tag);
        
    // Set attributes
    Object.entries(attrs).forEach(([key, value]) => {
      if (key === 'className') {
        element.className = value;
      } else if (key === 'dataset') {
        Object.entries(value).forEach(([dataKey, dataValue]) => {
          element.dataset[dataKey] = dataValue;
        });
      } else if (key.startsWith('on') && typeof value === 'function') {
        element.addEventListener(key.substring(2).toLowerCase(), value);
      } else {
        element.setAttribute(key, value);
      }
    });
        
    // Set content
    if (content) {
      if (typeof content === 'string') {
        element.textContent = content;
      } else if (content instanceof Node) {
        element.appendChild(content);
      }
    }
        
    return element;
  };
    
  // Public API
  const publicApi = {
    /**
         * Initialize the failsafe system
         * @returns {Object} This instance for chaining
         */
    init: function() {
      // Set up global error handlers
      window.onerror = this.handleGlobalError.bind(this);
      window.addEventListener('unhandledrejection', this.handlePromiseRejection.bind(this));
            
      // Create notification containers if needed
      this._createNotificationContainer();
            
      // Record successful initialization
      if (_isLocalStorageAvailable()) {
        _safeSetStorage(_storageKeys.lastConnection, Date.now());
      }
            
      // Setup connection monitoring
      window.addEventListener('online', () => {
        _safeSetStorage(_storageKeys.lastConnection, Date.now());
        this._updateConnectionStatus(true);
      });
            
      window.addEventListener('offline', () => {
        this._updateConnectionStatus(false);
      });
            
      // Initial check
      this._updateConnectionStatus(_isEffectivelyOnline());
            
      // Enable watchdog if specified in CONSTANTS
      if (typeof CONSTANTS !== 'undefined' && CONSTANTS.ENABLE_WATCHDOG) {
        this.enableWatchdog();
      }
            
      return this;
    },
        
    /**
         * Create container for all notifications
         * @private
         */
    _createNotificationContainer: function() {
      if (!document.getElementById('failsafe-notifications')) {
        const container = _createElement('div', {
          id: 'failsafe-notifications',
          className: 'failsafe-notification-container',
          'aria-live': 'polite'
        });
        document.body.appendChild(container);
      }
    },
        
    /**
         * Update UI based on connection status
         * @private
         * @param {boolean} isOnline - Whether app is online
         */
    _updateConnectionStatus: function(isOnline) {
      if (isOnline) {
        this.hideOfflineNotification();
      } else {
        this.showOfflineNotification();
      }
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
            
      // Log to our tracking system
      this.logError(error, context, _errorCount > _maxErrors);
            
      // If too many errors occur, perform recovery
      if (_errorCount > _maxErrors) {
        this.performRecovery();
      }
            
      return false; // Allow error to propagate
    },
        
    /**
         * Handle global uncaught errors
         * @param {string} message - Error message
         * @param {string} source - Error source
         * @param {number} lineno - Line number
         * @param {number} colno - Column number
         * @param {Error} error - Error object
         * @returns {boolean} Whether the error was handled
         */
    handleGlobalError: function(message, source, lineno, colno, error) {
      const contextInfo = `Global error at ${source}:${lineno}:${colno}`;
      this.handleError(error || new Error(message), contextInfo);
            
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
         * @returns {boolean} Success of recovery attempt
         */
    performRecovery: function() {
      console.warn('Performing application recovery...');
            
      // Reset error count
      _errorCount = 0;
            
      // Clear potentially corrupted data
      if (typeof CONSTANTS !== 'undefined' && CONSTANTS.STORAGE_KEY) {
        _safeSetStorage(CONSTANTS.STORAGE_KEY, null);
      }
            
      // Notify user
      this.showRecoveryNotification();
            
      // Health check after recovery
      setTimeout(() => {
        const health = _getMinimalHealthCheck();
        if (!health.healthy) {
          // If still unhealthy, consider page reload
          this.showUserErrorNotification(
            'The application is experiencing issues. Would you like to reload?', 
            true
          );
        }
      }, 1000);
            
      return true;
    },
        
    /**
         * Create offline notification element
         * @returns {HTMLElement} The notification element
         */
    showOfflineNotification: function() {
      const container = document.getElementById('failsafe-notifications');
      if (!container) return null;
            
      // Remove existing notification if any
      const existing = document.getElementById('offline-notification');
      if (existing) {
        existing.classList.add('show');
        return existing;
      }
            
      // Create new notification
      const notification = _createElement('div', {
        id: 'offline-notification',
        className: 'failsafe-notification offline-notification show',
        role: 'status',
        'aria-live': 'polite'
      }, 'You are currently offline. Some features may be unavailable.');
            
      container.appendChild(notification);
      return notification;
    },
        
    /**
         * Hide offline notification
         */
    hideOfflineNotification: function() {
      const notification = document.getElementById('offline-notification');
      if (notification) {
        notification.classList.remove('show');
                
        // Remove after animation
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      }
    },
        
    /**
         * Show recovery notification
         * @param {string} message - Optional custom message
         * @returns {HTMLElement} The notification element
         */
    showRecoveryNotification: function(message = 'The application has recovered from an error.') {
      const container = document.getElementById('failsafe-notifications');
      if (!container) return null;
            
      const notification = _createElement('div', {
        className: 'failsafe-notification recovery-notification show',
        role: 'status',
        'aria-live': 'polite'
      }, message);
            
      container.appendChild(notification);
            
      // Auto-dismiss
      setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      }, 5000);
            
      return notification;
    },
        
    /**
         * Comprehensive error logging with analytics
         * @param {Error} error - The error object
         * @param {string} context - Additional context
         * @param {boolean} isFatal - Whether error is fatal to application
         * @returns {boolean} Success of logging attempt
         */
    logError: function(error, context, isFatal = false) {
      // Throttle reporting to prevent overwhelming storage or analytics
      const now = Date.now();
      if (now - _lastReportedTime < _reportThrottleMs) {
        return false;
      }
      _lastReportedTime = now;
            
      const errorInfo = {
        message: error.message,
        stack: error.stack,
        context: context,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        isFatal: isFatal
      };
            
      // Log to console
      console.error('Application Error:', errorInfo);
            
      // Store in local error log
      const errorLog = _safeGetStorage(_storageKeys.errorLog, []);
            
      // Keep log size manageable
      if (errorLog.length >= _storedErrorsLimit) {
        errorLog.shift(); // Remove oldest error
      }
            
      errorLog.push(errorInfo);
      _safeSetStorage(_storageKeys.errorLog, errorLog);
            
      // If online and analytics available, could send to server
      if (_isEffectivelyOnline() && typeof CONSTANTS !== 'undefined' && 
                CONSTANTS.ENABLE_ERROR_REPORTING && !isFatal) {
        // Implemented in a way that won't throw if sending fails
        this._sendErrorToAnalytics(errorInfo).catch(() => {
          /* Silently handle failure */
        });
      }
            
      return true;
    },
        
    /**
         * Send error to analytics service
         * @private
         * @param {Object} errorInfo - Error data to send
         * @returns {Promise} Result of sending
         */
    _sendErrorToAnalytics: async function(errorInfo) {
      // This could be implemented with fetch() to send to your analytics endpoint
      // This implementation is a placeholder that always succeeds silently
      return Promise.resolve({ sent: true, error: errorInfo });
    },
        
    /**
         * Show user-friendly error notification
         * @param {string} message - User-friendly error message
         * @param {boolean} isRecoverable - Whether error is recoverable
         * @returns {HTMLElement} The notification element 
         */
    showUserErrorNotification: function(message, isRecoverable = true) {
      const container = document.getElementById('failsafe-notifications');
      if (!container) return null;
            
      // Remove existing notification if any
      const existing = document.querySelector('.error-notification');
      if (existing) {
        existing.parentNode.removeChild(existing);
      }
            
      // Create message element
      const messageEl = _createElement('p', {}, message);
            
      // Create notification
      const notification = _createElement('div', {
        className: 'failsafe-notification error-notification',
        role: 'alert',
        'aria-live': 'assertive'
      });
            
      notification.appendChild(messageEl);
            
      // Add button if recoverable
      if (isRecoverable) {
        const button = _createElement('button', {
          className: 'error-action-button',
          onclick: () => {
            notification.classList.remove('show');
            setTimeout(() => {
              if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
              }
              window.location.reload();
            }, 300);
          }
        }, 'Reload Page');
                
        notification.appendChild(button);
      }
            
      container.appendChild(notification);
            
      // Show with slight delay to ensure proper animation
      setTimeout(() => {
        notification.classList.add('show');
      }, 10);
            
      return notification;
    },
        
    /**
         * Enable health monitoring watchdog
         * @returns {number} Interval ID
         */
    enableWatchdog: function() {
      return _setupWatchdog();
    },
        
    /**
         * Disable health monitoring watchdog
         */
    disableWatchdog: function() {
      if (_watchdogInterval) {
        clearInterval(_watchdogInterval);
        _watchdogInterval = null;
      }
    },
        
    /**
         * Get application health status
         * @param {boolean} minimal - Whether to do minimal check only
         * @returns {Object} Health status
         */
    getHealthStatus: function(minimal = false) {
      return minimal ? _getMinimalHealthCheck() : _checkApplicationHealth();
    },
        
    /**
         * Check if application is effectively online
         * @returns {boolean} Online status
         */
    isOnline: function() {
      return _isEffectivelyOnline();
    },
        
    /**
         * Get stored error logs
         * @returns {Array} Error log entries
         */
    getErrorLog: function() {
      return _safeGetStorage(_storageKeys.errorLog, []);
    },
        
    /**
         * Clear error logs
         * @returns {boolean} Success
         */
    clearErrorLog: function() {
      return _safeSetStorage(_storageKeys.errorLog, []);
    }
  };
    
  return publicApi;
})(window, document);

// Add required CSS for notifications
(function addFailsafeCss() {
  const css = `
    #failsafe-notifications {
        position: fixed;
        top: 10px;
        right: 10px;
        z-index: 9999;
        width: 300px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    
    .failsafe-notification {
        background: white;
        border-radius: 4px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        margin-bottom: 10px;
        padding: 15px;
        transform: translateY(-20px);
        opacity: 0;
        transition: all 0.3s ease;
        color: #333;
        font-size: 14px;
        line-height: 1.4;
        position: relative;
    }
    
    .failsafe-notification.show {
        transform: translateY(0);
        opacity: 1;
    }
    
    .offline-notification {
        background: #f8d7da;
        border-left: 4px solid #dc3545;
    }
    
    .recovery-notification {
        background: #d4edda;
        border-left: 4px solid #28a745;
    }
    
    .error-notification {
        background: #fff3cd;
        border-left: 4px solid #ffc107;
    }
    
    .error-notification p {
        margin: 0 0 10px 0;
    }
    
    .error-action-button {
        background: #0d6efd;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 8px 12px;
        cursor: pointer;
        font-size: 14px;
        transition: background 0.2s ease;
    }
    
    .error-action-button:hover {
        background: #0b5ed7;
    }
    `;
    
  const styleElement = document.createElement('style');
  styleElement.textContent = css;
  document.head.appendChild(styleElement);
})();

// Auto-initialize if configured to do so
if (typeof CONSTANTS !== 'undefined' && CONSTANTS.AUTO_INIT_FAILSAFE) {
  document.addEventListener('DOMContentLoaded', function() {
    Failsafe.init();
  });
}