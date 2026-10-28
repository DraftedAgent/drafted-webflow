/* Detached presentation and screen-only review layer; no canonical mutations. */
(function(global){
 'use strict';
 function create({host,candidate,baseline,proposalId,render,isCurrent,onClose}){
  const copy=x=>JSON.parse(JSON.stringify(x)),model=copy(candidate),before=copy(baseline),pane=host.closest('.cv-document');
  const stage=document.createElement('div');stage.className='tailor-review-stage';pane.before(stage);stage.append(pane);
  const group=document.createElement('section');group.className='tailor-preview-switch tailor-block-tools';group.setAttribute('aria-label','Block review');group.dataset.proposalId=proposalId;
  const label=document.createElement('strong');label.className='tailor-active-block';const status=document.createElement('span');status.className='tailor-preview-status';status.setAttribute('role','status');
  const actions=document.createElement('div');actions.className='tailor-block-actions';group.append(label,status,actions);stage.prepend(group);
  let mode='current',activeId=null,anchor=null,navigatePending=false,showChanges=false,disposed=false,frame;
  const buttons={},names={before:'drafted-tailor-before',after:'drafted-tailor-after'};
  for(const title of ['Current','Suggested']){const button=document.createElement('button');button.type='button';button.textContent=title;button.setAttribute('aria-pressed',String(title==='Current'));button.addEventListener('click',()=>show(title.toLowerCase()));buttons[title.toLowerCase()]=button;actions.append(button);}
  const marks=document.createElement('button');marks.type='button';marks.textContent='Show changes';marks.setAttribute('aria-pressed','false');marks.disabled=!global.CSS?.highlights||!global.Highlight;marks.addEventListener('click',()=>{if(!isCurrent())return;showChanges=!showChanges;marks.setAttribute('aria-pressed',String(showChanges));paint();});actions.append(marks);
  const close=document.createElement('button');close.type='button';close.className='tailor-block-close';close.textContent='×';close.setAttribute('aria-label','Close CV review');close.addEventListener('click',onClose);group.insertBefore(close,actions);
  const nodes=()=>[...host.querySelectorAll('.cv-block[data-block-id]')].filter(n=>n.dataset.blockId===activeId);
  function clear(){for(const name of Object.values(names))global.CSS?.highlights?.delete(name);host.querySelectorAll('.is-tailor-reviewed').forEach(n=>n.classList.remove('is-tailor-reviewed'));}
  function capture(){const bounds=pane.getBoundingClientRect(),matches=nodes(),node=matches.find(n=>n.getBoundingClientRect().bottom>bounds.top+12)||matches[0];return node?{fragment:matches.indexOf(node),offset:node.getBoundingClientRect().top-bounds.top}:anchor;}
  function place(){
   if(disposed)return;const target=nodes()[0],page=target?.closest('.cv-page-slot');if(!target||!page){group.classList.remove('is-floating');return;}
   const bounds=pane.getBoundingClientRect(),paper=page.getBoundingClientRect(),gutter=bounds.right-paper.right-20;group.classList.toggle('is-floating',gutter>=240);
   if(gutter>=240){group.style.width=Math.min(280,gutter)+'px';const b=stage.getBoundingClientRect();group.style.top=Math.max(8,Math.min(target.getBoundingClientRect().top-b.top,b.height-group.offsetHeight-8))+'px';}
   else{group.style.removeProperty('width');group.style.removeProperty('top');}
  }
  function restore(center=false){
   const matches=nodes();if(!matches.length){status.textContent='This block is unavailable in '+(mode==='current'?'Current.':'Suggested.');return;}
   const bounds=pane.getBoundingClientRect(),first=matches[0].getBoundingClientRect(),last=matches.at(-1).getBoundingClientRect(),height=last.bottom-first.top;
   const target=center?matches[0]:matches[Math.min(anchor?.fragment||0,matches.length-1)],r=target.getBoundingClientRect(),offset=center?(height>pane.clientHeight-32?16:Math.max(16,(pane.clientHeight-height)/2)):(anchor?.offset??16);
   pane.scrollTop+=r.top-bounds.top-offset;anchor=capture();status.textContent='Not applied';
  }
  function paint(){
   clear();const matches=nodes();if(!matches.length)return;matches.forEach(n=>n.classList.add('is-tailor-reviewed'));if(!showChanges||marks.disabled)return;
   const old=before.blocks.find(b=>b.blockId===activeId),next=model.blocks.find(b=>b.blockId===activeId);if(!old||!next)return;
   const source=[...host.querySelectorAll('[data-cv-source]')].filter(n=>n.dataset.cvSource===activeId),expected=mode==='current'?old.text:next.text;
   if(source.map(n=>n.textContent).join('')!==expected){status.textContent='Changes cannot be marked safely for this block.';return;}
   const textNodes=[];let total=0;for(const element of source){const walk=document.createTreeWalker(element,NodeFilter.SHOW_TEXT);let n;while((n=walk.nextNode())){textNodes.push({node:n,start:total,end:total+n.length});total+=n.length;}}
   let offset=0;const ranges=[];for(const op of global.DraftedTailorChangePreview.wordDiff(old.text,next.text)){
    if(op.type===(mode==='current'?'add':'remove'))continue;const end=offset+op.text.length;
    if(op.type!=='equal'&&end>offset){const startNode=textNodes.find(n=>n.end>offset),endNode=textNodes.find(n=>n.end>=end);if(startNode&&endNode){const range=new Range();range.setStart(startNode.node,offset-startNode.start);range.setEnd(endNode.node,end-endNode.start);ranges.push(range);}}offset=end;
   }
   global.CSS.highlights.set(names[mode==='current'?'before':'after'],new global.Highlight(...ranges));
  }
  function show(next,id){
   if(disposed||!isCurrent())return;if(id){activeId=id;anchor=null;navigatePending=true;}else anchor=capture();mode=next;
   const block=model.blocks.find(b=>b.blockId===activeId);label.textContent=block?[block.employer||block.institution||block.label||block.type,block.title].filter(Boolean).join(' · '):'Unavailable block';group.dataset.blockId=activeId;
   for(const [key,button] of Object.entries(buttons))button.setAttribute('aria-pressed',String(key===mode));render();
  }
  function schedule(){cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{place();paint();});}
  pane.addEventListener('scroll',schedule,{passive:true});host.addEventListener('cv-view-scale',schedule);const resize=new ResizeObserver(schedule);resize.observe(stage);
  return {suggested:()=>mode==='suggested'&&!disposed,model:()=>mode==='suggested'&&!disposed?model:null,navigate(id){show('suggested',id);},beforeRender(){if(!navigatePending)anchor=capture();clear();},afterRender(){place();restore(navigatePending);navigatePending=false;paint();place();},
   dispose(){anchor=capture();disposed=true;cancelAnimationFrame(frame);resize.disconnect();pane.removeEventListener('scroll',schedule);host.removeEventListener('cv-view-scale',schedule);clear();group.remove();stage.replaceWith(pane);Promise.resolve(render()).then(()=>{if(host.dataset.cvPreviewMode==='current'&&activeId)restore();}).catch(()=>{});}};
 }
 global.DraftedTailorCvPreview={create};
})(window);
