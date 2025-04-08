/**
 * Simple router for handling application states
 */
const Router = (function() {
    'use strict';
  
    // Store routes and current state
    const routes = [];
    let currentRoute = null;
  
    return {
    /**
     * Initialize the router
     */
        init: function() {
            // Handle back/forward navigation
            window.addEventListener('popstate', this.handlePopState.bind(this));
      
            // Initial route
            this.navigate(window.location.hash || '#home');
      
            return this;
        },
    
        /**
     * Add a route
     * @param {string} path - Route path (with #)
     * @param {Function} handler - Route handler function
     */
        addRoute: function(path, handler) {
            routes.push({ path, handler });
            return this;
        },
    
        /**
     * Navigate to a new route
     * @param {string} path - Route path to navigate to
     * @param {Object} params - Optional parameters
     */
        navigate: function(path, params = {}) {
            // Find the route configuration for the given path
            const route = routes.find(r => r.path === path);
            
            if (route) {
                // Execute the route handler if found
                route.handler(params);
                
                // Update the active route
                currentRoute = { path, params };
                return true;
            } else {
                console.log('No route found for path:', path);
                
                // IMPORTANT: Only redirect to notfound if we're not already trying to go there
                if (path !== '#notfound' && routes.find(r => r.path === '#notfound')) {
                    return this.navigate('#notfound');
                } else if (path !== '#home' && routes.find(r => r.path === '#home')) {
                    // If no #notfound route exists, try to go home instead
                    return this.navigate('#home');
                } else {
                    // Last resort - show a simple message in the app container
                    document.getElementById('app-content').innerHTML = '<div class="error">Page not found</div>';
                    return false;
                }
            }
        },
    
        /**
     * Handle popstate events (back/forward navigation)
     * @param {PopStateEvent} event - The popstate event
     */
        handlePopState: function(event) {
            this.navigate(window.location.hash, event.state || {});
        },
    
        /**
     * Register a route (alias for addRoute)
     * @param {string} path - Route path (with #)
     * @param {Function} handler - Route handler function
     */
        registerRoute: function(path, handler) {
            return this.addRoute(path, handler);
        },
    
        /**
     * Set the default route
     * @param {string} path - Default route path
     */
        setDefaultRoute: function(defaultPath) {
            this.defaultRoute = defaultPath;
            return this;
        },
    
        /**
     * Get the current route information
     * @return {Object} - Current route info
     */
        getCurrentRoute: function() {
            return currentRoute;
        }
    };
})();

window.Router = Router;