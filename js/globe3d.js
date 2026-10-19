/* Navifex Pro — cinematic WebGL globe (Three.js). Driven 1:1 by scroll state in window.NFX_GX (set by main.js).
   Hero: globe rises under a spotlight. Chapters: 01 turn to Lahore + arcs to the world · 02 split into one longitude
   slice per service (count comes from window.NFX_SERVICES) · 03 dots stream into a Views→Clicks→Leads→Sales funnel.
   Falls back to the CSS globe if WebGL is missing. */
import * as THREE from './vendor/three.module.min.js';

const root = document.querySelector('[data-gx]');
const cv = document.getElementById('globe');
const LAND = window.NFX_LAND;
if (root && cv && LAND) init();

function init() {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let renderer;
  try { const t = document.createElement('canvas'); if (!(t.getContext('webgl2') || t.getContext('webgl'))) return; } catch (e) { return; }
  try {
    renderer = new THREE.WebGLRenderer({ canvas: cv, alpha: true, antialias: false, powerPreference: 'high-performance' });
  } catch (e) { return; }
  if (!renderer.getContext()) return;
  renderer.setClearColor(0x000000, 0);

  const S = window.NFX_GX || (window.NFX_GX = {});
  const D2R = Math.PI / 180;
  const vec = (la, lo, r = 1) => new THREE.Vector3(Math.cos(la * D2R) * Math.sin(lo * D2R) * r, Math.sin(la * D2R) * r, Math.cos(la * D2R) * Math.cos(lo * D2R) * r);
  const HOME = { la: 31.55, lo: 74.34 };
  const homeV = vec(HOME.la, HOME.lo);
  const CITIES = [['Dubai', 25.2, 55.27], ['London', 51.5, -0.12], ['New York', 40.71, -74], ['Toronto', 43.65, -79.38], ['Riyadh', 24.71, 46.67],
    ['Sydney', -33.87, 151.2], ['Singapore', 1.35, 103.82], ['Karachi', 24.86, 67], ['Istanbul', 41.0, 28.97], ['Berlin', 52.52, 13.4], ['Doha', 25.29, 51.53], ['Kuala Lumpur', 3.14, 101.69]];

  let mobile = innerWidth < 900;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.005, 60);
  const globe = new THREE.Group();
  scene.add(globe);

  /* ---------- segments: one longitude slice per service ---------- */
  const SVC = (window.NFX_SERVICES || []).length ? window.NFX_SERVICES : [{ name: 'Services', url: '/services' }];
  const SEG = SVC.length, SW = 360 / SEG, segDirs = [];
  for (let k = 0; k < SEG; k++) { const a = (-180 + SW / 2 + k * SW) * D2R; segDirs.push(new THREE.Vector3(Math.sin(a), 0, Math.cos(a))); }
  const segOf = (lon) => Math.min(SEG - 1, Math.max(0, Math.floor((lon + 180) / SW)));

  /* ---------- dots: land (Natural Earth) + faint ocean lattice ---------- */
  const nLand = LAND.length / 2, nSea = mobile ? 1400 : 3600, N = nLand + nSea;
  const pos = new Float32Array(N * 3), kind = new Float32Array(N), seg = new Float32Array(N), rnd = new Float32Array(N), tgt = new Float32Array(N * 3);
  for (let i = 0; i < nLand; i++) {
    const la = LAND[i * 2], lo = LAND[i * 2 + 1], v = vec(la, lo);
    pos.set([v.x, v.y, v.z], i * 3); kind[i] = 1; seg[i] = segOf(lo); rnd[i] = Math.random();
  }
  const ga = Math.PI * (3 - Math.sqrt(5));
  for (let j = 0; j < nSea; j++) {
    const i = nLand + j, y = 1 - (j / (nSea - 1)) * 2, r = Math.sqrt(1 - y * y), th = ga * j;
    const x = Math.cos(th) * r, z = Math.sin(th) * r;
    pos.set([x * 0.997, y * 0.997, z * 0.997], i * 3); kind[i] = 0; rnd[i] = Math.random();
    seg[i] = segOf(Math.atan2(x, z) / D2R);
  }
  const dotGeo = new THREE.BufferGeometry();
  dotGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  dotGeo.setAttribute('aKind', new THREE.BufferAttribute(kind, 1));
  dotGeo.setAttribute('aSeg', new THREE.BufferAttribute(seg, 1));
  dotGeo.setAttribute('aRand', new THREE.BufferAttribute(rnd, 1));
  const tgtAttr = new THREE.BufferAttribute(tgt, 3); dotGeo.setAttribute('aTarget', tgtAttr);
  dotGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 30);

  const U = {
    uTime: { value: 0 }, uIntro: { value: 0 }, uLahore: { value: 0 }, uSplit: { value: 0 }, uStream: { value: 0 },
    uLight: { value: 0 }, uDim: { value: 1 }, uPR: { value: 1 }, uSize: { value: 2.2 }, uHome: { value: homeV },
    uSegDir: { value: segDirs }, uLightDir: { value: new THREE.Vector3(-0.55, 0.65, 0.55).normalize() }, uCam: { value: new THREE.Vector3() }
  };
  const dotMat = new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
      attribute float aKind; attribute float aSeg; attribute float aRand; attribute vec3 aTarget;
      uniform float uTime,uIntro,uLahore,uSplit,uStream,uLight,uDim,uPR,uSize; uniform vec3 uHome; uniform vec3 uSegDir[${SEG}]; uniform vec3 uLightDir; uniform vec3 uCam;
      varying float vA; varying vec3 vC;
      void main(){
        int s=int(aSeg+0.5);
        vec3 p=position;
        float layer=mod(aSeg,3.0);
        p*=1.0-uSplit*0.06*layer;
        p+=uSegDir[s]*uSplit*(0.38+0.09*layer);
        vec4 wp=modelMatrix*vec4(p,1.0);
        vec3 n=normalize(mat3(modelMatrix)*position);
        float t=smoothstep(aRand*0.45,aRand*0.45+0.55,uStream);
        float sw=sin(t*3.14159);
        vec3 q=mix(wp.xyz,aTarget,t);
        float ang=aRand*40.0+t*5.0;
        q.x+=sin(ang)*0.28*sw; q.z+=cos(ang)*0.28*sw; q.y-=0.35*sw;
        vec4 mv=viewMatrix*vec4(q,1.0);
        gl_Position=projectionMatrix*mv;
        vec3 V=normalize(uCam-wp.xyz);
        float face=dot(n,V);
        float lam=clamp(dot(n,uLightDir)*0.6+0.45,0.0,1.0);
        float h=1.25-2.7*uIntro;
        float rev=smoothstep(h,h+0.45,n.y);
        float hd=dot(normalize(position),uHome);
        float hg=smoothstep(0.986,0.9995,hd)*uLahore;
        float hz=smoothstep(0.90,0.99,hd)*uLahore;
        float vis=mix(0.07,1.0,smoothstep(-0.2,0.3,face));
        vis=mix(vis,1.0,max(t,uSplit*0.85));
        vec3 land=mix(vec3(0.16,0.34,0.92),vec3(0.60,0.84,1.0),lam);
        land=mix(land,vec3(0.92,0.97,1.0),uLight*0.55*lam);
        vec3 sea=vec3(0.20,0.38,0.85)*(0.55+0.45*lam);
        vec3 c=mix(sea,land,aKind);
        c=mix(c,vec3(0.55,0.95,1.0),hz*0.7);
        c=mix(c,vec3(1.0),hg);
        c=mix(c,mix(vec3(0.35,0.62,1.0),vec3(0.62,0.9,1.0),aRand),t);
        float a=mix(0.26,0.95,aKind)*(0.85+uLight*0.3);
        a=mix(a,0.85,t);
        vA=a*vis*rev*uDim;
        vC=c;
        float sz=uSize*mix(0.62,1.0,aKind)*(1.0+hg*2.2+hz*0.5)*(1.0+uLight*0.18);
        sz=mix(sz,uSize*1.05,t);
        float ps=sz*uPR*(4.6/max(-mv.z,0.05));
        float cap=16.0*uPR;
        vA*=clamp(cap*0.55/ps,0.18,1.0);
        gl_PointSize=min(ps,cap);
      }`,
    fragmentShader: /* glsl */`
      varying float vA; varying vec3 vC;
      void main(){
        float d=length(gl_PointCoord-0.5);
        float a=smoothstep(0.5,0.18,d);
        if(a<0.01) discard;
        gl_FragColor=vec4(vC*(0.75+0.7*smoothstep(0.28,0.0,d)),a*vA);
      }`
  });
  const dots = new THREE.Points(dotGeo, dotMat); dots.frustumCulled = false; dots.renderOrder = 2;
  globe.add(dots);

  /* ---------- core sphere (rim lit, spotlight from top-left) ---------- */
  const coreU = { uOp: { value: 0 }, uLight: { value: 0 }, uLV: { value: new THREE.Vector3(-0.45, 0.7, 0.55).normalize() } };
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.985, mobile ? 40 : 64, mobile ? 28 : 44), new THREE.ShaderMaterial({
    uniforms: coreU, transparent: true, depthWrite: false,
    vertexShader: `varying vec3 vN; void main(){ vN=normalize(normalMatrix*normal); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `uniform float uOp,uLight; uniform vec3 uLV; varying vec3 vN;
      void main(){ float f=pow(1.0-max(vN.z,0.0),2.6); float l=clamp(dot(vN,uLV),0.0,1.0);
        vec3 c=mix(vec3(0.012,0.025,0.07),vec3(0.05,0.13,0.36),l)+vec3(0.20,0.48,1.0)*f*(0.75+uLight*0.6)+vec3(0.10,0.22,0.5)*uLight*l;
        gl_FragColor=vec4(c,uOp*(0.9+0.1*f)); }`
  }));
  core.renderOrder = 0; globe.add(core);

  /* ---------- halo / limb glow (camera-facing) ---------- */
  const haloU = { uOp: { value: 0 }, uLight: { value: 0 } };
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 3.6), new THREE.ShaderMaterial({
    uniforms: haloU, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
    vertexShader: `varying vec2 vP; void main(){ vP=position.xy/1.0; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `uniform float uOp,uLight; varying vec2 vP;
      void main(){ float r=length(vP); float dir=0.55+0.45*dot(normalize(vP+1e-4),normalize(vec2(-0.6,0.8)));
        float limb=exp(-pow((r-1.0)/0.045,2.0))*0.55;
        float soft=(r>0.96? exp(-(r-0.96)*4.2):0.0)*0.45;
        float inner=smoothstep(1.0,0.2,r)*0.06;
        float g=(limb+soft)*dir+inner;
        vec3 c=mix(vec3(0.18,0.45,1.0),vec3(0.5,0.85,1.0),limb)*(1.0+uLight*0.9);
        float a=clamp(g*uOp,0.0,1.0); gl_FragColor=vec4(c*(1.0+uLight*0.4),a); }`
  }));
  halo.renderOrder = -1; scene.add(halo);

  /* ---------- arcs: Lahore → world ---------- */
  const arcs = [];
  const arcVS = `varying float vX; void main(){ vX=uv.x; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`;
  const arcFS = `uniform float uHead,uOp; varying float vX;
    void main(){ if(vX>uHead) discard; float tail=smoothstep(uHead-0.55,uHead,vX); float head=smoothstep(uHead-0.04,uHead,vX);
      vec3 c=mix(vec3(0.2,0.5,1.0),vec3(0.85,0.97,1.0),head); gl_FragColor=vec4(c,(0.25+0.75*tail)*uOp); }`;
  const cityPos = new Float32Array(CITIES.length * 3), cityDel = new Float32Array(CITIES.length);
  CITIES.forEach((c, k) => {
    const b = vec(c[1], c[2]), dist = homeV.angleTo(b), lift = 0.06 + dist * 0.17, pts = [];
    for (let s = 0; s <= 48; s++) {
      const u = s / 48, p = homeV.clone().lerp(b, u).normalize();
      // slerp via normalized lerp is ok for < 180°; correct with small arc lift
      pts.push(p.multiplyScalar(1 + lift * Math.sin(Math.PI * u)));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const m = new THREE.ShaderMaterial({ uniforms: { uHead: { value: 0 }, uOp: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexShader: arcVS, fragmentShader: arcFS });
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 56, mobile ? 0.008 : 0.0055, 5, false), m);
    mesh.renderOrder = 3; globe.add(mesh);
    const del = (k % 6) * 0.1 + Math.floor(k / 6) * 0.05;
    arcs.push({ m, del }); cityPos.set([b.x * 1.004, b.y * 1.004, b.z * 1.004], k * 3); cityDel[k] = del;
  });
  const pingU = { uT: { value: 0 }, uOp: { value: 0 }, uPR: U.uPR, uTime: U.uTime };
  const pingGeo = new THREE.BufferGeometry();
  pingGeo.setAttribute('position', new THREE.BufferAttribute(cityPos, 3));
  pingGeo.setAttribute('aDel', new THREE.BufferAttribute(cityDel, 1));
  const pings = new THREE.Points(pingGeo, new THREE.ShaderMaterial({
    uniforms: pingU, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
    vertexShader: `attribute float aDel; uniform float uT,uOp,uPR,uTime; varying float vA; varying float vPh;
      void main(){ float arr=clamp((uT-aDel)*1.6-1.0,0.0,1.0); vec4 mv=modelViewMatrix*vec4(position,1.0);
        vec3 n=normalize(mat3(modelMatrix)*position); vec3 wp=(modelMatrix*vec4(position,1.0)).xyz; float face=dot(n,normalize(cameraPosition-wp));
        vA=arr*uOp*smoothstep(-0.05,0.25,face); vPh=fract(uTime*0.6+aDel*3.0); gl_Position=projectionMatrix*mv; gl_PointSize=34.0*uPR*arr; }`,
    fragmentShader: `varying float vA; varying float vPh; void main(){ float d=length(gl_PointCoord-0.5)*2.0;
      float core=smoothstep(0.24,0.08,d); float ring=smoothstep(0.08,0.0,abs(d-(0.25+vPh*0.7)))*(1.0-vPh);
      gl_FragColor=vec4(vec3(0.7,0.92,1.0),(core+ring*0.8)*vA); }`
  }));
  pings.renderOrder = 4; pings.frustumCulled = false; globe.add(pings);

  /* ---------- Lahore beacon ---------- */
  const beaconU = { uOp: { value: 0 }, uPR: U.uPR, uTime: U.uTime };
  const bGeo = new THREE.BufferGeometry(); bGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([homeV.x * 1.006, homeV.y * 1.006, homeV.z * 1.006]), 3));
  const beacon = new THREE.Points(bGeo, new THREE.ShaderMaterial({
    uniforms: beaconU, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
    vertexShader: `uniform float uOp,uPR; varying float vA; void main(){ vec4 mv=modelViewMatrix*vec4(position,1.0);
      vec3 n=normalize(mat3(modelMatrix)*position); vec3 wp=(modelMatrix*vec4(position,1.0)).xyz; vA=uOp*smoothstep(-0.05,0.3,dot(n,normalize(cameraPosition-wp)));
      gl_Position=projectionMatrix*mv; gl_PointSize=min(90.0*uPR*(4.6/max(-mv.z,0.05)),260.0*uPR); }`,
    fragmentShader: `uniform float uTime; varying float vA; void main(){ float d=length(gl_PointCoord-0.5)*2.0; float ph=fract(uTime*0.55);
      float core=smoothstep(0.12,0.0,d); float glow=exp(-d*5.0)*0.6; float ring=smoothstep(0.05,0.0,abs(d-ph))*(1.0-ph)*0.9;
      gl_FragColor=vec4(mix(vec3(0.35,0.7,1.0),vec3(1.0),core),(core+glow+ring)*vA); }`
  }));
  beacon.renderOrder = 5; beacon.frustumCulled = false; globe.add(beacon);

  /* ---------- atmosphere dust (parallax layers) ---------- */
  const nDust = mobile ? 260 : 800, dp = new Float32Array(nDust * 3), dr = new Float32Array(nDust);
  for (let i = 0; i < nDust; i++) { dp.set([(Math.random() - .5) * 14, (Math.random() - .5) * 9, -7 + Math.random() * 9.5], i * 3); dr[i] = Math.random(); }
  const dustGeo = new THREE.BufferGeometry(); dustGeo.setAttribute('position', new THREE.BufferAttribute(dp, 3)); dustGeo.setAttribute('aR', new THREE.BufferAttribute(dr, 1));
  const dustU = { uTime: U.uTime, uScroll: { value: 0 }, uPR: U.uPR, uOp: { value: 0 } };
  const dust = new THREE.Points(dustGeo, new THREE.ShaderMaterial({
    uniforms: dustU, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
    vertexShader: `attribute float aR; uniform float uTime,uScroll,uPR,uOp; varying float vA; varying float vB;
      void main(){ vec3 p=position; float depth=(p.z+7.0)/9.5; p.y=mod(p.y+uScroll*(0.4+depth*1.6)+uTime*0.03*(0.5+aR)+4.5,9.0)-4.5;
        p.x+=sin(uTime*0.2+aR*30.0)*0.15; vec4 mv=viewMatrix*vec4(p,1.0); gl_Position=projectionMatrix*mv;
        vB=step(0.965,aR); float s=mix(1.4,9.0,vB)*(0.6+depth); gl_PointSize=s*uPR*(5.0/max(-mv.z,0.3));
        vA=uOp*mix(0.35,0.12,vB)*(0.4+0.6*sin(uTime*0.8+aR*20.0)*0.5+0.3); }`,
    fragmentShader: `varying float vA; varying float vB; void main(){ float d=length(gl_PointCoord-0.5); float a=mix(smoothstep(0.5,0.0,d),smoothstep(0.5,0.25,d)*0.7+smoothstep(0.5,0.45,d)*0.3,vB);
      gl_FragColor=vec4(vec3(0.5,0.75,1.0),a*vA); }`
  }));
  dust.renderOrder = -2; dust.frustumCulled = false; scene.add(dust);

  /* ---------- layout ---------- */
  let W = 1, H = 1, L = null;
  const tanH = () => Math.tan(camera.fov * D2R / 2);
  const FUN = [2.0, 1.5, 1.04, 0.62];
  function layout() {
    W = cv.clientWidth || innerWidth; H = cv.clientHeight || innerHeight; mobile = W < 900;
    const pr = Math.min(devicePixelRatio || 1, mobile ? 1.5 : 2);
    renderer.setPixelRatio(pr); renderer.setSize(W, H, false); U.uPR.value = pr;
    camera.aspect = W / H; camera.fov = mobile ? 36 : 32; camera.updateProjectionMatrix();
    const camZ = mobile ? 6.6 : 5.2, hh = tanH() * camZ, hw = hh * camera.aspect;
    let ch, hero;
    if (mobile) {
      const s = Math.min(0.82, hw * 0.86);
      ch = { x: 0, y: hh * 0.36, s }; hero = { x: 0, y: -hh * 0.62 - s * 1.18, s: s * 1.18 };
    } else {
      const s = Math.min(1.0, hh * 0.64, hw * 0.4);
      ch = { x: hw * 0.4, y: -hh * 0.02, s }; hero = { x: 0, y: -hh * 0.62 - 1.32, s: 1.32 };
    }
    L = { camZ, hh, hw, ch, hero };
    U.uSize.value = mobile ? 2.0 : 2.3;
    // funnel targets (world space, around the chapter globe position)
    const s = ch.s, tierH = 0.3 * s, gap = 0.13 * s, top = ch.y + (tierH * 4 + gap * 3) / 2, wsum = FUN.reduce((a, b) => a + b, 0);
    L.tiers = FUN.map((w, k) => ({ y: top - k * (tierH + gap) - tierH / 2, w: w * s * (mobile ? 0.95 : 1) }));
    for (let i = 0; i < N; i++) {
      let r = rnd[(i * 7) % N] * wsum, k = 0; while (k < 3 && r > FUN[k]) { r -= FUN[k]; k++; }
      const T = L.tiers[k], fx = ch.x + (Math.random() - 0.5) * T.w, fy = T.y + (Math.random() - 0.5) * tierH;
      tgt[i * 3] = fx; tgt[i * 3 + 1] = fy; tgt[i * 3 + 2] = (Math.random() - 0.5) * 0.18;
    }
    tgtAttr.needsUpdate = true;
  }
  layout();
  let rsT = 0, lastW = W;
  addEventListener('resize', () => { clearTimeout(rsT); rsT = setTimeout(() => { if (mobile && Math.abs(cv.clientWidth - lastW) < 2 && Math.abs((cv.clientHeight || 0) - H) < 140) return; lastW = cv.clientWidth; layout(); kick(); }, 120); });

  /* ---------- drag (hero only) ---------- */
  let userRot = 0, userTgt = 0, drag = null;
  const hxEl = root.querySelector('.hx') || cv;
  hxEl.addEventListener('pointerdown', (e) => { if ((S.rise || 0) > 0.35 || e.target.closest('a,button,input')) return; drag = { x: e.clientX, r: userTgt }; root.classList.add('grabbing'); kick(); });
  addEventListener('pointermove', (e) => { if (drag) { userTgt = drag.r + (e.clientX - drag.x) * 0.006; kick(); } });
  const endDrag = () => { drag = null; root.classList.remove('grabbing'); };
  addEventListener('pointerup', endDrag); addEventListener('pointercancel', endDrag);

  /* ---------- DOM hooks written from projection ---------- */
  const fx = root.querySelector('.gx-fx');
  const labWrap = root.querySelector('.gx-labels');
  if (labWrap && !labWrap.children.length) labWrap.innerHTML = SVC.map((v, k) => `<a class="gx-sl" href="${v.url}" data-cursor="Open"><small>${String(k + 1).padStart(2, '0')}</small>${v.name}</a>`).join('');
  const labels = [...root.querySelectorAll('.gx-sl')], svg = root.querySelector('.gx-lines');
  const pin = root.querySelector('.gx-pin');
  const fl = [...root.querySelectorAll('.gx-fl')];
  let lines = [];
  if (svg) { svg.innerHTML = labels.map(() => '<line/>').join(''); lines = [...svg.querySelectorAll('line')]; }
  const v3 = new THREE.Vector3(), c3 = new THREE.Vector3();
  const toPx = (v) => { v.project(camera); return [(v.x + 1) / 2 * W, (1 - v.y) / 2 * H, v.z]; };

  /* ---------- frame ---------- */
  const lerp = (a, b, t) => a + (b - a) * t;
  const lahoreA = -HOME.lo * D2R, latA = HOME.la * D2R;
  let autoRot = lahoreA + 0.75, last = performance.now(), visible = true, raf = 0, introStart = 0;
  if ('IntersectionObserver' in window) new IntersectionObserver((en) => { visible = en[0].isIntersecting; if (visible) kick(); }).observe(root);
  document.addEventListener('visibilitychange', kick);
  function kick() { if (!raf) raf = requestAnimationFrame(frame); }

  function frame(now) {
    raf = 0;
    if (!visible || document.hidden) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    U.uTime.value = now / 1000;
    if (!introStart && (S.introAt || reduce)) introStart = now;
    const intro = reduce ? 1 : (introStart ? Math.min(1, (now - introStart) / 2200) : 0);
    const ie = 1 - Math.pow(1 - intro, 3);

    const rise = S.rise || 0, turn = S.turn || 0, drift = S.drift || 0, tilt = S.tilt || 0, split = S.split || 0;
    const dive = 0, stream = S.stream || 0, light = S.light || 0, phone = 0;

    // globe placement
    const re = rise * rise * (3 - 2 * rise);
    const gx = lerp(L.hero.x, L.ch.x, re), gy = lerp(L.hero.y, L.ch.y, re), gs = lerp(L.hero.s, L.ch.s, re) * (1 + 0.05 * light);
    globe.position.set(gx, gy, 0); globe.scale.setScalar(gs);

    if (!drag) userTgt *= rise > 0.05 ? 0.9 : 0.995;
    userRot += (userTgt - userRot) * 0.08;
    if (rise < 1 && !reduce) autoRot += dt * 0.09 * (1 - rise);
    const base = autoRot + userRot;
    let delta = (lahoreA - base) % (Math.PI * 2); if (delta < 0) delta += Math.PI * 2; if (delta < Math.PI * 0.8) delta += Math.PI * 2;
    globe.rotation.y = base + delta * turn + 0.62 * drift + (S.spin || 0);
    globe.rotation.x = lerp(lerp(0.34, latA, turn), 1.18, tilt);

    // uniforms
    U.uIntro.value = ie; U.uLahore.value = Math.max(S.lahore || 0, 0.35 * ie * (1 - rise)); U.uSplit.value = split; U.uStream.value = stream;
    U.uLight.value = light; U.uDim.value = 1 - 0.7 * phone;
    coreU.uOp.value = ie * (1 - stream) * (1 - 0.35 * split); coreU.uLight.value = light;
    core.scale.setScalar(1 - 0.42 * split); core.visible = coreU.uOp.value > 0.01;
    haloU.uOp.value = ie * (1 - stream * 0.85) * (1 - split * 0.5) * (1 - phone * 0.6) * (0.8 + light * 0.6); haloU.uLight.value = light;
    const arcT = S.arcT || 0, arcOp = (S.arcOp || 0) * (1 - split);
    arcs.forEach((a) => { a.m.uniforms.uHead.value = Math.min(1.02, Math.max(0, (arcT - a.del) * 1.6)); a.m.uniforms.uOp.value = arcOp; });
    pingU.uT.value = arcT; pingU.uOp.value = arcOp;
    beaconU.uOp.value = Math.max(S.lahore || 0, 0.5 * ie * (1 - rise)) * (1 - split) * (1 - stream) * (1 - phone);
    dustU.uOp.value = ie; dustU.uScroll.value = (S.scroll || 0) * 0.0006;

    // camera: dolly into Lahore keeping it fixed on screen
    globe.updateMatrixWorld(true);
    const Lw = v3.copy(homeV).applyMatrix4(globe.matrixWorld);
    const th = tanH(), asp = camera.aspect;
    camera.position.set(0, 0, L.camZ);
    if (dive > 0.0001) {
      const d0 = L.camZ - Lw.z, d1 = 0.12, d = d0 * Math.pow(d1 / d0, dive);
      const nx = Lw.x / (d0 * th * asp), ny = Lw.y / (d0 * th);
      camera.position.set(Lw.x - nx * d * th * asp, Lw.y - ny * d * th, Lw.z + d);
    }
    camera.updateMatrixWorld(); U.uCam.value.copy(camera.position);
    halo.position.copy(globe.position); halo.scale.setScalar(gs); halo.quaternion.copy(camera.quaternion);

    renderer.render(scene, camera);

    // projections for HTML overlays
    if (fx) {
      const C = toPx(c3.copy(globe.position));
      fx.style.setProperty('--cx', C[0].toFixed(1) + 'px'); fx.style.setProperty('--cy', C[1].toFixed(1) + 'px');
      fx.style.setProperty('--gr', (gs / ((L.camZ) * th) * H / 2).toFixed(1) + 'px');
      if (pin) { const P = toPx(c3.copy(homeV).multiplyScalar(1.01).applyMatrix4(globe.matrixWorld)); pin.style.transform = `translate3d(${P[0].toFixed(1)}px,${P[1].toFixed(1)}px,0)`; }
      if ((S.labels || 0) > 0.001 && labels.length) {
        labels.forEach((el, k) => {
          const A = toPx(c3.copy(segDirs[k]).multiplyScalar(0.38 + 0.09 * (k % 3) + 0.72).applyMatrix4(globe.matrixWorld));
          let dx = A[0] - C[0], dy = A[1] - C[1]; const m = Math.hypot(dx, dy) || 1; dx /= m; dy /= m;
          const len = mobile ? 22 : 40; let bx = A[0] + dx * len, by = A[1] + dy * len;
          const minX = mobile ? 70 : Math.max(W * 0.5, C[0] - (C[0] - W * 0.5) * 2) + 20;
          bx = Math.max(dx < -0.2 ? minX + 110 : minX, Math.min(W - (dx > 0.2 ? 150 : 70), bx)); by = Math.max(mobile ? 140 : 90, Math.min(H - (mobile ? 300 : 110), by));
          el.style.transform = `translate3d(${bx.toFixed(1)}px,${by.toFixed(1)}px,0) translate(${dx < -0.2 ? '-100%' : dx > 0.2 ? '0%' : '-50%'},${dy < -0.3 ? '-100%' : dy > 0.3 ? '0%' : '-50%'})`;
          const ln = lines[k]; if (ln) { ln.setAttribute('x1', A[0].toFixed(1)); ln.setAttribute('y1', A[1].toFixed(1)); ln.setAttribute('x2', bx.toFixed(1)); ln.setAttribute('y2', by.toFixed(1)); }
        });
      }
      if (stream > 0.001 && L.tiers) {
        fl.forEach((el, k) => { const T = L.tiers[k]; if (!T) return; const P = toPx(c3.set(L.ch.x, T.y, 0.1)); el.style.transform = `translate3d(${P[0].toFixed(1)}px,${P[1].toFixed(1)}px,0) translate(-50%,-50%)`; });
      }
    }
    if (!reduce || intro < 1) raf = requestAnimationFrame(frame);
  }
  root.classList.add('gl-on');
  window.NFX_GX_KICK = kick;
  kick();
  if (reduce) addEventListener('scroll', kick, { passive: true });
}
