# Nurvizam Engineering Graphics Lab

Interactive Engineering Graphics learning resource for understanding the projection of solids inclined to HP or VP.

## Author
- **Dr. Mohammed Shafeeque KK**
- **Ph.D., IIT Palakkad**
- Academic interests: Engineering Graphics, Computational Mechanics, and Fracture Mechanics

## Educational scope
The lab lets students explore prisms, pyramids, cylinders, and cones; adjust the inclination condition and angle; select applicable apex direction and resting conditions; and compare the 3D orientation with front and top orthographic views. The drawing sheet follows the first-angle layout: FV above XY and TV below XY.

## Features
- Triangular, square, pentagonal, and hexagonal prisms
- Triangular, square, pentagonal, and hexagonal pyramids
- Cylinder and cone
- Inclination to HP while parallel to VP, or inclination to VP while parallel to HP
- Angle control from 0° to 90°
- Apex direction towards or away from the selected reference plane for applicable pyramids and cones
- Resting-condition selector for base, base edge, corner/apex, slant edge, and generator where geometrically applicable
- HP and VP reference planes, projection guides, front view, top view, XY reference line, and first-angle drawing-sheet arrangement
- Mobile layout showing the 3D model and 2D drawing sheet together
- Synchronized geometry for the 3D model and orthographic views

## Projection conventions
- HP is the horizontal plane; VP is the vertical plane.
- XY is the line of intersection of HP and VP.
- In first-angle projection, the front view is placed above XY and the top view below XY.
- A point or edge lying in HP projects onto XY in the front view. A point or edge lying in VP projects onto XY in the top view.
- A line parallel to a projection plane appears in true length in the corresponding orthographic view; an inclined line is generally foreshortened.
- The 3D camera can be orbited independently; orbiting the camera changes the viewing angle, not the solid's engineering orientation.

## Important educational note
This is an interactive learning aid, not a replacement for the construction procedure required by a particular engineering-drawing problem. The available resting conditions depend on the selected solid and geometry. For formal drawings, check the exact hinge construction, dimensions, contact condition, projection convention, and visible/hidden-edge treatment against the prescribed method. Hidden-edge visibility is a visualization aid and may require independent verification for assessed drawings.

## Run and deploy
This is a static website intended for GitHub Pages. Upload `index.html`, `style.css`, `app.js`, and this README to the repository root. The browser needs internet access to load the Three.js module. Open the site through GitHub Pages or a local HTTP server rather than opening `index.html` directly using `file://`.

## Change safety
The text update changes explanatory copy, the quiz wording/feedback, accessible model description, creator details, and creator-section styling. It does not change geometry construction, inclination transforms, resting-condition calculations, or orthographic projection calculations.
