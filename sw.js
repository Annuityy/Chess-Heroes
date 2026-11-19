/* The Chess Heroes, installed (Sprint 8): this service worker keeps the whole game on the device, so it opens at once and
   plays with no connection. Written into journey/publish/sw.js by journey/build.py, with VERSION set from the built files:
   a new build is a new version, which the device picks up the next time the game is opened online.
   - install: the game's page, its icons and both place files (Secret training; the Battlefield, Play Together and Hero
     School) go into this version's cache; a place file that cannot come down yet is fetched the first time it is opened
   - activate: older versions' caches are deleted
   - fetch: the game's own files from the cache first, else from the network (and kept); a page asked for with no
     connection gets the game's page. Nothing from other sites is touched. */
const VERSION = 'chess-heroes-a5549316c889';
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png', 'icons/apple-touch-icon.png', 'places/probe.js'];
const PLACES = ['places/battle.js', 'places/training.js', 'places/music/train-1.mp3', 'places/music/train-2.mp3', 'places/music/train-3.mp3', 'places/music/train-4.mp3', 'places/music/train-5.mp3', 'places/music/train-6.mp3', 'places/music/train-7.mp3', 'places/music/train-8.mp3'];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    await cache.addAll(CORE);
    await Promise.allSettled(PLACES.map(u => cache.add(u)));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key !== VERSION) await caches.delete(key);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    try {
      const res = await fetch(req);
      if (res.ok && res.type === 'basic') cache.put(req, res.clone());
      return res;
    } catch (err) {
      if (req.mode === 'navigate') { const page = await cache.match('index.html'); if (page) return page; }
      throw err;
    }
  })());
});
