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
   const target=matches.find(n=>n.getBoundingClientRect().bottom>bounds.top+8)||matches[0],page=target?.closest('.cv-page-slot');
   group.hidden=false;group.classList.add('is-floating');group.classList.remove('is-compact');
   if(!target||!page){group.style.cssText='left:8px;top:8px;width:280px';return;}
   const r=target.getBoundingClientRect(),paper=page.getBoundingClientRect(),gutter=bounds.right-paper.right-16;
   let x,y;
   if(gutter>=190){group.style.width=Math.min(260,gutter)+'px';x=paper.right+8;y=Math.max(bounds.top+8,Math.min(r.top,bounds.bottom-group.offsetHeight-8));group.dataset.placement='side';}
   else {
    group.classList.add('is-compact');group.style.width=Math.max(120,Math.min(bounds.width-24,560))+'px';
    x=Math.max(bounds.left+8,Math.min(r.left,bounds.right-group.offsetWidth-16));
    // Inspect actual painted text, including metadata/section labels, rather than
    // assuming the space between two block wrappers is blank.
    const occupied=[...host.querySelectorAll('.cv-page h1,.cv-page h2,.cv-page h3,.cv-page p,.cv-page li,.cv-page-number')].flatMap(n=>{
     const range=document.createRange();range.selectNodeContents(n);return [...range.getClientRects()];
    }).filter(a=>a.right>x-6&&a.left<x+group.offsetWidth+6);
    const h=group.offsetHeight;
    const free=v=>!occupied.some(a=>a.bottom>v-6&&a.top<v+h+6);
    const candidates=[r.top-h-10,r.bottom+10,...occupied.flatMap(a=>[a.top-h-8,a.bottom+8])].filter(free);
    const visible=candidates.filter(v=>v>=bounds.top+8&&v+h<=bounds.bottom-8);
    const reachable=candidates.filter(v=>{const delta=v<bounds.top+8?v-bounds.top-8:Math.max(0,v+h-bounds.bottom+8),scroll=pane.scrollTop+delta;return scroll>=0&&scroll<=pane.scrollHeight-pane.clientHeight;});
    const pick=(visible.length?visible:reachable.length?reachable:candidates).sort((a,b)=>Math.abs(a+h/2-(r.top+r.bottom)/2)-Math.abs(b+h/2-(r.top+r.bottom)/2))[0];
    // Dense pages can have no free band in the viewport. Keep controls in the
    // nearest genuine whitespace; do not obscure text to fake an adjacent row.
    y=pick??paper.bottom+8;group.dataset.placement=y+h<=r.top?'above':'below';
   }
   group.style.left=(x-outer.left)+'px';group.style.top=(y-outer.top)+'px';
   // The layer may follow a block out of view; never leave clipped controls.
   const h=group.offsetHeight;group.style.visibility=(y>=bounds.top&&y+h<=bounds.bottom)?'visible':'hidden';
  }
  function restore(center=false){
   const matches=nodes();if(!matches.length){status.textContent='This block is unavailable in '+(mode==='current'?'Current.':'Suggested.');return;}
   const bounds=pane.getBoundingClientRect(),first=matches[0].getBoundingClientRect(),last=matches.at(-1).getBoundingClientRect(),height=last.bottom-first.top;
   const target=center?matches[0]:matches[Math.min(anchor?.fragment||0,matches.length-1)],r=target.getBoundingClientRect(),offset=center?(height>pane.clientHeight-32?16:Math.max(16,(pane.clientHeight-height)/2)):(anchor?.offset??16);
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
  function schedule(){cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{place();paint();});}
  function finish(center){
   restore(center);paint();place();
   if((center||group.contains(document.activeElement))&&nodes().length){const r=group.getBoundingClientRect(),b=pane.getBoundingClientRect();if(r.bottom>b.bottom-8)pane.scrollTop+=r.bottom-b.bottom+8;else if(r.top<b.top+8)pane.scrollTop+=r.top-b.top-8;place();}
   anchor=capture();
  }
  pane.addEventListener('scroll',schedule,{passive:true});host.addEventListener('cv-view-scale',schedule);const resize=new ResizeObserver(schedule);resize.observe(stage);
  return {suggested:()=>mode==='suggested'&&!disposed,model:()=>mode==='suggested'&&!disposed?model:null,navigate(id){show('suggested',id);},beforeRender(){epoch++;cancelAnimationFrame(settleFrame);if(!navigatePending)anchor=capture();clear();},afterRender(){const center=navigatePending,current=epoch;finish(center);navigatePending=false;settleFrame=requestAnimationFrame(()=>{if(!disposed&&epoch===current)finish(center);});},
   dispose(){anchor=capture();disposed=true;cancelAnimationFrame(frame);cancelAnimationFrame(settleFrame);resize.disconnect();pane.removeEventListener('scroll',schedule);host.removeEventListener('cv-view-scale',schedule);clear();group.remove();stage.replaceWith(pane);Promise.resolve(render()).then(()=>{if(host.dataset.cvPreviewMode==='current'&&activeId)restore();}).catch(()=>{});}};
 }
 global.DraftedTailorCvPreview={create};
})(window);
