NURVIZAM ENGINEERING GRAPHICS LAB — MODULE 02 TECHNICAL CORRECTIONS

Files in this package
- both-planes.html
- both-planes.css
- both-planes.js

Install by replacing ONLY these three files in the repository root. Do not replace
index.html, style.css, app.js, or any Module 01 files. This package does not contain
those files and does not change the single-plane module.

Corrections made
1. The 3D scene now constructs the front-view projection on VP (y = 0), top-view
   projection on HP (z = 0), and dashed projectors from each solid vertex to both
   planes. FV/TV use different colors and the planes are labelled.
2. The drawing sheet now uses a common scale and anchors projections to XY:
   a point on HP projects to XY in FV; a point on VP projects to XY in TV. FV is
   above XY and TV below XY (first-angle projection).
3. Mixed conditions now explicitly align the selected base edge to its specified
   angle relative to the other projection plane, including the 90-degree edge case.
4. Edge contact is accepted only if both endpoints lie in the selected plane and
   the whole convex solid stays on the correct side. The previous approximate roll
   search could claim contact when an edge was not actually supporting the solid.
5. Pyramids and cones have an apex-direction control in the axis-both-planes mode.
   This changes the sign of the relevant axis component without changing the angle
   magnitudes and allows contact configurations that need the apex toward the plane.
   In the mixed base-edge construction, direction is fixed by the required contact.
6. A complete base face is offered only for compatible axis angles and an apex
   directed away from the contact plane. Base-edge and slant-edge/generator selectors
   are populated for the selected solid; curved solids use polygonal approximations.
7. FV/TV edge visibility is classified from the oriented polygon faces. Hidden edges
   are dashed. For cylinders and cones this is an approximation based on the 24-sided
   polygonal model, not an analytic curved-surface solution.
8. Added labels/legend for the 3D projections and preserved the responsive module menu.

Checks performed
- JavaScript syntax check passed with Node.js.
- HTML ID references checked: no duplicate IDs and no missing IDs referenced by $().
- CSS brace counts balanced.
- Numeric checks confirmed axis-to-plane angle definitions and mixed-condition
  base-edge angle/perpendicularity relationships for representative angle pairs.

Important testing limitation
The live Three.js/WebGL scene could not be rendered in this environment because the
external Three.js CDN hostname could not be resolved. Therefore, do not treat these
static and mathematical checks as a completed browser rendering test. After uploading,
open Module 02 on GitHub Pages and verify the 3D model, both projections, contact status,
and drawing sheet before using it in class.
9. Edge choices that cannot provide a real supporting contact for the current angles
   are disabled in the edge selector; changing an angle recomputes compatibility.
