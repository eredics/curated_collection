/**
 * Main application entry point - implements enhanced MVC architecture
 */

(function() {
    'use strict';

    // Model - Handles data and business logic with observable properties
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

    // View - Handles UI rendering with component architecture
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
            return `
                <article class="artwork" data-id="${artwork.id}" tabindex="0" 
                        aria-label="Artwork: ${artwork.title} by ${artwork.artist}">
                    <!-- Artwork image container -->
                    <div class="artwork-image-wrapper">
                        <a href="${artwork.url}" class="artwork-link" 
                           target="_blank" rel="noopener noreferrer"
                           aria-label="View full details of ${artwork.title} by ${artwork.artist}">
                            <div class="artwork-image-container">
                                <img src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'></svg>" 
                                    data-src="${artwork.imagePath}" 
                                    alt="${artwork.title} by ${artwork.artist}" 
                                    class="artwork-image"
                                    loading="lazy"
                                />
                                <div class="loading-indicator">
                                    <div class="loading-shimmer"></div>
                                </div>
                            </div>
                        </a>
                        
                        <!-- Caption toggle button -->
                        <button type="button" class="caption-toggle" 
                                aria-label="Toggle details for ${artwork.title}" 
                                aria-expanded="false"
                                aria-controls="caption-${artwork.id}">
                            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                <path d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z"/>
                            </svg>
                        </button>
                    </div>
                    
                    <!-- Artwork details/caption -->
                    <div class="artwork-details">
                        <!-- Always visible information -->
                        <h3 class="artwork-title" id="title-${artwork.id}">${artwork.title}</h3>
                        <p class="artwork-artist">${artwork.artist}</p>
                        
                        <!-- Hidden caption content (toggleable) -->
                        <div class="caption-details" id="caption-${artwork.id}" aria-labelledby="title-${artwork.id}">
                            ${artwork.technique ? `<p class="artwork-technique"><span class="caption-label">Technique:</span> ${artwork.technique}</p>` : ''}
                            ${artwork.displaySize ? `<p class="artwork-size">${artwork.displaySize}</p>` : ''}
                            ${artwork.price ? `<p class="artwork-price"><span class="caption-label">Price:</span> ${artwork.price}</p>` : ''}
                        </div>
                    </div>
                </article>
            `;
        },

        // Update the gallery container structure
        renderGallery: function(artworks) {
            const galleryEl = document.getElementById('app-content');
            
            // Show loading state initially
            galleryEl.innerHTML = `
                <div class="gallery-loading" aria-label="Loading gallery">
                    <div class="gallery-loading-spinner" role="status" aria-hidden="true"></div>
                    <span class="sr-only">Loading artworks...</span>
                </div>
            `;
            
            setTimeout(() => {
                if (!artworks || artworks.length === 0) {
                    galleryEl.innerHTML = '<div class="no-results" role="status" aria-live="polite">No artworks available</div>';
                    return;
                }
                
                galleryEl.innerHTML = `
                    <section class="gallery-container">
                        <h2 class="gallery-title">Federation Gallery</h2>
                        <p class="gallery-subtitle">A curated collection of fine artworks</p>
                        
                        <div class="gallery-grid" role="region" aria-label="Artwork gallery">
                            ${artworks.map(artwork => this.renderArtwork(artwork)).join('')}
                        </div>
                    </section>
                `;
                
                // Setup lazy loading for all images
                ImageHandler.setupLazyLoading();
                
                // Initialize other interactive elements
                this.initCaptionToggles();
                this.setupKeyboardNavigation();
            }, 400);
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
        }
    };

    // Controller - Handles user interactions and updates model/view
    const Controller = {
        // Initialize the controller
        init: function() {
            // Initialize Model and View
            Model.init();
            View.init();
            
            // Setup routes
            this.setupRoutes();
            
            // Setup scroll handling for lazy loading
            this.setupScrollHandling();
            
            // Load data and render gallery
            Model.loadData()
                .then(artworks => {
                    // Display the gallery once data is loaded
                    View.renderGallery(Model.state.artworks);
                    
                    // After a short delay, prefetch images for items currently in viewport
                    setTimeout(() => {
                        const handleScroll = document.createEvent('Event');
                        handleScroll.initEvent('scroll', true, true);
                        window.dispatchEvent(handleScroll);
                    }, 500);
                })
                .catch(error => {
                    console.error('Failed to load artwork data:', error);
                    document.getElementById('app-content').innerHTML = 
                        '<div class="error-message">Failed to load gallery data. Please try again later.</div>';
                });
            
            return this;
        },
        
        // Set up routes
        setupRoutes: function() {
            Router.registerRoute('#home', () => {
                View.renderGallery(Model.state.artworks);
            });
            
            Router.registerRoute('#notfound', () => {
                document.getElementById('app-content').innerHTML = 
                    '<div class="not-found">Page not found. <a href="#home">Return to gallery</a></div>';
            });
            
            // Set default route
            Router.setDefaultRoute('#home');
            
            // Initialize router
            Router.init();
        },
        
        // Set up data bindings between model and view
        setupBindings: function() {
            // Bind model state to view render
            DataBinding.bind(
                this.model.state,
                'isLoading',
                this.view.elements.app,
                (element, value) => this.view.render(this.model.state)
            );
            
            DataBinding.bind(
                this.model.state,
                'items',
                this.view.elements.app,
                (element, value) => this.view.render(this.model.state)
            );
            
            DataBinding.bind(
                this.model.state,
                'selectedItem',
                this.view.elements.app,
                (element, value) => this.view.render(this.model.state)
            );
            
            DataBinding.bind(
                this.model.state.settings,
                'darkMode',
                this.view.elements.app,
                (element, value) => this.view.render(this.model.state)
            );
            
            DataBinding.bind(
                this.model.state.settings,
                'fontSize',
                this.view.elements.app,
                (element, value) => this.view.render(this.model.state)
            );
        },
        
        // Set up event listeners
        setupEventListeners: function() {
            // Listen for online/offline events
            window.addEventListener('online', this.handleConnectionChange.bind(this));
            window.addEventListener('offline', this.handleConnectionChange.bind(this));
            
            // Event delegation for all UI interactions
            document.addEventListener('click', this.handleDocumentClick.bind(this));
            document.addEventListener('change', this.handleDocumentChange.bind(this));
        },
        
        // Handle document click events with delegation
        handleDocumentClick: function(event) {
            // Item selection
            if (event.target.closest('.item')) {
                const item = event.target.closest('.item');
                const index = parseInt(item.dataset.index, 10);
                
                // Navigate to item detail page
                Router.navigateTo(`item?id=${index}`);
            }
            
            // Settings toggle
            if (event.target.closest('#settings-toggle')) {
                Router.navigateTo('settings');
            }
            
            // Dark mode toggle
            if (event.target.closest('#dark-mode-toggle')) {
                this.model.updateSettings({
                    darkMode: event.target.closest('#dark-mode-toggle').checked
                });
            }
        },
        
        // Handle document change events with delegation
        handleDocumentChange: function(event) {
            // Font size picker
            if (event.target.matches('#font-size-picker')) {
                this.model.updateSettings({
                    fontSize: event.target.value
                });
            }
        },
        
        // Handle connection status changes
        handleConnectionChange: function() {
            this.checkConnectionStatus();
        },
        
        // Check connection status and update UI accordingly
        checkConnectionStatus: function() {
            if (navigator.onLine) {
                Utils.removeClass(document.body, 'offline');
                Failsafe.hideOfflineNotification();
            } else {
                Utils.addClass(document.body, 'offline');
                Failsafe.showOfflineNotification();
            }
        },

        // Add this to your Controller object's init method
        setupScrollHandling: function() {
            // Prioritize images in viewport when scrolling
            const handleScroll = Utils.throttle(function() {
                // Check if any unloaded images are now in viewport
                const unloadedImages = document.querySelectorAll('img[data-src]:not([data-loaded])');
                
                unloadedImages.forEach(img => {
                    if (Utils.isInViewport(img, 300)) {
                        // Prioritize this image by forcing load
                        if (img.dataset.src) {
                            ImageHandler.loadImage(img.dataset.src, img);
                        }
                    }
                });
            }, 200); // Throttle to every 200ms
            
            // Add scroll listener
            window.addEventListener('scroll', handleScroll);
            
            // Also check on resize
            window.addEventListener('resize', Utils.throttle(handleScroll, 500));
            
            // Initial check for visible images
            handleScroll();
        }
    };

    // Add this function inside your init method
    function initSplashScreen() {
        // Set current date in splash screen
        const dateElement = document.getElementById('splash-date');
        const options = { 
            weekday: 'long',
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        dateElement.textContent = new Date().toLocaleDateString(undefined, options);
        
        // Hide splash screen after animation completes
        setTimeout(() => {
            const splashScreen = document.getElementById('splash-screen');
            splashScreen.classList.add('hidden');
            
            // Remove splash screen from DOM after transition
            setTimeout(() => {
                splashScreen.remove();
            }, 500);
        }, 1800); // Match this with the CSS animation duration
    }

    // Call this function early in your initialization process
    // For example, in your Controller.init() function or at DOMContentLoaded
    document.addEventListener('DOMContentLoaded', function() {
        initSplashScreen();
        // Load dependencies before initializing the app
        Promise.all([
            // Any async initialization can be done here
        ])
            .then(() => {
            // Initialize each MVC component
                const app = Controller.init(Model.init(), View.init());
                console.log('App initialized:', app);
            
                // Initialize failsafe after app is ready
                Failsafe.init();
            
                // Initialize iOS helpers
                if (typeof iOSHelpers !== 'undefined') {
                    iOSHelpers.init();
                }
            })
            .catch(error => {
                console.error('Application initialization failed:', error);
                Failsafe.handleError(error, 'Application initialization failed');
            });
    });
})();