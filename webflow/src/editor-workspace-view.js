/* Workspace chrome only; never changes the CV or its document renderer. */
(function(global){
  'use strict';
  let locked=0,settleViewport=()=>{};
  function viewport(){
    const root=document.documentElement,scroller=document.querySelector('.page-scroll');
    const nav=document.querySelector('.w-nav'),editor=scroller?.querySelector('.section-editor');
    if(!scroller||!editor)return;
    let active=false,changing=false,timer,section=null;
    const sections=()=>[...scroller.children].filter(el=>el.matches('.snap-section,.section-cta'));
    function measure(){
      root.style.setProperty('--nav-h',`${active?0:Math.round(nav?.getBoundingClientRect().height||0)}px`);
    }
    function align(target,top=0){scroller.scrollTop+=target.getBoundingClientRect().top-scroller.getBoundingClientRect().top-top;}
    function settle(){
      if(changing){schedule();return;}
      if(locked||scroller.querySelector('dialog[open]'))return;
      const bounds=scroller.getBoundingClientRect();
      section=sections().sort((a,b)=>visible(b)-visible(a))[0];
      function visible(el){const r=el.getBoundingClientRect();return Math.max(0,Math.min(r.bottom,bounds.bottom)-Math.max(r.top,bounds.top));}
      const next=section===editor;
      if(next===active)return;
      const top=section.getBoundingClientRect().top-bounds.top,snap=scroller.style.scrollSnapType;
      changing=true;scroller.style.scrollSnapType='none';active=next;
      root.classList.toggle('drafted-editor-active',active);measure();align(section,top);
      requestAnimationFrame(()=>{scroller.style.scrollSnapType=snap;requestAnimationFrame(()=>{changing=false;});});
    }
    function schedule(){clearTimeout(timer);timer=setTimeout(settle,140);}
    scroller.addEventListener('scroll',schedule,{passive:true});
    scroller.addEventListener('scrollend',()=>{clearTimeout(timer);settle();});
    window.addEventListener('resize',()=>{clearTimeout(timer);changing=true;measure();requestAnimationFrame(()=>{if(section)align(section);requestAnimationFrame(()=>{changing=false;schedule();});});},{passive:true});
    if(nav)new ResizeObserver(measure).observe(nav);
    settleViewport=schedule;document.fonts?.ready.then(measure);measure();schedule();
  }
  let tooltipId=0;
  function iconButton(label,className,paths){
    const button=document.createElement('button');button.type='button';button.className='workspace-icon-button '+className;button.setAttribute('aria-label',label);
    button.innerHTML='<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+paths+'</svg>';
    const tooltip=document.createElement('span');tooltip.id='cv-tool-tip-'+(++tooltipId);tooltip.className='workspace-tooltip';tooltip.setAttribute('role','tooltip');tooltip.textContent=label;tooltip.hidden=true;
    button.setAttribute('aria-describedby',tooltip.id);button.append(tooltip);
    let hovering=false;
    button.addEventListener('pointerenter',event=>{if(event.pointerType!=='touch'){hovering=true;tooltip.hidden=false;}});
    button.addEventListener('pointerleave',()=>{hovering=false;if(document.activeElement!==button)tooltip.hidden=true;});
    button.addEventListener('focus',()=>{tooltip.hidden=false;});button.addEventListener('blur',()=>{if(!hovering)tooltip.hidden=true;});
    button.addEventListener('click',()=>{tooltip.hidden=true;});
    button.addEventListener('keydown',event=>{if(event.key==='Escape')tooltip.hidden=true;});
    return button;
  }
  global.DraftedWorkspaceView={viewport,iconButton,lock(){locked++;return ()=>{locked--;settleViewport();};}};
})(window);
