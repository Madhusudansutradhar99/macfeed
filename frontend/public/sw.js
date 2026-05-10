const CACHE_NAME = 'macfeed-cache-v2';
const STATIC_CACHE = 'macfeed-static-v2';
const RUNTIME_CACHE = 'macfeed-runtime-v2';
const API_CACHE = 'macfeed-api-v2';
const MUSIC_CACHE = 'macfeed-music-v2';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/icon-192.png',
  '/icon-512.png',
  '/macfeed-logo.png'
];

const CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours for API

// Install: Cache all static assets
self.addEventListener('install', event => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS).catch(err => {
          console.warn('[SW] Some assets failed to cache:', err);
        });
      }),
      caches.open(RUNTIME_CACHE),
      caches.open(API_CACHE),
      caches.open(MUSIC_CACHE)
    ]).then(() => {
      console.log('[SW] All caches initialized');
      self.skipWaiting();
    })
  );
});

// Activate: Clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => 
            name.startsWith('macfeed-') && 
            ![CACHE_NAME, STATIC_CACHE, RUNTIME_CACHE, API_CACHE, MUSIC_CACHE].includes(name)
          )
          .map(name => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Stale-while-revalidate strategy with offline support
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome extensions
  if (url.protocol === 'chrome-extension:') return;

  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    // API requests - cache with 2 hour expiry
    event.respondWith(
      cacheFirst(request, API_CACHE, CACHE_DURATION)
    );
  } else if (url.pathname.startsWith('/storage/') || request.url.includes('supabase')) {
    // Supabase storage (music, thumbnails) - cache indefinitely
    event.respondWith(
      cacheFirst(request, MUSIC_CACHE)
    );
  } else if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'font' ||
    request.destination === 'image'
  ) {
    // Static resources - cache first, permanent
    event.respondWith(
      cacheFirst(request, STATIC_CACHE)
    );
  } else if (request.destination === 'document' || url.pathname === '/') {
    // Pages - network first with fallback to cache
    event.respondWith(
      networkFirst(request, RUNTIME_CACHE)
    );
  } else {
    // Other requests - network first
    event.respondWith(
      networkFirst(request, RUNTIME_CACHE)
    );
  }
});

// Cache-first strategy
function cacheFirst(request, cacheName, maxAge = null) {
  return caches.match(request).then(response => {
    if (response) {
      // Check if cache has expired
      if (maxAge) {
        const cachedTime = response.headers.get('sw-fetched-on');
        if (cachedTime && Date.now() - parseInt(cachedTime) < maxAge) {
          return response;
        }
      } else {
        return response;
      }
    }

    return fetch(request)
      .then(response => {
        if (!response || response.status !== 200) {
          return response;
        }

        const responseToCache = response.clone();
        const headers = new Headers(responseToCache.headers);
        headers.set('sw-fetched-on', Date.now().toString());

        caches.open(cacheName).then(cache => {
          cache.put(request, new Response(responseToCache.body, {
            status: responseToCache.status,
            statusText: responseToCache.statusText,
            headers: headers
          }));
        });

        return response;
      })
      .catch(() => {
        // Network error - return cached version if available
        return caches.match(request);
      });
  });
}

// Network-first strategy
function networkFirst(request, cacheName) {
  return fetch(request)
    .then(response => {
      if (!response || response.status !== 200) {
        return response;
      }

      const responseToCache = response.clone();
      caches.open(cacheName).then(cache => {
        cache.put(request, responseToCache);
      });

      return response;
    })
    .catch(() => {
      return caches.match(request);
    });
}

// Message handler for offline/online status
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

