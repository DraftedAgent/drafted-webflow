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
  function actions(topbar,tools){
    if(!tools)return;
    const wrapper=document.createElement('div');wrapper.className='workspace-more-actions';
    const toggle=document.createElement('button');toggle.type='button';toggle.className='workspace-preview-action workspace-more-toggle';
    toggle.setAttribute('aria-label','More actions');toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-controls','workspace-secondary-actions');
    const label=document.createElement('span');label.className='workspace-more-label';label.textContent='More actions';
    const icon=document.createElement('span');icon.className='workspace-more-icon';icon.textContent='⋯';icon.setAttribute('aria-hidden','true');toggle.append(label,icon);
    tools.id='workspace-secondary-actions';tools.replaceWith(wrapper);wrapper.append(toggle,tools);
    function close(focus=false){wrapper.classList.remove('is-open');toggle.setAttribute('aria-expanded','false');if(focus)toggle.focus({preventScroll:true});}
    const availability=()=>{toggle.disabled=tools.style.display==='none';if(toggle.disabled)close();};
    new MutationObserver(availability).observe(tools,{attributes:true,attributeFilter:['style']});availability();
    toggle.addEventListener('click',()=>{if(wrapper.classList.contains('is-open'))close(true);else{wrapper.classList.add('is-open');toggle.setAttribute('aria-expanded','true');tools.querySelector('[role="button"]')?.focus({preventScroll:true});}});
    wrapper.addEventListener('keydown',event=>{if(event.key==='Escape'&&wrapper.classList.contains('is-open')){event.preventDefault();event.stopPropagation();close(true);}});
    wrapper.addEventListener('focusout',event=>{if(!wrapper.contains(event.relatedTarget))close();});
    document.addEventListener('pointerdown',event=>{if(!wrapper.contains(event.target))close();});
    matchMedia('(max-width:1280px)').addEventListener('change',()=>close());
  }
  global.DraftedWorkspaceView={viewport,actions,lock(){locked++;return ()=>{locked--;settleViewport();};}};
})(window);
