/* Local workspace chrome only. No CV, selection or backend state is changed. */
(function(global){
  'use strict';
  global.DraftedLocalLayout={mount(section){
    const layout=section.querySelector('.editor-layout');
    if(!layout||layout.querySelector('.workspace-divider'))return;
    const toolbar=section.querySelector('.workspace-preview-title');
    const chat=layout.querySelector('.chat-card');
    const label=toolbar.querySelector('.workspace-preview-label');
    label.classList.add('workspace-panel-heading');toolbar.before(label);
    chat.querySelector('.chat-title').classList.add('workspace-panel-heading');
    const display=document.createElement('div');display.className='workspace-preview-display';
    const comparison=toolbar.querySelector('.document-comparison'),zoom=toolbar.querySelector('.workspace-zoom');
    for(const node of [...toolbar.children])if(node!==comparison&&node!==zoom)display.append(node);
    if(comparison)toolbar.append(comparison);toolbar.append(display);if(zoom)toolbar.append(zoom);
    const body=document.createElement('div');body.className='workspace-conversation-body';
    for(const node of [...chat.children])if(!node.matches('.chat-title,.workspace-editor-toolbar'))body.append(node);
    chat.append(body);layout.classList.add('workspace-aligned-panels');
    const left=layout.querySelector('.editor-left'),right=layout.querySelector('.editor-right');
    left.id='workspace-conversation-panel';right.id='workspace-document-panel';
    const divider=document.createElement('div');divider.className='workspace-divider';divider.tabIndex=0;
    divider.setAttribute('role','separator');divider.setAttribute('aria-label','Resize conversation and CV preview');
    divider.setAttribute('aria-orientation','vertical');divider.setAttribute('aria-controls',left.id+' '+right.id);
    divider.title='Drag to resize. Arrow keys adjust; double-click resets.';left.after(divider);
    // Adapt to actual panel widths, including divider changes.
    const zoomMenu=document.createElement('div');zoomMenu.className='workspace-zoom-menu';zoomMenu.id='workspace-zoom-menu';zoomMenu.setAttribute('popover','auto');
    const zoomButton=document.createElement('button');zoomButton.type='button';zoomButton.className='workspace-zoom-trigger';zoomButton.setAttribute('popovertarget',zoomMenu.id);zoomButton.setAttribute('aria-label','Preview zoom controls');zoomButton.setAttribute('aria-expanded','false');
    toolbar.append(zoomButton);section.append(zoomMenu);
    function positionZoom(){const r=zoomButton.getBoundingClientRect();zoomMenu.style.left=Math.max(8,Math.min(r.right-310,innerWidth-326))+'px';zoomMenu.style.top=(r.bottom+6)+'px';}
    zoomMenu.addEventListener('toggle',()=>{zoomButton.setAttribute('aria-expanded',String(zoomMenu.matches(':popover-open')));if(zoomMenu.matches(':popover-open'))positionZoom();});
    const comparisonMenu=document.createElement('div');comparisonMenu.className='workspace-comparison-menu';comparisonMenu.id='workspace-comparison-menu';comparisonMenu.setAttribute('popover','auto');
    const comparisonButton=document.createElement('button');comparisonButton.type='button';comparisonButton.className='workspace-zoom-trigger';comparisonButton.setAttribute('popovertarget',comparisonMenu.id);comparisonButton.setAttribute('aria-label','CV comparison views');toolbar.prepend(comparisonButton);section.append(comparisonMenu);
    comparisonMenu.addEventListener('toggle',()=>{const open=comparisonMenu.matches(':popover-open');comparisonButton.setAttribute('aria-expanded',String(open));if(open){const r=comparisonButton.getBoundingClientRect();comparisonMenu.style.left=Math.max(8,Math.min(r.left,innerWidth-246))+'px';comparisonMenu.style.top=(r.bottom+6)+'px';}});
    function compactLabels(){
      const launcher=chat.querySelector('.discovery-launcher');if(launcher){const review=launcher.textContent.includes('Review your answers');launcher.dataset.compactLabel=review?'Answers':'Questions';}
      const coverage=chat.querySelector('.workspace-coverage-toggle');if(coverage){const full=coverage.textContent,match=full.match(/(\d+) of (\d+)/);coverage.dataset.compactLabel=match?'Coverage '+match[1]+'/'+match[2]:'Coverage';coverage.setAttribute('aria-label',full);coverage.title=full;}
      const selected=comparison?.querySelector('button[aria-pressed=true]');comparisonButton.textContent=(selected?.textContent||'Edited')+' ▾';
      zoomButton.textContent=(zoom?.querySelector('.workspace-zoom-value')?.textContent||'100%')+' ▾';
    }
    function adaptPanels(){
      compactLabels();
      const leftToolbar=chat.querySelector('.workspace-editor-toolbar');
      left.classList.remove('workspace-compact');
      left.classList.toggle('workspace-compact',leftToolbar.scrollWidth>leftToolbar.clientWidth+1);
      // Try the full controls first, then collapse only what cannot fit.
      zoomMenu.hidePopover();comparisonMenu.hidePopover();
      right.classList.remove('workspace-compact');zoomButton.hidden=true;comparisonButton.hidden=true;
      if(comparison.parentElement!==toolbar)toolbar.prepend(comparison);
      if(zoom.parentElement!==toolbar)toolbar.append(zoom);
      const count=section.querySelector('.workspace-page-count');if(count&&count.parentElement!==display)display.prepend(count);
      const compact=toolbar.scrollWidth>toolbar.clientWidth+1;
      right.classList.toggle('workspace-compact',compact);zoomButton.hidden=!compact;
      if(compact){zoomMenu.append(zoom);if(count)label.append(count);}
      const narrow=toolbar.scrollWidth>toolbar.clientWidth+1;comparisonButton.hidden=!narrow;
      if(narrow)comparisonMenu.append(comparison);
    }
    const panelSizes=new ResizeObserver(adaptPanels);panelSizes.observe(left);panelSizes.observe(right);
    new MutationObserver(adaptPanels).observe(chat.querySelector('.workspace-editor-toolbar'),{childList:true,subtree:true,characterData:true});
    if(zoom)new MutationObserver(compactLabels).observe(zoom,{childList:true,subtree:true,characterData:true});
    if(comparison)new MutationObserver(compactLabels).observe(comparison,{attributes:true,subtree:true,attributeFilter:['aria-pressed']});
    adaptPanels();
    const desktop=matchMedia('(min-width:801px)'),key='drafted.workspace.panel-ratio.v1';
    let ratio=.38,dragging=false;
    try{const saved=Number(localStorage.getItem(key));if(saved>=.25&&saved<=.6)ratio=saved;}catch{}
    function bounds(){const width=layout.clientWidth;return {width,min:Math.max(280,width*.25),max:Math.min(width*.6,width-368)};}
    function resize(value){
      if(!desktop.matches||!layout.clientWidth)return;
      const {width,min,max}=bounds(),size=Math.max(min,Math.min(max,value));
      layout.style.setProperty('--workspace-left',size+'px');
      divider.setAttribute('aria-valuemin',Math.round(min/width*100));divider.setAttribute('aria-valuemax',Math.round(max/width*100));
      divider.setAttribute('aria-valuenow',Math.round(size/width*100));divider.setAttribute('aria-valuetext',Math.round(size/width*100)+'% conversation');
      return size/width;
    }
    function persist(){try{localStorage.setItem(key,String(ratio));}catch{}}
    divider.addEventListener('pointerdown',event=>{
      if(event.button!==0||!desktop.matches)return;
      event.preventDefault();divider.focus({preventScroll:true});dragging=true;divider.setPointerCapture(event.pointerId);layout.classList.add('is-resizing');
    });
    divider.addEventListener('pointermove',event=>{if(dragging)ratio=resize(event.clientX-layout.getBoundingClientRect().left)??ratio;});
    const end=()=>{if(!dragging)return;dragging=false;layout.classList.remove('is-resizing');persist();};
    divider.addEventListener('pointerup',end);divider.addEventListener('pointercancel',end);divider.addEventListener('lostpointercapture',end);
    divider.addEventListener('dblclick',()=>{ratio=.38;resize(layout.clientWidth*ratio);persist();});
    divider.addEventListener('keydown',event=>{
      const {width,min,max}=bounds(),step=event.shiftKey?48:16;
      const value={ArrowLeft:left.getBoundingClientRect().width-step,ArrowRight:left.getBoundingClientRect().width+step,Home:min,End:max}[event.key];
      if(value===undefined)return;event.preventDefault();ratio=resize(value)??ratio;persist();
    });
    new ResizeObserver(()=>resize(layout.clientWidth*ratio)).observe(layout);
    desktop.addEventListener('change',()=>{end();resize(layout.clientWidth*ratio);});
    resize(layout.clientWidth*ratio);
  }};
})(window);
