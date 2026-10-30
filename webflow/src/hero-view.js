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
