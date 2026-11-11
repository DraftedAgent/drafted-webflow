/* Local prototype: print the existing page DOM, never build a second CV. */
(function(global){
  'use strict';
  async function prepare(host,title,stylesheet){
    const check=()=>{if(host.dataset.cvPreviewMode==='suggested')throw Error('Switch to Current before exporting.');if(host.dataset.cvPreviewMode==='original')throw Error('Use Export PDF to export your current CV.');};check();
    await global.DraftedCvLayout.ready(host);
    check();
    const pages=[...host.querySelectorAll('.cv-page')];
    if(!pages.length||!stylesheet)throw Error('The document is not ready to print.');
    const copy=host.cloneNode(true);copy.style.cssText='width:210mm;position:static;visibility:visible';copy.removeAttribute('aria-hidden');
    copy.querySelectorAll('[data-cv-editor-only]').forEach(el=>el.remove());
    copy.querySelectorAll('.is-selected,.is-tailor-reviewed').forEach(el=>el.classList.remove('is-selected','is-tailor-reviewed'));
    copy.querySelectorAll('.cv-page').forEach(el=>el.style.transform='none');
    copy.querySelectorAll('.cv-page-slot').forEach(el=>{el.style.width='210mm';el.style.height='297mm';});
    const frame=document.createElement('iframe');frame.title='CV print document';frame.tabIndex=-1;frame.setAttribute('aria-hidden','true');frame.dataset.cvPrint='preparing';
    frame.style.cssText='position:fixed;left:-20000px;top:0;width:210mm;height:297mm;border:0;pointer-events:none';
    (host.closest('dialog[open]')||document.body).append(frame);
    try{
      const doc=frame.contentDocument;doc.title=title||'CV';
      const style=doc.createElement('style');style.textContent='html,body{margin:0!important;padding:0!important;background:white!important;height:auto!important;min-height:0!important;max-height:none!important;overflow:visible!important}';
      const link=doc.createElement('link');link.rel='stylesheet';link.href=stylesheet;
      const loaded=new Promise((resolve,reject)=>{link.onload=resolve;link.onerror=()=>reject(Error('Document styles could not be loaded.'));});
      doc.head.append(link,style);doc.body.append(copy);
      let timer;
      try{await Promise.race([(async()=>{
        await loaded;
        const fonts=await Promise.all([doc.fonts.load('14px "Drafted Sans"'),doc.fonts.load('700 14px "Drafted Sans"')]);
        if(fonts.some(list=>!list.length))throw Error('Document fonts are unavailable.');
        await doc.fonts.ready;
        await Promise.all([...doc.images].map(image=>image.decode()));
        await new Promise(resolve=>frame.contentWindow.requestAnimationFrame(()=>frame.contentWindow.requestAnimationFrame(resolve)));
      })(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Print preparation timed out. Please try again.')),15000);})]);}finally{clearTimeout(timer);}
      await global.DraftedCvLayout.ready(host);
      const current=[...host.querySelectorAll('.cv-page')];
      check();
      if(current.length!==pages.length||pages.some((page,i)=>page!==current[i]))throw Error('Your CV or design changed. Please print again.');
      frame.dataset.cvPrint='ready';frame.dataset.pageCount=String(pages.length);frame.dataset.cvDesign=host.dataset.cvDesign;
      return frame;
    }catch(error){frame.remove();throw error;}
  }
  function create({host,controls,getTitle,getEdited,getError}){
    const stylesheet=document.querySelector('link[href*="drafted-editor.css"]')?.href;
    const button=global.DraftedWorkspaceView.iconButton('Export PDF','workspace-print-button','<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>');button.disabled=true;
    const status=document.createElement('span');status.className='workspace-print-status';status.setAttribute('role','alert');status.hidden=true;
    controls.insertBefore(button,controls.querySelector('.workspace-close-preview'));controls.append(status);
    let state='loading',busy=false,noticeTimer;
    function dismissNotice(){clearTimeout(noticeTimer);status.hidden=true;status.replaceChildren();}
    let warmShown=false;try{warmShown=sessionStorage.getItem('drafted.export.greeting')==='shown';}catch{}
    function returnNotice(){
      if(status.hidden||!status.classList.contains('is-print-notice'))return;
      // Replay the fade when the dialog releases the page; its time does not
      // count toward the reading window while the native dialog covers it.
      status.style.animation='none';void status.offsetWidth;status.style.animation='';
      clearTimeout(noticeTimer);noticeTimer=setTimeout(dismissNotice,9000);
    }
    function openedNotice(){
      dismissNotice();status.setAttribute('role','status');status.classList.add('is-print-notice');status.classList.toggle('is-warm-greeting',!warmShown);
      const text=document.createElement('span');text.className='print-notice-copy';
      if(!warmShown){
        const title=document.createElement('strong'),body=document.createElement('span'),signature=document.createElement('strong');
        title.textContent='Your next chapter, well drafted.';
        body.textContent='Good luck with your application — we’re rooting for you.';
        signature.textContent='Drafted';text.append(title,body,signature);warmShown=true;try{sessionStorage.setItem('drafted.export.greeting','shown');}catch{}
      }else text.textContent='Ready to save as PDF';
      const dismiss=document.createElement('button');dismiss.type='button';dismiss.textContent='×';dismiss.setAttribute('aria-label','Dismiss print notice');dismiss.onclick=dismissNotice;
      status.append(text,dismiss);status.hidden=false;
    }
    const refresh=()=>{const suggested=host.dataset.cvPreviewMode==='suggested',label='Export PDF';button.disabled=suggested||busy||state!=='ready'||Number(host.dataset.pageCount)<1;button.title=suggested?'Switch to Current before exporting.':label;button.setAttribute('aria-label',label);const text=button.querySelector('.workspace-action-label');if(text)text.textContent=label;button.setAttribute('aria-busy',String(busy));};
    button.addEventListener('click',async()=>{
      if(button.disabled||host.dataset.cvPreviewMode==='suggested')return;
      busy=true;refresh();dismissNotice();status.classList.remove('is-print-notice');let frame,temporary;
      try{
        const validation=getError?.();if(validation)throw Error(validation);
        if(host.dataset.cvPreviewMode==='original'){
          if(!getEdited)throw Error('Edited CV is unavailable.');
          const model=getEdited(),stamp=JSON.stringify(model);
          temporary=document.createElement('div');temporary.className=host.className;temporary.style.cssText='position:fixed;left:-20000px;top:0;width:794px;visibility:hidden;pointer-events:none';
          (host.closest('dialog[open]')||document.body).append(temporary);
          await global.DraftedCvLayout.render(temporary,model);
          frame=await prepare(temporary,model.title,stylesheet);
          if(JSON.stringify(getEdited())!==stamp||host.dataset.cvPreviewMode==='suggested')throw Error('Your CV or preview changed. Please print again.');
        }else frame=await prepare(host,getTitle(),stylesheet);
        temporary?.remove();
        let returned=false;
        frame.contentWindow.addEventListener('afterprint',()=>{returned=true;frame.remove();busy=false;refresh();queueMicrotask(returnNotice);},{once:true});
        frame.contentWindow.print();
        openedNotice(); // Guidance to save, never a claim that a file was saved.
        if(returned)returnNotice();
      }catch(error){temporary?.remove();frame?.remove();busy=false;refresh();status.setAttribute('role','alert');status.hidden=false;status.textContent=error.message||'The print dialog could not be opened.';}
    });
    return {setState(next){state=next;refresh();}};
  }
  global.DraftedCvBrowserPrint={create,prepare};
})(window);
