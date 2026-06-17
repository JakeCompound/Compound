// sw.js — COMPOUND service worker.  (v3 — ring badge)
//
// Its job for Phase 6 is Web Push: receive a pushed message from the server and
// show a notification, even when the app (or the whole browser) is closed. It is
// deliberately minimal — no offline caching yet; that can be layered on later.

// Activate immediately on first install / update so pushes work right away.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

// No-op fetch handler. We don't cache anything yet, but its mere presence is
// what makes Chrome offer "Install app" for the PWA. Letting it fall through
// means the network handles every request normally.
self.addEventListener('fetch', () => {});

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
