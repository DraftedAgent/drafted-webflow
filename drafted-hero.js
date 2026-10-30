/* Hydrate the initial SVG in place. This module runs before the editor bundle. */
(function(global){
  'use strict';
  if(global.DraftedHeroMotion)return;
  const DURATION=2400,mounted=new WeakSet(),root=document.documentElement;
  const clamp=x=>Math.max(0,Math.min(1,x)),phase=(t,a,b)=>clamp((t-a)/(b-a)),ease=x=>x*x*(3-2*x);
  function mount(brand){
    if(!brand||mounted.has(brand))return;
    mounted.add(brand);
    const stage=brand.querySelector('.drafted-hero-initial'),reduced=global.matchMedia?.('(prefers-reduced-motion: reduce)');
    let observer,frame=0,started=false,visible=false,ready=false,disposed=false,render;
    function restore(){root.dataset.draftedHero='complete';brand.classList.remove('drafted-hero-motion-running');stage?.remove();}
    function finish(state='complete'){
      if(disposed)return;
      disposed=true;cancelAnimationFrame(frame);observer?.disconnect();clearTimeout(global.__DRAFTED_HERO_DEADLINE__);
      reduced?.removeEventListener('change',preferenceChanged);document.removeEventListener('visibilitychange',visibilityChanged);
      restore();brand.dataset.motionState=state;
    }
    function preferenceChanged(){if(reduced.matches)finish('static');}
    function visibilityChanged(){if(document.hidden&&started)finish();else tryStart();}
    function tryStart(){
      if(disposed||started||!ready||!visible||document.hidden)return;
      if(reduced.matches||root.dataset.draftedHero!=='eligible')return finish('static');
      started=true;observer.disconnect();brand.classList.add('drafted-hero-motion-running');brand.dataset.motionState='playing';let begin;
      performance.mark('drafted-hero-motion-start');
      function tickHeroMotion(now){
        if(disposed)return;
        try{begin??=now;const t=Math.min(DURATION,now-begin);brand.dataset.motionTime=String(Math.round(t));if(t>=2280)restore();else render(t);if(t<DURATION)frame=requestAnimationFrame(tickHeroMotion);else finish();}catch(_){finish('failed');}
      }
      frame=requestAnimationFrame(tickHeroMotion);
    }
    if(!stage||!reduced||reduced.matches||root.dataset.draftedHero!=='eligible'){finish('static');return;}
    brand.dataset.motionState='loading';
    reduced.addEventListener('change',preferenceChanged);document.addEventListener('visibilitychange',visibilityChanged);
    observer=new IntersectionObserver(entries=>{visible=entries.some(e=>e.isIntersecting&&e.intersectionRatio>0);tryStart();},{threshold:[0,.1]});observer.observe(brand);
    (async()=>{
      // Prefix deltas expand to the exact approved path strings synchronously.
      // No streamed decoder, asset fetch, editor readiness or load event.
      const payload=document.getElementById('drafted-hero-geometry');
      if(!payload)throw Error('Initial hero geometry missing');
      const first=JSON.parse(payload.textContent);
      const geometry=typeof first==='string'?JSON.parse([...document.querySelectorAll('[data-geometry-part]')].map(part=>JSON.parse(part.textContent)).join('')):first;
      for(const cut of geometry.cuts)for(let i=1;i<cut.frames.length;i++){const delta=cut.frames[i];if(Array.isArray(delta)){const previous=cut.frames[i-1];cut.frames[i]=previous.slice(0,delta[0])+delta[2]+(delta[1]?previous.slice(-delta[1]):'');}}
      if(disposed)return;
      if(typeof geometry.original!=='string'||geometry.cuts?.length!==4||geometry.cuts.some(c=>c.frames?.length!==131||c.frames.some(d=>typeof d!=='string'||!d)))throw Error('Invalid initial hero geometry');
      const solid=stage.querySelector('[data-motion-solid]'),band=stage.querySelector('[data-motion-band]'),dot=stage.querySelector('[data-motion-dot]');
      const cuts=geometry.cuts.map((c,i)=>({...c,remaining:stage.querySelector(`[data-motion-remaining="${i}"]`),complete:stage.querySelector(`[data-motion-complete="${i}"]`),width:[296,314,484,290][i],start:1120+i*150,end:1250+i*150}));
      const sides=[0,1].map(i=>({outer:stage.querySelector(`[data-motion-side="${i}"]`),helper:stage.querySelector(`[data-motion-helper="${i}"]`)}));
      function bandShift(t){if(t<520)return -12;if(t<720)return -12+16*ease(phase(t,520,720));if(t<760)return 4;return 4*(1-ease(phase(t,760,900)));}
      render=t=>{
        band.setAttribute('transform',`translate(${bandShift(t)} ${24*(1-ease(phase(t,0,480)))})`);
        const shapes=[geometry.unchanged];
        for(const c of cuts){const i=Math.round(phase(t,c.start,c.end)*130);shapes.push(c.frames[i]);c.remaining.setAttribute('width',i===130?0:c.width);c.complete.setAttribute('width',i===130?c.width:0);}
        solid.setAttribute('d',shapes.join(' '));
        const lock=ease(phase(t,950,1090));sides.forEach(({outer,helper},i)=>{outer.setAttribute('transform',`translate(${(i?6:-6)*(1-lock)} 0)`);outer.style.opacity=.24+.76*lock;helper.style.opacity=phase(t,950,1040)*(1-phase(t,1730,1850));});
        const p=ease(phase(t,1810,2220));dot.style.display=t<1810?'none':'';dot.setAttribute('transform',`translate(${36*(1-p)} 0) rotate(${360*p} 1350.5 283.25)`);
      };
      render(0);ready=true;clearTimeout(global.__DRAFTED_HERO_DEADLINE__);brand.dataset.motionState='waiting';tryStart();
    })().catch(()=>finish('failed'));
  }
  global.DraftedHeroMotion={mount};
})(window);

;
/* Adopt server-delivered hero nodes. Never replace first-paint content. */
(function(global){
  'use strict';
  if(global.DraftedHeroView)return;
  const bound=new WeakSet();
  function mount(){
    const hero=document.querySelector('.drafted-hero[data-initial-hero]');
    if(!hero||bound.has(hero))return;
    bound.add(hero);
    const start=hero.closest('.drafted-landing');
    start.addEventListener('click',event=>{
      const link=event.target.closest('.drafted-home,.drafted-hero-action');
      if(!link||event.button||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
      event.stopPropagation();
      requestAnimationFrame(()=>document.querySelector(link.getAttribute('href'))?.scrollIntoView({behavior:'instant',block:'start'}));
    });
    global.DraftedHeroMotion.mount(hero.querySelector('.drafted-hero-brand'));
  }
  global.DraftedHeroView={mount};
  const ready=()=>!!document.querySelector('[data-drafted-hero-ready]');
  if(ready())mount();
  else{const observer=new MutationObserver(()=>{if(ready()){observer.disconnect();mount();}});observer.observe(document.documentElement,{childList:true,subtree:true});}
})(window);
