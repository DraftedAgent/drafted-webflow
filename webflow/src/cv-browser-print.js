/* Local prototype: print the existing page DOM, never build a second CV. */
(function(global){
  'use strict';
  async function prepare(host,title,stylesheet){
    await global.DraftedCvLayout.ready(host);
    const pages=[...host.querySelectorAll('.cv-page')];
    if(!pages.length||!stylesheet)throw Error('The document is not ready to print.');
    const copy=host.cloneNode(true);copy.style.width='210mm';
    copy.querySelectorAll('.is-selected').forEach(el=>el.classList.remove('is-selected'));
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
        await new Promise(resolve=>frame.contentWindow.requestAnimationFrame(()=>frame.contentWindow.requestAnimationFrame(resolve)));
      })(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Print preparation timed out. Please try again.')),15000);})]);}finally{clearTimeout(timer);}
      await global.DraftedCvLayout.ready(host);
      const current=[...host.querySelectorAll('.cv-page')];
      if(current.length!==pages.length||pages.some((page,i)=>page!==current[i]))throw Error('Your CV or design changed. Please print again.');
      frame.dataset.cvPrint='ready';frame.dataset.pageCount=String(pages.length);frame.dataset.cvDesign=host.dataset.cvDesign;
      return frame;
    }catch(error){frame.remove();throw error;}
  }
  function create({host,controls,getTitle}){
    const stylesheet=document.querySelector('link[href*="drafted-editor.css"]')?.href;
    const button=document.createElement('button');button.type='button';button.className='workspace-print-button';button.textContent='Print / Save as PDF';button.disabled=true;
    const help=document.createElement('details');help.className='workspace-print-help';
    const summary=document.createElement('summary');summary.textContent='How to save a PDF';
    const steps=document.createElement('ol');
    for(const text of ['Choose Save as PDF in the print destination list.','Use A4 paper, 100% scale and no margins.','Turn off headers and footers. Turn on background graphics.','Choose Save, enter a file name and select a location.']){const item=document.createElement('li');item.textContent=text;steps.append(item);}
    const mobile=document.createElement('p');mobile.textContent='On mobile, use the system PDF or save/share option where available. Names vary by browser. Cancel returns to your CV without changes.';
    help.append(summary,steps,mobile);
    const status=document.createElement('span');status.className='workspace-print-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
    controls.append(button,help,status);
    let state='loading',busy=false;
    const refresh=()=>{button.disabled=busy||state!=='ready'||Number(host.dataset.pageCount)<1;};
    button.addEventListener('click',async()=>{
      if(button.disabled)return;
      busy=true;refresh();status.textContent='Preparing the current design for printing…';let frame;
      try{
        frame=await prepare(host,getTitle(),stylesheet);
        frame.contentWindow.addEventListener('afterprint',()=>{frame.remove();busy=false;refresh();status.textContent='Print dialog closed. Your CV is unchanged.';button.focus({preventScroll:true});},{once:true});
        status.textContent='Choose Save as PDF in the print dialog.';
        frame.contentWindow.print();
      }catch(error){frame?.remove();busy=false;refresh();status.textContent=error.message||'The print dialog could not be opened.';}
    });
    return {setState(next){state=next;refresh();}};
  }
  global.DraftedCvBrowserPrint={create,prepare};
})(window);
