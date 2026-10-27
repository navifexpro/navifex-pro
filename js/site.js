/* Navifex Pro - site script (2026 redesign). No libraries, normal scrolling. */
(function () {
  var d = document, root = d.documentElement, GA = 'G-SHX31VDL26';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function track(name, params) { if (typeof window.gtag === 'function') window.gtag('event', name, params || {}); }

  /* ---- mobile menu ---- */
  var burger = d.querySelector('.burger'), menu = d.getElementById('m-menu');
  if (burger && menu) {
    var setMenu = function (open) {
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      menu.classList.toggle('open', open);
    };
    burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu.classList.contains('open')) { setMenu(false); burger.focus(); } });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    window.addEventListener('resize', function () { if (innerWidth > 1023) setMenu(false); });
  }

  /* ---- home intro: skip on tap / click / Esc ---- */
  if (root.classList.contains('intro')) {
    var ov = d.querySelector('.intro-ov');
    var skip = function () { root.classList.add('intro-skip'); d.removeEventListener('keydown', onKey); };
    var onKey = function (e) { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') skip(); };
    if (ov) { ov.addEventListener('click', skip); ov.addEventListener('animationend', function (e) { if (e.target === ov) skip(); }); }
    d.addEventListener('keydown', onKey);
    setTimeout(skip, 2600);
  }

  /* ---- scroll reveal (once, staggered) ---- */
  var rv = d.querySelectorAll('.rv');
  if (rv.length && 'IntersectionObserver' in window && !reduce) {
    var groups = new Map();
    rv.forEach(function (el) {
      var p = el.parentElement, i = groups.get(p) || 0;
      el.style.setProperty('--d', Math.min(i, 6) * 70 + 'ms'); groups.set(p, i + 1);
    });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    rv.forEach(function (el) { io.observe(el); });
  } else rv.forEach(function (el) { el.classList.add('in'); });

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
      hero.querySelector(".hero-bg").appendChild(v);
      var visible = true;
      var play = function () { if (visible && !d.hidden) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } else v.pause(); };
      if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; play(); }).observe(hero);
      d.addEventListener('visibilitychange', play);
      play();
    };
    if (d.readyState === 'complete') start(); else window.addEventListener('load', start);
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
    if (window.__nvxGA) return; window.__nvxGA = 1;
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
  else if (choice !== 'denied') setTimeout(banner, root.classList.contains('intro') ? 2600 : 600);
  d.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('[data-cookie-settings]')) { e.preventDefault(); store(KEY, ''); banner(); }
  });

  /* ---- year ---- */
  d.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

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
      try { var R = window.nvxRef; data.ref = String((R && !R.bad && R.c) || '').slice(0, 20); } catch (x) {}
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
