/**
 * Filter Module
 * Handles artwork filtering functionality
 */

// In filter.js - update selectors to match actual DOM IDs
// eslint-disable-next-line no-unused-vars
const FilterModule = (function() {
    // Remove unused variables

    // Keep only one state object
    const state = {
        filters: {
            artist: [],
            technique: [],
            membership: [],
            price: { min: null, max: null }
        },
        availableOptions: {
            artist: [],
            technique: [],
            membership: []
        },
        artworks: [] // Store here instead of separate variable
    };

    // Simplified interface for FilterModule
    window.FilterModule = {
        init: function(artworks, options) {
            // Accept DOM elements passed in through options
            this.elements = options?.elements || {};
        },
        getFilters: function() { /* ... */ },
        applyFilters: function() { /* ... */ },
        resetFilters: function() { /* ... */ },
        onFilterChange: function(_callback) { // <<< Add underscore
            // Register callback for filter changes
        },
        renderOptionsToList: function(filterType, selector) {
            let listElement = document.querySelector(selector);
            
            // Create element if missing
            if (!listElement) {
                const parentId = selector.replace('#', '') + '-container';
                let parent = document.getElementById(parentId) || document.getElementById('filter-panel');
                
                if (parent) {
                    listElement = document.createElement('ul');
                    listElement.id = selector.replace('#', '');
                    listElement.className = 'filter-list';
                    parent.appendChild(listElement);
                } else {
                    console.error(`Cannot create filter list - parent not found for ${selector}`);
                    return;
                }
            }
            
            // Continue rendering...
        },
        getState: function() {
            return { state: state };
        }
    };
})();