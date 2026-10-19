/* Navifex Pro — interactions (v12: cinematic globe story, shape-mask transitions) */
(function(){
  var doc=document.documentElement;
  doc.classList.remove('js-off');
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGSAP=!!(window.gsap&&window.ScrollTrigger); /* both needed; if either fails to load, fall back to a static page */
  if(hasGSAP) gsap.registerPlugin(ScrollTrigger);
  var fine=window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  var motion=hasGSAP && !reduce;
  doc.classList.add(motion?'js-motion':'no-motion');
  var mobile=function(){return window.innerWidth<900;};

  /* ---------- WhatsApp links: add page name so the message shows where they came from ---------- */
  var page=document.body.getAttribute('data-page')||'Website';
  document.querySelectorAll('a[data-wa]').forEach(function(a){
    var msg='Hi Navifex Pro! I found you on your website (navifexpro.com, '+page+' page). I would like a free consultation for my business.';
    a.href='https://wa.me/923130111349?text='+encodeURIComponent(msg);
    a.target='_blank'; a.rel='noopener';
  });

  /* ---------- Smooth scroll (Lenis) ---------- */
  var lenis=null;
  if(window.Lenis && !reduce){
    try{
      lenis=new Lenis({duration:1.1,smoothWheel:true,wheelMultiplier:.95,easing:function(t){return Math.min(1,1.001-Math.pow(2,-10*t));}});
      if(hasGSAP){ lenis.on('scroll',ScrollTrigger.update); gsap.ticker.add(function(t){lenis.raf(t*1000)}); gsap.ticker.lagSmoothing(0); }
      else { (function raf(t){lenis.raf(t);requestAnimationFrame(raf)})(0); }
      document.querySelectorAll('a[href^="#"]').forEach(function(a){a.addEventListener('click',function(e){var id=a.getAttribute('href');if(id.length>1&&document.querySelector(id)){e.preventDefault();lenis.scrollTo(id,{offset:-90});}});});
    }catch(e){ lenis=null; }
  }

  /* ---------- Header hide/show + scroll progress ---------- */
  var header=document.querySelector('.site-header'), lastY=0, bar=document.querySelector('.progress i');
  function onScroll(){
    var y=window.scrollY;
    if(header){
      header.classList.toggle('scrolled',y>30);
      if(!doc.classList.contains('menu-open')) header.classList.toggle('hide',y>lastY && y>500);
    }
    if(bar){ var h=document.documentElement.scrollHeight-innerHeight; bar.style.transform='scaleX('+(h>0?y/h:0)+')'; }
    lastY=y;
  }
  window.addEventListener('scroll',onScroll,{passive:true}); onScroll();

  /* ---------- Mobile menu ---------- */
  var burger=document.querySelector('.burger');
  if(burger){
    burger.addEventListener('click',function(){
      var open=doc.classList.toggle('menu-open');
      burger.setAttribute('aria-expanded',open);
      burger.setAttribute('aria-label',open?'Close menu':'Open menu');
      if(lenis){ open?lenis.stop():lenis.start(); }
      document.body.style.overflow=open?'hidden':'';
    });
    document.querySelectorAll('.mobile-menu a').forEach(function(a,i){ a.style.transitionDelay=(0.05*i+0.1)+'s'; });
    document.addEventListener('keydown',function(e){ if(e.key==='Escape'&&doc.classList.contains('menu-open')) burger.click(); });
  }

  /* ---------- Text splitting ---------- */
  function splitWords(el){
    if(el.dataset.split) return; el.dataset.split='1';
    (function walk(node){
      Array.prototype.slice.call(node.childNodes).forEach(function(n){
        if(n.nodeType===3){
          var frag=document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function(part){
            if(!part) return;
            if(/^\s+$/.test(part)){ frag.appendChild(document.createTextNode(' ')); return; }
            var w=document.createElement('span'); w.className='w';
            var i=document.createElement('span'); i.textContent=part; w.appendChild(i); frag.appendChild(w);
          });
          n.parentNode.replaceChild(frag,n);
        } else if(n.nodeType===1 && n.tagName!=='BR'){ walk(n); }
      });
    })(el);
    el.classList.add('split');
  }
  function splitChars(el){
    splitWords(el);
    el.querySelectorAll('.w>span').forEach(function(s){
      var t=s.textContent; s.textContent='';
      for(var i=0;i<t.length;i++){ var c=document.createElement('span'); c.className='ch'; c.textContent=t[i]; s.appendChild(c); }
    });
  }

  /* ---------- Hero intro (home + inner pages) ---------- */
  var heroDone=false;
  function animateHero(){
    if(heroDone) return; heroDone=true;
    (window.NFX_GX||(window.NFX_GX={})).introAt=1; if(window.NFX_GX_KICK) window.NFX_GX_KICK();
    if(!motion){ var a0=document.querySelector('.hx-agency'); if(a0) a0.classList.add('drawn'); return; }
    var hero=document.querySelector('[data-hero]'); if(!hero) return;
    var h=hero.querySelector('h1');
    var tl=gsap.timeline({defaults:{ease:'power4.out'}});
    if(h){ splitWords(h);
      if(h.classList.contains('hx-title')){
        var ag=h.querySelector('.hx-agency');
        tl.fromTo(h.querySelectorAll('.w>span'),{yPercent:70,rotateX:-85,opacity:0,transformOrigin:'50% 100% -40px'},{yPercent:0,rotateX:0,opacity:1,duration:1.3,stagger:.11},0.05);
        if(ag) tl.add(function(){ ag.classList.add('drawn'); },0.95);
      } else {
        tl.fromTo(h.querySelectorAll('.w>span'),{yPercent:110},{yPercent:0,duration:1.15,stagger:.07},0.05);
      } }
    tl.fromTo(hero.querySelectorAll('.hero-in'),{y:26,opacity:0},{y:0,opacity:1,duration:1,stagger:.09,ease:'power3.out'},.35);
    var hs=hero.querySelectorAll('.hx-services li');
    if(hs.length) tl.fromTo(hs,{y:14,opacity:0},{y:0,opacity:1,duration:.7,stagger:.04,ease:'power3.out'},.75);
    var sp=document.querySelector('.gx-spot');
    if(sp) tl.fromTo(sp,{opacity:0,scaleY:.6},{opacity:.9,scaleY:1,duration:2.2,ease:'power2.out'},0);
  }

  /* ---------- Loader (first visit per session) ---------- */
  var loader=document.querySelector('.loader');
  var seen=false; try{seen=sessionStorage.getItem('nfx-seen')==='1'}catch(e){}
  if(loader){
    if(seen||!motion){ loader.remove(); animateHero(); }
    else{
      try{sessionStorage.setItem('nfx-seen','1')}catch(e){}
      if(lenis) lenis.stop();
      var cnt=loader.querySelector('.ld-count b'), o={v:0};
      var word=loader.querySelector('.ld-word'); splitChars(word);
      var ltl=gsap.timeline({onComplete:function(){loader.remove(); if(lenis) lenis.start();}});
      ltl.set(loader.querySelectorAll('.ld-globe path, .ld-globe circle, .ld-globe ellipse'),{strokeDasharray:400,strokeDashoffset:400})
        .to(loader.querySelectorAll('.ld-globe path, .ld-globe circle, .ld-globe ellipse'),{strokeDashoffset:0,duration:1.5,stagger:.08,ease:'power2.inOut'},0)
        .fromTo(word.querySelectorAll('.ch'),{yPercent:120},{yPercent:0,duration:.8,stagger:.035,ease:'power4.out'},.25)
        .add(function(){ scramble(loader.querySelector('.ld-tag'),.9); },.6)
        .fromTo('.ld-tag',{opacity:0,y:10},{opacity:1,y:0,duration:.6},.7)
        .to(o,{v:100,duration:1.9,ease:'power2.inOut',onUpdate:function(){cnt.textContent=('00'+Math.round(o.v)).slice(-3);}},0)
        .to('.ld-line i',{scaleX:1,duration:1.9,ease:'power2.inOut'},0)
        .to('.ld-center',{scale:.94,opacity:0,duration:.6,ease:'power2.in'},2.05)
        .to('.ld-panel.top',{yPercent:-100,duration:1,ease:'power4.inOut'},2.45)
        .to('.ld-panel.bot',{yPercent:100,duration:1,ease:'power4.inOut'},2.45)
        .add(animateHero,2.5);
      ltl.timeScale(1.9);
    }
  } else animateHero();

  /* ---------- Page transition: dome mask lifts on enter, circle grows from the click on leave ---------- */
  var curtain=document.querySelector('.curtain');
  if(curtain && motion){
    var cIn=function(){ gsap.fromTo(curtain,{clipPath:'ellipse(150% 150% at 50% 0%)'},{clipPath:'ellipse(150% 0% at 50% 0%)',duration:.62,ease:'power3.inOut'});
      gsap.fromTo('.curtain img',{scale:1,opacity:1},{scale:.7,opacity:0,duration:.35,ease:'power2.in'}); };
    gsap.set(curtain,{yPercent:0}); gsap.set('.curtain .c2',{yPercent:0}); cIn();
    document.addEventListener('click',function(e){
      var a=e.target.closest('a'); if(!a||e.defaultPrevented) return;
      var href=a.getAttribute('href');
      if(!href||a.target==='_blank'||a.hasAttribute('download')||href.charAt(0)==='#'||/^(mailto|tel|https?:|javascript:)/.test(href)||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey) return;
      e.preventDefault();
      var x=(e.clientX||innerWidth/2)+'px '+(e.clientY||innerHeight/2)+'px';
      gsap.set('.curtain img',{scale:.7,opacity:0});
      gsap.fromTo(curtain,{clipPath:'circle(0% at '+x+')'},{clipPath:'circle(150% at '+x+')',duration:.5,ease:'power3.in',onComplete:function(){location.href=href;}});
      gsap.to('.curtain img',{scale:1,opacity:1,duration:.3,delay:.2});
    });
    window.addEventListener('pageshow',function(ev){ if(ev.persisted){ gsap.set(curtain,{clipPath:'ellipse(150% 0% at 50% 0%)'}); } });
  } else if(curtain){ curtain.style.display='none'; }

  /* ---------- Story: sticky stage that changes with each step (works without GSAP) ---------- */
  var stories=[].slice.call(document.querySelectorAll('[data-story]')).map(function(s){
    var stage=s.querySelector('.stage'), steps=[].slice.call(s.querySelectorAll('.story-step'));
    var dots=s.querySelector('.story-dots');
    if(dots){ steps.forEach(function(){ dots.appendChild(document.createElement('i')); }); }
    return {el:s,stage:stage,steps:steps,dots:dots?[].slice.call(dots.children):[],cur:-1,onStep:null};
  });
  function setStep(st,k){
    if(st.cur===k) return; st.cur=k;
    var n=st.steps.length;
    for(var i=1;i<=n;i++){ st.stage.classList.toggle('s'+i,i<=k); st.stage.classList.toggle('at'+i,i===k); }
    st.steps.forEach(function(x,i){ x.classList.toggle('on',i===k-1); });
    st.dots.forEach(function(x,i){ x.classList.toggle('on',i===k-1); });
    if(st.onStep) st.onStep(k);
  }
  var storyTick=false;
  function updateStories(){
    storyTick=false;
    stories.forEach(function(st){
      var r=st.el.getBoundingClientRect(); if(r.bottom<0||r.top>innerHeight) return;
      var sb=st.stage.getBoundingClientRect().bottom, line=mobile()?sb+(innerHeight-sb)*.62:innerHeight*.55;
      var k=1;
      st.steps.forEach(function(x,i){ if(x.getBoundingClientRect().top<line) k=i+1; });
      setStep(st,k);
    });
  }
  if(stories.length){
    stories.forEach(function(st){ setStep(st,1); });
    window.addEventListener('scroll',function(){ if(!storyTick){ storyTick=true; requestAnimationFrame(updateStories);} },{passive:true});
    window.addEventListener('resize',updateStories); updateStories();
  }
  /* home funnel: numbers count up as each row lights */
  stories.forEach(function(st){
    var vals=st.stage.querySelectorAll('[data-count]'); if(!vals.length) return;
    var done={};
    st.onStep=function(k){
      for(var i=1;i<=k;i++){ if(done[i]) continue; done[i]=1;
        var v=vals[i-1]; if(!v) continue;
        var end=+v.dataset.count;
        if(!motion){ v.textContent=end.toLocaleString(); continue; }
        (function(v,end){ var o={v:0}; gsap.to(o,{v:end,duration:1.2,ease:'power2.out',onUpdate:function(){v.textContent=Math.round(o.v).toLocaleString();}}); })(v,end);
      }
    };
    if(motion) vals.forEach(function(v){ v.textContent='0'; });
    st.cur=-1; updateStories();
  });

  if(motion){
    /* section headings: word reveal */
    document.querySelectorAll('h2.split-in').forEach(function(h){
      splitWords(h);
      gsap.fromTo(h.querySelectorAll('.w>span'),{yPercent:110},{yPercent:0,duration:1.1,ease:'power4.out',stagger:.05,scrollTrigger:{trigger:h,start:'top 88%'}});
    });
    /* statements: words light up while scrolling */
    document.querySelectorAll('.statement p,[data-lightup]').forEach(function(p){
      splitWords(p);
      gsap.fromTo(p.querySelectorAll('.w>span'),{opacity:.16},{opacity:1,stagger:.08,ease:'none',scrollTrigger:{trigger:p,start:'top 82%',end:'bottom 50%',scrub:true}});
    });
    /* reveals (batched so cards in a row stagger) */
    ScrollTrigger.batch('.reveal',{start:'top 90%',once:true,onEnter:function(els){
      gsap.to(els,{opacity:1,y:0,duration:1,ease:'power3.out',stagger:.08,overwrite:'auto'});
    }});
    /* hero hand-off: content drifts up and fades, globe rises (scrubbed) */
    var hx=document.querySelector('.hx');
    if(hx){
      gsap.to('.hx .wrap',{y:-90,opacity:0,ease:'none',scrollTrigger:{trigger:hx,start:'top top',end:'60% top',scrub:true}});
    }
    var ph=document.querySelector('.page-hero .wrap,.svc-hero .wrap');
    if(ph) gsap.to(ph,{y:-60,opacity:.15,ease:'none',scrollTrigger:{trigger:ph.parentNode,start:'top top',end:'bottom top',scrub:true}});
    /* stages: scale in as they arrive */
    gsap.utils.toArray('.story-stage .stage').forEach(function(s){
      gsap.fromTo(s,{scale:.9,opacity:.4},{scale:1,opacity:1,ease:'none',scrollTrigger:{trigger:s.closest('[data-story]'),start:'top 90%',end:'top 30%',scrub:true}});
    });
    /* timelines draw */
    gsap.utils.toArray('.tl3').forEach(function(t){
      var b=t.querySelector('.bar'); if(!b) return;
      gsap.to(b,{scaleX:1,scaleY:1,ease:'none',scrollTrigger:{trigger:t,start:'top 80%',end:'bottom 60%',scrub:true}});
    });
    /* image clip reveals */
    gsap.utils.toArray('.clip-reveal').forEach(function(el){
      gsap.fromTo(el,{clipPath:'inset(100% 0% 0% 0% round 20px)'},{clipPath:'inset(0% 0% 0% 0% round 20px)',duration:1.3,ease:'power4.out',scrollTrigger:{trigger:el,start:'top 88%'}});
    });
    /* parallax */
    gsap.utils.toArray('[data-speed]').forEach(function(el){
      gsap.to(el,{yPercent:-(+el.dataset.speed)*20,ease:'none',scrollTrigger:{trigger:el,start:'top bottom',end:'bottom top',scrub:true}});
    });
    /* samples: rows glide sideways with scroll */
    gsap.utils.toArray('.sm-row').forEach(function(r,i){
      var dist=function(){return Math.max(0,r.scrollWidth-innerWidth)+80;};
      gsap.fromTo(r,{x:function(){return i%2?-dist():0;}},{x:function(){return i%2?0:-dist();},ease:'none',scrollTrigger:{trigger:r.closest('section'),start:'top bottom',end:'bottom top',scrub:true,invalidateOnRefresh:true}});
    });
    /* flow: light each service in turn as the section scrolls */
    gsap.utils.toArray('.flow').forEach(function(f){
      var st=f.querySelectorAll('.st');
      ScrollTrigger.create({trigger:f,start:'top 75%',end:'bottom 35%',onUpdate:function(s){var k=Math.min(st.length-1,Math.floor(s.progress*st.length)); st.forEach(function(x,i){x.classList.toggle('on',i<=k);});},onLeave:function(){st.forEach(function(x){x.classList.add('on');});}});
    });
    /* funnel (legacy section, other pages) */
    (function(){
      var fn=document.querySelector('.funnel'); if(!fn) return;
      var rows=gsap.utils.toArray('.funnel .f-row'), chips=gsap.utils.toArray('.funnel .f-conv');
      gsap.set(fn.querySelectorAll('.f-bar i'),{scaleX:0}); gsap.set(chips,{opacity:0,scale:.6,y:-4});
      var tl=gsap.timeline({paused:true,defaults:{ease:'power3.out'}});
      rows.forEach(function(r,i){
        var bar=r.querySelector('.f-bar i'), v=r.querySelector('[data-count]'), o={v:0}, end=+v.dataset.count, at=i*.85;
        tl.to(bar,{scaleX:1,duration:1.1,onComplete:function(){r.classList.add('lit');}},at)
          .to(o,{v:end,duration:1.1,ease:'power2.out',onUpdate:function(){v.textContent=Math.round(o.v).toLocaleString();}},at)
          .fromTo(r,{opacity:.35},{opacity:1,duration:.4},at);
        if(chips[i]) tl.to(chips[i],{opacity:1,scale:1,y:0,duration:.45,ease:'back.out(2)'},at+.7);
      });
      tl.add(function(){ fn.classList.add('won'); });
      ScrollTrigger.create({trigger:fn,start:'top 75%',once:true,onEnter:function(){tl.play();}});
    })();
    /* counters */
    gsap.utils.toArray('[data-count]').forEach(function(el){ if(el.closest('.funnel,.stage')) return;
      var end=+el.dataset.count, o={v:0};
      gsap.to(o,{v:end,duration:2,ease:'power2.out',scrollTrigger:{trigger:el,start:'top 92%'},onUpdate:function(){el.textContent=Math.round(o.v).toLocaleString()+(el.dataset.suffix||'');}});
    });
    /* process steps (legacy list) */
    gsap.utils.toArray('.step').forEach(function(s){ ScrollTrigger.create({trigger:s,start:'top 62%',end:'bottom 38%',toggleClass:'on'}); });
    var line=document.querySelector('.steps-line i');
    if(line) gsap.fromTo(line,{scaleY:0},{scaleY:1,ease:'none',scrollTrigger:{trigger:'.steps',start:'top 60%',end:'bottom 60%',scrub:true}});
    /* big footer word */
    var fb=document.querySelector('.f-big');
    if(fb){ splitChars(fb); var fch=fb.querySelectorAll('.ch'); fch.forEach(function(c,i){c.style.setProperty('--i',i);});
      gsap.fromTo(fch,{yPercent:110,opacity:0,rotationX:-70},{yPercent:0,opacity:1,rotationX:0,stagger:.05,duration:1.2,ease:'power4.out',scrollTrigger:{trigger:fb,start:'top 96%',onEnter:function(){ setTimeout(function(){fb.classList.add('sweep');},700); }}}); }
    /* showcase: browser frame grows into view */
    var scf=document.querySelector('.sc-frame');
    if(scf){ gsap.fromTo(scf,{scale:.8,rotationX:16,y:40},{scale:1,rotationX:0,y:0,ease:'none',scrollTrigger:{trigger:'.sc-stage',start:'top 95%',end:'top 25%',scrub:1}});
      var sci=scf.querySelector('img'); if(sci) gsap.fromTo(sci,{yPercent:0},{yPercent:-6,ease:'none',scrollTrigger:{trigger:scf,start:'top bottom',end:'bottom top',scrub:true}}); }
    /* stacking cards (legacy) */
    var sc=gsap.utils.toArray('.stack-card');
    sc.forEach(function(c,i){ if(i===sc.length-1) return;
      gsap.to(c,{scale:.92,filter:'brightness(.55)',ease:'none',scrollTrigger:{trigger:sc[i+1],start:'top 85%',end:'top 20%',scrub:true}}); });
    /* horizontal services (legacy, desktop) */
    var hsx=document.querySelector('.hs');
    if(hsx){
      ScrollTrigger.matchMedia({'(min-width: 981px)':function(){
        var track=hsx.querySelector('.hs-track'), prog=hsx.querySelector('.hs-progress i');
        var dist=function(){return track.scrollWidth-window.innerWidth+parseFloat(getComputedStyle(track).paddingLeft);};
        gsap.to(track,{x:function(){return -dist();},ease:'none',scrollTrigger:{trigger:hsx,start:'top top',end:function(){return '+='+dist();},pin:true,scrub:1,invalidateOnRefresh:true,anticipatePin:1,onUpdate:function(s){ if(prog) prog.style.transform='scaleX('+s.progress+')'; }}});
      }});
    }
    /* marquee: speed + skew with scroll velocity (unchanged) */
    var rows=document.querySelectorAll('.marquee-row');
    if(rows.length){
      var tweens=[];
      rows.forEach(function(r,i){ var t=r.querySelector('.marquee-track');
        tweens.push(gsap.to(t,{xPercent:i%2?0:-50,startAt:{xPercent:i%2?-50:0},duration:40,ease:'none',repeat:-1})); });
      var skew=gsap.quickTo('.marquee-track','skewX',{duration:.5,ease:'power3'});
      ScrollTrigger.create({onUpdate:function(s){var v=s.getVelocity(); var k=gsap.utils.clamp(-8,8,v/300); skew(-k);
        tweens.forEach(function(t){ t.timeScale(1+Math.min(4,Math.abs(v)/600)); });}});
    }
  } else {
    document.querySelectorAll('[data-count]').forEach(function(el){el.textContent=(+el.dataset.count).toLocaleString()+(el.dataset.suffix||'');});
  }

  /* ---------- Card spotlight ---------- */
  document.querySelectorAll('.card,.hs-card,.ind-card,.sg-card,.it,.c-item').forEach(function(c){
    c.addEventListener('pointermove',function(e){var r=c.getBoundingClientRect();c.style.setProperty('--mx',(e.clientX-r.left)+'px');c.style.setProperty('--my',(e.clientY-r.top)+'px');});
  });
  if(fine && motion){
    document.querySelectorAll('.tilt,.sg-card,.card:not(.cf-wrap):not(.fx-card),.it,.wk-item .browser').forEach(function(c){
      c.style.transition='border-color .35s,background .35s,box-shadow .35s';
      var rx=gsap.quickTo(c,'rotationX',{duration:.6,ease:'power3'}), ry=gsap.quickTo(c,'rotationY',{duration:.6,ease:'power3'});
      gsap.set(c,{transformPerspective:900});
      c.addEventListener('pointermove',function(e){var r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5; rx(-y*9); ry(x*11);});
      c.addEventListener('pointerleave',function(){rx(0);ry(0);});
    });
  }

  /* ---------- Custom cursor + magnetic (desktop only) ---------- */
  if(fine && motion){
    var cur=document.createElement('div'); cur.className='cursor'; cur.innerHTML='<span></span>';
    var dot=document.createElement('div'); dot.className='cursor-dot';
    document.body.appendChild(cur); document.body.appendChild(dot);
    var xC=gsap.quickTo(cur,'x',{duration:.45,ease:'power3'}), yC=gsap.quickTo(cur,'y',{duration:.45,ease:'power3'});
    var xD=gsap.quickTo(dot,'x',{duration:.08}), yD=gsap.quickTo(dot,'y',{duration:.08});
    window.addEventListener('pointermove',function(e){doc.classList.add('cursor-on');xC(e.clientX);yC(e.clientY);xD(e.clientX);yD(e.clientY);});
    document.addEventListener('mouseleave',function(){doc.classList.remove('cursor-on');});
    var lbl=cur.querySelector('span');
    document.querySelectorAll('a,button,summary,[data-cursor]').forEach(function(el){
      el.addEventListener('mouseenter',function(){var t=el.getAttribute('data-cursor'); cur.classList.add('hover'); if(t){cur.classList.add('label');lbl.textContent=t;}});
      el.addEventListener('mouseleave',function(){cur.classList.remove('hover','label');});
    });
    document.querySelectorAll('.magnetic,.btn-primary').forEach(function(m){
      m.addEventListener('pointermove',function(e){var r=m.getBoundingClientRect();gsap.to(m,{x:(e.clientX-r.left-r.width/2)*.25,y:(e.clientY-r.top-r.height/2)*.35,duration:.4,ease:'power3',overwrite:'auto'});});
      m.addEventListener('pointerleave',function(){gsap.to(m,{x:0,y:0,duration:.7,ease:'elastic.out(1,.4)',overwrite:'auto'});});
    });
  }

  /* ---------- Ambient particle field (legacy page heroes; hidden in v10) ---------- */
  var cv=document.getElementById('particles');
  if(cv && !reduce && cv.offsetWidth>0){
    var ctx=cv.getContext('2d'), W,H,DPR=Math.min(window.devicePixelRatio||1,2), pts=[];
    function size(){W=cv.offsetWidth;H=cv.offsetHeight;cv.width=W*DPR;cv.height=H*DPR;ctx.setTransform(DPR,0,0,DPR,0,0);
      var n=Math.round(Math.min(70,W*H/20000)); pts=[];
      for(var i=0;i<n;i++) pts.push({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.3,vy:(Math.random()-.5)*.3,r:Math.random()*1.5+.5});}
    size(); window.addEventListener('resize',size);
    var visible=true;
    if('IntersectionObserver' in window){ new IntersectionObserver(function(en){visible=en[0].isIntersecting}).observe(cv); }
    (function loop(){
      requestAnimationFrame(loop); if(!visible) return;
      ctx.clearRect(0,0,W,H);
      for(var i=0;i<pts.length;i++){var p=pts[i];p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>W)p.vx*=-1;if(p.y<0||p.y>H)p.vy*=-1;
        ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,6.283);ctx.fillStyle='rgba(127,190,255,.6)';ctx.fill();}
    })();
  }

  /* ---------- Service mini scenes: play only while on screen ---------- */
  (function(){
    var cards=document.querySelectorAll('.sg-card'); if(!cards.length) return;
    if(!('IntersectionObserver' in window)){ cards.forEach(function(c){c.classList.add('play')}); return; }
    var io=new IntersectionObserver(function(es){ es.forEach(function(e){ e.target.classList.toggle('play',e.isIntersecting); }); },{threshold:.25});
    cards.forEach(function(c){ io.observe(c); });
  })();

  /* ---------- Cinematic globe story (home) ---------- */
  initGX();
  /* ---------- Site-wide motion language ---------- */
  if(motion) initMotionKit();

  /* ---------- Year ---------- */
  document.querySelectorAll('[data-year]').forEach(function(e){e.textContent=new Date().getFullYear();});
  window.addEventListener('load',function(){ if(hasGSAP) ScrollTrigger.refresh(); updateStories&&stories.length&&updateStories(); });
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(function(){ if(hasGSAP) ScrollTrigger.refresh(); });

  /* ---------- scramble/decode text (final text is the real HTML text) ---------- */
  function scramble(el,dur){
    if(!el||el.children.length||!motion) return;
    var fin=el.dataset.txt||(el.dataset.txt=el.textContent), chars='ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&*+', t0=performance.now(), D=(dur||.8)*1000;
    if(el._scr) cancelAnimationFrame(el._scr);
    (function step(now){
      var p=Math.min(1,(now-t0)/D), out='';
      for(var i=0;i<fin.length;i++){ var c=fin[i]; out+=(c===' '||i<p*fin.length)?c:chars[(Math.random()*chars.length)|0]; }
      el.textContent=out; if(p<1) el._scr=requestAnimationFrame(step); else { el.textContent=fin; el._scr=0; }
    })(t0);
  }

  function initGX(){
    var gx=document.querySelector('[data-gx]'); if(!gx) return;
    var S=window.NFX_GX||(window.NFX_GX={});
    'rise turn lahore arcT arcOp split labels tilt spin dive phone stream light pin drift fun count likes heart dm order'.split(' ').forEach(function(k){ if(S[k]==null) S[k]=0; });
    if(!motion) return;
    var track=gx.querySelector('.gx-track'), fx=gx.querySelector('.gx-fx'), hud=gx.querySelector('.gx-hud'), huds=hud?[].slice.call(hud.children):[];
    var chs=[].slice.call(gx.querySelectorAll('.gx-ch')), stage=gx.querySelector('.gx-stage'), hx=gx.querySelector('.hx');
    var pin=fx.querySelector('.gx-pin'), phone=fx.querySelector('.gx-phone'), likes=fx.querySelector('.gp-likes'), heart=fx.querySelector('.gp-heart'),
        dm=fx.querySelector('.gp-dm'), order=fx.querySelector('.gp-order'), fun=fx.querySelector('.gx-funnel'), nums=[].slice.call(fx.querySelectorAll('.gx-fl b'));
    chs.forEach(function(c){ var n=c.querySelector('.gx-num'); if(n&&n.lastChild&&n.lastChild.nodeType===3){ var sp=document.createElement('span'); sp.className='gx-sc'; sp.textContent=n.lastChild.textContent.trim(); n.replaceChild(sp,n.lastChild); n.insertBefore(document.createTextNode(' '),sp);} });
    var kick=function(){ if(window.NFX_GX_KICK) window.NFX_GX_KICK(); };
    window.addEventListener('scroll',function(){ S.scroll=window.scrollY; },{passive:true});
    var cur=-1;
    function chapter(i){ if(i===cur) return; cur=i; huds.forEach(function(h,k){h.classList.toggle('on',k===i);}); var c=chs[i-1]; if(c) scramble(c.querySelector('.gx-sc'),.6); }
    function paint(){
      fx.style.setProperty('--lo',S.labels.toFixed(3));
      pin.style.opacity=S.pin;
      var p=S.phone; phone.style.opacity=p; phone.style.visibility=p>0.001?'visible':'hidden';
      phone.style.transform='translate(-50%,-50%) translateY('+((1-p)*60).toFixed(1)+'px) scale('+(.86+.14*p).toFixed(3)+')';
      likes.textContent=Math.round(S.likes*1284).toLocaleString();
      heart.style.opacity=S.heart; heart.style.transform='translate(-50%,-50%) scale('+(S.heart*1.1).toFixed(3)+')';
      dm.style.opacity=S.dm; dm.style.transform='translateY('+((1-S.dm)*-24).toFixed(1)+'px)';
      order.style.opacity=S.order; order.style.transform='translateY('+((1-S.order)*24).toFixed(1)+'px) scale('+(.9+.1*S.order).toFixed(3)+')';
      fun.style.opacity=S.fun; nums.forEach(function(b){ b.textContent=Math.round(+b.dataset.to*S.count).toLocaleString(); });
      kick();
    }
    gsap.to(S,{rise:1,ease:'none',scrollTrigger:{trigger:hx,start:'top top',end:'bottom top',scrub:.8,onUpdate:function(st){ if(st.progress<.6) chapter(0); gsap.set(hud,{opacity:Math.max(0,st.progress*2-1)}); }},onUpdate:paint});
    var tl=gsap.timeline({defaults:{ease:'none'},onUpdate:paint,scrollTrigger:{trigger:track,start:'top top',end:'bottom bottom',scrub:.9,
      onUpdate:function(st){ var q=st.progress*100, i=q<20?1:q<41?2:q<61?3:q<82.5?4:5; chapter(i); }}});
    function T(k,a,b,at,d,ease){ var f={},t={duration:d,ease:ease||'none',immediateRender:false}; f[k]=a; t[k]=b; tl.fromTo(S,f,t,at); }
    T('turn',0,1,0,8,'power1.inOut'); T('lahore',0,1,5,4); T('pin',0,1,7,3);
    T('arcOp',0,1,8,2); T('arcT',0,1.5,8,11); T('drift',0,1,8,13,'power1.inOut'); T('pin',1,0,18,2); T('arcOp',1,0,19,3);
    T('lahore',1,0,20,3); T('tilt',0,1,21,6,'power2.inOut'); T('spin',0,6.2832,21,20,'power1.inOut'); T('split',0,1,24,6,'power2.inOut'); T('labels',0,1,28,3);
    T('labels',1,0,35,2); T('split',1,0,35,5,'power2.inOut'); T('tilt',1,0,36,5,'power2.inOut'); T('drift',1,0,36,5,'power1.inOut');
    T('lahore',0,1,41,2); T('dive',0,1,42,8,'power2.in'); T('phone',0,1,47,3,'power2.out'); T('likes',0,1,50,3,'power1.out'); T('heart',0,1,50.2,.8); T('heart',1,0,51.4,1.2);
    T('dm',0,1,53,1.5,'power2.out'); T('order',0,1,56,1.5,'back.out(1.6)'); T('phone',1,0,59,2,'power2.in'); T('dive',1,0,59.5,4,'power2.out'); T('lahore',1,0,60,2); T('dm',1,0,61,.2); T('order',1,0,61,.2); T('likes',1,0,61,.2);
    T('stream',0,1,62,10); T('fun',0,1,69,3); T('count',0,1,70,8,'power1.out'); T('fun',1,0,81,2);
    T('stream',1,0,82,8,'power1.inOut'); T('light',0,1,85,7,'power1.out'); T('count',1,0,90,.1);
    tl.set({},{},100);
    var win=[[1,19.5],[21,40.5],[42,60.5],[62,81.5],[84,101]];
    chs.forEach(function(c,i){
      var a=win[i][0], b=win[i][1], kids=c.children, last=i===chs.length-1;
      gsap.set(c,{autoAlpha:0}); gsap.set(kids,{opacity:0});
      tl.fromTo(c,{autoAlpha:0},{autoAlpha:1,duration:.5,immediateRender:false},a)
        .fromTo(kids,{y:46,opacity:0,filter:'blur(10px)'},{y:0,opacity:1,filter:'blur(0px)',duration:3,stagger:.7,ease:'power2.out',immediateRender:false},a);
      if(!last) tl.fromTo(kids,{y:0,opacity:1,filter:'blur(0px)'},{y:-46,opacity:0,filter:'blur(8px)',duration:2.4,stagger:.25,ease:'power2.in',immediateRender:false},b-3)
        .fromTo(c,{autoAlpha:1},{autoAlpha:0,duration:.3,immediateRender:false},b-.3);
    });
    /* exit: the stage folds into a rounded card as the story scrolls away */
    gsap.fromTo(stage,{clipPath:'inset(0% 0% 0% 0% round 0px)'},{clipPath:'inset(0% 3% 10% 3% round 40px)',ease:'none',immediateRender:false,scrollTrigger:{trigger:gx,start:'bottom bottom',end:'bottom 30%',scrub:true}});
    paint();
  }

  /* ---------- motion language for every page ---------- */
  function initMotionKit(){
    /* scroll progress ring + current section name */
    var chip=document.createElement('div'); chip.className='prog-chip'; chip.setAttribute('aria-hidden','true');
    chip.innerHTML='<svg viewBox="0 0 36 36"><circle cx="18" cy="18" r="15"/><circle class="pc-v" cx="18" cy="18" r="15"/></svg><span></span>';
    document.body.appendChild(chip);
    var ring=chip.querySelector('.pc-v'), nameEl=chip.querySelector('span'), curName='';
    var gxRoot=document.querySelector('[data-gx]'), gxOn=gxRoot&&gxRoot.querySelector('.gx-hud');
    var secs=[].slice.call(document.querySelectorAll('main > section, main > div:not([data-gx]) > section')).map(function(sec){
      var n=sec.getAttribute('data-name')||(sec.querySelector('.gx-num .gx-sc,.gx-num')||sec.querySelector('.label')||sec.querySelector('h2')||{}).textContent||'';
      if(sec.matches('[data-hero]')) n=document.body.getAttribute('data-page')||'Home';
      return {el:sec,n:n.replace(/\s+/g,' ').replace(/^\d+\s*/,'').trim().slice(0,28)};
    }).filter(function(x){return x.n;});
    ScrollTrigger.create({start:0,end:'max',onUpdate:function(st){
      ring.style.strokeDashoffset=(94.25*(1-st.progress)).toFixed(2);
      chip.classList.toggle('on',st.scroll()>innerHeight*.6);
      var n=''; for(var i=0;i<secs.length;i++){ var r=secs[i].el.getBoundingClientRect(); if(r.top<innerHeight*.5&&r.bottom>innerHeight*.5) n=secs[i].n; }
      if(gxRoot){ var gr=gxRoot.getBoundingClientRect(); if(gr.top<innerHeight*.5&&gr.bottom>innerHeight*.5){ var li=gxOn&&gxOn.querySelector('li.on'); n=li?li.textContent.replace(/^\d+/,'').trim():'Home'; } }
      if(n&&n!==curName){ curName=n; nameEl.textContent=n; nameEl.dataset.txt=n; scramble(nameEl,.45); }
    }});
    /* eyebrow labels decode in */
    document.querySelectorAll('.label').forEach(function(l){ if(l.children.length||l.closest('.cta-band')&&0) return;
      ScrollTrigger.create({trigger:l,start:'top 92%',once:true,onEnter:function(){ scramble(l,.7); }}); });
    /* dome mask: section rises in with a curved (globe-horizon) top edge */
    gsap.utils.toArray('.sg,.samples,.showcase,[data-dome]').forEach(function(sec){
      gsap.fromTo(sec,{clipPath:'ellipse(70% 100% at 50% 100%)'},{clipPath:'ellipse(160% 120% at 50% 100%)',ease:'none',scrollTrigger:{trigger:sec,start:'top bottom',end:'top 25%',scrub:true}});
    });
    /* CTA band: rounded inset mask opens */
    gsap.utils.toArray('.cta-band').forEach(function(b){
      gsap.fromTo(b,{clipPath:'inset(10% 12% 10% 12% round 32px)'},{clipPath:'inset(0% 0% 0% 0% round 32px)',ease:'none',scrollTrigger:{trigger:b,start:'top 95%',end:'top 45%',scrub:true}});
    });
    /* image mask reveals (screenshots / sample posts — never distorted, only masked) */
    gsap.utils.toArray('.wk-item .browser img,.ind-card .ph img,.about-visual,.post img').forEach(function(im){
      gsap.fromTo(im,{clipPath:'inset(0% 0% 100% 0%)'},{clipPath:'inset(0% 0% 0% 0%)',duration:1.3,ease:'power4.out',scrollTrigger:{trigger:im,start:'top 90%'}});
    });
    /* inner hero: horizon dome parallax */
    var hz=document.querySelector('.page-hero,.svc-hero');
    if(hz) gsap.fromTo(hz,{'--hz':0},{'--hz':1,ease:'none',scrollTrigger:{trigger:hz,start:'top top',end:'bottom top',scrub:true}});
    /* numbered items count/scramble in */
    document.querySelectorAll('.num,.svc .n,.step .sn').forEach(function(n){ if(n.children.length||n.hasAttribute('data-count')) return;
      ScrollTrigger.create({trigger:n,start:'top 92%',once:true,onEnter:function(){ scramble(n,.6); }}); });
  }
})();
