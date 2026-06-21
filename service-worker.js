const CACHE_NAME = "matchtracker-v1";

const urlsToCache = [
  "/matchtracker-mobile/",
  "/matchtracker-mobile/index.html",
  "/matchtracker-mobile/style-mobile.css",
  "/matchtracker-mobile/app-mobile.js",
  "/matchtracker-mobile/manifest.json"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
