/* Our Works + Client Reviews — loaded from the admin page (bot.navifexpro.com) */
(function () {
  var API = 'https://bot.navifexpro.com/api/';
  var esc = function (t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var okUrl = function (u) { return /^https:\/\//.test(u || '') ? u : ''; };
  function get(kind) { return fetch(API + kind).then(function (r) { return r.json(); }).then(function (d) { return d.items || []; }).catch(function () { return []; }); }
  get('works').then(function (W) {
    var sec = document.getElementById('our-works'); if (!sec || !W.length) return;
    var grid = sec.querySelector('.ow-grid'), chips = sec.querySelector('.ow-chips');
    var cats = []; W.forEach(function (w) { if (w.category && cats.indexOf(w.category) < 0) cats.push(w.category); });
    grid.innerHTML = W.map(function (w) {
      var img = okUrl(w.image), vid = okUrl(w.video), link = okUrl(w.link);
      return '<article class="ow-card" data-cat="' + esc(w.category) + '">' + (img ? '<div class="ow-img"><img src="' + esc(img) + '" alt="' + esc(w.title) + '" loading="lazy"></div>' : '') +
        '<div class="ow-body"><span class="ow-cat">' + esc(w.category) + (w.client ? ' · ' + esc(w.client) : '') + '</span><h3>' + esc(w.title) + '</h3>' +
        (w.result ? '<p class="ow-res">' + esc(w.result) + '</p>' : '') + (w.description ? '<p>' + esc(w.description) + '</p>' : '') +
        '<div class="ow-links">' + (vid ? '<a href="' + esc(vid) + '" target="_blank" rel="noopener">Watch video</a>' : '') + (link ? '<a href="' + esc(link) + '" target="_blank" rel="noopener">See it live</a>' : '') + '</div></div></article>';
    }).join('');
    if (cats.length > 1) {
      chips.innerHTML = '<button type="button" class="ow-chip" aria-pressed="true" data-v="">All</button>' + cats.map(function (c) { return '<button type="button" class="ow-chip" aria-pressed="false" data-v="' + esc(c) + '">' + esc(c) + '</button>'; }).join('');
      chips.addEventListener('click', function (e) {
        var b = e.target.closest('.ow-chip'); if (!b) return;
        [].forEach.call(chips.children, function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        [].forEach.call(grid.children, function (c) { c.hidden = b.dataset.v && c.getAttribute('data-cat') !== b.dataset.v; });
      });
    }
    sec.hidden = false;
  });
  get('reviews').then(function (R) {
    var sec = document.getElementById('client-reviews'); if (!sec || !R.length) return;
    sec.querySelector('.rv-grid').innerHTML = R.map(function (r) {
      var n = Math.max(1, Math.min(5, +r.rating || 5)), ph = okUrl(r.photo), vid = okUrl(r.video);
      return '<figure class="rv-card"><div class="rv-stars" aria-label="' + n + ' out of 5">' + '★★★★★'.slice(0, n) + '<span>' + '★★★★★'.slice(0, 5 - n) + '</span></div><blockquote>' + esc(r.text) + '</blockquote>' +
        '<figcaption>' + (ph ? '<img src="' + esc(ph) + '" alt="" width="44" height="44" loading="lazy">' : '<i aria-hidden="true">' + esc((r.name || '?').charAt(0)) + '</i>') + '<span><b>' + esc(r.name) + '</b>' + esc([r.business, r.city].filter(Boolean).join(', ')) + '</span></figcaption>' +
        (vid ? '<a class="rv-vid" href="' + esc(vid) + '" target="_blank" rel="noopener">Watch video review</a>' : '') + '</figure>';
    }).join('');
    sec.hidden = false;
  });
})();
