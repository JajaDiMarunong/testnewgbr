/* Update this list whenever a deployable asset is added. It is shared by the
   first-launch downloader and the service worker. */
const MUSEUM_ASSETS = [
  "./", "./index.html", "./style.css", "./app.js", "./offline-store.js", "./manifest.webmanifest",
  "./asset-manifest.js", "./sw.js", "./guestbook.html", "./guestbook.css",
  "./guestbook.js", "./admin.html", "./admin.css", "./admin.js",
  "./assets/background.jpg", "./assets/background.png", "./assets/logo.png", "./assets/icon-192.png",
  "./assets/the-kiss.jpg", "./assets/mona-marker.jpg", "./assets/crisanto-marker.jpg",
  "./assets/mcarthurmarker.jpg", "./assets/monalisa-centered.obj",
  "./assets/targets.mind",
  "./assets/mona-centered.obj", "./assets/mona.obj", "./assets/monalisa.mtl",
  "./assets/monalisa_texture.jpg", "./assets/crisanto.optimized.glb", "./assets/mcarthur.optimized.glb",
  "./assets/crisantoskybox.optimized.glb", "./assets/beachskybox.optimized.glb",
  "https://aframe.io/releases/1.5.0/aframe.min.js",
  "https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-aframe.prod.js",
  "https://cdn.jsdelivr.net/gh/donmccurdy/aframe-extras@v7.0.0/dist/aframe-extras.min.js"
];

if (typeof self !== "undefined") self.MUSEUM_ASSETS = MUSEUM_ASSETS;
