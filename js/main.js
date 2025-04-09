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

/* global DataLoader, ImageHandler, DataController, FilterModule, VirtualScroll */

(function() {
    'use strict';

    // Track initialization status in a more reliable way
    window._appState = window._appState || {
        initialized: false,
        galleryContainerCreated: false,
        initTime: Date.now()
    };

    // More aggressive offline prevention for development
    (function() {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            // Override navigator.onLine
            Object.defineProperty(navigator, 'onLine', {
                get: function() {
                    return true; 
                },
                configurable: true
            });
            
            // Prevent offline events
            const preventOffline = function(e) {
                e.stopImmediatePropagation();
                e.preventDefault();
                console.log('Prevented offline mode in development');
                return false;
            };
            
            window.addEventListener('offline', preventOffline, true);
            
            // Find and remove any offline warning messages
            setTimeout(function removeOfflineWarnings() {
                const messages = document.querySelectorAll('.offline-warning, [data-offline="true"], .offline-message');
                messages.forEach(el => el.remove());
                
                // Also check for text content
                document.querySelectorAll('*').forEach(el => {
                    if (el.textContent && el.textContent.includes('You are currently offline')) {
                        el.style.display = 'none';
                    }
                });
                
                // Repeat check after a delay (in case warnings appear after initial load)
                setTimeout(removeOfflineWarnings, 2000);
            }, 500);
        }
    })();

    // 1. UTILITY FUNCTIONS

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

    // 3. VIEW DEFINITION 
    const View = {
        // Components collection
        components: {},
        
        // Elements cache
        elements: {},
        
        // Initialize the view
        init: function() {
            // Create component structure
            this.initComponents();
            
            // Cache DOM elements for performance
            this.cacheElements();
            
            return this;
        },
        
        // Initialize view components
        initComponents: function() {
            // Create header component
            this.components.header = {
                render: function(container, state) {
                    container.innerHTML = `
                        <h1>${CONSTANTS.APP_NAME}</h1>
                        <div class="header-controls">
                            <button id="settings-toggle" aria-label="Settings">
                                <span class="icon">⚙️</span>
                            </button>
                        </div>
                    `;
                }
            };
            
            // Create content component
            this.components.content = {
                render: function(container, state) {
                    // Show loading indicator if loading
                    if (state.isLoading) {
                        container.innerHTML = '<div class="loading-spinner">Loading...</div>';
                        return;
                    }
                    
                    // Render items list
                    container.innerHTML = `
                        <div class="items-container ${state.settings.darkMode ? 'dark-mode' : ''}">
                            <ul class="items-list">
                                ${state.items.map((item, index) => `
                                    <li class="item ${state.selectedItem === index ? 'selected' : ''}" 
                                        data-index="${index}">
                                        ${item.name}
                                    </li>
                                `).join('')}
                            </ul>
                            ${state.items.length === 0 ? 
        '<div class="empty-state">No items available</div>' : ''}
                        </div>
                    `;
                }
            };
            
            // Create footer component
            this.components.footer = {
                render: function(container, state) {
                    container.innerHTML = `
                        <p>&copy; ${new Date().getFullYear()} | 
                           Font size: 
                           <select id="font-size-picker">
                               <option value="small" ${state.settings.fontSize === 'small' ? 'selected' : ''}>Small</option>
                               <option value="medium" ${state.settings.fontSize === 'medium' ? 'selected' : ''}>Medium</option>
                               <option value="large" ${state.settings.fontSize === 'large' ? 'selected' : ''}>Large</option>
                           </select>
                           <label class="switch">
                               <input type="checkbox" id="dark-mode-toggle" ${state.settings.darkMode ? 'checked' : ''}>
                               <span class="slider">Dark mode</span>
                           </label>
                        </p>
                    `;
                }
            };
        },
        
        // Cache DOM elements
        cacheElements: function() {
            this.elements.header = document.getElementById('app-header');
            this.elements.content = document.getElementById('app-content');
            this.elements.footer = document.getElementById('app-footer');
            this.elements.app = document.getElementById('app');
        },
        
        // Render the UI based on current state
        render: function(state) {
            // Apply font size to app container
            this.elements.app.setAttribute('data-font-size', state.settings.fontSize);
            
            // Apply dark mode if enabled
            if (state.settings.darkMode) {
                document.body.classList.add('dark-mode');
            } else {
                document.body.classList.remove('dark-mode');
            }
            
            // Render each component
            this.components.header.render(this.elements.header, state);
            this.components.content.render(this.elements.content, state);
            this.components.footer.render(this.elements.footer, state);
        },

        // Update the renderArtwork method in View object for a cleaner structure

        renderArtwork: function(artwork) {
            // Ensure image paths are properly URL-encoded
            const safeImagePath = artwork.imagePath ? 
                artwork.imagePath.includes('%') ? artwork.imagePath : encodeURI(artwork.imagePath) 
                : './images/placeholder.svg';

            return `
                <article class="artwork" data-id="${artwork.id}">
                    <div class="artwork-image-container" style="aspect-ratio: ${artwork.aspectRatio || '1 / 1'}">
                        <img 
                            src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'></svg>" 
                            data-src="${safeImagePath}" 
                            alt="${artwork.title} by ${artwork.artist}" 
                            class="artwork-image"
                            loading="lazy"
                            onerror="this.onerror=null; this.src='./images/placeholder.svg';"
                        />
                        <div class="loading-indicator"></div>
                    </div>
                    
                    <!-- Rest of your artwork card structure -->
                    <div class="artwork-details">
                        <h3 class="artwork-title">${artwork.title}</h3>
                        <p class="artwork-artist">${artwork.artist}</p>
                        <!-- Caption toggle and other elements -->
                        <div class="caption-details">
                            ${artwork.technique ? `<p class="artwork-technique">${artwork.technique}</p>` : ''}
                            ${artwork.size ? `<p class="artwork-size">Dimensions: ${artwork.size}</p>` : ''}
                            ${artwork.framedSize ? `<p class="artwork-framed-size">Framed: ${artwork.framedSize}</p>` : ''}
                            ${artwork.price ? `<p class="artwork-price">Price: ${artwork.price}</p>` : ''}
                        </div>
                    </div>
                </article>
            `;
        },

        // Update image rendering in your template:

        renderArtwork: function(artwork) {
            return `
                <article class="artwork" data-id="${artwork.id}">
                    <div class="artwork-image-container">
                        <!-- Add low-quality placeholder image -->
                        <img 
                            src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzIDIiPjxyZWN0IHdpZHRoPSIzIiBoZWlnaHQ9IjIiIGZpbGw9IiNlZWUiLz48L3N2Zz4=" 
                            data-src="${artwork.imagePath}" 
                            alt="${artwork.title} by ${artwork.artist}" 
                            class="artwork-image"
                            width="300" 
                            height="300"
                            loading="lazy"
                            onerror="this.onerror=null; this.src='./images/placeholder.svg';"
                        />
                        <div class="loading-indicator"></div>
                    </div>
                    <!-- Rest of your artwork card structure -->
                </article>
            `;
        },

        // Add this new method for caption toggling
        initCaptionToggles: function() {
            document.querySelectorAll('.caption-toggle').forEach(button => {
                button.addEventListener('click', function(e) {
                    e.preventDefault(); // Prevent link navigation when clicking the button
                    e.stopPropagation(); // Prevent event bubbling to parent link
                    
                    const artwork = this.closest('.artwork');
                    artwork.classList.toggle('caption-expanded');
                    
                    // Update aria-expanded attribute for accessibility
                    const isExpanded = artwork.classList.contains('caption-expanded');
                    this.setAttribute('aria-expanded', isExpanded);
                });
            });
        },

        /**
         * Show loading indicator with progress
         * @param {number} progress - Loading progress (0-100)
         */
        showLoading: function(progress) {
            const appContent = document.getElementById('app-content');
            if (!appContent) return;
            
            // Check if loading indicator already exists
            let loadingEl = document.getElementById('data-loading-indicator');
            
            if (!loadingEl) {
                // Create loading indicator
                loadingEl = document.createElement('div');
                loadingEl.id = 'data-loading-indicator';
                loadingEl.className = 'data-loading-container';
                loadingEl.setAttribute('role', 'status');
                loadingEl.setAttribute('aria-live', 'polite');
                
                loadingEl.innerHTML = `
                    <div class="data-loading-spinner"></div>
                    <div class="data-loading-text">Loading artwork data...</div>
                    <div class="data-loading-progress">
                        <div class="data-loading-progress-bar" style="width: ${progress || 0}%"></div>
                    </div>
                `;
                
                appContent.innerHTML = '';
                appContent.appendChild(loadingEl);
            } else {
                // Update existing progress bar
                const progressBar = loadingEl.querySelector('.data-loading-progress-bar');
                if (progressBar && typeof progress === 'number') {
                    progressBar.style.width = `${progress}%`;
                }
            }
        },

        /**
         * Hide loading indicator
         */
        hideLoading: function() {
            const loadingEl = document.getElementById('data-loading-indicator');
            if (loadingEl) {
                loadingEl.classList.add('fade-out');
                setTimeout(() => {
                    if (loadingEl.parentNode) {
                        loadingEl.parentNode.removeChild(loadingEl);
                    }
                }, 500); // Match fade-out animation duration
            }
        },

        /**
         * Show error message
         * @param {string} message - Error message to display
         */
        showError: function(message) {
            const appContent = document.getElementById('app-content');
            if (!appContent) return;
            
            this.hideLoading();
            
            const errorEl = document.createElement('div');
            errorEl.className = 'data-error-container';
            errorEl.setAttribute('role', 'alert');
            
            errorEl.innerHTML = `
                <div class="data-error-icon">⚠️</div>
                <div class="data-error-message">${message || 'An error occurred while loading data.'}</div>
                <button class="data-error-retry">Retry</button>
            `;
            
            appContent.innerHTML = '';
            appContent.appendChild(errorEl);
            
            // Add retry button click handler
            const retryButton = errorEl.querySelector('.data-error-retry');
            if (retryButton) {
                retryButton.addEventListener('click', function() {
                    Controller.loadData();
                });
            }
        },

        /**
         * Setup keyboard navigation for gallery items
         */
        setupKeyboardNavigation: function() {
            // Get all artwork elements
            const artworkElements = document.querySelectorAll('.artwork');
            
            // Add keyboard navigation
            artworkElements.forEach(artwork => {
                artwork.addEventListener('keydown', function(e) {
                    // Handle Enter or Space to toggle caption
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        const toggleButton = this.querySelector('.caption-toggle');
                        if (toggleButton) {
                            toggleButton.click();
                        }
                    }
                });
            });
            
            // Log completion
            console.log('Keyboard navigation set up for', artworkElements.length, 'gallery items');
        },

        /**
         * Setup interactive behavior for artwork items
         */
        setupArtworkInteractions: function() {
            // Find all toggle buttons
            const toggleButtons = document.querySelectorAll('.caption-toggle');
            
            // Add click handlers to toggle buttons
            toggleButtons.forEach(button => {
                button.addEventListener('click', function() {
                    // Find the parent artwork element
                    const artwork = this.closest('.artwork');
                    if (!artwork) return;
                    
                    // Find the caption details element
                    const details = artwork.querySelector('.caption-details');
                    if (!details) return;
                    
                    // Toggle expanded state
                    const isExpanded = details.classList.toggle('expanded');
                    
                    // Update accessibility attributes
                    this.setAttribute('aria-expanded', isExpanded);
                    
                    // Update the toggle icon
                    const icon = this.querySelector('.caption-toggle-icon');
                    if (icon) {
                        icon.textContent = isExpanded ? '▲' : '▼';
                    }
                });
            });
            
            // Make artwork items focusable with keyboard
            document.querySelectorAll('.artwork').forEach(artwork => {
                artwork.setAttribute('tabindex', '0');
                
                // Add keyboard support
                artwork.addEventListener('keydown', function(e) {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        const toggle = this.querySelector('.caption-toggle');
                        if (toggle) toggle.click();
                    }
                });
            });
            
            return this; // For method chaining
        },

        // Add this method to your View object:
        initializeImageLoading: function() {
            console.log('Initializing image loading');
            
            // Use multiple selectors to find all possible images
            const images = document.querySelectorAll(
                'img[data-src]:not(.loaded), ' + 
                '.artwork-image:not(.loaded), ' +
                '.gallery-container img:not(.loaded)'
            );
            
            console.log(`Found ${images.length} images to load`);
            
            // If no images found or VirtualScroll is handling them, don't continue
            if (images.length === 0 || window.VirtualScroll) {
                console.log('No images to load or VirtualScroll is handling image loading');
                return;
            }
            
            // Load images in batches of 5
            let index = 0;
            const batchSize = 5;
            
            function loadNextBatch() {
                const endIndex = Math.min(index + batchSize, images.length);
                
                for (let i = index; i < endIndex; i++) {
                    const img = images[i];
                    const dataSrc = img.getAttribute('data-src');
                    
                    if (!dataSrc) continue;
                    
                    // Create image loader
                    const imgLoader = new Image();
                    
                    imgLoader.onload = function() {
                        img.src = dataSrc;
                        img.classList.add('loaded');
                        img.classList.remove('loading-image');
                        
                        // Hide loading indicator if present
                        const container = img.closest('.artwork-image-container');
                        if (container) {
                            const indicator = container.querySelector('.loading-indicator');
                            if (indicator) indicator.style.display = 'none';
                        }
                    };
                    
                    imgLoader.onerror = function() {
                        console.warn(`Failed to load image: ${dataSrc}`);
                        img.classList.add('error');
                    };
                    
                    // Begin loading
                    imgLoader.src = dataSrc;
                }
                
                // Load next batch if there are more images
                index = endIndex;
                if (index < images.length) {
                    setTimeout(loadNextBatch, 200);
                }
            }
            
            // Start loading first batch
            loadNextBatch();
        },

        /**
         * Render artwork gallery with virtual scrolling support
         * @param {Array} artworks - Array of artwork objects to display
         */
        renderGallery: function(artworks) {
            console.log(`Rendering gallery with ${artworks.length} artworks`);
            
            // Find or create gallery container
            let galleryContainer = document.getElementById('gallery-container');
            
            if (!galleryContainer) {
                // Only log this once and track when it happens
                if (!window._appState.galleryContainerCreated) {
                    console.log('Creating gallery container (first time)');
                    window._appState.galleryContainerCreated = true;
                }
                
                // Rest of your container creation code...
                const contentLayout = document.querySelector('.content-layout');
                const appContent = document.getElementById('app-content');
                const app = document.getElementById('app');
                
                // Use whichever container is available
                const parentContainer = contentLayout || appContent || app || document.body;
                
                // Create gallery container
                galleryContainer = document.createElement('div');
                galleryContainer.id = 'gallery-container';
                galleryContainer.className = 'gallery-container';
                
                // Append to parent
                parentContainer.appendChild(galleryContainer);
            }
            
            // Clear existing content
            galleryContainer.innerHTML = '';
            
            // Check if we have artworks
            if (!artworks || !artworks.length) {
                galleryContainer.innerHTML = '<div class="no-results">No artworks found matching your criteria.</div>';
                return;
            }
            
            // Debug VirtualScroll availability
            console.log('VirtualScroll available:', typeof window.VirtualScroll !== 'undefined');
            
            // Use VirtualScroll if available
            if (window.VirtualScroll && typeof window.VirtualScroll.init === 'function') {
                console.log('Using VirtualScroll to render items');
                VirtualScroll.init(galleryContainer, artworks);
            } else {
                console.log('VirtualScroll module not available - falling back to basic rendering');
                
                // Force the use of our basic flexbox rendering that works well
                console.log(`Rendering gallery with flexbox layout (${artworks.length} items)`);
                
                // Clear the container
                galleryContainer.innerHTML = '';
                
                // Apply the proven working styles
                galleryContainer.style.cssText = `
                    display: flex !important;
                    flex-wrap: wrap !important;
                    gap: 8px !important;
                    padding: 0 !important;
                    margin: 0 !important;
                `;
                
                // Basic rendering - just show first 20 items
                const maxItems = Math.min(20, artworks.length);
                console.log(`Rendering first ${maxItems} of ${artworks.length} items in basic mode`);
                
                for (let i = 0; i < maxItems; i++) {
                    const artwork = artworks[i];
                    const element = document.createElement('div');
                    element.className = 'artwork';
                    element.setAttribute('data-id', artwork.id || `art-${i}`);
                    
                    element.innerHTML = `
                        <div class="artwork-image-container">
                            <img 
                                class="artwork-image loading-image" 
                                src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzIDIiPjxyZWN0IHdpZHRoPSIzIiBoZWlnaHQ9IjIiIGZpbGw9IiNlZWUiLz48L3N2Zz4=" 
                                data-src="${artwork.imagePath}" 
                                alt="${artwork.title || 'Artwork'} by ${artwork.artist || 'Unknown Artist'}"
                                width="200"
                                height="200"
                            >
                            <div class="loading-indicator">
                                <div class="spinner"></div>
                            </div>
                        </div>
                        <div class="artwork-details">
                            <h3 class="artwork-title">${artwork.title || 'Untitled'}</h3>
                            <p class="artwork-artist">${artwork.artist || 'Unknown Artist'}</p>
                            ${artwork.price ? `<p class="artwork-price">$${artwork.price}</p>` : ''}
                        </div>
                    `;
                    
                    galleryContainer.appendChild(element);
                }
            }
            
            // After rendering, initialize image loading with slight delay
            setTimeout(() => {
                this.initializeImageLoading();
            }, 500);
            
            console.log(`Gallery rendered with ${galleryContainer.children.length} items`);

            // Ensure content-layout exists
            let contentLayout = document.querySelector('.content-layout');
            if (!contentLayout) {
                console.log('Creating missing content-layout container');
                contentLayout = document.createElement('div');
                contentLayout.className = 'content-layout';
                
                const appContent = document.getElementById('app-content');
                if (appContent) {
                    // Either insert as first child or wrap existing content
                    if (appContent.children.length > 0) {
                        // Wrap existing content
                        while (appContent.children.length > 0) {
                            contentLayout.appendChild(appContent.children[0]);
                        }
                    }
                    appContent.appendChild(contentLayout);
                }
            }
        }
    };
    
    // 4. CONTROLLER DEFINITION
    const Controller = (function() {
        // Private variables - inside the IIFE, not the object literal
        let allArtworks = [];
        
        // Return the public API with all methods as properties
        return {
            /**
             * Initialize the application
             */
            init: function() {
                // Prevent multiple initialization
                if (this._initialized) {
                    console.log('Controller already initialized, skipping');
                    return;
                }
                this._initialized = true;
                
                console.log('Initializing application');
                
                // Initialize filter toggle FIRST
                this.initFilterToggle();
                
                // Then load data
                this.loadData()
                    .catch(error => {
                        console.error('Failed to initialize application:', error);
                    });
            },
            
            /**
             * Initialize filter toggle functionality
             */
            initFilterToggle: function() {
                console.log('Initializing filter toggle functionality');
                
                const toggleButton = document.getElementById('toggle-filters');
                const filterPanel = document.getElementById('filter-panel');
                
                if (!toggleButton || !filterPanel) {
                    console.error('Filter toggle elements not found');
                    return;
                }
                
                console.log('Filter toggle elements found');
                
                // Set initial state (collapsed by default)
                toggleButton.setAttribute('aria-expanded', 'false');
                
                toggleButton.addEventListener('click', function() {
                    // Get current state
                    const isExpanded = toggleButton.getAttribute('aria-expanded') === 'true';
                    
                    // Toggle state
                    const newState = !isExpanded;
                    
                    // Update button state
                    toggleButton.setAttribute('aria-expanded', newState);
                    
                    // Update filter panel visibility
                    if (newState) {
                        filterPanel.classList.remove('collapsed');
                    } else {
                        filterPanel.classList.add('collapsed');
                    }
                    
                    // Announce to screen readers
                    const message = newState ? 'Filter panel expanded' : 'Filter panel collapsed';
                    const announcer = document.getElementById('sr-announcer');
                    if (announcer) announcer.textContent = message;
                    
                    console.log(message);
                });
            },
            
            /**
             * Load artwork data
             */
            loadData: function() {
                console.log('Loading artwork data');
                
                // Flag to prevent duplicate render calls
                if (this._isLoading) {
                    console.warn('Data loading already in progress');
                    return Promise.resolve();
                }
                
                this._isLoading = true;
                
                // Show loading indicator
                if (View.showLoading) {
                    View.showLoading(0);
                }
                
                return DataController.loadData()
                    .then(artworks => {
                        this._isLoading = false;
                        
                        // Hide loading indicator
                        if (View.hideLoading) {
                            View.hideLoading();
                        }
                        
                        // Store artwork data
                        allArtworks = artworks;
                        this.allArtworks = artworks;
                        
                        // Initialize filters
                        this.initFilters(artworks);
                        
                        // Only render gallery once
                        if (View.renderGallery) {
                            View.renderGallery(artworks);
                        } else {
                            console.error('View.renderGallery not found');
                        }
                        
                        return artworks;
                    })
                    .catch(error => {
                        this._isLoading = false;
                        console.error('Failed to load data:', error);
                        if (View.showError) {
                            View.showError('Failed to load artwork data');
                        }
                        throw error;
                    });
            },
            
            /**
             * Initialize filter module
             */
            initFilters: function(artworks) {
                if (typeof FilterModule !== 'undefined' && FilterModule.init) {
                    console.log('Initializing filter module');
                    FilterModule.init(artworks);
                    
                    // Listen for filter changes
                    window.addEventListener('filter:change', (event) => {
                        try {
                            if (event.detail && event.detail.filters) {
                                console.log('Filters changed:', event.detail.filters);
                                
                                // Apply filters to artwork data
                                const filteredArtworks = FilterModule.applyFiltersToData(allArtworks);
                                
                                // Update gallery
                                if (View.renderGallery) {
                                    View.renderGallery(filteredArtworks);
                                }
                            }
                        } catch (error) {
                            console.error('Error handling filter change:', error);
                        }
                    });
                } else {
                    console.warn('Filter module not found');
                }
            }
        };
    })();

    // 5. INITIALIZATION
    (function setupInitialization() {
        // Only set up initialization once
        if (window._hasSetupInit) return;
        window._hasSetupInit = true;
        
        // Only initialize once, regardless of how many times events fire
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeApp, {once: true});
        } else {
            // DOM already loaded, initialize now if not already done
            if (!window._appState.initialized) {
                setTimeout(initializeApp, 0);
            }
        }
    })();

    function initializeApp() {
        // Track initialization attempts for debugging
        window._appState.initAttempts = (window._appState.initAttempts || 0) + 1;
        
        // Prevent multiple initialization with timestamp tracking
        if (window._appState.initialized) {
            console.log(`Application initialization attempt #${window._appState.initAttempts} - ` + 
                        `Already initialized at ${new Date(window._appState.initTime).toLocaleTimeString()}`);
            return;
        }
        
        // Mark as initialized first thing
        window._appState.initialized = true;
        window._appState.initTime = Date.now();
        
        console.log('DOM ready, initializing application components');
        
        // Initialize in order
        try {
            if (Model && Model.init) Model.init();
            if (View && View.init) View.init();
            
            // Add slight delay before Controller init
            setTimeout(() => {
                if (Controller && Controller.init) Controller.init();
            }, 50);
        } catch (e) {
            console.error('Error during application initialization:', e);
        }
    }

    // 6. EXPOSE TO GLOBAL SCOPE (if needed)
    window.Model = Model;
    window.View = View;
    window.Controller = Controller;

})(); // Single IIFE closure