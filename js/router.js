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
            // Update URL if it's not already the current one
            if (window.location.hash !== path) {
                window.history.pushState(params, '', path);
            }
      
            // Find matching route
            const route = routes.find(route => {
                // Support for parameterized routes like #gallery/:id
                const routeParts = route.path.split('/');
                const pathParts = path.split('/');
        
                if (routeParts.length !== pathParts.length) return false;
        
                const routeParams = {};
        
                for (let i = 0; i < routeParts.length; i++) {
                    if (routeParts[i].startsWith(':')) {
                        // This is a parameter
                        const paramName = routeParts[i].slice(1);
                        routeParams[paramName] = pathParts[i];
                    } else if (routeParts[i] !== pathParts[i]) {
                        return false;
                    }
                }
        
                // Store parameters for the handler
                params.routeParams = routeParams;
                return true;
            });
      
            if (route) {
                currentRoute = { path, params };
                route.handler(params);
            } else {
                console.warn('No route found for path:', path);
                // Handle 404 case
                this.navigate('#notfound');
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
     * Get the current route information
     * @return {Object} - Current route info
     */
        getCurrentRoute: function() {
            return currentRoute;
        }
    };
})();