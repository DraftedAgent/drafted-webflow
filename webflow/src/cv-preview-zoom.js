/* Preview state only. Neither zoom nor its controls belong to the document model. */
(function(global){
  'use strict';
  function create({host,controls}){
    const group=document.createElement('div');group.className='workspace-zoom';group.setAttribute('role','group');group.setAttribute('aria-label','Preview zoom');
    const button=(label,text)=>{const el=document.createElement('button');el.type='button';el.setAttribute('aria-label',label);el.textContent=text;return el;};
    const minus=button('Zoom out','−'),plus=button('Zoom in','+'),fit=button('Fit to width','Fit to width');
    minus.className='workspace-zoom-minus';plus.className='workspace-zoom-plus';fit.className='workspace-zoom-fit';
    const slider=document.createElement('input');slider.type='range';slider.id='cv-preview-zoom';slider.className='workspace-zoom-slider';slider.min='50';slider.max='150';slider.step='1';slider.value='100';slider.setAttribute('aria-label','Preview zoom percentage');
    const output=document.createElement('output');output.className='workspace-zoom-value';output.setAttribute('for',slider.id);output.setAttribute('aria-label','Current preview zoom');output.setAttribute('aria-live','polite');output.setAttribute('aria-atomic','true');output.textContent='100%';
    group.append(minus,slider,plus,output,fit);controls.append(group);
    let percent=100,fitPercent=100,ready=false;
    function refresh(){
      // Fit can be below 50% on a narrow panel. Include that exact endpoint so
      // the slider, visible percentage and accessible value always agree.
      slider.min=String(Math.min(50,Math.round(fitPercent)));slider.max=String(Math.max(150,Math.round(fitPercent)));
      slider.value=String(percent);slider.setAttribute('aria-valuetext',`${percent}%${fit.getAttribute('aria-pressed')==='true'?' (fit to width)':''}`);
      output.textContent=`${percent}%`;
      minus.disabled=!ready||percent<=Number(slider.min);plus.disabled=!ready||percent>=Number(slider.max);slider.disabled=fit.disabled=!ready;
    }
    host.addEventListener('cv-view-scale',event=>{
      percent=Math.round(event.detail.factor*100);
      const page=host.querySelector('.cv-page');if(page)fitPercent=host.clientWidth/page.offsetWidth*100;
      fit.setAttribute('aria-pressed',String(event.detail.mode==='fit'));refresh();
    });
    const change=value=>global.DraftedCvLayout.setZoom(host,Math.max(Number(slider.min),Math.min(Number(slider.max),value))/100);
    minus.addEventListener('click',()=>change(percent-10));plus.addEventListener('click',()=>change(percent+10));
    slider.addEventListener('input',()=>change(Number(slider.value)));
    fit.addEventListener('click',()=>global.DraftedCvLayout.setZoom(host,'fit'));
    refresh();
    return {setState(state){ready=state==='ready'&&Number(host.dataset.pageCount)>0;refresh();}};
  }
  global.DraftedCvPreviewZoom={create};
})(window);
