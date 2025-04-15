/**
 * Data Binding Module
 */
 
const DataBinding = (function() {
    'use strict';
    
    // Store bindings between model properties and view elements
    const bindings = new Map();
    
    return {
        /**
         * Create a bindable object with observable properties
         * @param {Object} obj - Source object to make observable
         * @return {Object} - Object with observable properties
         */
        makeObservable: function(obj) {
            const observable = { ...obj };
            
            // Create proxy for observable properties
            return new Proxy(observable, {
                set: function(target, property, value) {
                    const oldValue = target[property];
                    target[property] = value;
                    
                    // Notify all bindings for this property
                    if (bindings.has(property)) {
                        bindings.get(property).forEach(binding => {
                            binding.update(value, oldValue);
                        });
                    }
                    
                    return true;
                }
            });
        },
        
        /**
         * Bind a model property to a DOM element
         * @param {Object} model - Observable model
         * @param {string} property - Property name to bind
         * @param {HTMLElement} element - DOM element to bind to
         * @param {Function} updateFn - Function that updates the element
         */
        bind: function(model, property, element, updateFn) {
            if (!bindings.has(property)) {
                bindings.set(property, []);
            }
            
            // Create binding object
            const binding = {
                element: element,
                update: function(newValue, oldValue) {
                    updateFn(element, newValue, oldValue);
                }
            };
            
            bindings.get(property).push(binding);
            
            // Initial update
            updateFn(element, model[property], undefined);
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
window.DataBinding = DataBinding;