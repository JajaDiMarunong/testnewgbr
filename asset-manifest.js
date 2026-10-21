/* Update this list whenever a deployable asset is added. It is shared by the
   first-launch downloader and the service worker. */
const MUSEUM_ASSETS = [
  "./", "./index.html", "./style.css", "./app.js", "./offline-store.js", "./manifest.webmanifest",
  "./asset-manifest.js", "./sw.js", "./guestbook.html", "./guestbook.css",
  "./guestbook.js", "./admin.html", "./admin-manifest.webmanifest", "./admin.css", "./admin.js",
  "./assets/background.jpg", "./assets/logo.png", "./assets/icon-192.png",
  "./assets/crisanto-marker.jpg",
  "./assets/mcarthurmarker.jpg",
  "./assets/targets.mind",
  "./assets/crisanto.glb", "./assets/mcarthur.optimized.glb",
  "./assets/crisantoskybox.optimized.glb", "./assets/beachskybox.optimized.glb",
  "https://aframe.io/releases/1.5.0/aframe.min.js",
  "https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-aframe.prod.js",
  "https://cdn.jsdelivr.net/gh/donmccurdy/aframe-extras@v7.0.0/dist/aframe-extras.min.js"
];

if (typeof self !== "undefined") self.MUSEUM_ASSETS = MUSEUM_ASSETS;
