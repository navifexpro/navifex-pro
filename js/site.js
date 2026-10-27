/* Navifex Pro - site script (round 3). No libraries, native scrolling, no pinning or scrubbing.
   Motion is calm and self-playing: things reveal once as they enter the screen. */
(function () {
  var d = document, root = d.documentElement, w = window, GA = 'G-SHX31VDL26';
  w.__nvx = 1;
  var reduce = w.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in w;
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function track(name, params) { if (typeof w.gtag === 'function') w.gtag('event', name, params || {}); }
  function $$(s, el) { return Array.prototype.slice.call((el || d).querySelectorAll(s)); }

  if (reduce) root.classList.remove('anim', 'intro');
  var anim = root.classList.contains('anim');
  var introOn = root.classList.contains('intro');

  /* ---- split headings into words (keeps the italic <em>) ---- */
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
    h.classList.add('sp-ok');
  });

  /* ---- count-up numbers ---- */
  function countUp(el) {
    if (el.__cu) return; el.__cu = 1;
    var to = +el.getAttribute('data-count'); if (!anim || !to) return;
    var t0 = performance.now(), dur = 1600;
    (function f(t) {
      var p = Math.min(1, (t - t0) / dur), v = Math.round(to * (1 - Math.pow(1 - p, 3)));
      el.textContent = v.toLocaleString('en-US');
      if (p < 1) requestAnimationFrame(f);
    })(t0);
  }

  /* ---- hero entrance (after the intro on a first visit) ---- */
  var heroes = $$('.hero');
  function heroGo() {
    heroes.forEach(function (h) {
      h.classList.add('go');
      $$('[data-hero]', h).forEach(function (x) { x.classList.add('in'); });
      $$('.ph', h).forEach(function (x) { setTimeout(function () { x.classList.add('in'); }, 120); });
    });
  }

  /* ---- reveal on enter (once), staggered within each group ---- */
  var SEL = '.rv,[data-split]:not([data-hero]),[data-line],.f-big,[data-funnel],.ph';
  var items = $$(SEL).filter(function (el) { return !el.closest('.hero'); });
  var groups = new Map();
  $$('.rv').forEach(function (el) {
    var p = el.parentElement, i = groups.get(p) || 0;
    el.style.setProperty('--d', Math.min(i, 6) * 70 + 'ms'); groups.set(p, i + 1);
  });
  function reveal(el) {
    if (el.classList.contains('in')) return;
    el.classList.add('in');
    $$('[data-count]', el).forEach(countUp);
    if (el.classList.contains('work') && el.parentElement) $$('.work', el.parentElement).forEach(reveal);
  }
  if (anim && hasIO) {
    // clipped photos have no visible area yet, so watch their parent instead
    var watch = new Map();
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { (watch.get(e.target) || []).forEach(reveal); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(function (el) {
      var t = el.classList.contains('ph') ? el.parentElement : el, l = watch.get(t);
      if (l) l.push(el); else { watch.set(t, [el]); io.observe(t); }
    });
    // safety net: anything already on screen that the observer missed
    setTimeout(function () { items.forEach(function (el) { var r = el.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) reveal(el); }); }, 2600);
    w.addEventListener('beforeprint', function () { items.forEach(reveal); heroGo(); });
  } else { items.forEach(reveal); }

  /* ---- home intro: linen screen, wordmark rises, panel lifts. Tap / click / Esc skips. ---- */
  if (introOn) {
    var ov = d.querySelector('.intro-ov');
    var finished = false;
    var finish = function () { if (finished) return; finished = true; root.classList.add('intro-done'); heroGo(); };
    var skip = function () { root.classList.add('intro-skip'); d.removeEventListener('keydown', onKey); setTimeout(finish, 120); };
    var onKey = function (e) { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') skip(); };
    if (ov) { ov.addEventListener('click', skip); ov.addEventListener('animationend', function (e) { if (e.target === ov) finish(); }); }
    d.addEventListener('keydown', onKey);
    setTimeout(finish, 1450);
    setTimeout(function () { if (ov) ov.remove(); }, 2600);
  } else if (anim) {
    requestAnimationFrame(function () { requestAnimationFrame(heroGo); });
  } else heroGo();

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

  /* ---- phones: keep floating chat/WhatsApp buttons off the hero ---- */
  var homeHero = d.querySelector('.home-hero');
  if (homeHero && hasIO) {
    new IntersectionObserver(function (es) { es.forEach(function (e) { root.classList.toggle('hero-vis', e.isIntersecting); }); }, { threshold: 0.35 }).observe(homeHero);
  }

  /* ---- header shrink, back to top, gentle photo parallax (one rAF scroll handler) ---- */
  var header = d.querySelector('.site-header'), top = d.querySelector('.to-top'), ticking = false;
  var pxEls = anim ? $$('[data-px]') : [], pxOn = [];
  if (pxEls.length && hasIO) {
    var pio = new IntersectionObserver(function (es) { es.forEach(function (e) { var i = pxOn.indexOf(e.target); if (e.isIntersecting && i < 0) pxOn.push(e.target); else if (!e.isIntersecting && i > -1) pxOn.splice(i, 1); }); onScroll(); });
    pxEls.forEach(function (el) { pio.observe(el); });
  }
  function onScroll() {
    ticking = false;
    var y = w.scrollY || 0, vh = innerHeight;
    if (header) header.classList.toggle('scrolled', y > 24);
    if (top) top.classList.toggle('show', y > vh * 1.2);
    for (var i = 0; i < pxOn.length; i++) {
      var r = pxOn[i].parentNode.getBoundingClientRect();
      var c = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2); // -1..1
      var t = Math.max(-1, Math.min(1, c)) * r.height * -0.045;
      pxOn[i].style.transform = 'translate3d(0,' + t.toFixed(1) + 'px,0)';
    }
  }
  w.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  w.addEventListener('resize', onScroll, { passive: true });
  onScroll();
  if (top) top.addEventListener('click', function () { w.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });

  /* ---- FAQ: smooth open/close ---- */
  $$('.faq details').forEach(function (det) {
    var sum = det.querySelector('summary'), ans = det.querySelector('.ans');
    if (!sum || !ans || !anim || !ans.animate) return;
    var busy = false;
    sum.addEventListener('click', function (e) {
      e.preventDefault(); if (busy) return; busy = true;
      var ease = 'cubic-bezier(.2,.8,.2,1)';
      if (det.open) {
        var a = ans.animate([{ height: ans.offsetHeight + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 320, easing: ease });
        a.onfinish = function () { det.open = false; busy = false; };
      } else {
        det.open = true; var h = ans.offsetHeight;
        var b = ans.animate([{ height: '0px', opacity: 0 }, { height: h + 'px', opacity: 1 }], { duration: 400, easing: ease });
        b.onfinish = function () { busy = false; };
      }
    });
  });

  /* ---- works rail: auto-advance while visible, swipe on phones, dots ---- */
  $$('.works[data-autoplay]').forEach(function (rail) {
    var cards = $$('.work', rail), dots = rail.nextElementSibling && rail.nextElementSibling.classList.contains('rail-dots') ? $$('i', rail.nextElementSibling) : [];
    if (!cards.length) return;
    var vis = false, idle = 0, cur = 0;
    function nearest() {
      var mid = rail.scrollLeft + rail.clientWidth / 2, best = 0, bd = 1e9;
      cards.forEach(function (c, i) { var m = c.offsetLeft + c.offsetWidth / 2, dd = Math.abs(m - mid); if (dd < bd) { bd = dd; best = i; } });
      return best;
    }
    function mark() { cur = nearest(); dots.forEach(function (x, i) { x.classList.toggle('on', i === cur); }); }
    var st; rail.addEventListener('scroll', function () { clearTimeout(st); st = setTimeout(mark, 90); }, { passive: true });
    ['pointerenter', 'touchstart', 'focusin', 'wheel'].forEach(function (ev) { rail.addEventListener(ev, function () { idle = Date.now() + 8000; }, { passive: true }); });
    if (hasIO) new IntersectionObserver(function (es) { vis = es[0].isIntersecting; mark(); }, { threshold: 0.4 }).observe(rail);
    mark();
    if (anim) setInterval(function () {
      if (!vis || d.hidden || Date.now() < idle || rail.scrollWidth <= rail.clientWidth + 8) return;
      var n = (cur + 1) % cards.length, c = cards[n];
      rail.scrollTo({ left: c.offsetLeft - (rail.clientWidth - c.offsetWidth) / 2, behavior: 'smooth' });
    }, 5200);
  });

  /* ---- GA4 click events (sent only when analytics is accepted) ---- */
  d.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]'); if (!a) return;
    var h = a.getAttribute('href') || '';
    if (h.indexOf('wa.me/') > -1 || h.indexOf('api.whatsapp.com') > -1) track('whatsapp_click', { link_url: h.split('?')[0], page: location.pathname });
    else if (h.indexOf('tel:') === 0) track('call_click', { page: location.pathname });
    else if (h.indexOf('mailto:') === 0) track('email_click', { page: location.pathname });
    else if (h.indexOf('/contact#book') > -1) track('book_call_click', { page: location.pathname });
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
      '<div class="btn-row"><button type="button" class="btn btn-primary" data-ck="granted"><span>Accept</span></button><button type="button" class="btn btn-ghost" data-ck="denied"><span>Decline</span></button></div>';
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
  else if (choice !== 'denied') setTimeout(banner, introOn ? 2400 : 900);
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
