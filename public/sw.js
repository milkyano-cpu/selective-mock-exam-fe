/* Aspire Selective Entry Preparation — Service Worker */

const VERSION = 'v1.0.0';
const STATIC_CACHE = `aspire-static-${VERSION}`;
const RUNTIME_CACHE = `aspire-runtime-${VERSION}`;
const OFFLINE_URL = '/offline';

const PRECACHE_URLS = [
  '/offline',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon.png',
  '/logo.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      await Promise.allSettled(
        PRECACHE_URLS.map((url) =>
          cache.add(new Request(url, { cache: 'reload' })).catch(() => null)
        )
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key))
      );
      if ('navigationPreload' in self.registration) {
        try {
          await self.registration.navigationPreload.enable();
        } catch (_) {
          /* ignore */
        }
      }
      await self.clients.claim();
    })()
  );
});

function isApiRequest(url) {
  return url.pathname.startsWith('/api/');
}

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    /\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff2?|ttf|otf|eot)$/i.test(
      url.pathname
    )
  );
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never cache API responses — auth/data must stay live.
  if (isApiRequest(url)) return;

  // Navigation requests: network-first with offline fallback.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const preload = await event.preloadResponse;
          if (preload) return preload;
          const network = await fetch(request);
          return network;
        } catch (_) {
          const cache = await caches.open(STATIC_CACHE);
          const cached = await cache.match(OFFLINE_URL);
          return (
            cached ||
            new Response('Offline', {
              status: 503,
              headers: { 'Content-Type': 'text/plain' },
            })
          );
        }
      })()
    );
    return;
  }

  // Static assets: cache-first, populate runtime cache on miss.
  if (isStaticAsset(url)) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        try {
          const response = await fetch(request);
          if (response.ok) {
            const cache = await caches.open(RUNTIME_CACHE);
            cache.put(request, response.clone());
          }
          return response;
        } catch (_) {
          return cached || Response.error();
        }
      })()
    );
    return;
  }

  // Everything else: stale-while-revalidate.
  event.respondWith(
    (async () => {
      const cache = await caches.open(RUNTIME_CACHE);
      const cached = await cache.match(request);
      const networkFetch = fetch(request)
        .then((response) => {
          if (response && response.ok) cache.put(request, response.clone());
          return response;
        })
        .catch(() => cached);
      return cached || networkFetch;
    })()
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

// Push Event: Receiving push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    
    // Fallback default values
    const title = payload.title || 'Aspire PWA';
    const message = payload.message || 'You have a new notification';
    
    // We can also extract the target route to open on click
    // We attach it to the notification data so notificationclick can use it
    const notificationData = {
      url: '/dashboard/notifications',
      ...payload.data // in case we want to override with a specific route
    };

    event.waitUntil(
      self.registration.showNotification(title, {
        body: message,
        icon: '/icon-192.png',
        badge: '/icon-192.png', // Small monochrome icon for Android badge
        data: notificationData,
        vibrate: [100, 50, 100],
      })
    );
  } catch (err) {
    // If payload is plain text
    event.waitUntil(
      self.registration.showNotification('Aspire PWA', {
        body: event.data.text(),
        icon: '/icon-192.png',
        badge: '/icon-192.png',
      })
    );
  }
});

// Notification Click Event: Open app or focus tab
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = new URL(
    event.notification.data?.url || '/dashboard/notifications',
    self.location.origin
  ).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window/tab open with the target URL
      for (let client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, check if any app window is open and focus it, then navigate
      if (windowClients.length > 0 && 'focus' in windowClients[0]) {
        return windowClients[0].focus().then((client) => client.navigate(urlToOpen));
      }
      // If no window is open, open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
