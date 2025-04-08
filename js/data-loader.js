/**
 * Data loading module for artwork CSV data
 */
const DataLoader = (function() {
    'use strict';
    
    // Private variables
    let artworkData = [];
    let isLoaded = false;
    
    /**
     * Load and parse CSV data
     * @param {string} csvPath - Path to the CSV file
     * @return {Promise} - Promise resolving to parsed data
     */
    const loadCSV = function(csvPath) {
        return new Promise((resolve, reject) => {
            Papa.parse(csvPath, {
                download: true,
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true,
                complete: function(results) {
                    if (results.errors && results.errors.length > 0) {
                        console.warn('CSV parsing had errors:', results.errors);
                    }
                    resolve(results.data);
                },
                error: function(error) {
                    console.error('Error parsing CSV:', error);
                    reject(error);
                }
            });
        });
    };
    
    /**
     * Process loaded artwork data
     * @param {Array} data - Raw parsed CSV data
     * @return {Array} - Processed artwork data
     */
    const processArtworkData = function(data) {
        return data.filter(item => item.ID) // First filter out items with missing IDs
            .map(item => {
                // Ensure required fields exist
                const processedItem = {
                    id: item.ID || '',
                    title: item.Title || 'Untitled',
                    artist: item.Artist || 'Unknown Artist',
                    technique: item.Technique || '',
                    price: item.Price || '',
                    size: item.Size || '',
                    framedSize: item.Framed_Size || '',
                    aiDescription: item.AI_Description || '',
                    fgDescription: item.FG_Description || '',
                    url: item.URL || '',
                    
                    // Generate image paths - add safety check for ID
                    imagePath: item.ID ? `./images_scraped/${item.ID}.jpg` : null,
                    
                    // Display properties
                    displaySize: item.Framed_Size ? `Framed Size: ${item.Framed_Size}` : 
                                (item.Size ? `Size: ${item.Size}` : '')
                };
                
                return processedItem;
            });
    };
    
    return {
        /**
         * Initialize data loader and load artwork data
         * @return {Promise} - Promise resolving when data is loaded
         */
        init: function() {
            if (isLoaded) {
                return Promise.resolve(artworkData);
            }
            
            const csvPath = './data/filtered.csv';
            return loadCSV(csvPath)
                .then(data => {
                    artworkData = processArtworkData(data);
                    isLoaded = true;
                    return artworkData;
                })
                .catch(error => {
                    console.error('Failed to load artwork data:', error);
                    return Promise.reject(error);
                });
        },
        
        /**
         * Get loaded artwork data
         * @return {Array} - Processed artwork data
         */
        getArtworks: function() {
            return artworkData;
        },
        
        /**
         * Get artwork by ID
         * @param {string} id - Artwork ID
         * @return {Object|null} - Artwork object or null if not found
         */
        getArtworkById: function(id) {
            return artworkData.find(artwork => artwork.id === id) || null;
        }
    };
})();