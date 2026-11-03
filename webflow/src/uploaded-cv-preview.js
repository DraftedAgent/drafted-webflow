/* Original-file viewer only. Never rewrites or exports the uploaded CV. */
(function(global){
  'use strict';
  const assetBase=new URL('webflow/assets/pdfjs/6.4.299/',document.currentScript.src);
  let libraryPromise;
  function library(){
    if(!libraryPromise)libraryPromise=import(new URL('build/pdf.min.mjs',assetBase).href).then(pdfjs=>{
      pdfjs.GlobalWorkerOptions.workerSrc=new URL('build/pdf.worker.min.mjs',assetBase).href;
      return pdfjs;
    }).catch(error=>{libraryPromise=null;throw error;});
    return libraryPromise;
  }
  function create({frame,wrap}){
    if(!frame||!wrap)return {setFile(){}};
    const view=document.createElement('div');view.id=frame.id;view.className='cv-preview-embed source-pdf-view';
    view.tabIndex=0;view.setAttribute('role','region');view.setAttribute('aria-label','Uploaded CV');frame.replaceWith(view);
    const status=document.createElement('div');status.className='source-pdf-status';status.setAttribute('role','status');status.hidden=true;wrap.append(status);
    let revision=0,loading=null,pdf=null,pages=[],observer=null;
    function message(text){status.textContent=text;status.hidden=!text;}
    function stop(){
      observer?.disconnect();observer=null;
      for(const item of pages){item.task?.cancel();item.text?.cancel();}
      pages=[];pdf=null;
      const previous=loading;loading=null;previous?.destroy().catch(()=>{});
      view.replaceChildren();view.scrollTop=0;view.removeAttribute('data-page-count');
    }
    function nearby(item){const a=item.slot.getBoundingClientRect(),b=view.getBoundingClientRect();return a.bottom>b.top-300&&a.top<b.bottom+300;}
    function release(item){item.rasterId=(item.rasterId||0)+1;item.task?.cancel();item.paper.querySelector('canvas')?.remove();item.pixels=0;}
    async function raster(item,token){
      if(!item.page||token!==revision)return;
      const factor=parseFloat(item.paper.dataset.displayScale)||1;
      const output=Math.min(factor*(global.devicePixelRatio||1),Math.sqrt(8000000/(item.viewport.width*item.viewport.height)));
      const width=Math.ceil(item.viewport.width*output),height=Math.ceil(item.viewport.height*output);
      if(item.requestWidth===width&&item.paper.querySelector('canvas'))return;
      item.requestWidth=width;const ticket=item.rasterId=(item.rasterId||0)+1;item.task?.cancel();
      const canvas=document.createElement('canvas');canvas.setAttribute('aria-hidden','true');canvas.width=width;canvas.height=height;canvas.style.width=item.viewport.width+'px';canvas.style.height=item.viewport.height+'px';
      const task=item.page.render({canvasContext:canvas.getContext('2d'),viewport:item.viewport,transform:[output,0,0,output,0,0],intent:'display'});item.task=task;
      try{await task.promise;if(token!==revision||ticket!==item.rasterId)return;const previous=item.paper.querySelector('canvas');if(previous)previous.replaceWith(canvas);else item.paper.prepend(canvas);item.pixels=width*height;
        const cached=pages.filter(p=>p.pixels&&p!==item).sort((a,b)=>Math.abs(a.slot.getBoundingClientRect().top-view.getBoundingClientRect().top)-Math.abs(b.slot.getBoundingClientRect().top-view.getBoundingClientRect().top));for(const old of cached.slice(3))release(old);
      }catch(error){if(error.name!=='RenderingCancelledException'&&token===revision)throw error;}
    }
    function scale(){
      const width=view.clientWidth-20;if(width<=0)return;
      for(const item of pages){const availableHeight=view.clientHeight-20;const fitPage=!!view.closest('#section-input')&&!view.closest('dialog');const factor=fitPage&&availableHeight>0?Math.min(width/item.viewport.width,availableHeight/item.viewport.height):width/item.viewport.width;item.slot.style.width=item.viewport.width*factor+'px';item.slot.style.height=item.viewport.height*factor+'px';item.paper.style.transform=`scale(${factor})`;item.paper.dataset.displayScale=String(factor);if(item.started&&nearby(item))raster(item,revision).catch(()=>message('A page could not be displayed.'));}
    }
    new ResizeObserver(scale).observe(view);
    let densityQuery;
    function watchDensity(){densityQuery?.removeEventListener('change',densityChanged);densityQuery=matchMedia(`(resolution: ${global.devicePixelRatio||1}dppx)`);densityQuery.addEventListener('change',densityChanged);}
    function densityChanged(){scale();watchDensity();}
    watchDensity();global.addEventListener('resize',scale);
    let lastDensity=global.devicePixelRatio||1;
    const densityTimer=setInterval(()=>{const next=global.devicePixelRatio||1;if(next!==lastDensity){lastDensity=next;densityChanged();}},500);
    async function paint(item,token,pdfjs){
      if(token!==revision)return;if(item.started){await raster(item,token);return;}item.started=true;
      try{
        const page=await pdf.getPage(item.number);if(token!==revision)return;
        item.page=page;await raster(item,token);if(token!==revision)return;
        const text=document.createElement('div');text.className='source-pdf-text';item.paper.append(text);
        item.text=new pdfjs.TextLayer({textContentSource:page.streamTextContent(),container:text,viewport:item.viewport});await item.text.render();
        const annotations=await page.getAnnotations({intent:'display'});if(token!==revision)return;
        for(const annotation of annotations){
          if(annotation.subtype!=='Link'||!annotation.url)continue;
          let url;try{url=new URL(annotation.url);if(!['https:','http:','mailto:','tel:'].includes(url.protocol))continue;}catch{continue;}
          const [a,b,c,d,e,f]=item.viewport.transform,point=(x,y)=>[a*x+c*y+e,b*x+d*y+f];
          const rect=[...point(annotation.rect[0],annotation.rect[1]),...point(annotation.rect[2],annotation.rect[3])],link=document.createElement('a');
          link.className='source-pdf-link';link.href=url.href;link.target='_blank';link.rel='noopener noreferrer';link.setAttribute('aria-label',url.href);
          Object.assign(link.style,{left:Math.min(rect[0],rect[2])+'px',top:Math.min(rect[1],rect[3])+'px',width:Math.abs(rect[2]-rect[0])+'px',height:Math.abs(rect[3]-rect[1])+'px'});item.paper.append(link);
        }
        item.slot.dataset.rendered='true';
      }catch(error){
        if(token!==revision||error.name==='RenderingCancelledException')return;
        item.slot.dataset.rendered='error';message('A page could not be displayed.');
      }
    }
    async function setFile(file){
      const token=++revision;stop();wrap.classList.toggle('has-file',!!file);message('');
      view.dataset.state=file?'loading':'empty';view.setAttribute('aria-busy',String(!!file));
      if(!file)return;
      message('Loading CV preview…');
      try{
        const [pdfjs,bytes]=await Promise.all([library(),file.arrayBuffer()]);if(token!==revision)return;
        loading=pdfjs.getDocument({data:new Uint8Array(bytes),isEvalSupported:false,enableXfa:false,cMapUrl:new URL('cmaps/',assetBase).href,cMapPacked:true,standardFontDataUrl:new URL('standard_fonts/',assetBase).href,wasmUrl:new URL('wasm/',assetBase).href,iccUrl:new URL('iccs/',assetBase).href});
        const source=await loading.promise;if(token!==revision){await source.destroy();return;}pdf=source;
        for(let number=1;number<=pdf.numPages;number++){
          const page=await pdf.getPage(number);if(token!==revision)return;
          const viewport=page.getViewport({scale:1.5}),slot=document.createElement('div'),paper=document.createElement('div');
          slot.className='source-pdf-slot';slot.setAttribute('role','group');slot.setAttribute('aria-label',`Page ${number}`);
          paper.className='source-pdf-paper';paper.style.width=viewport.width+'px';paper.style.height=viewport.height+'px';paper.style.setProperty('--total-scale-factor',String(viewport.scale*(viewport.userUnit||1)));
          slot.append(paper);view.append(slot);pages.push({number,viewport,slot,paper});
        }
        view.dataset.pageCount=String(pdf.numPages);scale();
        await paint(pages[0],token,pdfjs);if(token!==revision)return;
        if(pages[0].slot.dataset.rendered!=='true')throw Error('Page rendering failed');
        observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){const item=pages.find(item=>item.slot===entry.target);if(item)void paint(item,token,pdfjs).catch(()=>message('A page could not be displayed.'));}},{root:view,rootMargin:'300px'});
        for(const item of pages)observer.observe(item.slot);
        message('');view.dataset.state='ready';view.setAttribute('aria-busy','false');
      }catch(error){
        if(token!==revision)return;stop();view.dataset.state='error';view.setAttribute('aria-busy','false');
        message(error.name==='PasswordException'?'This PDF is password-protected. Choose an unlocked PDF.':'This PDF could not be previewed. Choose a readable PDF to try again.');
      }
    }
    global.addEventListener('beforeunload',()=>{clearInterval(densityTimer);densityQuery?.removeEventListener('change',densityChanged);revision++;stop();},{once:true});
    return {setFile};
  }
  global.DraftedUploadedPdf={create};
})(window);
