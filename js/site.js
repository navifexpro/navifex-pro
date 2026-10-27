/* Navifex Pro - site script (round 2). No libraries. Normal native scrolling.
   Every animation is self-playing: it starts when an element enters the viewport, on a timer, or on hover/tap. */
(function () {
  var d = document, root = d.documentElement, w = window, GA = 'G-SHX31VDL26';
  var reduce = w.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = w.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hasIO = 'IntersectionObserver' in w;
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function ss(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); if (v === null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, v); } catch (e) { return null; } }
  function track(name, params) { if (typeof w.gtag === 'function') w.gtag('event', name, params || {}); }
  function $$(s, el) { return Array.prototype.slice.call((el || d).querySelectorAll(s)); }

  if (!reduce) root.classList.add('anim');
  if (root.classList.contains('pt-in')) { ss('nvx_pt', null); setTimeout(function () { root.classList.remove('pt-in'); }, 600); }
  var introOn = root.classList.contains('intro');
  function heroDelay() { return introOn && !root.classList.contains('intro-skip') ? 2050 : 100; }

  /* ---- split headings into words (keeps <em> highlight) ---- */
  $$('[data-split]').forEach(function (h) {
    var i = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var parts = n.textContent.split(/(\s+)/), frag = d.createDocumentFragment();
          parts.forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(d.createTextNode(' ')); return; }
            var o = d.createElement('span'), s = d.createElement('span');
            o.className = 'w'; s.textContent = p; s.style.setProperty('--wi', i++); o.appendChild(s); frag.appendChild(o);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1) walk(n);
      });
    })(h);
    h.setAttribute('aria-label', h.textContent.replace(/\s+/g, ' ').trim());
    h.classList.add('sp-ok');
  });

  /* ---- letter scramble for labels ---- */
  var GLY = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+';
  function scramble(el) {
    if (reduce || el.__sc) return; el.__sc = 1;
    var txt = el.textContent, n = txt.length, t0 = performance.now(), dur = 520;
    el.setAttribute('aria-label', txt);
    (function f(t) {
      var p = Math.min(1, (t - t0) / dur), out = '';
      for (var k = 0; k < n; k++) {
        var c = txt[k];
        out += (c === ' ' || k / n < p) ? c : GLY[(Math.random() * GLY.length) | 0];
      }
      el.textContent = out;
      if (p < 1) requestAnimationFrame(f); else el.textContent = txt;
    })(t0);
  }

  /* ---- count-up numbers ---- */
  function countUp(el) {
    if (el.__cu) return; el.__cu = 1;
    var to = +el.getAttribute('data-count'); if (reduce || !to) return;
    var t0 = performance.now(), dur = 1700;
    (function f(t) {
      var p = Math.min(1, (t - t0) / dur), v = Math.round(to * (1 - Math.pow(1 - p, 3)));
      el.textContent = v.toLocaleString('en-US');
      if (p < 1) requestAnimationFrame(f);
    })(t0);
  }

  /* ---- reveal on enter (once) ---- */
  var SEL = '.rv,[data-split]:not([data-hero]),.cta-band,[data-line],.f-big,[data-funnel]';
  var items = $$(SEL);
  var groups = new Map();
  $$('.rv').forEach(function (el) {
    var p = el.parentElement, i = groups.get(p) || 0;
    el.style.setProperty('--d', Math.min(i, 7) * 80 + 'ms'); groups.set(p, i + 1);
  });
  $$('[data-line]').forEach(function (l) { $$('.step', l).forEach(function (s, i) { s.style.setProperty('--si', i); }); });
  function reveal(el) {
    if (el.classList.contains('in')) return;
    el.classList.add('in');
    if (el.hasAttribute('data-scramble')) scramble(el);
    $$('[data-count]', el).forEach(countUp);
    if (el.hasAttribute('data-count')) countUp(el);
    if (el.classList.contains('cta-band')) setTimeout(function () { $$(SEL, el).forEach(reveal); }, 350);
    if (el.classList.contains('work') && el.parentElement) $$('.work', el.parentElement).forEach(reveal);
    if (el.classList.contains('tilt')) setTimeout(function () { el.classList.add('done'); }, 1100 + (parseInt(el.style.getPropertyValue('--d')) || 0));
  }
  if (hasIO && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { reveal(e.target); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -7% 0px', threshold: 0.06 });
    items.forEach(function (el) { io.observe(el); });
    // safety: anything on screen that the observer missed is shown after 2.5s
    var safety = function () { items.forEach(function (el) { var r = el.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) reveal(el); }); };
    setTimeout(safety, 2500);
    w.addEventListener('beforeprint', function () { items.forEach(reveal); });
  } else items.forEach(reveal);
  if (reduce) $$('.tilt').forEach(function (t) { t.classList.add('done'); });
  // hero labels scramble when the hero text rises
  $$('.hero-in [data-scramble]').forEach(function (el) { setTimeout(function () { scramble(el); }, heroDelay() + 80); });

  /* ---- live scenes play only while visible ---- */
  if (hasIO) {
    var pio = new IntersectionObserver(function (es) { es.forEach(function (e) { e.target.classList.toggle('play', e.isIntersecting); }); }, { threshold: 0.15 });
    $$('.sg-card,.p-vis').forEach(function (el) { pio.observe(el); });
  }

  /* ---- mobile menu ---- */
  var burger = d.querySelector('.burger'), menu = d.getElementById('m-menu');
  if (burger && menu) {
    var setMenu = function (open) {
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      menu.classList.toggle('open', open);
      root.style.overflow = open ? 'hidden' : '';
    };
    burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu.classList.contains('open')) { setMenu(false); burger.focus(); } });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    w.addEventListener('resize', function () { if (innerWidth > 1023 && menu.classList.contains('open')) setMenu(false); });
  }

  /* ---- home intro: counter, skip on tap / click / Esc ---- */
  if (introOn) {
    var ov = d.querySelector('.intro-ov'), cnt = d.querySelector('.ld-count b');
    var skip = function () { root.classList.add('intro-skip'); d.removeEventListener('keydown', onKey); };
    var onKey = function (e) { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') skip(); };
    if (ov) ov.addEventListener('click', skip);
    d.addEventListener('keydown', onKey);
    setTimeout(skip, 2400);
    if (cnt) { var c0 = performance.now() + 100; (function f(t) { var p = Math.max(0, Math.min(1, (t - c0) / 1350)); cnt.textContent = ('00' + Math.round(100 * (1 - Math.pow(1 - p, 2)))).slice(-3); if (p < 1 && !root.classList.contains('intro-skip')) requestAnimationFrame(f); })(performance.now()); }
  }

  /* ---- phones: keep floating chat/WhatsApp buttons off the hero text ---- */
  var heroEl = d.querySelector('.hero');
  if (heroEl && hasIO) {
    new IntersectionObserver(function (es) { es.forEach(function (e) { root.classList.toggle('hero-vis', e.isIntersecting); }); }, { threshold: 0.35 }).observe(heroEl);
  }

  /* ---- header state, progress bar, back to top (one rAF-throttled scroll handler) ---- */
  var header = d.querySelector('.site-header'), bar = d.querySelector('.progress i'), top = d.querySelector('.to-top'), ticking = false;
  function onScroll() {
    ticking = false;
    var y = w.scrollY || 0, h = root.scrollHeight - innerHeight;
    if (header) header.classList.toggle('scrolled', y > 24);
    if (bar) bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, y / h) : 0).toFixed(4) + ')';
    if (top) top.classList.toggle('show', y > innerHeight * 1.2);
  }
  w.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();
  if (top) top.addEventListener('click', function () { w.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); var m = d.getElementById('main'); });

  /* ---- FAQ: smooth open/close ---- */
  $$('.faq details').forEach(function (det) {
    var sum = det.querySelector('summary'), ans = det.querySelector('.ans');
    if (!sum || !ans || reduce || !ans.animate) return;
    var busy = false;
    sum.addEventListener('click', function (e) {
      e.preventDefault(); if (busy) return; busy = true;
      var ease = 'cubic-bezier(.2,.8,.2,1)';
      if (det.open) {
        var a = ans.animate([{ height: ans.offsetHeight + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 320, easing: ease });
        a.onfinish = function () { det.open = false; busy = false; };
      } else {
        det.open = true; var h = ans.offsetHeight;
        var b = ans.animate([{ height: '0px', opacity: 0 }, { height: h + 'px', opacity: 1 }], { duration: 380, easing: ease });
        b.onfinish = function () { busy = false; };
      }
    });
  });

  /* ---- desktop pointer effects: tilt + glow, magnetic buttons, cursor ring ---- */
  if (fine && !reduce) {
    $$('.tilt').forEach(function (el) {
      var raf = 0;
      el.addEventListener('pointermove', function (e) {
        if (raf) return;
        raf = requestAnimationFrame(function () {
          raf = 0;
          var r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
          el.style.setProperty('--mx', (x * 100).toFixed(1) + '%'); el.style.setProperty('--my', (y * 100).toFixed(1) + '%');
          el.style.setProperty('--rx', ((0.5 - y) * 7).toFixed(2) + 'deg'); el.style.setProperty('--ry', ((x - 0.5) * 9).toFixed(2) + 'deg');
        });
      });
      el.addEventListener('pointerleave', function () { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); });
    });
    $$('.magnetic').forEach(function (b) {
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect(), x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
        b.style.transform = 'translate(' + (x * 0.22).toFixed(1) + 'px,' + (y * 0.32).toFixed(1) + 'px)';
      });
      b.addEventListener('pointerleave', function () { b.style.transform = ''; });
    });
    var cur = d.createElement('div'); cur.className = 'cursor'; cur.setAttribute('aria-hidden', 'true'); cur.innerHTML = '<span></span>';
    d.body.appendChild(cur);
    var lab = cur.firstChild, mx = -100, my = -100, cx = -100, cy = -100, moving = false;
    var loop = function () {
      cx += (mx - cx) * 0.22; cy += (my - cy) * 0.22;
      cur.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0)';
      if (Math.abs(mx - cx) + Math.abs(my - cy) > 0.3) requestAnimationFrame(loop); else moving = false;
    };
    d.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      mx = e.clientX; my = e.clientY; cur.classList.add('on');
      if (!moving) { moving = true; requestAnimationFrame(loop); }
      var t = e.target.closest && e.target.closest('a,button,summary,[data-cursor],input,select,textarea,label');
      var txt = t && !/INPUT|SELECT|TEXTAREA|LABEL/.test(t.tagName) ? t.getAttribute('data-cursor') : '';
      cur.classList.toggle('hov', !!t && !txt && !/INPUT|SELECT|TEXTAREA/.test(t.tagName));
      cur.classList.toggle('lbl', !!txt); if (txt) lab.textContent = txt;
      cur.style.opacity = t && /INPUT|SELECT|TEXTAREA/.test(t.tagName) ? '0' : '';
    }, { passive: true });
    d.addEventListener('pointerdown', function () { cur.classList.add('down'); });
    d.addEventListener('pointerup', function () { cur.classList.remove('down'); });
    d.documentElement.addEventListener('mouseleave', function () { cur.classList.remove('on'); });
  }

  /* ---- tap ripple on buttons ---- */
  if (!reduce) d.addEventListener('pointerdown', function (e) {
    var b = e.target.closest && e.target.closest('.btn'); if (!b) return;
    var r = b.getBoundingClientRect(), s = Math.max(r.width, r.height) * 2.2, sp = d.createElement('span');
    sp.className = 'ripple'; sp.style.width = sp.style.height = s + 'px';
    sp.style.left = (e.clientX - r.left - s / 2) + 'px'; sp.style.top = (e.clientY - r.top - s / 2) + 'px';
    b.appendChild(sp); setTimeout(function () { sp.remove(); }, 650);
  }, { passive: true });

  /* ---- ambient particles (canvas, paused off-screen, few on phones) ---- */
  if (!reduce && hasIO) $$('canvas.fx-particles').forEach(function (cv) {
    var ctx = cv.getContext('2d'); if (!ctx) return;
    var small = innerWidth < 760, N = Math.min(+cv.getAttribute('data-n') || 30, small ? 22 : 40);
    var dpr = Math.min(w.devicePixelRatio || 1, 1.5), W = 0, H = 0, P = [], on = false, raf = 0, last = 0;
    function size() { var r = cv.getBoundingClientRect(); W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    function seed() { P = []; for (var i = 0; i < N; i++) P.push({ x: Math.random() * W, y: Math.random() * H, r: 0.6 + Math.random() * 1.4, vx: (Math.random() - 0.5) * 0.12, vy: -0.08 - Math.random() * 0.22, a: 0.25 + Math.random() * 0.55 }); }
    function frame(t) {
      raf = 0; if (!on) return;
      if (t - last < 30) { raf = requestAnimationFrame(frame); return; } last = t;
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < P.length; i++) {
        var p = P[i]; p.x += p.vx; p.y += p.vy;
        if (p.y < -6) { p.y = H + 6; p.x = Math.random() * W; } if (p.x < -6) p.x = W + 6; if (p.x > W + 6) p.x = -6;
        for (var j = i + 1; j < P.length; j++) {
          var q = P[j], dx = p.x - q.x, dy = p.y - q.y, dd = dx * dx + dy * dy;
          if (dd < 11000) { ctx.strokeStyle = 'rgba(127,208,255,' + (0.12 * (1 - dd / 11000)).toFixed(3) + ')'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); }
        }
        ctx.fillStyle = 'rgba(160,215,255,' + p.a + ')'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    }
    function go() { if (on && !raf && !d.hidden) raf = requestAnimationFrame(frame); }
    size(); seed();
    new IntersectionObserver(function (es) { on = es[0].isIntersecting; go(); }).observe(cv);
    d.addEventListener('visibilitychange', go);
    var rt; w.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { size(); seed(); }, 200); });
  });

  /* ---- works rail: auto-advance while visible, dots, screenshot peek ---- */
  $$('.works[data-autoplay]').forEach(function (rail) {
    var cards = $$('.work', rail), dots = rail.nextElementSibling && rail.nextElementSibling.classList.contains('rail-dots') ? $$('i', rail.nextElementSibling) : [];
    if (!cards.length) return;
    var vis = false, idle = 0, cur = 0;
    function nearest() {
      var mid = rail.scrollLeft + rail.clientWidth / 2, best = 0, bd = 1e9;
      cards.forEach(function (c, i) { var m = c.offsetLeft + c.offsetWidth / 2, dd = Math.abs(m - mid); if (dd < bd) { bd = dd; best = i; } });
      return best;
    }
    function mark() { cur = nearest(); dots.forEach(function (x, i) { x.classList.toggle('on', i === cur); }); cards.forEach(function (c, i) { c.classList.toggle('peek', i === cur && vis); }); }
    var st; rail.addEventListener('scroll', function () { clearTimeout(st); st = setTimeout(mark, 90); }, { passive: true });
    ['pointerenter', 'touchstart', 'focusin', 'wheel'].forEach(function (ev) { rail.addEventListener(ev, function () { idle = Date.now() + 7000; }, { passive: true }); });
    if (hasIO) new IntersectionObserver(function (es) { vis = es[0].isIntersecting; mark(); }, { threshold: 0.4 }).observe(rail);
    mark();
    if (!reduce && rail.scrollWidth > rail.clientWidth + 8) setInterval(function () {
      if (!vis || d.hidden || Date.now() < idle) return;
      var n = (cur + 1) % cards.length, c = cards[n];
      rail.scrollTo({ left: c.offsetLeft - (rail.clientWidth - c.offsetWidth) / 2, behavior: 'smooth' });
    }, 4800);
  });

  /* ---- page-to-page transition (quick cover; never blocks if JS fails) ---- */
  if (!reduce) {
    var cover = d.createElement('div'); cover.className = 'pt-cover'; cover.setAttribute('aria-hidden', 'true'); d.body.appendChild(cover);
    d.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest && e.target.closest('a[href]'); if (!a || a.target || a.hasAttribute('download')) return;
      var u; try { u = new URL(a.href, location.href); } catch (x) { return; }
      if (u.origin !== location.origin || (u.pathname === location.pathname && u.search === location.search)) return;
      if (/^\/(samples|earn|partner|start|dl|demo)/.test(u.pathname)) return;
      e.preventDefault(); ss('nvx_pt', '1'); cover.classList.add('on');
      setTimeout(function () { location.href = u.href; }, 300);
    });
    w.addEventListener('pageshow', function (e) { if (e.persisted) { cover.classList.remove('on'); ss('nvx_pt', null); } });
  }

  /* ---- hero background video (home) ---- */
  var hero = d.querySelector('[data-hero-video]');
  if (hero) {
    var conn = navigator.connection || {};
    var start = function () {
      if (reduce || conn.saveData) return;
      var mobile = matchMedia('(max-width: 759px)').matches;
      var v = d.createElement('video');
      v.className = 'hero-video'; v.muted = true; v.defaultMuted = true; v.loop = true; v.playsInline = true; v.autoplay = true;
      v.setAttribute('muted', ''); v.setAttribute('playsinline', ''); v.setAttribute('aria-hidden', 'true'); v.preload = 'auto';
      v.src = hero.getAttribute(mobile ? 'data-src-m' : 'data-src-d');
      v.addEventListener('playing', function () { v.classList.add('on'); });
      v.addEventListener('error', function () { v.remove(); });
      hero.querySelector('.hero-bg').appendChild(v);
      var visible = true;
      var play = function () { if (visible && !d.hidden) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } else v.pause(); };
      if (hasIO) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; play(); }).observe(hero);
      d.addEventListener('visibilitychange', play);
      play();
    };
    if (d.readyState === 'complete') start(); else w.addEventListener('load', start);
  }

  /* ---- GA4 click events (sent only when analytics is accepted) ---- */
  d.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]'); if (!a) return;
    var h = a.getAttribute('href') || '';
    if (h.indexOf('wa.me/') > -1 || h.indexOf('api.whatsapp.com') > -1) track('whatsapp_click', { link_url: h.split('?')[0], page: location.pathname });
    else if (h.indexOf('tel:') === 0) track('call_click', { page: location.pathname });
  }, true);

  /* ---- cookie notice: analytics only after Accept ---- */
  var KEY = 'nvx_consent';
  function loadGA() {
    if (w.__nvxGA) return; w.__nvxGA = 1;
    var s = d.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA; d.head.appendChild(s);
  }
  function banner() {
    if (d.querySelector('.ck')) return;
    var b = d.createElement('div');
    b.className = 'ck'; b.setAttribute('role', 'region'); b.setAttribute('aria-label', 'Cookie notice');
    b.innerHTML = '<p>We use analytics cookies to see which pages help people, only if you agree. <a href="/privacy#cookies">Privacy policy</a></p>' +
      '<div class="btn-row"><button type="button" class="btn btn-primary" data-ck="granted">Accept</button><button type="button" class="btn btn-ghost" data-ck="denied">Decline</button></div>';
    d.body.appendChild(b);
    root.style.setProperty('--ck-h', (b.offsetHeight + 16) + 'px'); root.classList.add('has-ck');
    requestAnimationFrame(function () { requestAnimationFrame(function () { b.classList.add('show'); }); });
    b.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-ck]'); if (!btn) return;
      var v = btn.getAttribute('data-ck'); store(KEY, v);
      if (v === 'granted') loadGA();
      b.remove(); root.classList.remove('has-ck');
    });
  }
  var choice = store(KEY);
  if (choice === 'granted') loadGA();
  else if (choice !== 'denied') setTimeout(banner, introOn ? 2600 : 900);
  d.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('[data-cookie-settings]')) { e.preventDefault(); store(KEY, ''); banner(); }
  });

  /* ---- year ---- */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---- Book a free call form (contact page) ---- */
  var f = d.getElementById('bookForm');
  if (f) {
    var tz = '';
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
    var tzIn = f.querySelector('[name=timezone]'); if (tzIn && tz) tzIn.value = tz;
    var err = d.getElementById('bookErr'), btn = d.getElementById('bookBtn'), done = d.getElementById('bookDone');
    var label = btn.querySelector('span').textContent;
    var fail = function (msg, el) {
      err.textContent = msg; err.hidden = false;
      if (el) { el.setAttribute('aria-invalid', 'true'); el.focus(); }
    };
    f.addEventListener('input', function (e) { if (e.target.getAttribute('aria-invalid')) e.target.removeAttribute('aria-invalid'); });
    f.addEventListener('submit', function (e) {
      e.preventDefault(); err.hidden = true;
      var v = {}; new FormData(f).forEach(function (val, k) { v[k] = String(val).trim(); });
      var phone = (v.phone || '').replace(/\D/g, ''), emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email || '');
      if ((v.name || '').length < 2) return fail('Please enter your name.', f.elements.name);
      if (!emailOk) return fail('Please enter a valid email address.', f.elements.email);
      if (v.phone && (phone.length < 10 || phone.length > 15)) return fail('Please enter your WhatsApp or phone number with the country code, for example +1 555 123 4567.', f.elements.phone);
      if (!v.need) return fail('Please choose what you need help with.', f.elements.need);
      if (!v.day) return fail('Please choose a preferred day.', f.elements.day);
      var msg = [
        'BOOK A FREE CALL',
        'Preferred day: ' + v.day,
        'Preferred time: ' + (v.time || 'Any time'),
        'Time zone: ' + (v.timezone || 'Not given'),
        'Business / website: ' + (v.business || 'Not given'),
        'Needs: ' + v.need,
        v.notes ? 'Notes: ' + v.notes : ''
      ].filter(Boolean).join('\n');
      var data = { kind: 'enquiry', name: v.name, business: v.business || '', whatsapp: v.phone || '', email: v.email, service: v.need, city: '', message: msg, website: v.website || '' };
      try { var R = w.nvxRef; data.ref = String((R && !R.bad && R.c) || '').slice(0, 20); } catch (x) {}
      btn.disabled = true; btn.querySelector('span').textContent = 'Sending…';
      fetch('https://bot.navifexpro.com/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok || !j.ok) throw new Error(j.error || 'fail'); }); })
        .then(function () {
          f.hidden = true; done.hidden = false; done.focus();
          track('generate_lead', { method: 'book_call_form' });
        })
        .catch(function (x) {
          btn.disabled = false; btn.querySelector('span').textContent = label;
          fail(x.message === 'too_many'
            ? 'Too many requests in a short time. Please try again in a few minutes, or message us on WhatsApp.'
            : 'Sorry, your request could not be sent. Please try again, or message us on WhatsApp at +92 313 0111349.');
        });
    });
  }
})();
