/**
 * Main Application Controller
 * 
 * Implements an enhanced MVC architecture with:
 * - DataController: Handles CSV data loading and parsing
 * - View: Manages UI rendering and user interactions
 * - FilterModule: Processes filtering logic
 * 
 * The application flow:
 * 1. Initialize core components
 * 2. Load artwork data from CSV
 * 3. Render gallery with initial batch of images
 * 4. Set up event listeners for filtering and scrolling
 * 5. Handle image loading as user scrolls
 * 
 * Browser compatibility: Chrome, Firefox, Safari, Edge
 */

/* global DataBinding, DataLoader, CONSTANTS, Failsafe */

// Define the View object FIRST, before using it
const GalleryView = {
    /**
     * Renders the gallery with the provided artworks.
     * @param {Array} artworks - Array of artwork objects to render.
     */
    renderGallery: function(artworks) {
        const galleryContainer = document.getElementById('gallery-container');
        if (!galleryContainer) {
            console.error('Gallery container not found in the DOM.');
            return;
        }

        // Clear existing content
        galleryContainer.innerHTML = '';

        // Render each artwork
        artworks.forEach(artwork => {
            const artworkElement = document.createElement('div');
            artworkElement.className = 'artwork';
            
            // Properly encode the image path
            let imagePath = artwork.imagePath;
            if (imagePath) {
                // Handle special characters - encode all problematic characters
                imagePath = imagePath.replace(/[#!$%&'()*+,;=?@[\]]/g, encodeURIComponent);
                
                // Replace spaces with %20
                imagePath = imagePath.replace(/ /g, '%20');
                
                // Replace quotes which are particularly problematic
                imagePath = imagePath.replace(/"/g, '%22');
            }
            
            artworkElement.innerHTML = `
                <img src="${imagePath}" alt="${artwork.Title || ''}" class="artwork-image">
                <h3>${artwork.Title || ''}</h3>
                <p>${artwork.Artist || ''}</p>
                <p>${artwork.Price || ''}</p>
            `;
            galleryContainer.appendChild(artworkElement);

            // Add this inside your renderGallery function
            artworkElement.querySelector('.artwork-image').onerror = function() {
                this.src = './images/placeholder.svg'; // Path to your fallback image
                this.alt = 'Image not available';
            };
        });

        console.log('Gallery rendered with', artworks.length, 'artworks.');
    }
};

// Attach View to the global window object with the new name
window.GalleryView = GalleryView;

// Now use that view in your IIFE
(function(window, document, View, DataController, ImageHandler, Storage, FilterModule, _VirtualScroll) {
    'use strict';

    // Track initialization status in a more reliable way
    window._appState = window._appState || {
        initialized: false,
        galleryContainerCreated: false,
        initTime: Date.now()
    };

    // 1. UTILITY FUNCTIONS

    // Create a simple event bus
    const EventBus = {
        events: {},
        
        on: function(event, callback) {
            if (!this.events[event]) this.events[event] = [];
            this.events[event].push(callback);
        },
        
        emit: function(event, data) {
            if (!this.events[event]) return;
            this.events[event].forEach(callback => callback(data));
        }
    };

    window.EventBus = EventBus;

    // 2. MODEL DEFINITION
    const Model = {
        // Observable state with data binding
        state: null,
        
        // Initialize the model
        init: function() {
            // Set up initial state
            const initialState = {
                // Application data will be stored here
                isLoading: false,
                items: [],
                selectedItem: null,
                settings: {
                    darkMode: false,
                    fontSize: 'medium'
                }
            };
            
            // Make state observable
            this.state = DataBinding.makeObservable(initialState);
            
            // Load any saved data
            this.loadData();
            
            return this;
        },
        
        // Method to load data using enhanced storage
        loadData: function() {
            this.state.isLoading = true;
            
            // Use the DataLoader to load artwork data
            return DataLoader.init()
                .then(artworks => {
                    this.state.artworks = artworks;
                    this.state.isLoading = false;
                    
                    // Optionally preload images
                    return ImageHandler.preloadImages(
                        artworks.map(artwork => artwork.imagePath),
                        (progress) => {
                            // Update loading progress in UI if needed
                            this.state.loadingProgress = progress * 100;
                        }
                    );
                })
                .catch(error => {
                    this.state.isLoading = false;
                    this.state.error = 'Failed to load artwork data: ' + error.message;
                    console.error('Error loading data:', error);
                    return Promise.reject(error);
                });
        },
        
        // Method to save data using enhanced storage
        saveData: function() {
            return StorageManager.save(CONSTANTS.STORAGE_KEY, this.state)
                .catch(error => {
                    Failsafe.handleError(error, 'Error saving data');
                });
        },
        
        // Example method to add an item
        addItem: function(item) {
            this.state.items = [...this.state.items, item];
            this.saveData();
        },
        
        // Example method to update settings
        updateSettings: function(settings) {
            this.state.settings = { ...this.state.settings, ...settings };
            this.saveData();
        }
    };

    // 5. INITIALIZATION
    (function setupInitialization() {
        // Only set up initialization once
        if (window._hasSetupInit) return;
        window._hasSetupInit = true;
        
        // Only initialize once, regardless of how many times events fire
        if (document.readyState === 'loading') {
            // Don't call initializeApp directly - use the Controller.init() method instead
            document.addEventListener('DOMContentLoaded', function() {
                // This ensures Controller is fully defined when initialization happens
                if (window.Controller && typeof window.Controller.init === 'function') {
                    window.Controller.init();
                } else {
                    console.error('Controller not available for initialization');
                }
            }, {once: true});
        } else {
            // DOM already loaded, initialize now if not already done
            if (!window._appState.initialized) {
                setTimeout(function() {
                    if (window.Controller && typeof window.Controller.init === 'function') {
                        window.Controller.init();
                    } else {
                        console.error('Controller not available for initialization');
                    }
                }, 0);
            }
        }
    })();

    async function initializeApp() {
        try {
            // 1. Ensure DOM structure exists first
            ensureDOMStructureExists();
            
            // 2. Initialize Model
            Model.init();
            
            // 3. Load data
            const artworks = await DataController.loadData();
            
            // 4. Initialize filters after data is loaded AND DOM exists
            FilterModule.init(artworks, {
                elements: {
                    artistList: document.getElementById('artist-filters'),
                    techniqueList: document.getElementById('technique-filters')
                    // Add other filter elements as needed
                }
            });
            
            // 5. Render initial view - use GalleryView instead of View
            GalleryView.renderGallery(artworks);
        } catch (error) {
            console.error('Initialization failed:', error);
        }
    }

    // Make sure the Controller is exposed to the window
    window.Controller = {
        init: function() {
            // Implementation...
            if (ensureDOMStructureExists()) {
                initializeApp();
            }
        },
        // Add this method to Controller
        ensureDOMStructureExists: ensureDOMStructureExists
        // Other Controller methods...
    };

    const Mediator = {
        init: function() {
            // Register for filter events
            if (window.FilterModule && typeof FilterModule.onFilterChange === 'function') {
                FilterModule.onFilterChange(this.handleFilterChange.bind(this));
            } else {
                console.error("Mediator: FilterModule or onFilterChange not available.");
            }

            // Listen for data events (using EventBus might be more consistent)
            // EventBus.on('datacontroller:complete', this.handleDataLoaded.bind(this)); // Alternative
            window.addEventListener('data:loaded', this.handleDataLoaded.bind(this));
        },

        handleFilterChange: function(filters, filteredArtworks) {
            // Update View
            if (window.GalleryView && typeof GalleryView.renderGallery === 'function') {
                GalleryView.renderGallery(filteredArtworks);
            } else {
                console.error("Mediator: GalleryView or renderGallery not available.");
            }
            // Update URL if needed
            this.updateURLWithFilters(filters);
        },
        
        handleDataLoaded: function(event) {
            if (!event || !event.detail || !event.detail.data) {
                console.error("Mediator: No data received in event");
                return;
            }
            
            const artworks = event.detail.data;
            
            // Initialize FilterModule only if it exists
            if (window.FilterModule && typeof FilterModule.init === 'function') {
                // Make sure filter-button and filter-panel elements exist
                const filterButton = document.getElementById('filter-button');
                const filterContainer = document.getElementById('filter-container');
                
                if (!filterButton) {
                    console.error("Filter button element not found in DOM");
                }
                
                if (!filterContainer) {
                    console.error("Filter container element not found in DOM");
                    // Create the filter container if it doesn't exist
                    const contentLayout = document.querySelector('.content-layout');
                    if (contentLayout) {
                        const newFilterContainer = document.createElement('div');
                        newFilterContainer.id = 'filter-container';
                        newFilterContainer.className = 'filter-panel';
                        contentLayout.appendChild(newFilterContainer);
                        console.log("Created missing filter container");
                    }
                }
                
                // Initialize with correct elements
                FilterModule.init(artworks, {
                    container: document.getElementById('filter-container'),
                    button: document.getElementById('filter-button'),
                    onChange: this.handleFilterChange.bind(this)
                });
                
                // Add explicit click handler if the module doesn't handle it
                if (filterButton) {
                    filterButton.addEventListener('click', function() {
                        const panel = document.getElementById('filter-container');
                        if (panel) {
                            panel.classList.toggle('show');
                        }
                    });
                }
            } else {
                console.error("Mediator: FilterModule or init not available for data handling.");
            }
        },
        
        // Change 'filters' to '_filters' here
        updateURLWithFilters: function(_filters) {
            // Implementation for updating URL with filter parameters
            // (method referenced but not implemented in the original code)
        }
    };

    window.Mediator = Mediator;

    // Add this function back where it was before
    function ensureDOMStructureExists() {
        const appContent = document.getElementById('app-content');
        if (!appContent) {
            console.error('Missing #app-content element');
            return false;
        }

        // Check for content-layout
        let contentLayout = document.querySelector('.content-layout');
        if (!contentLayout) {
            console.log('Creating missing .content-layout element');
            contentLayout = document.createElement('div');
            contentLayout.className = 'content-layout';
            appContent.appendChild(contentLayout);
        }

        // Check for gallery-container
        let galleryContainer = document.getElementById('gallery-container');
        if (!galleryContainer) {
            console.log('Creating missing #gallery-container element');
            galleryContainer = document.createElement('div');
            galleryContainer.id = 'gallery-container';
            galleryContainer.className = 'gallery-container';
            contentLayout.appendChild(galleryContainer);
        }

        return true;
    }

    // 6. EXPOSE TO GLOBAL SCOPE (if needed)
    window.Model = Model;
    window.GalleryView = GalleryView;
    window.Controller = Controller;
    window.Mediator = Mediator;

})(window, document, window.GalleryView, window.DataController, window.ImageHandler, window.Storage, window.FilterModule, window.VirtualScroll);