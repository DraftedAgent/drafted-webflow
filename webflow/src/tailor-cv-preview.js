/* Detached presentation and screen-only review layer; no canonical mutations. */
(function(global){
 'use strict';
 function create({host,candidate,baseline,proposalId,render,isCurrent,onClose,onDecision}){
  const copy=x=>JSON.parse(JSON.stringify(x)),model=copy(candidate),before=copy(baseline),pane=host.closest('.cv-document');
  const stage=document.createElement('div');stage.className='tailor-review-stage';pane.before(stage);stage.append(pane);
  const group=document.createElement('section');group.className='tailor-preview-switch tailor-block-tools is-floating';group.setAttribute('aria-label','Block review');group.dataset.proposalId=proposalId;
  const label=document.createElement('strong');label.className='tailor-active-block';const status=document.createElement('span');status.className='tailor-preview-status';status.setAttribute('role','status');
  const actions=document.createElement('div');actions.className='tailor-block-actions';group.append(actions);stage.prepend(group);
  let mode='current',activeId=null,anchor=null,navigatePending=false,showChanges=false,disposed=false,frame,settleFrame,epoch=0;
  const changedIds=new Set(model.blocks.filter(b=>model.sourcesSchemaVersion==='1.4'?JSON.stringify(before.blocks.find(old=>old.blockId===b.blockId))!==JSON.stringify(b):before.blocks.find(old=>old.blockId===b.blockId)?.text!==b.text).map(b=>b.blockId));
  const buttons={},names={before:'drafted-tailor-before',after:'drafted-tailor-after'},marks={disabled:false};
  for(const [text,value] of [['Accept','accept'],['Decline','decline'],['Edit','edit']]){const button=document.createElement('button');button.type='button';button.textContent=text;button.addEventListener('click',async()=>{if(!onDecision||!activeId||!isCurrent())return;actions.querySelectorAll('button').forEach(b=>b.disabled=true);try{await onDecision(activeId,value);}finally{if(!disposed)actions.querySelectorAll('button').forEach(b=>b.disabled=false);}});actions.append(button);}
  const nodes=()=>[...host.querySelectorAll('.cv-block[data-block-id]')].filter(n=>n.dataset.blockId===activeId);
  let hoverTarget=null,hovered=[],leaveTimer,presentationActive=true,presentationMarks=true;
  const paragraphDiffs=new WeakMap();
  const diffs=new Map(model.blocks.map(b=>[b.blockId,global.DraftedTailorChangePreview.wordDiff(before.blocks.find(old=>old.blockId===b.blockId)?.text||'',b.text)]));
  function hideHover(){
   clearTimeout(leaveTimer);if(!hoverTarget){group.hidden=true;return;}
   for(const entry of hovered){entry.node.replaceChildren(...entry.children);entry.node.style.minHeight=entry.minHeight;entry.node.classList.remove('tailor-original-hover');}
   hovered=[];hoverTarget=null;group.hidden=true;paint();
  }
  function paragraphRuns(target){
   const id=target.dataset.cvSource,sources=[...host.querySelectorAll('[data-cv-source]')].filter(n=>n.dataset.cvSource===id),block=model.blocks.find(b=>b.blockId===id);
   if(!block||sources.map(n=>n.textContent).join('')!==block.text)return [];
   let start=0;for(const n of sources){if(n===target)break;start+=n.textContent.length;}
   const end=start+target.textContent.length,result=[];let offset=0;
   for(const op of diffs.get(id)||[]){
    if(op.type==='remove'){if(offset>=start&&(offset<end||offset===end&&end===block.text.length))result.push(op);continue;}
    const stop=offset+op.text.length,text=op.text.slice(Math.max(0,start-offset),Math.max(0,Math.min(stop,end)-offset));
    if(text)result.push({type:op.type,text});offset=stop;
   }
   return result.some(op=>op.type!=='equal')?result:[];
  }
  function showHover(event){
   const target=event.target.closest('.cv-block[data-block-id]');
   if(disposed||!presentationActive||mode!=='suggested'||!target||!host.contains(target)||!isCurrent()){hideHover();return;}
   clearTimeout(leaveTimer);if(target===hoverTarget)return;if(event.type==='pointerover'&&hoverTarget?.contains(document.activeElement))return;
   hideHover();
   const sources=presentationMarks?[...host.querySelectorAll('[data-cv-source]')].filter(n=>n.dataset.cvSource===target.dataset.blockId&&paragraphDiffs.has(n)):[];
   if(!changedIds.has(target.dataset.blockId))return;
   hoverTarget=target;activeId=target.dataset.blockId;const block=model.blocks.find(b=>b.blockId===activeId);label.textContent=block.employer||block.institution||block.label||block.type;group.dataset.blockId=activeId;status.textContent='Not applied';
   for(const node of sources){
    const runs=paragraphDiffs.get(node),children=[...node.childNodes],minHeight=node.style.minHeight;
    node.style.minHeight=node.offsetHeight+'px';node.classList.add('tailor-original-hover');node.replaceChildren();
    for(const op of runs){if(op.type==='add')continue;const span=document.createElement(op.type==='remove'?'del':'span');span.textContent=op.text;if(op.type==='remove')span.className='tailor-mark-removed';node.append(span);}
    hovered.push({node,children,minHeight});
   }
   paint();place();
  }
  function leaveHover(event){if(hoverTarget?.contains(event.relatedTarget)||group.contains(event.relatedTarget))return;clearTimeout(leaveTimer);leaveTimer=setTimeout(hideHover,180);}
  function escapeHover(event){if(event.key==='Escape'&&hoverTarget){hideHover();event.preventDefault();event.stopImmediatePropagation();}}
  host.addEventListener('pointerover',showHover);host.addEventListener('focusin',showHover);host.addEventListener('pointerout',leaveHover);host.addEventListener('focusout',leaveHover);document.addEventListener('keydown',escapeHover,true);
  group.addEventListener('pointerenter',()=>clearTimeout(leaveTimer));group.addEventListener('pointerleave',leaveHover);group.addEventListener('focusout',leaveHover);
  function clear(){for(const name of Object.values(names))global.CSS?.highlights?.delete(name);host.querySelectorAll('.is-tailor-reviewed').forEach(n=>n.classList.remove('is-tailor-reviewed'));}
  function capture(){const bounds=pane.getBoundingClientRect(),matches=nodes(),node=matches.find(n=>n.getBoundingClientRect().bottom>bounds.top+12)||matches[0];return node?{fragment:matches.indexOf(node),offset:node.getBoundingClientRect().top-bounds.top}:anchor;}
  function place(){
   if(disposed)return;
   if(!presentationActive||!activeId||!onDecision||!hoverTarget&&!group.contains(document.activeElement)){group.hidden=true;return;}
   const matches=nodes(),bounds=pane.getBoundingClientRect(),outer=stage.getBoundingClientRect();
   const visible=matches.filter(n=>{const r=n.getBoundingClientRect();return r.bottom>bounds.top&&r.top<bounds.bottom;});
   const target=hoverTarget||visible[0]||matches[0],page=target?.closest('.cv-page-slot');
   group.hidden=false;group.classList.add('is-floating');group.classList.remove('is-compact');
   if(!target||!page||!visible.length){group.style.visibility='hidden';return;}
   const r=target.getBoundingClientRect();
   group.classList.add('is-compact');group.style.width=Math.min(r.width,bounds.width-16)+'px';
   const x=Math.max(bounds.left+8,Math.min(r.left,bounds.right-group.offsetWidth-12)),h=group.offsetHeight;
   // Outline extends beyond the content box; measure its actual painted edge.
   const style=getComputedStyle(target),edge=(parseFloat(style.outlineOffset)||0)+(parseFloat(style.outlineWidth)||0);
   const above=r.top-edge-h,below=r.bottom+edge;
   const fitsAbove=above>=bounds.top&&above+h<=bounds.bottom;
   const y=fitsAbove?above:below;
   group.dataset.placement=fitsAbove?'above':'below';
   group.style.left=(x-outer.left)+'px';group.style.top=(y-outer.top)+'px';group.style.visibility='visible';

  }
  function restore(center=false){
   const matches=nodes();if(!matches.length){status.textContent='This block is unavailable in '+(mode==='current'?'Current.':'Suggested.');return;}
   const bounds=pane.getBoundingClientRect(),first=matches[0].getBoundingClientRect(),last=matches.at(-1).getBoundingClientRect(),height=last.bottom-first.top;
   const target=center?matches[0]:matches[Math.min(anchor?.fragment||0,matches.length-1)],r=target.getBoundingClientRect(),offset=center?group.offsetHeight+24:(anchor?.offset??16);
   pane.scrollTop+=r.top-bounds.top-offset;anchor=capture();status.textContent='Not applied';
  }
  function paint(){
   clear();if(!presentationActive||!presentationMarks)return;const matches=nodes();if(mode==='suggested'){global.DraftedCvDocumentComparison.paint(host,before,model,'after','drafted-tailor');return;}if(!showChanges||marks.disabled)return;
   global.DraftedCvDocumentComparison.paint(host,before,model,mode==='current'?'before':'after','drafted-tailor',activeId);
  }
  function show(next,id){
   if(disposed||!isCurrent())return;if(id){activeId=id;anchor=null;navigatePending=true;}else anchor=capture();mode=next;
   const block=model.blocks.find(b=>b.blockId===activeId);label.textContent=block?(block.employer||block.institution||block.label||block.type):'Unavailable block';group.dataset.blockId=activeId;
   for(const [key,button] of Object.entries(buttons))button.setAttribute('aria-pressed',String(key===mode));render();
  }
  function schedule(){if(!hoverTarget?.contains(document.activeElement)&&!group.contains(document.activeElement))hideHover();cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{
    place();paint();
  });}
  const inspect=event=>{const node=event.target.closest('.cv-block[data-block-id]');if(presentationActive&&node&&changedIds.has(node.dataset.blockId)&&!event.target.closest('a')){event.stopImmediatePropagation();node.focus({preventScroll:true});showHover(event);}};
  host.addEventListener('click',inspect,true);
  function finish(center){
   restore(center);paint();place();
   anchor=capture();
  }
  pane.addEventListener('scroll',schedule,{passive:true});host.addEventListener('cv-view-scale',schedule);const resize=new ResizeObserver(schedule);resize.observe(stage);
  return {setPresentation({active,marks}){presentationActive=active;presentationMarks=marks;if(!active||!marks)hideHover();},start(){show('suggested');},suggested:()=>mode==='suggested'&&!disposed,model:()=>mode==='suggested'&&!disposed?model:null,navigate(id){show('suggested',id);},beforeRender(){hideHover();epoch++;cancelAnimationFrame(settleFrame);if(!navigatePending)anchor=capture();clear();},afterRender(){const center=navigatePending,current=epoch;finish(center);navigatePending=false;if(mode==='suggested'){host.querySelectorAll('[data-cv-source]').forEach(n=>{const runs=paragraphRuns(n);if(runs.length)paragraphDiffs.set(n,runs);});host.querySelectorAll('.cv-block[data-block-id]').forEach(n=>{if(changedIds.has(n.dataset.blockId))n.tabIndex=0;});}settleFrame=requestAnimationFrame(()=>{if(!disposed&&epoch===current)finish(center);});},
   dispose(){hideHover();host.removeEventListener('pointerover',showHover);host.removeEventListener('focusin',showHover);host.removeEventListener('pointerout',leaveHover);host.removeEventListener('focusout',leaveHover);document.removeEventListener('keydown',escapeHover,true);anchor=capture();disposed=true;cancelAnimationFrame(frame);cancelAnimationFrame(settleFrame);resize.disconnect();host.removeEventListener('click',inspect,true);pane.removeEventListener('scroll',schedule);host.removeEventListener('cv-view-scale',schedule);clear();group.remove();stage.replaceWith(pane);Promise.resolve(render()).then(()=>{if(host.dataset.cvPreviewMode==='current'&&activeId)restore();}).catch(()=>{});}};
 }
 global.DraftedTailorCvPreview={create};
})(window);
