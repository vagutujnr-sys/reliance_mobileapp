const CACHE = "reliance-shell-v1";
const ASSETS = ["/", "/brand/main-logo.png", "/brand/splash-background.png", "/vehicles/suv-white.svg", "/vehicles/suv-dark.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/admin") || url.pathname.startsWith("/driver") || url.pathname.startsWith("/owner")) return;
  if (url.pathname.startsWith("/brand/") || url.pathname.startsWith("/vehicles/")) {
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request)));
  }
});
