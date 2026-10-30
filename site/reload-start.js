/* Decide reload position in the head, before native fragment/scroll restoration. */
(function(){
  'use strict';
  if(document.documentElement.dataset.workspacePage!=='setup')return;
  // Set on the outgoing history entry as well, before a future reload begins.
  history.scrollRestoration='manual';
  if(performance.getEntriesByType('navigation')[0]?.type!=='reload')return;
  history.replaceState({...history.state,workspaceScroll:0},'',location.pathname+location.search);
  let interacted=false;
  const stop=()=>{interacted=true;};
  for(const type of ['pointerdown','keydown','wheel','touchstart'])addEventListener(type,stop,{once:true,capture:true,passive:true});
  const top=()=>{if(!interacted)scrollTo({top:0,left:0,behavior:'instant'});};
  top();
  // The browser can apply a pending fragment while the body is still parsing.
  // Correct it before paint, but immediately yield to deliberate user actions.
  requestAnimationFrame(function beforePaint(){top();if(!interacted&&document.readyState==='loading')requestAnimationFrame(beforePaint);});
  document.addEventListener('DOMContentLoaded',top,{once:true});
  addEventListener('pageshow',top,{once:true});
})();
