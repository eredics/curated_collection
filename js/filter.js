/**
 * Filter Module
 * Handles artwork filtering functionality
 */

// Expose FilterModule to global scope
window.FilterModule = (function() {
    'use strict';
    
    // Configuration
    const config = {
        selectors: {
            artistList: '#artist-filter-list',
            techniqueList: '#technique-filter-list',
            membershipList: '#membership-filter-list',
            priceMin: '#price-min',
            priceMax: '#price-max',
            applyButton: '#filter-apply',
            resetButton: '#filter-reset'
        },
        maxOptionsPerFilter: 50, // Maximum number of filter options to show
        debounceTime: 300
    };
    
    // Private state
    const state = {
        filters: {
            artist: [],
            technique: [],
            membership: [],
            price: {
                min: null,
                max: null
            }
        },
        availableOptions: {
            artist: [],
            technique: [],
            membership: []
        }
    };
    
    /**
     * Initialize filter options from data
     * @param {Array} artworks - Array of artwork data
     */
    const initializeOptions = function(artworks) {
        if (!Array.isArray(artworks) || artworks.length === 0) {
            console.warn('No artwork data provided for filter initialization');
            return;
        }
        
        // Extract unique values for each filter type
        const artists = new Set();
        const techniques = new Set();
        const memberships = new Set();
        let minPrice = Infinity;
        let maxPrice = -Infinity;
        
        artworks.forEach(artwork => {
            // Extract artist
            if (artwork.artist) artists.add(artwork.artist);
            
            // Extract technique
            if (artwork.technique) techniques.add(artwork.technique);
            
            // Extract membership
            if (artwork.membership) memberships.add(artwork.membership);
            
            // Extract price
            if (artwork.price) {
                // Remove currency symbols and commas
                const priceValue = parseFloat(artwork.price.replace(/[$,]/g, ''));
                if (!isNaN(priceValue)) {
                    minPrice = Math.min(minPrice, priceValue);
                    maxPrice = Math.max(maxPrice, priceValue);
                }
            }
        });
        
        // Update state
        state.availableOptions.artist = Array.from(artists).sort();
        state.availableOptions.technique = Array.from(techniques).sort();
        state.availableOptions.membership = Array.from(memberships).sort();
        state.filters.price.min = minPrice === Infinity ? 0 : minPrice;
        state.filters.price.max = maxPrice === -Infinity ? 10000 : maxPrice;
        
        console.log('Filter options initialized:', state.availableOptions);
    };
    
    // Public API
    return {
        /**
         * Initialize filter module
         * @param {Array} artworks - Array of artwork data
         */
        init: function(artworks) {
            // Initialize filter options
            initializeOptions(artworks);
            
            // Render filter options to DOM
            this.renderFilterOptions();
            
            // Set up event listeners
            this.setupEventListeners();
            
            console.log('Filter module initialized');
            
            return this;
        },
        
        /**
         * Render filter options to DOM
         */
        renderFilterOptions: function() {
            // Render artist options
            this.renderOptionsToList('artist', config.selectors.artistList);
            
            // Render technique options
            this.renderOptionsToList('technique', config.selectors.techniqueList);
            
            // Render membership options
            this.renderOptionsToList('membership', config.selectors.membershipList);
            
            // Set price range inputs
            const minInput = document.querySelector(config.selectors.priceMin);
            const maxInput = document.querySelector(config.selectors.priceMax);
            
            if (minInput && state.filters.price.min !== null) {
                minInput.value = state.filters.price.min;
                minInput.placeholder = state.filters.price.min;
            }
            
            if (maxInput && state.filters.price.max !== null) {
                maxInput.value = state.filters.price.max;
                maxInput.placeholder = state.filters.price.max;
            }
        },
        
        /**
         * Render options to a filter list
         * @param {string} filterType - Type of filter (artist, technique, etc.)
         * @param {string} selector - CSS selector for the list element
         */
        renderOptionsToList: function(filterType, selector) {
            const listElement = document.querySelector(selector);
            if (!listElement) return;
            
            // Clear loading message
            listElement.innerHTML = '';
            
            // Get options for this filter
            const options = state.availableOptions[filterType] || [];
            
            // Limit number of options if needed
            const limitedOptions = options.slice(0, config.maxOptionsPerFilter);
            
            // Create HTML for each option
            const optionsHTML = limitedOptions.map(option => `
                <li class="filter-item">
                    <label class="filter-label">
                        <input type="checkbox" class="filter-checkbox" 
                               data-filter-type="${filterType}" 
                               data-filter-value="${option}"
                               ${state.filters[filterType].includes(option) ? 'checked' : ''}>
                        ${option}
                    </label>
                </li>
            `).join('');
            
            // Add options to the list
            listElement.innerHTML = optionsHTML;
            
            // If there were too many options, add a message
            if (options.length > config.maxOptionsPerFilter) {
                const moreCount = options.length - config.maxOptionsPerFilter;
                const moreMessage = document.createElement('li');
                moreMessage.className = 'filter-item filter-more';
                moreMessage.textContent = `...and ${moreCount} more`;
                listElement.appendChild(moreMessage);
            }
            
            // If no options, show a message
            if (options.length === 0) {
                listElement.innerHTML = '<li class="filter-item filter-empty">No options available</li>';
            }
        },
        
        /**
         * Setup event listeners for filter controls
         */
        setupEventListeners: function() {
            // Get filter elements
            const applyButton = document.querySelector(config.selectors.applyButton);
            const resetButton = document.querySelector(config.selectors.resetButton);
            const minInput = document.querySelector(config.selectors.priceMin);
            const maxInput = document.querySelector(config.selectors.priceMax);
            
            // Apply button click
            if (applyButton) {
                applyButton.addEventListener('click', () => {
                    this.applyFilters();
                });
            }
            
            // Reset button click
            if (resetButton) {
                resetButton.addEventListener('click', () => {
                    this.resetFilters();
                });
            }
            
            // Checkbox changes
            document.addEventListener('change', (event) => {
                if (event.target.classList.contains('filter-checkbox')) {
                    const filterType = event.target.dataset.filterType;
                    const filterValue = event.target.dataset.filterValue;
                    
                    if (filterType && filterValue) {
                        this.toggleFilter(filterType, filterValue);
                    }
                }
            });
            
            // Price inputs
            if (minInput) {
                minInput.addEventListener('change', () => {
                    const value = parseFloat(minInput.value);
                    if (!isNaN(value)) {
                        state.filters.price.min = value;
                    }
                });
            }
            
            if (maxInput) {
                maxInput.addEventListener('change', () => {
                    const value = parseFloat(maxInput.value);
                    if (!isNaN(value)) {
                        state.filters.price.max = value;
                    }
                });
            }
        },
        
        /**
         * Toggle a filter value
         * @param {string} type - Filter type
         * @param {string} value - Filter value
         */
        toggleFilter: function(type, value) {
            if (Array.isArray(state.filters[type])) {
                const index = state.filters[type].indexOf(value);
                if (index === -1) {
                    state.filters[type].push(value);
                } else {
                    state.filters[type].splice(index, 1);
                }
            }
        },
        
        /**
         * Apply current filters and dispatch event
         */
        applyFilters: function() {
            // Dispatch filter change event
            const event = new CustomEvent('filter:change', {
                detail: { filters: this.getFilters() }
            });
            window.dispatchEvent(event);
            
            console.log('Applied filters:', this.getFilters());
        },
        
        /**
         * Reset all filters to default state
         */
        resetFilters: function() {
            state.filters.artist = [];
            state.filters.technique = [];
            state.filters.membership = [];
            state.filters.price.min = null;
            state.filters.price.max = null;
            
            // Reset UI
            this.renderFilterOptions();
            
            // Apply reset filters
            this.applyFilters();
            
            console.log('Reset all filters');
        },
        
        /**
         * Get current filters
         * @returns {Object} Current filters
         */
        getFilters: function() {
            return { ...state.filters };
        },
        
        /**
         * Get available filter options
         * @returns {Object} Available options for each filter type
         */
        getAvailableOptions: function() {
            return { ...state.availableOptions };
        },
        
        /**
         * Filter artwork data based on current filters
         * @param {Array} artworks - Array of artwork data
         * @returns {Array} Filtered artwork data
         */
        applyFiltersToData: function(artworks) {
            if (!Array.isArray(artworks)) return [];
            
            return artworks.filter(artwork => {
                // Check artist filter
                if (state.filters.artist.length > 0 && 
                    !state.filters.artist.includes(artwork.artist)) {
                    return false;
                }
                
                // Check technique filter
                if (state.filters.technique.length > 0 && 
                    !state.filters.technique.includes(artwork.technique)) {
                    return false;
                }
                
                // Check membership filter
                if (state.filters.membership.length > 0 && 
                    !state.filters.membership.includes(artwork.membership)) {
                    return false;
                }
                
                // Check price filter
                if (state.filters.price.min !== null || state.filters.price.max !== null) {
                    const priceValue = parseFloat(artwork.price?.replace(/[$,]/g, ''));
                    
                    if (!isNaN(priceValue)) {
                        if (state.filters.price.min !== null && priceValue < state.filters.price.min) {
                            return false;
                        }
                        
                        if (state.filters.price.max !== null && priceValue > state.filters.price.max) {
                            return false;
                        }
                    }
                }
                
                // If passed all filters
                return true;
            });
        }
    };
})();