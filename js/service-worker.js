// Service Worker for offline functionality
const CACHE_NAME = 'mvc-app-cache-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/js/main.js',
    '/js/constants.js',
    '/js/utils.js',
    '/js/failsafe.js',
    // Add any images, fonts, or other resources
];

// Service worker for offline functionality
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('Caching app assets...');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Removing old cache', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request).then(response => {
                // Cache dynamic content
                if (event.request.url.includes('/images/')) {
                    let responseClone = response.clone();
                    caches.open('gallery-images-v1').then(cache => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            }).catch(() => {
                // Return fallback image for image requests
                if (event.request.url.match(/\.(jpg|jpeg|png|gif)$/)) {
                    return caches.match('/images/fallback.png');
                }
            });
        })
    );
});

// Add this to ensure proper CSP headers in the service worker

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            // Return cached response if available
            if (response) {
                return response;
            }
            
            // Clone the request
            const fetchRequest = event.request.clone();
            
            return fetch(fetchRequest).then(response => {
                // Check if we received a valid response
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }
                
                // Clone the response
                const responseToCache = response.clone();
                
                caches.open('v1').then(cache => {
                    cache.put(event.request, responseToCache);
                });
                
                return response;
            });
        })
    );
});