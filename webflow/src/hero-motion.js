/* Hydrate the initial SVG in place. This module runs before the editor bundle. */
(function(global){
  'use strict';
  if(global.DraftedHeroMotion)return;
  const DURATION=2400,PLAYBACK_RATE=1.15,mounted=new WeakSet(),replayBound=new WeakSet(),controllers=new WeakMap(),root=document.documentElement;
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
    controllers.set(brand,{finish});
    if(!replayBound.has(brand)&&stage){
      replayBound.add(brand);const template=stage.cloneNode(true);
      const replay=()=>{controllers.get(brand)?.finish();brand.append(template.cloneNode(true));root.dataset.draftedHero='eligible';mounted.delete(brand);mount(brand);};
      brand.setAttribute('role','button');brand.tabIndex=0;brand.setAttribute('aria-label','Replay Drafted logo animation');
      brand.addEventListener('click',replay);brand.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();replay();}});
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
        try{begin??=now;const t=Math.min(DURATION,(now-begin)*PLAYBACK_RATE);brand.dataset.motionTime=String(Math.round(t));if(t>=2280)restore();else render(t);if(t<DURATION)frame=requestAnimationFrame(tickHeroMotion);else finish();}catch(_){finish('failed');}
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
      const cuts=geometry.cuts.map((c,i)=>({...c,remaining:stage.querySelector(`[data-motion-remaining="${i}"]`),complete:stage.querySelector(`[data-motion-complete="${i}"]`),width:[296,314,484,290][i],start:120+i*150,end:250+i*150}));
      const sides=[0,1].map(i=>({outer:stage.querySelector(`[data-motion-side="${i}"]`),helper:stage.querySelector(`[data-motion-helper="${i}"]`)}));
      function bandShift(t){if(t<520)return -12;if(t<720)return -12+16*ease(phase(t,520,720));if(t<760)return 4;return 4*(1-ease(phase(t,760,900)));}
      render=t=>{
        // Finish the cuts and dot before bringing in the measuring tool.
        const bandTime=t-1180;
        band.style.visibility=bandTime<0?'hidden':'';
        band.setAttribute('transform',`translate(${bandShift(bandTime)} ${24*(1-ease(phase(bandTime,0,480)))})`);
        const shapes=[geometry.unchanged];
        for(const c of cuts){const i=Math.round(phase(t,c.start,c.end)*130);shapes.push(c.frames[i]);c.remaining.setAttribute('width',i===130?0:c.width);c.complete.setAttribute('width',i===130?c.width:0);}
        solid.setAttribute('d',shapes.join(' '));
        const lock=ease(phase(t,2130,2270));sides.forEach(({outer,helper},i)=>{outer.setAttribute('transform',`translate(${(i?6:-6)*(1-lock)} 0)`);outer.style.opacity=.24+.76*lock;helper.style.opacity=phase(t,2130,2200)*(1-phase(t,2200,2270));});
        const p=ease(phase(t,740,1150));dot.style.display=t<740?'none':'';dot.setAttribute('transform',`translate(${36*(1-p)} 0) rotate(${360*p} 1350.5 283.25)`);
      };
      render(0);ready=true;clearTimeout(global.__DRAFTED_HERO_DEADLINE__);brand.dataset.motionState='waiting';tryStart();
    })().catch(()=>finish('failed'));
  }
  global.DraftedHeroMotion={mount};
})(window);
