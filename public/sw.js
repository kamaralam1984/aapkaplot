/* AapKaPlot — minimal service worker.
 * Caches the shell on install, serves cached responses for navigations when
 * the network is down. Bumps the cache name on every release to invalidate.
 */
const CACHE = "akp-shell-v1";
const SHELL = ["/", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  // Only handle same-origin navigations / docs offline-first; everything else
  // goes straight to the network so Next's HMR + RSC streams aren't disturbed.
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy).catch(() => {}));
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match("/")))
    );
  }
});

/* ── Push notifications ─────────────────────────────────────────────
 * Payload shape (set by /lib/push.ts):
 *   { title, body, url?, tag?, icon? }
 * Clicking the notification focuses an existing tab on `url` (or opens
 * a new one). Free — no GCM/FCM/APN account, all VAPID.
 */
self.addEventListener("push", (event) => {
  let payload = { title: "AapKaPlot", body: "You have an update." };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch {
    // Plain-text fallback.
    if (event.data) payload.body = event.data.text();
  }

  const options = {
    body: payload.body,
    tag: payload.tag || "akp",
    icon: payload.icon || "/icon-192.png",
    badge: "/icon-192.png",
    data: { url: payload.url || "/" },
  };
  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientsArr) => {
        for (const client of clientsArr) {
          // Focus an existing tab if it's already on the right path.
          if (client.url.endsWith(target) && "focus" in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) return self.clients.openWindow(target);
      })
  );
});
