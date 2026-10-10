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


UI flexibility update (2026-10-11)
- The resting-feature dropdown is no longer forced to Corner when a cube body-diagonal condition is selected. Edge, slant/lateral edge, side face, base face, and corner choices remain independently selectable where the solid supports them.
- Edge choices are no longer pre-disabled by a predictive feasibility test. The solver's geometric contact validation determines whether the chosen feature can actually support HP/VP and reports incompatible combinations.
- Side-face selection now supports pyramid triangular side faces and prism/cube rectangular side faces. Prism lateral edges are also available as contact features. The same transformed geometry is used for the resulting projections.
- Body-diagonal edge/face roll calculations preserve the specified body-diagonal direction.
- Named mixed conditions still keep their specified hinge plane/feature locked because the base-edge hinge is part of the meaning of those presets. Use the general axis/body-diagonal condition for independent plane/feature selection. Mixed conditions are no longer globally disabled for curved solids; the faceted model is used and actual contact is checked.
- Static JavaScript syntax validation passed with Node.js. A live browser/WebGL render test was not performed in this environment.
