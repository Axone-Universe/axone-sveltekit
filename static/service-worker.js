const CACHE_NAME = 'axone-v1';
// Only cache static assets; avoid '/' – it often redirects and Safari errors on "Response served by service worker has redirections"
const urlsToCache = ['/logo.png', '/favicon.svg'];

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
					cacheNames.map((cacheName) =>
						cacheName !== CACHE_NAME ? caches.delete(cacheName) : Promise.resolve()
					)
				);
			})
		);
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
	if (event.request.method !== 'GET') return;

	// Safari errors when the service worker serves a response that involved redirects.
	// Don't intercept navigation requests (documents); let the browser handle redirects natively.
	if (event.request.mode === 'navigate') return;

	const u = new URL(event.request.url);
	// Skip root path and service worker – often redirect or special handling
	if (u.pathname === '/' || u.pathname.endsWith('/service-worker.js')) return;

	event.respondWith(
		caches.match(event.request).then((cached) => {
			if (cached) return cached;

			return fetch(event.request).then((response) => {
				// Don't cache or serve responses that involved redirects (Safari rejects these)
				if (response.redirected) return response;
				if (!response || response.status !== 200 || response.type !== 'basic') return response;

				const clone = response.clone();
				caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
				return response;
			});
		})
	);
});
