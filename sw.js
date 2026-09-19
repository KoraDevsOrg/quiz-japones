const CACHE_NAME = "kora-nihongo-cache-v2.2";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./css/styles.css",
  "./js/app.js",
  "./js/data/words.js",
  "./js/services/storage.js",
  "./js/services/audio.js",
  "./js/modules/quiz.js",
  "./js/modules/wordsearch.js",
  "./js/modules/memory.js",
  "./js/modules/scramble.js",
  "./js/modules/timeattack.js",
  "./js/modules/achievements.js",
  "./manifest.json"
];

// Instalación y almacenamiento en caché de archivos base
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

// Activación y limpieza de cachés antiguas
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((k) => {
          if (k !== CACHE_NAME) return caches.delete(k);
        })
      )
    )
  );
  self.clients.claim();
});

// Estrategia: Red primero, respaldo en caché si no hay conexión
self.addEventListener("fetch", (e) => {
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
