# MindAR target build

`targets.mind` is the only binary asset that cannot be generated from this project
without the MindAR compiler. Build it from these source images, in exactly this order:

1. `mona-marker.jpg`
2. `crisanto-marker.jpg`
3. `mcarthurmarker.jpg`

Save the compiler output in this folder with the exact filename `targets.mind`.
The order matters: MindAR target indexes must match the built-in artwork order in
`app.js`.

`asset-manifest.js` already includes this file, so it will be downloaded for
offline use as soon as it exists. The app currently has a temporary runtime-compile fallback solely so
the existing live build continues to function until this one-time binary is added.
