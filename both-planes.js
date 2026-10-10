const THREE = await loadThree();
async function loadThree(){
  const urls=["https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js","https://unpkg.com/three@0.160.0/build/three.module.js","https://esm.sh/three@0.160.0"];
  let last; for(const url of urls){try{return await import(url)}catch(e){last=e;console.warn("Three.js source unavailable",url,e)}}
  throw new Error("Three.js could not load. Check internet access to a Three.js CDN. "+(last?.message||""));
}
const $=id=>document.getElementById(id);
const solidSelect=$("solidSelect"),conditionSelect=$("conditionSelect"),angleA=$("angleA"),angleB=$("angleB"),angleAValue=$("angleAValue"),angleBValue=$("angleBValue"),angleALabel=$("angleALabel"),angleBLabel=$("angleBLabel"),edgeSelect=$("edgeSelect"),edgeSelectField=$("edgeSelectField"),restingCondition=$("restingCondition"),restingPlane=$("restingPlane"),geometryStatus=$("geometryStatus"),conditionHelp=$("conditionHelp"),sceneWrap=$("sceneWrap"),sheet=$("drawingSheet"),ctx=sheet.getContext("2d");
const scene=new THREE.Scene();scene.background=new THREE.Color("#f4f7fb");
const camera=new THREE.PerspectiveCamera(38,1,.1,100);camera.up.set(0,0,1);camera.position.set(7.5,-10,7.5);
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.domElement.setAttribute("aria-label","Interactive 3D solid. Drag to rotate the camera and scroll to zoom.");sceneWrap.replaceChildren(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xffffff,0xb9c7d9,2));const light=new THREE.DirectionalLight(0xffffff,2.2);light.position.set(5,-5,8);scene.add(light);
const hp=new THREE.Mesh(new THREE.PlaneGeometry(9,9),new THREE.MeshBasicMaterial({color:0xd99aa8,transparent:true,opacity:.22,side:THREE.DoubleSide,depthWrite:false}));hp.position.z=0;scene.add(hp);
const vp=new THREE.Mesh(new THREE.PlaneGeometry(9,6),new THREE.MeshBasicMaterial({color:0x78a9e6,transparent:true,opacity:.2,side:THREE.DoubleSide,depthWrite:false}));vp.rotation.x=Math.PI/2;vp.position.y=0;vp.position.z=2.5;scene.add(vp);
const grid=new THREE.GridHelper(9,18,0xc1ccdc,0xe0e6ef);grid.rotation.x=Math.PI/2;grid.position.z=.01;scene.add(grid);
let drag=null,theta=-.93,phi=.86,radius=12;
renderer.domElement.addEventListener("pointerdown",e=>{drag={x:e.clientX,y:e.clientY};renderer.domElement.setPointerCapture?.(e.pointerId)});
renderer.domElement.addEventListener("pointermove",e=>{if(!drag)return;theta-=(e.clientX-drag.x)*.008;phi=Math.max(.08,Math.min(1.48,phi+(e.clientY-drag.y)*.008));drag={x:e.clientX,y:e.clientY};updateCamera()});
renderer.domElement.addEventListener("pointerup",()=>drag=null);renderer.domElement.addEventListener("pointercancel",()=>drag=null);renderer.domElement.addEventListener("wheel",e=>{e.preventDefault();radius=Math.max(6,Math.min(20,radius*Math.exp(e.deltaY*.001)));updateCamera()},{passive:false});
function updateCamera(){camera.position.set(radius*Math.sin(phi)*Math.cos(theta),radius*Math.sin(phi)*Math.sin(theta),radius*Math.cos(phi));camera.lookAt(0,-.3,1.2)}updateCamera();
let solidGroup=new THREE.Group();scene.add(solidGroup);let rawVertices=[],edges=[],faceIndices=[],currentVertices=[];
const kindInfo={triangular:{n:3,type:"prism"},square:{n:4,type:"prism"},pentagonal:{n:5,type:"prism"},hexagonal:{n:6,type:"prism"},triangularPyramid:{n:3,type:"pyramid"},squarePyramid:{n:4,type:"pyramid"},pentagonalPyramid:{n:5,type:"pyramid"},hexagonalPyramid:{n:6,type:"pyramid"},cylinder:{n:24,type:"cylinder"},cone:{n:24,type:"cone"}};
function makeSolid(kind){const {n,type}=kindInfo[kind],v=[],e=[],faces=[],slantEdges=[];const len=2.8,r=1.05;
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
 return {vertices:v,edges:e,faces,baseEdges:a.map((id,i)=>[id,a[(i+1)%n]]),slantEdges,type};
}
function setSolid(kind){while(solidGroup.children.length){const o=solidGroup.children.pop();o.geometry?.dispose();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material?.dispose()}const g=makeSolid(kind);rawVertices=g.vertices;edges=g.edges;faceIndices=g.faces;window.__solidType=g.type;const pos=[];for(const f of g.faces)for(const id of f)pos.push(g.vertices[id].x,g.vertices[id].y,g.vertices[id].z);const geom=new THREE.BufferGeometry();geom.setAttribute("position",new THREE.Float32BufferAttribute(pos,3));geom.computeVertexNormals();solidGroup.add(new THREE.Mesh(geom,new THREE.MeshStandardMaterial({color:0x7ca7df,roughness:.7,metalness:.02,side:THREE.DoubleSide,flatShading:true,transparent:true,opacity:.92})));
 const ep=[];for(const [i,j] of g.edges){const p=g.vertices[i],q=g.vertices[j];ep.push(p.x,p.y,p.z,q.x,q.y,q.z)}const eg=new THREE.BufferGeometry();eg.setAttribute("position",new THREE.Float32BufferAttribute(ep,3));solidGroup.add(new THREE.LineSegments(eg,new THREE.LineBasicMaterial({color:0x163b67,linewidth:1.5})));window.__baseEdges=g.baseEdges;window.__slantEdges=g.slantEdges;refreshEdgeOptions();updateModel();}
function alignXTo(direction){return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1,0,0),direction.clone().normalize())}
function transformed(){
 const a=Number(angleA.value)*Math.PI/180,b=Number(angleB.value)*Math.PI/180,condition=conditionSelect.value,plane=restingPlane.value,rest=restingCondition.value;
 let axis;
 if(condition==="axisBoth"){
   const sx=Math.sin(a),sy=Math.sin(b),remaining=1-sx*sx-sy*sy;
   axis=new THREE.Vector3(Math.sqrt(Math.max(0,remaining)),-sy,sx).normalize();
 }else if(condition==="axisHPedgeVP"){
   // The selected base edge lies in HP and is inclined to VP by angle beta.
   axis=new THREE.Vector3(Math.cos(a)*Math.sin(b),-Math.cos(a)*Math.cos(b),Math.sin(a)).normalize();
 }else{
   // The selected base edge lies in VP and is inclined to HP by angle beta.
   axis=new THREE.Vector3(-Math.cos(a)*Math.sin(b),-Math.sin(a),Math.cos(a)*Math.cos(b)).normalize();
 }
 let q=alignXTo(axis),pair=null,featureType=rest;
 const isCurved=["cylinder","cone"].includes(solidSelect.value);
 if(condition!=="axisBoth"||rest==="base") pair=window.__baseEdges?.[Number(edgeSelect.value)]||window.__baseEdges?.[0];
 if(condition==="axisBoth"&&rest==="slant") pair=window.__slantEdges?.[Number(edgeSelect.value)%Math.max(1,window.__slantEdges?.length||1)]||window.__slantEdges?.[0];
 // In the two mixed conditions, the base edge is the construction hinge and
 // must lie on the corresponding reference plane.
 let targetPlane=plane;
 if(condition==="axisHPedgeVP")targetPlane="HP";
 if(condition==="axisVPedgeHP")targetPlane="VP";
 if(pair){
   const edgeVector=rawVertices[pair[1]].clone().sub(rawVertices[pair[0]]);
   const result=rollForEdge(q,edgeVector,0,targetPlane,pair);
   q=result.q;window.__restingError=result.error;window.__restingPlaneUsed=targetPlane;window.__contactPair=pair;window.__contactVertex=null;
 }else if(rest==="corner"){
   window.__contactPair=null;window.__contactVertex=null;window.__restingError=0;window.__restingPlaneUsed=plane;
 }else{
   window.__contactPair=null;window.__contactVertex=null;window.__restingError=0;window.__restingPlaneUsed=plane;
 }
 let pts=rawVertices.map(v=>v.clone().applyQuaternion(q));
 if(pair){
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
     if(plane==="HP")idx=pts.reduce((best,p,i)=>p.z<pts[best].z?i:best,0);
     else idx=pts.reduce((best,p,i)=>p.y>pts[best].y?i:best,0);
     window.__contactVertex=idx;
   }
   if(plane==="HP") {const minZ=Math.min(...pts.map(p=>p.z));pts=pts.map(p=>new THREE.Vector3(p.x,p.y,p.z-minZ));const maxY=Math.max(...pts.map(p=>p.y));pts=pts.map(p=>new THREE.Vector3(p.x,p.y-maxY-.12,p.z));}
   else {const maxY=Math.max(...pts.map(p=>p.y));pts=pts.map(p=>new THREE.Vector3(p.x,p.y-maxY,p.z));const minZ=Math.min(...pts.map(p=>p.z));pts=pts.map(p=>new THREE.Vector3(p.x,p.y,p.z-minZ+.12));}
 }
 // Keep ordinary non-contact configurations in the first quadrant.
 if(rest!=="corner"&&!pair){const minZ=Math.min(...pts.map(p=>p.z)),maxY=Math.max(...pts.map(p=>p.y));pts=pts.map(p=>new THREE.Vector3(p.x,p.y-maxY-.12,p.z-minZ+.12));}
 return pts;
}
function rollForEdge(qAlign,edgeVector,targetDeg,plane,featurePair){
 const axis=new THREE.Vector3(1,0,0).applyQuaternion(qAlign).normalize();let best={roll:0,error:Infinity,score:Infinity,q:qAlign};
 for(let i=0;i<=720;i++){
   const roll=2*Math.PI*i/720,qRoll=new THREE.Quaternion().setFromAxisAngle(axis,roll),q=qRoll.clone().multiply(qAlign);
   const ev=edgeVector.clone().applyQuaternion(q).normalize();const component=plane==="VP"?Math.abs(ev.y):Math.abs(ev.z);const angle=Math.asin(Math.min(1,component))*180/Math.PI;const error=Math.abs(angle-targetDeg);
   const pts=rawVertices.map(v=>v.clone().applyQuaternion(q));const pair=featurePair||[0,0],mid=pts[pair[0]].clone().add(pts[pair[1]]).multiplyScalar(.5);let wrong=0;
   for(const p of pts){const d=plane==="HP"?p.z-mid.z:p.y-mid.y;if(plane==="HP"?d<-.0005:d>.0005)wrong++;}
   const score=error*100+wrong*0.002;
   if(score<best.score)best={roll,error,score,q};
 }
 return best;
}
function updateModel(){currentVertices=transformed();solidGroup.position.set(0,0,0);const pos=[];for(const f of faceIndices)for(const id of f){const p=currentVertices[id];pos.push(p.x,p.y,p.z)}const mesh=solidGroup.children[0];mesh.geometry.dispose();mesh.geometry=new THREE.BufferGeometry();mesh.geometry.setAttribute("position",new THREE.Float32BufferAttribute(pos,3));mesh.geometry.computeVertexNormals();const ep=[];for(const [i,j] of edges){const p=currentVertices[i],q=currentVertices[j];ep.push(p.x,p.y,p.z,q.x,q.y,q.z)}const line=solidGroup.children[1];line.geometry.dispose();line.geometry=new THREE.BufferGeometry();line.geometry.setAttribute("position",new THREE.Float32BufferAttribute(ep,3));line.geometry.computeBoundingSphere();drawSheet();updateLabelsAndStatus();}
function updateLabelsAndStatus(){
 angleAValue.value=angleA.value+"°";angleBValue.value=angleB.value+"°";angleAValue.textContent=angleA.value+"°";angleBValue.textContent=angleB.value+"°";
 const c=conditionSelect.value,rest=restingCondition.value,plane=window.__restingPlaneUsed||restingPlane.value,curved=["cylinder","cone"].includes(solidSelect.value);
 edgeSelectField.hidden=c==="axisBoth"&&rest==="corner";
 angleALabel.textContent=c==="axisVPedgeHP"?"Axis inclination to VP (α)":"Axis inclination to HP (α)";
 angleBLabel.textContent=c==="axisHPedgeVP"?"Base-edge inclination to VP (β)":c==="axisVPedgeHP"?"Base-edge inclination to HP (β)":"Axis inclination to VP (β)";
 const sum=Math.sin(Number(angleA.value)*Math.PI/180)**2+Math.sin(Number(angleB.value)*Math.PI/180)**2;
 const axisInvalid=c==="axisBoth"&&sum>1+1e-8;
 const contactError=Number(window.__restingError||0);
 if(axisInvalid){geometryStatus.textContent="Incompatible axis angles: reduce one angle.";geometryStatus.classList.add("invalid");}
 else if(rest!=="corner"&&contactError>0.8){geometryStatus.textContent=`Selected ${rest==="base"?"base edge":"slant edge / generator"} cannot lie exactly on ${plane} at this angle combination (residual ${contactError.toFixed(1)}°).`;geometryStatus.classList.add("invalid");}
 else {geometryStatus.textContent=rest==="corner"?`Corner contact on ${plane}; support vertex is on the plane.`:`${rest==="base"?"Base-edge hinge":"Slant edge / generator"} aligned with ${plane}.`;geometryStatus.classList.remove("invalid");}
 if(c==="axisBoth")conditionHelp.textContent="For an axis inclined by α to HP and β to VP, sin²α + sin²β must not exceed 1. Choose a contact feature and reference plane; the sheet shows the corresponding VP and HP projections.";
 else if(c==="axisHPedgeVP")conditionHelp.textContent="The selected base edge lies on HP and is inclined to VP by β. The axis inclination to HP is α; its final direction is determined by both constraints.";
 else conditionHelp.textContent="The selected base edge lies on VP and is inclined to HP by β. The axis inclination to VP is α; its final direction is determined by both constraints.";
 if(curved&&rest==="slant")conditionHelp.textContent+=" For a cylinder/cone generator, some axis-angle combinations cannot place the generator in the selected plane; the geometric check reports this.";
}
function refreshEdgeOptions(){
 const n=window.__baseEdges?.length||0;for(const opt of edgeSelect.options){const idx=Number(opt.value);opt.disabled=idx>=n}if(Number(edgeSelect.value)>=n)edgeSelect.value="0";
 const curved=["cylinder","cone"].includes(solidSelect.value),type=kindInfo[solidSelect.value]?.type;
 const slantOpt=[...restingCondition.options].find(o=>o.value==="slant");if(slantOpt)slantOpt.disabled=type==="prism";
 if(restingCondition.value==="slant"&&slantOpt?.disabled)restingCondition.value="base";
 for(const opt of conditionSelect.options){opt.disabled=curved&&opt.value!=="axisBoth";}
 if(curved&&conditionSelect.value!=="axisBoth")conditionSelect.value="axisBoth";
 const expected=conditionSelect.value==="axisHPedgeVP"?"HP":conditionSelect.value==="axisVPedgeHP"?"VP":null;
 restingPlane.disabled=!!expected;if(expected)restingPlane.value=expected;
 restingCondition.disabled=!!expected;if(expected)restingCondition.value="base";
 edgeSelectField.hidden=conditionSelect.value==="axisBoth"&&restingCondition.value==="corner";
 const edgeLabel=edgeSelectField.querySelector("span");
 if(edgeLabel)edgeLabel.textContent=conditionSelect.value!=="axisBoth"?"Base edge used as hinge":restingCondition.value==="slant"?"Slant edge / generator": "Base edge reference";
 const options=[...edgeSelect.options];options.forEach((opt,i)=>{opt.textContent=i===0?"First edge":i===1?"Second edge":"Third edge"});
}
function drawSheet(){const w=sheet.width,h=sheet.height;ctx.clearRect(0,0,w,h);ctx.fillStyle="#fff";ctx.fillRect(0,0,w,h);ctx.strokeStyle="#e4eaf2";ctx.lineWidth=1;ctx.strokeRect(18,18,w-36,h-36);const xy=340;ctx.strokeStyle="#64748b";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(38,xy);ctx.lineTo(w-38,xy);ctx.stroke();ctx.fillStyle="#34445a";ctx.font="bold 17px system-ui";ctx.fillText("XY",w-66,xy-9);ctx.font="bold 16px system-ui";ctx.fillText("VP PROJECTION — FRONT VIEW (FV)",38,45);ctx.fillText("HP PROJECTION — TOP VIEW (TV)",38,xy+32);ctx.font="13px system-ui";ctx.fillStyle="#64748b";ctx.fillText("First-angle orthographic projection",38,h-28);
 const range=2.1;const scale=Math.min((w-150)/(range*2),(xy-82)/(range*1.7));const centerX=w/2;const zVals=currentVertices.map(p=>p.z),yVals=currentVertices.map(p=>p.y);const zMin=Math.min(...zVals),zMax=Math.max(...zVals),yMin=Math.min(...yVals),yMax=Math.max(...yVals);const zSpan=Math.max(.1,zMax-zMin),ySpan=Math.max(.1,yMax-yMin);const scaleFV=Math.min((w-140)/(Math.max(...currentVertices.map(p=>p.x))-Math.min(...currentVertices.map(p=>p.x)||0)+.1),(xy-80)/zSpan);const scaleTV=Math.min((w-140)/(Math.max(...currentVertices.map(p=>p.x))-Math.min(...currentVertices.map(p=>p.x))+0.1),(h-xy-90)/ySpan);
 const minX=Math.min(...currentVertices.map(p=>p.x)),maxX=Math.max(...currentVertices.map(p=>p.x));const sX=Math.min((w-140)/(maxX-minX+.1),scaleFV);const sZ=Math.min(sX,(xy-80)/zSpan);const sY=Math.min(sX,(h-xy-85)/ySpan);const fvYTop=62;const fvH=zSpan*sZ;const tvYTop=xy+46;const tvH=ySpan*sY;const mapFV=p=>({x:centerX+(p.x-(minX+maxX)/2)*sX,y:fvYTop+((zMax-p.z))*sZ});const mapTV=p=>({x:centerX+(p.x-(minX+maxX)/2)*sX,y:tvYTop+(yMax-p.y)*sY});
 // Projectors connect corresponding vertices through XY, reinforcing first-angle alignment.
 ctx.save();ctx.strokeStyle="#aab7c8";ctx.lineWidth=.8;ctx.setLineDash([3,5]);for(const p of currentVertices){const f=mapFV(p),t=mapTV(p);ctx.beginPath();ctx.moveTo(f.x,Math.min(xy-3,f.y+4));ctx.lineTo(t.x,Math.max(xy+3,t.y-4));ctx.stroke()}ctx.restore();
 function drawEdges(map){ctx.strokeStyle="#214f83";ctx.lineWidth=2.2;ctx.lineJoin="round";for(const [i,j] of edges){const p=map(currentVertices[i]),q=map(currentVertices[j]);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke()}}
 drawEdges(mapFV);drawEdges(mapTV);
 // Highlight the selected contact feature in both orthographic projections.
 const contactPair=window.__contactPair,contactVertex=window.__contactVertex;
 if(contactPair){ctx.save();ctx.strokeStyle="#d97706";ctx.lineWidth=4;for(const map of [mapFV,mapTV]){const p=map(currentVertices[contactPair[0]]),q=map(currentVertices[contactPair[1]]);ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke()}ctx.restore();}
 if(Number.isInteger(contactVertex)){ctx.save();ctx.fillStyle="#d97706";ctx.strokeStyle="#fff";ctx.lineWidth=2;for(const map of [mapFV,mapTV]){const q=map(currentVertices[contactVertex]);ctx.beginPath();ctx.arc(q.x,q.y,5,0,Math.PI*2);ctx.fill();ctx.stroke()}ctx.restore();}
 ctx.fillStyle="#214f83";for(const p of currentVertices){for(const m of [mapFV,mapTV]){const q=m(p);ctx.beginPath();ctx.arc(q.x,q.y,2.5,0,Math.PI*2);ctx.fill()}}ctx.strokeStyle="#d5dde8";ctx.lineWidth=1;ctx.strokeRect(30,55,w-60,xy-70);ctx.strokeRect(30,xy+42,w-60,h-xy-85);
}
function resize(){const r=sceneWrap.getBoundingClientRect();renderer.setSize(Math.max(1,r.width),Math.max(1,r.height),false);camera.aspect=Math.max(.1,r.width)/Math.max(1,r.height);camera.updateProjectionMatrix();drawSheet()}new ResizeObserver(resize).observe(sceneWrap);window.addEventListener("resize",resize);
solidSelect.addEventListener("change",()=>{setSolid(solidSelect.value);});conditionSelect.addEventListener("change",()=>{if(conditionSelect.value==="axisBoth"){angleA.max="90";angleB.max=String(Math.floor(Math.acos(Math.sin(Number(angleA.value)*Math.PI/180))*180/Math.PI));if(Number(angleB.value)>Number(angleB.max))angleB.value=angleB.max;}else{angleA.max="90";angleB.max="90";}refreshEdgeOptions();updateModel()});
edgeSelect.addEventListener("change",updateModel);restingCondition.addEventListener("change",()=>{refreshEdgeOptions();updateModel()});restingPlane.addEventListener("change",updateModel);
angleA.addEventListener("input",()=>{if(conditionSelect.value==="axisBoth"){const maxB=Math.acos(Math.sin(Number(angleA.value)*Math.PI/180))*180/Math.PI;angleB.max=String(Math.floor(maxB));if(Number(angleB.value)>Number(angleB.max))angleB.value=angleB.max;}updateModel()});
angleB.addEventListener("input",()=>{if(conditionSelect.value==="axisBoth"){const maxA=Math.acos(Math.sin(Number(angleB.value)*Math.PI/180))*180/Math.PI;angleA.max=String(Math.floor(maxA));if(Number(angleA.value)>Number(angleA.max))angleA.value=angleA.max;}updateModel()});
$("resetBtn").addEventListener("click",()=>{solidSelect.value="triangular";conditionSelect.value="axisBoth";angleA.value="30";angleB.value="30";angleA.max="90";angleB.max=String(Math.floor(Math.acos(Math.sin(Math.PI/6))*180/Math.PI));edgeSelect.value="0";restingCondition.value="base";restingPlane.value="HP";theta=-.93;phi=.86;radius=12;updateCamera();setSolid(solidSelect.value);refreshEdgeOptions();updateModel()});
setSolid(solidSelect.value);resize();
function animate(){requestAnimationFrame(animate);renderer.render(scene,camera)}animate();
