/**
 * Data Model Module
 * Manages the application's data state.
 */
// eslint-disable-next-line no-unused-vars
const DataModel = (function() {
  'use strict';
    
  // Private data store
  let _artworks = [];
  let _isInitialized = false;
  let _dataMetadata = {
    lastUpdated: null,
    totalCount: 0,
    loadedFrom: '',
    categories: {}
  };
    
  // Event listeners
  let _eventListeners = {
    'data-changed': [],
    'data-error': [],
    'data-loading': []
  };
    
  /**
     * Trigger an event
     * @param {string} eventName - Name of the event
     * @param {*} data - Data to pass to event listeners
     */
  const triggerEvent = function(eventName, data) {
    if (!_eventListeners[eventName]) return;
        
    _eventListeners[eventName].forEach(listener => {
      try {
        listener(data);
      } catch (e) {
        console.error(`Error in DataModel event listener for '${eventName}':`, e);
      }
    });
  };
    
  /**
     * Validate artwork object
     * @param {Object} artwork - Artwork to validate
     * @return {boolean} - True if valid
     */
  const validateArtwork = function(artwork) {
    if (!artwork || typeof artwork !== 'object') return false;
        
    // Check for required properties using Object.prototype.hasOwnProperty.call
    const requiredProps = ['Sort', 'Title', 'Artist', 'Filename']; // Use actual required props from CSV
    return requiredProps.every(prop => Object.prototype.hasOwnProperty.call(artwork, prop) && artwork[prop] !== null && artwork[prop] !== ''); // New, safer way + check for non-empty
  };
    
  /**
     * Extract unique categories from artworks
     * @param {Array} artworks - Array of artwork objects
     * @return {Object} - Object containing category data
     */
  const extractCategories = function(artworks) {
    if (!Array.isArray(artworks) || artworks.length === 0) {
      return {};
    }
        
    const categories = {
      artists: new Set(),
      techniques: new Set(),
      memberships: new Set()
    };
        
    artworks.forEach(artwork => {
      if (artwork.artist) categories.artists.add(artwork.artist);
      if (artwork.technique) categories.techniques.add(artwork.technique);
      if (artwork.membership) categories.memberships.add(artwork.membership);
    });
        
    // Convert Sets to sorted arrays
    return {
      artists: [...categories.artists].sort(),
      techniques: [...categories.techniques].sort(),
      memberships: [...categories.memberships].sort()
    };
  };
    
  // Initialize event listeners for CSV loading
  const initLoadingEvents = function() {
    window.addEventListener('data-load-progress', function(e) {
      triggerEvent('data-loading', { 
        progress: e.detail.progress, 
        status: 'loading' 
      });
    });
        
    window.addEventListener('data-load-error', function(e) {
      triggerEvent('data-error', { 
        message: e.detail.message, 
        error: e.detail.error 
      });
    });
        
    window.addEventListener('data-load-failed', function(e) {
      triggerEvent('data-error', { 
        message: 'Data loading failed', 
        error: e.detail.error 
      });
    });

    window.addEventListener('data-changed', function(event) {
      try {
        // Your existing event handler code
        if (event.detail && event.detail.artworks) {
          self.setArtworks(event.detail.artworks);
        }
      } catch (error) {
        console.error('Error handling data-changed event:', error);
      }
    });
  };
    
  return {
    /**
         * Initialize the data model
         * @return {Object} - The DataModel instance for chaining
         */
    init: function() {
      _isInitialized = true;
      initLoadingEvents();
      return this;
    },
        
    /**
         * Set artworks data
         * @param {Array} artworks - Array of artwork objects
         * @return {Object} - The DataModel instance for chaining
         */
    setArtworks: function(artworks) {
      if (!Array.isArray(artworks)) {
        const error = new Error('Artworks must be an array');
        triggerEvent('data-error', { message: error.message, error });
        throw error;
      }
            
      // Validate each artwork
      const validArtworks = artworks.filter(artwork => {
        const isValid = validateArtwork(artwork);
        if (!isValid) {
          console.warn('Invalid artwork data:', artwork);
        }
        return isValid;
      });
            
      _artworks = validArtworks;
            
      // Update metadata
      _dataMetadata = {
        lastUpdated: new Date(),
        totalCount: _artworks.length,
        loadedFrom: 'csv',
        categories: extractCategories(_artworks)
      };
            
      // Notify listeners
      triggerEvent('data-changed', {
        artworks: _artworks,
        metadata: _dataMetadata
      });
            
      return this;
    },
        
    /**
         * Get all artworks
         * @return {Array} - Array of artwork objects
         */
    getArtworks: function() {
      return [..._artworks];
    },
        
    /**
         * Get data metadata
         * @return {Object} - Metadata object
         */
    getMetadata: function() {
      return { ..._dataMetadata };
    },
        
    /**
         * Get available categories for filtering
         * @return {Object} - Categories object
         */
    getCategories: function() {
      return { ..._dataMetadata.categories };
    },
        
    /**
         * Get a specific artwork by ID
         * @param {string} id - Artwork ID
         * @return {Object|null} - Artwork object or null if not found
         */
    getArtworkById: function(id) {
      return _artworks.find(artwork => artwork.id === id) || null;
    },
        
    /**
         * Filter artworks by criteria
         * @param {Function} filterFn - Filter function
         * @return {Array} - Filtered array of artworks
         */
    filterArtworks: function(filterFn) {
      if (typeof filterFn !== 'function') {
        return this.getArtworks();
      }
      return _artworks.filter(filterFn);
    },
        
    /**
         * Sort artworks by field
         * @param {string} field - Field to sort by
         * @param {boolean} ascending - Sort direction
         * @return {Array} - Sorted array of artworks
         */
    sortArtworks: function(field, ascending = true) {
      const sortedArtworks = [..._artworks];
            
      sortedArtworks.sort((a, b) => {
        // Handle numeric values
        if (typeof a[field] === 'number' && typeof b[field] === 'number') {
          return ascending ? a[field] - b[field] : b[field] - a[field];
        }
                
        // Handle string values
        const aValue = String(a[field] || '').toLowerCase();
        const bValue = String(b[field] || '').toLowerCase();
                
        return ascending ? 
          aValue.localeCompare(bValue) : 
          bValue.localeCompare(aValue);
      });
            
      return sortedArtworks;
    },
        
    /**
         * Get top-rated artworks by score
         * @param {number} limit - Maximum number to return
         * @return {Array} - Array of top-rated artworks
         */
    getTopRatedArtworks: function(limit = 10) {
      return this.sortArtworks('totalScore', false).slice(0, limit);
    },
        
    /**
         * Add event listener
         * @param {string} eventName - Name of the event
         * @param {Function} callback - Callback function
         * @return {Object} - The DataModel instance for chaining
         */
    addEventListener: function(eventName, callback) {
      if (!_eventListeners[eventName]) {
        _eventListeners[eventName] = [];
      }
            
      _eventListeners[eventName].push(callback);
      return this;
    },
        
    /**
         * Remove event listener
         * @param {string} eventName - Name of the event
         * @param {Function} callback - Callback function to remove
         * @return {Object} - The DataModel instance for chaining
         */
    removeEventListener: function(eventName, callback) {
      if (!_eventListeners[eventName]) return this;
            
      _eventListeners[eventName] = _eventListeners[eventName]
        .filter(listener => listener !== callback);
                
      return this;
    },
        
    /**
         * Check if data model is initialized
         * @return {boolean} - True if initialized
         */
    isInitialized: function() {
      return _isInitialized;
    }
  };
})();