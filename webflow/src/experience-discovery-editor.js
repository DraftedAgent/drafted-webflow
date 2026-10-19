/* Editor adapter for the existing discovery session/client/UI. No CV mutation path. */
(function(root){
  'use strict';
  function create({host,getContext,endpoint}){
    const session=new root.DraftedExperienceDiscovery.Session(),client=new root.DraftedDiscoveryClient.Client({endpoint});
    host.closest('.section-editor')?.classList.add('discovery-enabled');
    const panel=document.createElement('section');panel.className='drafted-discovery';panel.setAttribute('aria-label','Frågor om din erfarenhet');panel.hidden=true;host.append(panel);
    let fingerprint='',generation=0,language='sv',closed=false;
    const el=(tag,text)=>{const e=document.createElement(tag);if(text)e.textContent=text;return e;};
    const button=(label,fn)=>{const b=el('button',label);b.type='button';b.addEventListener('click',fn);return b;};
    function showRound(){root.DraftedExperienceDiscoveryUI.mount(panel,session,{onAnswer:t=>client.submit(session,t),onRetry:()=>client.retry(session),onContinue:()=>{closed=true;showOffer(true);}});}
    async function start(){const epoch=generation;const selected=panel.querySelector('select');language=selected?selected.value:language;panel.replaceChildren(el('p',language==='sv'?'Jag förbereder frågorna…':'Preparing your questions…'));try{const result=await client.plan(session,language);if(result.stale||epoch!==generation)return;session.start();showRound();}catch{if(epoch!==generation)return;showOffer(false,true);}}
    function showOffer(resume=false,error=false){panel.replaceChildren();panel.append(el('h2',resume?'Dina erfarenhetssvar':'Vill du berätta mer om din erfarenhet?'));if(resume){panel.append(el('p','Dina svar finns kvar här. CV:t har inte ändrats.'),button('Visa eller rätta svar',()=>showRound()));return;}
      panel.append(el('p',error?'Frågorna kunde inte hämtas. Du kan försöka igen eller fortsätta med CV:t.':'Vi kan gå igenom det som är viktigt för rollen men inte syns tydligt i ditt CV. En fråga i taget.'));
      const label=el('label','Samtalsspråk '),select=el('select');select.setAttribute('aria-label','Samtalsspråk');for(const [value,name]of [['sv','Svenska'],['en','English']]){const option=el('option',name);option.value=value;select.append(option);}select.value=language;label.append(select);panel.append(label,button(error?'Försök hämta frågorna igen':'Gå igenom erfarenheter',start),button('Inte nu',()=>{closed=true;panel.replaceChildren(button('Öppna erfarenhetsfrågorna',()=>{closed=false;showOffer();}));}));
    }
    function invalidate(){generation++;fingerprint='';closed=false;panel.hidden=true;const c=session.snapshot().context;if(c)session.setContext({...c,revision:crypto.randomUUID()});}
    function sync(){const context=getContext();if(!context){if(fingerprint)invalidate();return;}const key=JSON.stringify(context);if(key===fingerprint)return;generation++;fingerprint=key;closed=false;session.setContext({...context,revision:crypto.randomUUID()});panel.hidden=false;showOffer();}
    return {sync,invalidate};
  }
  root.DraftedDiscoveryEditor={create};
})(globalThis);
