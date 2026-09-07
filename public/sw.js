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

// A push arrived. Payload is JSON: { title, body, tag, url, slot?, actions? }.
// `actions` become notification buttons where the platform supports them
// (Android); iOS shows a plain notification and a tap opens the app.
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
    data: { url: data.url || '/', slot: data.slot || null },
    vibrate: [80, 40, 80],
  };
  if (Array.isArray(data.actions) && data.actions.length) options.actions = data.actions.slice(0, 2);
  event.waitUntil(self.registration.showNotification(title, options));
});

// Actions decided from the notification can land while the app is closed —
// the page owns localStorage, not us — so they queue in a tiny IndexedDB
// store that push.js drains on the next app open (or via postMessage now).
function swDb() {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open('compound-sw', 1);
    r.onupgradeneeded = () => { r.result.createObjectStore('pending', { autoIncrement: true }); };
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
async function queueAction(action) {
  const db = await swDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('pending', 'readwrite');
    tx.objectStore('pending').add(action);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Notification interactions:
//   • "Skipped it" on a meal reminder → record the skip, app stays closed.
//   • "Log it" → open the app straight into the food sheet for typing.
//   • plain tap → focus/open the app.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const d = event.notification.data || {};
  const slot = d.slot || null;

  if (event.action === 'skip' && slot) {
    event.waitUntil((async () => {
      const list = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      if (list.length) list.forEach((c) => c.postMessage({ type: 'meal-skip', slot, ts: Date.now() }));
      else await queueAction({ type: 'meal-skip', slot, ts: Date.now() }).catch(() => {});
    })());
    return;
  }

  const wantsLog = event.action === 'log' && slot;
  const url = wantsLog ? '/?logmeal=' + slot : (d.url || '/');
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ('focus' in c) {
          if (wantsLog) c.postMessage({ type: 'open-food-add', slot });
          return c.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    }),
  );
});
