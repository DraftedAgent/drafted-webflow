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
    let fingerprint='',generation=0,opened=false,prepared=false,pending=false,savedScroll=0,planState='idle',planController=null;
    const count=el('span');count.className='discovery-count';count.id='drafted-experience-count';count.setAttribute('role','status');launcher.setAttribute('aria-describedby',count.id);count.hidden=true;launcher.append(count);launcher.setAttribute('aria-label','Experience questions');
    function setLabel(label){launcher.replaceChildren(document.createTextNode(label),count);launcher.setAttribute('aria-label',label);}
    function updatePlanIndicator(){launcher.dataset.planState=planState;launcher.setAttribute('aria-busy',String(pending));count.hidden=planState!=='ready';if(planState==='ready'){count.textContent=String(session.round().total);count.setAttribute('aria-label',session.round().total+' experience questions ready');launcher.title=session.round().total+' questions about experience that is not clear in this CV';}else launcher.title=planState==='loading'?'Preparing questions in the background':planState==='error'?'Questions could not be prepared. Open to retry.':'Explore your experience';}
    function close(focus=false){opened=false;panel.hidden=true;card.classList.remove('discovery-mode');launcher.setAttribute('aria-expanded','false');launcher.setAttribute('aria-pressed','false');chatMode.setAttribute('aria-pressed','true');host.scrollTop=savedScroll;if(focus)card.querySelector('#editor-input')?.focus({preventScroll:true});}
    function focusQuestion(){if(opened){const target=body.querySelector('textarea,h2,[role=alert]');if(target){if(target.tagName!=='TEXTAREA')target.tabIndex=-1;target.focus({preventScroll:true});}}}
    function showRound(){root.DraftedExperienceDiscoveryUI.mount(body,session,{onAnswer:t=>client.submit(session,t),onRetry:id=>client.retry(session,id),onContinue:()=>{prepared=false;setLabel('Review your answers');close(true);}});prepared=true;focusQuestion();}
    function activate(){if(!session.round().total){body.replaceChildren(el('h2','No additional experience questions'),el('p','No further questions were identified for this CV and job ad. You can keep working in the editor.'));prepared=true;return;}if(session.round().phase==='offer')session.start();showRound();}
    async function start(){if(pending)return;const epoch=generation,controller=new AbortController();planController=controller;pending=true;planState='loading';updatePlanIndicator();body.replaceChildren(el('p','Preparing your questions…'));body.setAttribute('aria-busy','true');try{const result=await client.plan(session,'en',{signal:controller.signal});if(result.stale||epoch!==generation)return;planState='ready';if(opened)activate();else body.replaceChildren();}catch{if(epoch!==generation)return;planState='error';body.replaceChildren(el('h2','Your questions could not be loaded'),el('p','You can try again or return to the editor.'),button('Try loading the questions again',start));focusQuestion();}finally{if(epoch===generation){if(planController===controller)planController=null;pending=false;body.removeAttribute('aria-busy');updatePlanIndicator();}}}
    function open(){if(!fingerprint||opened)return;savedScroll=host.scrollTop;opened=true;panel.hidden=false;card.classList.add('discovery-mode');launcher.setAttribute('aria-expanded','true');launcher.setAttribute('aria-pressed','true');chatMode.setAttribute('aria-pressed','false');host.scrollTop=0;back.focus({preventScroll:true});
      if(planState==='ready'&&!prepared)activate();else focusQuestion();
    }
    // Escape pauses questions, retaining the mounted answer form and any draft.
    panel.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();close(true);}});
    function invalidate(){generation++;planController?.abort();planController=null;fingerprint='';prepared=false;pending=false;planState='idle';close();launcher.hidden=true;setLabel('Experience questions');count.hidden=true;launcher.removeAttribute('aria-busy');launcher.dataset.planState='idle';body.replaceChildren();body.removeAttribute('aria-busy');const c=session.snapshot().context;if(c)session.setContext({...c,revision:crypto.randomUUID()});}
    function sync(){const context=getContext();if(!context){if(fingerprint)invalidate();return;}const key=JSON.stringify(context);if(key===fingerprint)return;invalidate();fingerprint=key;session.setContext({...context,revision:crypto.randomUUID()});launcher.hidden=false;start();}
    return {sync,invalidate};
  }
  root.DraftedDiscoveryEditor={create};
})(globalThis);
