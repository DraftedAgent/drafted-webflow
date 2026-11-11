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
    let percent=100,fitPercent=100,ready=false,opening=0,openedVersion=null;
    function stopOpening(){cancelAnimationFrame(opening);opening=0;}
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
    const change=value=>{stopOpening();global.DraftedCvLayout.setZoom(host,Math.max(Number(slider.min),Math.min(Number(slider.max),value))/100);};
    minus.addEventListener('click',()=>change(percent-10));plus.addEventListener('click',()=>change(percent+10));
    slider.addEventListener('input',()=>change(Number(slider.value)));
    fit.addEventListener('click',()=>{stopOpening();global.DraftedCvLayout.setZoom(host,'fit');});
    const surface=host.closest('.cv-document');let gestureStart=100;
    surface.addEventListener('pointerdown',stopOpening,{passive:true});
    surface.addEventListener('wheel',event=>{
      stopOpening();if(!event.ctrlKey)return;
      event.preventDefault();if(!ready)return;
      const delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?surface.clientHeight:1);
      change(Math.round(percent*Math.exp(-Math.max(-100,Math.min(100,delta))*0.002)));
    },{passive:false});
    surface.addEventListener('gesturestart',event=>{event.preventDefault();stopOpening();gestureStart=percent;},{passive:false});
    surface.addEventListener('gesturechange',event=>{event.preventDefault();if(ready&&Number.isFinite(event.scale))change(Math.round(gestureStart*event.scale));},{passive:false});
    surface.addEventListener('gestureend',event=>event.preventDefault(),{passive:false});

    refresh();
    return {open(version){if(!ready||!version||openedVersion===version)return;openedVersion=version;stopOpening();const set=value=>{global.DraftedCvLayout.setZoom(host,value);surface.scrollTop=0;};if(matchMedia('(prefers-reduced-motion:reduce)').matches){set(.7);return;}set(.5);const start=performance.now();const tick=now=>{const t=Math.min(1,(now-start)/550);set(.5+.2*(1-Math.pow(1-t,3)));if(t<1)opening=requestAnimationFrame(tick);else opening=0;};opening=requestAnimationFrame(tick);},setState(state){ready=state==='ready'&&Number(host.dataset.pageCount)>0;refresh();}};
  }
  global.DraftedCvPreviewZoom={create};
})(window);
