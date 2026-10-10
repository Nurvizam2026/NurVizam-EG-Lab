import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const sceneWrap = document.getElementById("sceneWrap");
const angleSlider = document.getElementById("angleSlider");
const angleLabel = document.getElementById("angleLabel");
const inclinationMode = document.getElementById("inclinationMode");
const angleModeLabel = document.getElementById("angleModeLabel");
const solidSelect = document.getElementById("solidSelect");
const guideSelect = document.getElementById("guideSelect");
const hintBtn = document.getElementById("hintBtn");
const answerBtn = document.getElementById("answerBtn");
const hintBox = document.getElementById("hintBox");
const quizFeedback = document.getElementById("quizFeedback");

const scene = new THREE.Scene();
scene.background = new THREE.Color("#f4f7fb");
const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
camera.position.set(0, -12.5, 7.2);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.domElement.setAttribute("aria-label", "Interactive 3D prism. Drag to rotate the camera.");
sceneWrap.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.target.set(0, -1.1, 1.65);
controls.minDistance = 5;
controls.maxDistance = 18;
controls.maxPolarAngle = Math.PI * 0.49;

scene.add(new THREE.HemisphereLight(0xffffff, 0xb9c7d9, 2.0));
const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
keyLight.position.set(5, -4, 9);
keyLight.castShadow = true;
scene.add(keyLight);

const grid = new THREE.GridHelper(10, 20, 0xc1ccdc, 0xe0e6ef);
grid.position.z = 0.005;
scene.add(grid);

// Coordinate convention: x = horizontal on the sheet, y = depth, z = height.
// HP is z=0. VP is y=0. The object is rotated about the y axis and then
// translated vertically so its lowest point stays on HP.
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
makeLabel("HP · HORIZONTAL PLANE", "#a94f66", new THREE.Vector3(2.25, -3.9, 0.12), 0.8);
makeLabel("VP · VERTICAL PLANE", "#245fa8", new THREE.Vector3(-2.2, 0.05, 4.9), 0.8);
makeLabel("TV · TOP VIEW", "#a94f66", new THREE.Vector3(1.65, -3.15, 0.18), 0.62);
makeLabel("FV · FRONT VIEW", "#245fa8", new THREE.Vector3(1.65, -0.04, 3.95), 0.62);

function makePlane(w, h, color, opacity) {
  const geometry = new THREE.PlaneGeometry(w, h);
  const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false });
  return new THREE.Mesh(geometry, material);
}

const axes = new THREE.AxesHelper(1.7);
axes.position.set(-3.5, -2.6, 0.03);
scene.add(axes);

let solidGroup = new THREE.Group();
scene.add(solidGroup);
const projectionGroup = new THREE.Group();
scene.add(projectionGroup);
let rawVertices = [];
let edges = [];
let currentVertices = [];

function makeGeometry(kind) {
  const height = 2.7;
  const mode = inclinationMode.value;
  let polygon;
  if (kind === "square") {
    polygon = [[-1.0, -0.9], [1.0, -0.9], [1.0, 0.9], [-1.0, 0.9]];
  } else {
    polygon = [[-1.1, -0.85], [1.1, -0.85], [0, 1.0]];
  }
  const n = polygon.length;
  const vertices = [];
  if (mode === "hp") {
    // Axis initially perpendicular to HP (z direction), parallel to VP.
    polygon.forEach(([x, y]) => vertices.push(new THREE.Vector3(x, y, 0)));
    polygon.forEach(([x, y]) => vertices.push(new THREE.Vector3(x, y, height)));
  } else {
    // Axis initially perpendicular to VP (y direction), parallel to HP.
    polygon.forEach(([x, z]) => vertices.push(new THREE.Vector3(x, 0, Math.max(0, z + 0.9))));
    polygon.forEach(([x, z]) => vertices.push(new THREE.Vector3(x, height, Math.max(0, z + 0.9))));
  }
  const edgeList = [];
  for (let i = 0; i < n; i++) {
    edgeList.push([i, (i + 1) % n]);
    edgeList.push([i + n, ((i + 1) % n) + n]);
    edgeList.push([i, i + n]);
  }
  return { vertices, edges: edgeList, n };
}

function getFaceTriangles() {
  const n = rawVertices.length / 2;
  const triangles = [];
  for (let i = 1; i < n - 1; i++) {
    triangles.push([0, i + 1, i]);
    triangles.push([n, n + i, n + i + 1]);
  }
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    triangles.push([i, j, j + n], [i, j + n, i + n]);
  }
  return triangles;
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
  const faces = [];
  const n = data.n;
  // bottom polygon, top polygon, and side quads
  for (let i = 1; i < n - 1; i++) {
    faces.push(0, i + 1, i);
    faces.push(n, n + i, n + i + 1);
  }
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    faces.push(i, j, j + n, i, j + n, i + n);
  }
  const positions = [];
  faces.forEach(index => {
    const v = rawVertices[index];
    positions.push(v.x, v.y, v.z);
  });
  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geom.computeVertexNormals();
  const mesh = new THREE.Mesh(geom, new THREE.MeshStandardMaterial({
    color: "#5d8fd6", roughness: 0.58, metalness: 0.02, side: THREE.DoubleSide,
    transparent: true, opacity: 0.38
  }));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  solidGroup.add(mesh);

  const linePositions = [];
  edges.forEach(([a, b]) => {
    const va = rawVertices[a], vb = rawVertices[b];
    linePositions.push(va.x, va.y, va.z, vb.x, vb.y, vb.z);
  });
  const lineGeom = new THREE.BufferGeometry();
  lineGeom.setAttribute("position", new THREE.Float32BufferAttribute(linePositions, 3));
  const lines = new THREE.LineSegments(lineGeom, new THREE.LineBasicMaterial({ color: "#194887", linewidth: 2 }));
  solidGroup.add(lines);

  const points = new THREE.Points(
    new THREE.BufferGeometry().setFromPoints(rawVertices),
    new THREE.PointsMaterial({ color: "#194887", size: 0.075, sizeAttenuation: true })
  );
  solidGroup.add(points);
  updateModel();
}

function rotateAndLift(v, angle) {
  const c = Math.cos(angle), s = Math.sin(angle);
  if (inclinationMode.value === "vp") {
    // Axis lies in HP (z unchanged) and rotates away from VP around z.
    return new THREE.Vector3(v.x * c - v.y * s, v.x * s + v.y * c, v.z);
  }
  // Axis stays parallel to VP and tilts away from HP by rotation about y.
  const x = v.x * c + v.z * s;
  const y = v.y;
  const z = -v.x * s + v.z * c;
  return new THREE.Vector3(x, y, z);
}

function getTransformedVertices() {
  const angle = Number(angleSlider.value) * Math.PI / 180;
  const rotated = rawVertices.map(v => rotateAndLift(v, angle));
  const minZ = Math.min(...rotated.map(v => v.z));
  // Keep the solid above HP (z >= 0) and on the viewer side of VP (y < 0).
  return rotated.map(v => new THREE.Vector3(v.x, v.y - 2.6, v.z - minZ + 0.08));
}

function updateModel() {
  const angle = Number(angleSlider.value) * Math.PI / 180;
  currentVertices = getTransformedVertices();
  solidGroup.rotation.set(0, 0, 0);
  // Rebuild transformed mesh positions from canonical vertices for exact agreement
  // between the 3D model and SVG projections.
  const mesh = solidGroup.children[0];
  const lines = solidGroup.children[1];
  const points = solidGroup.children[2];
  const data = currentVertices;
  const n = rawVertices.length / 2;
  const polygonN = n;
  const faces = [];
  for (let i = 1; i < polygonN - 1; i++) {
    faces.push(0, i + 1, i);
    faces.push(polygonN, polygonN + i, polygonN + i + 1);
  }
  for (let i = 0; i < polygonN; i++) {
    const j = (i + 1) % polygonN;
    faces.push(i, j, j + polygonN, i, j + polygonN, i + polygonN);
  }
  const pos = [];
  faces.forEach(index => { const v = data[index]; pos.push(v.x, v.y, v.z); });
  mesh.geometry.dispose();
  mesh.geometry = new THREE.BufferGeometry();
  mesh.geometry.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  mesh.geometry.computeVertexNormals();
  const linePos = [];
  edges.forEach(([a, b]) => {
    const va = data[a], vb = data[b];
    linePos.push(va.x, va.y, va.z, vb.x, vb.y, vb.z);
  });
  lines.geometry.dispose();
  lines.geometry = new THREE.BufferGeometry();
  lines.geometry.setAttribute("position", new THREE.Float32BufferAttribute(linePos, 3));
  points.geometry.dispose();
  points.geometry = new THREE.BufferGeometry().setFromPoints(data);
  // Keep the object around the center of the workspace.
  solidGroup.position.set(0, 0, 0);
  renderProjections(data);
  angleLabel.textContent = `${angleSlider.value}°`;
  angleModeLabel.textContent = inclinationMode.value === "vp" ? "Inclination to HP" : "Inclination to VP";
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
  const minH = Math.min(...front.map(p => p[1]));
  const maxH = Math.max(...front.map(p => p[1]));
  const minD = Math.min(...top.map(p => p[1]));
  const maxD = Math.max(...top.map(p => p[1]));

  // One common scale preserves relative dimensions between front and top views.
  const scale = Math.min(230 / Math.max(maxX - minX, 0.1), 145 / Math.max(maxH - minH, 0.1), 105 / Math.max(maxD - minD, 0.1));
  const cx = 350 - ((minX + maxX) / 2) * scale;
  const xyY = 250;
  const mapFront = p => [cx + p[0] * scale, xyY - (p[1] - minH) * scale - 24];
  const mapTop = p => [cx + p[0] * scale, xyY + 24 + (p[1] - minD) * scale];

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

angleSlider.addEventListener("input", updateModel);
inclinationMode.addEventListener("change", () => {
  angleModeLabel.textContent = inclinationMode.value === "vp" ? "Inclination to HP" : "Inclination to VP";
  rebuildSolid();
});
solidSelect.addEventListener("change", rebuildSolid);
guideSelect.addEventListener("change", updateModel);
document.getElementById("resetBtn").addEventListener("click", () => {
  angleSlider.value = "30";
  inclinationMode.value = "vp";
  angleModeLabel.textContent = "Inclination to HP";
  solidSelect.value = "triangular";
  guideSelect.value = "on";
  camera.position.set(0, -12.5, 7.2);
  controls.target.set(0, -1.1, 1.65);
  controls.update();
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
    const correct = button.dataset.answer === "no";
    quizFeedback.className = correct ? "feedback correct" : "feedback";
    quizFeedback.textContent = correct
      ? "Correct. In this model, the prism's axis tilts away from vertical, so its vertical component in the front view is shorter than its true length."
      : "Try again. The physical axis keeps its true length, but an orthographic view shows its projected components, which can be shorter.";
  });
});

rebuildSolid();
