/* Workspace chrome only; never changes the CV or its document renderer. */
(function(global){
  'use strict';
  function captureScroll(scroller){
    const top=scroller.getBoundingClientRect().top;
    const element=[...scroller.children].find(el=>el.matches('.navbar,.snap-section,.section-cta')&&el.getBoundingClientRect().bottom>top);
    if(!element)return null;
    const rect=element.getBoundingClientRect();
    return {element,fraction:(top-rect.top)/rect.height,top:scroller.scrollTop,width:scroller.clientWidth,height:scroller.clientHeight};
  }
  function restoreScroll(scroller,reading){
    if(!reading?.element.isConnected)return;
    if(reading.width===scroller.clientWidth&&reading.height===scroller.clientHeight)scroller.scrollTop=reading.top;
    else scroller.scrollTop+=reading.element.getBoundingClientRect().top-scroller.getBoundingClientRect().top+reading.fraction*reading.element.getBoundingClientRect().height;
  }
  function flow(){
    const scroller=document.querySelector('.page-scroll'),nav=document.querySelector('.navbar.w-nav');
    if(!scroller)return;
    // Keep the live Webflow header and its bindings in the one page scroll flow.
    if(nav&&nav.parentElement!==scroller)scroller.prepend(nav);
    let reading=captureScroll(scroller),width=scroller.clientWidth,height=scroller.clientHeight;
    // Scrolling only records an anchor. It never changes layout or header visibility.
    scroller.addEventListener('scroll',()=>{
      if(width===scroller.clientWidth&&height===scroller.clientHeight)reading=captureScroll(scroller);
    },{passive:true});
    new ResizeObserver(()=>{
      if(width===scroller.clientWidth&&height===scroller.clientHeight)return;
      // Respect navigation that happened during resize; only correct the retained/clamped old offset.
      const retained=reading&&Math.min(reading.top,Math.max(0,scroller.scrollHeight-scroller.clientHeight));
      if(reading&&Math.abs(scroller.scrollTop-retained)<1)restoreScroll(scroller,reading);
      width=scroller.clientWidth;height=scroller.clientHeight;reading=captureScroll(scroller);
    }).observe(scroller);
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
  global.DraftedWorkspaceView={flow,iconButton,captureScroll,restoreScroll};
})(window);
