/* Screen-only content correspondence, active only during a suggestion review. */
(function(root){'use strict';function create({editor,preview,host,isActive}){
 let owner=null,frame=0,animation=0,disposed=false;const removers=[];
 const bind=(node,event,fn,options)=>{node.addEventListener(event,fn,options);removers.push(()=>node.removeEventListener(event,fn,options));};
 function stopCenter(){cancelAnimationFrame(animation);animation=0;}
 function scrollCenter(pane,top){
  stopCenter();const destination=Math.max(0,Math.min(pane.scrollHeight-pane.clientHeight,top)),start=pane.scrollTop;
  if(matchMedia('(prefers-reduced-motion:reduce)').matches||Math.abs(destination-start)<1){pane.scrollTop=destination;return;}
  const begun=performance.now();
  const tick=now=>{if(disposed||!isActive()){stopCenter();return;}const t=Math.min(1,(now-begun)/220);pane.scrollTop=start+(destination-start)*(1-Math.pow(1-t,3));if(t<1)animation=requestAnimationFrame(tick);else animation=0;};
  animation=requestAnimationFrame(tick);
 }
 // Match real content only; never add height to either scroll pane.
 for(const pane of [editor,preview])pane.querySelectorAll(':scope > .review-sync-reserve').forEach(n=>n.remove());
 const list=side=>side===editor?[...editor.querySelectorAll('[data-review-block-id]')]:[...host.querySelectorAll('.cv-block[data-block-id]')].filter(n=>editor.querySelector('[data-review-block-id="'+CSS.escape(n.dataset.blockId)+'"]'));
 function align(id,from=owner,source){if(disposed||!isActive()||!from||innerWidth<=700||document.querySelector('#cv-preview-dialog[open]'))return;
  stopCenter();const to=from===editor?preview:editor,sourceNode=source||list(from).find(n=>(n.dataset.reviewBlockId||n.dataset.blockId)===id),targets=list(to).filter(n=>(n.dataset.reviewBlockId||n.dataset.blockId)===id);if(!sourceNode||!targets.length)return;
  const y=sourceNode.getBoundingClientRect().top,target=targets.find(n=>n.getBoundingClientRect().bottom>to.getBoundingClientRect().top)||targets[0];
  const delta=target.getBoundingClientRect().top-y;if(Math.abs(delta)>0.75)to.scrollTop+=delta;
 }
 function follow(from){if(disposed||owner!==from||!isActive())return;cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{const bounds=from.getBoundingClientRect(),anchor=Math.max(bounds.top,editor.getBoundingClientRect().top,preview.getBoundingClientRect().top)+24;const visible=list(from).filter(n=>{const r=n.getBoundingClientRect();return r.bottom>anchor&&r.top<bounds.bottom;});const node=visible.sort((a,b)=>Math.abs(a.getBoundingClientRect().top-anchor)-Math.abs(b.getBoundingClientRect().top-anchor))[0];if(node)align(node.dataset.reviewBlockId||node.dataset.blockId,from,node);});}
 let hovered=null;
 function center(event,from){
  if(event.pointerType==='touch'||disposed||!isActive()||innerWidth<=700||document.querySelector('#cv-preview-dialog[open]'))return;
  const node=event.target.closest(from===editor?'[data-review-block-id]':'.cv-block[data-block-id]');if(!node||!from.contains(node))return;
  const id=node.dataset.reviewBlockId||node.dataset.blockId,key=(from===editor?'editor:':'preview:')+id;if(key===hovered)return;hovered=key;
  const to=from===editor?preview:editor,target=list(to).find(n=>(n.dataset.reviewBlockId||n.dataset.blockId)===id);if(!target)return;
  owner=null;cancelAnimationFrame(frame);const r=target.getBoundingClientRect(),bounds=to.getBoundingClientRect(),mid=bounds.top+to.clientHeight/2;
  scrollCenter(to,to.scrollTop+r.top+r.height/2-mid);
 }
 for(const pane of [editor,preview]){
  bind(pane,'pointerover',event=>center(event,pane),{passive:true});
  const claim=event=>{stopCenter();if(event.type==='wheel'&&event.ctrlKey)return;owner=pane;};
  bind(pane,'wheel',claim,{passive:true});bind(pane,'touchstart',claim,{passive:true});bind(pane,'pointerdown',claim);bind(pane,'keydown',event=>{if(['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '].includes(event.key))claim(event);});bind(pane,'scroll',()=>follow(pane),{passive:true});
 }
 return {align(id,side='editor'){owner=side==='editor'?editor:preview;align(id,owner);},dispose(){disposed=true;stopCenter();cancelAnimationFrame(frame);removers.forEach(fn=>fn());editor.querySelectorAll('.is-scroll-active').forEach(n=>n.classList.remove('is-scroll-active'));host.querySelectorAll('.is-scroll-active').forEach(n=>n.classList.remove('is-scroll-active'));}};
}root.DraftedReviewScroll={create};})(globalThis);

/* Hover state is independent of scroll ownership, selection and keyboard focus. */
(function(root){'use strict';
 function create({editor,host}){
  let x=-1,y=-1,frame=0,disposed=false;
  const cardSelector='[data-review-block-id],[data-selection-id]';
  const cardId=n=>n?.dataset.reviewBlockId||n?.dataset.selectionId;
  function clear(){for(const container of [editor,host])container.querySelectorAll('.is-review-hovered').forEach(n=>n.classList.remove('is-review-hovered'));}
  function update(){if(disposed)return;host.dataset.reviewHoverActive=String(!!editor.querySelector(cardSelector));const target=document.elementFromPoint(x,y);let id;
   const card=target?.closest(cardSelector),block=target?.closest('.cv-block[data-block-id]'),tools=target?.closest('.tailor-block-tools[data-block-id]');
   if(card&&editor.contains(card))id=cardId(card);
   else if(block&&host.contains(block)&&host.dataset.cvPreviewMode!=='original')id=block.dataset.blockId;
   else if(tools&&!tools.hidden)id=tools.dataset.blockId;
   const cards=[...editor.querySelectorAll(cardSelector)].filter(n=>cardId(n)===id);
   const blocks=[...host.querySelectorAll('.cv-block[data-block-id]')].filter(n=>n.dataset.blockId===id);
   const next=new Set(id&&cards.length&&blocks.length?[...cards,...blocks]:[]);
   for(const container of [editor,host])for(const n of container.querySelectorAll('.is-review-hovered'))if(!next.has(n))n.classList.remove('is-review-hovered');
   next.forEach(n=>n.classList.add('is-review-hovered'));
  }
  const schedule=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(update);};
  const move=e=>{x=e.clientX;y=e.clientY;update();};
  const leave=()=>{x=y=-1;clear();};
  document.addEventListener('pointermove',move,{passive:true});document.addEventListener('pointerover',move,{passive:true});document.documentElement.addEventListener('pointerleave',leave);window.addEventListener('blur',leave);document.addEventListener('scroll',schedule,true);
  const observer=new MutationObserver(schedule);for(const container of [editor,host])observer.observe(container,{childList:true,subtree:true});
  return {clear:leave,dispose(){disposed=true;cancelAnimationFrame(frame);clear();delete host.dataset.reviewHoverActive;observer.disconnect();document.removeEventListener('pointermove',move);document.removeEventListener('pointerover',move);document.documentElement.removeEventListener('pointerleave',leave);window.removeEventListener('blur',leave);document.removeEventListener('scroll',schedule,true);}};
 }
 root.DraftedReviewHover={create};
})(globalThis);
