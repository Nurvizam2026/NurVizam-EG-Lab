(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const els = { mode:$('mode'), length:$('length'), alpha:$('alpha'), beta:$('beta'), alphaValue:$('alphaValue'), betaValue:$('betaValue'), alphaField:$('alphaField'), betaField:$('betaField'), status:$('status'), svg:$('construction'), stepText:$('stepText'), stepCount:$('stepCount'), prev:$('prevStep'), next:$('nextStep'), reset:$('resetBtn'), trueLength:$('trueLengthOut'), fvLength:$('fvLength'), tvLength:$('tvLength'), tvAngle:$('tvAngle'), fvAngle:$('fvAngle') };
  let step = 0;
  const rad = d => d * Math.PI / 180;
  const deg = r => r * 180 / Math.PI;
  const fmt = n => Number.isFinite(n) ? `${n.toFixed(2)} mm` : '—';
  const angleFmt = n => Number.isFinite(n) ? `${n.toFixed(2)}°` : '—';
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function line(x1,y1,x2,y2,cls,extra=''){return `<line class="${cls}" x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" ${extra}/>`;}
  function text(x,y,s,cls='label',extra=''){return `<text class="${cls}" x="${x}" y="${y}" ${extra}>${esc(s)}</text>`;}
  function circle(x,y,label,cls){return `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="4" class="${cls}"/><text x="${(x+8).toFixed(2)}" y="${(y-8).toFixed(2)}" class="point-label">${label}</text>`;}
  function draw(){
    const mode=els.mode.value, L=Math.max(10,Math.min(150,Number(els.length.value)||80));
    els.length.value=L;
    let a=Number(els.alpha.value), b=Number(els.beta.value);
    if(mode==='hp') b=0;
    if(mode==='vp') a=0;
    els.alphaValue.textContent=`${a}°`; els.betaValue.textContent=`${b}°`;
    els.alphaField.classList.toggle('inactive',mode==='vp'); els.betaField.classList.toggle('inactive',mode==='hp');
    const sa=Math.sin(rad(a)), sb=Math.sin(rad(b)), sum=sa*sa+sb*sb;
    const impossible=mode==='both' && sum>1+1e-9;
    const dx=Math.sqrt(Math.max(0,1-sum));
    const z=L*sa, y=L*sb, x=L*dx;
    const fvLen=Math.sqrt(x*x+z*z), tvLen=Math.sqrt(x*x+y*y);
    const tvGamma=(tvLen<1e-8)?0:deg(Math.atan2(y,x));
    const fvDelta=(fvLen<1e-8)?0:deg(Math.atan2(z,x));
    els.trueLength.textContent=fmt(L); els.fvLength.textContent=fmt(fvLen); els.tvLength.textContent=fmt(tvLen);
    els.tvAngle.textContent=mode==='hp'?'0.00° (parallel XY)':angleFmt(tvGamma);
    els.fvAngle.textContent=mode==='vp'?'0.00° (parallel XY)':angleFmt(fvDelta);
    if(impossible){
      els.status.className='status error'; els.status.textContent=`No real line direction satisfies both angles: sin²(${a}°) + sin²(${b}°) = ${sum.toFixed(3)} > 1. Reduce one or both angles.`;
    } else if(mode==='both'){
      els.status.className='status success'; els.status.textContent=`Geometrically feasible. Plan angle γ = ${tvGamma.toFixed(2)}° (not generally equal to β). The horizontal component is ${x.toFixed(2)} mm.`;
    } else if(mode==='hp'){
      els.status.className='status success'; els.status.textContent=`Single-plane case: line is inclined ${a}° to HP and parallel to VP. FV is true length; TV is parallel to XY.`;
    } else {
      els.status.className='status success'; els.status.textContent=`Single-plane case: line is inclined ${b}° to VP and parallel to HP. TV is true length; FV is parallel to XY.`;
    }
    renderSvg({mode,L,a,b,x,y,z,fvLen,tvLen,tvGamma,fvDelta,impossible});
  }
  function renderSvg(g){
    const W=900,H=620,xy=310,scale=Math.min(3.2,205/Math.max(g.L,1));
    const ax=185, bx=ax+g.x*scale, ay=xy, byF=xy-g.z*scale, byT=xy+g.y*scale;
    const initX=ax+g.L*Math.cos(rad(g.a))*scale, initY=xy-g.L*Math.sin(rad(g.a))*scale;
    const initTVx=ax+g.L*Math.cos(rad(g.a))*scale, initTVy=xy;
    const finalTVx=bx, finalTVy=byT, finalFVx=bx, finalFVy=byF;
    const showInitial=step===0 || (step===1 && g.mode==='both');
    const showFinal=step>=1 || g.mode!=='both';
    const showProjectors=step>=1;
    let s=`<defs><pattern id="grid" width="25" height="25" patternUnits="userSpaceOnUse"><path d="M 25 0 L 0 0 0 25" fill="none" stroke="#eef2f7" stroke-width="1"/></pattern><marker id="arrow" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 z" fill="#647089"/></marker></defs>`;
    s+=`<rect width="900" height="620" fill="url(#grid)"/>`;
    s+=line(45,xy,855,xy,'xy-line'); s+=text(832,xy-10,'XY','xy-label');
    s+=text(48,42,'FRONT VIEW · VP','view-title'); s+=text(48,xy+35,'TOP VIEW · HP','view-title');
    s+=text(48,65,'z measured above XY','small-label'); s+=text(48,xy+58,'y measured below XY','small-label');
    if(g.mode==='both'){
      if(showInitial){
        s+=line(ax,xy,initX,initY,'fv ghost'); s+=circle(ax,xy,'a','ghost-point'); s+=circle(initX,initY,'b′','ghost-point');
        s+=line(ax,xy,initTVx,initTVy,'tv ghost');
        s+=text((ax+initX)/2-18,(xy+initY)/2-12,`TL = ${g.L.toFixed(1)} mm`,'dim-label');
        s+=text((ax+initTVx)/2,xy+20,`TV₁ = L cos α = ${g.tvLen.toFixed(1)} mm`,'dim-label','text-anchor="middle"');
      }
      if(step===0){
        s+=text(515,100,'STEP 1 · ASSUMED POSITION','step-label');
        s+=text(515,124,`FV₁ is true length at α = ${g.a}°`,'explain-label');
        s+=text(515,146,'TV₁ is parallel to XY','explain-label');
        const arcR=44, arcX=ax+arcR, arcY=xy;
        s+=`<path d="M ${arcX} ${arcY} A ${arcR} ${arcR} 0 0 0 ${ax+arcR*Math.cos(rad(g.a))} ${xy-arcR*Math.sin(rad(g.a))}" class="angle-arc"/>`;
        s+=text(ax+54,xy-17,`α ${g.a}°`,'angle-label');
      }
      if(step>=1){
        s+=line(ax,xy,finalTVx,finalTVy,'tv'); s+=circle(ax,xy,'a','tv-point'); s+=circle(finalTVx,finalTVy,'b','tv-point');
        if(step===1){
          s+=text(515,100,'STEP 2 · ROTATE THE TOP VIEW','step-label');
          s+=text(515,124,`Rotate TV₁ to γ = ${g.tvGamma.toFixed(2)}°`,'explain-label');
          s+=text(515,146,`TV length remains ${g.tvLen.toFixed(1)} mm`,'explain-label');
          s+=line(ax,xy,initTVx,initTVy,'construction');
          s+=`<path d="M ${ax+38} ${xy} A 38 38 0 0 1 ${ax+38*Math.cos(rad(g.tvGamma))} ${xy+38*Math.sin(rad(g.tvGamma))}" class="angle-arc"/>`;
          s+=text(ax+47,xy+46,`γ ${g.tvGamma.toFixed(1)}°`,'angle-label');
        }
      }
      if(step>=2){
        s+=line(ax,xy,finalFVx,finalFVy,'fv'); s+=circle(ax,xy,'a','fv-point'); s+=circle(finalFVx,finalFVy,'b','fv-point');
        s+=line(finalTVx,xy-4,finalTVx,finalTVy+5,'projector');
        s+=line(finalTVx,finalFVy,finalTVx,finalTVy,'projector');
        s+=text(515,100,'STEP 3 · PROJECT THE FINAL FV','step-label');
        s+=text(515,124,`FV length = L cos β = ${g.fvLen.toFixed(1)} mm`,'explain-label');
        s+=text(515,146,`FV angle to XY = ${g.fvDelta.toFixed(2)}°`,'explain-label');
        s+=text(515,168,'Corresponding endpoints share the same x-coordinate.','explain-label');
      }
    } else if(g.mode==='hp'){
      s+=line(ax,xy,initX,initY,'fv'); s+=circle(ax,xy,'a','fv-point'); s+=circle(initX,initY,'b','fv-point');
      s+=line(ax,xy,initTVx,xy,'tv'); s+=circle(ax,xy,'a′','tv-point'); s+=circle(initTVx,xy,'b′','tv-point');
      s+=text(515,100,'LINE INCLINED TO HP ONLY','step-label'); s+=text(515,124,`FV shows true length: ${g.L.toFixed(1)} mm`,'explain-label'); s+=text(515,146,`TV = L cos α = ${g.tvLen.toFixed(1)} mm, parallel to XY`,'explain-label');
      s+=line(initTVx,xy,initTVx,xy+24,'construction');
    } else {
      const fvX=ax+g.fvLen*scale;
      s+=line(ax,xy,fvX,xy,'fv'); s+=circle(ax,xy,'a′','fv-point'); s+=circle(fvX,xy,'b′','fv-point');
      const tvx=ax+g.L*Math.cos(rad(g.b))*scale, tvy=xy+g.L*Math.sin(rad(g.b))*scale;
      s+=line(ax,xy,tvx,tvy,'tv');
      s+=circle(ax,xy,'a','tv-point'); s+=circle(tvx,tvy,'b','tv-point');
      s+=text(515,100,'LINE INCLINED TO VP ONLY','step-label'); s+=text(515,124,`TV shows true length: ${g.L.toFixed(1)} mm`,'explain-label'); s+=text(515,146,`FV = L cos β = ${g.fvLen.toFixed(1)} mm, parallel to XY`,'explain-label');
    }
    if(g.impossible){s+=`<rect x="140" y="230" width="620" height="145" rx="14" class="error-overlay"/>`;s+=text(450,282,'NO GEOMETRIC SOLUTION','error-title','text-anchor="middle"');s+=text(450,310,'Reduce α or β until sin²α + sin²β ≤ 1.','error-copy','text-anchor="middle"');}
    s+=text(450,590,'SCHEMATIC · NOT TO SCALE','footer-label','text-anchor="middle"');
    els.svg.innerHTML=s;
    const desc=[
      'Step 1: Assume the line is parallel to VP and inclined to HP. Draw its true length in the front view and the shortened top view parallel to XY.',
      'Step 2: Rotate the top view to the calculated plan angle γ. The top-view length stays constant.',
      'Step 3: Project from the final top view and construct the final front view, preserving the endpoint heights from the first step.'
    ];
    els.stepText.textContent=g.mode==='both'?desc[step]:g.mode==='hp'?'Single-plane case: draw the true-length front view at α and project the shortened top view parallel to XY.':'Single-plane case: draw the true-length top view at β and project the shortened front view parallel to XY.';
    const totalSteps=g.mode==='both'?3:1;
    if(totalSteps===1) step=0;
    els.stepCount.textContent=`Step ${step+1} of ${totalSteps}`; els.prev.disabled=step===0 || totalSteps===1; els.next.disabled=step===totalSteps-1 || totalSteps===1;
  }
  function updateMode(){const mode=els.mode.value;els.alpha.disabled=mode==='vp';els.beta.disabled=mode==='hp';if(mode==='hp')els.beta.value=0;if(mode==='vp')els.alpha.value=0;draw();}
  [els.mode,els.length,els.alpha,els.beta].forEach(el=>el.addEventListener('input',()=>{if(el===els.mode){step=0;updateMode();}else{step=0;draw();}}));
  els.prev.addEventListener('click',()=>{step=Math.max(0,step-1);draw();});
  els.next.addEventListener('click',()=>{step=Math.min(2,step+1);draw();});
  els.reset.addEventListener('click',()=>{els.mode.value='both';els.length.value=80;els.alpha.value=30;els.beta.value=35;step=0;updateMode();});
  updateMode();
})();
