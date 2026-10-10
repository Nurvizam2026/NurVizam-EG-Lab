const THREE = await loadThree();
async function loadThree(){
  const urls=["https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js","https://unpkg.com/three@0.160.0/build/three.module.js","https://esm.sh/three@0.160.0"];
  let last; for(const url of urls){try{return await import(url)}catch(e){last=e;console.warn("Three.js source unavailable",url,e)}}
  throw new Error("Three.js could not load. Check internet access to a Three.js CDN. "+(last?.message||""));
}
const $=id=>document.getElementById(id);
const solidSelect=$("solidSelect"),conditionSelect=$("conditionSelect"),cornerSelect=$("cornerSelect"),cornerSelectField=$("cornerSelectField"),angleA=$("angleA"),angleB=$("angleB"),angleAValue=$("angleAValue"),angleBValue=$("angleBValue"),angleALabel=$("angleALabel"),angleBLabel=$("angleBLabel"),edgeSelect=$("edgeSelect"),edgeSelectField=$("edgeSelectField"),restingCondition=$("restingCondition"),restingPlane=$("restingPlane"),apexDirectionField=$("apexDirectionField"),apexDirection=$("apexDirection"),geometryStatus=$("geometryStatus"),conditionHelp=$("conditionHelp"),sceneWrap=$("sceneWrap"),sheet=$("drawingSheet"),ctx=sheet.getContext("2d");
const scene=new THREE.Scene();scene.background=new THREE.Color("#f4f7fb");
const camera=new THREE.PerspectiveCamera(38,1,.1,100);camera.up.set(0,0,1);camera.position.set(7.5,-10,7.5);
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.domElement.setAttribute("aria-label","Interactive 3D solid. Drag to rotate the camera and scroll to zoom.");sceneWrap.replaceChildren(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xffffff,0xb9c7d9,2));const light=new THREE.DirectionalLight(0xffffff,2.2);light.position.set(5,-5,8);scene.add(light);
const hp=new THREE.Mesh(new THREE.PlaneGeometry(9,9),new THREE.MeshBasicMaterial({color:0xd99aa8,transparent:true,opacity:.22,side:THREE.DoubleSide,depthWrite:false}));hp.position.z=0;scene.add(hp);
const vp=new THREE.Mesh(new THREE.PlaneGeometry(9,6),new THREE.MeshBasicMaterial({color:0x78a9e6,transparent:true,opacity:.2,side:THREE.DoubleSide,depthWrite:false}));vp.rotation.x=Math.PI/2;vp.position.y=0;vp.position.z=2.5;scene.add(vp);
const grid=new THREE.GridHelper(9,18,0xc1ccdc,0xe0e6ef);grid.rotation.x=Math.PI/2;grid.position.z=-.02;scene.add(grid);
let drag=null,theta=-.93,phi=.86,radius=12;
renderer.domElement.addEventListener("pointerdown",e=>{drag={x:e.clientX,y:e.clientY};renderer.domElement.setPointerCapture?.(e.pointerId)});
renderer.domElement.addEventListener("pointermove",e=>{if(!drag)return;theta-=(e.clientX-drag.x)*.008;phi=Math.max(.08,Math.min(1.48,phi+(e.clientY-drag.y)*.008));drag={x:e.clientX,y:e.clientY};updateCamera()});
renderer.domElement.addEventListener("pointerup",()=>drag=null);renderer.domElement.addEventListener("pointercancel",()=>drag=null);renderer.domElement.addEventListener("wheel",e=>{e.preventDefault();radius=Math.max(6,Math.min(20,radius*Math.exp(e.deltaY*.001)));updateCamera()},{passive:false});
function updateCamera(){camera.position.set(radius*Math.sin(phi)*Math.cos(theta),radius*Math.sin(phi)*Math.sin(theta),radius*Math.cos(phi));camera.lookAt(0,-.3,1.2)}updateCamera();
let solidGroup=new THREE.Group();scene.add(solidGroup);
// Projection geometry is kept separate from the solid so updates never overwrite it.
const projectionGroup=new THREE.Group();scene.add(projectionGroup);
let rawVertices=[],edges=[],faceIndices=[],currentVertices=[];
function clearGroup(group){while(group.children.length){const child=group.children.pop();child.geometry?.dispose();if(Array.isArray(child.material))child.material.forEach(m=>m.dispose());else child.material?.dispose();}}
function addSceneLabel(text,color,position){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const c=canvas.getContext('2d');
 c.clearRect(0,0,canvas.width,canvas.height);c.fillStyle='rgba(255,255,255,.9)';c.strokeStyle=color;c.lineWidth=5;
 c.beginPath();c.roundRect(8,8,496,112,24);c.fill();c.stroke();c.fillStyle=color;c.font='bold 54px system-ui';c.textAlign='center';c.textBaseline='middle';c.fillText(text,256,66);
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
 const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:false}));sprite.position.set(...position);sprite.scale.set(1.55,.39,1);scene.add(sprite);
}
addSceneLabel('HP — TOP VIEW (TV)','#9f4355',[3.25,-3.35,.08]);
addSceneLabel('VP — FRONT VIEW (FV)','#245fa8',[3.25,-.02,5.05]);
const xyGeometry=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-4.5,0,0),new THREE.Vector3(4.5,0,0)]);
scene.add(new THREE.Line(xyGeometry,new THREE.LineBasicMaterial({color:0x34445a})));
const kindInfo={triangular:{n:3,type:"prism"},square:{n:4,type:"prism"},cube:{n:4,type:"prism"},pentagonal:{n:5,type:"prism"},hexagonal:{n:6,type:"prism"},triangularPyramid:{n:3,type:"pyramid"},squarePyramid:{n:4,type:"pyramid"},pentagonalPyramid:{n:5,type:"pyramid"},hexagonalPyramid:{n:6,type:"pyramid"},cylinder:{n:24,type:"cylinder"},cone:{n:24,type:"cone"}};
function isBodyDiagonalCondition(value=conditionSelect.value){return value==="bodyDiagonal"||value.startsWith("bodyDiagonal");}
function applyNamedDiagonalCondition(){const c=conditionSelect.value;angleA.disabled=false;angleB.disabled=false;angleA.max="90";angleB.max="90";if(c==="bodyDiagonalHPPerp"){angleA.value="90";angleB.value="0";angleA.disabled=angleB.disabled=true;}else if(c==="bodyDiagonalHPParallel"){angleA.value="0";angleA.disabled=true;}else if(c==="bodyDiagonalVPPerp"){angleA.value="0";angleB.value="90";angleA.disabled=angleB.disabled=true;}else if(c==="bodyDiagonalVPParallel"){angleB.value="0";angleB.disabled=true;}if(isBodyDiagonalCondition(c)&&c==="bodyDiagonal") {const maxB=Math.floor(Math.acos(Math.max(-1,Math.min(1,Math.sin(Number(angleA.value)*Math.PI/180))))*180/Math.PI);angleB.max=String(maxB);if(Number(angleB.value)>maxB)angleB.value=String(maxB);}}
function makeSolid(kind){const {n,type}=kindInfo[kind],v=[],e=[],faces=[],slantEdges=[];const len=kind==="cube"?2.1:2.8,r=kind==="cube"?len/Math.sqrt(2):1.05;
 const ring=x=>{const ids=[];for(let i=0;i<n;i++){const a=2*Math.PI*i/n+Math.PI/2;ids.push(v.length);v.push(new THREE.Vector3(x,r*Math.cos(a),r*Math.sin(a)))}return ids};
 const a=ring(-len/2),b=(type==="prism"||type==="cylinder")?ring(len/2):[];
 const ringEdges=ids=>{for(let i=0;i<ids.length;i++)e.push([ids[i],ids[(i+1)%ids.length]])};ringEdges(a);
 if(type==="prism"||type==="cylinder"){
   ringEdges(b);for(let i=0;i<n;i++){e.push([a[i],b[i]]);faces.push([a[i],a[(i+1)%n],b[(i+1)%n]],[a[i],b[(i+1)%n],b[i]])}
   for(let i=1;i<n-1;i++){faces.push([a[0],a[i+1],a[i]],[b[0],b[i],b[i+1]])}
 }else{
   const apex=v.length;v.push(new THREE.Vector3(len/2,0,0));for(let i=0;i<n;i++){e.push([a[i],apex]);slantEdges.push([a[i],apex]);faces.push([a[i],a[(i+1)%n],apex])}for(let i=1;i<n-1;i++)faces.push([a[0],a[i+1],a[i]])
 }
 if(type==="cylinder")for(let i=0;i<n;i++)slantEdges.push([a[i],b[i]]);
 return {vertices:v,edges:e,faces,baseRing:a,baseEdges:a.map((id,i)=>[id,a[(i+1)%n]]),slantEdges,type};
}
function syncApexDirectionControl(){
 const apexSolid=solidSelect.value.endsWith("Pyramid")||solidSelect.value==="cone";
 const applicable=apexSolid&&!isBodyDiagonalCondition();
 apexDirectionField.hidden=!applicable;
 apexDirection.disabled=!applicable;
 const label=apexDirectionField.querySelector("span");
 if(label)label.textContent=`Apex direction relative to ${restingPlane.value}`;
}
function setSolid(kind){while(solidGroup.children.length){const o=solidGroup.children.pop();o.geometry?.dispose();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material?.dispose()}const g=makeSolid(kind);rawVertices=g.vertices;edges=g.edges;faceIndices=g.faces;window.__solidType=g.type;const pos=[];for(const f of g.faces)for(const id of f)pos.push(g.vertices[id].x,g.vertices[id].y,g.vertices[id].z);const geom=new THREE.BufferGeometry();geom.setAttribute("position",new THREE.Float32BufferAttribute(pos,3));geom.computeVertexNormals();solidGroup.add(new THREE.Mesh(geom,new THREE.MeshStandardMaterial({color:0x7ca7df,roughness:.7,metalness:.02,side:THREE.DoubleSide,flatShading:true,transparent:true,opacity:.92})));
 const ep=[];for(const [i,j] of g.edges){const p=g.vertices[i],q=g.vertices[j];ep.push(p.x,p.y,p.z,q.x,q.y,q.z)}const eg=new THREE.BufferGeometry();eg.setAttribute("position",new THREE.Float32BufferAttribute(ep,3));solidGroup.add(new THREE.LineSegments(eg,new THREE.LineBasicMaterial({color:0x163b67,linewidth:1.5})));window.__baseEdges=g.baseEdges;window.__baseRing=g.baseRing;window.__slantEdges=g.slantEdges;if(cornerSelect){cornerSelect.innerHTML="";g.baseRing.forEach((id,i)=>{const o=document.createElement("option");o.value=String(id);o.textContent=`Base corner ${i+1}`;cornerSelect.appendChild(o);});}syncApexDirectionControl();refreshEdgeOptions();updateModel();}
function alignXTo(direction){return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1,0,0),direction.clone().normalize())}
function cubeBodyDiagonalForCorner(vertexId){
 if(solidSelect.value!=="cube")return null;
 const ring=window.__baseRing||[],i=ring.indexOf(vertexId);if(i<0)return null;
 const opposite=ring.length+((i+2)%ring.length);
 if(opposite<0||opposite>=rawVertices.length)return null;
 return rawVertices[opposite].clone().sub(rawVertices[vertexId]);
}
function axisDirectionFromControls(){
 const a=Number(angleA.value)*Math.PI/180,b=Number(angleB.value)*Math.PI/180;
 const condition=conditionSelect.value,plane=restingPlane.value;
 if(condition==="axisBoth"||isBodyDiagonalCondition(condition)){
   const sx=Math.sin(a),sy=Math.sin(b),remaining=1-sx*sx-sy*sy;
   if(isBodyDiagonalCondition(condition))return new THREE.Vector3(Math.sqrt(Math.max(0,remaining)),-sy,sx).normalize();
   const apexSolid=solidSelect.value.endsWith("Pyramid")||solidSelect.value==="cone";
   const toward=apexSolid&&apexDirection.value==="toward";
   const ySign=plane==="VP"&&toward?1:-1;
   const zSign=plane==="HP"&&toward?-1:1;
   return new THREE.Vector3(Math.sqrt(Math.max(0,remaining)),ySign*sy,zSign*sx).normalize();
 }
 const apexSolid=solidSelect.value.endsWith("Pyramid")||solidSelect.value==="cone";
 const toward=apexSolid&&apexDirection.value==="toward";
 if(condition==="axisHPedgeVP"){
   // Axis is alpha above HP; the hinge edge lies on HP. The sign of z
   // selects whether the apex points away from or toward HP. A toward
   // orientation that crosses HP is rejected by the support test below.
   return new THREE.Vector3(Math.cos(a)*Math.sin(b),-Math.cos(a)*Math.cos(b),toward?-Math.sin(a):Math.sin(a)).normalize();
 }
 // Axis is alpha from VP; the hinge edge lies on VP. In this coordinate
 // system the solid is in front of VP at y < 0, so toward VP uses +y.
 return new THREE.Vector3(-Math.cos(a)*Math.sin(b),toward?Math.sin(a):-Math.sin(a),Math.cos(a)*Math.cos(b)).normalize();
}
function solveEqualInclinationCorner(qAlign, plane, vertexId, rollAxisWorld=null){
 // Solve roll about the already-constrained solid axis so the two adjacent
 // base edges at the selected corner have equal absolute inclination to HP/VP.
 // The chosen corner must also be the actual supporting extreme of the solid.
 const ring=window.__baseRing||[],at=ring.indexOf(vertexId);
 if(at<0||ring.length<3)return null;
 const prev=ring[(at+ring.length-1)%ring.length],next=ring[(at+1)%ring.length];
 const n=plane==="HP"?new THREE.Vector3(0,0,1):new THREE.Vector3(0,1,0);
 const axis=(rollAxisWorld?rollAxisWorld.clone():new THREE.Vector3(1,0,0).applyQuaternion(qAlign)).normalize();
 const f=roll=>{
   const qr=new THREE.Quaternion().setFromAxisAngle(axis,roll),q=qr.clone().multiply(qAlign);
   const v=rawVertices.map(p=>p.clone().applyQuaternion(q));
   const e1=v[prev].clone().sub(v[vertexId]).normalize(),e2=v[next].clone().sub(v[vertexId]).normalize();
   return Math.abs(n.dot(e1))-Math.abs(n.dot(e2));
 };
 const roots=[];let lastX=-Math.PI,lastY=f(lastX),steps=1440;
 for(let i=1;i<=steps;i++){
   const x=-Math.PI+2*Math.PI*i/steps,y=f(x);
   if(Math.abs(y)<1e-6)roots.push(x);
   if(lastY*y<0){let lo=lastX,hi=x,flo=lastY;for(let k=0;k<45;k++){const mid=(lo+hi)/2,fm=f(mid);if(flo*fm<=0)hi=mid;else{lo=mid;flo=fm;}}roots.push((lo+hi)/2);}
   lastX=x;lastY=y;
 }
 let best=null;
 for(const roll of roots){
   const qr=new THREE.Quaternion().setFromAxisAngle(axis,roll),q=qr.clone().multiply(qAlign);
   const pts=rawVertices.map(p=>p.clone().applyQuaternion(q));
   const coords=pts.map(p=>plane==="HP"?p.z:p.y),support=plane==="HP"?Math.min(...coords):Math.max(...coords);
   if(Math.abs(coords[vertexId]-support)>1e-5)continue;
   const edge1=pts[prev].clone().sub(pts[vertexId]).normalize(),edge2=pts[next].clone().sub(pts[vertexId]).normalize();
   const a1=Math.asin(Math.min(1,Math.abs(n.dot(edge1))))*180/Math.PI;
   const a2=Math.asin(Math.min(1,Math.abs(n.dot(edge2))))*180/Math.PI;
   const error=Math.abs(a1-a2);
   if(!best||error<best.error)best={q,error,a1,a2,vertexId};
 }
 return best&&best.error<0.05?best:null;
}

function solveTriangleFaceRoll(qAlign, plane, faceIds){
 // Solve the face-normal alignment analytically instead of sampling 1,441 rolls.
 // Rotation about the solid axis preserves the face normal's component along that axis.
 const n=plane==="HP"?new THREE.Vector3(0,0,1):new THREE.Vector3(0,1,0);
 const axis=new THREE.Vector3(1,0,0).applyQuaternion(qAlign).normalize();
 const base=faceIds.map(id=>rawVertices[id].clone().applyQuaternion(qAlign));
 const normal0=new THREE.Vector3().crossVectors(base[1].clone().sub(base[0]),base[2].clone().sub(base[0])).normalize();
 const normalParallel=axis.clone().multiplyScalar(normal0.dot(axis));
 const normalPerp=normal0.clone().sub(normalParallel);
 if(normalPerp.length()<1e-9)return null;
 let best=null;
 for(const target of [n,n.clone().negate()]){
   // A rotation around axis can only align the normals if their axial components match.
   if(Math.abs(normal0.dot(axis)-target.dot(axis))>1e-5)continue;
   const targetPerp=target.clone().addScaledVector(axis,-target.dot(axis));
   if(targetPerp.length()<1e-9)continue;
   const angle=Math.atan2(axis.dot(new THREE.Vector3().crossVectors(normalPerp,targetPerp)),normalPerp.dot(targetPerp));
   const qr=new THREE.Quaternion().setFromAxisAngle(axis,angle),q=qr.clone().multiply(qAlign);
   const pts=rawVertices.map(v=>v.clone().applyQuaternion(q));
   const coords=pts.map(p=>plane==="HP"?p.z:p.y),support=plane==="HP"?Math.min(...coords):Math.max(...coords);
   if(faceIds.some(id=>Math.abs((plane==="HP"?pts[id].z:pts[id].y)-support)>1e-4))continue;
   if(coords.some(v=>plane==="HP"?v<support-1e-4:v>support+1e-4))continue;
   best={q,error:0,faceIds};break;
 }
 return best;
}
function selectedTriangularFace(){
 if(!solidSelect.value.endsWith("Pyramid"))return null;
 const ring=window.__baseRing||[],i=((Number(edgeSelect.value)%Math.max(1,ring.length))+ring.length)%Math.max(1,ring.length);
 const apex=rawVertices.length-1;
 return ring.length>=3?[ring[i],ring[(i+1)%ring.length],apex]:null;
}

function transformed(){
 const a=Number(angleA.value)*Math.PI/180,b=Number(angleB.value)*Math.PI/180,condition=conditionSelect.value,plane=restingPlane.value,rest=restingCondition.value;
 const axis=axisDirectionFromControls();
 let q=alignXTo(axis),pair=null,featureType=rest;
 if(isBodyDiagonalCondition(condition)){
   const cornerId=cornerSelect?Number(cornerSelect.value):(window.__baseRing||[])[0],diag=cubeBodyDiagonalForCorner(cornerId);
   if(diag)q=new THREE.Quaternion().setFromUnitVectors(diag.normalize(),axis.clone().normalize());
 }
 const isCurved=["cylinder","cone"].includes(solidSelect.value);
 const baseFaceValid=condition==="axisBoth" && apexDirection.value!=="toward" && ((plane==="HP" && Math.abs(Number(angleA.value)-90)<.51 && Math.abs(Number(angleB.value))<.51) || (plane==="VP" && Math.abs(Number(angleA.value))<.51 && Math.abs(Number(angleB.value)-90)<.51));
 if(rest==="baseFace"){
   window.__restingInvalid=!baseFaceValid;window.__restingError=baseFaceValid?0:90;window.__contactPair=null;window.__contactVertex=null;window.__restingPlaneUsed=plane;
 }
 if(condition!=="axisBoth"&&!isBodyDiagonalCondition(condition)||rest==="base") pair=window.__baseEdges?.[Number(edgeSelect.value)]||window.__baseEdges?.[0];
 if(condition==="axisBoth"&&rest==="slant") pair=window.__slantEdges?.[Number(edgeSelect.value)%Math.max(1,window.__slantEdges?.length||1)]||window.__slantEdges?.[0];
 let cornerSolution=null,faceSolution=null,selectedFace=null;
 if(rest==="corner"){
   const cornerId=cornerSelect?Number(cornerSelect.value):(window.__baseRing||[])[0];
   cornerSolution=solveEqualInclinationCorner(q,plane,cornerId,isBodyDiagonalCondition(condition)?axis:null);
   if(cornerSolution){q=cornerSolution.q;window.__restingInvalid=false;window.__restingError=cornerSolution.error;window.__contactVertex=cornerId;window.__cornerEdgeAngles=[cornerSolution.a1,cornerSolution.a2];}
   else{window.__restingInvalid=true;window.__restingError=90;window.__contactVertex=null;window.__cornerEdgeAngles=null;}
   pair=null;
 }
 if(rest==="triangularFace"){
   selectedFace=selectedTriangularFace();
   faceSolution=selectedFace?solveTriangleFaceRoll(q,plane,selectedFace):null;
   if(faceSolution){q=faceSolution.q;window.__restingInvalid=false;window.__restingError=0;window.__contactFace=selectedFace;}
   else{window.__restingInvalid=true;window.__restingError=90;window.__contactFace=null;}
   pair=null;
 }
 // In the two mixed conditions, the base edge is the construction hinge and
 // must lie on the corresponding reference plane.
 let targetPlane=plane;
 if(condition==="axisHPedgeVP")targetPlane="HP";
 if(condition==="axisVPedgeHP")targetPlane="VP";
 window.__restingPlaneUsed=targetPlane;
 if(pair){
   const edgeVector=rawVertices[pair[1]].clone().sub(rawVertices[pair[0]]);
   const result=condition==="axisBoth"?rollForEdge(q,edgeVector,0,targetPlane,pair):rollForMixedEdge(q,edgeVector,targetPlane,b,pair);
   if(result){
     q=result.q;window.__restingError=0;window.__restingInvalid=false;
     window.__restingPlaneUsed=targetPlane;window.__contactPair=pair;window.__contactVertex=null;
   }else{
     // Never fake a contact by translating an edge whose endpoints are not coplanar
     // with the selected reference plane or which is not a supporting edge.
     window.__restingError=90;window.__restingInvalid=true;window.__contactPair=null;window.__contactVertex=null;pair=null;
     if(condition!=="axisBoth"){window.__restingPlaneUsed=targetPlane;}
   }
 }else if(rest==="corner"){
   window.__contactPair=null;window.__restingPlaneUsed=plane;
 }else if(rest!=="baseFace"&&rest!=="triangularFace"){
   window.__contactPair=null;window.__contactVertex=null;window.__restingError=0;window.__restingInvalid=false;window.__restingPlaneUsed=plane;
 }
 let pts=rawVertices.map(v=>v.clone().applyQuaternion(q));
 if(rest==="baseFace" && baseFaceValid){
   const ring=window.__baseRing||[];const coords=ring.map(i=>plane==="HP"?pts[i].z:pts[i].y);const level=coords.reduce((a,b)=>a+b,0)/Math.max(1,coords.length);
   if(plane==="HP"){
     pts=pts.map(p=>new THREE.Vector3(p.x,p.y,p.z-level));const maxY=Math.max(...pts.map(p=>p.y));pts=pts.map(p=>new THREE.Vector3(p.x,p.y-maxY-.12,p.z));
   }else{
     pts=pts.map(p=>new THREE.Vector3(p.x,p.y-level,p.z));const minZ=Math.min(...pts.map(p=>p.z));pts=pts.map(p=>new THREE.Vector3(p.x,p.y,p.z-minZ+.12));
   }
   window.__contactPair=null;window.__contactVertex=null;
 }else if(rest==="triangularFace"&&faceSolution&&selectedFace){
   const coords=pts.map(p=>plane==="HP"?p.z:p.y),level=plane==="HP"?Math.min(...coords):Math.max(...coords);
   if(plane==="HP")pts=pts.map(p=>new THREE.Vector3(p.x,p.y,p.z-level));
   else pts=pts.map(p=>new THREE.Vector3(p.x,p.y-level,p.z));
   window.__contactPair=null;window.__contactVertex=null;
 }else if(pair){
   const mid=pts[pair[0]].clone().add(pts[pair[1]]).multiplyScalar(.5);
   if(targetPlane==="HP"){
     pts=pts.map(p=>new THREE.Vector3(p.x,p.y,p.z-mid.z));
     const maxY=Math.max(...pts.map(p=>p.y));pts=pts.map(p=>new THREE.Vector3(p.x,p.y-maxY-.12,p.z));
   }else{
     pts=pts.map(p=>new THREE.Vector3(p.x,p.y-mid.y,p.z));
     const minZ=Math.min(...pts.map(p=>p.z));pts=pts.map(p=>new THREE.Vector3(p.x,p.y,p.z-minZ+.12));
   }
 }else{
   // Corner contact: choose the support vertex automatically so the complete
   // convex solid remains on the positive side of HP or in front of VP.
   let idx=0;
   if(rest==="corner"){
     idx=cornerSolution?cornerSolution.vertexId:0;
     window.__contactVertex=cornerSolution?idx:null;
   }
   if(plane==="HP") {const minZ=Math.min(...pts.map(p=>p.z));pts=pts.map(p=>new THREE.Vector3(p.x,p.y,p.z-minZ));const maxY=Math.max(...pts.map(p=>p.y));pts=pts.map(p=>new THREE.Vector3(p.x,p.y-maxY-.12,p.z));}
   else {const maxY=Math.max(...pts.map(p=>p.y));pts=pts.map(p=>new THREE.Vector3(p.x,p.y-maxY,p.z));const minZ=Math.min(...pts.map(p=>p.z));pts=pts.map(p=>new THREE.Vector3(p.x,p.y,p.z-minZ+.12));}
 }
 // Keep ordinary non-contact configurations in the first quadrant.
 if(rest!=="corner"&&rest!=="baseFace"&&!pair){const minZ=Math.min(...pts.map(p=>p.z)),maxY=Math.max(...pts.map(p=>p.y));pts=pts.map(p=>new THREE.Vector3(p.x,p.y-maxY-.12,p.z-minZ+.12));}
 return pts;
}
function rollForEdge(qAlign,edgeVector,targetDeg,plane,featurePair){
 // Solve the roll about the solid axis exactly, then accept only a true supporting
 // contact: both edge endpoints lie on the plane and the entire solid stays on
 // its permitted side of that plane.
 const axis=new THREE.Vector3(1,0,0).applyQuaternion(qAlign).normalize();
 const n=plane==="VP"?new THREE.Vector3(0,1,0):new THREE.Vector3(0,0,1);
 const e0=edgeVector.clone().applyQuaternion(qAlign).normalize();
 const parallel=axis.clone().multiplyScalar(e0.dot(axis));
 const perp=e0.clone().sub(parallel);
 const A=n.dot(parallel),B=n.dot(perp),C=n.dot(new THREE.Vector3().crossVectors(axis,perp));
 const R=Math.hypot(B,C);let rolls=[];
 if(R<1e-10){
   if(Math.abs(A)>1e-8)return null;
   // Degenerate but important cases: a base edge lies in a base face perpendicular
   // to the axis, or a generator is parallel to the axis. Choose the roll that
   // makes the selected feature a support when the plane normal has a radial part.
   const radialNormal=n.clone().addScaledVector(axis,-n.dot(axis));
   if(radialNormal.length()<1e-8)rolls=[0];
   else{
     const i=featurePair[0],v0=rawVertices[i].clone().applyQuaternion(qAlign);
     const radial=v0.clone().addScaledVector(axis,-v0.dot(axis));
     if(radial.length()<1e-8)return null;
     const target=radialNormal.normalize().multiplyScalar(plane==="HP"?-1:1);
     rolls=[Math.atan2(axis.dot(new THREE.Vector3().crossVectors(radial,target)),radial.dot(target))];
   }
 }else{
   if(Math.abs(A)>R+1e-8)return null;
   const delta=Math.atan2(C,B),gamma=Math.acos(Math.max(-1,Math.min(1,-A/R)));
   rolls=[delta+gamma,delta-gamma];
 }
 let best=null;
 for(const roll of rolls){
   const qRoll=new THREE.Quaternion().setFromAxisAngle(axis,roll),q=qRoll.clone().multiply(qAlign);
   const pts=rawVertices.map(v=>v.clone().applyQuaternion(q));const [i,j]=featurePair;
   const ci=plane==="HP"?pts[i].z:pts[i].y,cj=plane==="HP"?pts[j].z:pts[j].y;
   if(Math.abs(ci-cj)>1e-6)continue;
   const coords=pts.map(p=>plane==="HP"?p.z:p.y);
   const support=plane==="HP"?Math.min(...coords):Math.max(...coords);
   if(Math.abs(ci-support)>1e-5)continue;
   if(coords.some(v=>plane==="HP"?v<support-1e-5:v>support+1e-5))continue;
   const projectedAngle=Math.asin(Math.min(1,Math.abs(n.dot(edgeVector.clone().applyQuaternion(q).normalize()))))*180/Math.PI;
   const error=Math.abs(projectedAngle-targetDeg);
   if(!best||error<best.error)best={roll,error,q};
 }
 return best;
}
function rollForMixedEdge(qAlign,edgeVector,plane,beta,featurePair){
 // In the mixed construction the edge must satisfy TWO conditions: lie in the
 // specified plane and retain its prescribed angle beta to the other plane.
 // This direct target-direction solve also handles the singular 90-degree case.
 const axis=new THREE.Vector3(1,0,0).applyQuaternion(qAlign).normalize();
 let target=plane==="HP"
   ?new THREE.Vector3(Math.cos(beta),Math.sin(beta),0)
   :new THREE.Vector3(Math.cos(beta),0,Math.sin(beta));
 target.addScaledVector(axis,-target.dot(axis)).normalize();
 const e0=edgeVector.clone().applyQuaternion(qAlign).normalize();
 const radial=e0.clone().addScaledVector(axis,-e0.dot(axis));
 if(radial.length()<1e-9||target.length()<1e-9)return null;
 const [i,j]=featurePair;let best=null;
 for(const wanted of [target,target.clone().negate()]){
   const angle=Math.atan2(axis.dot(new THREE.Vector3().crossVectors(radial,wanted)),radial.dot(wanted));
   const qRoll=new THREE.Quaternion().setFromAxisAngle(axis,angle),q=qRoll.clone().multiply(qAlign);
   const pts=rawVertices.map(v=>v.clone().applyQuaternion(q));
   const ci=plane==="HP"?pts[i].z:pts[i].y,cj=plane==="HP"?pts[j].z:pts[j].y;
   if(Math.abs(ci-cj)>1e-5)continue;
   const coords=pts.map(p=>plane==="HP"?p.z:p.y),support=plane==="HP"?Math.min(...coords):Math.max(...coords);
   if(Math.abs(ci-support)>1e-4)continue;
   if(coords.some(v=>plane==="HP"?v<support-1e-4:v>support+1e-4))continue;
   const actual=edgeVector.clone().applyQuaternion(q).normalize();
   const normal=plane==="HP"?new THREE.Vector3(0,1,0):new THREE.Vector3(0,0,1);
   const edgeAngle=Math.asin(Math.min(1,Math.abs(normal.dot(actual))))*180/Math.PI;
   const error=Math.abs(edgeAngle-beta*180/Math.PI);
   if(!best||error<best.error)best={q,error};
 }
 return best;
}

function projectionVisibility(){
 const center=new THREE.Vector3();for(const p of currentVertices)center.add(p);center.divideScalar(Math.max(1,currentVertices.length));
 const faceVis=faceIndices.map(face=>{
   const a=currentVertices[face[0]],b=currentVertices[face[1]],c=currentVertices[face[2]];
   const normal=new THREE.Vector3().crossVectors(b.clone().sub(a),c.clone().sub(a)).normalize();
   const fc=a.clone().add(b).add(c).multiplyScalar(1/3);
   if(normal.dot(fc.clone().sub(center))<0)normal.negate();
   return {fv:normal.y< -1e-7,tv:normal.z>1e-7};
 });
 const result={FV:[],TV:[]};
 for(const [i,j] of edges){
   const adjacent=[];
   faceIndices.forEach((f,k)=>{if(f.includes(i)&&f.includes(j))adjacent.push(faceVis[k]);});
   const visibleFV=adjacent.some(f=>f.fv),visibleTV=adjacent.some(f=>f.tv);
   result.FV.push(visibleFV||adjacent.length===0);result.TV.push(visibleTV||adjacent.length===0);
 }
 return result;
}
function update3DProjections(){
 clearGroup(projectionGroup);
 if(!currentVertices.length)return;
 const fvVisible=[],fvHidden=[],tvVisible=[],tvHidden=[],projectors=[];
 const visibility=projectionVisibility();
 for(let k=0;k<edges.length;k++){
   const [i,j]=edges[k],a=currentVertices[i],b=currentVertices[j];
   const fv=visibility.FV[k]?fvVisible:fvHidden,tv=visibility.TV[k]?tvVisible:tvHidden;
   fv.push(a.x,0,a.z,b.x,0,b.z);
   tv.push(a.x,a.y,0,b.x,b.y,0);
 }
 for(const p of currentVertices){
   projectors.push(p.x,p.y,p.z,p.x,0,p.z); // perpendicular to VP
   projectors.push(p.x,p.y,p.z,p.x,p.y,0); // perpendicular to HP
 }
 function addLines(coords,color,opacity=1,dashed=false){
   if(!coords.length)return;
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(coords,3));
   const m=dashed?new THREE.LineDashedMaterial({color,dashSize:.12,gapSize:.08,transparent:true,opacity}):new THREE.LineBasicMaterial({color,transparent:opacity<1,opacity});
   const line=new THREE.LineSegments(g,m);if(dashed)line.computeLineDistances();projectionGroup.add(line);
 }
 addLines(projectors,0x8795a8,.72,true);
 addLines(fvHidden,0x9b5b21,.9,true);addLines(tvHidden,0x14684e,.9,true);
 addLines(fvVisible,0xd97706,1,false);addLines(tvVisible,0x16805d,1,false);
 const fvPoints=[],tvPoints=[];
 for(const p of currentVertices){fvPoints.push(p.x,0,p.z);tvPoints.push(p.x,p.y,0);}
 function addPoints(coords,color){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(coords,3));projectionGroup.add(new THREE.Points(g,new THREE.PointsMaterial({color,size:.075,sizeAttenuation:true,depthTest:false})));}
 addPoints(fvPoints,0xd97706);addPoints(tvPoints,0x16805d);
}
function updateModel(){currentVertices=transformed();solidGroup.position.set(0,0,0);const pos=[];for(const f of faceIndices)for(const id of f){const p=currentVertices[id];pos.push(p.x,p.y,p.z)}const mesh=solidGroup.children[0];mesh.geometry.dispose();mesh.geometry=new THREE.BufferGeometry();mesh.geometry.setAttribute("position",new THREE.Float32BufferAttribute(pos,3));mesh.geometry.computeVertexNormals();const ep=[];for(const [i,j] of edges){const p=currentVertices[i],q=currentVertices[j];ep.push(p.x,p.y,p.z,q.x,q.y,q.z)}const line=solidGroup.children[1];line.geometry.dispose();line.geometry=new THREE.BufferGeometry();line.geometry.setAttribute("position",new THREE.Float32BufferAttribute(ep,3));line.geometry.computeBoundingSphere();update3DProjections();drawSheet();updateLabelsAndStatus();}
function updateLabelsAndStatus(){
 angleAValue.value=angleA.value+"°";angleBValue.value=angleB.value+"°";angleAValue.textContent=angleA.value+"°";angleBValue.textContent=angleB.value+"°";
 const c=conditionSelect.value,rest=restingCondition.value,plane=window.__restingPlaneUsed||restingPlane.value,curved=["cylinder","cone"].includes(solidSelect.value);
 edgeSelectField.hidden=rest==="corner"||rest==="baseFace";
 if(cornerSelectField)cornerSelectField.hidden=rest!=="corner";
 angleALabel.textContent=isBodyDiagonalCondition(c)?"Body-diagonal inclination to HP (α)":c==="axisVPedgeHP"?"Axis inclination to VP (α)":"Axis inclination to HP (α)";
 angleBLabel.textContent=isBodyDiagonalCondition(c)?"Body-diagonal inclination to VP (β)":c==="axisHPedgeVP"?"Base-edge inclination to VP (β)":c==="axisVPedgeHP"?"Base-edge inclination to HP (β)":"Axis inclination to VP (β)";
 const sum=Math.sin(Number(angleA.value)*Math.PI/180)**2+Math.sin(Number(angleB.value)*Math.PI/180)**2;
 const axisInvalid=(c==="axisBoth"||isBodyDiagonalCondition(c))&&sum>1+1e-8;
 const contactError=Number(window.__restingError||0);
 if(axisInvalid){geometryStatus.textContent="Incompatible axis angles: reduce one angle.";geometryStatus.classList.add("invalid");}
 else if(window.__restingInvalid){
   const hasApex=solidSelect.value.endsWith("Pyramid")||solidSelect.value==="cone";
   geometryStatus.textContent=rest==="baseFace"?`A complete base face can rest on ${plane} only at its compatible orientation. Adjust the angles/direction.`:rest==="corner"?`No valid corner orientation satisfies equal inclinations of its adjacent base edges to ${plane} at these axis angles. Change the angles or corner.`:rest==="triangularFace"?`The selected triangular side face cannot lie on and support ${plane} at these axis angles.`:`The selected ${rest==="base"?"base edge":"slant edge / generator"} cannot rest on ${plane} at this angle combination. Change an angle, feature, contact plane${hasApex?" or apex direction":""}.`;
   geometryStatus.classList.add("invalid");}
 else {const ea=window.__cornerEdgeAngles;geometryStatus.textContent=rest==="corner"?`Corner contact on ${plane}; adjacent base edges are equally inclined${ea?` (${ea[0].toFixed(1)}° and ${ea[1].toFixed(1)}°)`:""}.`:rest==="triangularFace"?`Selected triangular side face rests on ${plane}.`:rest==="baseFace"?`Complete base face rests on ${plane}.`:`${rest==="base"?"Base edge":"Slant edge / generator"} rests on ${plane}.`;geometryStatus.classList.remove("invalid");}
 if(c==="bodyDiagonalHPPerp")conditionHelp.textContent="The cube body diagonal is perpendicular to HP (α = 90°). Its opposite vertices align vertically. A selected corner can support HP only if the remaining cube vertices stay above HP.";
 else if(c==="bodyDiagonalHPParallel")conditionHelp.textContent="The cube body diagonal is parallel to HP (α = 0°). Its inclination to VP remains adjustable. If HP is selected as the contact plane, a corner-supporting solution is generally impossible because the diagonal has no vertical component.";
 else if(c==="bodyDiagonalVPPerp")conditionHelp.textContent="The cube body diagonal is perpendicular to VP (β = 90°). Its opposite vertices align normal to VP. A selected corner can support VP only if the remaining cube vertices stay on the permitted side.";
 else if(c==="bodyDiagonalVPParallel")conditionHelp.textContent="The cube body diagonal is parallel to VP (β = 0°). Its inclination to HP remains adjustable. If VP is selected as the contact plane, a corner-supporting solution is generally impossible because the diagonal has no depth component.";
 else if(isBodyDiagonalCondition(c))conditionHelp.textContent="For a cube, the body diagonal follows the specified inclinations to HP and VP. The selected corner must be the actual supporting vertex, and the adjacent base edges must be equally inclined to the contact plane. The angle pair must satisfy sin²α + sin²β ≤ 1.";
 else if(c==="axisBoth")conditionHelp.textContent="For an axis inclined by α to HP and β to VP, sin²α + sin²β must not exceed 1. For pyramids/cones, apex direction affects which contact is possible. Edge contact is accepted only when the chosen edge is truly parallel to and supporting the selected plane; incompatible edge choices are disabled for the current angles.";
 else if(c==="axisHPedgeVP")conditionHelp.textContent="The selected base edge lies on HP and is inclined to VP by β. The axis inclination to HP is α; its final direction is determined by both constraints.";
 else conditionHelp.textContent="The selected base edge lies on VP and is inclined to HP by β. The axis inclination to VP is α; its final direction is determined by both constraints.";
 if(curved&&rest==="slant")conditionHelp.textContent+=" For a cylinder/cone generator, some axis-angle combinations cannot place the generator in the selected plane; the geometric check reports this.";
}
function refreshEdgeOptions(){
 const curved=["cylinder","cone"].includes(solidSelect.value),type=kindInfo[solidSelect.value]?.type;
 const condition=conditionSelect.value,rest=restingCondition.value;
 const slantOpt=[...restingCondition.options].find(o=>o.value==="slant");
 if(slantOpt){slantOpt.disabled=type==="prism";slantOpt.textContent=curved?"Generator":type==="pyramid"?"Slant edge":"Lateral edge";}
 const faceOpt=[...restingCondition.options].find(o=>o.value==="baseFace");
 const alpha=Number(angleA.value),beta=Number(angleB.value),plane=restingPlane.value;
 if(faceOpt)faceOpt.disabled=condition!=="axisBoth"||apexDirection.value==="toward"||!((plane==="HP"&&Math.abs(alpha-90)<.51&&Math.abs(beta)<.51)||(plane==="VP"&&Math.abs(alpha)<.51&&Math.abs(beta-90)<.51));
 if(slantOpt?.disabled&&rest==="slant")restingCondition.value="base";
 for(const opt of conditionSelect.options)opt.disabled=(curved&&opt.value!=="axisBoth")||(isBodyDiagonalCondition(opt.value)&&solidSelect.value!=="cube");
 if(isBodyDiagonalCondition()&&solidSelect.value!=="cube")conditionSelect.value="axisBoth";
 applyNamedDiagonalCondition();
 if(isBodyDiagonalCondition())restingCondition.value="corner";
 const featureSelector=restingCondition;
 featureSelector.disabled=isBodyDiagonalCondition();
 if(curved&&conditionSelect.value!=="axisBoth"){
   conditionSelect.value="axisBoth";angleA.max="90";
   const maxB=Math.floor(Math.acos(Math.max(-1,Math.min(1,Math.sin(Number(angleA.value)*Math.PI/180))))*180/Math.PI);
   angleB.max=String(maxB);if(Number(angleB.value)>maxB)angleB.value=String(maxB);
 }
 const expected=conditionSelect.value==="axisHPedgeVP"?"HP":conditionSelect.value==="axisVPedgeHP"?"VP":null;
 restingPlane.disabled=!!expected;if(expected)restingPlane.value=expected;
 restingCondition.disabled=!!expected;if(expected)restingCondition.value="base";
 if(faceOpt){const currentPlane=restingPlane.value;faceOpt.disabled=conditionSelect.value!=="axisBoth"||apexDirection.value==="toward"||!((currentPlane==="HP"&&Math.abs(alpha-90)<.51&&Math.abs(beta)<.51)||(currentPlane==="VP"&&Math.abs(alpha)<.51&&Math.abs(beta-90)<.51));}
 const triFace=[...restingCondition.options].find(o=>o.value==="triangularFace");if(triFace){triFace.disabled=!solidSelect.value.endsWith("Pyramid");if(triFace.disabled&&rest==="triangularFace")restingCondition.value="base";}

 const selectedIndex=Number(edgeSelect.value)||0;
 let edgeList=[],prefix="Base edge";
 if(restingCondition.value==="triangularFace"){edgeList=(window.__baseRing||[]).map((id,i)=>[id,(window.__baseRing||[])[(i+1)%(window.__baseRing||[]).length]]);prefix="Triangular side face";}
 else if(conditionSelect.value!=="axisBoth"||restingCondition.value==="base"){edgeList=window.__baseEdges||[];prefix="Base edge";}
 else if(restingCondition.value==="slant"){edgeList=window.__slantEdges||[];prefix=curved?"Generator":"Slant edge";}
 edgeSelect.innerHTML="";
 edgeList.forEach((edge,i)=>{const option=document.createElement("option");option.value=String(i);option.textContent=`${prefix} ${i+1}`;edgeSelect.appendChild(option);});
 if(edgeList.length){
   edgeSelect.value=String(Math.min(selectedIndex,edgeList.length-1));
   const beta=Number(angleB.value)*Math.PI/180,axis=axisDirectionFromControls(),q=alignXTo(axis);
   const contactPlane=conditionSelect.value==="axisHPedgeVP"?"HP":conditionSelect.value==="axisVPedgeHP"?"VP":restingPlane.value;
   [...edgeSelect.options].forEach((option,i)=>{
     const edge=edgeList[i],vector=rawVertices[edge[1]].clone().sub(rawVertices[edge[0]]);
     const solved=conditionSelect.value==="axisBoth"?rollForEdge(q,vector,0,contactPlane,edge):rollForMixedEdge(q,vector,contactPlane,beta,edge);
     option.disabled=!solved;
   });
 }
 edgeSelectField.hidden=restingCondition.value==="corner"||restingCondition.value==="baseFace";
 if(cornerSelectField)cornerSelectField.hidden=restingCondition.value!=="corner";
 const edgeLabel=edgeSelectField.querySelector("span");
 if(edgeLabel)edgeLabel.textContent=restingCondition.value==="triangularFace"?"Select triangular side face":conditionSelect.value!=="axisBoth"?"Base edge used as hinge":restingCondition.value==="slant"?(curved?"Generator used for contact":"Slant edge used for contact"):"Base edge used for contact";
 syncApexDirectionControl();
}
function drawSheet(){const w=sheet.width,h=sheet.height;ctx.clearRect(0,0,w,h);ctx.fillStyle="#fff";ctx.fillRect(0,0,w,h);ctx.strokeStyle="#e4eaf2";ctx.lineWidth=1;ctx.strokeRect(18,18,w-36,h-36);const xy=340;ctx.strokeStyle="#64748b";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(38,xy);ctx.lineTo(w-38,xy);ctx.stroke();ctx.fillStyle="#34445a";ctx.font="bold 17px system-ui";ctx.fillText("XY",w-66,xy-9);ctx.font="bold 16px system-ui";ctx.fillText("VP PROJECTION — FRONT VIEW (FV)",38,45);ctx.fillText("HP PROJECTION — TOP VIEW (TV)",38,xy+32);ctx.font="13px system-ui";ctx.fillStyle="#64748b";ctx.fillText("First-angle orthographic projection",38,h-28);
 const centerX=w/2;
 const minX=Math.min(...currentVertices.map(p=>p.x)),maxX=Math.max(...currentVertices.map(p=>p.x));
 const maxZ=Math.max(...currentVertices.map(p=>p.z));
 const maxDepth=Math.max(...currentVertices.map(p=>-p.y));
 // Use one common scale for FV and TV and anchor both views to XY. Points on HP
 // appear on XY in FV; points on VP appear on XY in TV (first-angle convention).
 const scale=Math.min((w-140)/(maxX-minX+.1),(xy-75)/Math.max(.1,maxZ),(h-xy-80)/Math.max(.1,maxDepth));
 const mapFV=p=>({x:centerX+(p.x-(minX+maxX)/2)*scale,y:xy-p.z*scale});
 const mapTV=p=>({x:centerX+(p.x-(minX+maxX)/2)*scale,y:xy+(-p.y)*scale});
 // Projectors connect corresponding vertices through XY, reinforcing first-angle alignment.
 ctx.save();ctx.strokeStyle="#aab7c8";ctx.lineWidth=.8;ctx.setLineDash([3,5]);for(const p of currentVertices){const f=mapFV(p),t=mapTV(p);ctx.beginPath();ctx.moveTo(f.x,Math.min(xy-3,f.y+4));ctx.lineTo(t.x,Math.max(xy+3,t.y-4));ctx.stroke()}ctx.restore();
 const visibility=projectionVisibility();
 function drawEdges(map,view){
   for(let k=0;k<edges.length;k++){
     const [i,j]=edges[k],p=map(currentVertices[i]),q=map(currentVertices[j]);
     ctx.strokeStyle=view==="FV"?"#b9650a":"#167252";ctx.lineWidth=visibility[view][k]?2.2:1.5;ctx.lineJoin="round";ctx.setLineDash(visibility[view][k]?[]:[5,4]);
     ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();
   }
   ctx.setLineDash([]);
 }
 drawEdges(mapFV,"FV");drawEdges(mapTV,"TV");
 // Highlight the selected contact feature in both orthographic projections.
 const contactPair=window.__contactPair,contactVertex=window.__contactVertex;
 if(contactPair){ctx.save();ctx.strokeStyle="#d97706";ctx.lineWidth=4;for(const map of [mapFV,mapTV]){const p=map(currentVertices[contactPair[0]]),q=map(currentVertices[contactPair[1]]);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke()}ctx.restore();}
 if(Number.isInteger(contactVertex)){ctx.save();ctx.fillStyle="#d97706";ctx.strokeStyle="#fff";ctx.lineWidth=2;for(const map of [mapFV,mapTV]){const q=map(currentVertices[contactVertex]);ctx.beginPath();ctx.arc(q.x,q.y,5,0,Math.PI*2);ctx.fill();ctx.stroke()}ctx.restore();}
 ctx.fillStyle="#214f83";for(const p of currentVertices){for(const m of [mapFV,mapTV]){const q=m(p);ctx.beginPath();ctx.arc(q.x,q.y,2.5,0,Math.PI*2);ctx.fill()}}ctx.strokeStyle="#d5dde8";ctx.lineWidth=1;ctx.strokeRect(30,55,w-60,xy-55);ctx.strokeRect(30,xy,w-60,h-xy-55);
}
function resize(){const r=sceneWrap.getBoundingClientRect();renderer.setSize(Math.max(1,r.width),Math.max(1,r.height),false);camera.aspect=Math.max(.1,r.width)/Math.max(1,r.height);camera.updateProjectionMatrix();drawSheet()}new ResizeObserver(resize).observe(sceneWrap);window.addEventListener("resize",resize);
solidSelect.addEventListener("change",()=>{setSolid(solidSelect.value);});conditionSelect.addEventListener("change",()=>{if(isBodyDiagonalCondition())restingCondition.value="corner";if(!isBodyDiagonalCondition())restingCondition.disabled=false;applyNamedDiagonalCondition();if(conditionSelect.value==="axisBoth"||isBodyDiagonalCondition()){angleA.max="90";angleB.max=String(Math.floor(Math.acos(Math.sin(Number(angleA.value)*Math.PI/180))*180/Math.PI));if(Number(angleB.value)>Number(angleB.max))angleB.value=angleB.max;}else{angleA.max="90";angleB.max="90";}refreshEdgeOptions();updateModel()});
edgeSelect.addEventListener("change",updateModel);cornerSelect?.addEventListener("change",updateModel);restingCondition.addEventListener("change",()=>{refreshEdgeOptions();updateModel()});restingPlane.addEventListener("change",()=>{refreshEdgeOptions();updateModel()});apexDirection.addEventListener("change",()=>{refreshEdgeOptions();updateModel()});
angleA.addEventListener("input",()=>{if(conditionSelect.value==="axisBoth"||isBodyDiagonalCondition()){const maxB=Math.acos(Math.sin(Number(angleA.value)*Math.PI/180))*180/Math.PI;angleB.max=String(Math.floor(maxB));if(Number(angleB.value)>Number(angleB.max))angleB.value=angleB.max;}refreshEdgeOptions();updateModel()});
angleB.addEventListener("input",()=>{if(conditionSelect.value==="axisBoth"||isBodyDiagonalCondition()){const maxA=Math.acos(Math.sin(Number(angleB.value)*Math.PI/180))*180/Math.PI;angleA.max=String(Math.floor(maxA));if(Number(angleA.value)>Number(angleA.max))angleA.value=angleA.max;}refreshEdgeOptions();updateModel()});
$("resetBtn").addEventListener("click",()=>{solidSelect.value="triangular";conditionSelect.value="axisBoth";applyNamedDiagonalCondition();angleA.value="30";angleB.value="30";angleA.disabled=false;angleB.disabled=false;angleA.max="90";angleB.max=String(Math.floor(Math.acos(Math.sin(Math.PI/6))*180/Math.PI));edgeSelect.value="0";restingCondition.value="base";restingPlane.value="HP";apexDirection.value="away";theta=-.93;phi=.86;radius=12;updateCamera();setSolid(solidSelect.value);refreshEdgeOptions();updateModel()});
setSolid(solidSelect.value);resize();
function animate(){requestAnimationFrame(animate);renderer.render(scene,camera)}animate();
