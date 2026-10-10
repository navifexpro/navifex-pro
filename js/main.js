/* Navifex Pro — interactions */
(function(){
  var doc=document.documentElement;
  doc.classList.remove('js-off');
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduce) doc.classList.add('no-motion');
  var hasGSAP=!!window.gsap;
  if(hasGSAP && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  /* ---------- WhatsApp links: add page name so the message shows where they came from ---------- */
  var page=document.body.getAttribute('data-page')||'Website';
  document.querySelectorAll('a[data-wa]').forEach(function(a){
    var msg='Hi Navifex Pro! I found you on your website (navifexpro.com — '+page+' page). I would like a free consultation for my business.';
    a.href='https://wa.me/923130111349?text='+encodeURIComponent(msg);
    a.target='_blank'; a.rel='noopener';
  });

  /* ---------- Smooth scroll ---------- */
  var lenis=null;
  if(window.Lenis && !reduce){
    lenis=new Lenis({duration:1.1,smoothWheel:true});
    if(hasGSAP){ lenis.on('scroll',ScrollTrigger.update); gsap.ticker.add(function(t){lenis.raf(t*1000)}); gsap.ticker.lagSmoothing(0); }
    else { (function raf(t){lenis.raf(t);requestAnimationFrame(raf)})(0); }
  }

  /* ---------- Header hide/show ---------- */
  var header=document.querySelector('.site-header'), lastY=0;
  function onScroll(){
    var y=window.scrollY;
    if(header){
      header.classList.toggle('scrolled',y>30);
      if(!doc.classList.contains('menu-open')) header.classList.toggle('hide',y>lastY && y>400);
    }
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

  /* ---------- Preloader ---------- */
  var pre=document.querySelector('.preloader');
  var seen=false; try{seen=sessionStorage.getItem('nfx-seen')==='1'}catch(e){}
  function introDone(){ animateHero(); }
  if(pre){
    if(seen||reduce||!hasGSAP){ pre.remove(); introDone(); }
    else{
      try{sessionStorage.setItem('nfx-seen','1')}catch(e){}
      var tl=gsap.timeline({onComplete:function(){pre.remove();}});
      tl.from('.preloader img',{scale:.6,opacity:0,duration:.7,ease:'back.out(1.6)'})
        .from('.preloader .pl-name',{y:14,opacity:0,duration:.5},'-=.3')
        .to('.preloader .pl-bar i',{width:'100%',duration:.9,ease:'power2.inOut'},'-=.2')
        .to(pre,{yPercent:-100,duration:.8,ease:'power4.inOut'})
        .add(introDone,'-=.45');
    }
  } else introDone();

  /* ---------- Page transition curtain ---------- */
  var curtain=document.querySelector('.curtain');
  if(curtain && hasGSAP && !reduce){
    gsap.set(curtain,{yPercent:0});
    gsap.to(curtain,{yPercent:-100,duration:.7,ease:'power4.inOut',delay:.05});
    document.addEventListener('click',function(e){
      var a=e.target.closest('a'); if(!a) return;
      var href=a.getAttribute('href');
      if(!href||a.target==='_blank'||href.charAt(0)==='#'||/^(mailto|tel|https?:)/.test(href)||e.metaKey||e.ctrlKey||e.shiftKey) return;
      e.preventDefault();
      gsap.fromTo(curtain,{yPercent:100},{yPercent:0,duration:.55,ease:'power4.inOut',onComplete:function(){location.href=href;}});
    });
    window.addEventListener('pageshow',function(ev){ if(ev.persisted) gsap.set(curtain,{yPercent:-100}); });
  } else if(curtain){ curtain.style.display='none'; }

  /* ---------- Split headings ---------- */
  function splitWords(el){
    if(el.dataset.split) return; el.dataset.split='1';
    var walk=function(node){
      Array.prototype.slice.call(node.childNodes).forEach(function(n){
        if(n.nodeType===3){
          var frag=document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function(part){
            if(!part) return;
            if(/^\s+$/.test(part)){ frag.appendChild(document.createTextNode(part)); return; }
            var w=document.createElement('span'); w.className='w';
            var i=document.createElement('span'); i.textContent=part; w.appendChild(i); frag.appendChild(w);
          });
          n.parentNode.replaceChild(frag,n);
        } else if(n.nodeType===1 && n.tagName!=='BR'){ walk(n); }
      });
    };
    walk(el); el.classList.add('split');
  }
  function animateHero(){
    if(!hasGSAP||reduce) return;
    var h=document.querySelector('[data-hero] h1');
    if(h){ splitWords(h); gsap.from(h.querySelectorAll('.w>span'),{yPercent:110,duration:1.1,ease:'power4.out',stagger:.06}); }
    gsap.from('[data-hero] .hero-in',{y:26,opacity:0,duration:.9,ease:'power3.out',stagger:.1,delay:.35});
    gsap.from('.hero-orb',{scale:.85,opacity:0,duration:1.6,ease:'power3.out',delay:.2});
  }
  if(hasGSAP && !reduce){
    document.querySelectorAll('h2.split-in').forEach(function(h){
      splitWords(h);
      gsap.from(h.querySelectorAll('.w>span'),{yPercent:110,duration:1,ease:'power4.out',stagger:.04,scrollTrigger:{trigger:h,start:'top 85%'}});
    });
    /* ---------- Reveals ---------- */
    gsap.utils.toArray('.reveal').forEach(function(el){
      gsap.to(el,{opacity:1,y:0,duration:1,ease:'power3.out',delay:(+el.dataset.delay||0),scrollTrigger:{trigger:el,start:'top 88%'}});
    });
    /* funnel bars */
    gsap.utils.toArray('.f-bar i').forEach(function(b,i){
      gsap.from(b,{scaleX:0,duration:1.4,ease:'power3.out',delay:i*.12,scrollTrigger:{trigger:'.funnel',start:'top 80%'}});
    });
    /* counters */
    gsap.utils.toArray('[data-count]').forEach(function(el){
      var end=+el.dataset.count, o={v:0};
      gsap.to(o,{v:end,duration:1.8,ease:'power2.out',scrollTrigger:{trigger:el,start:'top 90%'},onUpdate:function(){el.textContent=Math.round(o.v).toLocaleString()+(el.dataset.suffix||'');}});
    });
    /* process step highlight */
    gsap.utils.toArray('.step').forEach(function(s){
      ScrollTrigger.create({trigger:s,start:'top 60%',end:'bottom 40%',toggleClass:'on'});
    });
  } else {
    document.querySelectorAll('[data-count]').forEach(function(el){el.textContent=(+el.dataset.count).toLocaleString()+(el.dataset.suffix||'');});
  }

  /* ---------- Card spotlight ---------- */
  document.querySelectorAll('.card').forEach(function(c){
    c.addEventListener('pointermove',function(e){var r=c.getBoundingClientRect();c.style.setProperty('--mx',(e.clientX-r.left)+'px');c.style.setProperty('--my',(e.clientY-r.top)+'px');});
  });

  /* ---------- Custom cursor + magnetic (desktop only) ---------- */
  var fine=window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  if(fine && hasGSAP && !reduce){
    var cur=document.createElement('div'); cur.className='cursor';
    var dot=document.createElement('div'); dot.className='cursor-dot';
    document.body.appendChild(cur); document.body.appendChild(dot);
    var xC=gsap.quickTo(cur,'x',{duration:.45,ease:'power3'}), yC=gsap.quickTo(cur,'y',{duration:.45,ease:'power3'});
    var xD=gsap.quickTo(dot,'x',{duration:.1}), yD=gsap.quickTo(dot,'y',{duration:.1});
    window.addEventListener('pointermove',function(e){xC(e.clientX);yC(e.clientY);xD(e.clientX);yD(e.clientY);});
    document.querySelectorAll('a,button,summary').forEach(function(el){
      el.addEventListener('mouseenter',function(){cur.classList.add('hover')});
      el.addEventListener('mouseleave',function(){cur.classList.remove('hover')});
    });
    document.querySelectorAll('.magnetic').forEach(function(m){
      m.addEventListener('pointermove',function(e){var r=m.getBoundingClientRect();gsap.to(m,{x:(e.clientX-r.left-r.width/2)*.25,y:(e.clientY-r.top-r.height/2)*.35,duration:.4,ease:'power3'});});
      m.addEventListener('pointerleave',function(){gsap.to(m,{x:0,y:0,duration:.6,ease:'elastic.out(1,.4)'});});
    });
  }

  /* ---------- Hero particle network ---------- */
  var cv=document.getElementById('particles');
  if(cv && !reduce){
    var ctx=cv.getContext('2d'), W,H,DPR=Math.min(window.devicePixelRatio||1,2), pts=[], mouse={x:-999,y:-999};
    function size(){W=cv.offsetWidth;H=cv.offsetHeight;cv.width=W*DPR;cv.height=H*DPR;ctx.setTransform(DPR,0,0,DPR,0,0);
      var n=Math.round(Math.min(90,W*H/16000)); pts=[];
      for(var i=0;i<n;i++) pts.push({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.35,vy:(Math.random()-.5)*.35,r:Math.random()*1.6+.6});}
    size(); window.addEventListener('resize',size);
    cv.parentElement.addEventListener('pointermove',function(e){var r=cv.getBoundingClientRect();mouse.x=e.clientX-r.left;mouse.y=e.clientY-r.top;});
    var visible=true;
    if('IntersectionObserver' in window){ new IntersectionObserver(function(en){visible=en[0].isIntersecting}).observe(cv); }
    (function loop(){
      requestAnimationFrame(loop); if(!visible) return;
      ctx.clearRect(0,0,W,H);
      for(var i=0;i<pts.length;i++){var p=pts[i];p.x+=p.vx;p.y+=p.vy;if(p.x<0||p.x>W)p.vx*=-1;if(p.y<0||p.y>H)p.vy*=-1;
        var dxm=p.x-mouse.x,dym=p.y-mouse.y,dm=Math.sqrt(dxm*dxm+dym*dym); if(dm<120){p.x+=dxm/dm*.8;p.y+=dym/dm*.8;}
        ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,6.283);ctx.fillStyle='rgba(127,190,255,.75)';ctx.fill();
        for(var j=i+1;j<pts.length;j++){var q=pts[j],dx=p.x-q.x,dy=p.y-q.y,d=dx*dx+dy*dy;
          if(d<15000){ctx.strokeStyle='rgba(90,162,255,'+(0.18*(1-d/15000))+')';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();}}
      }
    })();
  }

  /* ---------- Year ---------- */
  document.querySelectorAll('[data-year]').forEach(function(e){e.textContent=new Date().getFullYear();});
})();
