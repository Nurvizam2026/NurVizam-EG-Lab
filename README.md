# Nurvizam Engineering Graphics Lab

Interactive Engineering Graphics teaching prototype for solids inclined to HP or VP.

## Features
- Triangular and square prism models
- Separate inclination modes: inclined to HP / parallel to VP, and inclined to VP / parallel to HP
- 3D HP and VP reference planes with labels
- First-angle orthographic sheet with front view, top view, XY line, and projectors
- Hidden edges shown with dashed lines in orthographic views and on the projected reference planes
- Visible fallback drawing labels and an on-screen error message if the 3D module fails to start

## Run/deploy
This is a static site. Deploy the folder contents to the root of a GitHub Pages repository. The browser needs internet access to load Three.js. The app tries jsDelivr, unpkg, and esm.sh in sequence. If all are blocked, the 3D model cannot load.

## Educational limitation
This is a learning visualization, not a complete engineering drawing solver. Hidden-edge classification is an approximate geometric visibility test and should be checked against the exact textbook construction and projection convention for each solid.

## Camera and loading fixes
- Uses a local lightweight orbit controller with Z-up coordinates, so OrbitControls is no longer a second external dependency.
- Tries multiple Three.js CDN sources and reports a more useful error if all fail.
- Run through GitHub Pages or a local HTTP server; ES modules generally do not work when opening `index.html` directly with `file://`.
\n\n## Fix for `Failed to resolve module specifier 'three'`\nThe page includes an import map for `three` and `three/addons/` and cache-busts `app.js`. Upload **all files** in this folder to the repository root (or keep the `nurvizam-eg-lab` folder structure consistently). Do not upload only `index.html`; `index.html` and `app.js` must come from the same ZIP version. Hard-refresh after deployment (Ctrl+F5).\n