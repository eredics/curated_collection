// filepath: /Users/pete5553/Desktop/curated_collection/js/dataController.js
 
const DataController = (function() {
  'use strict';
    
  // Configuration
  const config = {
    // Change this to use a relative web path instead of filesystem path
    csvPath: './data/filtered.csv',
    requiredFields: [
      'Title', 'Artist', 'Membership', 'Technique', 
      'Size', 'Framed_Size', 'Price', 'Total_Score'
    ],
    debug: true,
    maxParsingErrors: 5 // Maximum number of parsing errors to continue processing
  };
    
  // Private variables that don't depend on other modules
  let _loadingState = {
    isLoading: false,
    hasError: false,
    errorMessage: '',
    progress: 0
  };

  // Define at module level outside functions
  let _loadedData = [];
    
  // Self-contained utility functions
  function logDebug(message, data) {
    if (window.DEBUG_MODE) {
      console.log(`[DataController] ${message}`, data || '');
    }
  }
    
  /**
     * Log errors to console
     * @param {string} message - The error message
     * @param {Error|*} error - Optional error object
     */
  const logError = function(message, error) {
    console.error(`%cDataController Error: ${message}`, 'color: #e74c3c; font-weight: bold', error || '');
        
    // Update loading state
    _loadingState.hasError = true;
    _loadingState.errorMessage = message;
        
    // Dispatch error event if available
    if (typeof window.dispatchEvent === 'function') {
      const errorEvent = new CustomEvent('data-load-error', { 
        detail: { message, error } 
      });
      window.dispatchEvent(errorEvent);
    }
  };
    
  /**
     * Update loading progress
     * @param {number} progress - Progress value (0-100)
     */
  const updateProgress = function(progress) {
    _loadingState.progress = Math.min(Math.max(0, progress), 100);
        
    // Dispatch progress event if available
    if (typeof window.dispatchEvent === 'function') {
      const progressEvent = new CustomEvent('data-load-progress', { 
        detail: { progress: _loadingState.progress } 
      });
      window.dispatchEvent(progressEvent);
    }
        
    logDebug(`Loading progress: ${_loadingState.progress.toFixed(0)}%`);
  };
    
  /**
     * Validates CSV headers (internal utility function)
     * @param {Array} headers - CSV headers
     * @returns {boolean} - Whether headers are valid
     * @private
     */
  const _validateHeaders = function(headers) {
    if (!Array.isArray(headers) || headers.length === 0) {
      logError('Invalid or empty CSV headers');
      return false;
    }
        
    const missingFields = config.requiredFields.filter(field => 
      !headers.includes(field)
    );
        
    if (missingFields.length > 0) {
      logError(`CSV is missing required fields: ${missingFields.join(', ')}`);
      return false;
    }
        
    return true;
  };
    
  /**
     * Parse CSV data with validation
     * @param {string} csvData - CSV data as string
     * @return {Promise} - Promise resolving to parsed data
     */
  const parseCSV = function(csvData) {
    return new Promise((resolve, reject) => {
      Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
          // Add header validation
          if (results.meta && results.meta.fields) {
            if (!_validateHeaders(results.meta.fields)) {
              reject(new Error('Invalid CSV headers'));
              return;
            }
          }
                    
          // Process the data
          const artworks = results.data.map((row, index) => {
            const { ID, Title, Artist, Technique, Price, Size, Filename } = row;
            // *** Ensure trim() is applied and handle potential null/undefined ***
            const filenameFromCSV = (Filename || row.filename || '').toString().trim();

            // Ensure filename is valid before constructing path
            const imagePathToAssign = filenameFromCSV ? `./images_scraped/${filenameFromCSV}` : './images/placeholder.svg';

            if (index < 10 || filenameFromCSV.includes('#') || filenameFromCSV.endsWith(' ')) { // Log more cases
              console.log(`[DataController Map ${index}] Filename: "${filenameFromCSV}", Assigning imagePath: ${imagePathToAssign}`);
            }

            // Return a more complete object needed by other parts
            return {
              id: ID || row.id || `art-${index}`,
              title: Title || row.title || 'Untitled',
              artist: Artist || row.artist || 'Unknown Artist',
              technique: Technique || '',
              price: Price || '', // Ensure price is read correctly
              size: Size || '',
              imagePath: imagePathToAssign // Assign the potentially corrected path
            };
          });
          resolve(artworks);
        },
        error: function(error) {
          reject(error);
        }
      });
    });
  };

  // Return a clean public API
  return {
    /**
         * Load artwork data - core functionality
         * @returns {Promise} - Promise resolving to artwork data
         */
    loadData: function() {
      _loadingState.isLoading = true;
      _loadingState.progress = 0;
      updateProgress(10);

      return fetch(config.csvPath)
        .then(response => {
          if (!response.ok) throw new Error(`Failed to fetch CSV: ${response.status}`);
          updateProgress(30); // <<< Add call here
          return response.text();
        })
        .then(csvText => {
          updateProgress(50); // <<< Ensure this call is present
          return parseCSV(csvText); // Use your existing parseCSV function
        })
        .then(data => {
          updateProgress(90); // <<< Ensure this call is present

          _loadedData = data; 

          _loadingState.isLoading = false;
          _loadingState.progress = 100;
          updateProgress(100); // <<< Add final call here

          // Dispatch completion event (optional but good practice)
          if (typeof window.dispatchEvent === 'function') {
            const completeEvent = new CustomEvent('datacontroller:load-complete', {
              detail: { artworks: _loadedData }
            });
            window.dispatchEvent(completeEvent);
          }

          logDebug(`Data load complete. ${_loadedData.length} artworks processed.`);
          return _loadedData;
        })
        .catch(error => {
          _loadingState.isLoading = false;
          _loadingState.hasError = true;
          _loadingState.errorMessage = error.message;
          logError('Error during data loading pipeline:', error); // Log the error
          updateProgress(0); // <<< Optional: Reset progress on error
          // Dispatch error event (optional)
          if (typeof window.dispatchEvent === 'function') {
            const errorEvent = new CustomEvent('datacontroller:load-error', {
              detail: { error: error }
            });
            window.dispatchEvent(errorEvent);
          }
          // It's often better to let the caller handle the error, so re-throw or return a rejected Promise
          // throw error; // Option 1: Re-throw
          return Promise.reject(error); // Option 2: Return rejected promise
        });
    },
        
    /**
         * Get current loading state - doesn't modify anything
         * @returns {Object} Loading state object (copy)
         */
    getLoadingState: function() {
      // Return copy to prevent modification
      return { ..._loadingState };
    },

    // Add this method to DataController's public API
    getLoadedData: function() {
      return _loadedData || []; // Return the loaded CSV data or empty array
    },

    renderArtwork: function(artwork) {
      let imagePath = artwork.imagePath || './images/placeholder.svg';

      // Ensure the filename part is properly encoded for direct use in src
      if (imagePath !== './images/placeholder.svg' && imagePath.startsWith('./images_scraped/')) {
        try {
          const parts = imagePath.split('/');
          // Decode first in case it's already partially encoded, then re-encode fully
          const filename = encodeURIComponent(decodeURIComponent(parts.pop() || ''));
          imagePath = parts.join('/') + '/' + filename;
        } catch (e) {
          console.error(`Error encoding image path in renderArtwork: ${imagePath}`, e);
          imagePath = './images/placeholder.svg'; // Fallback on encoding error
        }
      }

      return `
                <article class="artwork" data-id="${artwork.id || ''}">
                    <div class="artwork-image-container">
                        <img
                            src="${imagePath}"
                            alt="${artwork.title || ''}"
                            class="artwork-image"
                            onerror="this.onerror=null; this.src='./images/placeholder.svg';"
                        />
                    </div>
                    <div class="artwork-details">
                        <h3 class="artwork-title">${artwork.title || 'Untitled'}</h3>
                        <p class="artwork-artist">${artwork.artist || 'Unknown Artist'}</p>
                        <p class="artwork-technique">${artwork.technique || ''}</p>
                        <p class="artwork-price">${artwork.price ? `$${artwork.price}` : ''}</p>
                    </div>
                </article>
            `;
    }
  };
})();

window.DataController = DataController;