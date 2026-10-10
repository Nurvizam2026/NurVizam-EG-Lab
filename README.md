# Nurvizam EG Lab — first version

An interactive, static GitHub Pages learning app for Engineering Graphics: solids inclined to one plane.

## Features

- Three.js 3D model with camera orbit (drag), zoom (scroll/pinch)
- Triangular prism and square prism
- Inclination slider
- Front and top projections drawn directly on the VP and HP reference planes in the 3D scene
- A separate orthographic drawing sheet with XY line, front view above XY, top view below XY, and corresponding projectors
- Projection-guide toggle
- Guided hint, explanation and a short quiz
- Responsive layout for phones and computers

## Important teaching/geometry note

This is an introductory visualization aid, not a complete exam-drawing solver. It rotates the solid around the global y-axis, then translates it vertically so its lowest vertex stays on HP. The 3D planes show projected edges and construction projectors; the separate sheet uses a first-angle front/top layout. All projected edges are currently drawn as solid lines; hidden-line classification and textbook-specific hinge constructions are not implemented. Verify the construction against the convention used in your course before using it as an authoritative solution.

## Deploy to GitHub Pages

1. Create a new public repository named `nurvizam-eg-lab`.
2. Upload `index.html`, `style.css`, `app.js`, and `README.md` to the repository root.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Choose branch `main` and folder `/ (root)`, then click **Save**.
6. Wait for GitHub to publish the site. The URL will usually be:
   `https://YOUR-USERNAME.github.io/nurvizam-eg-lab/`
7. Open the URL on a laptop and phone. This app imports Three.js modules from jsDelivr, so the browser needs an internet connection.
8. Add a link to this URL from your existing personal website.

## Local testing

Because this app uses JavaScript modules, open it through a local web server rather than directly as a `file://` URL. For example, if Python is installed, run this in the project directory:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Files

- `index.html` — page structure and interface
- `style.css` — responsive styling
- `app.js` — 3D scene, model geometry, projections and interactions
