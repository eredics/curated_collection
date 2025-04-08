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

        // Inside your View object, add a renderArtwork method
        renderArtwork: function(artwork) {
            const template = `
                <div class="artwork" data-id="${artwork.id}">
                    <div class="artwork-image-container">
                        <img 
                            src="./images/placeholder.svg" 
                            alt="${artwork.title} by ${artwork.artist}" 
                            class="artwork-image"
                            data-src="${artwork.imagePath}"
                        />
                    </div>
                    <div class="artwork-details">
                        <h3 class="artwork-title">${artwork.title}</h3>
                        <p class="artwork-artist">${artwork.artist}</p>
                        <p class="artwork-technique">${artwork.technique}</p>
                        <p class="artwork-size">${artwork.displaySize}</p>
                        <p class="artwork-price">${artwork.price}</p>
                    </div>
                </div>
            `;
            
            return template;
        },

        renderGallery: function(artworks) {
            const galleryEl = document.getElementById('app-content');
            
            if (!artworks || artworks.length === 0) {
                galleryEl.innerHTML = '<div class="no-results">No artworks available</div>';
                return;
            }
            
            galleryEl.innerHTML = `
                <div class="gallery-grid">
                    ${artworks.map(artwork => this.renderArtwork(artwork)).join('')}
                </div>
            `;
            
            // Load actual images after rendering
            document.querySelectorAll('.artwork-image').forEach(img => {
                // Only try to load if data-src is defined
                if (img.dataset.src) {
                    ImageHandler.loadImage(img.dataset.src, img);
                } else {
                    // Set placeholder directly if no src defined
                    img.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"><rect width="300" height="300" fill="%23f0f0f0"/><text x="50%" y="50%" font-family="Arial" font-size="20" text-anchor="middle" dominant-baseline="middle" fill="%23999">Image Not Available</text></svg>';
                    img.classList.add('placeholder');
                }
            });
        }
    };

    // Controller - Handles user interactions and updates model/view
    const Controller = {
        // Initialize the controller
        init: function() {
            // Initialize splash screen first
            initSplashScreen();
            
            // Then initialize the rest of your app
            Model.init();
            View.init();
            this.setupRoutes();
            
            return this;
        },
        
        // Set up routes
        setupRoutes: function() {
            // Register routes
            Router.registerRoute('#home', () => {
                // Home page handler
                document.getElementById('app-content').innerHTML = '<h1>Curated Collection</h1>';
            });
            
            // Add a proper notfound route
            Router.registerRoute('#notfound', () => {
                document.getElementById('app-content').innerHTML = '<h1>Page Not Found</h1><p>The page you requested could not be found.</p>';
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