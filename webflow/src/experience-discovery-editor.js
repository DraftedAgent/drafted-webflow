/* Experience questions are an optional mode inside the existing editor. */
(function(root){
  'use strict';
  function create({host,getContext,endpoint,onUseAnswers=null,onInvalidateSources=()=>{}}){
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
    let fingerprint='',generation=0,opened=false,prepared=false,pending=false,savedScroll=0,planState='idle',planController=null,guidanceDismissed=false,guidanceKey='',mountedView=null,proposalState={state:'unused',answerIds:[]};
    const count=el('span');count.className='discovery-count';count.id='drafted-experience-count';count.hidden=true;launcher.append(count);launcher.setAttribute('aria-label','Experience questions');
    const tabStatus=el('span');tabStatus.className='discovery-tab-status';tabStatus.id='drafted-experience-status';tabStatus.setAttribute('role','status');tabStatus.hidden=true;launcher.append(tabStatus);launcher.setAttribute('aria-describedby',tabStatus.id);
    const guidance=el('section');guidance.className='discovery-guidance';guidance.setAttribute('aria-label','Experience questions status');guidance.hidden=true;host.prepend(guidance);
    function dismissGuidance(){guidanceDismissed=true;renderGuidance();card.querySelector('#editor-input')?.focus({preventScroll:true});}
    function renderGuidance(){
      // Upload replaces chat messages; reattach this view without adding to chatHistory.
      if(guidance.parentNode!==host)host.prepend(guidance);
      guidance.hidden=!fingerprint||opened||guidanceDismissed||planState==='idle';
      if(guidance.hidden)return;
      const total=planState==='ready'?session.round().total:0,key=planState+':'+total;
      if(guidanceKey===key)return;guidanceKey=key;guidance.dataset.state=planState;
      const title=el('h2'),text=el('p'),actions=el('div');actions.className='discovery-guidance-actions';
      if(planState==='loading'){
        title.textContent='Preparing experience questions';text.textContent='Checking this CV against the job ad. You can keep editing while we look for useful questions.';
      }else if(planState==='error'){
        title.textContent='Your questions could not be prepared';text.textContent='Your CV and editing draft are unchanged. You can try again when you are ready.';
        const retry=button('Try again',start);retry.className='discovery-guidance-primary';actions.append(retry);
      }else if(total){
        title.textContent=total===1?'1 experience question is ready':total+' experience questions are ready';
        text.textContent='Share relevant experience that is not clear in this CV. Your answers stay separate from your CV and are not yet used in CV suggestions.';
        const answer=button(total===1?'Answer 1 question':`Answer ${total} questions`,open);answer.className='discovery-guidance-primary';actions.append(answer);
      }else{
        title.textContent='No additional experience questions';text.textContent='No further questions were identified for this CV and job ad. You can keep working in the editor.';
      }
      actions.append(button('Continue editing',dismissGuidance));guidance.replaceChildren(title,text,actions);
    }
    function updatePlanIndicator(){
      launcher.dataset.planState=planState;launcher.setAttribute('aria-busy',String(pending));count.hidden=planState!=='ready';tabStatus.hidden=planState==='idle';
      if(planState==='ready'){
        const r=session.round();count.textContent=String(r.total);count.setAttribute('aria-label',r.total+' experience questions');launcher.setAttribute('aria-describedby',count.id+' '+tabStatus.id);
        tabStatus.textContent=!r.total?'No questions':r.phase==='complete'?'Review answers':r.phase==='offer'?'Ready':'In progress';
        launcher.title=r.total+' questions about experience that is not clear in this CV';
      }else{launcher.setAttribute('aria-describedby',tabStatus.id);tabStatus.textContent=planState==='loading'?'Preparing questions…':planState==='error'?'Could not prepare questions':'';launcher.title=tabStatus.textContent;}
      renderGuidance();
    }
    function close(focus=false){opened=false;panel.hidden=true;card.classList.remove('discovery-mode');launcher.setAttribute('aria-expanded','false');launcher.setAttribute('aria-pressed','false');chatMode.setAttribute('aria-pressed','true');updatePlanIndicator();host.scrollTop=savedScroll;if(focus)card.querySelector('#editor-input')?.focus({preventScroll:true});}
    function focusQuestion(){if(opened){const target=body.querySelector('textarea,h2,[role=alert]');if(target){if(target.tagName!=='TEXTAREA')target.tabIndex=-1;target.focus({preventScroll:true});}}}
    function showRound(){mountedView=root.DraftedExperienceDiscoveryUI.mount(body,session,{onAnswer:t=>{onInvalidateSources(session.current()?.id);return client.submit(session,t);},onRetry:id=>client.retry(session,id),onSourcesChange:onInvalidateSources,onUseAnswers:onUseAnswers?async()=>{const source=session.proposalSources();await onUseAnswers(source);if(proposalState.state==='ready'){close(true);host.scrollTop=host.scrollHeight;}}:null,getProposalState:()=>proposalState,onContinue:()=>{prepared=false;close(true);}});prepared=true;focusQuestion();}
    function activate(){if(!session.round().total){body.replaceChildren(el('h2','No additional experience questions'),el('p','No further questions were identified for this CV and job ad. You can keep working in the editor.'));prepared=true;return;}if(session.round().phase==='offer')session.start();showRound();}
    async function start(){if(pending)return;const epoch=generation,controller=new AbortController();planController=controller;pending=true;planState='loading';updatePlanIndicator();body.replaceChildren(el('p','Preparing your questions…'));body.setAttribute('aria-busy','true');try{const result=await client.plan(session,'en',{signal:controller.signal});if(result.stale||epoch!==generation)return;planState='ready';if(opened)activate();else body.replaceChildren();}catch{if(epoch!==generation)return;planState='error';body.replaceChildren(el('h2','Your questions could not be loaded'),el('p','You can try again or return to the editor.'),button('Try loading the questions again',start));focusQuestion();}finally{if(epoch===generation){if(planController===controller)planController=null;pending=false;body.removeAttribute('aria-busy');updatePlanIndicator();}}}
    function open(){if(!fingerprint||opened)return;savedScroll=host.scrollTop;guidanceDismissed=true;opened=true;panel.hidden=false;card.classList.add('discovery-mode');launcher.setAttribute('aria-expanded','true');launcher.setAttribute('aria-pressed','true');chatMode.setAttribute('aria-pressed','false');updatePlanIndicator();host.scrollTop=0;back.focus({preventScroll:true});
      if(planState==='ready'&&!prepared)activate();else focusQuestion();
    }
    // Escape pauses questions, retaining the mounted answer form and any draft.
    panel.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();close(true);}});
    function invalidate(){onInvalidateSources();generation++;planController?.abort();planController=null;fingerprint='';prepared=false;pending=false;planState='idle';guidanceDismissed=false;guidanceKey='';mountedView=null;proposalState={state:'unused',answerIds:[]};close();launcher.hidden=true;count.hidden=true;launcher.removeAttribute('aria-busy');launcher.dataset.planState='idle';body.replaceChildren();body.removeAttribute('aria-busy');const c=session.snapshot().context;if(c)session.setContext({...c,revision:crypto.randomUUID()});}
    function sync(){const context=getContext();if(!context){if(fingerprint)invalidate();return;}const key=JSON.stringify(context);if(key===fingerprint){renderGuidance();return;}invalidate();fingerprint=key;session.setContext({...context,revision:crypto.randomUUID()});launcher.hidden=false;start();}
    return {sync,invalidate,sourcesCurrent:source=>session.sourcesCurrent(source),acceptAppliedCV:()=>{const context=getContext();session.adoptApprovedCV({...context,revision:crypto.randomUUID()});fingerprint=JSON.stringify(context);},setProposalState:value=>{proposalState=value;mountedView?.render();}};
  }
  root.DraftedDiscoveryEditor={create};
})(globalThis);
