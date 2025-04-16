/**
 * Application Constants Module
 * Centralizes all string literals and configuration settings for the application
 * @version 1.1.0
 */
 
/**
 * Deep freeze an object to prevent modifications at any level
 * @param {Object} obj - Object to freeze
 * @return {Object} - Frozen object
 */
function deepFreeze(obj) {
  // Retrieve the property names defined on obj
  const propNames = Object.getOwnPropertyNames(obj);
    
  // Freeze properties before freezing self
  for (const name of propNames) {
    const value = obj[name];
        
    // Freeze the property if it's an object and not already frozen
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      deepFreeze(value);
    }
  }
    
  return Object.freeze(obj);
}

const CONSTANTS = {
  // Application settings
  APP_NAME: 'Curated Collection',
  APP_VERSION: '1.0.0',
    
  // Local storage keys
  STORAGE_KEY: 'mvc_app_data',
    
  // API endpoints (for future use)
  API: {
    BASE_URL: '' // Empty as we're using local assets only
  },
    
  // UI related constants
  UI: {
    ANIMATION_DURATION: 300, // in milliseconds
    MAX_ITEMS: 50
  },
    
  // Error messages
  ERRORS: {
    DATA_LOAD: 'Failed to load data',
    DATA_SAVE: 'Failed to save data',
    NETWORK: 'Network error occurred',
    GENERAL: 'An error occurred'
  },
    
  // CSS classes
  CLASSES: {
    ACTIVE: 'active',
    HIDDEN: 'hidden',
    ERROR: 'error',
    OFFLINE: 'offline'
  },
    
  // Failsafe system configuration
  FAILSAFE: {
    ENABLE_WATCHDOG: true,
    AUTO_INIT_FAILSAFE: true,
    ENABLE_ERROR_REPORTING: true,
    MAX_ERRORS: 10,
    REPORT_THROTTLE_MS: 10000,
    STORED_ERRORS_LIMIT: 20
  },
    
  // Feature flags
  FEATURES: {
    ENABLE_VIRTUAL_SCROLL: true,
    ENABLE_LAZY_LOADING: true,
    ENABLE_OFFLINE_MODE: true
  }
};

// Deep freeze the constants object to prevent modifications at any level
deepFreeze(CONSTANTS);

// Export to global or use namespace if available
if (window.ArtGallery) {
  window.ArtGallery.CONSTANTS = CONSTANTS;
} else {
  window.CONSTANTS = CONSTANTS;
}