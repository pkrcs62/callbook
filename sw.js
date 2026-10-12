/* Callbook service worker — offline shell + push handler.
   Bump VERSION on every release so phones fetch the new files. */
const VERSION = 'callbook-v11';
const SHELL = [
  './',
  'index.html',
  'manifest.json',
  'offline.html',
  'sw-register-early.js',
  'icons/favicon-32.png',
  'icons/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(VERSION).then(c =>
      // add one by one so a single missing file doesn't break the install
      Promise.allSettled(SHELL.map(u => c.add(new Request(u, { cache: 'reload' }))))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING' || (e.data && e.data.type === 'SKIP_WAITING')) self.skipWaiting();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Never cache live data / auth (Supabase) — always go to network
  if (url.hostname.endsWith('supabase.co')) return;

  // Page loads: network first, then cache, then offline page
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(VERSION).then(c => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() =>
          caches.match(req).then(r => r || caches.match('index.html') || caches.match('offline.html'))
            .then(r => r || caches.match('offline.html'))
        )
    );
    return;
  }

  // Everything else (own files, CDN scripts, fonts): cache first, refresh in background
  const cacheable = url.origin === self.location.origin ||
    /(^|\.)jsdelivr\.net$|(^|\.)cdnjs\.cloudflare\.com$|fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!cacheable) return;

  e.respondWith(
    caches.match(req).then(hit => {
      const net = fetch(req)
        .then(res => {
          if (res && (res.ok || res.type === 'opaque')) {
            const copy = res.clone();
            caches.open(VERSION).then(c => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => hit);
      return hit || net;
    })
  );
});

/* ---- push notifications ---- */
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) { d = { body: e.data ? e.data.text() : '' }; }
  const title = d.title || 'Callbook';
  e.waitUntil(
    self.registration.showNotification(title, {
      body: d.body || 'You have leads to follow up today.',
      icon: 'icons/apple-touch-icon.png',
      badge: 'icons/favicon-32.png',
      data: { url: d.url || './' }
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const target = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if ('focus' in c) return c.focus();
      }
      return clients.openWindow(target);
    })
  );
});
