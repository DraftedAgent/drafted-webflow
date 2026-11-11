/* Read-only coaching over the real editor controls. Never sends or approves. */
(function(root){
 'use strict';
 function create({host,getState,getSelection}){
  const key='drafted.demo.tour.v1';let state;try{state=JSON.parse(localStorage.getItem(key)||'null');}catch{}
  state=state&&['preview','decision','compare','accept','result','waiting','select','chip','done','skipped'].includes(state.stage)?state:{stage:'preview'};
  if(['decision','accept'].includes(state.stage))state.stage='compare';
  const touch=matchMedia('(hover:none)').matches||navigator.maxTouchPoints>0;
  const bar=document.querySelector('.workspace-main-actions'),replay=document.createElement('button'),skip=document.createElement('button');
  for(const b of [replay,skip]){b.type='button';b.className='workspace-edit-job';bar.append(b);}replay.textContent='Replay tour';skip.textContent='Skip tour';skip.classList.add('demo-tour-exit');
  const popup=document.createElement('aside');popup.className='demo-tour-popup';popup.setAttribute('role','dialog');popup.setAttribute('aria-label','Demo tour');
  const marker=document.createElement('div');marker.className='demo-tour-target';marker.setAttribute('aria-hidden','true');document.body.append(marker,popup);
  let frame=0,target=null,lastStage='',lastId='',scrollTarget=false;
  const active=()=>!['done','skipped'].includes(state.stage);
  function persist(){try{localStorage.setItem(key,JSON.stringify(state));}catch{}}
  function go(stage,extra={}){state={...state,...extra,stage};persist();scrollTarget=true;refresh();if(stage==='result')setTimeout(()=>{if(state.stage==='result'){scrollTarget=true;refresh();}},120);}
  skip.onclick=()=>go('skipped');replay.onclick=()=>go('preview',{blockId:null,action:null});
  const rows=()=>[...host.querySelectorAll('[data-review-block-id]')];
  function block(id){const ns=[...document.querySelectorAll('#editor-preview-text .cv-block[data-block-id]')].filter(n=>n.dataset.blockId===id);return ns.find(n=>{const r=n.getBoundingClientRect();return r.bottom>0&&r.top<innerHeight;})||ns[0];}
  function add(tag,text,fn){const n=document.createElement(tag);n.textContent=text;if(fn){n.type='button';n.onclick=fn;}popup.append(n);return n;}
  function visibleRect(n){let r=n.getBoundingClientRect(),a={left:Math.max(8,r.left),top:Math.max(8,r.top),right:Math.min(innerWidth-8,r.right),bottom:Math.min(innerHeight-8,r.bottom)};for(let p=n.parentElement;p&&p!==document.body;p=p.parentElement){if(/auto|scroll|hidden|clip/.test(getComputedStyle(p).overflow)){r=p.getBoundingClientRect();a={left:Math.max(a.left,r.left),right:Math.min(a.right,r.right),top:Math.max(a.top,r.top),bottom:Math.min(a.bottom,r.bottom)};}}return a;}
  function place(){frame=0;if(!active()||!target?.isConnected){popup.hidden=marker.hidden=true;return;}const r=visibleRect(target);if(r.right<=r.left||r.bottom<=r.top){popup.hidden=marker.hidden=true;return;}popup.hidden=marker.hidden=false;Object.assign(marker.style,{left:r.left+'px',top:r.top+'px',width:r.right-r.left+'px',height:r.bottom-r.top+'px'});
   const w=popup.offsetWidth,h=popup.offsetHeight,gap=16,cx=(r.left+r.right)/2,cy=(r.top+r.bottom)/2;
   let protectedRect=r;
   if(['compare','accept'].includes(state.stage)){const section=block(state.blockId),tools=document.querySelector('.tailor-block-tools[data-block-id="'+CSS.escape(state.blockId)+'"]:not([hidden])');const rects=[section,tools].filter(Boolean).map(visibleRect).filter(a=>a.right>a.left&&a.bottom>a.top);if(rects.length)protectedRect={left:Math.min(...rects.map(a=>a.left))-8,right:Math.max(...rects.map(a=>a.right))+8,top:Math.min(...rects.map(a=>a.top))-8,bottom:Math.max(...rects.map(a=>a.bottom))+8};}
   const safe=protectedRect;
   const options=[{x:safe.left-w-gap,y:cy-h/2,side:'right'},{x:safe.right+gap,y:cy-h/2,side:'left'},{x:cx-w/2,y:safe.bottom+gap,side:'top'},{x:cx-w/2,y:safe.top-h-gap,side:'bottom'}].map(o=>{o.x=Math.max(8,Math.min(innerWidth-w-8,o.x));o.y=Math.max(8,Math.min(innerHeight-h-8,o.y));o.overlap=Math.max(0,Math.min(o.x+w,safe.right)-Math.max(o.x,safe.left))*Math.max(0,Math.min(o.y+h,safe.bottom)-Math.max(o.y,safe.top));return o;});options.sort((a,b)=>a.overlap-b.overlap);const p=options[0];
   // Never cover the real target; hide the coach if a viewport is too small.
   if(p.overlap>1){popup.hidden=true;return;}
   Object.assign(popup.style,{left:p.x+'px',top:p.y+'px'});popup.dataset.arrow=p.side;popup.style.setProperty('--arrow-x',Math.max(14,Math.min(w-14,cx-p.x))+'px');popup.style.setProperty('--arrow-y',Math.max(14,Math.min(h-14,cy-p.y))+'px');
  }
  function schedule(){if(!frame)frame=requestAnimationFrame(place);}
  function refresh(){
   if(replay.hidden!==active())replay.hidden=active();if(skip.hidden===active())skip.hidden=!active();
   if(state.stage==='waiting'&&host.querySelector('.tailor-feedback')){go('select');return;}
   if(['compare','accept'].includes(state.stage)){
    if(!state.blockId){const first=rows()[0];if(first){state.blockId=first.dataset.reviewBlockId;persist();}else{go('waiting');return;}}
    const decision=getState()?.tailorReview?.sectionSession?.decisions?.[state.blockId]||getState()?.tailorCompletionContext?.decisions?.[state.blockId];
    if(decision){go('result',{action:decision});return;}
   }
   if(state.stage==='select'&&getSelection().length){go('chip');return;}
   if(state.stage==='chip'&&!getSelection().length){go('select');return;}
   if(!active()||state.stage==='waiting'){popup.hidden=marker.hidden=true;return;}
   const previousTarget=target;
   if(state.stage==='preview')target=document.querySelector('.cv-document');
   if(state.stage==='compare')target=block(state.blockId);
   if(state.stage==='accept'){const tools=document.querySelector('.tailor-block-tools[data-block-id="'+CSS.escape(state.blockId)+'"]:not([hidden])');target=tools?[...tools.querySelectorAll('button')].find(n=>n.textContent==='Accept'):block(state.blockId);}
   if(state.stage==='result')target=block(state.blockId);
   if(state.stage==='select')target=document.querySelector('.cv-document');
   if(state.stage==='chip')target=document.querySelector('#context-chip.chip--selection');
   if(target&&target!==previousTarget&&['compare','result','chip'].includes(state.stage))scrollTarget=true;
   if(lastStage!==state.stage||lastId!==state.blockId){popup.replaceChildren();lastStage=state.stage;lastId=state.blockId;const copy={preview:['Your CV, taking shape','Preview suggested improvements here. Switch to Original to compare with the starting CV.'],compare:['See the difference',touch?'Tap this section to see the original wording and its review actions.':'Hover over this section to see the original wording. Move away to see Drafted’s suggestion.'],accept:['Try accepting a suggestion',touch?'Tap Accept here to keep this improvement. The matching suggestion will also disappear from the editor.':'Click Accept here to keep this improvement. The matching suggestion will also disappear from the editor.'],result:[state.action==='accept'?'Improvement accepted':'Your choice, reflected',state.action==='accept'?'This wording is now part of the CV. You can accept, decline or edit the remaining suggestions.':state.action==='decline'?'The original wording has been kept. This suggestion was declined.':'The revised suggestion is shown in the preview and is still waiting for your approval.'],select:['Keep improving your CV','Select a section to focus your request, or ask about the whole CV.'],chip:['Your selected context','This section is now the context for your request. Try an example, then send it when you are ready.']}[state.stage];add('h3',copy[0]);add('p',copy[1]);
    if(state.stage==='preview')add('button','Next',()=>{if(document.querySelector('#editor-preview-text')?.dataset.cvPreviewMode==='original')[...document.querySelectorAll('.document-comparison button')].find(n=>n.textContent==='Current')?.click();go('compare',{blockId:rows()[0]?.dataset.reviewBlockId||null});});
    if(state.stage==='result')add('button','Try the remaining suggestions',()=>go('waiting'));
    if(state.stage==='chip'){add('button','Make this section more concise',()=>{const input=document.getElementById('editor-input');input.value='Make this section more concise';input.dispatchEvent(new Event('input',{bubbles:true}));input.focus({preventScroll:true});});add('button','Done',()=>go('done'));}

   }
   if(scrollTarget&&target){scrollTarget=false;target.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});}
   schedule();
  }
  document.addEventListener('drafted-review-hover',e=>{if(state.stage==='compare'&&e.detail.blockId===state.blockId){state={...state,stage:'accept'};persist();scrollTarget=false;refresh();}});
  document.addEventListener('drafted-sample-reset',()=>{if(active())go('skipped');});
  document.addEventListener('drafted-review-action',e=>{if(['compare','accept','result'].includes(state.stage)&&e.detail.blockId===state.blockId){lastStage='';go('result',{action:e.detail.action});}});
  new MutationObserver(refresh).observe(document.querySelector('.section-editor'),{subtree:true,childList:true,attributes:true,attributeFilter:['class','data-layout-state','hidden','data-block-id']});
  document.addEventListener('scroll',schedule,{capture:true,passive:true});root.addEventListener('resize',schedule);document.querySelector('#editor-preview-text').addEventListener('cv-view-scale',schedule);document.addEventListener('click',()=>queueMicrotask(refresh));
  refresh();
 }
 root.DraftedDemoTour={create};
})(window);
