// sw.js — COMPOUND service worker.  (v4 — real offline caching)
//
// Two jobs: Web Push (below) and offline support. The fetch handler must do
// REAL work — Chrome detects no-op fetch handlers and fails installability
// when it finds one (a site with NO service worker installs on the manifest
// alone, but a site with a fake fetch handler does not).
const CACHE = 'compound-v4';
const PRECACHE = ['/', '/manifest.webmanifest', '/icon-180.png', '/icon-192.png', '/icon-512.png', '/badge-96.png', '/app-icon.js'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).catch(() => {}));
  self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

// Navigations: network-first with the cached shell as offline fallback.
// Hashed build assets: cache-first (filenames change per deploy, safe forever).
// Cross-origin (Supabase, fonts) and /api/* pass straight through.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put('/', copy)).catch(() => {});
        return res;
      }).catch(() => caches.match('/'))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok && (url.pathname.startsWith('/assets/') || PRECACHE.includes(url.pathname))) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
      }
      return res;
    }))
  );
});

// A push arrived. Payload is JSON: { title, body, tag, url }.
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) { data = { body: event.data && event.data.text() }; }
  const title = data.title || 'COMPOUND';
  const options = {
    body: data.body || '',
    tag: data.tag || 'compound',          // same tag replaces an existing notif instead of stacking
    renotify: true,
    icon: '/icon-180.png',   // full-colour COMPOUND logo (shown in the notification body)
    badge: '/badge-96.png',  // monochrome ring mark (Android status bar — must be white/transparent)
    data: { url: data.url || '/' },
    vibrate: [80, 40, 80],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Tapping the notification focuses an open tab or opens the app.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) { if ('focus' in c) return c.focus(); }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    }),
  );
});
