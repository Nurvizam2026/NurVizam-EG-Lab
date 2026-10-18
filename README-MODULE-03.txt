NURVIZAM ENGINEERING GRAPHICS LAB — MODULE 03
Projection of Lines inclined to both HP and VP

FILES IN THIS PACKAGE
- index.html              Existing home page with one navigation link added to Module 03.
- line-projection.html    New independent module page.
- line-projection.css     Styles for the new module only.
- line-projection.js      2D rotating-line construction and calculations.

DEPLOYMENT
1. Back up the current repository files first.
2. Upload line-projection.html, line-projection.css, and line-projection.js to the repository root.
3. Update index.html with the supplied index.html. This version adds one link in the Module 01 introduction; it does not change app.js or style.css.
4. Commit/push and wait for GitHub Pages to deploy.
5. Open https://nurvizam2026.github.io/NurVizam-EG-Lab/ and choose “Open Module 03: Projection of Lines”.

FEATURES
- Line inclined to both HP and VP.
- Line inclined to HP only (parallel to VP).
- Line inclined to VP only (parallel to HP).
- True length input and 0°–90° angle sliders.
- Three-step 2D rotating-line construction: assumed simple position, rotate top view, project final front view.
- First-angle arrangement: FV above XY and TV below XY.
- Feasibility check for both-plane angles: sin²(alpha) + sin²(beta) <= 1.
- Projected lengths: FV = TL cos(beta), TV = TL cos(alpha).
- The final plan angle is calculated; it is not incorrectly equated to the line's angle with VP.

VALIDATION PERFORMED
- JavaScript syntax check passed.
- DOM ID-reference check passed.
- Node runtime smoke test passed for default both-plane, infeasible angle pair, HP-only and VP-only modes.
- A live browser rendering check could not be completed in this environment; please visually verify after deployment.
