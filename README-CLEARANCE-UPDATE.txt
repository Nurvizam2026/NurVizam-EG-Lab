# Nurvizam Engineering Graphics Lab — Module 01 & 02 Plane-Clearance Update

This is a small, isolated visual-spacing update based on the preserved Module 01 baseline and the latest Module 02 dual-inclination source.

## What changed

- **Module 01:** increased clearance from the *other/non-contact plane*. For HP inclination mode, the solid is positioned farther from VP (Y offset changed from 2.6 to 3.2 scene units). For VP inclination mode, vertical clearance above HP increased from 0.8 to 1.2 scene units.
- Repositioned the Module 01 HP/TV labels and axis marker slightly to keep them legible after the offset change.
- **Module 02:** increased non-contact-plane clearance from 0.12 to 0.55 scene units in the existing solid-placement paths.
- The selected resting/contact plane is not intentionally moved. Existing inclination and projection calculations are otherwise unchanged.
- Module 03 files are not included and should not be replaced. Module 01 `index.html` retains the Module 03 navigation link.

## Files to replace in the repository root

Replace these seven files from the ZIP: `index.html`, `app.js`, `style.css`, `both-planes.html`, `both-planes.css`, and `both-planes.js`. The README is documentation only.

Do not delete or replace `line-projection.html`, `line-projection.css`, or `line-projection.js`.

## Validation

JavaScript syntax checks and ZIP integrity checks passed. A live browser/WebGL visual test is still recommended before publishing. The extra clearance applies to the non-contact plane; a genuine resting feature remains on its selected contact plane.
