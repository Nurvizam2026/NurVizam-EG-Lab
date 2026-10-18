// Load Three.js from more than one CDN so a single blocked host does not disable the 3D lab.
async function loadThree() {
  const sources = [
    "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js",
    "https://unpkg.com/three@0.160.0/build/three.module.js",
    "https://esm.sh/three@0.160.0"
  ];
  let lastError;
  for (const source of sources) {
    try { return await import(source); }
    catch (error) { lastError = error; console.warn(`Could not load Three.js from ${source}`, error); }
  }
  throw new Error(`Three.js could not load from any configured CDN. ${lastError?.message || ""}`);
}

const THREE = await loadThree();

// Lightweight local orbit controller avoids a separate CDN dependency for OrbitControls.
class LocalOrbitControls {
  constructor(camera, element) {
    this.camera = camera; this.element = element; this.target = new THREE.Vector3();
    this.minDistance = 5; this.maxDistance = 18; this.maxPolarAngle = Math.PI * 0.49;
    this.enableDamping = true; this.dampingFactor = 0.07; this.screenSpacePanning = true;
    this._dragging = false; this._lastX = 0; this._lastY = 0; this._thetaDelta = 0; this._phiDelta = 0; this._radiusScale = 1;
    element.style.touchAction = "none";
    element.addEventListener("pointerdown", event => {
      if (event.button !== 0) return;
      this._dragging = true; this._lastX = event.clientX; this._lastY = event.clientY;
      element.setPointerCapture?.(event.pointerId);
    });
    element.addEventListener("pointermove", event => {
      if (!this._dragging) return;
      const dx = event.clientX - this._lastX, dy = event.clientY - this._lastY;
      this._lastX = event.clientX; this._lastY = event.clientY;
      this._thetaDelta -= dx * 0.008; this._phiDelta -= dy * 0.008;
    });
    const stopDrag = () => { this._dragging = false; };
    element.addEventListener("pointerup", stopDrag); element.addEventListener("pointercancel", stopDrag);
    element.addEventListener("lostpointercapture", stopDrag);
    element.addEventListener("wheel", event => {
      event.preventDefault(); this._radiusScale *= Math.exp(event.deltaY * 0.001);
      this._radiusScale = Math.max(0.75, Math.min(1.35, this._radiusScale));
    }, { passive: false });
  }
  update() {
    const offset = this.camera.position.clone().sub(this.target);
    let radius = offset.length() || 1;
    let theta = Math.atan2(offset.y, offset.x);
    let phi = Math.acos(THREE.MathUtils.clamp(offset.z / radius, -1, 1));
    const damping = this.enableDamping ? this.dampingFactor : 1;
    theta += this._thetaDelta * damping; phi += this._phiDelta * damping;
    this._thetaDelta *= (1 - damping); this._phiDelta *= (1 - damping);
    phi = THREE.MathUtils.clamp(phi, 0.02, this.maxPolarAngle);
    radius = THREE.MathUtils.clamp(radius * this._radiusScale, this.minDistance, this.maxDistance);
    this._radiusScale = 1;
    this.camera.position.set(this.target.x + radius * Math.sin(phi) * Math.cos(theta), this.target.y + radius * Math.sin(phi) * Math.sin(theta), this.target.z + radius * Math.cos(phi));
    this.camera.up.set(0, 0, 1); this.camera.lookAt(this.target);
    return true;
  }
}
const OrbitControls = LocalOrbitControls;

const sceneWrap = document.getElementById("sceneWrap");
const angleSlider = document.getElementById("angleSlider");
const angleLabel = document.getElementById("angleLabel");
const inclinationMode = document.getElementById("inclinationMode");
const angleModeLabel = document.getElementById("angleModeLabel");
const solidSelect = document.getElementById("solidSelect");
const apexDirectionField = document.getElementById("apexDirectionField");
const apexDirection = document.getElementById("apexDirection");
const guideSelect = document.getElementById("guideSelect");
const hintBtn = document.getElementById("hintBtn");
const answerBtn = document.getElementById("answerBtn");
const hintBox = document.getElementById("hintBox");
const quizFeedback = document.getElementById("quizFeedback");

const scene = new THREE.Scene();
scene.background = new THREE.Color("#f4f7fb");
const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
// This scene uses engineering-graphics coordinates: X horizontal, Y depth, Z vertical.
// Three.js defaults to Y-up, so explicitly make Z the vertical axis.
camera.up.set(0, 0, 1);
camera.position.set(8.5, -12.5, 8.0);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.domElement.setAttribute("aria-label", "Interactive 3D model of the selected solid. Drag to orbit the camera; use the controls to change the solid orientation.");
sceneWrap.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
// OrbitControls uses camera.up to determine the orbit's vertical direction.
// In this engineering-graphics scene Z is vertical, so camera.up is set above
// the controls are created. OrbitControls itself has no controls.up property.
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.target.set(0, -1.2, 1.35);
controls.minDistance = 5;
controls.maxDistance = 18;
controls.maxPolarAngle = Math.PI * 0.49;
controls.screenSpacePanning = true;
controls.update();

function resetCameraView() {
  // Keep the Z-up coordinate convention consistent when resetting the view.
  camera.up.set(0, 0, 1);
  camera.position.set(8.5, -12.5, 8.0);
  controls.target.set(0, -1.2, 1.35);
  controls.update();
}

scene.add(new THREE.HemisphereLight(0xffffff, 0xb9c7d9, 2.0));
const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
keyLight.position.set(5, -4, 9);
keyLight.castShadow = true;
scene.add(keyLight);

const grid = new THREE.GridHelper(10, 20, 0xc1ccdc, 0xe0e6ef);
// GridHelper is XZ by default. Rotate it into the XY plane so it lies on HP
// in this engineering scene where Z is the vertical axis.
grid.rotation.x = Math.PI / 2;
grid.position.z = 0.005;
scene.add(grid);

// Coordinate convention: x = horizontal on the sheet, y = depth, z = height.
// HP is z=0. VP is y=0. The solid rotates about Y or Z according to
// inclination mode, then is translated to remain above HP and in front of VP.
const hp = makePlane(10, 10, "#d99aa8", 0.20);
hp.rotation.x = 0;
hp.position.z = -0.015;
scene.add(hp);
const vp = makePlane(10, 5.5, "#78a9e6", 0.18);
vp.rotation.x = Math.PI / 2;
vp.position.y = 0;
vp.position.z = 2.3;
scene.add(vp);

// Plane labels are rendered as sprites so they remain legible in the 3D view.
function makeLabel(text, color, position, scale = 0.9) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = "bold 48px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false }));
  sprite.position.copy(position);
  sprite.scale.set(scale * 2.8, scale * 0.7, 1);
  sprite.renderOrder = 10;
  scene.add(sprite);
  return sprite;
}
makeLabel("HP · HORIZONTAL PLANE", "#a94f66", new THREE.Vector3(2.25, -4.55, 0.12), 0.8);
makeLabel("VP · VERTICAL PLANE", "#245fa8", new THREE.Vector3(-2.2, 0.05, 4.9), 0.8);
makeLabel("TV · TOP VIEW", "#a94f66", new THREE.Vector3(2.75, -3.85, 0.18), 0.62);
makeLabel("FV · FRONT VIEW", "#245fa8", new THREE.Vector3(1.65, -0.04, 3.95), 0.62);

function makePlane(w, h, color, opacity) {
  const geometry = new THREE.PlaneGeometry(w, h);
  const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false });
  return new THREE.Mesh(geometry, material);
}

const axes = new THREE.AxesHelper(1.7);
axes.position.set(-3.5, -3.2, 0.03);
scene.add(axes);

let solidGroup = new THREE.Group();
scene.add(solidGroup);
const projectionGroup = new THREE.Group();
scene.add(projectionGroup);
let rawVertices = [];
let edges = [];
let currentVertices = [];

let faceTriangles = [];
let solidFeatures = {};
const restingCondition = document.getElementById("restingCondition");
const restingStatus = document.getElementById("restingStatus");

function makeGeometry(kind) {
  // Keep the established longitudinal X-axis and YZ cross-sections.
  const length = 2.7;
  const radius = 1.0;
  const sidesByKind = { triangular: 3, square: 4, pentagonal: 5, hexagonal: 6,
    triangularPyramid: 3, squarePyramid: 4, pentagonalPyramid: 5, hexagonalPyramid: 6,
    cylinder: 16, cone: 16 };
  const sides = sidesByKind[kind] || 3;
  const vertices = [];
  const edgeList = [];
  const triangles = [];
  const features = { baseFaces: {}, baseEdges: {}, corners: {}, slantEdges: [], generators: [], apex: null };
  const ring = (x, count, r = radius) => {
    const ids = [];
    for (let i = 0; i < count; i++) {
      const a = 2 * Math.PI * i / count + Math.PI / 2;
      ids.push(vertices.length);
      vertices.push(new THREE.Vector3(x, r * Math.cos(a), r * Math.sin(a)));
    }
    return ids;
  };
  const addRingEdges = ids => {
    const ringEdges = [];
    for (let i = 0; i < ids.length; i++) {
      const edge = [ids[i], ids[(i + 1) % ids.length]];
      edgeList.push(edge); ringEdges.push(edge);
    }
    return ringEdges;
  };
  const addPrismFaces = (left, right) => {
    for (let i = 1; i < left.length - 1; i++) {
      triangles.push([left[0], left[i + 1], left[i]]);
      triangles.push([right[0], right[i], right[i + 1]]);
    }
    for (let i = 0; i < left.length; i++) {
      const j = (i + 1) % left.length;
      triangles.push([left[i], left[j], right[j]], [left[i], right[j], right[i]]);
      edgeList.push([left[i], right[i]]);
    }
  };

  if (kind === 'cylinder' || kind === 'cone') {
    const left = ring(-length / 2, sides, radius);
    features.baseFaces.left = left.slice();
    features.baseEdges.left = addRingEdges(left);
    features.corners.left = left.slice();
    for (let i = 1; i < sides - 1; i++) triangles.push([left[0], left[i + 1], left[i]]);
    if (kind === 'cylinder') {
      const right = ring(length / 2, sides, radius);
      features.baseFaces.right = right.slice();
      features.baseEdges.right = addRingEdges(right);
      features.corners.right = right.slice();
      for (let i = 1; i < sides - 1; i++) triangles.push([right[0], right[i], right[i + 1]]);
      for (let i = 0; i < sides; i++) {
        const j = (i + 1) % sides;
        triangles.push([left[i], left[j], right[j]], [left[i], right[j], right[i]]);
        const edge = [left[i], right[i]];
        edgeList.push(edge); features.generators.push(edge);
      }
    } else {
      const apex = vertices.length;
      vertices.push(new THREE.Vector3(length / 2, 0, 0));
      features.apex = apex;
      for (let i = 0; i < sides; i++) {
        const j = (i + 1) % sides;
        triangles.push([left[i], left[j], apex]);
        const edge = [left[i], apex];
        edgeList.push(edge); features.slantEdges.push(edge); features.generators.push(edge);
      }
      // A cone has no polygonal end face at the apex end.
      features.corners.right = [apex];
    }
  } else if (kind.endsWith('Pyramid')) {
    const base = ring(-length / 2, sides, radius);
    features.baseFaces.left = base.slice();
    features.baseEdges.left = addRingEdges(base);
    features.corners.left = base.slice();
    const apex = vertices.length;
    vertices.push(new THREE.Vector3(length / 2, 0, 0));
    features.apex = apex;
    features.corners.right = [apex];
    for (let i = 1; i < sides - 1; i++) triangles.push([base[0], base[i + 1], base[i]]);
    for (let i = 0; i < sides; i++) {
      const j = (i + 1) % sides;
      triangles.push([base[i], base[j], apex]);
      const edge = [base[i], apex];
      edgeList.push(edge); features.slantEdges.push(edge);
    }
  } else {
    const crossSection = kind === 'square'
      ? [[-0.9, 0], [0.9, 0], [0.9, 1.8], [-0.9, 1.8]]
      : kind === 'triangular'
        ? [[-1.1, 0], [1.1, 0], [0, 1.85]]
        : Array.from({ length: sides }, (_, i) => {
            const a = 2 * Math.PI * i / sides + Math.PI / 2;
            return [Math.cos(a), Math.sin(a)];
          });
    const left = [], right = [];
    for (const [y, z] of crossSection) { left.push(vertices.length); vertices.push(new THREE.Vector3(-length / 2, y, z)); }
    for (const [y, z] of crossSection) { right.push(vertices.length); vertices.push(new THREE.Vector3(length / 2, y, z)); }
    addPrismFaces(left, right);
    features.baseFaces.left = left.slice(); features.baseFaces.right = right.slice();
    features.baseEdges.left = addRingEdges(left); features.baseEdges.right = addRingEdges(right);
    features.corners.left = left.slice(); features.corners.right = right.slice();
  }

  const seen = new Set();
  const uniqueEdges = edgeList.filter(([a, b]) => {
    const key = a < b ? `${a}:${b}` : `${b}:${a}`;
    if (seen.has(key)) return false;
    seen.add(key); return true;
  });
  return { vertices, edges: uniqueEdges, triangles, features };
}
function getFaceTriangles() {
  return faceTriangles;
}

function barycentric2D(p, a, b, c) {
  const den = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]);
  if (Math.abs(den) < 1e-8) return null;
  const u = ((b[1] - c[1]) * (p[0] - c[0]) + (c[0] - b[0]) * (p[1] - c[1])) / den;
  const v = ((c[1] - a[1]) * (p[0] - c[0]) + (a[0] - c[0]) * (p[1] - c[1])) / den;
  const w = 1 - u - v;
  return u >= -1e-5 && v >= -1e-5 && w >= -1e-5 ? [u, v, w] : null;
}

// Classify an edge as hidden when another surface lies in front of its midpoint
// in the selected orthographic viewing direction.
function edgeIsHidden(edge, vertices, view) {
  const [aIndex, bIndex] = edge;
  const a = vertices[aIndex], b = vertices[bIndex];
  const midpoint = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
  const project = v => view === 'front' ? [v.x, v.z] : [v.x, v.y];
  const p = project(midpoint);
  const edgeDepth = view === 'front' ? midpoint.y : midpoint.z;
  const triangles = getFaceTriangles();
  for (const tri of triangles) {
    if (tri.includes(aIndex) && tri.includes(bIndex)) continue;
    const va = vertices[tri[0]], vb = vertices[tri[1]], vc = vertices[tri[2]];
    const weights = barycentric2D(p, project(va), project(vb), project(vc));
    if (!weights) continue;
    const depth = weights[0] * (view === 'front' ? va.y : va.z)
      + weights[1] * (view === 'front' ? vb.y : vb.z)
      + weights[2] * (view === 'front' ? vc.y : vc.z);
    // Viewer is at negative y for front view and positive z for top view.
    if (view === 'front' ? depth < edgeDepth - 0.015 : depth > edgeDepth + 0.015) return true;
  }
  return false;
}

function syncApexDirectionLabels() {
  if (!apexDirection) return;
  const plane = inclinationMode.value === "hp" ? "HP" : "VP";
  apexDirection.options[0].textContent = `Towards ${plane}`;
  apexDirection.options[1].textContent = `Away from ${plane}`;
}

function isApexSolid() {
  return solidSelect.value.endsWith("Pyramid") || solidSelect.value === "cone";
}

function signedInclinationAngle() {
  const a = Number(angleSlider.value) * Math.PI / 180;
  return isApexSolid() && apexDirection?.value === "away" ? -a : a;
}

function contactSideForAngle(signedAngle) {
  // Both modes put the +X end at the contact side for positive rotation.
  if (Math.abs(signedAngle) < 1e-8 && isApexSolid() && apexDirection?.value === "away") return "left";
  return signedAngle < -1e-8 ? "left" : "right";
}

function rotateForMode(v, signedAngle, roll = 0) {
  const cr = Math.cos(roll), sr = Math.sin(roll);
  const yr = v.y * cr - v.z * sr;
  const zr = v.y * sr + v.z * cr;
  const c = Math.cos(signedAngle), s = Math.sin(signedAngle);
  if (inclinationMode.value === "vp") {
    return new THREE.Vector3(v.x * c - yr * s, v.x * s + yr * c, zr);
  }
  return new THREE.Vector3(v.x * c + zr * s, yr, -v.x * s + zr * c);
}

function wrapAngle(a) {
  while (a > Math.PI) a -= 2 * Math.PI;
  while (a < -Math.PI) a += 2 * Math.PI;
  return a;
}

function edgeRollCandidates(edge, signedAngle) {
  const va = rawVertices[edge[0]], vb = rawVertices[edge[1]];
  const dx = vb.x - va.x, dy = vb.y - va.y, dz = vb.z - va.z;
  const target = inclinationMode.value === "hp"
    ? dx * Math.tan(signedAngle)
    : -dx * Math.tan(signedAngle);
  const A = inclinationMode.value === "hp" ? dy : -dz;
  const B = inclinationMode.value === "hp" ? dz : dy;
  const R = Math.hypot(A, B);
  if (R < 1e-8) return Math.abs(target) < 1e-7 ? [0] : [];
  if (Math.abs(target) > R + 1e-7) return [];
  const alpha = Math.asin(Math.max(-1, Math.min(1, target / R)));
  const delta = Math.atan2(B, A);
  return [wrapAngle(alpha - delta), wrapAngle(Math.PI - alpha - delta)];
}

function normalCoordinate(v) {
  return inclinationMode.value === "hp" ? v.z : v.y;
}

function isFeatureEdgeSupporting(edge, roll, signedAngle) {
  const transformed = rawVertices.map(v => rotateForMode(v, signedAngle, roll));
  const coordA = normalCoordinate(transformed[edge[0]]);
  const coordB = normalCoordinate(transformed[edge[1]]);
  if (Math.abs(coordA - coordB) > 1e-5) return false;
  const values = transformed.map(normalCoordinate);
  const support = inclinationMode.value === "hp" ? Math.min(...values) : Math.max(...values);
  return Math.abs((coordA + coordB) / 2 - support) < 1e-4;
}

function bestSupportingEdge(edgesToTry, signedAngle) {
  for (const edge of edgesToTry || []) {
    for (const roll of edgeRollCandidates(edge, signedAngle)) {
      if (isFeatureEdgeSupporting(edge, roll, signedAngle)) return { edge, roll };
    }
  }
  return null;
}

function cornerRoll(vertexIndex) {
  const v = rawVertices[vertexIndex];
  if (inclinationMode.value === "hp") return Math.atan2(-v.y, -v.z);
  return Math.atan2(-v.z, v.y);
}

function getRestingOptionSpecs() {
  const kind = solidSelect.value;
  const specs = [{ value: "automatic", label: "Automatic (current behavior)" },
    { value: "base", label: "Base (entire base face)" },
    { value: "baseEdge", label: "Base edge" },
    { value: "corner", label: (kind === "cone" || kind.endsWith("Pyramid")) ? "Corner / apex (symmetric only at apex)" : "Corner" }];
  if (kind.endsWith("Pyramid")) specs.push({ value: "slantEdge", label: "Slant edge" });
  if (kind === "cone" || kind === "cylinder") specs.push({ value: "generator", label: "Generator" });
  return specs;
}

function computeRestingTransform(type, signedAngle = signedInclinationAngle()) {
  if (type === "automatic") return { valid: true, roll: 0, anchor: null, type };
  const side = contactSideForAngle(signedAngle);
  const isApex = isApexSolid();
  const isBaseOnlyLeft = isApex && side === "right";
  if (type === "base") {
    if (Math.abs(Math.abs(signedAngle) - Math.PI / 2) > 1e-5) return { valid: false };
    if (isBaseOnlyLeft) return { valid: false };
    const face = solidFeatures.baseFaces?.[side];
    if (!face?.length) return { valid: false };
    return { valid: true, roll: 0, anchor: { type: "face", ids: face }, type };
  }
  if (type === "corner") {
    let candidates = solidFeatures.corners?.[side] || [];
    if (isApex && side === "right") {
      // Symmetric apex-resting condition: orient a regular pyramid/cone so a
      // pair of adjacent base vertices has equal distance from the reference
      // plane. Because the corresponding slant edges/generators are equal in
      // length, those two sides are equally inclined to the plane. The apex
      // itself must still be the supporting extreme and remains the anchor.
      const apexId = solidFeatures.apex;
      const baseRing = solidFeatures.baseFaces?.left || [];
      if (apexId == null || baseRing.length < 3) return { valid: false };
      for (let i = 0; i < baseRing.length; i++) {
        const edge = [baseRing[i], baseRing[(i + 1) % baseRing.length]];
        for (const roll of edgeRollCandidates(edge, signedAngle)) {
          const transformed = rawVertices.map(v => rotateForMode(v, signedAngle, roll));
          const vals = transformed.map(normalCoordinate);
          const extreme = inclinationMode.value === "hp" ? Math.min(...vals) : Math.max(...vals);
          const apexCoord = normalCoordinate(transformed[apexId]);
          const aCoord = normalCoordinate(transformed[edge[0]]);
          const bCoord = normalCoordinate(transformed[edge[1]]);
          if (Math.abs(aCoord - bCoord) < 1e-4 && Math.abs(apexCoord - extreme) < 1e-4) {
            return { valid: true, roll, anchor: { type: "point", ids: [apexId] }, type, symmetricApex: true };
          }
        }
      }
      return { valid: false };
    }
    if (!candidates.length) return { valid: false };
    // For non-apex corners, retain the existing support-corner behavior.
    let best = null;
    for (const id of candidates) {
      const roll = cornerRoll(id);
      const transformed = rawVertices.map(v => rotateForMode(v, signedAngle, roll));
      const vals = transformed.map(normalCoordinate);
      const extreme = inclinationMode.value === "hp" ? Math.min(...vals) : Math.max(...vals);
      const target = normalCoordinate(transformed[id]);
      if (Math.abs(target - extreme) < 1e-4) { best = { valid: true, roll, anchor: { type: "point", ids: [id] }, type }; break; }
    }
    return best || { valid: false };
  }
  let edgeList = [];
  if (type === "baseEdge") {
    edgeList = isBaseOnlyLeft
      ? (solidFeatures.baseEdges?.left || [])
      : (solidFeatures.baseEdges?.[side] || solidFeatures.baseEdges?.left || []);
  } else if (type === "slantEdge") {
    edgeList = solidFeatures.slantEdges || [];
  } else if (type === "generator") {
    edgeList = solidSelect.value === "cone"
      ? (solidFeatures.generators || [])
      : (solidFeatures.generators || []);
  }
  const found = bestSupportingEdge(edgeList, signedAngle);
  if (!found) return { valid: false };
  return { valid: true, roll: found.roll, anchor: { type: "edge", ids: found.edge }, type };
}

function refreshRestingOptions() {
  if (!restingCondition) return;
  const previous = restingCondition.value || "automatic";
  const specs = getRestingOptionSpecs();
  const signedAngle = signedInclinationAngle();
  restingCondition.innerHTML = "";
  const validity = {};
  for (const spec of specs) {
    const result = computeRestingTransform(spec.value, signedAngle);
    validity[spec.value] = result.valid;
    const option = document.createElement("option");
    option.value = spec.value;
    option.textContent = spec.label;
    option.disabled = !result.valid && spec.value !== "automatic";
    restingCondition.appendChild(option);
  }
  if (specs.some(s => s.value === previous) && validity[previous]) {
    restingCondition.value = previous;
    if (restingStatus) restingStatus.textContent = previous === "automatic"
      ? "Using the original automatic support placement."
      : `Selected contact feature is constrained to ${inclinationMode.value === "hp" ? "HP" : "VP"}.`;
  } else {
    restingCondition.value = "automatic";
    if (restingStatus) {
      restingStatus.textContent = previous === "automatic"
        ? "Choose a contact feature; options are disabled when the selected angle cannot support them."
        : `“${specs.find(s => s.value === previous)?.label || previous}” cannot rest on this plane at the current angle/direction. Automatic placement restored.`;
    }
  }
}

function rebuildSolid() {
  while (solidGroup.children.length) {
    const child = solidGroup.children.pop();
    child.geometry?.dispose();
    if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
    else child.material?.dispose();
  }
  const data = makeGeometry(solidSelect.value);
  rawVertices = data.vertices;
  edges = data.edges;
  solidFeatures = data.features || {};
  if (apexDirectionField) apexDirectionField.hidden = !(solidSelect.value.endsWith("Pyramid") || solidSelect.value === "cone");
  syncApexDirectionLabels();
  faceTriangles = data.triangles;
  const positions = [];
  faceTriangles.forEach(tri => tri.forEach(index => {
    const v = rawVertices[index]; positions.push(v.x, v.y, v.z);
  }));
  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.computeVertexNormals();
  const mesh = new THREE.Mesh(geom, new THREE.MeshStandardMaterial({
    color: '#5d8fd6', roughness: 0.58, metalness: 0.02, side: THREE.DoubleSide,
    transparent: true, opacity: 0.38
  }));
  mesh.castShadow = true; mesh.receiveShadow = true;
  solidGroup.add(mesh);
  const linePositions = [];
  edges.forEach(([a, b]) => {
    const va = rawVertices[a], vb = rawVertices[b];
    linePositions.push(va.x, va.y, va.z, vb.x, vb.y, vb.z);
  });
  const lineGeom = new THREE.BufferGeometry();
  lineGeom.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
  solidGroup.add(new THREE.LineSegments(lineGeom, new THREE.LineBasicMaterial({ color: '#194887', linewidth: 2 })));
  solidGroup.add(new THREE.Points(
    new THREE.BufferGeometry().setFromPoints(rawVertices),
    new THREE.PointsMaterial({ color: '#194887', size: 0.075, sizeAttenuation: true })
  ));
  refreshRestingOptions();
  updateModel();
}

function rotateAndLift(v, angle) {
  return rotateForMode(v, angle, 0);
}

function getTransformedVertices() {
  const angle = Number(angleSlider.value) * Math.PI / 180;
  const signedAngle = signedInclinationAngle();
  const type = restingCondition?.value || "automatic";
  const contact = computeRestingTransform(type, signedAngle);
  if (type !== "automatic" && !contact.valid) {
    if (restingCondition) restingCondition.value = "automatic";
    if (restingStatus) restingStatus.textContent = "This contact is not geometrically possible at the selected angle; automatic placement is being used.";
  }
  const activeType = type !== "automatic" && contact.valid ? type : "automatic";
  const roll = activeType === "automatic" ? 0 : contact.roll;
  const rotated = rawVertices.map(v => rotateForMode(v, signedAngle, roll));

  if (activeType === "automatic") {
    // Exact pre-selector behavior, retained as the safe default.
    const minZ = Math.min(...rotated.map(v => v.z));
    const maxY = Math.max(...rotated.map(v => v.y));
    if (inclinationMode.value === "hp") {
      return rotated.map(v => new THREE.Vector3(v.x, v.y - 3.2, Math.max(0, v.z - minZ)));
    }
    const verticalClearance = 1.2;
    return rotated.map(v => new THREE.Vector3(v.x, v.y - maxY, v.z - minZ + verticalClearance));
  }

  const ids = contact.anchor.ids;
  const anchorCoord = normalCoordinate(rotated[ids[0]]);
  const minZ = Math.min(...rotated.map(v => v.z));
  if (inclinationMode.value === "hp") {
    return rotated.map(v => new THREE.Vector3(v.x, v.y - 3.2, v.z - anchorCoord));
  }
  const maxY = Math.max(...rotated.map(v => v.y));
  return rotated.map(v => new THREE.Vector3(v.x, v.y - anchorCoord, v.z - minZ + 1.2));
}

function updateModel() {
  const angle = Number(angleSlider.value) * Math.PI / 180;
  currentVertices = getTransformedVertices();
  solidGroup.rotation.set(0, 0, 0);
  // Rebuild transformed mesh positions from the shared face list so the 3D
  // model and orthographic projections use exactly the same transformed points.
  const mesh = solidGroup.children[0];
  const lines = solidGroup.children[1];
  const points = solidGroup.children[2];
  const data = currentVertices;
  const pos = [];
  faceTriangles.forEach(tri => tri.forEach(index => {
    const v = data[index]; pos.push(v.x, v.y, v.z);
  }));
  mesh.geometry.dispose();
  mesh.geometry = new THREE.BufferGeometry();
  mesh.geometry.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  mesh.geometry.computeVertexNormals();
  const linePos = [];
  edges.forEach(([a, b]) => {
    const va = data[a], vb = data[b];
    linePos.push(va.x, va.y, va.z, vb.x, vb.y, vb.z);
  });
  lines.geometry.dispose();
  lines.geometry = new THREE.BufferGeometry();
  lines.geometry.setAttribute('position', new THREE.Float32BufferAttribute(linePos, 3));
  points.geometry.dispose();
  points.geometry = new THREE.BufferGeometry().setFromPoints(data);
  // Keep the object around the center of the workspace.
  solidGroup.position.set(0, 0, 0);
  renderProjections(data);
  angleLabel.textContent = `${angleSlider.value}°`;
  angleModeLabel.textContent = inclinationMode.value === "hp" ? "Inclination to HP" : "Inclination to VP";
}

function clearGroup(group) {
  while (group.children.length) {
    const child = group.children.pop();
    child.geometry?.dispose();
    if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
    else child.material?.dispose();
  }
}

function addLineSegments(group, segments, color, opacity = 1, dashed = false) {
  if (!segments.length) return;
  const positions = [];
  segments.forEach(([a, b]) => {
    positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  const material = dashed
    ? new THREE.LineDashedMaterial({ color, transparent: opacity < 1, opacity, dashSize: 0.11, gapSize: 0.08 })
    : new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity });
  const lines = new THREE.LineSegments(geometry, material);
  if (dashed) lines.computeLineDistances();
  group.add(lines);
}

function renderPlaneProjections(vertices) {
  clearGroup(projectionGroup);
  const hpVisible = [], hpHidden = [], vpVisible = [], vpHidden = [], projectors = [];
  edges.forEach(edge => {
    const [a, b] = edge;
    const va = vertices[a], vb = vertices[b];
    const hpSeg = [new THREE.Vector3(va.x, va.y, 0.025), new THREE.Vector3(vb.x, vb.y, 0.025)];
    const vpSeg = [new THREE.Vector3(va.x, 0.025, va.z), new THREE.Vector3(vb.x, 0.025, vb.z)];
    (edgeIsHidden(edge, vertices, 'top') ? hpHidden : hpVisible).push(hpSeg);
    (edgeIsHidden(edge, vertices, 'front') ? vpHidden : vpVisible).push(vpSeg);
    projectors.push([va, new THREE.Vector3(va.x, va.y, 0.04)]);
    projectors.push([va, new THREE.Vector3(va.x, 0.04, va.z)]);
  });
  if (guideSelect.value === 'on') addLineSegments(projectionGroup, projectors, '#7c8ca5', 0.62, true);
  addLineSegments(projectionGroup, hpVisible, '#087f8c', 0.98, false);
  addLineSegments(projectionGroup, hpHidden, '#087f8c', 0.95, true);
  addLineSegments(projectionGroup, vpVisible, '#d9772c', 0.98, false);
  addLineSegments(projectionGroup, vpHidden, '#d9772c', 0.95, true);
}

function renderDrawingSheet(vertices) {
  const svg = document.getElementById("drawingSheet");
  if (!svg) return;

  const front = vertices.map(v => [v.x, v.z]);
  const top = vertices.map(v => [v.x, v.y]);
  const allX = [...front, ...top].map(p => p[0]);
  const minX = Math.min(...allX), maxX = Math.max(...allX);
  const maxH = Math.max(...front.map(p => p[1]));
  const maxDepth = Math.max(0, ...top.map(p => -p[1]));

  // One common scale preserves dimensions. Crucially, the sheet uses world
  // coordinates relative to XY: z=0 maps onto XY in FV and y=0 maps onto XY
  // in TV. Do not independently subtract each view's minimum, which made a
  // solid resting on HP/VP appear to float away from XY.
  const scale = Math.min(
    230 / Math.max(maxX - minX, 0.1),
    185 / Math.max(maxH, 0.1),
    185 / Math.max(maxDepth, 0.1)
  );
  const cx = 350 - ((minX + maxX) / 2) * scale;
  const xyY = 250;
  const mapFront = p => [cx + p[0] * scale, xyY - p[1] * scale];
  const mapTop = p => [cx + p[0] * scale, xyY - p[1] * scale];

  const frontPts = front.map(mapFront);
  const topPts = top.map(mapTop);
  const showGuides = guideSelect.value === "on";
  let markup = `
    <rect x="0" y="0" width="700" height="500" fill="transparent"/>
    <line x1="28" y1="${xyY}" x2="672" y2="${xyY}" stroke="#172033" stroke-width="1.8"/>
    <text x="648" y="${xyY - 9}" fill="#172033" font-size="13" font-weight="800">X Y</text>
    <text x="350" y="26" text-anchor="middle" fill="#647089" font-size="11" letter-spacing="1.5">ORTHOGRAPHIC PROJECTION · FIRST-ANGLE LAYOUT</text>
    <text x="35" y="48" fill="#647089" font-size="11">FRONT VIEW</text>
    <text x="35" y="477" fill="#647089" font-size="11">TOP VIEW</text>
  `;

  // Projectors: corresponding points share x coordinates across XY.
  if (showGuides) {
    vertices.forEach((v, i) => {
      const xf = frontPts[i][0], yf = frontPts[i][1], yt = topPts[i][1];
      markup += `<line x1="${xf.toFixed(2)}" y1="${yf.toFixed(2)}" x2="${xf.toFixed(2)}" y2="${yt.toFixed(2)}" stroke="#8b98aa" stroke-width="1" stroke-dasharray="4 4"/>`;
    });
  }

  function drawEdges(mapped, color, view) {
    edges.forEach(edge => {
      const [a, b] = edge;
      const [x1, y1] = mapped[a], [x2, y2] = mapped[b];
      const hidden = edgeIsHidden(edge, vertices, view);
      const dash = hidden ? ' stroke-dasharray="5 4"' : '';
      const opacity = hidden ? ' opacity="0.82"' : '';
      markup += `<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" stroke="${color}" stroke-width="2.2" stroke-linecap="round"${dash}${opacity}/>`;
    });
    mapped.forEach(([x, y]) => {
      markup += `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="2.5" fill="${color}"/>`;
    });
  }
  drawEdges(frontPts, "#d9772c", 'front');
  drawEdges(topPts, "#087f8c", 'top');
  svg.innerHTML = markup;
}

function renderProjections(vertices) {
  renderPlaneProjections(vertices);
  renderDrawingSheet(vertices);
}

function resize() {
  const width = sceneWrap.clientWidth;
  const height = Math.max(300, sceneWrap.clientHeight);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}
const resizeObserver = new ResizeObserver(resize);
resizeObserver.observe(sceneWrap);
resize();

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

angleSlider.addEventListener("input", () => { refreshRestingOptions(); updateModel(); });
inclinationMode.addEventListener("change", () => {
  angleModeLabel.textContent = inclinationMode.value === "hp" ? "Inclination to HP" : "Inclination to VP";
  syncApexDirectionLabels();
  refreshRestingOptions();
  updateModel();
});
solidSelect.addEventListener("change", rebuildSolid);
apexDirection?.addEventListener("change", () => { refreshRestingOptions(); updateModel(); });
restingCondition?.addEventListener("change", () => { refreshRestingOptions(); updateModel(); });
guideSelect.addEventListener("change", updateModel);
document.getElementById("resetBtn").addEventListener("click", () => {
  angleSlider.value = "30";
  inclinationMode.value = "vp";
  if (apexDirection) apexDirection.value = "towards";
  if (restingCondition) restingCondition.value = "automatic";
  angleModeLabel.textContent = "Inclination to VP";
  solidSelect.value = "triangular";
  guideSelect.value = "on";
  resetCameraView();
  hintBox.hidden = true;
  quizFeedback.hidden = true;
  rebuildSolid();
});
hintBtn.addEventListener("click", () => {
  hintBox.hidden = false;
  hintBox.className = "feedback";
  hintBox.textContent = "Hint: the physical edge keeps its actual length in 3D. An orthographic view shows only the component of that edge along the view's image plane, so its projected length can change with orientation.";
});
answerBtn.addEventListener("click", () => {
  hintBox.hidden = false;
  hintBox.className = "feedback";
  hintBox.innerHTML = "<strong>Explanation:</strong> The actual edge length does not change during a rigid rotation. Its projected length can change because the projection records only the components visible in that view. For an edge of length L making angle θ with the projection plane's normal, its projected length is L sin θ; equivalently, it is L cos α when α is the angle between the edge and the projection plane.";
});
document.querySelectorAll(".quiz-option").forEach(button => {
  button.addEventListener("click", () => {
    quizFeedback.hidden = false;
    const correct = button.dataset.answer === "true-length";
    quizFeedback.className = correct ? "feedback correct" : "feedback";
    quizFeedback.textContent = correct
      ? "Correct. An edge parallel to VP is parallel to the plane of projection, so its front view shows the true length."
      : "Not quite. An edge parallel to VP is parallel to the front-view projection plane, so its front view shows the true length.";
  });
});

rebuildSolid();
