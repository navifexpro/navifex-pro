// Navifex Pro blog (Cloudflare Pages advanced mode).
// Only the routes in _routes.json reach this worker; every other page is served
// straight from the static files, exactly as before.
// Bindings on the Pages project:
//   BLOG_KV         Workers KV namespace (posts + cover images)
//   ADMIN_PASSWORD  secret used to log in at /blog-admin

const SITE = 'https://navifexpro.com';
const COOKIE = 'nvx_blog';
const SESSION_DAYS = 14;
const MAX_IMG = 3 * 1024 * 1024;
const IMG_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const json = (data, status = 200, extra = {}) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extra } });

// ---------- auth ----------
const enc = new TextEncoder();
async function hmac(secret, msg) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(msg));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
async function makeToken(env) {
  const exp = Date.now() + SESSION_DAYS * 864e5;
  return `${exp}.${await hmac(env.ADMIN_PASSWORD, 'blog|' + exp)}`;
}
async function isAdmin(req, env) {
  if (!env.ADMIN_PASSWORD) return false;
  // The blog editor now lives in the main admin (bot.navifexpro.com/admin/blog); it sends a short signed token.
  const hdr = req.headers.get('x-nvx-blog-token');
  const m = hdr ? [null, hdr] : (req.headers.get('cookie') || '').match(new RegExp('(?:^|;\\s*)' + COOKIE + '=([^;]+)'));
  if (!m) return false;
  const [exp, sig] = m[1].split('.');
  if (!exp || !sig || +exp < Date.now()) return false;
  return safeEqual(sig, await hmac(env.ADMIN_PASSWORD, 'blog|' + exp));
}
const cookie = (v, maxAge) => `${COOKIE}=${v}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;

// ---------- helpers ----------
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const clean = (v, max = 300) => String(v == null ? '' : v).trim().slice(0, max);
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const today = () => new Date(Date.now() + 5 * 3600e3).toISOString().slice(0, 10); // Pakistan date
const slugify = (s) => String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
const fmtDate = (iso) => {
  const m = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const [y, mo, d] = String(iso).split('-').map(Number);
  return y ? `${d} ${m[mo - 1]} ${y}` : '';
};

async function load(env) {
  const d = await env.BLOG_KV.get('posts', 'json');
  return Array.isArray(d) ? d : [];
}
const save = (env, d) => env.BLOG_KV.put('posts', JSON.stringify(d));
// live = shown and its date has arrived; newest first
const live = (list) => list.filter((p) => p.show && p.date <= today()).sort((a, b) => (b.date + b.created).localeCompare(a.date + a.created));

// small, safe Markdown -> HTML (headings, lists, quotes, bold, italic, links)
function inline(t) {
  let s = esc(t);
  s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\)/g, (_, txt, href) => {
    const ext = /^https?:/.test(href) && !href.startsWith(SITE);
    return `<a href="${href}"${ext ? ' target="_blank" rel="noopener"' : ''}>${txt}</a>`;
  });
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
  return s;
}
function md(src) {
  const lines = String(src || '').replace(/\r/g, '').split('\n');
  let out = '', list = null, para = [];
  const flushP = () => { if (para.length) { out += `<p>${inline(para.join(' '))}</p>\n`; para = []; } };
  const flushL = () => { if (list) { out += `</${list}>\n`; list = null; } };
  for (const raw of lines) {
    const l = raw.trim();
    let m;
    if (!l) { flushP(); flushL(); continue; }
    if ((m = l.match(/^(#{2,3})\s+(.*)$/))) { flushP(); flushL(); const h = m[1].length; out += `<h${h} id="${slugify(m[2])}">${inline(m[2])}</h${h}>\n`; continue; }
    if ((m = l.match(/^[-*]\s+(.*)$/))) { flushP(); if (list !== 'ul') { flushL(); out += '<ul>'; list = 'ul'; } out += `<li>${inline(m[1])}</li>`; continue; }
    if ((m = l.match(/^\d+[.)]\s+(.*)$/))) { flushP(); if (list !== 'ol') { flushL(); out += '<ol>'; list = 'ol'; } out += `<li>${inline(m[1])}</li>`; continue; }
    if ((m = l.match(/^>\s?(.*)$/))) { flushP(); flushL(); out += `<blockquote><p>${inline(m[1])}</p></blockquote>\n`; continue; }
    flushL(); para.push(l);
  }
  flushP(); flushL();
  return out;
}
const plain = (src) => String(src || '').replace(/[#>*_`\[\]]/g, '').replace(/\(https?:[^)]*\)/g, '').replace(/\s+/g, ' ').trim();
const imgUrl = (id) => (id ? `/blog-img/${id}` : '');


// ---------- look & feel helpers ----------
const CATS = [
  { key: 'ads', name: 'Ads', color: '#2f7bff', re: /\bads?\b|advertis|retarget|budget|ppc|roas/ },
  { key: 'seo', name: 'SEO & Google', color: '#22c55e', re: /seo|google business|review|rank|blog post/ },
  { key: 'web', name: 'Websites', color: '#f59e0b', re: /website|landing page|shopify|ecommerce|store/ },
  { key: 'social', name: 'Social Media', color: '#ec4899', re: /social|instagram|reel|caption|content|video|photo|brand/ },
  { key: 'growth', name: 'Growth & Sales', color: '#a78bfa', re: /.*/ },
];
const catOf = (p) => CATS.find((c) => c.key === p.category) || CATS.find((c) => c.re.test(`${p.title} ${p.keywords || ''}`.toLowerCase()));
const readMins = (body) => Math.max(1, Math.round(String(body || '').split(/\s+/).length / 200));
const coverOf = (p) => (p.cover ? imgUrl(p.cover) : `/blog-cover/${p.slug}.svg`);
function wrap(text, max) {
  const out = []; let line = '';
  for (const w of String(text).split(/\s+/)) {
    if ((line + ' ' + w).trim().length > max && line) { out.push(line); line = w; } else line = (line + ' ' + w).trim();
  }
  if (line) out.push(line);
  return out;
}
function coverSvg(p, b64) {
  const c = catOf(p);
  let lines = wrap(p.title, 24);
  const size = lines.length > 3 ? 54 : 64;
  if (lines.length > 4) { lines = lines.slice(0, 4); lines[3] += '…'; }
  const top = 360 - (lines.length * size * 1.18) / 2;
  const t = lines.map((l, i) => `<text x="80" y="${(top + (i + 0.85) * size * 1.18).toFixed(0)}" font-family="Georgia, 'Playfair Display', serif" font-size="${size}" fill="#0d1526">${esc(l)}</text>`).join('');
  const photo = b64 ? `<image href="data:image/jpeg;base64,${b64}" x="0" y="0" width="1200" height="675" preserveAspectRatio="xMidYMid slice"/>` : `<rect width="1200" height="675" fill="#f3f1ec"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">
<defs><linearGradient id="w" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff" stop-opacity=".92"/><stop offset=".55" stop-color="#ffffff" stop-opacity=".55"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></linearGradient></defs>
${photo}<rect width="1200" height="675" fill="url(#w)"/>
<rect x="80" y="70" rx="18" width="${c.name.length * 13 + 44}" height="36" fill="${c.color}" fill-opacity=".14" stroke="${c.color}" stroke-opacity=".7"/>
<text x="102" y="94" font-family="Manrope, Arial, sans-serif" font-size="17" font-weight="700" letter-spacing="2" fill="${c.color}">${esc(c.name.toUpperCase())}</text>
${t}
<rect x="80" y="585" width="56" height="4" rx="2" fill="${c.color}"/>
<text x="80" y="625" font-family="Manrope, Arial, sans-serif" font-size="22" font-weight="700" fill="#0d1526">Navifex <tspan font-style="italic" fill="#2f7bff">Pro</tspan></text>
<text x="1120" y="625" text-anchor="end" font-family="Manrope, Arial, sans-serif" font-size="18" fill="#5b6b8a">navifexpro.com/blog</text></svg>`;
}
const bgOf = (p) => `/assets/img/blog-bg/${catOf(p).key}.jpg`;
async function bgB64(env, url, p) {
  try {
    const r = await env.ASSETS.fetch(new Request(new URL(bgOf(p), url)));
    if (!r.ok) return '';
    const buf = new Uint8Array(await r.arrayBuffer()); let s = '';
    for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
    return btoa(s);
  } catch (e) { return ''; }
}
function card(p, big) {
  const c = catOf(p);
  return `<a class="b-card${big ? ' b-feat' : ''}" href="/blog/${p.slug}" data-cat="${c.key}">
  <span class="b-img"><img src="${coverOf(p)}" alt="${esc(p.coverAlt || p.title)}" loading="${big ? 'eager' : 'lazy'}" decoding="async" width="1200" height="675"></span>
  <span class="b-in"><span class="b-tag" style="--c:${c.color}">${esc(c.name)}</span><h2>${esc(p.title)}</h2><p>${esc(p.excerpt)}</p>
  <span class="b-meta"><time datetime="${p.date}">${fmtDate(p.date)}</time> · ${readMins(p.body)} min read</span>${big ? '<span class="b-go">Read article →</span>' : ''}</span>
</a>`;
}

// ---------- pages ----------
async function template(env, url) {
  return env.ASSETS.fetch(new Request(new URL('/blog-template', url)));
}
function render(res, o) {
  const rw = new HTMLRewriter()
    .on('title', { element(e) { e.setInnerContent(o.title); } })
    .on('meta[name="description"]', { element(e) { e.setAttribute('content', o.desc); } })
    .on('meta[property="og:title"]', { element(e) { e.setAttribute('content', o.title); } })
    .on('meta[name="twitter:title"]', { element(e) { e.setAttribute('content', o.title); } })
    .on('meta[property="og:description"]', { element(e) { e.setAttribute('content', o.desc); } })
    .on('meta[name="twitter:description"]', { element(e) { e.setAttribute('content', o.desc); } })
    .on('meta[property="og:url"]', { element(e) { e.setAttribute('content', o.url); } })
    .on('link[rel="canonical"]', { element(e) { e.setAttribute('href', o.url); } })
    .on('meta[property="og:type"]', { element(e) { e.setAttribute('content', o.type || 'website'); } })
    .on('#bLd', { element(e) { e.setInnerContent(JSON.stringify(o.ld).replace(/</g, '\\u003c'), { html: true }); } })
    .on('#bCrumbs', { element(e) { e.setInnerContent(o.crumbs, { html: true }); } })
    .on('#bLabel', { element(e) { e.setInnerContent(o.label); } })
    .on('#bTitle', { element(e) { e.setInnerContent(o.h1, { html: !!o.h1Html }); } })
    .on('#bLead', { element(e) { e.setInnerContent(o.lead); } })
    .on('#bBody', { element(e) { e.setInnerContent(o.body, { html: true }); } });
  if (o.image) {
    rw.on('meta[property="og:image"]', { element(e) { e.setAttribute('content', o.image); } })
      .on('meta[name="twitter:image"]', { element(e) { e.setAttribute('content', o.image); } })
      .on('meta[property="og:image:width"]', { element(e) { e.remove(); } })
      .on('meta[property="og:image:height"]', { element(e) { e.remove(); } });
  }
  if (o.keywords) rw.on('meta[name="description"]', { element(e) { e.after(`<meta name="keywords" content="${esc(o.keywords)}">`, { html: true }); } });
  if (o.date) rw.on('meta[property="og:type"]', { element(e) { e.after(`<meta property="article:published_time" content="${esc(o.date)}">`, { html: true }); } });
  const out = rw.transform(res);
  const h = new Headers(out.headers);
  h.set('content-type', 'text/html; charset=utf-8');
  h.set('cache-control', 'public, max-age=120');
  return new Response(out.body, { status: o.status || 200, headers: h });
}

async function blogIndex(req, env, url) {
  const posts = env.BLOG_KV ? live(await load(env)) : [];
  const used = CATS.filter((c) => posts.some((p) => catOf(p) === c));
  const chips = `<div class="b-chips" role="tablist"><button class="on" data-f="all">All articles</button>${used.map((c) => `<button data-f="${c.key}" style="--c:${c.color}">${esc(c.name)}</button>`).join('')}</div>`;
  const body = posts.length
    ? `${card(posts[0], true)}${chips}<div class="blog-list" id="bList">${posts.slice(1).map((p) => card(p)).join('\n')}</div>
<script>document.addEventListener('click',function(e){var b=e.target.closest('.b-chips button');if(!b)return;var f=b.dataset.f;document.querySelectorAll('.b-chips button').forEach(function(x){x.classList.toggle('on',x===b)});document.querySelectorAll('#bList .b-card').forEach(function(c){c.hidden=f!=='all'&&c.dataset.cat!==f});var ft=document.querySelector('.b-feat');if(ft)ft.hidden=f!=='all'&&ft.dataset.cat!==f;});</script>`
    : '<p class="b-empty">New articles are coming soon.</p>';
  const title = 'Blog | Navifex Pro';
  const desc = 'Practical digital marketing tips for small businesses: social media, ads, SEO and websites, from the Navifex Pro team.';
  return render(await template(env, url), {
    title, desc, url: SITE + '/blog', label: 'Blog',
    crumbs: '<li><a href="/">Home</a></li><li aria-current="page">Blog</li>',
    h1: 'Marketing tips that bring <em>real customers.</em>', h1Html: true,
    lead: 'Simple, practical guides on social media, ads, SEO and websites for small businesses.',
    body,
    ld: { '@context': 'https://schema.org', '@type': 'Blog', '@id': SITE + '/blog#blog', url: SITE + '/blog', name: title, description: desc, publisher: { '@id': SITE + '/#org' },
      blogPost: posts.slice(0, 20).map((p) => ({ '@type': 'BlogPosting', headline: p.title, url: `${SITE}/blog/${p.slug}`, datePublished: p.date })) },
  });
}

async function blogPost(req, env, url, slug) {
  const p = env.BLOG_KV ? live(await load(env)).find((x) => x.slug === slug) : null;
  if (!p) return env.ASSETS.fetch(new Request(new URL('/404.html', url))).then((r) => new Response(r.body, { status: 404, headers: r.headers }));
  const postUrl = `${SITE}/blog/${p.slug}`;
  const image = p.cover ? SITE + imgUrl(p.cover) : SITE + bgOf(p);
  const tags = (p.keywords || '').split(',').map((t) => t.trim()).filter(Boolean);
  const c = catOf(p);
  const all = live(await load(env));
  const related = all.filter((x) => x !== p && catOf(x) === c).concat(all.filter((x) => x !== p && catOf(x) !== c)).slice(0, 3);
  const toc = String(p.body || '').split('\n').filter((l) => /^##\s+/.test(l.trim())).map((l) => l.trim().replace(/^##\s+/, ''));
  const body = `<article class="post">
  <img class="post-cover" src="${coverOf(p)}" alt="${esc(p.coverAlt || p.title)}" width="1200" height="675" fetchpriority="high">
  <p class="post-meta"><span class="b-tag" style="--c:${c.color}">${esc(c.name)}</span> By ${esc(p.author || 'Sufian Rasheed')} · <time datetime="${p.date}">${fmtDate(p.date)}</time> · ${readMins(p.body)} min read</p>
  ${toc.length > 2 ? `<nav class="post-toc" aria-label="In this article"><b>In this article</b><ol>${toc.map((h) => `<li><a href="#${slugify(h)}">${inline(h)}</a></li>`).join('')}</ol></nav>` : ''}
  <div class="post-body">${md(p.body)}</div>
  ${tags.length ? `<div class="post-tags">${tags.map((t) => `<span>${esc(t)}</span>`).join('')}</div>` : ''}
  <aside class="post-cta"><div><b>Want this done for your business?</b><p>Book a free 30-minute call. We'll look at where you are and suggest a simple plan.</p></div><a class="btn btn-primary" href="/contact#book"><span>Book a free call</span></a></aside>
</article>
${related.length ? `<section class="post-rel"><h2>Keep reading</h2><div class="blog-list">${related.map((x) => card(x)).join('')}</div><a class="post-back" href="/blog">← All articles</a></section>` : ''}`;
  return render(await template(env, url), {
    title: `${p.seoTitle || p.title} | Navifex Pro`, desc: p.excerpt, url: postUrl, type: 'article', image, keywords: p.keywords, date: p.date,
    label: 'Article', crumbs: `<li><a href="/">Home</a></li><li><a href="/blog">Blog</a></li><li aria-current="page">${esc(p.title)}</li>`,
    h1: p.title, lead: p.excerpt, body,
    ld: { '@context': 'https://schema.org', '@type': 'BlogPosting', '@id': postUrl + '#post', mainEntityOfPage: postUrl, url: postUrl, headline: p.title, description: p.excerpt,
      datePublished: p.date, dateModified: (p.updated || p.created || p.date).slice(0, 10), keywords: p.keywords || undefined, image: image || SITE + '/assets/og.jpg',
      author: { '@type': 'Person', name: p.author || 'Sufian Rasheed', url: 'https://sufianrasheed.com' }, publisher: { '@id': SITE + '/#org' }, isPartOf: { '@id': SITE + '/blog#blog' } },
  });
}

async function sitemap(env, url) {
  const res = await env.ASSETS.fetch(new Request(new URL('/sitemap.xml', url)));
  let xml = await res.text();
  if (env.BLOG_KV) {
    const posts = live(await load(env));
    const add = [`  <url><loc>${SITE}/blog</loc><lastmod>${posts[0] ? posts[0].date : today()}</lastmod></url>`]
      .concat(posts.map((p) => `  <url><loc>${SITE}/blog/${p.slug}</loc><lastmod>${(p.updated || p.date).slice(0, 10)}</lastmod></url>`)).join('\n');
    xml = xml.replace('</urlset>', add + '\n</urlset>');
  }
  return new Response(xml, { headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=600' } });
}

async function rss(env) {
  const posts = env.BLOG_KV ? live(await load(env)).slice(0, 30) : [];
  const items = posts.map((p) => `<item><title>${esc(p.title)}</title><link>${SITE}/blog/${p.slug}</link><guid>${SITE}/blog/${p.slug}</guid><pubDate>${new Date(p.date + 'T09:00:00+05:00').toUTCString()}</pubDate><description>${esc(p.excerpt)}</description></item>`).join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Navifex Pro Blog</title><link>${SITE}/blog</link><description>Digital marketing tips for small businesses</description>${items}</channel></rss>`,
    { headers: { 'content-type': 'application/rss+xml; charset=utf-8', 'cache-control': 'public, max-age=600' } });
}

// ---------- admin API ----------
async function readImage(file) {
  if (!file || typeof file === 'string' || !file.size) return null;
  if (!IMG_TYPES.includes(file.type)) throw new Error('Pictures must be JPG, PNG or WEBP.');
  if (file.size > MAX_IMG) throw new Error('Picture is too big (max 3 MB).');
  return { buf: await file.arrayBuffer(), type: file.type };
}

async function api(req, env, path) {
  const method = req.method;
  if (path === '/api/blog/status') return json({ ready: !!(env.BLOG_KV && env.ADMIN_PASSWORD), kv: !!env.BLOG_KV, password: !!env.ADMIN_PASSWORD, admin: await isAdmin(req, env), today: today() });
  if (path === '/api/blog/login' && method === 'POST') {
    if (!env.ADMIN_PASSWORD) return json({ error: 'The admin password is not set yet in Cloudflare.' }, 503);
    const b = await req.json().catch(() => ({}));
    if (!safeEqual(String(b.password || ''), env.ADMIN_PASSWORD)) { await new Promise((r) => setTimeout(r, 800)); return json({ error: 'Wrong password.' }, 401); }
    return json({ ok: true }, 200, { 'set-cookie': cookie(await makeToken(env), SESSION_DAYS * 86400) });
  }
  if (path === '/api/blog/logout') return json({ ok: true }, 200, { 'set-cookie': cookie('', 0) });
  if (path === '/api/blog/posts' && method === 'GET' && !(await isAdmin(req, env))) {
    // public list (for the Blogger cross-post and other tools)
    const posts = env.BLOG_KV ? live(await load(env)) : [];
    return json({ posts: posts.map(({ slug, title, excerpt, date, keywords }) => ({ slug, title, excerpt, date, keywords, url: `${SITE}/blog/${slug}` })) }, 200, { 'cache-control': 'public, max-age=120' });
  }
  if (!env.BLOG_KV) return json({ error: 'Storage (BLOG_KV) is not connected yet.' }, 503);
  if (!(await isAdmin(req, env))) return json({ error: 'Please log in.' }, 401);

  const list = await load(env);
  if (path === '/api/blog/posts' && method === 'GET') return json({ posts: list, today: today() });

  if (path === '/api/blog/post' && method === 'POST') {
    const f = await req.formData();
    const id = clean(f.get('id'), 40);
    let p = id ? list.find((x) => x.id === id) : null;
    if (id && !p) return json({ error: 'Post not found.' }, 404);
    const title = clean(f.get('title'), 140);
    const body = clean(f.get('body'), 60000);
    if (!title) return json({ error: 'Please add a title.' }, 400);
    if (body.length < 50) return json({ error: 'The article text is too short.' }, 400);
    let slug = slugify(f.get('slug') || title);
    if (!slug) return json({ error: 'Please add a web address (slug).' }, 400);
    let n = 2; const base = slug;
    while (list.some((x) => x.slug === slug && x !== p)) slug = `${base}-${n++}`;
    const excerpt = clean(f.get('excerpt'), 300) || plain(body).slice(0, 155);
    const date = /^\d{4}-\d{2}-\d{2}$/.test(f.get('date') || '') ? f.get('date') : today();
    let img; try { img = await readImage(f.get('cover')); } catch (e) { return json({ error: e.message }, 400); }
    if (!p) { p = { id: uid(), created: new Date().toISOString() }; list.push(p); }
    if (img) {
      if (p.cover) await env.BLOG_KV.delete('img:' + p.cover);
      p.cover = uid();
      await env.BLOG_KV.put('img:' + p.cover, img.buf, { metadata: { type: img.type } });
    } else if (f.get('removeCover') === '1' && p.cover) {
      await env.BLOG_KV.delete('img:' + p.cover); p.cover = '';
    }
    Object.assign(p, {
      title, slug, body, excerpt, date,
      seoTitle: clean(f.get('seoTitle'), 70), keywords: clean(f.get('keywords'), 300), coverAlt: clean(f.get('coverAlt'), 160),
      author: clean(f.get('author'), 60) || 'Sufian Rasheed', show: f.get('show') !== '0', updated: new Date().toISOString(),
    });
    await save(env, list);
    return json({ ok: true, post: p });
  }

  if (path === '/api/blog/action' && method === 'POST') {
    const b = await req.json().catch(() => ({}));
    const i = list.findIndex((x) => x.id === b.id);
    if (i < 0) return json({ error: 'Not found.' }, 404);
    if (b.op === 'delete') { if (list[i].cover) await env.BLOG_KV.delete('img:' + list[i].cover); list.splice(i, 1); }
    else if (b.op === 'toggle') list[i].show = !list[i].show;
    else return json({ error: 'Bad action.' }, 400);
    await save(env, list);
    return json({ ok: true });
  }
  return json({ error: 'Not found' }, 404);
}

async function image(env, id) {
  if (!env.BLOG_KV || !/^[a-z0-9]{6,30}$/.test(id)) return new Response('Not found', { status: 404 });
  const { value, metadata } = await env.BLOG_KV.getWithMetadata('img:' + id, 'arrayBuffer');
  if (!value) return new Response('Not found', { status: 404 });
  return new Response(value, { headers: { 'content-type': (metadata && metadata.type) || 'image/jpeg', 'cache-control': 'public, max-age=31536000, immutable' } });
}

// Single sign-on from the main admin (bot.navifexpro.com/admin). Works when both
// projects use the same ADMIN_PASSWORD. The link is valid for 60 seconds.
async function ssoOk(url, env) {
  const t = url.searchParams.get('sso');
  if (!t || !env.ADMIN_PASSWORD) return false;
  const [exp, sig] = t.split('.');
  const now = Date.now();
  if (!exp || !sig || +exp < now || +exp > now + 120e3) return false;
  return safeEqual(sig, await hmac(env.ADMIN_PASSWORD, 'sso|blog|' + exp));
}

// Wedding invitation site served on zeeshan.navifexpro.com from /zeeshan/ (static files).
const WEDDING_HOST = 'zeeshan.navifexpro.com';
function wedding(req, env, url) {
  const p = url.pathname;
  let to = null;
  if (p === '/' || p === '/all' || p === '/all/') to = '/zeeshan/all/';
  else if (p === '/mw' || p === '/mw/') to = '/zeeshan/mw/';
  else if (p === '/walima' || p === '/walima/') to = '/zeeshan/walima/';
  else if (p.startsWith('/w-assets/')) to = '/zeeshan' + p;
  if (!to) return new Response(null, { status: 302, headers: { Location: '/all' } });
  return env.ASSETS.fetch(new Request(new URL(to, url), req));
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    let path = url.pathname;
    if (url.hostname === WEDDING_HOST) return wedding(req, env, url);
    try {
      if (path.startsWith('/api/blog/')) return await api(req, env, path);
      if (req.method !== 'GET' && req.method !== 'HEAD') return new Response('Method not allowed', { status: 405 });
      if (path === '/blog/') return Response.redirect(SITE + '/blog', 301);
      if (path === '/blog') return await blogIndex(req, env, url);
      if (path === '/blog/feed.xml') return await rss(env);
      if (path.startsWith('/blog-img/')) return await image(env, path.slice(10));
      const cv = path.match(/^\/blog-cover\/([a-z0-9-]{1,90})\.svg$/);
      if (cv) {
        const p = env.BLOG_KV ? (await load(env)).find((x) => x.slug === cv[1]) : null;
        if (!p) return new Response('Not found', { status: 404 });
        return new Response(coverSvg(p, await bgB64(env, url, p)), { headers: { 'content-type': 'image/svg+xml; charset=utf-8', 'cache-control': 'public, max-age=86400' } });
      }
      const m = path.match(/^\/blog\/([a-z0-9-]{1,90})\/?$/);
      if (m) return await blogPost(req, env, url, m[1]);
      if (path === '/sitemap.xml') return await sitemap(env, url);
      // One admin for everything (17 Nov 2026): the blog editor moved into the main admin.
      if (path === '/blog-admin' || path === '/blog-admin/' || path === '/blog-admin.html') {
        return new Response(null, { status: 302, headers: { Location: 'https://bot.navifexpro.com/admin/blog', 'Cache-Control': 'no-store', 'x-robots-tag': 'noindex, nofollow' } });
      }
      if (path === '/blog-template' || path === '/blog-template.html') return new Response('Not found', { status: 404 });
      return env.ASSETS.fetch(req);
    } catch (e) {
      return json({ error: String((e && e.message) || e) }, 500);
    }
  },
};
