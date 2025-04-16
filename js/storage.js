/**
 * Storage Manager Module
 * Provides an interface for managing local storage with progressive enhancement.
 * Uses localStorage → IndexedDB → memory fallback strategy.
 * @version 1.1.0
 */
 
// Renamed from StorageManager to AppStorage to avoid global conflict
const AppStorage = (function() {
  'use strict';
    
  // Configuration
  const config = {
    dbName: 'MVCAppDatabase',
    dbVersion: 1,
    storeName: 'appData',
    keyPath: 'id'
  };
    
  // Storage mechanism detection
  const isLocalStorageAvailable = (function() {
    try {
      const testKey = '_test_ls_';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      return true;
      // Use eslint-disable comment to address the unused variable
      // eslint-disable-next-line no-unused-vars
    } catch (_e) {
      // Error silently handled: storage operation failed but 
      // application can continue with fallback mechanism
      console.debug('localStorage unavailable, using fallback');
      return false;
    }
  })();
    
  const isIndexedDBAvailable = (function() {
    return 'indexedDB' in window;
  })();
    
  // In-memory fallback when no persistent storage is available
  let memoryStorage = {};
    
  /**
     * Helper function to open IndexedDB connection
     * @private
     * @returns {Promise} - Promise resolving to database connection
     */
  const openDatabase = function() {
    return new Promise((resolve, reject) => {
      if (!isIndexedDBAvailable) {
        reject(new Error('IndexedDB is not available'));
        return;
      }
            
      const request = indexedDB.open(config.dbName, config.dbVersion);
            
      request.onupgradeneeded = function(event) {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(config.storeName)) {
          db.createObjectStore(config.storeName, { keyPath: config.keyPath });
        }
      };
            
      request.onsuccess = function(event) {
        resolve(event.target.result);
      };
            
      request.onerror = function(event) {
        reject(new Error(`Failed to open database: ${event.target.error}`));
      };
    });
  };
    
  /**
     * Helper function to perform IndexedDB operations
     * @private
     * @param {string} mode - Transaction mode ('readonly' or 'readwrite')
     * @param {Function} callback - Callback to execute with store object
     * @returns {Promise} - Promise resolving to operation result
     */
  const performDatabaseOperation = function(mode, callback) {
    return openDatabase()
      .then(db => {
        return new Promise((resolve, reject) => {
          const transaction = db.transaction([config.storeName], mode);
          const store = transaction.objectStore(config.storeName);
                    
          // Execute the callback with the store object
          try {
            callback(store, resolve, reject);
          } catch (e) {
            reject(e);
          }
                    
          // Handle transaction completion
          transaction.oncomplete = function() {
            db.close();
          };
                    
          // Handle transaction errors
          transaction.onerror = function(event) {
            reject(event.target.error);
            db.close();
          };
        });
      })
      .catch(error => {
        console.warn('IndexedDB operation failed:', error.message);
        throw error;
      });
  };
    
  return {
    /**
         * Save data using best available storage method
         * @param {string} key - Storage key
         * @param {*} data - Data to store
         * @return {Promise} - Resolves when data is stored
         */
    save: function(key, data) {
      return new Promise(resolve => {
        // Attempt localStorage first if available
        if (isLocalStorageAvailable) {
          try {
            localStorage.setItem(key, JSON.stringify(data));
            resolve({ success: true, method: 'localStorage' });
            return;
          } catch (error) {
            console.warn('localStorage save failed, trying IndexedDB:', error.message);
          }
        }
                
        // Next, try IndexedDB if available
        if (isIndexedDBAvailable) {
          performDatabaseOperation('readwrite', (store, opResolve, opReject) => {
            const storeRequest = store.put({ id: key, value: data });
                        
            storeRequest.onsuccess = function() {
              opResolve({ id: key, success: true });
            };
                        
            storeRequest.onerror = function(event) {
              opReject(new Error(`Failed to write to store: ${event.target.error}`));
            };
          })
            .then(() => {
              resolve({ success: true, method: 'indexedDB' });
            })
            .catch(error => {
              console.warn('IndexedDB save failed, using memory storage:', error.message);
              memoryStorage[key] = data;
              resolve({ success: true, method: 'memory' });
            });
        } else {
          // Fallback to memory storage
          memoryStorage[key] = data;
          resolve({ success: true, method: 'memory' });
        }
      });
    },
        
    /**
         * Load data using best available storage method
         * @param {string} key - Storage key
         * @return {Promise} - Resolves with loaded data or null
         */
    load: function(key) {
      return new Promise(resolve => {
        // Attempt localStorage first if available
        if (isLocalStorageAvailable) {
          try {
            const data = localStorage.getItem(key);
            if (data !== null) {
              resolve({
                data: JSON.parse(data),
                source: 'localStorage',
                success: true
              });
              return;
            }
          } catch (error) {
            console.warn('localStorage load failed, trying IndexedDB:', error.message);
          }
        }
                
        // Next, try IndexedDB if available
        if (isIndexedDBAvailable) {
          performDatabaseOperation('readonly', (store, opResolve, opReject) => {
            const storeRequest = store.get(key);
                        
            storeRequest.onsuccess = function() {
              if (storeRequest.result) {
                opResolve(storeRequest.result.value);
              } else {
                opResolve(null);
              }
            };
                        
            storeRequest.onerror = function(event) {
              opReject(new Error(`Failed to read from store: ${event.target.error}`));
            };
          })
            .then(data => {
              if (data !== null) {
                resolve({
                  data: data,
                  source: 'indexedDB',
                  success: true
                });
              } else {
                // Check memory storage as last resort
                resolve({
                  data: memoryStorage[key] || null,
                  source: 'memory',
                  success: true
                });
              }
            })
            .catch(error => {
              console.warn('IndexedDB load failed, checking memory storage:', error.message);
              resolve({
                data: memoryStorage[key] || null,
                source: 'memory',
                success: true
              });
            });
        } else {
          // Fallback to memory storage
          resolve({
            data: memoryStorage[key] || null,
            source: 'memory',
            success: true
          });
        }
      });
    },
        
    /**
         * Delete data from all storage methods
         * @param {string} key - Storage key to delete
         * @return {Promise} - Resolves when data is deleted
         */
    remove: function(key) {
      return new Promise(resolve => {
        // Remove from localStorage if available
        if (isLocalStorageAvailable) {
          try {
            localStorage.removeItem(key);
          } catch (error) {
            console.warn('localStorage remove failed:', error.message);
          }
        }
                
        // Remove from IndexedDB if available
        if (isIndexedDBAvailable) {
          performDatabaseOperation('readwrite', (store, opResolve, opReject) => {
            const storeRequest = store.delete(key);
                        
            storeRequest.onsuccess = function() {
              opResolve(true);
            };
                        
            storeRequest.onerror = function(event) {
              opReject(new Error(`Failed to delete from store: ${event.target.error}`));
            };
          })
            .catch(error => {
              console.warn('IndexedDB remove failed:', error.message);
            });
        }
                
        // Remove from memory storage
        delete memoryStorage[key];
                
        resolve({ success: true });
      });
    },
        
    /**
         * Check if a key exists in any storage method
         * @param {string} key - Storage key to check
         * @return {Promise} - Resolves with boolean indicating existence
         */
    exists: function(key) {
      return this.load(key).then(result => {
        return result.data !== null;
      });
    },
        
    /**
         * Clear all storage methods
         * @return {Promise} - Resolves when all storage is cleared
         */
    clear: function() {
      return new Promise(resolve => {
        // Clear localStorage if available
        if (isLocalStorageAvailable) {
          try {
            localStorage.clear();
          } catch (error) {
            console.warn('localStorage clear failed:', error.message);
          }
        }
                
        // Clear IndexedDB if available
        if (isIndexedDBAvailable) {
          performDatabaseOperation('readwrite', (store, opResolve, opReject) => {
            const storeRequest = store.clear();
                        
            storeRequest.onsuccess = function() {
              opResolve(true);
            };
                        
            storeRequest.onerror = function(event) {
              opReject(new Error(`Failed to clear store: ${event.target.error}`));
            };
          })
            .catch(error => {
              console.warn('IndexedDB clear failed:', error.message);
            });
        }
                
        // Clear memory storage
        memoryStorage = {};
                
        resolve({ success: true });
      });
    }
  };
})();

// Add to ArtGallery namespace if available, otherwise expose globally
if (window.ArtGallery) {
  window.ArtGallery.Storage = AppStorage;
} else {
  window.Storage = AppStorage;
}