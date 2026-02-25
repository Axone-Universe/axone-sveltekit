const CACHE_NAME = 'axone-v1';
// Only cache static assets; avoid '/' – it often redirects and Safari errors on "Response served by service worker has redirections"
const urlsToCache = ['/logo.png', '/favicon.svg'];

const MEDIA_EXTENSIONS = /\.(png|jpe?g|gif|webp|svg|ico|avif)(\?|$)/i;
const VIDEO_EXTENSIONS = /\.(mp4|webm|ogg|mov|m4v)(\?|$)/i;
const AUDIO_EXTENSIONS = /\.(mp3|wav|ogg|m4a|aac|webm|flac)(\?|$)/i;

function isMediaRequest(request) {
	if (['image', 'video', 'audio'].includes(request.destination)) return true;
	const path = new URL(request.url).pathname;
	return MEDIA_EXTENSIONS.test(path) || VIDEO_EXTENSIONS.test(path) || AUDIO_EXTENSIONS.test(path);
}

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

// Fetch event - media: cache first; everything else: network first, cache only when offline
self.addEventListener('fetch', (event) => {
	if (event.request.method !== 'GET') return;

	// Safari errors when the service worker serves a response that involved redirects.
	// Don't intercept navigation requests (documents); let the browser handle redirects natively.
	if (event.request.mode === 'navigate') return;

	const u = new URL(event.request.url);
	// Skip root path and service worker – often redirect or special handling
	if (u.pathname === '/' || u.pathname.endsWith('/service-worker.js')) return;

	const media = isMediaRequest(event.request);

	event.respondWith(
		media
			? serveMediaCacheFirst(event.request)
			: serveNetworkFirst(event.request)
	);
});

function serveMediaCacheFirst(request) {
	return caches.match(request).then((cached) => {
		if (cached) return cached;
		return fetch(request).then((response) => {
			if (!response || response.redirected || response.status !== 200 || response.type !== 'basic') return response;
			const clone = response.clone();
			caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
			return response;
		});
	});
}

function serveNetworkFirst(request) {
	return fetch(request)
		.then((response) => {
			if (response.redirected) return response;
			if (!response || response.status !== 200 || response.type !== 'basic') return response;
			const clone = response.clone();
			caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
			return response;
		})
		.catch(() => caches.match(request));
}
