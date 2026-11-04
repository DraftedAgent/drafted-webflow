/* Detached presentation and screen-only review layer; no canonical mutations. */
(function(global){
 'use strict';
 function create({host,candidate,baseline,proposalId,render,isCurrent,onClose}){
  const copy=x=>JSON.parse(JSON.stringify(x)),model=copy(candidate),before=copy(baseline),pane=host.closest('.cv-document');
  const stage=document.createElement('div');stage.className='tailor-review-stage';pane.before(stage);stage.append(pane);
  const group=document.createElement('section');group.className='tailor-preview-switch tailor-block-tools is-floating';group.setAttribute('aria-label','Block review');group.dataset.proposalId=proposalId;
  const label=document.createElement('strong');label.className='tailor-active-block';const status=document.createElement('span');status.className='tailor-preview-status';status.setAttribute('role','status');
  const actions=document.createElement('div');actions.className='tailor-block-actions';group.append(label,status,actions);stage.prepend(group);
  let mode='current',activeId=null,anchor=null,navigatePending=false,showChanges=false,disposed=false,frame,settleFrame,epoch=0;
  const changedIds=new Set(model.blocks.filter(b=>model.sourcesSchemaVersion==='1.4'?JSON.stringify(before.blocks.find(old=>old.blockId===b.blockId))!==JSON.stringify(b):before.blocks.find(old=>old.blockId===b.blockId)?.text!==b.text).map(b=>b.blockId));
  const buttons={},names={before:'drafted-tailor-before',after:'drafted-tailor-after'};
  for(const title of ['Current','Suggested']){const button=document.createElement('button');button.type='button';button.textContent=title;button.setAttribute('aria-pressed',String(title==='Current'));button.addEventListener('click',()=>show(title.toLowerCase()));buttons[title.toLowerCase()]=button;actions.append(button);}
  const marks=document.createElement('button');marks.type='button';marks.textContent='Show changes';marks.setAttribute('aria-pressed','false');marks.disabled=!global.CSS?.highlights||!global.Highlight;marks.addEventListener('click',()=>{if(!isCurrent())return;showChanges=!showChanges;marks.setAttribute('aria-pressed',String(showChanges));paint();});actions.append(marks);
  const close=document.createElement('button');close.type='button';close.className='tailor-block-close';close.textContent='×';close.setAttribute('aria-label','Close CV review');close.addEventListener('click',onClose);group.insertBefore(close,actions);
  const nodes=()=>[...host.querySelectorAll('.cv-block[data-block-id]')].filter(n=>n.dataset.blockId===activeId);
  function clear(){for(const name of Object.values(names))global.CSS?.highlights?.delete(name);host.querySelectorAll('.is-tailor-reviewed').forEach(n=>n.classList.remove('is-tailor-reviewed'));}
  function capture(){const bounds=pane.getBoundingClientRect(),matches=nodes(),node=matches.find(n=>n.getBoundingClientRect().bottom>bounds.top+12)||matches[0];return node?{fragment:matches.indexOf(node),offset:node.getBoundingClientRect().top-bounds.top}:anchor;}
  function place(){
   if(disposed)return;
   const matches=nodes(),bounds=pane.getBoundingClientRect(),outer=stage.getBoundingClientRect();
   const visible=matches.filter(n=>{const r=n.getBoundingClientRect();return r.bottom>bounds.top&&r.top<bounds.bottom;});
   const target=visible[0]||matches[0],page=target?.closest('.cv-page-slot');
   group.hidden=false;group.classList.add('is-floating');group.classList.remove('is-compact');
   if(!target||!page||!visible.length){group.style.visibility='hidden';return;}
   const r=target.getBoundingClientRect();
   group.classList.add('is-compact');group.style.width=Math.max(120,Math.min(bounds.width-24,620))+'px';
   const x=Math.max(bounds.left+8,Math.min(r.left,bounds.right-group.offsetWidth-12)),h=group.offsetHeight;
   // Outline extends beyond the content box; measure its actual painted edge.
   const style=getComputedStyle(target),edge=(parseFloat(style.outlineOffset)||0)+(parseFloat(style.outlineWidth)||0);
   const above=r.top-edge-h-8,below=r.bottom+edge+8;
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
   clear();const matches=nodes();if(!matches.length)return;matches.forEach(n=>n.classList.add('is-tailor-reviewed'));if(!showChanges||marks.disabled)return;
   global.DraftedCvDocumentComparison.paint(host,before,model,mode==='current'?'before':'after','drafted-tailor',activeId);
  }
  function show(next,id){
   if(disposed||!isCurrent())return;if(id){activeId=id;anchor=null;navigatePending=true;}else anchor=capture();mode=next;
   const block=model.blocks.find(b=>b.blockId===activeId);label.textContent=block?(block.employer||block.institution||block.label||block.type):'Unavailable block';group.dataset.blockId=activeId;
   for(const [key,button] of Object.entries(buttons))button.setAttribute('aria-pressed',String(key===mode));render();
  }
  function schedule(){cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{
    const bounds=pane.getBoundingClientRect(),shown=[...host.querySelectorAll('.cv-block[data-block-id]')].filter(n=>{const r=n.getBoundingClientRect();return changedIds.has(n.dataset.blockId)&&r.bottom>bounds.top&&r.top<bounds.bottom;});
    if(!shown.some(n=>n.dataset.blockId===activeId)&&shown.length){activeId=shown[0].dataset.blockId;const b=model.blocks.find(b=>b.blockId===activeId);label.textContent=b.label||b.type;group.dataset.blockId=activeId;}
    place();paint();
  });}
  const inspect=event=>{const node=event.target.closest('.cv-block[data-block-id]');if(node&&changedIds.has(node.dataset.blockId)&&!event.target.closest('a')){event.stopImmediatePropagation();show(mode,node.dataset.blockId);}};
  host.addEventListener('click',inspect,true);
  function finish(center){
   restore(center);paint();place();
   anchor=capture();
  }
  pane.addEventListener('scroll',schedule,{passive:true});host.addEventListener('cv-view-scale',schedule);const resize=new ResizeObserver(schedule);resize.observe(stage);
  return {suggested:()=>mode==='suggested'&&!disposed,model:()=>mode==='suggested'&&!disposed?model:null,navigate(id){show('suggested',id);},beforeRender(){epoch++;cancelAnimationFrame(settleFrame);if(!navigatePending)anchor=capture();clear();},afterRender(){const center=navigatePending,current=epoch;finish(center);navigatePending=false;settleFrame=requestAnimationFrame(()=>{if(!disposed&&epoch===current)finish(center);});},
   dispose(){anchor=capture();disposed=true;cancelAnimationFrame(frame);cancelAnimationFrame(settleFrame);resize.disconnect();host.removeEventListener('click',inspect,true);pane.removeEventListener('scroll',schedule);host.removeEventListener('cv-view-scale',schedule);clear();group.remove();stage.replaceWith(pane);Promise.resolve(render()).then(()=>{if(host.dataset.cvPreviewMode==='current'&&activeId)restore();}).catch(()=>{});}};
 }
 global.DraftedTailorCvPreview={create};
})(window);
