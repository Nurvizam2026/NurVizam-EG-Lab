MODULE 02 — INDEPENDENT TECHNICAL REVIEW UPDATE

This package is based only on the supplied `nurvizam-module-02-apex-towards-away.zip` version. It does not merge the earlier Module 02 packages and does not modify Module 01.

Files to replace in the existing repository:
- both-planes.html
- both-planes.css
- both-planes.js

Changes in this update:
1. Added separate cube body-diagonal conditions:
   - inclined to both HP and VP
   - perpendicular to HP
   - parallel to HP
   - perpendicular to VP
   - parallel to VP
   Named perpendicular conditions set the corresponding angle pair to its exact 90/0 values. Parallel conditions fix the relevant angle to zero and leave the other inclination adjustable.
2. Replaced the triangular-side-face rotation search based on 1,441 sampled roll angles with an analytic roll solution. It verifies the face is coplanar with the selected plane and the rest of the solid remains on the permitted side.
3. Updated explanatory status text for the named body-diagonal conditions.
4. Kept the page's existing independent 3D solid, VP/FV projection, HP/TV projection, projector geometry and drawing-sheet architecture.

Important limitations:
- The generic corner solver still constrains the two adjacent base edges at the selected base corner; it is not a universal arbitrary-vertex contact solver.
- The mixed axis/base-edge conditions retain their existing construction assumptions and are not a general solver for every arbitrary contact feature.
- Curved solids are faceted approximations; analytic cone/cylinder contact is not yet implemented.
- Hidden-edge classification remains a face-based visualization approximation.
- No live browser/WebGL rendering test was completed in this environment. Static syntax and structure checks are not proof of correct rendered geometry. Test the cube diagonal modes and pyramid triangular-face contact in a browser before teaching use.


Flexible inclination controls (October 2026 update)
--------------------------------------------------
Module 02 now has an independent “Which part is inclined?” selector with Axis, Base edge, Slant edge/Generator, Cube body diagonal, Triangular side face, Other side face, and Base plane options. A dependent selector identifies the specific edge, diagonal, or face where applicable. The two angle inputs are interpreted as line-to-plane angles for line features and plane-to-plane angles for face/base-plane features. Feature options that do not exist on the selected solid are not offered. Contact options are kept selectable where practical; incompatibility is reported by the geometric status rather than disabling every candidate in advance.

Verification: JavaScript syntax was checked with Node.js. The browser/WebGL scene has not been executed in a live browser during this update; test representative solids and contact combinations before deploying to GitHub Pages.

General condition dropdown update
---------------------------------
- Added a first-choice “General — use the resting and inclination selections below” option to dropdown 2 (Base / geometric condition).
- General mode treats the chosen resting plane, resting feature, inclined feature, and the two HP/VP angles as independent inputs wherever the current solver supports that construction.
- The existing named conditions (cube body-diagonal cases and the two mixed axis/base-edge cases) remain available for textbook-specific constructions.
- The separate resting-feature dropdown does not gain a duplicate General entry; it remains the explicit contact feature selector.
- General mode is the default on page load and after Reset.

Verification for this package: Node.js syntax check passed; HTML control IDs are unique and required controls are present. A live browser/WebGL render and all geometric combinations have not been exhaustively tested. Contact validity still depends on the implemented solver paths; the General option does not make every arbitrary solid/feature/angle combination mathematically solvable.


Dual inclination condition update
---------------------------------
- Added independent feature selectors for inclination condition 1 and condition 2.
- Each inclination condition has its own HP/VP dropdown. Angle 1 and angle 2 correspond to the selected feature/plane pairs, not automatically to HP and VP.
- In General mode, a numerical orientation solver minimizes the two feature-angle errors together with a contact-condition residual. Line features use line-to-plane angles; face/base-plane features use plane-to-plane angles.
- The solver reports the best residuals if the requested conditions do not fit the selected resting condition. It does not silently change the requested angles.
- Existing named textbook conditions remain available and continue through their prior solver paths. Use General mode for the two independent inclination conditions.

Verification for this update: ES-module JavaScript syntax check passed; HTML IDs are unique and all JS-referenced HTML IDs are present. ZIP integrity checked after packaging. A live browser/WebGL session could not be completed here, so representative solids/contact combinations should be checked in a browser before teaching deployment. The numerical solver is an approximate constrained-orientation solver, not a proof of existence for every possible solid/feature combination.
