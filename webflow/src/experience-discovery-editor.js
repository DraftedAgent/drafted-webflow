/* Experience questions are an optional mode inside the existing editor. */
(function(root){
  'use strict';
  function create({host,getContext,endpoint}){
    const session=new root.DraftedExperienceDiscovery.Session(),client=new root.DraftedDiscoveryClient.Client({endpoint,background:true});
    const card=host.closest('.chat-card');
    host.closest('.section-editor')?.classList.add('discovery-enabled');
    const el=(tag,text)=>{const e=document.createElement(tag);if(text)e.textContent=text;return e;};
    const button=(label,fn)=>{const b=el('button',label);b.type='button';b.addEventListener('click',fn);return b;};
    const panel=el('section');panel.className='drafted-discovery';panel.id='drafted-experience-questions';panel.setAttribute('aria-label','Questions about your experience');panel.hidden=true;
    const back=button('Back to editor',()=>close(true)),body=el('div');back.className='discovery-back';back.setAttribute('aria-label','Back to editor');panel.append(back,body);host.append(panel);
    const toolbar=el('div');toolbar.className='workspace-editor-toolbar';toolbar.setAttribute('role','toolbar');toolbar.setAttribute('aria-label','Editor tools');
    const chatMode=button('Chat',()=>close(true));chatMode.className='workspace-chat-mode';chatMode.setAttribute('aria-pressed','true');toolbar.append(chatMode);
    const launcher=button('Experience questions',open);launcher.className='discovery-launcher';launcher.hidden=true;launcher.setAttribute('aria-controls',panel.id);launcher.setAttribute('aria-expanded','false');launcher.title='Explore relevant experience that is not clear in your CV';launcher.setAttribute('aria-pressed','false');toolbar.append(launcher);card.querySelector('.chat-title').after(toolbar);
    const tailor=card.querySelector('#tailor-card');if(tailor){toolbar.append(tailor);const action=tailor.querySelector('#tailor-btn');if(action)action.textContent='Tailor to job';}
    let fingerprint='',generation=0,opened=false,prepared=false,pending=false,savedScroll=0;
    function close(focus=false){opened=false;panel.hidden=true;card.classList.remove('discovery-mode');launcher.setAttribute('aria-expanded','false');launcher.setAttribute('aria-pressed','false');chatMode.setAttribute('aria-pressed','true');host.scrollTop=savedScroll;if(focus)card.querySelector('#editor-input')?.focus({preventScroll:true});}
    function focusQuestion(){if(opened){const target=body.querySelector('textarea,h2,[role=alert]');if(target){if(target.tagName!=='TEXTAREA')target.tabIndex=-1;target.focus({preventScroll:true});}}}
    function showRound(){root.DraftedExperienceDiscoveryUI.mount(body,session,{onAnswer:t=>client.submit(session,t),onRetry:id=>client.retry(session,id),onContinue:()=>{prepared=false;launcher.textContent='Review your answers';close(true);}});prepared=true;focusQuestion();}
    async function start(){if(pending)return;const epoch=generation;pending=true;body.replaceChildren(el('p','Preparing your questions…'));body.setAttribute('aria-busy','true');try{const result=await client.plan(session,'en');if(result.stale||epoch!==generation)return;session.start();showRound();}catch{if(epoch!==generation)return;body.replaceChildren(el('h2','Your questions could not be loaded'),el('p','You can try again or return to the editor.'),button('Try loading the questions again',start));focusQuestion();}finally{if(epoch===generation){pending=false;body.removeAttribute('aria-busy');}}}
    function open(){if(!fingerprint||opened)return;savedScroll=host.scrollTop;opened=true;panel.hidden=false;card.classList.add('discovery-mode');launcher.setAttribute('aria-expanded','true');launcher.setAttribute('aria-pressed','true');chatMode.setAttribute('aria-pressed','false');host.scrollTop=0;back.focus({preventScroll:true});
      if(!body.childNodes.length)start();else if(!prepared&&!pending){try{session.round();showRound();}catch{/* Keep an existing load error until an explicit retry. */}}else focusQuestion();
    }
    // Escape pauses questions, retaining the mounted answer form and any draft.
    panel.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();close(true);}});
    function invalidate(){generation++;fingerprint='';prepared=false;pending=false;close();launcher.hidden=true;launcher.textContent='Experience questions';body.replaceChildren();body.removeAttribute('aria-busy');const c=session.snapshot().context;if(c)session.setContext({...c,revision:crypto.randomUUID()});}
    function sync(){const context=getContext();if(!context){if(fingerprint)invalidate();return;}const key=JSON.stringify(context);if(key===fingerprint)return;invalidate();fingerprint=key;session.setContext({...context,revision:crypto.randomUUID()});launcher.hidden=false;}
    return {sync,invalidate};
  }
  root.DraftedDiscoveryEditor={create};
})(globalThis);
