const CACHE_NAME = "matchtracker-2027-028";
const urlsToCache = [
  "./",
  "./index.html",
  "./style-mobile.css",
  "./assets/stadium-scene.svg",
  "./assets/hero-stadium.jpg",
  "./assets/preseason-training.jpg",
  "./assets/season-stadium.jpg",
  "./assets/squad-team.jpg",
  "./assets/opponents-tactics.jpg",
  "./assets/football-detail.jpg",
  "./app-mobile.js",
  "./manifest.json",
  "./src/services/storage.js",
  "./src/features/match/live-match.js"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith("matchtracker-") && key !== CACHE_NAME).map(key => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    const copy = response.clone();
    if (response.ok && new URL(event.request.url).origin === self.location.origin) caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
    return response;
  })));
});
