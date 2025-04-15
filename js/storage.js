/**
 * Storage Manager Module
 * Provides an interface for managing local storage.
 */
 
 
// eslint-disable-next-line no-redeclare
const StorageManager = (function() {
    'use strict';
    
    // Storage mechanism detection
    const isLocalStorageAvailable = (function() {
        try {
            const testKey = '_test_ls_';
            localStorage.setItem(testKey, testKey);
            localStorage.removeItem(testKey);
            return true;
        } catch (_e) {
            void _e; // Acknowledge intentional non-use
            // Error silently handled: storage operation failed but 
            // application can continue with fallback mechanism
            console.debug('Storage operation failed, using fallback');
            return false;
        }
    })();
    
    const isIndexedDBAvailable = (function() {
        return 'indexedDB' in window;
    })();
    
    // In-memory fallback when no persistent storage is available
    let memoryStorage = {};
    
    return {
        /**
         * Save data using best available storage method
         * @param {string} key - Storage key
         * @param {*} data - Data to store
         * @return {Promise} - Resolves when data is stored
         */
        save: function(key, data) {
            return new Promise((resolve, _reject) => {
                // Attempt localStorage first if available
                if (isLocalStorageAvailable) {
                    try {
                        localStorage.setItem(key, JSON.stringify(data));
                        resolve();
                        return;
                    } catch (_e) {
                        void _e; // Acknowledge intentional non-use
                        console.warn('localStorage save failed, trying IndexedDB');
                    }
                }
                
                // Next, try IndexedDB if available
                if (isIndexedDBAvailable) {
                    const request = indexedDB.open('MVCAppDatabase', 1);
                    
                    request.onupgradeneeded = function(event) {
                        const db = event.target.result;
                        if (!db.objectStoreNames.contains('appData')) {
                            db.createObjectStore('appData', { keyPath: 'id' });
                        }
                    };
                    
                    request.onsuccess = function(event) {
                        const db = event.target.result;
                        const transaction = db.transaction(['appData'], 'readwrite');
                        const store = transaction.objectStore('appData');
                        
                        const storeRequest = store.put({ id: key, value: data });
                        
                        storeRequest.onsuccess = function() {
                            resolve();
                        };
                        
                        storeRequest.onerror = function(_e) {
                            void _e; // Acknowledge intentional non-use
                            console.warn('IndexedDB save failed, using memory storage');
                            memoryStorage[key] = data;
                            resolve();
                        };
                    };
                    
                    request.onerror = function(_e) {
                        void _e; // Acknowledge intentional non-use
                        console.warn('IndexedDB open failed, using memory storage');
                        memoryStorage[key] = data;
                        resolve();
                    };
                } else {
                    // Fallback to memory storage
                    memoryStorage[key] = data;
                    resolve();
                }
            });
        },
        
        /**
         * Load data using best available storage method
         * @param {string} key - Storage key
         * @return {Promise} - Resolves with loaded data or null
         */
        load: function(key) {
            return new Promise((resolve, _reject) => {
                // Attempt localStorage first if available
                if (isLocalStorageAvailable) {
                    try {
                        const data = localStorage.getItem(key);
                        if (data !== null) {
                            resolve(JSON.parse(data));
                            return;
                        }
                    } catch (_e) {
                        void _e; // Acknowledge intentional non-use
                        console.warn('localStorage load failed, trying IndexedDB');
                    }
                }
                
                // Next, try IndexedDB if available
                if (isIndexedDBAvailable) {
                    const request = indexedDB.open('MVCAppDatabase', 1);
                    
                    request.onupgradeneeded = function(event) {
                        const db = event.target.result;
                        if (!db.objectStoreNames.contains('appData')) {
                            db.createObjectStore('appData', { keyPath: 'id' });
                        }
                    };
                    
                    request.onsuccess = function(event) {
                        const db = event.target.result;
                        const transaction = db.transaction(['appData'], 'readonly');
                        const store = transaction.objectStore('appData');
                        
                        const storeRequest = store.get(key);
                        
                        storeRequest.onsuccess = function() {
                            if (storeRequest.result) {
                                resolve(storeRequest.result.value);
                            } else {
                                // Check memory storage as last resort
                                resolve(memoryStorage[key] || null);
                            }
                        };
                        
                        storeRequest.onerror = function(_e) {
                            void _e; // Acknowledge intentional non-use
                            console.warn('IndexedDB load failed, checking memory storage');
                            resolve(memoryStorage[key] || null);
                        };
                    };
                    
                    request.onerror = function(_e) {
                        void _e; // Acknowledge intentional non-use
                        console.warn('IndexedDB open failed, checking memory storage');
                        resolve(memoryStorage[key] || null);
                    };
                } else {
                    // Fallback to memory storage
                    resolve(memoryStorage[key] || null);
                }
            });
        }
    };
})();

// Alias for easier access if needed
// eslint-disable-next-line no-unused-vars, no-redeclare
const Storage = StorageManager;

// Add this line to explicitly export it as a global
window.Storage = StorageManager;