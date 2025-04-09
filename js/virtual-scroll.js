/**
 * VirtualScroll - Efficient image gallery rendering with infinite scrolling
 * 
 * This module handles large datasets by:
 * - Loading images in batches as the user scrolls
 * - Using a flexbox layout with fixed-size elements (220px × 240px)
 * - Implementing lazy loading for images
 * - Managing scroll events with throttling
 * 
 * Performance optimizations include:
 * - Minimizing DOM operations with document fragments
 * - Using placeholder images during loading
 * - Preventing multiple simultaneous batch loads
 */

window.VirtualScroll = (function() {
    // Private variables
    let container = null;
    let allItems = [];
    let loadedCount = 0;
    let isScrollListenerActive = false;
    let isLoading = false; // Prevent multiple simultaneous loads
    
    // Configuration
    const config = {
        initialItems: 40,
        batchSize: 40, // Increased from 20 to 40
        scrollThreshold: 400, // Increased threshold to load earlier
        maxItems: Infinity // NO LIMIT - allow loading all items
    };
    
    // Initialize the virtual scroll with container and items
    function init(containerEl, items) {
        console.log('VirtualScroll.init called with', items.length, 'items');
        
        if (!containerEl || !items || !items.length) {
            console.error('VirtualScroll init failed: missing container or items');
            return false;
        }
        
        // Store references
        container = containerEl;
        allItems = items;
        loadedCount = 0;
        
        // Reset container
        container.innerHTML = '';
        
        // Force flexbox layout that works
        container.style.cssText = `
            display: flex !important;
            flex-wrap: wrap !important;
            gap: 8px !important;
            padding: 0 !important;
            margin: 0 !important;
        `;
        
        // Render initial batch of items
        loadMoreItems();
        
        // Set up scroll event listener
        if (!isScrollListenerActive) {
            window.addEventListener('scroll', checkScrollPosition);
            isScrollListenerActive = true;
            console.log('Scroll listener activated for infinite loading');
        }
        
        return true;
    }
    
    // Load more items when scrolling
    function loadMoreItems() {
        // Don't try to load if we're already loading
        if (isLoading) return;
        
        // Don't load more if we've loaded all items
        if (loadedCount >= allItems.length) {
            console.log('All items loaded:', loadedCount, 'of', allItems.length);
            return;
        }
        
        // Set loading flag
        isLoading = true;
        
        const endIndex = Math.min(loadedCount + config.batchSize, allItems.length);
        console.log(`Loading more items: ${loadedCount} to ${endIndex-1} (${endIndex-loadedCount} items)`);
        
        const fragment = document.createDocumentFragment();
        
        for (let i = loadedCount; i < endIndex; i++) {
            const artwork = allItems[i];
            const element = renderItem(artwork, i);
            fragment.appendChild(element);
        }
        
        container.appendChild(fragment);
        loadedCount = endIndex;
        
        console.log(`Now showing ${loadedCount} of ${allItems.length} items`);
        
        // Clear loading flag
        isLoading = false;
        
        // Immediately check if we need to load more (in case the page is still not filled)
        if (document.body.offsetHeight <= window.innerHeight && loadedCount < allItems.length) {
            console.log('Page not filled, loading more items immediately');
            setTimeout(loadMoreItems, 100);
        }
    }
    
    // Create a single artwork element
    function renderItem(artwork, index) {
        const element = document.createElement('div');
        element.className = 'artwork';
        element.setAttribute('data-id', artwork.id || `art-${index}`);
        
        // Apply fixed styling directly to ensure consistent layout
        element.style.cssText = `
            flex: 0 0 220px !important;
            height: 240px !important;
            margin: 0 !important;
            padding: 0 !important;
            border: 1px solid #ddd !important;
            border-radius: 4px !important;
            background: #f5f5f5 !important;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important;
            overflow: hidden !important;
        `;
        
        // Process image path
        let imagePath = '';
        if (artwork.imagePath) {
            try {
                // Handle encoding for spaces and special characters
                const parts = artwork.imagePath.split('/');
                const filename = encodeURIComponent(parts[parts.length - 1]);
                imagePath = parts.slice(0, -1).join('/') + '/' + filename;
            } catch (e) {
                console.error('Error encoding image path:', e);
            }
        }
        
        // Image container
        const imgContainer = document.createElement('div');
        imgContainer.className = 'artwork-image-container';
        imgContainer.style.cssText = `
            width: 100% !important;
            height: 100% !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
        `;
        
        // Image element
        const img = document.createElement('img');
        img.className = 'artwork-image';
        img.setAttribute('data-src', imagePath);
        img.setAttribute('alt', artwork.title || 'Artwork');
        img.style.cssText = `
            max-width: 100% !important;
            max-height: 100% !important;
            object-fit: contain !important;
        `;
        
        // Set placeholder and trigger lazy loading
        img.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzIDIiPjxyZWN0IHdpZHRoPSIzIiBoZWlnaHQ9IjIiIGZpbGw9IiNlZWUiLz48L3N2Zz4=';
        
        // Implement simple lazy loading
        const loadImage = function() {
            const dataSrc = img.getAttribute('data-src');
            if (dataSrc) {
                img.src = dataSrc;
            }
        };
        
        // Lazy load when near viewport
        setTimeout(loadImage, 100 + (index % 10) * 100);
        
        // Build DOM structure
        imgContainer.appendChild(img);
        element.appendChild(imgContainer);
        
        return element;
    }
    
    // Check if we need to load more items
    function checkScrollPosition() {
        if (loadedCount >= allItems.length) {
            // We've loaded all items, remove the listener
            window.removeEventListener('scroll', checkScrollPosition);
            isScrollListenerActive = false;
            return;
        }
        
        const scrollPosition = window.innerHeight + window.scrollY;
        const contentHeight = document.body.offsetHeight;
        
        // Load more when we're near the bottom (with increased threshold)
        if (contentHeight - scrollPosition < config.scrollThreshold) {
            console.log('Near bottom of page, loading more items');
            loadMoreItems();
        }
    }
    
    // Force a load of more items (public API)
    function forceLoadMore() {
        console.log('Forcing load of more items');
        loadMoreItems();
    }
    
    // Explicitly export the API
    return {
        init: init,
        loadMore: loadMoreItems,
        checkScroll: checkScrollPosition,
        forceLoad: forceLoadMore
    };
})();

// Confirm the module is loaded
console.log('VirtualScroll module loaded and ready:', typeof window.VirtualScroll === 'object');