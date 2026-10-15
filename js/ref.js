/* Navifex referral: remembers ?ref=NVX-XXXX for 60 days and adds
   "(Referral code: NVX-XXXX – Partner Name – 5% OFF)" to every WhatsApp link
   that goes to Navifex (wa.me/923130111349), including links added later (chat bots). */
(function () {
  if (window.__nvxRefWa) return;
  window.__nvxRefWa = 1;
  var NUM = "923130111349", API = "https://bot.navifexpro.com/api/ref-name/";
  var st = null;
  try {
    var q = new URLSearchParams(location.search).get("ref");
    var old = JSON.parse(localStorage.getItem("nvx_ref") || "null");
    if (q && /^NVX-[A-Za-z0-9]{4}$/.test(q)) {
      q = q.toUpperCase();
      st = { c: q, t: Date.now(), n: old && old.c === q ? old.n || "" : "" };
      localStorage.setItem("nvx_ref", JSON.stringify(st));
    } else if (old && old.c && Date.now() - old.t < 60 * 864e5) st = old;
  } catch (e) {}
  if (!st) return;

  function line() { return "(Referral code: " + st.c + (st.n ? " – " + st.n : "") + " – 5% OFF)"; }
  function fix(a) {
    try {
      var u = new URL(a.href);
      if (!/(^|\.)wa\.me$/.test(u.hostname) || u.pathname.replace(/\//g, "") !== NUM) return;
      if (st.bad) return;
      var tx = u.searchParams.get("text") || "Hi Navifex Pro!";
      tx = tx.replace(/\s*\(Referral code:[^)]*\)\s*$/, "");
      var nh = "https://wa.me/" + NUM + "?text=" + encodeURIComponent(tx + "\n" + line());
      if (a.href !== nh) a.href = nh;
    } catch (e) {}
  }
  function all() { document.querySelectorAll('a[href*="wa.me/"]').forEach(fix); }
  document.addEventListener("click", function (e) { var a = e.target.closest && e.target.closest('a[href*="wa.me/"]'); if (a) fix(a); }, true);
  window.nvxRefLine = function (text) { if (st.bad) return String(text || ""); var t = String(text || "").replace(/\s*\(Referral code:[^)]*\)\s*$/, ""); return t + "\n" + line(); };
  window.nvxRef = st;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", all); else all();
  setTimeout(all, 1500);
  if (!st.n || Date.now() - (st.nt || 0) > 864e5) {
    fetch(API + st.c).then(function (r) { return r.json(); }).then(function (d) {
      if (d && d.active && d.name) { st.n = d.name; st.nt = Date.now(); }
      else if (d && d.active === false) { try { localStorage.removeItem("nvx_ref"); } catch (e) {} st.bad = 1; window.nvxRef = null;
        document.querySelectorAll('a[href*="wa.me/"]').forEach(function (a) { try { var u = new URL(a.href), t = u.searchParams.get("text"); if (t && /\(Referral code:/.test(t)) { u.searchParams.set("text", t.replace(/\s*\(Referral code:[^)]*\)\s*$/, "")); a.href = u.toString(); } } catch (e) {} });
        return; }
      try { localStorage.setItem("nvx_ref", JSON.stringify(st)); } catch (e) {}
      all();
    }).catch(function () {});
  }
})();
