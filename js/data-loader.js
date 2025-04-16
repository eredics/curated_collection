/**
 * DataLoader Module
 * Handles fetching and loading data with advanced configuration options.
 * @version 1.1.0
 */
 
const DataLoader = (function() {
  'use strict';
    
  // Private variables
  let artworkData = [];
  let isLoaded = false;
  let progressListeners = [];
    
  // Default configuration
  const defaultConfig = {
    csvPath: './data/filtered.csv',
    placeholderImage: './images/placeholder.svg',
    imageBasePath: './images_scraped/',
    requiredFields: ['Sort', 'Title', 'Artist'], // Changed from 'ID' to 'Sort'
    enableLogging: true
  };
    
  // Current configuration
  let config = { ...defaultConfig };
    
  /**
     * Generate appropriate image path based on available data
     * @private
     * @param {Object} item - Artwork data item
     * @return {string} - Image path
     */
  const generateImagePath = function(item) {
    // If we have a filename, use it directly
    if (item.Filename) {
      return `${config.imageBasePath}${item.Filename}`;
    }
        
    // If we have an ID (or Sort), generate a filename based on available data
    if (item.Sort || item.ID) {
      const idPart = String(item.Sort || item.ID).padStart(5, '0');
      const titlePart = item.Title ? item.Title.replace(/\s+/g, '_') : 'Untitled';
      const sizePart = item.Size ? item.Size.replace(/\s+/g, '_') : 'NoSize';
      const pricePart = item.Price ? `${item.Price}` : 'NoPriceInfo';
            
      return `${config.imageBasePath}${idPart}_${titlePart}_${sizePart}_${pricePart}.jpg`;
    }
        
    // Fallback to placeholder
    return config.placeholderImage;
  };
    
  /**
     * Notify progress listeners
     * @private
     * @param {number} percentage - Progress percentage (0-100)
     * @param {string} status - Status message
     */
  const notifyProgressListeners = function(percentage, status) {
    const event = { percentage, status };
    progressListeners.forEach(listener => {
      try {
        listener(event);
      } catch (e) {
        if (config.enableLogging) {
          console.error('Error in progress listener:', e);
        }
      }
    });
  };
    
  /**
     * Load and parse CSV data
     * @private
     * @param {string} csvPath - Path to the CSV file
     * @return {Promise} - Promise resolving to parsed data
     */
  const loadCSV = function(csvPath) {
    console.log('Attempting to load CSV from:', csvPath);
  
    return new Promise((resolve, reject) => {
      // Use XMLHttpRequest instead of direct Papa.parse for better error reporting
      const xhr = new XMLHttpRequest();
      xhr.open('GET', csvPath, true);
      xhr.onload = function() {
        if (xhr.status === 200) {
          console.log('CSV file successfully fetched');
          
          // Parse the CSV text with Papa
          Papa.parse(xhr.responseText, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: function(results) {
              console.log('CSV parsing complete, rows:', results.data.length);
              if (results.errors && results.errors.length) {
                console.warn('CSV parsing had errors:', results.errors);
              }
              resolve(results.data);
            },
            error: function(error) {
              console.error('CSV parsing error:', error);
              reject(error);
            }
          });
        } else {
          console.error('Failed to load CSV, status:', xhr.status);
          reject(new Error(`Failed to load CSV: ${xhr.status}`));
        }
      };
      xhr.onerror = function() {
        console.error('Network error loading CSV');
        reject(new Error('Network error loading CSV'));
      };
      xhr.send();
    });
  };
    
  /**
     * Process loaded artwork data
     * @private
     * @param {Array} data - Raw parsed CSV data
     * @return {Array} - Processed artwork data
     */
  const processArtworkData = function(data) {
    notifyProgressListeners(98, 'Processing artwork data');
        
    return data.filter(item => {
      // Verify required fields exist
      return config.requiredFields.every(field => item[field]);
    })
      .map(item => {
        // Ensure required fields exist
        const processedItem = {
          id: item.Sort || item.ID || '', // Map Sort to id if ID doesn't exist
          title: item.Title || 'Untitled',
          artist: item.Artist || 'Unknown Artist',
          technique: item.Technique || '',
          price: item.Price || '',
          size: item.Size || '',
          framedSize: item.Framed_Size || '',
          aiDescription: item.AI_Description || '',
          fgDescription: item.FG_Description || '',
          url: item.Artwork_URL || item.URL || '', // Added support for Artwork_URL
                    
          // Generate image path using dedicated function
          imagePath: generateImagePath(item),
                    
          // Display properties
          displaySize: item.Framed_Size ? `Framed Size: ${item.Framed_Size}` : 
            (item.Size ? `Size: ${item.Size}` : '')
        };
                
        return processedItem;
      });
  };
    
  return {
    /**
         * Configure the data loader with custom options
         * @param {Object} options - Configuration options
         * @return {Object} - This instance for chaining
         */
    configure: function(options) {
      config = { ...defaultConfig, ...options };
      return this;
    },
        
    /**
         * Register a progress listener
         * @param {Function} listener - Progress event listener
         * @return {Object} - This instance for chaining
         */
    onProgress: function(listener) {
      if (typeof listener === 'function') {
        progressListeners.push(listener);
      }
      return this;
    },
        
    /**
         * Remove a progress listener
         * @param {Function} listener - Progress event listener to remove
         * @return {Object} - This instance for chaining
         */
    offProgress: function(listener) {
      progressListeners = progressListeners.filter(l => l !== listener);
      return this;
    },
        
    /**
         * Initialize data loader and load artwork data
         * @param {string} [customCsvPath] - Optional custom CSV path
         * @return {Promise} - Promise resolving when data is loaded
         */
    init: function(customCsvPath) {
      if (isLoaded) {
        return Promise.resolve(artworkData);
      }
            
      const csvPath = customCsvPath || config.csvPath;
            
      return loadCSV(csvPath)
        .then(data => {
          artworkData = processArtworkData(data);
          isLoaded = true;
          notifyProgressListeners(100, 'Data load complete');
          return artworkData;
        })
        .catch(error => {
          if (config.enableLogging) {
            console.error('Failed to load artwork data:', error);
          }
          notifyProgressListeners(100, 'Error loading data');
          return Promise.reject(error);
        });
    },
        
    /**
         * Get loaded artwork data
         * @return {Array} - Processed artwork data
         */
    getArtworks: function() {
      return [...artworkData]; // Return copy to prevent mutations
    },
        
    /**
         * Get artwork by ID
         * @param {string} id - Artwork ID
         * @return {Object|null} - Artwork object or null if not found
         */
    getArtworkById: function(id) {
      const artwork = artworkData.find(artwork => artwork.id === id);
      return artwork ? { ...artwork } : null; // Return copy to prevent mutations
    },
        
    /**
         * Check if data is loaded
         * @return {boolean} - Whether data is loaded
         */
    isDataLoaded: function() {
      return isLoaded;
    },
        
    /**
         * Reset the data loader state
         * @return {Object} - This instance for chaining
         */
    reset: function() {
      artworkData = [];
      isLoaded = false;
      return this;
    }
  };
})();

// If window.ArtGallery namespace exists, add DataLoader to it
if (window.ArtGallery) {
  window.ArtGallery.DataLoader = DataLoader;
} else {
  window.DataLoader = DataLoader; // Add this line to expose globally
}

// Add loadArtworks method for compatibility with controller.js
DataLoader.loadArtworks = function(customPath) {
  console.log('DataLoader.loadArtworks called (compatibility method)');
  return this.init(customPath);
};

console.log('DataLoader module loaded and exposed globally');