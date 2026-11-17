(function(){
  var S = window.SITE || {};
  var $ = function(s,r){return (r||document).querySelector(s)};
  var $$ = function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
  var body = document.body;

  /* ---- music ---- */
  var audio = new Audio(S.music);
  audio.loop = true; audio.preload = "auto"; audio.volume = 0;
  var mu = $(".fab-mu");
  function fadeTo(v){
    var step = function(){ var d = v - audio.volume;
      if (Math.abs(d) < .03){ audio.volume = v; if(v===0) audio.pause(); return; }
      audio.volume = Math.max(0, Math.min(1, audio.volume + (d>0?.03:-.03))); setTimeout(step, 60); };
    step();
  }
  function play(){ try{ var p = audio.play(); if(p&&p.catch) p.catch(function(){ mu.classList.add("off"); }); fadeTo(.7); mu.classList.remove("off"); }catch(e){ mu.classList.add("off"); } }
  mu.addEventListener("click", function(){
    if (audio.paused){ play(); } else { fadeTo(0); mu.classList.add("off"); }
  });

  /* ---- intro: curtains -> envelope -> open ---- */
  var intro = $("#intro"), env = $(".env");
  body.classList.add("locked");
  setTimeout(function(){ intro.classList.add("lit"); }, 150);
  setTimeout(function(){ intro.classList.add("parted"); }, 1900);
  setTimeout(function(){ env.classList.add("ready"); }, 3100);
  var opened = false;
  function openEnv(){
    if (opened) return; opened = true;
    play();
    env.classList.add("open");
    setTimeout(function(){ intro.classList.add("gone"); body.classList.remove("locked"); $(".hero").classList.add("show"); }, 2300);
    setTimeout(function(){ body.classList.add("ready-ui"); }, 3200);
  }
  $(".seal").addEventListener("click", openEnv);
  window.__stage = function(n){ // used for previews
    if (n>=1){ intro.classList.add("lit"); intro.classList.add("parted"); }
    if (n>=2) env.classList.add("ready");
    if (n>=3){ opened = true; env.classList.add("open"); }
    if (n>=4){ intro.style.display="none"; body.classList.remove("locked"); $(".hero").classList.add("show"); body.classList.add("ready-ui"); $$(".reveal").forEach(function(e){e.classList.add("in")}); }
  };

  /* ---- reveal on scroll ---- */
  if ("IntersectionObserver" in window){
    var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add("in"); io.unobserve(e.target);} }); }, {threshold:.15});
    $$(".reveal").forEach(function(e){ io.observe(e); });
  } else { $$(".reveal").forEach(function(e){ e.classList.add("in"); }); }

  /* ---- tabs active state ---- */
  var tabs = $$(".tabs a");
  if (tabs.length && "IntersectionObserver" in window){
    var to = new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){
      tabs.forEach(function(t){ t.classList.toggle("on", t.getAttribute("href")==="#"+e.target.id); }); } }); }, {rootMargin:"-45% 0px -50% 0px"});
    $$(".event").forEach(function(s){ to.observe(s); });
  }

  /* ---- countdown ---- */
  var target = new Date(S.first).getTime();
  var cd = $$(".count b");
  function tick(){
    var d = Math.max(0, target - Date.now());
    var v = [Math.floor(d/864e5), Math.floor(d/36e5)%24, Math.floor(d/6e4)%60, Math.floor(d/1e3)%60];
    cd.forEach(function(b,i){ b.textContent = (i? String(v[i]).padStart(2,"0") : v[i]); });
  }
  if (cd.length){ tick(); setInterval(tick, 1000); }

  /* ---- maps: live embed only on the real domain ---- */
  if (/navifexpro\.com$/.test(location.hostname)){
    $$(".map[data-embed]").forEach(function(m){
      var f = document.createElement("iframe"); f.loading="lazy"; f.referrerPolicy="no-referrer-when-downgrade";
      f.src = m.getAttribute("data-embed"); f.title = "Location map"; m.innerHTML = ""; m.appendChild(f);
    });
  }

  /* ---- RSVP ---- */
  var modal = $(".modal");
  $$("[data-rsvp]").forEach(function(b){ b.addEventListener("click", function(){ modal.classList.add("on"); }); });
  $(".x").addEventListener("click", function(){ modal.classList.remove("on"); });
  modal.addEventListener("click", function(e){ if(e.target===modal) modal.classList.remove("on"); });
  var form = $("#rsvpForm");
  form.addEventListener("submit", function(e){
    e.preventDefault();
    var fd = new FormData(form);
    var evs = fd.getAll("events");
    var data = { name: fd.get("name"), phone: fd.get("phone")||"", attending: fd.get("attending"),
      events: evs.join(", "), guests: fd.get("guests")||"", link: S.group, time: new Date().toISOString() };
    if (!data.name){ return; }
    var done = function(){ form.style.display="none"; $(".thanks").classList.add("on"); };
    if (S.rsvpUrl){
      fetch(S.rsvpUrl, {method:"POST", mode:"no-cors", headers:{"Content-Type":"text/plain"}, body: JSON.stringify(data)}).then(done, done);
    } else {
      var msg = "RSVP – Syed Zeeshan Haider's wedding%0AName: "+encodeURIComponent(data.name)+
        "%0A"+encodeURIComponent(data.attending)+(data.events?"%0AEvents: "+encodeURIComponent(data.events):"")+
        (data.guests?"%0AGuests: "+encodeURIComponent(data.guests):"");
      var a = document.createElement("a"); a.href = "https://wa.me/"+S.wa+"?text="+msg; a.target="_blank"; a.rel="noopener"; document.body.appendChild(a); a.click(); a.remove();
      done();
    }
  });
})();
