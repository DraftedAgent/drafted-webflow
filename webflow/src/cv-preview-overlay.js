/* Viewer interaction only: move the live preview, never clone or paginate it. */
(function(global){
  'use strict';
  function create({section,card,host,heading}){
    const pane=card.querySelector('.cv-document');
    const workspaceScroll=section.closest('.page-scroll');
    const expand=global.DraftedWorkspaceView.iconButton('Expand preview','workspace-preview-action workspace-expand-preview','<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>');
    expand.disabled=true;expand.setAttribute('aria-haspopup','dialog');expand.setAttribute('aria-controls','cv-preview-dialog');
    const close=global.DraftedWorkspaceView.iconButton('Close','workspace-preview-action workspace-close-preview','<path d="m6 6 12 12M18 6 6 18"/>');close.hidden=true;
    heading.append(expand,close);
    const dialog=document.createElement('dialog');dialog.id='cv-preview-dialog';dialog.className='cv-preview-dialog';dialog.setAttribute('aria-labelledby','cv-preview-heading');
    section.append(dialog);
    pane.tabIndex=0;pane.setAttribute('role','region');pane.setAttribute('aria-label','CV pages');
    let saved=null;
    function open(){
      if(saved||expand.disabled)return;
      const bounds=pane.getBoundingClientRect();
      const slots=[...host.querySelectorAll('.cv-page-slot')];
      const anchor=slots.find(el=>el.getBoundingClientRect().bottom>bounds.top)||slots[0];
      const rect=anchor?.getBoundingClientRect();
      const placeholder=document.createElement('div');placeholder.className='cv-preview-placeholder';placeholder.setAttribute('aria-hidden','true');
      saved={placeholder,focus:document.activeElement,top:pane.scrollTop,left:pane.scrollLeft,overflow:document.body.style.overflow,x:window.scrollX,y:window.scrollY,workspace:workspaceScroll&&{snap:workspaceScroll.style.scrollSnapType,reading:global.DraftedWorkspaceView.captureScroll(workspaceScroll),top:workspaceScroll.scrollTop,left:workspaceScroll.scrollLeft,overflow:workspaceScroll.style.overflow}};
      card.replaceWith(placeholder);dialog.append(card);expand.hidden=true;close.hidden=false;
      document.body.style.overflow='hidden';dialog.showModal();
      if(workspaceScroll){workspaceScroll.style.scrollSnapType='none';workspaceScroll.style.overflow='hidden';}
      global.DraftedCvLayout.rescale(host);
      // Keep the same reading position when the viewer scale increases.
      if(anchor&&rect?.height){const fraction=(bounds.top-rect.top)/rect.height,newRect=anchor.getBoundingClientRect();pane.scrollTop+=newRect.top-pane.getBoundingClientRect().top+fraction*newRect.height;}
      close.focus({preventScroll:true});
      global.DraftedWorkspaceView.dismissTooltips(heading);
    }
    function restore(){
      if(!saved)return;
      const previous=saved;saved=null;
      previous.placeholder.replaceWith(card);expand.hidden=false;close.hidden=true;
      document.body.style.overflow=previous.overflow;
      if(previous.workspace){workspaceScroll.style.overflow=previous.workspace.overflow;global.DraftedWorkspaceView.restoreScroll(workspaceScroll,previous.workspace.reading);workspaceScroll.scrollLeft=previous.workspace.left;}
      global.DraftedCvLayout.rescale(host);
      pane.scrollTop=previous.top;pane.scrollLeft=previous.left;
      window.scrollTo(previous.x,previous.y);
      (previous.focus?.isConnected?previous.focus:expand).focus({preventScroll:true});
      global.DraftedWorkspaceView.dismissTooltips(heading);
      requestAnimationFrame(()=>{if(workspaceScroll){global.DraftedWorkspaceView.restoreScroll(workspaceScroll,previous.workspace.reading);workspaceScroll.style.scrollSnapType=previous.workspace.snap;}});
    }
    expand.addEventListener('click',open);
    close.addEventListener('click',()=>dialog.close());
    dialog.addEventListener('cancel',event=>{event.preventDefault();dialog.close();});
    dialog.addEventListener('close',restore);
    dialog.addEventListener('keydown',event=>{
      if(event.key!=='Tab')return;
      const controls=[...dialog.querySelectorAll('button:not([disabled]),select:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])')].filter(el=>!el.closest('[hidden]')&&el.getClientRects().length);
      const first=controls[0],last=controls.at(-1);
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
    });
    return {setState(state){expand.disabled=state!=='ready'||Number(host.dataset.pageCount)<1;}};
  }
  global.DraftedCvPreviewOverlay={create};
})(window);
