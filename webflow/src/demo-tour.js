/* Read-only coaching over the real editor controls. Never sends or approves. */
(function(root){
 'use strict';
 function create({host,getState,getSelection}){
  const key='drafted.demo.tour.v1';let state;try{state=JSON.parse(localStorage.getItem(key)||'null');}catch{}
  state=state&&['preview','decision','compare','accept','result','waiting','summary','select','chip','done','skipped'].includes(state.stage)?state:{stage:'preview'};
  if(['decision','accept'].includes(state.stage))state.stage='compare';
  const touch=matchMedia('(hover:none)').matches||navigator.maxTouchPoints>0;
  const bar=document.querySelector('.workspace-main-actions'),replay=document.createElement('button'),skip=document.createElement('button');
  for(const b of [replay,skip]){b.type='button';b.className='workspace-edit-job';bar.append(b);}replay.textContent='Replay tour';skip.textContent='Skip tour';skip.classList.add('demo-tour-exit');
  const popup=document.createElement('aside');popup.className='demo-tour-popup';popup.setAttribute('role','dialog');popup.setAttribute('aria-label','Demo tour');
  const marker=document.createElement('div');marker.className='demo-tour-target';marker.setAttribute('aria-hidden','true');document.body.append(marker,popup);
  let frame=0,target=null,lastStage='',lastId='',scrollTarget=state.stage==='summary';
  const active=()=>!['done','skipped'].includes(state.stage);
  function persist(){try{localStorage.setItem(key,JSON.stringify(state));}catch{}}
  function go(stage,extra={}){state={...state,...extra,stage};persist();const accepted=stage==='result'&&state.action==='accept';document.documentElement.dataset.demoTourStart='false';if(accepted){document.dispatchEvent(new Event('drafted-tour-document-start'));const pane=document.querySelector('#editor-preview-text')?.closest('.cv-document');pane?.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});}scrollTarget=!accepted;refresh();}
  skip.onclick=()=>go('skipped');replay.onclick=()=>go('preview',{blockId:null,action:null,resultSeen:false});
  const rows=()=>[...host.querySelectorAll('[data-review-block-id]')];
  function block(id){const ns=[...document.querySelectorAll('#editor-preview-text .cv-block[data-block-id]')].filter(n=>n.dataset.blockId===id);return ns.find(n=>{const r=n.getBoundingClientRect();return r.bottom>0&&r.top<innerHeight;})||ns[0];}
  function add(tag,text,fn){const n=document.createElement(tag);n.textContent=text;if(fn){n.type='button';n.onclick=fn;}popup.append(n);return n;}
  function visibleRect(n){let r=n.getBoundingClientRect(),a={left:Math.max(8,r.left),top:Math.max(8,r.top),right:Math.min(innerWidth-8,r.right),bottom:Math.min(innerHeight-8,r.bottom)};for(let p=n.parentElement;p&&p!==document.body;p=p.parentElement){if(/auto|scroll|hidden|clip/.test(getComputedStyle(p).overflow)){r=p.getBoundingClientRect();a={left:Math.max(a.left,r.left),right:Math.min(a.right,r.right),top:Math.max(a.top,r.top),bottom:Math.min(a.bottom,r.bottom)};}}return a;}
  function visiblePage(){return [...document.querySelectorAll('#editor-preview-text .cv-page')].map(n=>({n,r:visibleRect(n)})).sort((a,b)=>Math.max(0,b.r.right-b.r.left)*Math.max(0,b.r.bottom-b.r.top)-Math.max(0,a.r.right-a.r.left)*Math.max(0,a.r.bottom-a.r.top))[0]?.n;}
  function place(){frame=0;const documentStep=['preview','select'].includes(state.stage)||state.stage==='result'&&state.action==='accept';if(documentStep)target=state.stage==='select'?block('sample-product'):visiblePage();const layer=document.querySelector('#cv-preview-dialog[open]')||document.body;if(popup.parentElement!==layer)layer.append(marker,popup);marker.classList.toggle('is-document-target',documentStep);if(!active()||state.stage==='waiting'||!target?.isConnected){popup.hidden=marker.hidden=true;return;}const r=visibleRect(target);if(r.right<=r.left||r.bottom<=r.top){popup.hidden=marker.hidden=true;return;}popup.hidden=false;marker.hidden=documentStep;Object.assign(marker.style,{left:r.left+'px',top:r.top+'px',width:r.right-r.left+'px',height:r.bottom-r.top+'px'});
   const w=popup.offsetWidth,h=popup.offsetHeight,gap=documentStep?8:16,cx=(r.left+r.right)/2,cy=state.stage==='select'?(target.getBoundingClientRect().top+target.getBoundingClientRect().bottom)/2:(r.top+r.bottom)/2;
   let protectedRect=r;
   if(['compare','accept'].includes(state.stage)){const section=block(state.blockId),tools=document.querySelector('.tailor-block-tools[data-block-id="'+CSS.escape(state.blockId)+'"]:not([hidden])');const rects=[section,tools].filter(Boolean).map(visibleRect).filter(a=>a.right>a.left&&a.bottom>a.top);if(rects.length)protectedRect={left:Math.min(...rects.map(a=>a.left))-8,right:Math.max(...rects.map(a=>a.right))+8,top:Math.min(...rects.map(a=>a.top))-8,bottom:Math.max(...rects.map(a=>a.bottom))+8};}
   const safe=protectedRect;
   const options=[{x:safe.left-w-gap,y:cy-h/2,side:'right'},{x:safe.right+gap,y:cy-h/2,side:'left'},{x:cx-w/2,y:safe.bottom+gap,side:'top'},{x:cx-w/2,y:safe.top-h-gap,side:'bottom'}].map(o=>{o.x=Math.max(8,Math.min(innerWidth-w-8,o.x));o.y=Math.max(8,Math.min(innerHeight-h-8,o.y));o.overlap=Math.max(0,Math.min(o.x+w,safe.right)-Math.max(o.x,safe.left))*Math.max(0,Math.min(o.y+h,safe.bottom)-Math.max(o.y,safe.top));return o;});options.sort((a,b)=>a.overlap-b.overlap);const p=options[0];
   // Never cover the real target; hide the coach if a viewport is too small.
   if(p.overlap>1){popup.hidden=true;return;}
   Object.assign(popup.style,{left:p.x+'px',top:p.y+'px'});popup.dataset.arrow=p.side;popup.style.setProperty('--arrow-x',Math.max(14,Math.min(w-14,cx-p.x))+'px');popup.style.setProperty('--arrow-y',Math.max(14,Math.min(h-14,cy-p.y))+'px');
  }
  let centerFrame=0;
  function centerSelection(){
   if(state.stage!=='select')return;
   const host=document.querySelector('#editor-preview-text');
   Promise.resolve(root.DraftedCvLayout.ready(host)).then(()=>{cancelAnimationFrame(centerFrame);centerFrame=requestAnimationFrame(()=>{
    if(state.stage!=='select')return;const n=block('sample-product'),pane=host.closest('.cv-document');if(!n||!pane)return;
    const r=n.getBoundingClientRect(),bounds=pane.getBoundingClientRect();
    pane.scrollTop+=r.top+r.height/2-(bounds.top+pane.clientTop+pane.clientHeight/2);
    schedule();
   });});
  }
  function schedule(){if(!frame)frame=requestAnimationFrame(place);}
  function refresh(){
   if(replay.hidden!==active())replay.hidden=active();if(skip.hidden===active())skip.hidden=!active();
   if(state.stage==='waiting'&&host.querySelector('.tailor-completion')?.getClientRects().length){go('summary');return;}
   if(['compare','accept'].includes(state.stage)){
    if(!state.blockId){const first=rows()[0];if(first){state.blockId=first.dataset.reviewBlockId;persist();}else{go('waiting');return;}}
    const decision=getState()?.tailorReview?.sectionSession?.decisions?.[state.blockId]||getState()?.tailorCompletionContext?.decisions?.[state.blockId];
    // Only a successful review-action event can show the confirmation.
    // Persisted decisions and hover are never new accept actions.
   }
   if(state.stage==='select'&&getSelection().length===1&&getSelection()[0]==='sample-product'){go('chip',{contextId:getSelection().at(-1)});return;}
   if(state.stage==='chip'&&!getSelection().length){go('select');return;}
   if(!active()||state.stage==='waiting'){popup.hidden=marker.hidden=true;return;}
   const previousTarget=target;
   if(state.stage==='preview')target=visiblePage();
   if(state.stage==='compare')target=block(state.blockId);
   if(state.stage==='accept'){const tools=document.querySelector('.tailor-block-tools[data-block-id="'+CSS.escape(state.blockId)+'"]:not([hidden])');target=tools?[...tools.querySelectorAll('button')].find(n=>n.textContent==='Accept'):block(state.blockId);}
   if(state.stage==='result')target=state.action==='accept'?visiblePage():block(state.blockId);
   if(state.stage==='select')target=block('sample-product');
   if(state.stage==='summary')target=host.querySelector('.tailor-completion');
   if(state.stage==='chip')target=document.querySelector('#context-chip .shared-section-chip[data-context-block-id="'+CSS.escape(state.contextId||getSelection().at(-1)||'')+'"]')||document.querySelector('#context-chip.chip--selection');
   if(target&&target!==previousTarget&&['compare','result','chip'].includes(state.stage)&&!(state.stage==='result'&&state.action==='accept'))scrollTarget=true;
   if(lastStage!==state.stage||lastId!==state.blockId){if(state.stage==='select')centerSelection();popup.replaceChildren();lastStage=state.stage;lastId=state.blockId;const copy={preview:['Your CV, taking shape','Preview suggested improvements here. Switch to Original to compare with the starting CV.'],compare:['See the difference',touch?'Tap this section to see the original wording and its review actions.':'Hover over this section to see the original wording. Move away to see Drafted’s suggestion.'],accept:['Try accepting a suggestion',touch?'Tap Accept here to keep this improvement. The matching suggestion will also disappear from the editor.':'Click Accept here to keep this improvement. The matching suggestion will also disappear from the editor.'],result:[state.action==='accept'?'Improvement accepted':'Your choice, reflected',state.action==='accept'?'This wording is now part of the CV. You can accept, decline or edit the remaining suggestions.':state.action==='decline'?'The original wording has been kept. This suggestion was declined.':'The revised suggestion is shown in the preview and is still waiting for your approval.'],summary:['Your changes, explained','This summary explains what changed in your CV and why, based on the suggestions you accepted or declined.'],select:['Keep improving your CV','Click this section to try a shorter version.'],chip:['Your selected context','Choose the example below, then click Send.']}[state.stage];add('h3',copy[0]);add('p',copy[1]);
    if(state.stage==='preview')add('button','Next',()=>{if(document.querySelector('#editor-preview-text')?.dataset.cvPreviewMode==='original')[...document.querySelectorAll('.document-comparison button')].find(n=>n.textContent==='Current')?.click();go('compare',{blockId:rows()[0]?.dataset.reviewBlockId||null});});
    if(state.stage==='summary')add('button','Next',()=>go('select'));
    if(state.stage==='result')add('button','Try the remaining suggestions',()=>go('waiting'));
    if(state.stage==='chip'){add('small','Prepared demo example').className='demo-example-label';add('button','Make this section more concise',()=>{const input=document.getElementById('editor-input');input.value='Make this section more concise';input.dispatchEvent(new Event('input',{bubbles:true}));go('done');input.focus({preventScroll:true});});add('button','Done',()=>go('done'));}

   }
   if(scrollTarget&&target){scrollTarget=false;if(state.stage==='select'){centerSelection();}else if(state.stage==='summary'){host.scrollTop+=target.getBoundingClientRect().top-host.getBoundingClientRect().top;}else target.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});}
   schedule();
  }
  document.addEventListener('drafted-review-hover',e=>{if(state.stage==='compare'&&e.detail.blockId===state.blockId){state={...state,stage:'accept'};persist();scrollTarget=false;refresh();}});
  document.addEventListener('drafted-sample-reset',()=>{if(active())go('skipped');});
  document.addEventListener('drafted-review-action',e=>{
   if(state.stage==='result'){go('waiting');return;}
   if(['compare','accept'].includes(state.stage)&&e.detail.blockId===state.blockId&&!state.resultSeen){lastStage='';go('result',{action:e.detail.action,resultSeen:true});}
  });
  document.addEventListener('pointerdown',e=>{if(state.stage!=='result'||popup.contains(e.target))return;const review=e.target.closest('[data-review-block-id],.cv-block[data-block-id],.tailor-block-tools,.tailor-review-footer');if(review)go('waiting');},{capture:true});
  new MutationObserver(refresh).observe(document.querySelector('.section-editor'),{subtree:true,childList:true,attributes:true,attributeFilter:['class','data-layout-state','hidden','data-block-id']});
  document.addEventListener('scroll',schedule,{capture:true,passive:true});root.addEventListener('resize',()=>{schedule();centerSelection();});document.addEventListener('drafted-preview-overlay-change',centerSelection);document.querySelector('#editor-preview-text').addEventListener('cv-view-scale',()=>{schedule();centerSelection();});document.addEventListener('click',()=>queueMicrotask(refresh));
  refresh();
 }
 root.DraftedDemoTour={create};
})(window);
