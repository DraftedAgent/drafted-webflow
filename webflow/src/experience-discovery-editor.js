/* Editor adapter for the existing discovery session/client/UI. No CV mutation path. */
(function(root){
  'use strict';
  function create({host,getContext,endpoint}){
    const session=new root.DraftedExperienceDiscovery.Session(),client=new root.DraftedDiscoveryClient.Client({endpoint});
    host.closest('.section-editor')?.classList.add('discovery-enabled');
    const panel=document.createElement('section');panel.className='drafted-discovery';panel.setAttribute('aria-label','Questions about your experience');panel.hidden=true;host.append(panel);
    let fingerprint='',generation=0,closed=false;
    const el=(tag,text)=>{const e=document.createElement(tag);if(text)e.textContent=text;return e;};
    const button=(label,fn)=>{const b=el('button',label);b.type='button';b.addEventListener('click',fn);return b;};
    function showRound(){root.DraftedExperienceDiscoveryUI.mount(panel,session,{onAnswer:t=>client.submit(session,t),onRetry:()=>client.retry(session),onContinue:()=>{closed=true;showOffer(true);}});}
    async function start(){const epoch=generation;panel.replaceChildren(el('p','Preparing your questions…'));try{const result=await client.plan(session,'en');if(result.stale||epoch!==generation)return;session.start();showRound();}catch{if(epoch!==generation)return;showOffer(false,true);}}
    function showOffer(resume=false,error=false){panel.replaceChildren();panel.append(el('h2',resume?'Your experience answers':'Would you like to share more about your experience?'));if(resume){panel.append(el('p','Your answers are still here. Your CV has not changed.'),button('View or correct your answers',()=>showRound()));return;}
      panel.append(el('p',error?'The questions could not be loaded. You can try again or continue with your CV.':'We can explore what matters for this role but is not clear in your CV. One question at a time.'));
      panel.append(button(error?'Try loading the questions again':'Explore your experience',start),button('Not now',()=>{closed=true;panel.replaceChildren(button('Open experience questions',()=>{closed=false;showOffer();}));}));
    }
    function invalidate(){generation++;fingerprint='';closed=false;panel.hidden=true;const c=session.snapshot().context;if(c)session.setContext({...c,revision:crypto.randomUUID()});}
    function sync(){const context=getContext();if(!context){if(fingerprint)invalidate();return;}const key=JSON.stringify(context);if(key===fingerprint)return;generation++;fingerprint=key;closed=false;session.setContext({...context,revision:crypto.randomUUID()});panel.hidden=false;showOffer();}
    return {sync,invalidate};
  }
  root.DraftedDiscoveryEditor={create};
})(globalThis);
