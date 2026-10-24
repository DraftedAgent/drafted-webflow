/* Experience questions are an optional mode inside the existing editor. */
(function(root){
  'use strict';
  function create({host,getContext,endpoint,onTailor=()=>{},sourceTailoring=false,getTailorBusy=()=>false,getTailorState=()=>getTailorBusy()?'preparing':'ready',onSourceStateChange=()=>{},getSourceNotice=()=>''}){
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
    const guidance=el('section');guidance.className='discovery-guidance';guidance.id='drafted-discovery-guidance';guidance.setAttribute('aria-label','Next step');guidance.hidden=true;host.prepend(guidance);
    let fingerprint='',generation=0,opened=false,prepared=false,pending=false,savedScroll=0,planState='idle',planController=null;
    const count=el('span');count.className='discovery-count';count.id='drafted-experience-count';count.setAttribute('role','status');launcher.setAttribute('aria-describedby',count.id);count.hidden=true;launcher.append(count);launcher.setAttribute('aria-label','Experience questions');
    function remainingQuestions(){const r=session.round();return r.queue.filter(q=>['unanswered','answered'].includes(q.status)||q.id===session.current()?.id&&['followup','correct','error'].includes(r.phase)).length;}
    function updateGuidance(){
      guidance.replaceChildren();guidance.hidden=true;
      if(getTailorState()!=='ready')return;
      if(planState!=='ready')return;
      const r=session.round();if(!r.total)return;
      const remaining=remainingQuestions();
      guidance.hidden=false;
      if(remaining){
        guidance.append(el('h2','Your CV may not tell the whole story.'),el('p',`We have ${remaining} prioritized ${remaining===1?'question':'questions'} about experience that could be relevant to this job. ${sourceTailoring?`Answer ${remaining===1?'it':'them'} to help Drafted tailor your CV.`:`Review ${remaining===1?'it':'them'} to explore experience that is not clear in your CV.`}`),button('Review questions',open));
        if(session.moreCount())guidance.append(el('p',`Start with ${remaining===1?'this question':'these '+remaining+' questions'}. You can explore ${session.moreCount()} more afterwards.`));
      }else{
        guidance.append(el('h2','Ready to tailor your CV.'),el('p',sourceTailoring&&session.accountsForRound().length?'Drafted can now use your answers and the job ad to suggest improvements.':'Drafted can use your current CV and the job ad to suggest improvements.'),button('Tailor my CV',()=>onTailor()));
      }
      if(r.phase==='complete'&&session.moreCount())guidance.append(button(`Explore more questions (${session.moreCount()})`,()=>{if(session.continueQuestions()){prepared=false;if(opened)showRound();else open();updatePlanIndicator();}}));
      const note=el('p',sourceTailoring?'Review the suggestion before choosing Apply.':'Tailoring currently uses only your CV and the job ad. Your answers stay here for review.');note.className='discovery-note';guidance.append(note);let sourceNotice='';if(sourceTailoring){try{sourceNotice=getSourceNotice();}catch{sourceNotice='Answer details could not be checked. Your CV has not changed.';}}if(sourceNotice){const status=el('p',sourceNotice);status.className='tailor-review-warning';status.setAttribute('role','status');guidance.append(status);}
    }
    function setLabel(label){launcher.replaceChildren(document.createTextNode(label),count);launcher.setAttribute('aria-label',label);}
    function updatePlanIndicator(){
      launcher.dataset.planState=planState;launcher.setAttribute('aria-busy',String(pending));
      const remaining=planState==='ready'?remainingQuestions():0;
      count.hidden=remaining===0;count.textContent=remaining?String(remaining):'';
      count.setAttribute('aria-label',remaining+' experience '+(remaining===1?'question':'questions')+' remaining');
      launcher.title=planState==='ready'?(remaining?remaining+' '+(remaining===1?'question':'questions')+' remaining':'Review your answers'):planState==='loading'?'Preparing questions in the background':planState==='error'?'Questions could not be prepared. Open to retry.':'Explore your experience';
    }
    function close(focus=false){if(planState==='ready'&&session.round().phase==='complete'){prepared=false;setLabel('Review your answers');}updateGuidance();opened=false;panel.hidden=true;card.classList.remove('discovery-mode');launcher.setAttribute('aria-expanded','false');launcher.setAttribute('aria-pressed','false');chatMode.setAttribute('aria-pressed','true');host.scrollTop=savedScroll;if(focus)card.querySelector('#editor-input')?.focus({preventScroll:true});}
    function focusQuestion(){if(opened){const target=body.querySelector('textarea,h2,[role=alert]');if(target){if(target.tagName!=='TEXTAREA')target.tabIndex=-1;target.focus({preventScroll:true});}}}
    function showRound(){root.DraftedExperienceDiscoveryUI.mount(body,session,{onAnswer:t=>{const result=client.submit(session,t);if(result)return result.finally(updateGuidance);updateGuidance();return result;},onRetry:id=>client.retry(session,id).finally(updateGuidance),onStateChange:()=>{back.hidden=session.round().phase==='complete';updateGuidance();updatePlanIndicator();onSourceStateChange();},sourceTailoring,getTailorState,onFinishAndTailor:()=>{session.finish();prepared=false;setLabel('Review your answers');close(true);return onTailor();},onContinue:()=>{prepared=false;setLabel('Review your answers');close(true);}});prepared=true;focusQuestion();}
    function activate(){if(!session.round().total){body.replaceChildren(el('h2','No additional experience questions'),el('p','No further questions were identified for this CV and job ad. You can keep working in the editor.'));prepared=true;return;}if(session.round().phase==='offer')session.start();showRound();}
    async function start(){if(pending)return;const epoch=generation,controller=new AbortController();planController=controller;pending=true;planState='loading';updatePlanIndicator();body.replaceChildren(el('p','Preparing your questions…'));body.setAttribute('aria-busy','true');try{const result=await client.plan(session,'en',{signal:controller.signal});if(result.stale||epoch!==generation)return;planState='ready';updateGuidance();if(opened)activate();else body.replaceChildren();}catch{if(epoch!==generation)return;planState='error';body.replaceChildren(el('h2','Your questions could not be loaded'),el('p','You can try again or return to the editor.'),button('Try loading the questions again',start));focusQuestion();}finally{if(epoch===generation){if(planController===controller)planController=null;pending=false;body.removeAttribute('aria-busy');updatePlanIndicator();}}}
    function open(){if(!fingerprint||opened)return;savedScroll=host.scrollTop;opened=true;panel.hidden=false;card.classList.add('discovery-mode');launcher.setAttribute('aria-expanded','true');launcher.setAttribute('aria-pressed','true');chatMode.setAttribute('aria-pressed','false');host.scrollTop=0;back.focus({preventScroll:true});
      if(planState==='ready'&&!prepared)activate();else focusQuestion();
    }
    // Escape pauses questions, retaining the mounted answer form and any draft.
    panel.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();close(true);}});
    function invalidate(){generation++;planController?.abort();planController=null;fingerprint='';prepared=false;pending=false;planState='idle';close();guidance.hidden=true;launcher.hidden=true;setLabel('Experience questions');count.hidden=true;launcher.removeAttribute('aria-busy');launcher.dataset.planState='idle';body.replaceChildren();body.removeAttribute('aria-busy');const c=session.snapshot().context;if(c)session.setContext({...c,revision:crypto.randomUUID()});}
    function sync(){const context=getContext();if(!context){if(fingerprint)invalidate();return;}const key=JSON.stringify(context);if(key===fingerprint)return;invalidate();fingerprint=key;session.setContext({...context,revision:crypto.randomUUID()});launcher.hidden=false;start();onSourceStateChange();}
    return {sync,invalidate,
      refreshTailorState:updateGuidance,
      showChat:(processed=false)=>{if(processed){prepared=false;setLabel('Review your answers');}close(true);},
      sourceContext:applications=>planState==='ready'?session.sourceContext(applications):null,
      appendContext:(id,revision,text)=>{session.appendContext(id,revision,text);prepared=false;updateGuidance();},
      adoptRepresentation:(blocks,version)=>{if(planState!=='ready')return;session.adoptRepresentation(blocks,version);fingerprint=JSON.stringify(getContext());prepared=false;updateGuidance();},
      sourceContentRevision:()=>{const s=session.snapshot();return JSON.stringify(s.answers.filter(a=>a.roundId===s.round?.id).map(a=>({id:a.id,revision:a.currentRevision,text:a.revisions.at(-1)?.text,status:a.status})));},
      sourceRevision:()=>JSON.stringify({context:session.snapshot().context?.revision,answers:session.snapshot().answers,phase:session.snapshot().round?.phase,index:session.snapshot().round?.index})};
  }
  root.DraftedDiscoveryEditor={create};
})(globalThis);
