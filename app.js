import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const sceneWrap = document.getElementById("sceneWrap");
const loading = document.getElementById("sceneLoading");
const angleSlider = document.getElementById("angleSlider");
const angleLabel = document.getElementById("angleLabel");
const solidSelect = document.getElementById("solidSelect");
const guideSelect = document.getElementById("guideSelect");
const hintBtn = document.getElementById("hintBtn");
const answerBtn = document.getElementById("answerBtn");
const hintBox = document.getElementById("hintBox");
const quizFeedback = document.getElementById("quizFeedback");

const scene = new THREE.Scene();
scene.background = new THREE.Color("#f4f7fb");
const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
camera.position.set(7.8, -9.5, 7.2);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.domElement.setAttribute("aria-label", "Interactive 3D prism. Drag to rotate the camera.");
sceneWrap.appendChild(renderer.domElement);
loading.hidden = true;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.target.set(0, 0, 1.2);
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
const hp = makePlane(10, 10, "#168b8b", 0.16);
hp.rotation.x = 0;
hp.position.z = -0.015;
scene.add(hp);
const vp = makePlane(10, 5.5, "#e38a3c", 0.11);
vp.rotation.x = Math.PI / 2;
vp.position.y = -2.6;
vp.position.z = 2.3;
scene.add(vp);

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
let rawVertices = [];
let edges = [];
let currentVertices = [];

function makeGeometry(kind) {
  const depth = 1.65;
  const height = 2.7;
  let polygon;
  if (kind === "square") {
    polygon = [[-1.0, -0.9], [1.0, -0.9], [1.0, 0.9], [-1.0, 0.9]];
  } else {
    polygon = [[-1.1, -0.85], [1.1, -0.85], [0, 1.0]];
  }
  // Polygon coordinates are x/y; duplicate at z=0 and z=height.
  const n = polygon.length;
  const vertices = [];
  polygon.forEach(([x, y]) => vertices.push(new THREE.Vector3(x, y, 0)));
  polygon.forEach(([x, y]) => vertices.push(new THREE.Vector3(x, y, height)));
  const edgeList = [];
  for (let i = 0; i < n; i++) {
    edgeList.push([i, (i + 1) % n]);
    edgeList.push([i + n, ((i + 1) % n) + n]);
    edgeList.push([i, i + n]);
  }
  return { vertices, edges: edgeList, n };
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
  // Rotation about y axis. z' = -x sin(a) + z cos(a).
  const x = v.x * c + v.z * s;
  const y = v.y;
  const z = -v.x * s + v.z * c;
  return new THREE.Vector3(x, y, z);
}

function getTransformedVertices() {
  const angle = Number(angleSlider.value) * Math.PI / 180;
  const rotated = rawVertices.map(v => rotateAndLift(v, angle));
  const minZ = Math.min(...rotated.map(v => v.z));
  return rotated.map(v => new THREE.Vector3(v.x, v.y, v.z - minZ));
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
}

function renderProjections(vertices) {
  const configs = [
    { id: "frontSvg", project: v => [v.x, v.z] },
    { id: "topSvg", project: v => [v.x, v.y] },
    { id: "sideSvg", project: v => [v.y, v.z] }
  ];
  configs.forEach(config => {
    const svg = document.getElementById(config.id);
    const points = vertices.map(config.project);
    const minX = Math.min(...points.map(p => p[0])), maxX = Math.max(...points.map(p => p[0]));
    const minY = Math.min(...points.map(p => p[1])), maxY = Math.max(...points.map(p => p[1]));
    const spanX = Math.max(maxX - minX, 0.1), spanY = Math.max(maxY - minY, 0.1);
    const scale = Math.min(200 / spanX, 132 / spanY);
    const offsetX = 130 - ((minX + maxX) / 2) * scale;
    const offsetY = 94 + ((minY + maxY) / 2) * scale;
    const mapPoint = p => [offsetX + p[0] * scale, offsetY - p[1] * scale];
    const mapped = points.map(mapPoint);
    const showGuides = guideSelect.value === "on";
    let markup = "";
    // subtle center/reference line
    markup += `<line x1="16" y1="94" x2="244" y2="94" stroke="#dbe3ee" stroke-width="1" stroke-dasharray="3 4"/>`;
    if (showGuides) {
      const baseline = config.id === "topSvg" ? 94 : 164;
      markup += `<line x1="16" y1="${baseline}" x2="244" y2="${baseline}" stroke="#168b8b" stroke-width="1.5" stroke-dasharray="5 4"/>`;
    }
    edges.forEach(([a, b]) => {
      const [x1, y1] = mapped[a], [x2, y2] = mapped[b];
      markup += `<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" stroke="#275dad" stroke-width="2" stroke-linecap="round"/>`;
    });
    mapped.forEach(([x, y]) => {
      markup += `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="2.5" fill="#194887"/>`;
    });
    svg.innerHTML = markup;
  });
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
solidSelect.addEventListener("change", rebuildSolid);
guideSelect.addEventListener("change", updateModel);
document.getElementById("resetBtn").addEventListener("click", () => {
  angleSlider.value = "30";
  solidSelect.value = "triangular";
  guideSelect.value = "on";
  camera.position.set(7.8, -9.5, 7.2);
  controls.target.set(0, 0, 1.2);
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
