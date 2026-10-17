/* Navifex Pro — interactions (v2) */
(function(){
  var doc=document.documentElement;
  doc.classList.remove('js-off');
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduce) doc.classList.add('no-motion');
  var hasGSAP=!!window.gsap;
  if(hasGSAP && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
  var fine=window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  var motion=hasGSAP && !reduce;

  /* ---------- WhatsApp links: add page name so the message shows where they came from ---------- */
  var page=document.body.getAttribute('data-page')||'Website';
  document.querySelectorAll('a[data-wa]').forEach(function(a){
    var msg='Hi Navifex Pro! I found you on your website (navifexpro.com, '+page+' page). I would like a free consultation for my business.';
    a.href='https://wa.me/923130111349?text='+encodeURIComponent(msg);
    a.target='_blank'; a.rel='noopener';
  });

  /* ---------- Smooth scroll ---------- */
  var lenis=null;
  if(window.Lenis && !reduce){
    lenis=new Lenis({duration:1.15,smoothWheel:true,wheelMultiplier:.95});
    if(hasGSAP){ lenis.on('scroll',ScrollTrigger.update); gsap.ticker.add(function(t){lenis.raf(t*1000)}); gsap.ticker.lagSmoothing(0); }
    else { (function raf(t){lenis.raf(t);requestAnimationFrame(raf)})(0); }
    document.querySelectorAll('a[href^="#"]').forEach(function(a){a.addEventListener('click',function(e){var id=a.getAttribute('href');if(id.length>1&&document.querySelector(id)){e.preventDefault();lenis.scrollTo(id,{offset:-90});}});});
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
      if(lenis){ open?lenis.stop():lenis.start(); }
      document.body.style.overflow=open?'hidden':'';
    });
    document.querySelectorAll('.mobile-menu a').forEach(function(a,i){ a.style.transitionDelay=(0.05*i+0.1)+'s'; });
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
      if(s.closest('.shimmer')){ s.classList.add('ch'); return; }
      var t=s.textContent; s.textContent='';
      for(var i=0;i<t.length;i++){ var c=document.createElement('span'); c.className='ch'; c.textContent=t[i]; s.appendChild(c); }
    });
  }

  /* ---------- Hero intro ---------- */
  var heroDone=false;
  function animateHero(){
    if(heroDone) return; heroDone=true;
    if(window.NFX_GLOBE) window.NFX_GLOBE.reveal();
    if(!motion){ return; }
    var h=document.querySelector('[data-hero] h1');
    var tl=gsap.timeline({defaults:{ease:'power4.out'}});
    if(h){ splitChars(h);
      tl.fromTo(h.querySelectorAll('.ch'),{yPercent:115,rotate:6,opacity:0,filter:'blur(8px)'},{yPercent:0,rotate:0,opacity:1,filter:'blur(0px)',duration:1.1,stagger:.022},0); }
    tl.fromTo('[data-hero] .hero-in',{y:30,opacity:0},{y:0,opacity:1,duration:1,stagger:.1,ease:'power3.out'},.35);
    tl.fromTo('.globe-wrap',{opacity:0,scale:.9},{opacity:1,scale:1,duration:1.8,ease:'power3.out'},0);
    tl.fromTo('.orbit-chip',{opacity:0,y:20,scale:.8},{opacity:1,y:0,scale:1,duration:.9,stagger:.12,ease:'back.out(1.6)'},.9);
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
      var tl=gsap.timeline({onComplete:function(){loader.remove(); if(lenis) lenis.start();}});
      tl.set(loader.querySelectorAll('.ld-globe path, .ld-globe circle, .ld-globe ellipse'),{strokeDasharray:400,strokeDashoffset:400})
        .to(loader.querySelectorAll('.ld-globe path, .ld-globe circle, .ld-globe ellipse'),{strokeDashoffset:0,duration:1.5,stagger:.08,ease:'power2.inOut'},0)
        .fromTo(word.querySelectorAll('.ch'),{yPercent:120},{yPercent:0,duration:.8,stagger:.035,ease:'power4.out'},.25)
        .fromTo('.ld-tag',{opacity:0,y:10},{opacity:1,y:0,duration:.6},.7)
        .to(o,{v:100,duration:1.9,ease:'power2.inOut',onUpdate:function(){cnt.textContent=('00'+Math.round(o.v)).slice(-3);}},0)
        .to('.ld-line i',{scaleX:1,duration:1.9,ease:'power2.inOut'},0)
        .to('.ld-center',{scale:.92,opacity:0,filter:'blur(6px)',duration:.6,ease:'power2.in'},2.05)
        .to('.ld-panel.top',{yPercent:-100,duration:1,ease:'power4.inOut'},2.45)
        .to('.ld-panel.bot',{yPercent:100,duration:1,ease:'power4.inOut'},2.45)
        .add(animateHero,2.6);
      tl.timeScale(1.9); /* audit: shorter first-visit loader (~1.8s instead of ~3.4s) */
    }
  } else animateHero();

  /* ---------- Page transition ---------- */
  var curtain=document.querySelector('.curtain');
  if(curtain && motion){
    gsap.set(curtain,{yPercent:0});
    gsap.to(curtain,{yPercent:-100,duration:.6,ease:'power4.inOut',delay:0});
    gsap.to('.curtain .c2',{yPercent:-100,duration:.6,ease:'power4.inOut',delay:.06});
    document.addEventListener('click',function(e){
      var a=e.target.closest('a'); if(!a) return;
      var href=a.getAttribute('href');
      if(!href||a.target==='_blank'||href.charAt(0)==='#'||/^(mailto|tel|https?:)/.test(href)||e.metaKey||e.ctrlKey||e.shiftKey) return;
      e.preventDefault();
      gsap.set('.curtain .c2',{yPercent:0});
      gsap.fromTo(curtain,{yPercent:100},{yPercent:0,duration:.45,ease:'power4.inOut',onComplete:function(){location.href=href;}});
    });
    window.addEventListener('pageshow',function(ev){ if(ev.persisted) gsap.set(curtain,{yPercent:-100}); });
  } else if(curtain){ curtain.style.display='none'; }

  if(motion){
    /* section headings: word reveal */
    document.querySelectorAll('h2.split-in').forEach(function(h){
      splitWords(h);
      gsap.fromTo(h.querySelectorAll('.w>span'),{yPercent:110,rotate:4},{yPercent:0,rotate:0,duration:1.1,ease:'power4.out',stagger:.05,scrollTrigger:{trigger:h,start:'top 86%'}});
    });
    /* page hero h1 (non-home) */
    /* statement: words light up while scrolling */
    document.querySelectorAll('.statement p').forEach(function(p){
      splitWords(p);
      gsap.fromTo(p.querySelectorAll('.w>span'),{opacity:.12},{opacity:1,stagger:.08,ease:'none',scrollTrigger:{trigger:p,start:'top 80%',end:'bottom 45%',scrub:true}});
    });
    /* reveals */
    gsap.utils.toArray('.reveal').forEach(function(el){
      gsap.to(el,{opacity:1,y:0,duration:1.1,ease:'power3.out',delay:(+el.dataset.delay||0),scrollTrigger:{trigger:el,start:'top 90%'}});
    });
    /* image clip reveals */
    gsap.utils.toArray('.clip-reveal').forEach(function(el){
      gsap.fromTo(el,{clipPath:'inset(100% 0% 0% 0% round 20px)'},{clipPath:'inset(0% 0% 0% 0% round 20px)',duration:1.3,ease:'power4.out',scrollTrigger:{trigger:el,start:'top 88%'}});
      var img=el.querySelector('img'); if(img) gsap.fromTo(img,{scale:1.25},{scale:1,duration:1.6,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 88%'}});
    });
    /* parallax */
    gsap.utils.toArray('[data-speed]').forEach(function(el){
      gsap.to(el,{yPercent:-(+el.dataset.speed)*20,ease:'none',scrollTrigger:{trigger:el,start:'top bottom',end:'bottom top',scrub:true}});
    });
    /* funnel bars */
    gsap.utils.toArray('.f-bar i').forEach(function(b,i){
      gsap.from(b,{scaleX:0,duration:1.6,ease:'power3.out',delay:i*.14,scrollTrigger:{trigger:'.funnel',start:'top 80%'}});
    });
    /* counters */
    gsap.utils.toArray('[data-count]').forEach(function(el){
      var end=+el.dataset.count, o={v:0};
      gsap.to(o,{v:end,duration:2,ease:'power2.out',scrollTrigger:{trigger:el,start:'top 92%'},onUpdate:function(){el.textContent=Math.round(o.v).toLocaleString()+(el.dataset.suffix||'');}});
    });
    /* process steps */
    gsap.utils.toArray('.step').forEach(function(s){ ScrollTrigger.create({trigger:s,start:'top 62%',end:'bottom 38%',toggleClass:'on'}); });
    var line=document.querySelector('.steps-line i');
    if(line) gsap.fromTo(line,{scaleY:0},{scaleY:1,ease:'none',scrollTrigger:{trigger:'.steps',start:'top 60%',end:'bottom 60%',scrub:true}});
    /* big footer word */
    var fb=document.querySelector('.f-big');
    if(fb){ splitChars(fb); gsap.fromTo(fb.querySelectorAll('.ch'),{yPercent:100,opacity:0},{yPercent:0,opacity:1,stagger:.04,duration:1.2,ease:'power4.out',scrollTrigger:{trigger:fb,start:'top 95%'}}); }


    /* showcase: browser frame grows into view */
    var scf=document.querySelector('.sc-frame');
    if(scf){ gsap.fromTo(scf,{scale:.78,rotationX:14,y:40},{scale:1,rotationX:0,y:0,ease:'none',scrollTrigger:{trigger:'.sc-stage',start:'top 95%',end:'top 25%',scrub:1}});
      var sci=scf.querySelector('img'); if(sci) gsap.fromTo(sci,{yPercent:0},{yPercent:-6,ease:'none',scrollTrigger:{trigger:scf,start:'top bottom',end:'bottom top',scrub:true}}); }
    /* stacking cards shrink as the next one covers them */
    var sc=gsap.utils.toArray('.stack-card');
    sc.forEach(function(c,i){ if(i===sc.length-1) return;
      gsap.to(c,{scale:.92,filter:'brightness(.55)',ease:'none',scrollTrigger:{trigger:sc[i+1],start:'top 85%',end:'top 20%',scrub:true}}); });
    /* horizontal services (desktop) */
    var hs=document.querySelector('.hs');
    if(hs){
      ScrollTrigger.matchMedia({
        '(min-width: 981px)':function(){
          var track=hs.querySelector('.hs-track'), prog=hs.querySelector('.hs-progress i');
          var dist=function(){return track.scrollWidth-window.innerWidth+parseFloat(getComputedStyle(track).paddingLeft);};
          var tw=gsap.to(track,{x:function(){return -dist();},ease:'none',scrollTrigger:{trigger:hs,start:'top top',end:function(){return '+='+dist();},pin:true,scrub:1,invalidateOnRefresh:true,anticipatePin:1,
            onUpdate:function(s){ if(prog) prog.style.transform='scaleX('+s.progress+')'; }}});
          track.querySelectorAll('.hs-card').forEach(function(c){
            gsap.fromTo(c,{opacity:.35,scale:.94},{opacity:1,scale:1,ease:'none',scrollTrigger:{trigger:c,containerAnimation:tw,start:'left 95%',end:'left 55%',scrub:true}});
          });
        }
      });
    }

    /* marquee: speed + skew with scroll velocity */
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

  /* ---------- Card spotlight + 3D tilt ---------- */
  document.querySelectorAll('.card,.hs-card,.ind-card').forEach(function(c){
    c.addEventListener('pointermove',function(e){var r=c.getBoundingClientRect();c.style.setProperty('--mx',(e.clientX-r.left)+'px');c.style.setProperty('--my',(e.clientY-r.top)+'px');});
  });
  if(fine && motion){
    document.querySelectorAll('.tilt').forEach(function(c){
      var rx=gsap.quickTo(c,'rotationX',{duration:.6,ease:'power3'}), ry=gsap.quickTo(c,'rotationY',{duration:.6,ease:'power3'});
      gsap.set(c,{transformPerspective:900});
      c.addEventListener('pointermove',function(e){var r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5; rx(-y*9); ry(x*11);});
      c.addEventListener('pointerleave',function(){rx(0);ry(0);});
    });
  }


  /* ---------- Industries list: image follows the cursor ---------- */
  var fol=document.querySelector('.ind-follow');
  if(fol && fine && motion){
    var fimg=fol.querySelector('img'), fx=gsap.quickTo(fol,'x',{duration:.6,ease:'power3'}), fy=gsap.quickTo(fol,'y',{duration:.6,ease:'power3'}), last=0;
    document.querySelectorAll('.ind-row').forEach(function(r){
      r.addEventListener('mouseenter',function(){ fimg.src=r.getAttribute('data-img'); fol.classList.add('on'); gsap.to(fol,{opacity:1,scale:1,duration:.5,ease:'power3.out',overwrite:'auto'}); });
      r.addEventListener('mouseleave',function(){ gsap.to(fol,{opacity:0,scale:.6,duration:.4,ease:'power3.in'}); });
    });
    var shown=true; function hideFol(){ shown=false; gsap.to(fol,{opacity:0,scale:.6,duration:.25,ease:'power3.in',overwrite:'auto',onComplete:function(){ if(!shown) fol.classList.remove('on'); }}); }
    var lst=document.querySelector('.ind-list'); if(lst) lst.addEventListener('mouseleave',hideFol);
    window.addEventListener('pageshow',function(){ shown=false; fol.classList.remove('on'); gsap.set(fol,{opacity:0,scale:.6}); });
    document.addEventListener('visibilitychange',function(){ if(document.hidden) hideFol(); });
    window.addEventListener('pointermove',function(e){
      var dx=e.clientX-last; last=e.clientX; fx(e.clientX); fy(e.clientY); gsap.to(fol,{rotation:gsap.utils.clamp(-12,12,dx*.6),duration:.6});
      /* never let the preview linger over other sections (it covered the FAQ text) */
      var over=!!(e.target&&e.target.closest&&e.target.closest('.ind-row'));
      if(!over&&shown){ shown=false; gsap.to(fol,{opacity:0,scale:.6,duration:.3,ease:'power3.in',overwrite:'auto'}); }
      else if(over) shown=true;
    },{passive:true});
    window.addEventListener('scroll',function(){ if(shown){ shown=false; gsap.to(fol,{opacity:0,scale:.6,duration:.25,overwrite:'auto'}); } },{passive:true});
  }
  /* ---------- Custom cursor + magnetic (desktop only) ---------- */
  if(fine && motion){
    var cur=document.createElement('div'); cur.className='cursor'; cur.innerHTML='<span></span>';
    var dot=document.createElement('div'); dot.className='cursor-dot';
    var glow=document.createElement('div'); glow.className='cursor-glow';
    document.body.appendChild(glow); document.body.appendChild(cur); document.body.appendChild(dot);
    var xC=gsap.quickTo(cur,'x',{duration:.45,ease:'power3'}), yC=gsap.quickTo(cur,'y',{duration:.45,ease:'power3'});
    var xD=gsap.quickTo(dot,'x',{duration:.08}), yD=gsap.quickTo(dot,'y',{duration:.08});
    var xG=gsap.quickTo(glow,'x',{duration:1.2,ease:'power3'}), yG=gsap.quickTo(glow,'y',{duration:1.2,ease:'power3'});
    window.addEventListener('pointermove',function(e){doc.classList.add('cursor-on');xC(e.clientX);yC(e.clientY);xD(e.clientX);yD(e.clientY);xG(e.clientX);yG(e.clientY);});
    var lbl=cur.querySelector('span');
    document.querySelectorAll('a,button,summary,[data-cursor]').forEach(function(el){
      el.addEventListener('mouseenter',function(){var t=el.getAttribute('data-cursor'); cur.classList.add('hover'); if(t){cur.classList.add('label');lbl.textContent=t;}});
      el.addEventListener('mouseleave',function(){cur.classList.remove('hover','label');});
    });
    document.querySelectorAll('.magnetic').forEach(function(m){
      m.addEventListener('pointermove',function(e){var r=m.getBoundingClientRect();gsap.to(m,{x:(e.clientX-r.left-r.width/2)*.3,y:(e.clientY-r.top-r.height/2)*.4,duration:.4,ease:'power3'});});
      m.addEventListener('pointerleave',function(){gsap.to(m,{x:0,y:0,duration:.7,ease:'elastic.out(1,.4)'});});
    });
  }

  /* ---------- Ambient particle field (page heroes) ---------- */
  var cv=document.getElementById('particles');
  if(cv && !reduce){
    var ctx=cv.getContext('2d'), W,H,DPR=Math.min(window.devicePixelRatio||1,2), pts=[], mouse={x:-999,y:-999};
    function size(){W=cv.offsetWidth;H=cv.offsetHeight;cv.width=W*DPR;cv.height=H*DPR;ctx.setTransform(DPR,0,0,DPR,0,0);
      var n=Math.round(Math.min(70,W*H/20000)); pts=[];
      for(var i=0;i<n;i++) pts.push({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.3,vy:(Math.random()-.5)*.3,r:Math.random()*1.5+.5});}
    size(); window.addEventListener('resize',size);
    cv.parentElement.addEventListener('pointermove',function(e){var r=cv.getBoundingClientRect();mouse.x=e.clientX-r.left;mouse.y=e.clientY-r.top;});
    var visible=true;
    if('IntersectionObserver' in window){ new IntersectionObserver(function(en){visible=en[0].isIntersecting}).observe(cv); }
    (function loop(){
      requestAnimationFrame(loop); if(!visible) return;
      ctx.clearRect(0,0,W,H);
      for(var i=0;i<pts.length;i++){var p=pts[i];p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>W)p.vx*=-1;if(p.y<0||p.y>H)p.vy*=-1;
        var dxm=p.x-mouse.x,dym=p.y-mouse.y,dm=Math.sqrt(dxm*dxm+dym*dym); if(dm<120){p.x+=dxm/dm*.8;p.y+=dym/dm*.8;}
        ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,6.283);ctx.fillStyle='rgba(127,190,255,.6)';ctx.fill();
        for(var j=i+1;j<pts.length;j++){var q=pts[j],dx=p.x-q.x,dy=p.y-q.y,d=dx*dx+dy*dy;
          if(d<14000){ctx.strokeStyle='rgba(90,162,255,'+(0.15*(1-d/14000))+')';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();}}
      }
    })();
  }

  /* page-hero headings get the char reveal too */
  if(motion && !document.querySelector('.loader')){ /* handled in animateHero */ }

  /* ---------- Year ---------- */
  document.querySelectorAll('[data-year]').forEach(function(e){e.textContent=new Date().getFullYear();});
  window.addEventListener('load',function(){ if(window.ScrollTrigger) ScrollTrigger.refresh(); });
})();
