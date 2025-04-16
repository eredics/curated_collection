/**
 * Data Binding Module
 * Implements a lightweight reactive system for two-way data binding
 * @version 1.1.0
 */
 
const DataBinding = (function() {
  'use strict';
    
  // Store bindings between model properties and view elements
  const bindings = new Map();
    
  /**
     * Create deep observable for nested objects
     * @private
     * @param {Object} obj - Object to make deeply observable
     * @param {Function} notify - Notification function to call
     * @param {string} [parentPath] - Path to parent property
     * @return {Proxy} - Deeply observable proxy
     */
  const makeDeepObservable = function(obj, notify, parentPath = '') {
    // Only make objects observable, not primitives or null
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }
        
    // Create proxy for observable properties
    return new Proxy(obj, {
      get: function(target, property) {
        // Skip symbol properties (used for internal JS)
        if (typeof property === 'symbol') {
          return target[property];
        }
                
        const value = target[property];
                
        // If this is an object, make it observable too
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          const path = parentPath ? `${parentPath}.${property}` : property;
          return makeDeepObservable(value, notify, path);
        }
                
        return value;
      },
            
      set: function(target, property, value) {
        // Skip symbol properties
        if (typeof property === 'symbol') {
          target[property] = value;
          return true;
        }
                
        const oldValue = target[property];
                
        // Prevent unnecessary updates
        if (oldValue === value) {
          return true;
        }
                
        // Make new value observable if it's an object
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          const path = parentPath ? `${parentPath}.${property}` : property;
          value = makeDeepObservable(value, notify, path);
        }
                
        target[property] = value;
                
        // Create full property path
        const propPath = parentPath ? `${parentPath}.${property}` : property;
                
        // Notify direct property binding
        notify(property, value, oldValue);
                
        // Notify path-based binding
        if (parentPath) {
          notify(propPath, value, oldValue);
        }
                
        return true;
      }
    });
  };
    
  return {
    /**
         * Create a bindable object with observable properties
         * @param {Object} obj - Source object to make observable
         * @return {Object} - Object with observable properties
         */
    makeObservable: function(obj) {
      const observable = { ...obj };
            
      const notifyBindings = (property, value, oldValue) => {
        if (bindings.has(property)) {
          bindings.get(property).forEach(binding => {
            try {
              binding.update(value, oldValue);
            } catch (error) {
              console.error(`Error in binding update for property "${property}":`, error);
            }
          });
        }
      };
            
      // Create proxy with deep observation
      return makeDeepObservable(observable, notifyBindings);
    },
        
    /**
         * Bind a model property to a DOM element
         * @param {Object} model - Observable model
         * @param {string} property - Property name to bind
         * @param {HTMLElement} element - DOM element to bind to
         * @param {Function} updateFn - Function that updates the element
         * @return {Function} - Unbind function for this specific binding
         */
    bind: function(model, property, element, updateFn) {
      if (!bindings.has(property)) {
        bindings.set(property, []);
      }
            
      // Create binding object
      const binding = {
        element: element,
        update: function(newValue, oldValue) {
          try {
            updateFn(element, newValue, oldValue);
          } catch (error) {
            console.error(`Error in binding update for property "${property}":`, error);
          }
        }
      };
            
      bindings.get(property).push(binding);
            
      // Initial update
      try {
        updateFn(element, model[property], undefined);
      } catch (error) {
        console.error(`Error in initial binding update for property "${property}":`, error);
      }
            
      // Return function to remove just this binding
      return function() {
        if (bindings.has(property)) {
          const bindingList = bindings.get(property);
          const index = bindingList.indexOf(binding);
          if (index !== -1) {
            bindingList.splice(index, 1);
            if (bindingList.length === 0) {
              bindings.delete(property);
            }
          }
        }
      };
    },
        
    /**
         * Unbind all bindings for an element
         * @param {HTMLElement} element - Element to unbind
         */
    unbind: function(element) {
      bindings.forEach((bindingList, property) => {
        const newBindings = bindingList.filter(binding => binding.element !== element);
                
        if (newBindings.length === 0) {
          bindings.delete(property);
        } else {
          bindings.set(property, newBindings);
        }
      });
    }
  };
})();

// Export to global or use namespace if available
if (window.ArtGallery) {
  window.ArtGallery.DataBinding = DataBinding;
} else {
  window.DataBinding = DataBinding;
}