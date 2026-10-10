/* Navifex Pro — interactive dotted globe (canvas 2D, no dependencies)
   Land dots from Natural Earth (via world-atlas). Arcs fly from Lahore to cities worldwide. */
(function(){
  var cv=document.getElementById('globe'); if(!cv||!window.NFX_LAND) return;
  var ctx=cv.getContext('2d');
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var D2R=Math.PI/180, DPR=Math.min(window.devicePixelRatio||1,2);
  var W=0,H=0,R=0,cx=0,cy=0;
  var L=window.NFX_LAND, n=L.length/2;
  var mobile=window.matchMedia('(max-width:860px)').matches;
  // precompute unit vectors
  var P=new Float32Array(n*3);
  for(var i=0;i<n;i++){var la=L[i*2]*D2R, lo=L[i*2+1]*D2R;
    P[i*3]=Math.cos(la)*Math.sin(lo); P[i*3+1]=Math.sin(la); P[i*3+2]=Math.cos(la)*Math.cos(lo);}
  function vec(lat,lon){lat*=D2R;lon*=D2R;return [Math.cos(lat)*Math.sin(lon),Math.sin(lat),Math.cos(lat)*Math.cos(lon)];}
  var HOME={name:'Lahore',v:vec(31.55,74.34)};
  var CITIES=[['Dubai',25.2,55.27],['London',51.5,-0.12],['New York',40.71,-74],['Toronto',43.65,-79.38],['Riyadh',24.71,46.67],
    ['Sydney',-33.87,151.2],['Singapore',1.35,103.82],['Karachi',24.86,67],['Istanbul',41.0,28.97],['Berlin',52.52,13.4],['Doha',25.29,51.53],['Kuala Lumpur',3.14,101.69]]
    .map(function(c,k){return {name:c[0],v:vec(c[1],c[2]),t0:k*0.9,dur:2.6+(k%3)*0.4};});
  // rotation state
  var lam=66*D2R, phi=0.42, tLam=lam, tPhi=phi, auto=0.0016, drag=null, mx=0, my=0;
  function size(){
    var r=cv.getBoundingClientRect(); W=r.width; H=r.height;
    cv.width=W*DPR; cv.height=H*DPR; ctx.setTransform(DPR,0,0,DPR,0,0);
    R=Math.min(W,H)*0.36; cx=W/2; cy=H/2;
  }
  size(); window.addEventListener('resize',size);
  // rotate a unit vector by current lam (around y) then phi (around x)
  var cl,sl,cp,sp;
  function rot(x,y,z,o){var x1=x*cl-z*sl, z1=x*sl+z*cl; var y2=y*cp-z1*sp, z2=y*sp+z1*cp; o[0]=x1;o[1]=y2;o[2]=z2;return o;}
  function slerp(a,b,t,o){var d=a[0]*b[0]+a[1]*b[1]+a[2]*b[2]; d=Math.max(-1,Math.min(1,d)); var w=Math.acos(d), s=Math.sin(w)||1e-6;
    var k1=Math.sin((1-t)*w)/s, k2=Math.sin(t*w)/s; o[0]=a[0]*k1+b[0]*k2;o[1]=a[1]*k1+b[1]*k2;o[2]=a[2]*k1+b[2]*k2; return o;}
  var tmp=[0,0,0], tmp2=[0,0,0];
  // interaction
  var host=cv.parentElement;
  host.addEventListener('pointerdown',function(e){drag={x:e.clientX,y:e.clientY,l:tLam,p:tPhi}; host.setPointerCapture&&host.setPointerCapture(e.pointerId); host.classList.add('grabbing');});
  host.addEventListener('pointermove',function(e){
    var r=host.getBoundingClientRect(); mx=(e.clientX-r.left)/r.width-.5; my=(e.clientY-r.top)/r.height-.5;
    if(drag){tLam=drag.l+(e.clientX-drag.x)*0.006; tPhi=Math.max(-.4,Math.min(1,drag.p+(e.clientY-drag.y)*0.004));}
  });
  function end(){drag=null;host.classList.remove('grabbing');}
  host.addEventListener('pointerup',end); host.addEventListener('pointercancel',end); host.addEventListener('pointerleave',function(){mx=my=0;});
  var visible=true, start=performance.now(), intro=0;
  if('IntersectionObserver' in window) new IntersectionObserver(function(en){visible=en[0].isIntersecting;}).observe(cv);
  window.NFX_GLOBE={reveal:function(){intro=performance.now();}};
  var bands=8;
  function frame(now){
    requestAnimationFrame(frame);
    if(!visible||document.hidden) return;
    var t=(now-start)/1000;
    var ia=intro?Math.min(1,(now-intro)/1600):0; var ie=1-Math.pow(1-ia,3); // intro ease
    if(!drag) tLam+=reduce?0:auto;
    lam+=(tLam+mx*0.25-lam)*0.06; phi+=(tPhi+my*0.15-phi)*0.06;
    cl=Math.cos(lam); sl=Math.sin(lam); cp=Math.cos(phi); sp=Math.sin(phi);
    ctx.clearRect(0,0,W,H);
    var Rr=R*(0.86+0.14*ie);
    // atmosphere glow
    var g=ctx.createRadialGradient(cx,cy,Rr*0.75,cx,cy,Rr*1.35);
    g.addColorStop(0,'rgba(47,123,255,0.0)'); g.addColorStop(0.55,'rgba(47,123,255,'+(0.16*ie)+')'); g.addColorStop(1,'rgba(47,123,255,0)');
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(cx,cy,Rr*1.35,0,6.2832); ctx.fill();
    // sphere body
    var b=ctx.createRadialGradient(cx-Rr*.35,cy-Rr*.4,Rr*.1,cx,cy,Rr);
    b.addColorStop(0,'rgba(30,60,130,'+(0.55*ie)+')'); b.addColorStop(1,'rgba(8,14,32,'+(0.85*ie)+')');
    ctx.fillStyle=b; ctx.beginPath(); ctx.arc(cx,cy,Rr,0,6.2832); ctx.fill();
    ctx.strokeStyle='rgba(120,170,255,'+(0.22*ie)+')'; ctx.lineWidth=1; ctx.stroke();
    // dots, bucketed by depth for fewer state changes
    var paths=[]; for(var k=0;k<bands;k++) paths.push(new Path2D());
    var back=new Path2D(), ds=mobile?1.7:2.1;
    for(var i=0;i<n;i++){
      rot(P[i*3],P[i*3+1],P[i*3+2],tmp);
      var x=cx+tmp[0]*Rr, y=cy-tmp[1]*Rr, z=tmp[2];
      if(z<0){ if(z>-0.6){back.rect(x-.5,y-.5,1,1);} continue; }
      var k2=Math.min(bands-1,(z*bands)|0), s=ds*(0.55+z*0.75);
      paths[k2].rect(x-s/2,y-s/2,s,s);
    }
    ctx.fillStyle='rgba(90,150,255,'+(0.13*ie)+')'; ctx.fill(back);
    for(k=0;k<bands;k++){ ctx.fillStyle='rgba('+(120+k*16)+','+(175+k*10)+',255,'+((0.35+k/bands*0.65)*ie)+')'; ctx.fill(paths[k]); }
    if(ie<0.3) return;
    // arcs from Lahore
    var hv=rot(HOME.v[0],HOME.v[1],HOME.v[2],[0,0,0]);
    for(var c=0;c<CITIES.length;c++){
      var C=CITIES[c], cycle=C.dur+1.4, lt=((t-C.t0)%cycle+cycle)%cycle/C.dur; // 0..1 draw, >1 hold/fade
      var head=Math.min(1,lt), tail=Math.max(0,Math.min(1,(lt-0.55)*1.6));
      if(lt>1.5) continue;
      var dist=Math.acos(Math.max(-1,Math.min(1,HOME.v[0]*C.v[0]+HOME.v[1]*C.v[1]+HOME.v[2]*C.v[2])));
      var lift=0.08+dist*0.16, steps=40;
      ctx.beginPath(); var started=false, hx=0,hy=0,hz=-1;
      for(var s2=0;s2<=steps;s2++){
        var u=tail+(head-tail)*s2/steps; slerp(HOME.v,C.v,u,tmp2);
        var h=1+lift*Math.sin(Math.PI*u); rot(tmp2[0]*h,tmp2[1]*h,tmp2[2]*h,tmp);
        var px=cx+tmp[0]*Rr, py=cy-tmp[1]*Rr, vis=tmp[2]>-0.15||Math.hypot(tmp[0],tmp[1])>1;
        if(vis){ if(!started){ctx.moveTo(px,py);started=true;} else ctx.lineTo(px,py); hx=px;hy=py;hz=tmp[2]; }
        else started=false;
      }
      var al=lt>1?Math.max(0,1-(lt-1)*2):1;
      var lg=ctx.createLinearGradient(cx-Rr,cy,cx+Rr,cy); lg.addColorStop(0,'rgba(127,208,255,'+(.85*al)+')'); lg.addColorStop(1,'rgba(47,123,255,'+(.85*al)+')');
      ctx.strokeStyle=lg; ctx.lineWidth=1.6; ctx.shadowColor='rgba(90,162,255,.9)'; ctx.shadowBlur=10; ctx.stroke(); ctx.shadowBlur=0;
      if(head<1&&hz>-0.15){ ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(hx,hy,2.4,0,6.2832); ctx.fill(); }
      // city ping
      rot(C.v[0],C.v[1],C.v[2],tmp);
      if(tmp[2]>0&&lt>=1){ var pr=(lt-1)*2; var px2=cx+tmp[0]*Rr, py2=cy-tmp[1]*Rr;
        ctx.strokeStyle='rgba(127,208,255,'+(1-pr)+')'; ctx.lineWidth=1.2; ctx.beginPath(); ctx.arc(px2,py2,3+pr*14,0,6.2832); ctx.stroke();
        ctx.fillStyle='rgba(200,230,255,'+(1-pr*0.6)+')'; ctx.beginPath(); ctx.arc(px2,py2,2.2,0,6.2832); ctx.fill();
        if(!mobile&&pr<0.9){ ctx.font='600 11px Manrope, sans-serif'; ctx.fillStyle='rgba(220,235,255,'+(0.9-pr)+')'; ctx.fillText(C.name,px2+8,py2-6); }
      }
    }
    // Lahore beacon
    if(hv[2]>0){ var lx=cx+hv[0]*Rr, ly=cy-hv[1]*Rr, pp=(t%1.8)/1.8;
      ctx.fillStyle='rgba(47,123,255,'+(0.35*(1-pp))+')'; ctx.beginPath(); ctx.arc(lx,ly,4+pp*22,0,6.2832); ctx.fill();
      ctx.fillStyle='#fff'; ctx.shadowColor='#5aa2ff'; ctx.shadowBlur=14; ctx.beginPath(); ctx.arc(lx,ly,3.6,0,6.2832); ctx.fill(); ctx.shadowBlur=0;
      ctx.font='700 12px Manrope, sans-serif'; ctx.fillStyle='rgba(255,255,255,.95)'; ctx.fillText('Lahore',lx+10,ly+4);
    }
  }
  requestAnimationFrame(frame);
  if(reduce) window.NFX_GLOBE.reveal();
})();
