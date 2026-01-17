const CACHE_NAME = 'axone-v1';
const urlsToCache = ['/', '/logo.png', '/favicon.svg'];

// Install event - cache resources
self.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => {
			return cache.addAll(urlsToCache);
		})
	);
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then((cacheNames) => {
			return Promise.all(
				cacheNames.map((cacheName) => {
					if (cacheName !== CACHE_NAME) {
						return caches.delete(cacheName);
					}
				})
			);
		})
	);
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
	// Skip non-GET requests
	if (event.request.method !== 'GET') {
		return;
	}

	event.respondWith(
		caches.match(event.request).then((response) => {
			// Return cached version or fetch from network
			return (
				response ||
				fetch(event.request).then((response) => {
					// Don't cache non-successful responses
					if (!response || response.status !== 200 || response.type !== 'basic') {
						return response;
					}

					// Clone the response for caching
					const responseToCache = response.clone();

					caches.open(CACHE_NAME).then((cache) => {
						cache.put(event.request, responseToCache);
					});

					return response;
				})
			);
		})
	);
});
