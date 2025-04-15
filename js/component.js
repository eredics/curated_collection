/* global TemplateEngine */

/**
 * Component system for creating reusable UI components
 */
const Component = (function() {
    'use strict';
    
    // Store registered components
    const components = new Map();
    
    // Local reference to TemplateEngine or fallback implementation
    const templateRenderer = (typeof TemplateEngine !== 'undefined') ? TemplateEngine : {
        render: function(template, /* data */) {
            // Implementation that doesn't use the data parameter
            // Using comment syntax to indicate unused parameter
            return template; // Simple fallback if TemplateEngine isn't available
        }
    };
    
    // Component constructor
    function ComponentClass(config) {
        this.id = config.id || 'component-' + Date.now();
        this.template = config.template || '';
        this.data = config.data || {};
        this.methods = config.methods || {};
        this.element = null;
        this.children = [];
        this.events = config.events || {};
        this.hooks = {
            beforeRender: config.beforeRender || null,
            afterRender: config.afterRender || null,
            onDestroy: config.onDestroy || null
        };
    }
    
    // Component prototype methods
    ComponentClass.prototype = {
        /**
         * Render the component to a container element
         * @param {HTMLElement|string} container - Container element or selector
         */
        render: function(container) {
            // Find container element
            const containerEl = typeof container === 'string' ? 
                document.querySelector(container) : container;
            
            if (!containerEl) {
                console.error('Container not found for', this.id);
                return;
            }
            
            // Call before render hook if defined
            if (typeof this.hooks.beforeRender === 'function') {
                this.hooks.beforeRender.call(this);
            }
            
            // Create component DOM using local templateRenderer reference
            const temp = document.createElement('div');
            temp.innerHTML = templateRenderer.render(this.template, this.data);
            
            // Replace or append the component
            if (this.element && this.element.parentNode) {
                // Replace existing instance
                this.element.parentNode.replaceChild(temp.firstElementChild, this.element);
                this.element = temp.firstElementChild;
            } else {
                // New instance
                this.element = temp.firstElementChild;
                containerEl.appendChild(this.element);
            }
            
            // Set up event listeners
            this.setupEvents();
            
            // Call after render hook if defined
            if (typeof this.hooks.afterRender === 'function') {
                this.hooks.afterRender.call(this);
            }
            
            return this;
        },
        
        /**
         * Set up event listeners from the events configuration
         */
        setupEvents: function() {
            if (!this.element) return;
            
            // Remove old listeners first to prevent duplicates
            this.removeEventListeners();
            
            // Set up new listeners
            Object.entries(this.events).forEach(([eventDef, handler]) => {
                // Parse event definition (e.g., "click .button")
                const [eventName, selector] = eventDef.split(' ');
                
                const eventHandler = (event) => {
                    // If selector is specified, check if the target matches
                    if (selector) {
                        const target = event.target.closest(selector);
                        if (target && this.element.contains(target)) {
                            handler.call(this, event, target);
                        }
                    } else {
                        // No selector, just call the handler
                        handler.call(this, event, this.element);
                    }
                };
                
                // Store the handler reference for later removal
                if (!this._eventHandlers) {
                    this._eventHandlers = [];
                }
                
                this._eventHandlers.push({
                    eventName,
                    handler: eventHandler
                });
                
                // Add the listener
                this.element.addEventListener(eventName, eventHandler);
            });
        },
        
        /**
         * Remove all event listeners
         */
        removeEventListeners: function() {
            if (!this.element || !this._eventHandlers) return;
            
            this._eventHandlers.forEach(({eventName, handler}) => {
                this.element.removeEventListener(eventName, handler);
            });
            
            this._eventHandlers = [];
        },
        
        /**
         * Update component data and re-render
         * @param {Object} newData - New data to merge with existing data
         */
        update: function(newData) {
            this.data = { ...this.data, ...newData };
            if (this.element) {
                this.render(this.element.parentNode);
            }
            return this;
        },
        
        /**
         * Add a child component
         * @param {Component} child - Child component to add
         * @param {string} selector - Selector for container within this component
         */
        addChild: function(child, selector) {
            this.children.push({
                component: child,
                selector: selector
            });
            
            // If parent is already rendered, render the child too
            if (this.element) {
                const container = selector ? 
                    this.element.querySelector(selector) : this.element;
                
                if (container) {
                    child.render(container);
                }
            }
            
            return this;
        },
        
        /**
         * Find a DOM element within the component
         * @param {string} selector - CSS selector
         * @return {HTMLElement} - Found element or null
         */
        find: function(selector) {
            return this.element ? this.element.querySelector(selector) : null;
        },
        
        /**
         * Find all matching DOM elements within the component
         * @param {string} selector - CSS selector
         * @return {NodeList} - Found elements
         */
        findAll: function(selector) {
            return this.element ? this.element.querySelectorAll(selector) : [];
        },
        
        /**
         * Destroy the component and clean up
         */
        destroy: function() {
            // Call destroy hook if defined
            if (typeof this.hooks.onDestroy === 'function') {
                this.hooks.onDestroy.call(this);
            }
            
            // Remove event listeners
            this.removeEventListeners();
            
            // Destroy child components
            this.children.forEach(child => {
                child.component.destroy();
            });
            
            // Remove element from DOM
            if (this.element && this.element.parentNode) {
                this.element.parentNode.removeChild(this.element);
            }
            
            this.children = [];
            this.element = null;
        }
    };
    
    return {
        /**
         * Create a new component
         * @param {Object} config - Component configuration
         * @return {Component} - New component instance
         */
        create: function(config) {
            return new ComponentClass(config);
        },
        
        /**
         * Register a component for later use
         * @param {string} name - Component name
         * @param {Object} config - Component configuration
         */
        register: function(name, config) {
            components.set(name, config);
        },
        
        /**
         * Create an instance of a registered component
         * @param {string} name - Registered component name
         * @param {Object} data - Optional data to override default data
         * @return {Component} - New component instance
         */
        getInstance: function(name, data = {}) {
            if (!components.has(name)) {
                console.error(`Component "${name}" not registered`);
                return null;
            }
            
            const config = components.get(name);
            const instance = this.create({
                ...config,
                data: { ...config.data, ...data }
            });
            
            return instance;
        }
    };
})();

// Check for module availability before exporting (for Node.js environments)
// This conditional prevents errors in browser environments
if (typeof window !== 'undefined' && typeof window.module !== 'undefined' && typeof window.module.exports !== 'undefined') {
    window.module.exports = Component;
}