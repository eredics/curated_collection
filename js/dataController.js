/* global Papa, DataModel */

/**
 * Data Controller Module
 * Responsible for loading and preprocessing artwork data from CSV
 */
window.DataController = (function() {
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
    
    // Tracking state
    let _loadingState = {
        isLoading: false,
        hasError: false,
        errorMessage: '',
        progress: 0
    };
    
    /**
     * Log debug messages to console
     * @param {string} message - The message to log
     * @param {*} data - Optional data to log
     */
    const logDebug = function(message, data) {
        if (config.debug) {
            if (data) {
                console.log(`%cDataController: ${message}`, 'color: #2980b9', data);
            } else {
                console.log(`%cDataController: ${message}`, 'color: #2980b9');
            }
        }
    };
    
    /**
     * Log warnings to console
     * @param {string} message - The warning message
     * @param {*} data - Optional data to log
     */
    const logWarning = function(message, data) {
        console.warn(`%cDataController Warning: ${message}`, 'color: #f39c12', data || '');
    };
    
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
     * Validate that data contains minimum required fields
     * @param {Object} data - Data object to validate
     * @return {boolean} - True if valid
     */
    const validateData = function(data) {
        if (!data || typeof data !== 'object') {
            return false;
        }
        
        // Only require title and artist as absolute minimum
        const minimumRequiredFields = ['Title', 'Artist'];
        
        const missingFields = minimumRequiredFields.filter(field => 
            !Object.prototype.hasOwnProperty.call(data, field) || 
            data[field] === null || 
            data[field] === undefined ||
            data[field] === ''
        );
        
        return missingFields.length === 0;
    };
    
    /**
     * Sanitize a single data field
     * @param {*} value - The value to sanitize
     * @param {string} type - Expected type
     * @return {*} - Sanitized value
     */
    const sanitizeField = function(value, type) {
        if (value === null || value === undefined) {
            return type === 'string' ? '' : 
                type === 'number' ? 0 : 
                    null;
        }
        
        switch (type) {
        case 'string':
            return String(value).trim();
        case 'number':
            const num = parseFloat(value);
            return isNaN(num) ? 0 : num;
        case 'boolean':
            return Boolean(value);
        default:
            return value;
        }
    };

    // Sanitize the filename
    const sanitizeFileName = function(filename) {
        if (!filename || typeof filename !== 'string') return '';
        
        // Check if the filename is just an ID prefix with no details
        if (filename.match(/^\d{5}_$/)) {
            return ''; // Return empty for incomplete filenames
        }
        
        return filename;
    };
    
    /**
     * Preprocess a single artwork data item
     * @param {Object} item - Raw artwork data
     * @return {Object|null} - Processed artwork data
     */
    const preprocessArtwork = function(item) {
        if (!validateData(item)) {
            return null;
        }
        
        try {
            // Create processed item with required fields
            const processedItem = {
                id: sanitizeField(item.ID, 'string') || `art-${Math.random().toString(36).substr(2, 9)}`,
                title: sanitizeField(item.Title, 'string') || 'Untitled',
                artist: sanitizeField(item.Artist, 'string') || 'Unknown Artist',
                membership: sanitizeField(item.Membership, 'string'),
                technique: sanitizeField(item.Technique, 'string'),
                size: sanitizeField(item.Size, 'string'),
                framedSize: sanitizeField(item.Framed_Size, 'string'),
                price: sanitizeField(item.Price, 'string'),
                totalScore: sanitizeField(item.Total_Score, 'number'),
                
                // Additional processing
                displaySize: item.Framed_Size ? `Framed Size: ${item.Framed_Size}` : 
                    (item.Size ? `Size: ${item.Size}` : ''),
                            
                // Generate image path based on ID
                imagePath: item.Filename ? `./images_scraped/${item.Filename}` : 
                    (item.ID ? `./images_scraped/${String(item.ID).padStart(5, '0')}.jpg` : 
                        './images/placeholder.svg'),
                
                // Original data for reference
                raw: { ...item }
            };
            
            // Debug log image paths
            const debugImagePath = item.Filename ? `./images_scraped/${item.Filename}` : 
                (item.ID ? `./images_scraped/${String(item.ID).padStart(5, '0')}_${item.Title.replace(/\s+/g, '_')}_${item.Size.replace(/\s+/g, '_')}_$${item.Price}.jpg` : 
                    './images/placeholder.svg');

            console.log(`Image path for ID ${item.ID}: ${debugImagePath}`);

            const imageFileName = sanitizeFileName(item.Filename);

            processedItem.imagePath = imageFileName ? 
                `./images_scraped/${encodeURIComponent(imageFileName)}` : 
                (item.ID ? `./images_scraped/${String(item.ID).padStart(5, '0')}_${encodeURIComponent(item.Title || '')}_${encodeURIComponent(item.Size || '')}_$${encodeURIComponent(item.Price || '')}.jpg` : 
                    './images/placeholder.svg');

            return processedItem;
        } catch (error) {
            logWarning(`Failed to process artwork item: ${error.message}`, item);
            return null;
        }
    };
    
    /**
     * Load and parse CSV data
     * @param {string} csvPath - Path to the CSV file
     * @return {Promise} - Promise resolving to parsed data
     */
    const loadCSV = function(csvPath) {
        logDebug(`Loading CSV from: ${csvPath}`);
        _loadingState.isLoading = true;
        _loadingState.hasError = false;
        _loadingState.progress = 0;
        
        return new Promise((resolve, reject) => {
            if (typeof Papa === 'undefined') {
                _loadingState.isLoading = false;
                const error = new Error('PapaParse library not loaded');
                logError(error.message);
                return reject(error);
            }
            
            // First fetch the CSV file
            updateProgress(10);
            
            fetch(csvPath)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
                    }
                    updateProgress(40);
                    return response.text();
                })
                .then(csvText => {
                    // Now parse the CSV text with our parseCSV function
                    updateProgress(60);
                    
                    // Use the parseCSV function with validation
                    return parseCSV(csvText);
                })
                .then(data => {
                    updateProgress(90);
                    
                    // Check results
                    if (!data || !Array.isArray(data)) {
                        throw new Error('CSV parsing failed - invalid results format');
                    }
                    
                    updateProgress(100);
                    logDebug(`Successfully parsed ${data.length} records`);
                    resolve(data);
                })
                .catch(error => {
                    _loadingState.isLoading = false;
                    logError('Error loading or parsing CSV:', error);
                    reject(error);
                });
        });
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
                    resolve(results.data);
                },
                error: function(error) {
                    reject(error);
                }
            });
        });
    };
    
    /**
     * Process raw data into structured artwork data
     * @param {Array} rawData - Raw data from CSV
     * @return {Array} - Processed artwork data
     */
    const processData = function(rawData) {
        if (!Array.isArray(rawData)) {
            const error = new Error('Expected array of data to process');
            logError(error.message);
            throw error;
        }
        
        const processedData = rawData.map((item, index) => {
            // Add guaranteed ID
            const id = item.id || `artwork-${index + 1}`;
            
            // Fix the image path construction
            let imagePath = './images/placeholder.svg'; // Default placeholder
            let title = item.Title || item.title || 'Untitled';
            let artist = item.Artist || item.artist || 'Unknown Artist';
            
            // Extract info from filename if available
            if (item.Filename || item.filename) {
                const filename = item.Filename || item.filename;
                imagePath = `./images_scraped/${filename}`;
                
                // Try to extract title from filename if not already set
                if (title === 'Untitled' && filename.includes('_')) {
                    // Format is often: 00018_Maple Leaf
                    const parts = filename.split('_');
                    if (parts.length > 1) {
                        title = parts.slice(1).join(' ').replace(/\.[^/.]+$/, '');
                    }
                }
            } else if (item.image_path) {
                imagePath = item.image_path;
            } else if (item.title) {
                // Create filename from title if nothing else available
                const safeTitle = item.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                imagePath = `./images_scraped/${safeTitle}.jpg`; // ADD THIS LINE
            }
            
            // CRITICAL FIX: Use direct file pattern matching if nothing else matches
            if (imagePath === './images/placeholder.svg') {
                // Try direct match with ID-based filename pattern
                // Format is: 00001_Title_dimensions_price.jpg
                const paddedId = String(index + 1).padStart(5, '0');
                imagePath = `./images_scraped/${paddedId}_*.jpg`;
            }
            
            // CRITICAL: Return the processed item!
            return {
                id: id,
                title: title,
                artist: artist,
                imagePath: imagePath,
                // Copy all other properties
                ...item
            };
        });

        // IMPORTANT: Return the processed data
        return processedData;
    };
    
    return {
        /**
         * Load artwork data from CSV
         * @param {string} customPath - Optional custom CSV path
         * @return {Promise} - Promise resolving to processed data
         */
        loadData: function(customPath) {
            const csvPath = customPath || config.csvPath;
            
            return loadCSV(csvPath)
                .then(rawData => {
                    if (!Array.isArray(rawData) || rawData.length === 0) {
                        const error = new Error('No data found in CSV file');
                        logError(error.message);
                        throw error;
                    }
                    
                    const processedData = processData(rawData);
                    
                    if (processedData.length === 0) {
                        const error = new Error('No valid artwork data found after processing');
                        logError(error.message);
                        throw error;
                    }
                    
                    // Pass processed data to the DataModel
                    DataModel.setArtworks(processedData);
                    
                    return processedData;
                })
                .catch(error => {
                    logError('Failed to load artwork data', error);
                    
                    // Dispatch a failed event
                    if (typeof window.dispatchEvent === 'function') {
                        const failedEvent = new CustomEvent('data-load-failed', { 
                            detail: { error } 
                        });
                        window.dispatchEvent(failedEvent);
                    }
                    
                    throw error;
                });
        },
        
        /**
         * Get loading state
         * @return {Object} - Current loading state
         */
        getLoadingState: function() {
            return { ..._loadingState };
        },
        
        /**
         * Set debug mode
         * @param {boolean} enabled - Whether debug mode is enabled
         */
        setDebug: function(enabled) {
            config.debug = !!enabled;
            return this;
        },
        
        /**
         * Set CSV path
         * @param {string} path - Path to CSV file
         */
        setCSVPath: function(path) {
            if (typeof path === 'string' && path.trim() !== '') {
                config.csvPath = path.trim();
            }
            return this;
        }
    };
})();