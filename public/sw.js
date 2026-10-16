/* Sendoff service worker. Keeps the app shell and any trip photos you've
   already seen so the installed app opens instantly and survives a bad
   signal. Pages and /api go network-first so prices are never stale. */
const VERSION = "sendoff-v1";
const SHELL = ["/", "/manifest.webmanifest", "/favicon-192.png", "/favicon-512.png", "/apple-touch-icon.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;                 // fonts, analytics, supabase: leave alone
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/.netlify/")) return; // always live
  const isAsset = /\.(js|css|png|jpg|jpeg|webp|svg|ico|woff2?)$/.test(url.pathname) || url.pathname.startsWith("/photos/") || url.pathname.startsWith("/assets/");
  if (isAsset) {
    // cache-first for hashed assets and photos; fill the cache as we go
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok) caches.open(VERSION).then((c) => c.put(req, res.clone()));
      return res;
    })));
    return;
  }
  // pages: network-first, fall back to the cached shell when offline
  e.respondWith(fetch(req).then((res) => {
    if (res.ok && req.mode === "navigate") caches.open(VERSION).then((c) => c.put("/", res.clone()));
    return res;
  }).catch(() => caches.match(req).then((hit) => hit || caches.match("/"))));
});
