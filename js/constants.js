/**
 * Application constants
 * Centralizes all string literals and configuration settings
 */

const CONSTANTS = {
    // Application settings
    APP_NAME: 'MVC Application',
    APP_VERSION: '1.0.0',
    
    // Local storage keys
    STORAGE_KEY: 'mvc_app_data',
    
    // API endpoints (for future use)
    API: {
        BASE_URL: '', // Empty as we're using local assets only
    },
    
    // UI related constants
    UI: {
        ANIMATION_DURATION: 300, // in milliseconds
        MAX_ITEMS: 50,
    },
    
    // Error messages
    ERRORS: {
        DATA_LOAD: 'Failed to load data',
        DATA_SAVE: 'Failed to save data',
        NETWORK: 'Network error occurred',
        GENERAL: 'An error occurred',
    },
    
    // CSS classes
    CLASSES: {
        ACTIVE: 'active',
        HIDDEN: 'hidden',
        ERROR: 'error',
        OFFLINE: 'offline',
    }
};

// Freeze the constants object to prevent modifications
Object.freeze(CONSTANTS);