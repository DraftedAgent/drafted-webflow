/* Original uploaded PDF viewer only: move the live view, never clone/reload it. */
(function(global){
  'use strict';
  function create({section,right,preview}){
    const wrap=preview.querySelector('.cv-preview-wrap');if(!wrap)return;
    const open=document.createElement('button');open.type='button';open.className='preparation-preview-open';open.hidden=true;open.disabled=true;
    open.setAttribute('aria-label','Enlarge CV preview');open.setAttribute('aria-haspopup','dialog');open.setAttribute('aria-controls','uploaded-cv-dialog');
    open.innerHTML='<span aria-hidden="true" class="preparation-enlarge-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="10" cy="10" r="6"/><path d="m15 15 6 6M10 7v6M7 10h6"/></svg></span>';
    right.append(open);
    const dialog=document.createElement('dialog');dialog.id='uploaded-cv-dialog';dialog.className='preparation-pdf-dialog';dialog.setAttribute('aria-labelledby','uploaded-cv-dialog-title');
    const bar=document.createElement('div');bar.className='preparation-pdf-toolbar';
    const title=document.createElement('h2');title.id='uploaded-cv-dialog-title';title.textContent='CV preview';
    const close=document.createElement('button');close.type='button';close.className='preparation-pdf-close';close.setAttribute('aria-label','Close CV preview');close.textContent='Close ×';
    bar.append(title,close);dialog.append(bar);section.append(dialog);
    const scroller=section.closest('.page-scroll');let saved=null;
    const view=()=>wrap.querySelector('.source-pdf-view');
    function sync(){
      const ready=view()?.dataset.state==='ready';open.disabled=!ready;open.hidden=!ready||!!saved;
      if(view())view().inert=ready&&!saved;
      if(saved&&!ready)dialog.close();
    }
    function expand(){
      if(saved||open.disabled)return;
      const pane=view(),bounds=pane.getBoundingClientRect(),anchor=[...pane.querySelectorAll('.source-pdf-slot')].find(el=>el.getBoundingClientRect().bottom>bounds.top),rect=anchor?.getBoundingClientRect();
      const placeholder=document.createElement('div');placeholder.className='preparation-preview-space';placeholder.style.height=wrap.getBoundingClientRect().height+'px';placeholder.setAttribute('aria-hidden','true');
      const previous=saved={placeholder,top:pane.scrollTop,left:pane.scrollLeft,overflow:scroller?.style.overflow,snap:scroller?.style.scrollSnapType,reading:scroller&&global.DraftedWorkspaceView.captureScroll(scroller),bodyOverflow:document.body.style.overflow};
      wrap.replaceWith(placeholder);dialog.append(wrap);pane.inert=false;open.hidden=true;
      if(scroller){scroller.style.scrollSnapType='none';scroller.style.overflow='hidden';}document.body.style.overflow='hidden';
      dialog.showModal();close.focus({preventScroll:true});
      // The original PDF viewer's ResizeObserver rescales the same pages.
      requestAnimationFrame(()=>requestAnimationFrame(()=>{if(saved!==previous)return;if(anchor&&rect?.height){const fraction=(bounds.top-rect.top)/rect.height;pane.scrollTop+=anchor.getBoundingClientRect().top-pane.getBoundingClientRect().top+fraction*anchor.getBoundingClientRect().height;}}));
    }
    function restore(){
      if(!saved)return;const previous=saved;saved=null;previous.placeholder.replaceWith(wrap);
      document.body.style.overflow=previous.bodyOverflow;
      if(scroller){scroller.style.overflow=previous.overflow;global.DraftedWorkspaceView.restoreScroll(scroller,previous.reading);}
      sync();(!open.disabled?open:section.querySelector('#file-btn'))?.focus({preventScroll:true});
      requestAnimationFrame(()=>{if(saved)return;const pane=view();if(pane){pane.scrollTop=previous.top;pane.scrollLeft=previous.left;}if(scroller){global.DraftedWorkspaceView.restoreScroll(scroller,previous.reading);scroller.style.scrollSnapType=previous.snap;}});
    }
    open.addEventListener('click',expand);close.addEventListener('click',()=>dialog.close());dialog.addEventListener('close',restore);
    dialog.addEventListener('cancel',event=>{event.preventDefault();dialog.close();});
    dialog.addEventListener('keydown',event=>{
      if(event.key!=='Tab')return;
      const controls=[...dialog.querySelectorAll('button:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])')].filter(el=>!el.closest('[hidden]')&&el.getClientRects().length),first=controls[0],last=controls.at(-1);
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
    });
    new MutationObserver(sync).observe(section,{subtree:true,attributes:true,attributeFilter:['data-state']});sync();
  }
  global.DraftedUploadedPreviewOverlay={create};
})(window);
