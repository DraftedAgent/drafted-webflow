/* Detached Tailor presentation. Canonical CV data stays with the editor. */
(function(global){
  'use strict';
  function create({host,controls,candidate,render,isCurrent,onClose}){
    const model=JSON.parse(JSON.stringify(candidate)),pane=()=>host.closest('.cv-document');
    const group=document.createElement('div');group.className='tailor-preview-switch';group.setAttribute('role','group');group.setAttribute('aria-label','CV review version');
    const status=document.createElement('span');status.className='tailor-preview-status';status.textContent='Not applied';status.setAttribute('role','status');
    let mode='current',anchor=null,pendingAnchor=false,disposed=false,timer;
    const buttons={};
    for(const label of ['Current','Suggested']){const button=document.createElement('button');button.type='button';button.textContent=label;button.setAttribute('aria-pressed',String(label==='Current'));button.addEventListener('click',()=>show(label.toLowerCase()));buttons[label.toLowerCase()]=button;group.append(button);}
    const close=document.createElement('button');close.type='button';close.textContent='×';close.className='tailor-preview-close';close.setAttribute('aria-label','Close CV review');close.addEventListener('click',onClose);group.append(status,close);controls.append(group);
    function nodes(id){return [...host.querySelectorAll('.cv-block[data-block-id]')].filter(n=>n.dataset.blockId===id);}
    function capture(){
      const bounds=pane()?.getBoundingClientRect();if(!bounds)return null;
      const all=[...host.querySelectorAll('.cv-block[data-block-id]')],node=all.find(n=>{const r=n.getBoundingClientRect();return r.bottom>bounds.top+18&&r.top<bounds.bottom;});
      return node?{id:node.dataset.blockId,fragment:nodes(node.dataset.blockId).indexOf(node),offset:node.getBoundingClientRect().top-bounds.top}:null;
    }
    function restore(saved,highlight=false){
      const scroll=pane(),matches=saved&&nodes(saved.id);if(!scroll||!matches?.length)return;
      const target=matches[Math.min(saved.fragment||0,matches.length-1)];scroll.scrollTop+=target.getBoundingClientRect().top-scroll.getBoundingClientRect().top-saved.offset;
      if(highlight){clearTimeout(timer);host.querySelectorAll('.is-tailor-reviewed').forEach(n=>n.classList.remove('is-tailor-reviewed'));for(const node of matches)node.classList.add('is-tailor-reviewed');timer=setTimeout(()=>host.querySelectorAll('.is-tailor-reviewed').forEach(n=>n.classList.remove('is-tailor-reviewed')),3000);}
    }
    function show(next,blockId){
      if(disposed||!isCurrent())return;
      anchor=blockId?{id:blockId,fragment:0,offset:18}:capture()||anchor;pendingAnchor=true;mode=next;
      for(const [key,button] of Object.entries(buttons))button.setAttribute('aria-pressed',String(key===mode));
      render();
    }
    return {
      suggested:()=>mode==='suggested'&&!disposed,
      model:()=>mode==='suggested'&&!disposed?model:null,
      navigate(blockId){show('suggested',blockId);},
      beforeRender(){if(!pendingAnchor)anchor=capture()||anchor;pendingAnchor=false;},
      afterRender(){restore(anchor,true);},
      dispose(){
        const saved=capture()||anchor;disposed=true;clearTimeout(timer);group.remove();host.querySelectorAll('.is-tailor-reviewed').forEach(n=>n.classList.remove('is-tailor-reviewed'));
        // The owner clears its presentation reference before requesting Current.
        Promise.resolve(render()).then(()=>{if(host.dataset.cvPreviewMode==='current')restore(saved);}).catch(()=>{});
      }
    };
  }
  global.DraftedTailorCvPreview={create};
})(window);
