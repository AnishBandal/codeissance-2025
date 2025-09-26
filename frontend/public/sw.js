// Bank of India Lead Management PWA Service Worker (Enhanced Offline Support)
// Strategy:
// 1. Precache app shell and essential assets at install for immediate offline availability
// 2. Cache-first for navigation requests and static assets with background updates
// 3. Network-first for API GET requests with offline fallback to cache
// 4. Bypass API mutations (POST/PUT/PATCH/DELETE) to allow offline data handling in app code
// 5. Support offline authentication and lead management
// 6. Provide better offline user experience with custom offline pages

const VERSION = 'v4';
const APP_SHELL_CACHE = `boi-app-shell-${VERSION}`;
const RUNTIME_CACHE = `boi-runtime-${VERSION}`;
const API_CACHE = `boi-api-${VERSION}`;

// Essential files for offline functionality
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/assets/favicon.ico',
  // Include essential fonts and images
  '/assets/fonts/inter-var.woff2',
  '/assets/images/logo.png'
];

// Install service worker and cache app shell resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    // Cache app shell first
    caches.open(APP_SHELL_CACHE)
      .then(cache => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(APP_SHELL);
      })
      .then(() => {
        // Skip waiting to activate immediately
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[Service Worker] Cache install failed:', error);
      })
  );
});

// Activate service worker and clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => {
          // Delete any old caches not in our current set
          return ![APP_SHELL_CACHE, RUNTIME_CACHE, API_CACHE].includes(key);
        }).map(key => {
          console.log('[Service Worker] Removing old cache:', key);
          return caches.delete(key);
        })
      );
    })
    .then(() => {
      console.log('[Service Worker] Activated and claimed clients');
      // Take control of all clients immediately
      return self.clients.claim();
    })
  );
});

// Utility functions for request categorization
function isNavigationRequest(request) {
  return request.mode === 'navigate' || 
         (request.method === 'GET' && request.headers.get('accept')?.includes('text/html'));
}

function isDevAsset(url) {
  return url.origin === self.location.origin && (
    url.pathname.startsWith('/@vite') ||
    url.pathname.includes('vite') ||
    url.pathname.startsWith('/src/') ||
    url.pathname.includes('hot-update')
  );
}

function isApiRequest(url) {
  return url.pathname.startsWith('/api/');
}

function isApiMutating(req) {
  return ['POST','PUT','PATCH','DELETE'].includes(req.method);
}

function isStaticAsset(url) {
  return url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|webp|woff2|ttf|eot|ico)$/i);
}

// Store offline status timestamp for app to use
function updateOfflineStatus(isOffline) {
  if (isOffline) {
    const timestamp = Date.now();
    localStorage.setItem('sw_wentOfflineAt', timestamp.toString());
  }
}

// Main fetch event handler
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip development assets (HMR, Vite, etc)
  if (isDevAsset(url) || url.pathname === '/sw.js') {
    return; // Let browser handle normally
  }

  // Skip API mutating requests (POST/PUT/DELETE) - they'll be handled by app's offline system
  if (isApiRequest(url) && isApiMutating(request)) {
    return; // Let app handle these with its offline queueing system
  }

  // Handle navigation requests (HTML pages) - Cache first strategy with network update
  if (isNavigationRequest(request)) {
    event.respondWith((async () => {
      try {
        const cache = await caches.open(APP_SHELL_CACHE);
        const cachedResponse = await cache.match('/index.html');
        
        // Start network request in parallel, but don't wait for it
        const networkPromise = fetch(request)
          .then(networkResponse => {
            // Update cache with new version
            if (networkResponse.ok) {
              cache.put('/index.html', networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(error => {
            console.log('[Service Worker] Navigation fetch failed:', error);
            updateOfflineStatus(true);
            return null;
          });
        
        // If we have a cached version, return it immediately
        if (cachedResponse) {
          // Kick off network update in background
          networkPromise.catch(() => {}); 
          return cachedResponse;
        }
        
        // Wait for network if no cache
        const networkResponse = await networkPromise;
        if (networkResponse) {
          return networkResponse;
        }
        
        // Offline fallback if no cache and network fails
        return new Response(
          `<!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>BOI Lead Management - Offline</title>
            <style>
              body { font-family: system-ui, sans-serif; padding: 2rem; text-align: center; }
              .offline-icon { font-size: 4rem; margin-bottom: 1rem; }
            </style>
          </head>
          <body>
            <div class="offline-icon">📵</div>
            <h1>You're Offline</h1>
            <p>Please check your internet connection to access the BOI Lead Management app.</p>
            <button onclick="window.location.reload()">Try Again</button>
          </body>
          </html>`,
          { 
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
          }
        );
      } catch (error) {
        console.error('[Service Worker] Navigation handler error:', error);
        return fetch(request); // Last resort fallback
      }
    })());
    return;
  }

  // Static assets (JS/CSS/Images) - Cache first strategy with background refresh
  if (request.method === 'GET' && isStaticAsset(url)) {
    event.respondWith((async () => {
      try {
        const cache = await caches.open(RUNTIME_CACHE);
        const cachedResponse = await cache.match(request);
        
        // Start network fetch in background
        const networkPromise = fetch(request)
          .then(networkResponse => {
            // Update cache for future use
            if (networkResponse.ok) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(error => {
            console.log('[Service Worker] Static asset fetch failed:', error);
            return null;
          });
          
        // Return from cache immediately if available
        if (cachedResponse) {
          // Don't wait for network update
          networkPromise.catch(() => {});
          return cachedResponse;
        }
        
        // If not in cache, wait for network
        const networkResponse = await networkPromise;
        if (networkResponse) {
          return networkResponse;
        }
        
        // No cache, network failed
        throw new Error('Resource not available offline');
      } catch (error) {
        console.error('[Service Worker] Static asset handler error:', error);
        // If all else fails, let browser handle it
        return fetch(request);
      }
    })());
    return;
  }

  // API GET requests - Network first with cache fallback
  if (request.method === 'GET' && isApiRequest(url)) {
    event.respondWith((async () => {
      try {
        // Try network first
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse.ok) {
          const cache = await caches.open(API_CACHE);
          cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
      } catch (error) {
        console.log('[Service Worker] API fetch failed, falling back to cache:', error);
        updateOfflineStatus(true);
        
        // Network failed, try cache
        const cache = await caches.open(API_CACHE);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // No cache, return error with offline header
        return new Response(
          JSON.stringify({ 
            error: 'Network request failed', 
            offline: true,
            message: 'You are currently offline. This data is not available.'
          }),
          { 
            status: 503,
            headers: { 
              'Content-Type': 'application/json',
              'X-Is-Offline': 'true'
            }
          }
        );
      }
    })());
    return;
  }

  // Default strategy - Try network, fallback to cache
  event.respondWith((async () => {
    try {
      const response = await fetch(request);
      
      // Cache successful GET responses
      if (request.method === 'GET' && response.ok) {
        const cache = await caches.open(RUNTIME_CACHE);
        cache.put(request, response.clone());
      }
      
      return response;
    } catch (error) {
      console.log('[Service Worker] Fetch failed, checking cache:', error);
      updateOfflineStatus(true);
      
      // Try cache as fallback
      const cache = await caches.open(RUNTIME_CACHE);
      const cachedResponse = await cache.match(request);
      
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // Nothing worked
      console.error('[Service Worker] No offline version available for:', request.url);
      throw new Error('Resource not available offline');
    }
  })());
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
  
  // Handle app checking online status
  if (event.data === 'isOnline') {
    // Try to fetch a tiny resource to check connectivity
    fetch('/api/health', { method: 'GET', headers: { 'Cache-Control': 'no-cache' } })
      .then(() => {
        // We're online!
        event.ports[0].postMessage({ online: true });
        // Clear offline status
        localStorage.removeItem('sw_wentOfflineAt');
      })
      .catch(() => {
        // Still offline
        event.ports[0].postMessage({ online: false });
        updateOfflineStatus(true);
      });
  }
});

// Listen for online/offline events
self.addEventListener('online', () => {
  console.log('[Service Worker] Device is back online');
  localStorage.removeItem('sw_wentOfflineAt');
  
  // Notify all clients we're back online
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({ type: 'online' });
    });
  });
});

self.addEventListener('offline', () => {
  console.log('[Service Worker] Device went offline');
  updateOfflineStatus(true);
  
  // Notify all clients we're offline
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({ type: 'offline' });
    });
  });
});
