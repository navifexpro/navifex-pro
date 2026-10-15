/* Navifex partner kit: 2 posts (story 1080x1920, square 1080x1080) + 2 pitch messages (Roman Urdu, English).
   Usage: nvxKit(document.getElementById("kit"), {code:"NVX-AB12", link:"https://navifexpro.com/referral/NVX-AB12"}) */
(function () {
  var NAVY = "#0b1328", INK = "#101a33", BLUE = "#2f7bff", SKY = "#8cc0ff", PAPER = "#f4f1ea", MUTED = "#a9b6d3";
  var HF = '"Bricolage Grotesque",system-ui,sans-serif', BF = 'Manrope,system-ui,sans-serif', MF = '"JetBrains Mono",ui-monospace,monospace';

  function lines(x, text, maxW) {
    var words = text.split(" "), out = [], cur = "";
    words.forEach(function (w) { var t = cur ? cur + " " + w : w; if (x.measureText(t).width > maxW && cur) { out.push(cur); cur = w; } else cur = t; });
    out.push(cur); return out;
  }
  function para(x, text, X, y, maxW, font, color, lh) {
    x.font = font; x.fillStyle = color; var ls = lines(x, text, maxW);
    ls.forEach(function (l, i) { x.fillText(l, X, y + i * lh); }); return y + ls.length * lh;
  }
  function rr(x, X, Y, w, h, r) { x.beginPath(); if (x.roundRect) x.roundRect(X, Y, w, h, r); else x.rect(X, Y, w, h); }

  // light paper-like noise so it doesn't look like a flat template
  function grain(x, W, H) {
    var n = Math.floor(W * H / 900);
    for (var i = 0; i < n; i++) { x.fillStyle = "rgba(255,255,255," + (Math.random() * 0.035) + ")"; x.fillRect(Math.random() * W, Math.random() * H, 2, 2); }
  }

  // the "coupon" card: tilted, with punched holes, like a real ticket
  function ticket(x, cx, cy, w, h, code) {
    x.save(); x.translate(cx, cy); x.rotate(-0.035);
    x.fillStyle = "rgba(0,0,0,.35)"; rr(x, -w / 2 + 10, -h / 2 + 14, w, h, 26); x.fill();
    x.fillStyle = PAPER; rr(x, -w / 2, -h / 2, w, h, 26); x.fill();
    x.fillStyle = NAVY; x.beginPath(); x.arc(-w / 2, 0, 28, 0, Math.PI * 2); x.arc(w / 2, 0, 28, 0, Math.PI * 2); x.fill();
    x.setLineDash([14, 12]); x.strokeStyle = "rgba(11,19,40,.25)"; x.lineWidth = 4; x.beginPath(); x.moveTo(-w / 2 + 50, 0); x.lineTo(w / 2 - 50, 0); x.stroke(); x.setLineDash([]);
    x.textAlign = "center";
    x.fillStyle = BLUE; x.font = "800 " + Math.round(h * 0.27) + "px " + HF; x.fillText("5% OFF", 0, -h * 0.13);
    x.fillStyle = "#56607a"; x.font = "600 " + Math.round(h * 0.085) + "px " + BF; x.fillText("mera code use karein", 0, h * 0.17);
    x.fillStyle = NAVY; x.font = "700 " + Math.round(h * 0.17) + "px " + MF; x.fillText(code, 0, h * 0.38);
    x.restore();
  }

  function base(W, H) {
    var c = document.createElement("canvas"); c.width = W; c.height = H; var x = c.getContext("2d");
    x.fillStyle = NAVY; x.fillRect(0, 0, W, H);
    x.fillStyle = INK; x.fillRect(0, H * (H > W ? 0.66 : 0.62), W, H);
    grain(x, W, H);
    // header
    x.textAlign = "left"; x.fillStyle = BLUE; rr(x, 80, 76, 34, 34, 8); x.fill();
    x.font = "800 34px " + HF; x.fillStyle = "#fff"; x.fillText("NAVIFEX PRO", 132, 104);
    x.textAlign = "right"; x.font = "600 28px " + BF; x.fillStyle = MUTED; x.fillText("Lahore · Pakistan", W - 80, 104);
    x.textAlign = "left";
    return { c: c, x: x };
  }

  function story(code, link) {
    var W = 1080, H = 1920, b = base(W, H), x = b.x;
    var y = para(x, "Customer aap ko online dhoond raha hai.", 80, 330, 900, "800 96px " + HF, "#ffffff", 104);
    y = para(x, "Kya wo aap tak pohanch raha hai?", 80, y + 16, 900, "800 66px " + HF, SKY, 78);
    // hand-drawn style underline
    x.strokeStyle = BLUE; x.lineWidth = 9; x.lineCap = "round"; x.beginPath(); x.moveTo(84, y - 34); x.quadraticCurveTo(420, y - 10, 760, y - 40); x.stroke();
    y += 60;
    var pts = ["Website jo order laaye", "Social media jo zinda lage", "Ads jo sahi logon tak jayein", "AI chatbot jo raat ko bhi reply kare"];
    pts.forEach(function (p) { x.fillStyle = BLUE; x.fillRect(84, y - 26, 34, 8); x.font = "600 46px " + BF; x.fillStyle = "#dfe7f7"; x.fillText(p, 140, y); y += 76; });
    ticket(x, W / 2, 1450, 840, 320, code);
    x.textAlign = "center";
    x.font = "700 44px " + BF; x.fillStyle = "#fff"; x.fillText("Pehli consultation free", W / 2, 1700);
    x.font = "600 38px " + MF; x.fillStyle = SKY; x.fillText(link.replace(/^https?:\/\//, ""), W / 2, 1770);
    x.font = "600 36px " + BF; x.fillStyle = MUTED; x.fillText("WhatsApp: 0313 0111349", W / 2, 1835);
    return b.c;
  }

  function square(code, link) {
    var W = 1080, H = 1080, b = base(W, H), x = b.x;
    var y = para(x, "Customer aap ko online dhoond raha hai.", 80, 250, 920, "800 76px " + HF, "#ffffff", 84);
    y = para(x, "Website, social media, ads, SEO aur AI chatbots: ek hi team.", 80, y + 14, 900, "600 38px " + BF, "#c9d5ee", 50);
    ticket(x, W / 2, 735, 760, 270, code);
    x.textAlign = "center";
    x.font = "600 32px " + MF; x.fillStyle = SKY; x.fillText(link.replace(/^https?:\/\//, ""), W / 2, 945);
    x.font = "600 30px " + BF; x.fillStyle = MUTED; x.fillText("Free consultation · WhatsApp 0313 0111349", W / 2, 1000);
    return b.c;
  }

  function msgs(code, link) {
    return {
      ur: "Ek seedha sawal: jab koi aap ka business Google ya Instagram par dhoondta hai, to use kya nazar aata hai? 🤔\n\n" +
        "Aaj kal log khareedne ya shop par aane se pehle phone par check karte hain. Wahan kuch strong na mile to wo agle business par chale jaate hain.\n\n" +
        "Navifex Pro (Lahore) yehi kaam karti hai: website, social media, Meta/Google ads, SEO aur AI chatbots. Pehli consultation free hai, aur wo sirf wohi suggest karte hain jo aap ke business ko waqai chahiye.\n\n" +
        "Mere code se aap ko 5% OFF milega:\nCode: " + code + "\nLink: " + link + "\n\nLink kholein, ya WhatsApp 0313 0111349 par yeh code bata dein.",
      en: "Quick question: when someone searches for your business on Google or Instagram, what do they find? 🤔\n\n" +
        "Most people check online before they buy or visit. If nothing convincing shows up, they move on to the next business.\n\n" +
        "Navifex Pro (Lahore) handles exactly this: websites, social media, Meta/Google ads, SEO and AI chatbots. The first consultation is free, and they only suggest what your business actually needs.\n\n" +
        "Use my code for 5% OFF:\nCode: " + code + "\nLink: " + link + "\n\nOpen the link, or WhatsApp 0313 0111349 and mention the code."
    };
  }

  function ready() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    return Promise.all(['800 100px "Bricolage Grotesque"', '600 40px Manrope', '700 40px Manrope', '700 60px "JetBrains Mono"', '600 30px "JetBrains Mono"'].map(function (f) { return document.fonts.load(f).catch(function () {}); }));
  }
  function txtUrl(t) { return URL.createObjectURL(new Blob([t], { type: "text/plain;charset=utf-8" })); }
  function copy(text, btn) {
    var done = function () { var o = btn.textContent; btn.textContent = "Copied ✓"; setTimeout(function () { btn.textContent = o; }, 1500); };
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, function () { fallback(); });
    else fallback();
    function fallback() { var t = document.createElement("textarea"); t.value = text; document.body.appendChild(t); t.select(); try { document.execCommand("copy"); } catch (e) {} t.remove(); done(); }
  }

  var CSS = ".kit-g{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:18px;margin-top:14px}" +
    ".kit-c{background:#081022;border:1px solid var(--line,#1e2a44);border-radius:18px;padding:16px;text-align:center}" +
    ".kit-c img{width:100%;max-width:260px;border-radius:12px;border:1px solid var(--line,#1e2a44);display:block;margin:8px auto 12px}" +
    ".kit-c h4{margin:0;font-size:16px;color:#fff}.kit-c small{color:var(--muted,#93a1bd)}" +
    ".kit-m{background:#081022;border:1px solid var(--line,#1e2a44);border-radius:18px;padding:16px;text-align:left}" +
    ".kit-m pre{white-space:pre-wrap;font:14px/1.55 Manrope,system-ui,sans-serif;color:#dfe7f7;margin:10px 0 12px;max-height:300px;overflow:auto}" +
    ".kit-row{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}.kit-m .kit-row{justify-content:flex-start}" +
    ".kit-row .btn{padding:10px 16px;font-size:14px}";

  window.nvxKit = function (root, o) {
    if (!root || !o || !o.code) return;
    if (!document.getElementById("kit-css")) { var s = document.createElement("style"); s.id = "kit-css"; s.textContent = CSS; document.head.appendChild(s); }
    var code = o.code, link = o.link || ("https://navifexpro.com/referral/" + code), m = msgs(code, link);
    root.innerHTML =
      '<h3 style="margin:0;font-family:var(--f-head)">Your partner kit</h3>' +
      '<p class="hint" style="color:var(--muted)">Post it on your WhatsApp status, Instagram story or feed, and send the message to business owners you know.</p>' +
      '<div class="kit-g">' +
      '<div class="kit-c"><h4>Story post</h4><small>1080 × 1920 · status / story</small><img data-k="st" alt="Story post with your code"><div class="kit-row"><a class="btn btn-primary" data-d="st" href="#">Download</a><button type="button" class="btn btn-ghost" data-s="st" style="display:none">Share</button></div></div>' +
      '<div class="kit-c"><h4>Square post</h4><small>1080 × 1080 · feed / Facebook</small><img data-k="sq" alt="Square post with your code"><div class="kit-row"><a class="btn btn-primary" data-d="sq" href="#">Download</a><button type="button" class="btn btn-ghost" data-s="sq" style="display:none">Share</button></div></div>' +
      '</div><div class="kit-g">' +
      '<div class="kit-m"><h4 style="margin:0;color:#fff">Message: Roman Urdu</h4><pre data-m="ur"></pre><div class="kit-row"><button type="button" class="btn btn-primary" data-c="ur">Copy</button><a class="btn btn-ghost" data-t="ur" href="#">Download .txt</a><a class="btn btn-ghost" data-w="ur" target="_blank" rel="noopener" href="#">Send on WhatsApp</a></div></div>' +
      '<div class="kit-m"><h4 style="margin:0;color:#fff">Message: English</h4><pre data-m="en"></pre><div class="kit-row"><button type="button" class="btn btn-primary" data-c="en">Copy</button><a class="btn btn-ghost" data-t="en" href="#">Download .txt</a><a class="btn btn-ghost" data-w="en" target="_blank" rel="noopener" href="#">Send on WhatsApp</a></div></div>' +
      '</div>';
    var q = function (s) { return root.querySelector(s); };
    ["ur", "en"].forEach(function (k) {
      q('[data-m="' + k + '"]').textContent = m[k];
      q('[data-c="' + k + '"]').onclick = function () { copy(m[k], this); };
      var t = q('[data-t="' + k + '"]'); t.href = txtUrl(m[k]); t.download = "navifex-" + code + "-message-" + (k === "ur" ? "roman-urdu" : "english") + ".txt";
      q('[data-w="' + k + '"]').href = "https://wa.me/?text=" + encodeURIComponent(m[k]);
    });
    ready().then(function () {
      [["st", story(code, link), "story"], ["sq", square(code, link), "square"]].forEach(function (p) {
        var k = p[0], c = p[1], name = "navifex-" + code + "-" + p[2] + ".png", url = c.toDataURL("image/png");
        q('[data-k="' + k + '"]').src = url; var d = q('[data-d="' + k + '"]'); d.href = url; d.download = name;
        c.toBlob(function (b) {
          var f = new File([b], name, { type: "image/png" }), sb = q('[data-s="' + k + '"]');
          if (navigator.canShare && navigator.canShare({ files: [f] })) { sb.style.display = ""; sb.onclick = function () { navigator.share({ files: [f], text: m.ur }).catch(function () {}); }; }
        });
      });
    });
  };
})();
