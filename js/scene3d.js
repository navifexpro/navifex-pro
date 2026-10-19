/* Navifex Pro — per-page 3D hero scenes (Three.js, same vendored module as the home globe).
   Markup: <div class="p3d" data-scene="social" aria-hidden="true"><canvas></canvas></div> inside the page hero.
   One small runtime: renderer, lights, glow, dust, card/text helpers + one builder per page.
   Scroll is scrubbed 1:1 (eased) from page top to just past the stage. Reduced motion = one still frame.
   No WebGL / JS off = CSS fallback on .p3d (brand mark + glow), all text stays in HTML. */
import * as THREE from './vendor/three.module.min.js';

const host = document.querySelector('.p3d[data-scene]');

const no = () => { host.classList.remove('gl-on'); host.classList.add('gl-no'); };
function boot() {
  const cv = host.querySelector('canvas');
  try { const t = document.createElement('canvas'); if (!(t.getContext('webgl2') || t.getContext('webgl'))) return no(); } catch (e) { return no(); }
  const go = () => { try { start(host, cv); } catch (e) { no(); if (window.console) console.warn('3D off', e); } };
  const f = document.fonts && document.fonts.ready;
  if (f) Promise.race([f, new Promise(r => setTimeout(r, 1500))]).then(go); else go();
}

/* ---------------- shared kit ---------------- */
const C = { bg: 0x060a14, blue: 0x2f7bff, blue2: 0x5aa2ff, cyan: 0x7fd0ff, ink: '#060a14', card: '#0d162b', card2: '#111d38', line: 'rgba(120,170,255,.22)' };
const HEAD = (s, w = 700) => `${w} ${s}px "Bricolage Grotesque", system-ui, sans-serif`;
const BODY = (s, w = 600) => `${w} ${s}px Manrope, system-ui, sans-serif`;
const GRADS = [['#2f7bff', '#7fd0ff'], ['#ff8a5b', '#ffd36e'], ['#6d5cff', '#c77dff'], ['#14b88a', '#7fd0ff'], ['#ff5b8a', '#ffb36e'], ['#1e3a8a', '#5aa2ff']];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const sm = (a, b, v) => { const x = clamp((v - a) / (b - a)); return x * x * (3 - 2 * x); };
const lerp = (a, b, t) => a + (b - a) * t;

function rrPath(x, X, y, w, h, r) { X.beginPath(); X.moveTo(x + r, y); X.arcTo(x + w, y, x + w, y + h, r); X.arcTo(x + w, y + h, x, y + h, r); X.arcTo(x, y + h, x, y, r); X.arcTo(x, y, x + w, y, r); X.closePath(); }
const rr = (X, x, y, w, h, r) => rrPath(x, X, y, w, h, r);
function grad(X, x, y, w, h, g) { const G = X.createLinearGradient(x, y, x + w, y + h); G.addColorStop(0, g[0]); G.addColorStop(1, g[1]); return G; }
function ctex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const X = c.getContext('2d'); draw(X, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
function rrShape(w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s;
}
function slab(w, h, d, r, mat) {
  const bt = d * 0.25, g = new THREE.ExtrudeGeometry(rrShape(w, h, r), { depth: d, bevelEnabled: true, bevelThickness: bt, bevelSize: Math.min(r * 0.3, bt), bevelSegments: 2, curveSegments: 6 });
  g.translate(0, 0, -d / 2); const m = new THREE.Mesh(g, mat); m.userData.front = d / 2 + bt; return m;
}
function face(w, h, r, map, opts = {}) {
  const g = new THREE.ShapeGeometry(rrShape(w, h, r), 6), uv = g.attributes.uv, p = g.attributes.position;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i) / w + 0.5, p.getY(i) / h + 0.5);
  return new THREE.Mesh(g, new THREE.MeshBasicMaterial(Object.assign({ map, transparent: true, depthWrite: opts.depthWrite !== false, side: opts.side || THREE.FrontSide }, opts.mat || {})));
}
/* card = thin dark slab + printed face */
function card(w, h, map, body) {
  const g = new THREE.Group(), r = Math.min(w, h) * 0.08;
  const s = slab(w, h, 0.04, r, body || M.body()); g.add(s);
  const f = face(w, h, r, map); f.position.z = s.userData.front + 0.003; g.add(f); g.userData.face = f; return g;
}
const M = {
  body: () => new THREE.MeshStandardMaterial({ color: 0x101a33, metalness: 0.45, roughness: 0.38 }),
  metal: () => new THREE.MeshStandardMaterial({ color: 0x1a2747, metalness: 0.7, roughness: 0.3 }),
  blue: () => new THREE.MeshStandardMaterial({ color: C.blue, emissive: 0x0a2a70, metalness: 0.25, roughness: 0.28 }),
  glow: (c = C.blue2, o = 1) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false })
};
let _dot, _soft;
const dotTex = () => _dot || (_dot = ctex(64, 64, (X) => { const g = X.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,.8)'); g.addColorStop(1, 'rgba(255,255,255,0)'); X.fillStyle = g; X.fillRect(0, 0, 64, 64); }));
const softTex = () => _soft || (_soft = ctex(128, 128, (X) => { const g = X.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(0.25, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); X.fillStyle = g; X.fillRect(0, 0, 128, 128); }));
function glow(color = C.blue, size = 3, opacity = 0.5) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: softTex(), color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false }));
  s.scale.set(size, size, 1); return s;
}
function dust(n, sx, sy, sz, size = 0.035, color = 0x8fc2ff) {
  const p = new Float32Array(n * 3); for (let i = 0; i < n; i++) p.set([(Math.random() - 0.5) * sx, (Math.random() - 0.5) * sy, (Math.random() - 0.5) * sz], i * 3);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  return new THREE.Points(g, new THREE.PointsMaterial({ size, map: dotTex(), color, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }));
}
/* text chip as a sprite (labels, names) */
function chip(text, o = {}) {
  const fs = o.fs || 40, pad = fs * 0.7, cnv = document.createElement('canvas').getContext('2d'); cnv.font = o.font || BODY(fs, 700);
  const tw = Math.ceil(cnv.measureText(text).width), w = tw + pad * 2, h = fs * 2;
  const t = ctex(w, h, (X) => {
    if (o.bg !== false) { rr(X, 2, 2, w - 4, h - 4, h / 2 - 2); X.fillStyle = o.bg || 'rgba(10,17,34,.88)'; X.fill(); X.lineWidth = 2; X.strokeStyle = o.stroke || 'rgba(90,162,255,.55)'; X.stroke(); }
    X.font = o.font || BODY(fs, 700); X.fillStyle = o.color || '#eaf2ff'; X.textBaseline = 'middle'; X.fillText(text, pad, h / 2 + 1);
  });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, depthTest: o.depthTest !== undefined ? o.depthTest : true }));
  const H = o.h || 0.2; s.scale.set(H * w / h, H, 1); return s;
}
function heart(X, x, y, s, fill) {
  X.beginPath(); X.moveTo(x, y + s * 0.3); X.bezierCurveTo(x, y, x - s * 0.5, y, x - s * 0.5, y + s * 0.3); X.bezierCurveTo(x - s * 0.5, y + s * 0.6, x, y + s * 0.8, x, y + s);
  X.bezierCurveTo(x, y + s * 0.8, x + s * 0.5, y + s * 0.6, x + s * 0.5, y + s * 0.3); X.bezierCurveTo(x + s * 0.5, y, x, y, x, y + s * 0.3); X.closePath();
  if (fill) { X.fillStyle = fill; X.fill(); } else X.stroke();
}
/* simple "photo" art for posts: gradient sky, sun, hills or a product bottle */
function art(X, x, y, w, h, i) {
  const g = GRADS[i % GRADS.length]; X.save(); rr(X, x, y, w, h, Math.min(w, h) * 0.06); X.clip();
  X.fillStyle = grad(X, x, y, w, h, g); X.fillRect(x, y, w, h);
  X.fillStyle = 'rgba(255,255,255,.85)'; X.beginPath(); X.arc(x + w * 0.72, y + h * 0.32, Math.min(w, h) * 0.12, 0, 7); X.fill();
  if (i % 2) { X.fillStyle = 'rgba(6,10,20,.55)'; X.beginPath(); X.moveTo(x, y + h); X.lineTo(x + w * 0.35, y + h * 0.55); X.lineTo(x + w * 0.6, y + h * 0.8); X.lineTo(x + w * 0.8, y + h * 0.62); X.lineTo(x + w, y + h); X.fill(); }
  else { X.fillStyle = 'rgba(6,10,20,.6)'; rr(X, x + w * 0.36, y + h * 0.38, w * 0.2, h * 0.5, w * 0.04); X.fill(); X.fillRect(x + w * 0.42, y + h * 0.3, w * 0.08, h * 0.1); X.fillStyle = 'rgba(255,255,255,.75)'; X.fillRect(x + w * 0.38, y + h * 0.56, w * 0.16, h * 0.08); }
  X.restore();
}
function bars(X, x, y, ws, h, c) { let yy = y; ws.forEach((w) => { rr(X, x, yy, w, h, h / 2); X.fillStyle = c; X.fill(); yy += h * 2.1; }); }
function postTex(i, label) {
  return ctex(512, 620, (X, w, h) => {
    rr(X, 0, 0, w, h, 34); X.fillStyle = C.card; X.fill();
    X.fillStyle = grad(X, 0, 0, 40, 40, GRADS[(i + 2) % GRADS.length]); X.beginPath(); X.arc(46, 46, 20, 0, 7); X.fill();
    bars(X, 80, 34, [140], 12, 'rgba(234,242,255,.8)'); bars(X, 80, 54, [90], 9, 'rgba(160,185,230,.4)');
    art(X, 22, 86, w - 44, 400, i);
    if (label) { X.font = HEAD(44); X.fillStyle = '#fff'; X.fillText(label, 46, 450); }
    X.lineWidth = 5; X.strokeStyle = '#eaf2ff'; heart(X, 48, 512, 34, i % 3 === 0 ? '#ff5b7f' : null);
    X.beginPath(); X.arc(118, 530, 16, 0, 7); X.stroke(); X.beginPath(); X.moveTo(160, 518); X.lineTo(196, 530); X.lineTo(160, 542); X.closePath(); X.stroke();
    bars(X, 34, 570, [300], 12, 'rgba(160,185,230,.35)');
  });
}
function phone(screenTex, w = 1.12, h = 2.3) {
  const g = new THREE.Group(), body = slab(w, h, 0.1, 0.17, M.metal()); g.add(body);
  const s = face(w - 0.09, h - 0.09, 0.14, screenTex); s.position.z = body.userData.front + 0.004; g.add(s);
  const isl = face(0.3, 0.07, 0.035, null, { mat: { color: 0x02040a } }); isl.position.set(0, h / 2 - 0.13, s.position.z + 0.002); g.add(isl);
  g.userData.front = s.position.z; return g;
}
function bubbleTex(text, me) {
  const fs = 44, cnv = document.createElement('canvas').getContext('2d'); cnv.font = BODY(fs, 600);
  const tw = Math.ceil(cnv.measureText(text).width), w = tw + 72, h = 104;
  const t = ctex(w, h, (X) => { rr(X, 3, 3, w - 6, h - 6, 40); X.fillStyle = me ? '#eef4ff' : '#2f7bff'; X.fill(); X.font = BODY(fs, 600); X.fillStyle = me ? '#0b1428' : '#fff'; X.textBaseline = 'middle'; X.fillText(text, 36, h / 2 + 2); });
  t.userData = { aspect: w / h }; return t;
}

/* ---------------- runtime ---------------- */
function start(host, cv) {
  const name = host.dataset.scene, B = SCENES[name]; if (!B) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let mobile = innerWidth < 900;
  let renderer; try { renderer = new THREE.WebGLRenderer({ canvas: cv, alpha: true, antialias: !mobile, powerPreference: 'high-performance' }); } catch (e) { return no(); }
  if (!renderer.getContext()) return no();
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(30, 1, 0.05, 80);
  scene.add(new THREE.HemisphereLight(0xa8cbff, 0x060a14, 1.3));
  const key = new THREE.DirectionalLight(0xffffff, 2.4); key.position.set(-3, 4, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(0x5aa2ff, 3.2); rim.position.set(4, 1.5, -4); scene.add(rim);
  const rig = new THREE.Group(), root = new THREE.Group(); rig.add(root); scene.add(rig);
  const halo = glow(C.blue, 6, 0.32); halo.position.z = -2; rig.add(halo);
  const light = mobile || name === 'lost' || name === 'privacy' || name === 'terms';
  const dst = dust(light ? 70 : 220, 9, 5, 4); dst.position.z = -1; scene.add(dst);
  const K = { THREE, root, scene, camera, mobile, renderer, reduce };
  const def = B(K) || {}; const upd = def.update || (() => {});
  const W = def.W || 4, H = def.H || 3, still = def.still != null ? def.still : 0.35, camY = def.camY || 0;
  const tanH = Math.tan(15 * Math.PI / 180);
  let stageBottom = 1, aspect = 1;
  function layout() {
    mobile = innerWidth < 900;
    const r = host.getBoundingClientRect(), w = Math.max(1, r.width), h = Math.max(1, r.height);
    stageBottom = r.bottom + scrollY;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile ? 1.5 : 2)); renderer.setSize(w, h, false);
    aspect = w / h; camera.aspect = aspect;
    const k = aspect < 1 ? (def.Wm || 0.8) : 1, z = Math.max(H / (2 * tanH), W * k / (2 * tanH * aspect)) * 1.08;
    camera.position.set(0, camY, z); camera.lookAt(0, 0, 0); camera.updateProjectionMatrix();
  }
  let mx = 0, my = 0, tmx = 0, tmy = 0;
  if (!reduce && matchMedia('(hover:hover) and (pointer:fine)').matches)
    addEventListener('pointermove', (e) => { tmx = e.clientX / innerWidth - 0.5; tmy = e.clientY / innerHeight - 0.5; }, { passive: true });
  let cur = 0, raf = 0, vis = true, t0 = performance.now();
  const target = () => clamp(scrollY / Math.max(1, stageBottom - innerHeight * 0.35));
  function draw(p, t, e) {
    rig.position.y = -(1 - e) * 0.45; const s = 0.92 + 0.08 * e; rig.scale.set(s, s, s);
    mx += (tmx - mx) * 0.05; my += (tmy - my) * 0.05; rig.rotation.y = mx * 0.25; rig.rotation.x = my * 0.12;
    halo.material.opacity = 0.32 * e; dst.rotation.y = t * 0.01; dst.position.y = -p * 0.8;
    upd(p, t, e); renderer.render(scene, camera);
  }
  function frame(now) {
    raf = 0; if (!vis) return;
    const tg = target(); cur += (tg - cur) * 0.14; if (Math.abs(tg - cur) < 1e-4) cur = tg;
    const e = 1 - Math.pow(1 - clamp((now - t0) / 1500), 3);
    draw(cur, now / 1000, e); raf = requestAnimationFrame(frame);
  }
  const kick = () => { if (!raf && vis && !reduce) raf = requestAnimationFrame(frame); };
  layout();
  if (reduce) { draw(still, 0, 1); }
  else { cur = target(); kick(); }
  host.classList.add('gl-on');
  new IntersectionObserver((en) => { vis = en[0].isIntersecting; if (vis) kick(); }).observe(host);
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { layout(); if (reduce) draw(still, 0, 1); }, 120); });
  addEventListener('load', () => { layout(); if (reduce) draw(still, 0, 1); });
  cv.addEventListener('webglcontextlost', (e) => { e.preventDefault(); host.classList.remove('gl-on'); host.classList.add('gl-no'); vis = false; });
}

/* ---------------- scenes ---------------- */
const SCENES = {
  /* Social Media: phone with the brand page, posts float out and orbit as you scroll */
  social(K) {
    const { root } = K;
    const scr = ctex(512, 1050, (X, w, h) => {
      X.fillStyle = '#0a1122'; X.fillRect(0, 0, w, h);
      X.fillStyle = grad(X, 0, 0, 80, 80, GRADS[0]); X.beginPath(); X.arc(86, 150, 52, 0, 7); X.fill();
      X.font = HEAD(36); X.fillStyle = '#fff'; X.fillText('yourbrand', 160, 140); bars(X, 160, 158, [150], 12, 'rgba(160,185,230,.45)');
      rr(X, 34, 230, w - 68, 64, 18); X.fillStyle = '#2f7bff'; X.fill(); X.font = BODY(28, 700); X.fillStyle = '#fff'; X.fillText('Follow', w / 2 - 44, 272);
      const s = (w - 68 - 12) / 3; for (let i = 0; i < 9; i++) art(X, 34 + (i % 3) * (s + 6), 330 + Math.floor(i / 3) * (s + 6), s, s, i);
    });
    const ph = phone(scr); root.add(ph);
    const posts = []; const labels = [null, 'New in', null, 'Top 3 tips', null];
    for (let i = 0; i < 5; i++) { const c = card(0.78, 0.94, postTex(i, labels[i])); c.userData.a = (i / 5) * Math.PI * 2 + 0.4; c.userData.y = [0.65, -0.35, 0.2, -0.75, 0.9][i]; root.add(c); posts.push(c); }
    const like = chip('New DM · replied', { fs: 34, h: 0.17 }); like.position.set(0.9, -0.95, 0.5); root.add(like);
    return { W: 4.6, H: 3.1, update(p, t, e) {
      ph.rotation.y = -0.35 + p * 0.8 + Math.sin(t * 0.5) * 0.04; ph.rotation.x = 0.05 - p * 0.1; ph.position.y = Math.sin(t * 0.7) * 0.03;
      const R = (1.25 + p * 0.55) * e;
      posts.forEach((c, i) => { const a = c.userData.a + p * 1.4 + t * 0.06; c.position.set(Math.cos(a) * R * 1.15, c.userData.y * (0.8 + p * 0.3) + Math.sin(t * 0.8 + i) * 0.04, Math.sin(a) * R * 0.55);
        c.rotation.set(0, -Math.cos(a) * 0.35, Math.sin(a + i) * 0.05); const s = (0.85 + 0.15 * Math.sin(a)) * e; c.scale.set(s, s, s); });
      like.material.opacity = sm(0.1, 0.4, p) * e; like.position.y = -0.95 + p * 0.3;
    } };
  },
  /* Content Creation: a neat stack of finished posts fans out into a full month */
  content(K) {
    const labels = ['New in', null, 'Reel', 'Top 3 tips', null, 'This week', null];
    const cs = labels.map((l, i) => { const c = card(1.25, 1.52, l === 'Reel' ? reelTex(i) : postTex(i, l)); K.root.add(c); return c; });
    const mid = (cs.length - 1) / 2;
    return { W: 5.2, H: 2.6, still: 0.6, update(p, t, e) {
      const f = sm(0.0, 0.75, p) * 0.85 + 0.15 * e;
      cs.forEach((c, i) => { const d = i - mid; c.position.set(d * 0.62 * f, -Math.abs(d) * 0.1 * f + Math.sin(t * 0.6 + i) * 0.02, -Math.abs(d) * 0.12 * f - i * 0.02 + (1 - f) * -i * 0.04);
        c.rotation.set(-0.08 + 0.08 * f, -d * 0.12 * f, -d * 0.12 * f + (1 - f) * (i % 2 ? 0.05 : -0.05)); });
      K.root.rotation.y = Math.sin(t * 0.3) * 0.05; K.root.rotation.x = 0.1 - p * 0.1;
    } };
  },
  /* Meta Ads: one ad card explodes into the layers that target it */
  meta(K) {
    const L = [
      ['Your ad', (X, w, h) => { art(X, 40, 110, w - 80, 360, 1); X.font = HEAD(40); X.fillStyle = '#fff'; X.fillText('20% off this week', 44, 540); rr(X, 44, 580, 280, 70, 35); X.fillStyle = '#2f7bff'; X.fill(); X.font = BODY(28, 700); X.fillStyle = '#fff'; X.fillText('Send message', 76, 625); }],
      ['Creative', (X, w) => { for (let i = 0; i < 3; i++) art(X, 44 + i * 150, 150, 130, 160, i + 2); bars(X, 44, 360, [380, 300, 340], 16, 'rgba(160,185,230,.4)'); }],
      ['Audience', (X) => { for (let i = 0; i < 9; i++) { const x = 90 + (i % 3) * 150, y = 170 + Math.floor(i / 3) * 150; X.fillStyle = i === 4 ? '#5aa2ff' : 'rgba(160,185,230,.45)'; X.beginPath(); X.arc(x, y, 26, 0, 7); X.fill(); X.beginPath(); X.arc(x, y + 76, 44, Math.PI, 0); X.fill(); } }],
      ['Interests', (X) => { ['Food', 'Fashion', 'Home', 'Beauty', 'Tech', 'Travel'].forEach((s, i) => { const x = 44 + (i % 2) * 230, y = 150 + Math.floor(i / 2) * 110; rr(X, x, y, 210, 76, 38); X.fillStyle = i % 3 === 0 ? '#2f7bff' : 'rgba(90,162,255,.16)'; X.fill(); X.font = BODY(30, 700); X.fillStyle = '#fff'; X.fillText(s, x + 30, y + 49); }); }],
      ['Location: Lahore', (X, w) => { X.strokeStyle = 'rgba(90,162,255,.5)'; X.lineWidth = 3; for (let r = 60; r < 300; r += 70) { X.beginPath(); X.arc(w / 2, 380, r, 0, 7); X.stroke(); } X.fillStyle = '#5aa2ff'; X.beginPath(); X.arc(w / 2, 340, 34, Math.PI, 0); X.lineTo(w / 2, 420); X.closePath(); X.fill(); X.fillStyle = '#060a14'; X.beginPath(); X.arc(w / 2, 340, 13, 0, 7); X.fill(); }]
    ];
    const layers = L.map(([lab, draw], i) => {
      const t = ctex(540, 700, (X, w, h) => { rr(X, 3, 3, w - 6, h - 6, 36); X.fillStyle = i ? 'rgba(13,22,43,.9)' : '#0d162b'; X.fill(); X.lineWidth = 3; X.strokeStyle = i ? 'rgba(90,162,255,.55)' : 'rgba(120,180,255,.35)'; X.stroke();
        X.font = BODY(26, 700); const tw = X.measureText(lab).width; rr(X, 36, 34, tw + 40, 50, 25); X.fillStyle = i ? 'rgba(47,123,255,.25)' : 'rgba(255,255,255,.08)'; X.fill(); X.fillStyle = '#cfe2ff'; X.fillText(lab, 56, 68); draw(X, w, h); });
      const m = face(1.5, 1.95, 0.12, t, { side: THREE.DoubleSide, depthWrite: false }); K.root.add(m); return m;
    });
    return { W: 4.4, H: 2.8, still: 0.7, update(p, t, e) {
      const f = sm(0.02, 0.8, p);
      layers.forEach((m, i) => { m.position.set(i * 0.16 * f, i * 0.04 * f + Math.sin(t * 0.7 + i) * 0.015 * f, -i * (0.025 + 0.55 * f)); m.renderOrder = 10 - i; m.material.opacity = 1 - i * 0.06 * f; });
      K.root.rotation.y = -0.15 - 0.85 * f + Math.sin(t * 0.4) * 0.03; K.root.rotation.x = 0.06 + 0.12 * f; K.root.position.x = f * 0.5;
    } };
  },
  /* Google Ads: a search result stack — your business rises to the top */
  google(K) {
    const sb = card(2.7, 0.38, ctex(1080, 152, (X, w, h) => { rr(X, 0, 0, w, h, 76); X.fillStyle = '#eef4ff'; X.fill(); X.strokeStyle = '#2f7bff'; X.lineWidth = 6; X.beginPath(); X.arc(80, 70, 24, 0, 7); X.stroke(); X.beginPath(); X.moveTo(98, 88); X.lineTo(116, 106); X.stroke(); X.font = BODY(46, 600); X.fillStyle = '#0b1428'; X.fillText('cake shop in lahore', 150, 92); X.fillStyle = '#2f7bff'; X.fillRect(600, 50, 4, 52); }));
    K.root.add(sb); sb.position.y = 1.15;
    const res = ['competitor.pk', 'directory.com', 'yourbusiness.com'].map((u, i) => {
      const me = i === 2; const c = card(2.7, 0.52, ctex(1080, 208, (X, w, h) => { rr(X, 3, 3, w - 6, h - 6, 30); X.fillStyle = me ? '#0f2350' : C.card; X.fill(); if (me) { X.lineWidth = 5; X.strokeStyle = '#5aa2ff'; X.stroke(); }
        X.font = BODY(30, 700); X.fillStyle = me ? '#7fd0ff' : 'rgba(160,185,230,.7)'; X.fillText(u, 40, 58); if (me) { rr(X, w - 170, 30, 130, 44, 22); X.fillStyle = '#2f7bff'; X.fill(); X.font = BODY(24, 700); X.fillStyle = '#fff'; X.fillText('Top', w - 128, 60); }
        bars(X, 40, 92, [me ? 640 : 520], 22, me ? '#eaf2ff' : 'rgba(234,242,255,.45)'); bars(X, 40, 150, [860], 13, 'rgba(160,185,230,.3)'); }));
      K.root.add(c); return c; });
    const g = glow(C.blue2, 2.6, 0); K.root.add(g);
    const slot = (k) => 0.5 - k * 0.66;
    return { W: 3.6, H: 3.2, still: 0.8, update(p, t, e) {
      const f = sm(0.08, 0.7, p);
      res[2].position.set(0, lerp(slot(2), slot(0), f), 0.05 + Math.sin(f * Math.PI) * 0.5); res[2].rotation.x = -Math.sin(f * Math.PI) * 0.15;
      res[0].position.set(0, lerp(slot(0), slot(1), f), 0); res[1].position.set(0, lerp(slot(1), slot(2), f), 0);
      res.forEach((c, i) => { c.position.y += Math.sin(t * 0.8 + i) * 0.012; });
      g.position.copy(res[2].position); g.position.z -= 0.2; g.material.opacity = 0.35 * f;
      K.root.rotation.x = -0.32 + 0.22 * f; K.root.rotation.y = 0.28 - 0.4 * p + Math.sin(t * 0.3) * 0.03;
    } };
  },
  /* SEO: ranking bars rise on a city grid, the map pin lands on the top one */
  seo(K) {
    const { root } = K, grid = new THREE.GridHelper(6, 24, 0x2f7bff, 0x1c3a77); grid.material.transparent = true; grid.material.opacity = 0.35; root.add(grid);
    const geo = new THREE.BoxGeometry(0.34, 1, 0.34); geo.translate(0, 0.5, 0);
    const H0 = [0.45, 0.7, 0.6, 0.95, 1.25, 1.85], bs = H0.map((h, i) => { const m = new THREE.Mesh(geo, i === 5 ? M.blue() : new THREE.MeshStandardMaterial({ color: 0x1b2d58, metalness: 0.3, roughness: 0.4, emissive: 0x050d20 })); m.position.x = -1.5 + i * 0.6; root.add(m); return m; });
    const pin = new THREE.Group(), pm = new THREE.MeshStandardMaterial({ color: 0x7fd0ff, emissive: 0x2f7bff, emissiveIntensity: 0.6, roughness: 0.25 });
    const hd = new THREE.Mesh(new THREE.SphereGeometry(0.2, 32, 16), pm), cn = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.42, 32), pm); cn.rotation.x = Math.PI; cn.position.y = -0.25; pin.add(hd, cn); root.add(pin);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.22, 0.26, 48), M.glow(C.cyan, 0.8)); ring.rotation.x = -Math.PI / 2; root.add(ring);
    const pg = glow(C.cyan, 1.4, 0.5); pin.add(pg);
    const lab = chip('Page 1', { fs: 36, h: 0.2 }); root.add(lab);
    root.position.y = -0.85;
    return { W: 4.6, H: 3.0, camY: 1.1, still: 0.75, update(p, t, e) {
      const f = 0.2 + 0.8 * sm(0, 0.75, p);
      bs.forEach((b, i) => { b.scale.y = Math.max(0.02, H0[i] * (i === 5 ? f : 0.5 + 0.5 * f) * e); });
      const top = bs[5].scale.y, x = bs[5].position.x;
      pin.position.set(x, top + 0.6 + Math.abs(Math.sin(t * 2)) * 0.12 + (1 - e) * 1.5, 0); pin.rotation.y = t * 0.8;
      ring.position.set(x, 0.01, 0); const rs = 1 + ((t * 0.8) % 1) * 2.5; ring.scale.set(rs, rs, rs); ring.material.opacity = 0.8 * (1 - ((t * 0.8) % 1));
      lab.position.set(x - 0.95, top + 0.05, 0.3); lab.material.opacity = sm(0.3, 0.6, p);
      root.rotation.y = -0.55 + p * 0.5 + Math.sin(t * 0.25) * 0.04;
    } };
  },
  /* Websites: a laptop assembles from its parts while the page sections fly onto the screen */
  web(K) {
    const { root } = K;
    const base = new THREE.Group(), bm = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.08, 1.8), M.metal()); base.add(bm);
    const kb = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 1.0), new THREE.MeshBasicMaterial({ map: ctex(1000, 400, (X, w, h) => { X.fillStyle = '#0a1122'; X.fillRect(0, 0, w, h); for (let r = 0; r < 5; r++) for (let c = 0; c < 14; c++) { rr(X, 14 + c * 70.5, 14 + r * 76, 60, 64, 10); X.fillStyle = '#16244a'; X.fill(); } }), transparent: true }));
    kb.rotation.x = -Math.PI / 2; kb.position.set(0, 0.042, -0.25); base.add(kb);
    const tp = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.5), new THREE.MeshBasicMaterial({ color: 0x14213f })); tp.rotation.x = -Math.PI / 2; tp.position.set(0, 0.042, 0.55); base.add(tp);
    root.add(base);
    const hinge = new THREE.Group(); hinge.position.set(0, 0.04, -0.9); root.add(hinge);
    const lid = slab(2.8, 1.8, 0.04, 0.08, M.metal()); lid.position.y = 0.9; hinge.add(lid);
    const scr = face(2.62, 1.64, 0.05, ctex(1048, 656, (X, w, h) => { X.fillStyle = '#0b1530'; X.fillRect(0, 0, w, h); X.fillStyle = '#122045'; X.fillRect(0, 0, w, 64); X.fillStyle = '#5aa2ff'; X.beginPath(); X.arc(44, 32, 14, 0, 7); X.fill(); bars(X, 640, 26, [70], 12, 'rgba(234,242,255,.5)'); bars(X, 730, 26, [70], 12, 'rgba(234,242,255,.5)'); rr(X, 860, 16, 150, 34, 17); X.fillStyle = '#2f7bff'; X.fill(); }));
    scr.position.set(0, 0.9, lid.userData.front + 0.003); hinge.add(scr);
    const Z = lid.userData.front + 0.01;
    const tiles = [
      [ctex(560, 300, (X) => { X.font = HEAD(64); X.fillStyle = '#fff'; X.fillText('Your business,', 0, 70); X.fillStyle = '#5aa2ff'; X.fillText('online.', 0, 150); bars(X, 0, 190, [420, 340], 16, 'rgba(160,185,230,.55)'); rr(X, 0, 250, 200, 48, 24); X.fillStyle = '#2f7bff'; X.fill(); }), 1.2, 0.64, -0.55, 1.15],
      [ctex(400, 300, (X) => art(X, 0, 0, 400, 300, 0)), 0.9, 0.68, 0.72, 1.15],
      [ctex(300, 200, (X) => { rr(X, 0, 0, 300, 200, 20); X.fillStyle = '#16264f'; X.fill(); art(X, 16, 16, 268, 110, 2); bars(X, 16, 146, [180], 14, 'rgba(234,242,255,.5)'); }), 0.66, 0.44, -0.8, 0.42],
      [ctex(300, 200, (X) => { rr(X, 0, 0, 300, 200, 20); X.fillStyle = '#16264f'; X.fill(); art(X, 16, 16, 268, 110, 3); bars(X, 16, 146, [150], 14, 'rgba(234,242,255,.5)'); }), 0.66, 0.44, 0, 0.42],
      [ctex(300, 200, (X) => { rr(X, 0, 0, 300, 200, 20); X.fillStyle = '#16264f'; X.fill(); art(X, 16, 16, 268, 110, 4); bars(X, 16, 146, [200], 14, 'rgba(234,242,255,.5)'); }), 0.66, 0.44, 0.8, 0.42]
    ].map(([tx, w, h, x, y], i) => { const m = face(w, h, 0.03, tx); m.userData.to = new THREE.Vector3(x, y, Z); m.userData.from = new THREE.Vector3(x * 1.7 + (i % 2 ? 0.3 : -0.3), y + 0.5 + i * 0.1, Z + 1.1 + i * 0.18); hinge.add(m); return m; });
    root.position.y = -0.7;
    return { W: 4.3, H: 3.3, camY: 0.9, still: 0.85, update(p, t, e) {
      const f = sm(0.0, 0.8, p) * 0.88 + 0.12 * e, g = 1 - f;
      base.position.set(0, -g * 0.6, g * 0.3); base.rotation.x = g * 0.35;
      hinge.position.set(0, 0.04 + g * 0.7, -0.9 - g * 0.5); hinge.rotation.x = -0.22 - g * 0.3;
      tiles.forEach((m, i) => { const k = sm(i * 0.08, 0.6 + i * 0.08, f); m.position.lerpVectors(m.userData.from, m.userData.to, k); m.position.y += Math.sin(t + i) * 0.03 * (1 - k); m.rotation.set((1 - k) * 0.3, (1 - k) * (i % 2 ? 0.4 : -0.4), 0); });
      root.rotation.y = -0.55 + f * 0.45 + Math.sin(t * 0.3) * 0.03; root.rotation.x = 0.08;
    } };
  },
  /* Video Editing: a 3D film strip runs past the playhead as you scroll */
  video(K) {
    const N = 13, fr = [], strip = (i) => ctex(440, 320, (X, w, h) => { X.fillStyle = '#05070d'; X.fillRect(0, 0, w, h); X.fillStyle = 'rgba(234,242,255,.75)'; for (let k = 0; k < 7; k++) { rr(X, 18 + k * 62, 12, 30, 22, 5); X.fill(); rr(X, 18 + k * 62, h - 34, 30, 22, 5); X.fill(); } art(X, 18, 48, w - 36, h - 96, i); });
    const geo = new THREE.PlaneGeometry(1.1, 0.8);
    for (let i = 0; i < N; i++) { const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: strip(i), side: THREE.DoubleSide, transparent: true })); K.root.add(m); fr.push(m); }
    const curve = new THREE.CatmullRomCurve3([[-4.2, -0.4, -1.6], [-2.2, 0.3, -0.2], [0, 0, 0.6], [2.2, -0.3, -0.2], [4.2, 0.4, -1.6]].map((a) => new THREE.Vector3(...a)));
    const head = new THREE.Mesh(new THREE.PlaneGeometry(0.025, 1.3), M.glow(C.cyan, 0.9)); head.position.z = 0.75; K.root.add(head);
    const hg = glow(C.cyan, 1.8, 0.35); hg.position.z = 0.7; K.root.add(hg);
    const tri = chip('▶  Hook in 3 seconds', { fs: 34, h: 0.18 }); tri.position.set(0, -0.72, 0.9); K.root.add(tri);
    const v = new THREE.Vector3();
    return { W: 5.2, H: 2.4, update(p, t, e) {
      const off = p * 0.55 + t * 0.012;
      fr.forEach((m, i) => { const u = ((i / N + off) % 1 + 1) % 1; curve.getPointAt(u, m.position); curve.getTangentAt(u, v); m.rotation.set(0, -Math.atan2(v.z, v.x) * 0.9, 0);
        const c = 1 - Math.min(1, Math.abs(u - 0.5) * 3); const s = (0.9 + 0.25 * c) * e; m.scale.set(s, s, s); m.material.opacity = sm(0, 0.12, u) * (1 - sm(0.88, 1, u)); });
      tri.material.opacity = sm(0.05, 0.3, p) * e; K.root.rotation.x = 0.12 - p * 0.15;
    } };
  },
  /* AI Chatbots: customer questions and bot answers orbit the phone, then land in the chat */
  ai(K) {
    const scr = ctex(512, 1050, (X, w, h) => { X.fillStyle = '#0a1122'; X.fillRect(0, 0, w, h); X.fillStyle = '#122045'; X.fillRect(0, 0, w, 150); X.fillStyle = '#2f7bff'; X.beginPath(); X.arc(80, 95, 34, 0, 7); X.fill(); X.font = HEAD(34); X.fillStyle = '#fff'; X.fillText('Your business', 132, 92); X.fillStyle = '#2bd47f'; X.beginPath(); X.arc(140, 120, 8, 0, 7); X.fill(); X.font = BODY(22, 600); X.fillStyle = 'rgba(200,220,255,.7)'; X.fillText('online now', 156, 128);
      [[1, 200, 300], [0, 290, 340], [1, 380, 260], [0, 470, 330]].forEach(([me, y, bw]) => { rr(X, me ? w - 40 - bw : 40, y, bw, 64, 30); X.fillStyle = me ? '#eef4ff' : '#2f7bff'; X.fill(); });
      [0, 1, 2].forEach((k) => { X.fillStyle = 'rgba(234,242,255,.6)'; X.beginPath(); X.arc(80 + k * 30, 600, 9, 0, 7); X.fill(); }); });
    const ph = phone(scr, 1.0, 2.05); K.root.add(ph);
    const msgs = [['Kal shaam ka slot hai?', 1], ['Ji, 6 baje khali hai.', 0], ['Delivery Lahore mein?', 1], ['Ji, ghar tak.', 0], ['Book kar dun?', 0], ['Yes please!', 1]];
    const bub = msgs.map(([s, me], i) => { const t = bubbleTex(s, me), h = 0.22, m = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false })); m.scale.set(h * t.userData.aspect, h, 1); m.userData = { a: (i / msgs.length) * Math.PI * 2, y: (i % 3 - 1) * 0.45, sx: h * t.userData.aspect }; K.root.add(m); return m; });
    const g = glow(C.blue, 3, 0.25); g.position.z = -0.4; K.root.add(g);
    return { W: 4.6, H: 2.8, update(p, t, e) {
      ph.rotation.y = 0.3 - p * 0.6 + Math.sin(t * 0.5) * 0.04; ph.position.y = Math.sin(t * 0.7) * 0.03;
      const R = (1.75 - p * 0.45) * e;
      bub.forEach((m, i) => { const a = m.userData.a + p * Math.PI * 0.9 + t * 0.12; m.position.set(Math.cos(a) * R, m.userData.y + Math.sin(a) * 0.18, Math.sin(a) * R * 0.6);
        const front = 0.55 + 0.45 * (Math.sin(a) * 0.5 + 0.5); m.material.opacity = front * e; const s = 0.85 + 0.2 * front; m.scale.set(m.userData.sx * s, 0.22 * s, 1); });
    } };
  },
  /* Lead Generation: a glass funnel — many views fall in, a few real leads come out */
  lead(K) {
    const top = 1.25, bot = -1.15, rAt = (rf) => 0.14 + 1.05 * Math.pow(rf, 1.4), pts = [];
    for (let k = 0; k <= 24; k++) { const rf = k / 24; pts.push(new THREE.Vector2(rAt(rf), lerp(bot, top, rf))); }
    const fn = new THREE.Mesh(new THREE.LatheGeometry(pts, 64), new THREE.MeshStandardMaterial({ color: 0x2f7bff, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false, metalness: 0.2, roughness: 0.2, emissive: 0x0a1f55 }));
    K.root.add(fn);
    const names = ['Views', 'Clicks', 'Leads', 'Sales'], labs = [];
    names.forEach((n, i) => { const rf = 1 - i / 3 * 0.92, y = lerp(bot, top, rf), r = rAt(rf);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.01, 8, 96), M.glow(i === 3 ? C.cyan : C.blue2, 0.85)); ring.rotation.x = Math.PI / 2; ring.position.y = y; K.root.add(ring);
      const l = chip(n, { fs: 34, h: 0.2, bg: i === 3 ? 'rgba(47,123,255,.9)' : undefined }); l.position.set(r + 0.45, y, 0); K.root.add(l); labs.push(l); });
    const n = K.mobile ? 420 : 900, seed = new Float32Array(n), pp = new Float32Array(n * 3); for (let i = 0; i < n; i++) seed[i] = Math.random();
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pp, 3)); g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1)); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 10);
    const U = { uT: { value: 0 }, uP: { value: 0 }, uPR: { value: K.renderer.getPixelRatio() } };
    const mat = new THREE.ShaderMaterial({ uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `attribute float aSeed; uniform float uT,uP,uPR; varying float vA; varying float vB;
        void main(){ float s=fract(aSeed*7.13+uT*0.06+uP*0.6); float top=${top.toFixed(2)}, bot=${bot.toFixed(2)};
          float y=mix(top+0.9,bot-0.5,s); float rf=clamp((y-bot)/(top-bot),0.,1.); float k=0.25+0.7*fract(aSeed*91.7);
          float r=(0.14+1.05*pow(rf,1.4))*k; if(y>top) r=1.19*k+(y-top)*1.6*fract(aSeed*13.3); float ang=aSeed*628.3+s*5.0;
          vec3 p=vec3(cos(ang)*r,y,sin(ang)*r); float keep=mix(1.0,0.07,1.0-smoothstep(bot,top,y));
          vA=step(fract(aSeed*53.1),keep)*smoothstep(0.,0.06,s)*(1.-smoothstep(0.93,1.,s)); vB=1.0-rf;
          vec4 mv=modelViewMatrix*vec4(p,1.); gl_Position=projectionMatrix*mv; gl_PointSize=uPR*(2.0+4.0*vB)*(7.0/-mv.z); }`,
      fragmentShader: `varying float vA; varying float vB; void main(){ vec2 d=gl_PointCoord-.5; float a=smoothstep(.5,.15,length(d))*vA; if(a<.01) discard; gl_FragColor=vec4(mix(vec3(.35,.6,1.),vec3(.75,.95,1.),vB),a); }` });
    K.root.add(new THREE.Points(g, mat));
    const out = glow(C.cyan, 1.2, 0.6); out.position.y = bot - 0.15; K.root.add(out);
    return { W: 3.8, H: 3.2, still: 0.5, update(p, t, e) {
      U.uT.value = t; U.uP.value = p; U.uPR.value = K.renderer.getPixelRatio();
      K.root.rotation.y = t * 0.05; K.root.rotation.x = 0.28 - p * 0.18;
      labs.forEach((l, i) => { l.material.opacity = sm(i * 0.12, i * 0.12 + 0.25, p + 0.15) * e; });
      out.material.opacity = 0.4 + 0.25 * Math.sin(t * 3);
    } };
  },
  /* Services: every service (from js/services.js) on a 3D carousel that turns with scroll */
  services(K) {
    const S = (window.NFX_SERVICES && window.NFX_SERVICES.length) ? window.NFX_SERVICES : [{ key: 'web', name: 'Services' }];
    const n = S.length, R = Math.max(2.0, n * 0.3), tiles = S.map((s, i) => {
      const c = card(1.15, 1.4, ctex(460, 560, (X, w, h) => { rr(X, 0, 0, w, h, 40); X.fillStyle = C.card; X.fill(); X.fillStyle = 'rgba(47,123,255,.14)'; rr(X, 30, 30, w - 60, 320, 28); X.fill(); icon(X, s.key, w / 2, 190, 120); X.font = HEAD(44); X.fillStyle = '#fff'; wrap(X, s.name, 40, 430, w - 80, 52); }));
      c.userData.a = (i / n) * Math.PI * 2; K.root.add(c); return c; });
    return { W: R * 2 + 1.6, H: 2.6, Wm: 0.6, camY: 0.35, still: 0.0, update(p, t, e) {
      const rot = -p * Math.PI * 1.1 - t * 0.04;
      tiles.forEach((c) => { const a = c.userData.a + rot; c.position.set(Math.sin(a) * R, 0, Math.cos(a) * R - R * 0.55); c.rotation.y = a; const f = Math.cos(a) * 0.5 + 0.5; const s = (0.75 + 0.3 * f) * e; c.scale.set(s, s, s); c.userData.face.material.opacity = 0.35 + 0.65 * f; });
    } };
  },
  /* Work: real website screenshots float as screens in an arc */
  work(K) {
    const imgs = Array.from(document.querySelectorAll('#websites .browser img')).map((i) => i.getAttribute('src')).slice(0, 6);
    if (!imgs.length) imgs.push('/assets/img/work/site-mtech.jpg');
    const L = new THREE.TextureLoader(), n = imgs.length, scr = imgs.map((src, i) => {
      const g = new THREE.Group(), b = slab(2.0, 1.36, 0.04, 0.07, M.body()); g.add(b);
      const bar = face(1.94, 0.1, 0.03, null, { mat: { color: 0x16244a } }); bar.position.set(0, 0.6, b.userData.front + 0.002); g.add(bar);
      const tx = L.load(src); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 4;
      const f = new THREE.Mesh(new THREE.PlaneGeometry(1.94, 1.2), new THREE.MeshBasicMaterial({ map: tx, transparent: true })); f.position.set(0, -0.06, b.userData.front + 0.002); g.add(f);
      g.userData = { a: (i - (n - 1) / 2), f }; K.root.add(g); return g; });
    return { W: 5.6, H: 2.6, still: 0.4, update(p, t, e) {
      const shift = (p - 0.4) * (n - 1) * 0.9;
      scr.forEach((g, i) => { const k = g.userData.a - shift, a = k * 0.5; g.position.set(Math.sin(a) * 3.2, Math.sin(t * 0.6 + i) * 0.05 - Math.abs(k) * 0.08, Math.cos(a) * 3.2 - 3.0); g.rotation.y = a * 0.9;
        const c = Math.max(0, 1 - Math.abs(k) * 0.45), s = (0.7 + 0.35 * c) * e; g.scale.set(s, s, s); g.userData.f.material.opacity = 0.35 + 0.65 * c; });
    } };
  },
  /* About: the dotted world turns to Lahore, the pin lights up and lines reach out */
  about(K) {
    const LAND = window.NFX_LAND, D = Math.PI / 180, vec = (la, lo, r = 1) => new THREE.Vector3(Math.cos(la * D) * Math.sin(lo * D) * r, Math.sin(la * D) * r, Math.cos(la * D) * Math.cos(lo * D) * r);
    const pts = []; if (LAND && LAND.length) { for (let i = 0; i < LAND.length; i += 2) { const v = vec(LAND[i], LAND[i + 1]); pts.push(v.x, v.y, v.z); } }
    else { const n = 2400, ga = Math.PI * (3 - Math.sqrt(5)); for (let j = 0; j < n; j++) { const y = 1 - (j / (n - 1)) * 2, r = Math.sqrt(1 - y * y); pts.push(Math.cos(ga * j) * r, y, Math.sin(ga * j) * r); } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    const U = { uPR: { value: K.renderer.getPixelRatio() } };
    const globe = new THREE.Group(); K.root.add(globe);
    globe.add(new THREE.Points(g, new THREE.ShaderMaterial({ uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `uniform float uPR; varying float vF; void main(){ vec4 wp=modelMatrix*vec4(position,1.); vec3 n=normalize(mat3(modelMatrix)*position); vF=dot(n,normalize(cameraPosition-wp.xyz)); vec4 mv=viewMatrix*wp; gl_Position=projectionMatrix*mv; gl_PointSize=uPR*2.4*(5.0/-mv.z); }`,
      fragmentShader: `varying float vF; void main(){ float a=smoothstep(.5,.1,length(gl_PointCoord-.5))*mix(.07,1.,smoothstep(-.15,.45,vF)); gl_FragColor=vec4(mix(vec3(.2,.4,.95),vec3(.6,.85,1.),smoothstep(0.,1.,vF)),a); }` })));
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.985, 48, 32), new THREE.MeshStandardMaterial({ color: 0x07102a, roughness: 0.6, metalness: 0.2 })); globe.add(core);
    const H = { la: 31.55, lo: 74.34 }, hv = vec(H.la, H.lo, 1.0);
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.5, 6), M.glow(C.cyan, 0.9)); beam.position.copy(vec(H.la, H.lo, 1.25)); beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), hv.clone().normalize()); globe.add(beam);
    const hg = glow(C.cyan, 0.5, 0.9); hg.position.copy(vec(H.la, H.lo, 1.02)); globe.add(hg);
    const lab = chip('Lahore, Pakistan', { fs: 34, h: 0.15, depthTest: false }); globe.add(lab); lab.position.copy(vec(H.la, H.lo, 1.55));
    const arcs = [[25.2, 55.27], [51.5, -0.12], [40.71, -74], [1.35, 103.82], [24.71, 46.67], [-33.87, 151.2]].map(([la, lo]) => {
      const a = hv.clone(), b = vec(la, lo), m = a.clone().add(b).multiplyScalar(0.5).normalize().multiplyScalar(1 + a.distanceTo(b) * 0.45);
      const c = new THREE.QuadraticBezierCurve3(a, m, b), ge = new THREE.BufferGeometry().setFromPoints(c.getPoints(64));
      const l = new THREE.Line(ge, new THREE.LineBasicMaterial({ color: C.blue2, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending })); globe.add(l); return l; });
    const atm = glow(C.blue, 3.4, 0.45); atm.position.z = -0.3; K.root.add(atm);
    return { W: 3.0, H: 2.9, still: 0.8, update(p, t, e) {
      U.uPR.value = K.renderer.getPixelRatio();
      const f = sm(0, 0.8, p);
      globe.rotation.y = -H.lo * D + (1 - f) * 1.6 + Math.sin(t * 0.2) * 0.04; globe.rotation.x = H.la * D * f * 0.9;
      const s = (0.92 + 0.22 * f) * e; K.root.scale.set(s, s, s);
      arcs.forEach((l, i) => l.geometry.setDrawRange(0, Math.floor(65 * sm(0.3 + i * 0.06, 0.6 + i * 0.06, f + 0.08))));
      lab.material.opacity = sm(0.35, 0.65, f); beam.material.opacity = 0.4 + 0.5 * f;
    } };
  },
  /* Contact: a 3D message bubble — your hello, and our reply typing in */
  contact(K) {
    const sh = rrShape(2.1, 1.25, 0.32); sh.moveTo(-0.7, -0.62); sh.lineTo(-0.95, -0.98); sh.lineTo(-0.38, -0.62);
    const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.18, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 4, curveSegments: 16 }); geo.translate(0, 0, -0.09);
    const b = new THREE.Group(), m = new THREE.Mesh(geo, M.blue()); b.add(m);
    const tx = face(1.9, 1.0, 0.1, ctex(760, 400, (X) => { X.font = HEAD(64); X.fillStyle = '#fff'; X.fillText('Hi Navifex!', 40, 150); X.font = BODY(42, 600); X.fillStyle = 'rgba(234,242,255,.85)'; X.fillText('I want more customers.', 40, 240); }));
    tx.position.z = 0.16; b.add(tx); K.root.add(b);
    const rp = new THREE.Group(), rs = slab(1.1, 0.5, 0.1, 0.25, new THREE.MeshStandardMaterial({ color: 0xeef4ff, roughness: 0.3, metalness: 0.1 })); rp.add(rs);
    const dots = [0, 1, 2].map((i) => { const d = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 12), new THREE.MeshStandardMaterial({ color: 0x2f7bff, emissive: 0x2f7bff, emissiveIntensity: 0.4 })); d.position.set(-0.22 + i * 0.22, 0, rs.userData.front); rp.add(d); return d; });
    K.root.add(rp);
    return { W: 4.2, H: 2.8, still: 0.6, update(p, t, e) {
      const f = sm(0.05, 0.6, p);
      b.position.set(-0.35 * f, 0.25 * f + Math.sin(t * 0.8) * 0.04, 0); b.rotation.set(0.1 - 0.12 * f, -0.45 + 0.75 * p + Math.sin(t * 0.4) * 0.04, 0.03);
      const k = sm(0.2, 0.7, p) * 0.75 + 0.25 * e; rp.position.set(1.15, -0.85 + 0.15 * k, 0.4); rp.scale.setScalar(Math.max(0.001, k)); rp.rotation.y = -0.3 + 0.2 * p;
      dots.forEach((d, i) => { d.position.y = Math.max(0, Math.sin(t * 6 - i * 0.8)) * 0.06; });
    } };
  },
  /* Earn & Partner: a coin at the centre of a referral network; payments pulse back to you */
  coin(K) {
    const fx = ctex(512, 512, (X, w, h) => { const g = X.createRadialGradient(200, 180, 20, 256, 256, 260); g.addColorStop(0, '#ffe7a3'); g.addColorStop(0.6, '#e8b64a'); g.addColorStop(1, '#b8841f'); X.fillStyle = g; X.fillRect(0, 0, w, h);
      X.strokeStyle = 'rgba(120,80,10,.55)'; X.lineWidth = 10; X.beginPath(); X.arc(256, 256, 210, 0, 7); X.stroke(); X.font = HEAD(170, 800); X.fillStyle = '#7a520c'; X.textAlign = 'center'; X.fillText('Rs', 256, 300); X.font = BODY(34, 700); X.fillText('NAVIFEX', 256, 380); });
    const gm = new THREE.MeshStandardMaterial({ color: 0xe8b64a, metalness: 0.6, roughness: 0.28, emissive: 0x3a2400 }), fm = new THREE.MeshStandardMaterial({ map: fx, metalness: 0.45, roughness: 0.3 });
    const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.13, 72), [gm, fm, fm]); coin.rotation.x = Math.PI / 2; const cw = new THREE.Group(); cw.add(coin); K.root.add(cw);
    const cg = glow(0xffc35a, 2.6, 0.3); cg.position.z = -0.3; K.root.add(cg);
    const net = new THREE.Group(); net.position.z = -0.6; K.root.add(net);
    const nodeM = new THREE.MeshStandardMaterial({ color: 0x5aa2ff, emissive: 0x2f7bff, emissiveIntensity: 0.5 }), nodeG = new THREE.SphereGeometry(0.07, 16, 12);
    const rings = [[6, 1.55], [12, 2.5]], nodes = [], lines = [], pulses = [];
    rings.forEach(([n, r], ri) => { for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + ri * 0.26, v = new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r * 0.62, 0);
      const m = new THREE.Mesh(nodeG, nodeM); m.position.copy(v); m.userData.ri = ri; net.add(m); nodes.push(m);
      const from = ri ? nodes[Math.floor(i / 2)].position : new THREE.Vector3();
      const lg = new THREE.BufferGeometry().setFromPoints([from.clone(), v.clone()]), l = new THREE.Line(lg, new THREE.LineBasicMaterial({ color: C.blue2, transparent: true, opacity: 0.5 })); l.userData.ri = ri; net.add(l); lines.push(l);
      const pu = glow(0xffd36e, 0.22, 0.9); pu.userData = { a: v.clone(), b: from.clone(), o: Math.random(), ri }; net.add(pu); pulses.push(pu); } });
    return { W: 5.6, H: 3.3, still: 0.75, update(p, t, e) {
      cw.rotation.y = p * Math.PI * 1.0 + Math.sin(t * 0.6) * 0.15; cw.position.y = Math.sin(t * 0.8) * 0.04;
      const r0 = sm(0.0, 0.35, p) * 0.75 + 0.25 * e, r1 = sm(0.3, 0.7, p);
      nodes.forEach((m) => m.scale.setScalar(Math.max(0.001, m.userData.ri ? r1 : r0)));
      lines.forEach((l) => { l.material.opacity = 0.5 * (l.userData.ri ? r1 : r0); });
      pulses.forEach((pu) => { const k = (t * 0.35 + pu.userData.o) % 1, vis = pu.userData.ri ? r1 : r0; pu.position.lerpVectors(pu.userData.a, pu.userData.b, k); pu.material.opacity = 0.9 * vis * Math.sin(k * Math.PI); });
      net.rotation.x = 0.35 - p * 0.2; net.rotation.z = t * 0.02;
    } };
  },
  /* Process & partner courses: a path of steps, the light moves along it with scroll */
  path(K) {
    const els = Array.from(document.querySelectorAll('.steps .step h3, .pc-lesson .pc-n'));
    const names = els.length ? els.map((e) => e.textContent.trim()) : ['01', '02', '03', '04', '05'];
    const n = names.length, P = [];
    for (let i = 0; i < n; i++) { const u = n > 1 ? i / (n - 1) : 0.5; P.push(new THREE.Vector3((u - 0.5) * 5.4, Math.sin(u * Math.PI * 2) * 0.25, -Math.sin(u * Math.PI * 2 + 0.6) * 1.0)); }
    const curve = new THREE.CatmullRomCurve3(P), TS = 160, RS = 8;
    K.root.add(new THREE.Mesh(new THREE.TubeGeometry(curve, TS, 0.012, RS), new THREE.MeshBasicMaterial({ color: 0x1c3a77 })));
    const lit = new THREE.Mesh(new THREE.TubeGeometry(curve, TS, 0.022, RS), M.glow(C.cyan, 1)); K.root.add(lit);
    const ringM = () => new THREE.MeshStandardMaterial({ color: 0x1b2d58, emissive: 0x2f7bff, emissiveIntensity: 0.1, metalness: 0.4, roughness: 0.3 });
    const nodes = P.map((v, i) => { const m = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.035, 12, 40), ringM()); m.position.copy(v); K.root.add(m);
      const l = chip(names[i], { fs: 34, h: n > 6 ? 0.16 : 0.2 }); l.position.copy(v).add(new THREE.Vector3(0, 0.42, 0)); K.root.add(l); m.userData.l = l; return m; });
    const orb = new THREE.Group(); orb.add(new THREE.Mesh(new THREE.SphereGeometry(0.07, 20, 14), new THREE.MeshBasicMaterial({ color: 0xeaf6ff }))); orb.add(glow(C.cyan, 0.9, 0.9)); K.root.add(orb);
    return { W: 6.2, H: 2.4, camY: 1.1, still: 1, update(p, t, e) {
      const f = clamp(sm(0.0, 0.9, p) * 0.94 + 0.06 * e);
      lit.geometry.setDrawRange(0, Math.floor(f * TS) * RS * 6); curve.getPointAt(f, orb.position);
      nodes.forEach((m, i) => { const on = f >= (n > 1 ? i / (n - 1) : 0) - 0.001; m.material.emissiveIntensity = lerp(m.material.emissiveIntensity, on ? 1.1 : 0.1, 0.15); m.rotation.y = t * 0.6 + i; m.userData.l.material.opacity = on ? 1 : 0.45; });
      K.root.rotation.y = Math.sin(t * 0.25) * 0.04;
    } };
  },
  /* Start form: the brief card fills itself in, field by field */
  form(K) {
    const F = ['Business name', 'What you sell', 'Who buys from you', 'Style you like', 'Your goal'];
    const c = card(2.2, 2.75, ctex(660, 825, (X, w, h) => { rr(X, 0, 0, w, h, 44); X.fillStyle = C.card; X.fill(); X.font = HEAD(44); X.fillStyle = '#fff'; X.fillText('Your brief', 44, 92);
      F.forEach((s, i) => { const y = 150 + i * 128; X.font = BODY(26, 700); X.fillStyle = 'rgba(200,220,255,.75)'; X.fillText(s, 44, y); rr(X, 44, y + 18, w - 88, 62, 18); X.fillStyle = '#0a1122'; X.fill(); X.strokeStyle = 'rgba(90,162,255,.3)'; X.lineWidth = 2; X.stroke(); }); }));
    K.root.add(c); const Z = 0.08, fills = F.map((s, i) => { const y = 1.375 - (150 + i * 128 + 49) / 825 * 2.75; const g = new THREE.Group(); g.position.set(-1.0 + 0.11, y, Z);
      const bar = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.12), new THREE.MeshBasicMaterial({ color: 0x2f7bff, transparent: true, opacity: 0.85 })); bar.geometry.translate(0.5, 0, 0); g.add(bar);
      const ck = chip('✓', { fs: 40, h: 0.18, bg: 'rgba(43,212,127,.95)', stroke: 'rgba(43,212,127,1)' }); ck.position.set(1.62, 0, 0.02); g.add(ck); c.add(g); return { bar, ck }; });
    const W0 = [0.9, 1.2, 1.05, 0.7, 1.15];
    return { W: 3.4, H: 3.3, still: 1, update(p, t, e) {
      fills.forEach((o, i) => { const k = sm(0.05 + i * 0.13, 0.18 + i * 0.13, p); o.bar.scale.x = Math.max(0.001, W0[i] * k); o.ck.material.opacity = sm(0.8, 1, k); });
      c.rotation.set(0.08 - p * 0.08, -0.4 + p * 0.55 + Math.sin(t * 0.4) * 0.03, 0.02); c.position.y = Math.sin(t * 0.7) * 0.03;
    } };
  },
  /* Privacy: a glass shield with a lock, data dots orbit safely around it (light) */
  privacy(K) {
    const s = new THREE.Shape(); s.moveTo(0, 1.05); s.bezierCurveTo(0.45, 0.85, 0.75, 0.88, 0.85, 0.82); s.bezierCurveTo(0.85, 0.1, 0.65, -0.55, 0, -1.0); s.bezierCurveTo(-0.65, -0.55, -0.85, 0.1, -0.85, 0.82); s.bezierCurveTo(-0.75, 0.88, -0.45, 0.85, 0, 1.05);
    const geo = new THREE.ExtrudeGeometry(s, { depth: 0.16, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 4, curveSegments: 20 }); geo.translate(0, 0, -0.08);
    const sh = new THREE.Group(); sh.add(new THREE.Mesh(geo, M.blue()));
    const lk = face(0.7, 0.8, 0.02, ctex(280, 320, (X) => { X.strokeStyle = '#eaf2ff'; X.lineWidth = 22; X.beginPath(); X.arc(140, 120, 58, Math.PI, 0); X.lineTo(198, 160); X.moveTo(82, 160); X.lineTo(82, 120); X.stroke(); rr(X, 50, 150, 180, 140, 26); X.fillStyle = '#eaf2ff'; X.fill(); X.fillStyle = '#2f7bff'; X.beginPath(); X.arc(140, 205, 18, 0, 7); X.fill(); X.fillRect(132, 210, 16, 40); }));
    lk.position.set(0, 0.02, 0.15); sh.add(lk); K.root.add(sh);
    const orb = dust(60, 0.1, 0.1, 0.1, 0.06, 0x7fd0ff); const P = orb.geometry.attributes.position; for (let i = 0; i < P.count; i++) { const a = (i / P.count) * Math.PI * 2; P.setXYZ(i, Math.cos(a) * 1.5, Math.sin(a * 3) * 0.08, Math.sin(a) * 1.5); } orb.rotation.x = 0.3; K.root.add(orb);
    return { W: 3.6, H: 2.7, update(p, t, e) { sh.rotation.y = -0.5 + p * 1.0 + Math.sin(t * 0.4) * 0.05; sh.position.y = Math.sin(t * 0.7) * 0.03; orb.rotation.y = t * 0.2 + p; } };
  },
  /* Terms: a short stack of pages that fans open as you scroll (light) */
  terms(K) {
    const pages = [0, 1, 2].map((i) => { const c = card(1.5, 1.95, ctex(450, 585, (X, w, h) => { rr(X, 0, 0, w, h, 30); X.fillStyle = i ? '#121e3d' : '#eef4ff'; X.fill(); const ink = i ? 'rgba(160,185,230,.35)' : 'rgba(11,20,40,.55)';
      bars(X, 40, 50, [240], 22, i ? 'rgba(234,242,255,.5)' : '#0b1428'); bars(X, 40, 120, [370, 340, 360, 300, 350, 370, 220], 12, ink); if (!i) { X.strokeStyle = '#2f7bff'; X.lineWidth = 6; X.beginPath(); X.moveTo(40, 500); X.bezierCurveTo(90, 450, 120, 530, 170, 480); X.stroke(); } })); K.root.add(c); return c; });
    return { W: 3.6, H: 2.6, still: 0.7, update(p, t, e) { const f = sm(0, 0.7, p) * 0.8 + 0.2 * e;
      pages.forEach((c, i) => { c.position.set(-i * 0.45 * f, i * 0.05, -i * 0.12); c.rotation.set(-0.05, 0.2 - 0.25 * f, i * 0.12 * f); }); K.root.rotation.y = -0.2 + Math.sin(t * 0.3) * 0.04; K.root.position.x = 0.3 * f; } };
  },
  /* 404: a small dotted planet with a satellite that drifted off its orbit (light) */
  lost(K) {
    const n = 900, pts = [], ga = Math.PI * (3 - Math.sqrt(5)); for (let j = 0; j < n; j++) { const y = 1 - (j / (n - 1)) * 2, r = Math.sqrt(1 - y * y); pts.push(Math.cos(ga * j) * r, y, Math.sin(ga * j) * r); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    const pl = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.035, map: dotTex(), color: 0x6fa8ff, transparent: true, opacity: 0.8, depthWrite: false })); K.root.add(pl);
    const orbit = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.006, 6, 160), M.glow(C.blue2, 0.5)); orbit.rotation.x = 1.2; K.root.add(orbit);
    const sat = new THREE.Group(); sat.add(new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.14), M.metal())); const wing = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.01, 0.12), M.blue()); sat.add(wing); sat.add(glow(C.cyan, 0.5, 0.7)); K.root.add(sat);
    return { W: 4.2, H: 3.4, update(p, t, e) { pl.rotation.y = t * 0.08; const a = t * 0.3, d = 1.6 + 0.5 * Math.sin(t * 0.2) + p; sat.position.set(Math.cos(a) * d, Math.sin(a) * d * 0.36 + 0.3, Math.sin(a) * d * 0.9); sat.rotation.set(t * 0.4, t * 0.3, 0.3); } };
  }
};

function reelTex(i) {
  return ctex(512, 620, (X, w, h) => { rr(X, 0, 0, w, h, 34); X.fillStyle = C.card; X.fill(); art(X, 22, 22, w - 44, h - 44, i); X.fillStyle = 'rgba(6,10,20,.45)'; X.beginPath(); X.arc(w / 2, h / 2, 64, 0, 7); X.fill();
    X.fillStyle = '#fff'; X.beginPath(); X.moveTo(w / 2 - 20, h / 2 - 32); X.lineTo(w / 2 + 34, h / 2); X.lineTo(w / 2 - 20, h / 2 + 32); X.closePath(); X.fill(); X.font = HEAD(40); X.fillText('Reel', 46, h - 60); });
}
function wrap(X, text, x, y, mw, lh) { const ws = text.split(' '); let line = ''; ws.forEach((w) => { const t = line ? line + ' ' + w : w; if (X.measureText(t).width > mw && line) { X.fillText(line, x, y); line = w; y += lh; } else line = t; }); X.fillText(line, x, y); }
function icon(X, k, cx, cy, s) {
  X.save(); X.translate(cx, cy); X.strokeStyle = '#7fb8ff'; X.fillStyle = '#5aa2ff'; X.lineWidth = s * 0.07; X.lineCap = X.lineJoin = 'round';
  const R = (x, y, w, h, r) => { rr(X, x, y, w, h, r); X.stroke(); };
  switch (k) {
    case 'social': R(-s * 0.32, -s * 0.55, s * 0.64, s * 1.1, s * 0.12); for (let i = 0; i < 4; i++) { X.fillRect(-s * 0.2 + (i % 2) * s * 0.22, -s * 0.3 + Math.floor(i / 2) * s * 0.26, s * 0.18, s * 0.2); } break;
    case 'content': R(-s * 0.5, -s * 0.4, s * 0.8, s * 0.8, s * 0.08); R(-s * 0.3, -s * 0.55, s * 0.8, s * 0.8, s * 0.08); X.beginPath(); X.arc(-s * 0.1, -s * 0.1, s * 0.1, 0, 7); X.fill(); break;
    case 'meta': for (let r = 1; r <= 3; r++) { X.beginPath(); X.arc(0, 0, s * 0.18 * r, 0, 7); X.stroke(); } X.beginPath(); X.arc(0, 0, s * 0.08, 0, 7); X.fill(); break;
    case 'google': X.beginPath(); X.arc(-s * 0.08, -s * 0.08, s * 0.32, 0, 7); X.stroke(); X.beginPath(); X.moveTo(s * 0.17, s * 0.17); X.lineTo(s * 0.48, s * 0.48); X.stroke(); break;
    case 'seo': [0.35, 0.6, 0.95].forEach((h, i) => X.fillRect(-s * 0.45 + i * s * 0.32, s * 0.45 - s * h, s * 0.2, s * h)); break;
    case 'web': R(-s * 0.55, -s * 0.4, s * 1.1, s * 0.75, s * 0.06); X.beginPath(); X.moveTo(-s * 0.55, -s * 0.22); X.lineTo(s * 0.55, -s * 0.22); X.stroke(); X.beginPath(); X.moveTo(-s * 0.3, s * 0.5); X.lineTo(s * 0.3, s * 0.5); X.stroke(); break;
    case 'video': R(-s * 0.55, -s * 0.38, s * 1.1, s * 0.76, s * 0.1); X.beginPath(); X.moveTo(-s * 0.12, -s * 0.18); X.lineTo(s * 0.2, 0); X.lineTo(-s * 0.12, s * 0.18); X.closePath(); X.fill(); break;
    case 'ai': R(-s * 0.55, -s * 0.42, s * 0.8, s * 0.5, s * 0.2); R(-s * 0.15, s * 0.0, s * 0.7, s * 0.45, s * 0.2); [0, 1, 2].forEach((i) => { X.beginPath(); X.arc(-s * 0.38 + i * s * 0.18, -s * 0.17, s * 0.04, 0, 7); X.fill(); }); break;
    case 'lead': X.beginPath(); X.moveTo(-s * 0.55, -s * 0.45); X.lineTo(s * 0.55, -s * 0.45); X.lineTo(s * 0.1, s * 0.1); X.lineTo(s * 0.1, s * 0.5); X.lineTo(-s * 0.1, s * 0.4); X.lineTo(-s * 0.1, s * 0.1); X.closePath(); X.stroke(); break;
    default: X.beginPath(); X.arc(0, 0, s * 0.4, 0, 7); X.stroke();
  }
  X.restore();
}

if (host) boot();
