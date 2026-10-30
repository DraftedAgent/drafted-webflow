/* Local workspace chrome only. No CV, selection or backend state is changed. */
(function(global){
  'use strict';
  global.DraftedLocalLayout={mount(section){
    const layout=section.querySelector('.editor-layout');
    if(!layout||layout.querySelector('.workspace-divider'))return;
    const toolbar=section.querySelector('.workspace-preview-title');
    const primary=document.createElement('div'),secondary=document.createElement('div');
    primary.className='workspace-preview-primary';secondary.className='workspace-preview-secondary';
    for(const node of [...toolbar.children]){
      (node.matches('.document-comparison,.workspace-zoom')?secondary:primary).append(node);
    }
    toolbar.append(primary,secondary);
    const left=layout.querySelector('.editor-left'),right=layout.querySelector('.editor-right');
    left.id='workspace-conversation-panel';right.id='workspace-document-panel';
    const divider=document.createElement('div');divider.className='workspace-divider';divider.tabIndex=0;
    divider.setAttribute('role','separator');divider.setAttribute('aria-label','Resize conversation and CV preview');
    divider.setAttribute('aria-orientation','vertical');divider.setAttribute('aria-controls',left.id+' '+right.id);
    divider.title='Drag to resize. Arrow keys adjust; double-click resets.';left.after(divider);
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
