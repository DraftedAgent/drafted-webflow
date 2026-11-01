/* Presentation only: existing navigation and durable saving retain ownership. */
(function(global){
 'use strict';
 const frame=()=>new Promise(resolve=>requestAnimationFrame(resolve));
 const settle=animation=>animation.finished.catch(()=>{});
 async function run(prepare,commit){
  const source=document.querySelector('#cv-preview'),reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!source||!source.animate||reduce){await prepare();commit();return;}
  const rect=source.getBoundingClientRect(),box={x:rect.x,y:rect.y,width:rect.width,height:rect.height};
  if(box.width<1||box.height<1){await prepare();commit();return;}
  // On stacked mobile setup the preview can sit below the submit button.
  if(box.y>=innerHeight||box.y+box.height<=0){box.height=Math.min(box.height,innerHeight*.35);box.y=innerHeight-box.height-16;}
  const overlay=document.createElement('div');overlay.className='workspace-transfer';overlay.setAttribute('aria-hidden','true');overlay.inert=true;
  Object.assign(overlay.style,{left:box.x+'px',top:box.y+'px',width:box.width+'px',height:box.height+'px'});
  const copy=source.cloneNode(true);copy.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));copy.removeAttribute('id');
  copy.querySelectorAll('.drafted-cv-scan').forEach(n=>n.remove());
  Object.assign(copy.style,{width:box.width+'px',height:box.height+'px',overflow:'hidden',pointerEvents:'none'});
  const originals=source.querySelectorAll('canvas');copy.querySelectorAll('canvas').forEach((c,i)=>{try{c.getContext('2d').drawImage(originals[i],0,0);}catch{}});
  overlay.append(copy);document.body.append(overlay);copy.scrollTop=source.scrollTop;
  const sourceViews=source.querySelectorAll('.source-pdf-view');copy.querySelectorAll('.source-pdf-view').forEach((view,i)=>{view.scrollTop=sourceViews[i]?.scrollTop||0;});
  const status=document.createElement('p');status.className='workspace-transfer-status';status.setAttribute('role','status');status.textContent='Opening your workspace…';status.hidden=true;document.body.append(status);
  const animations=[];
  const motion=(node,keys,options)=>{if(!node)return Promise.resolve();const a=node.animate(keys,options);animations.push(a);return settle(a);};
  const options={duration:440,easing:'cubic-bezier(.22,.8,.25,1)',fill:'both'};
  const timer=setTimeout(()=>{status.hidden=false;},800);
  try{
   // Save begins immediately, alongside the short completion mark.
   await Promise.all([prepare(),motion(overlay,[{outlineColor:'transparent'},{outlineColor:'#00a8a5'}],{duration:140,fill:'both'})]);
   clearTimeout(timer);status.hidden=true;
   const form=document.querySelector('#section-input .input-left');
   await motion(form,[{opacity:1},{opacity:0,transform:'translateY(4px)'}],{duration:100,fill:'both'});
   document.documentElement.dataset.workspaceTransfer='true';
   commit();await frame();await frame();
   const target=document.querySelector('.section-editor .cv-document');const end=target?.getBoundingClientRect();
   const travels=[];
   if(end?.width){travels.push(motion(overlay,[{left:box.x+'px',top:box.y+'px',width:box.width+'px',height:box.height+'px'},{left:end.x+'px',top:end.y+'px',width:end.width+'px',height:end.height+'px'}],options));travels.push(motion(copy,[{transform:'scale(1)'},{transform:`scale(${end.width/box.width})`}],options));}
   for(const selector of ['.workspace-topbar','.section-editor .editor-left'])travels.push(motion(document.querySelector(selector),[{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'none'}],{...options,duration:360}));
   travels.push(motion(document.querySelector('.workspace-divider'),[{transform:'scaleY(0)'},{transform:'scaleY(1)'}],options));
   await Promise.all(travels);
   delete document.documentElement.dataset.workspaceTransfer;
   await motion(overlay,[{opacity:1},{opacity:0}],{duration:80,fill:'both'});
  }finally{
   clearTimeout(timer);delete document.documentElement.dataset.workspaceTransfer;
   animations.forEach(a=>a.cancel());overlay.remove();status.remove();
  }
 }
 global.DraftedWorkspaceTransition={run};
})(window);
