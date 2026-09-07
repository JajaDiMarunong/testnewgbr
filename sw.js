importScripts("./asset-manifest.js");

const CACHE_NAME = "gbr-museum-assets-v1";
const DATA_CACHE = "gbr-museum-runtime-v1";

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.allSettled((self.MUSEUM_ASSETS || []).map(async (asset) => {
      const request = new Request(asset, { mode: asset.startsWith("http") ? "no-cors" : "same-origin" });
      const response = await fetch(request);
      if (response && (response.ok || response.type === "opaque")) await cache.put(request, response);
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.hostname === "gbrmuseumtest-default-rtdb.asia-southeast1.firebasedatabase.app") return;
  event.respondWith((async () => {
    const cached = await caches.match(event.request);
    if (cached) return cached;
    try {
      const response = await fetch(event.request);
      if (response && (response.ok || response.type === "opaque")) {
        const cache = await caches.open(DATA_CACHE);
        cache.put(event.request, response.clone());
      }
      return response;
    } catch (error) {
      const fallback = await caches.match("./index.html");
      if (event.request.mode === "navigate" && fallback) return fallback;
      throw error;
    }
  })());
});
