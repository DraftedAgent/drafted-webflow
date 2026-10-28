(function(root){
  'use strict';
  function mount(container,session,{onContinue=()=>{},onAnswer=text=>session.submit(text),onRetry=null,onStateChange=()=>{},onFinishAndTailor=null,sourceTailoring=false,getTailorState=()=> 'ready',onEditExperienceContext=null}={}){
    const drafts=new Map(),mountedRound=session.round().id;
    let error='',busy=false,disposed=false,renderedQuestion=null,renderedPhase=null;
    const el=(tag,value,cls)=>{const n=document.createElement(tag);if(value)n.textContent=value;if(cls)n.className=cls;return n;};
    const button=(label,fn)=>{const b=el('button',label);b.type='button';b.disabled=busy;b.addEventListener('click',async()=>{
      const question=session.current()?.id;
      try{error='';const result=fn();
        if(result&&typeof result.then==='function'){
          // Background work belongs to the submitted answer, not to the next input.
          busy=session.round().phase==='interpreting';render();await result;busy=false;
        }render();
      }catch(e){busy=false;if(question===session.current()?.id&&session.round().phase!=='complete')error=e.message==='ANSWER_TOO_LONG'?'Your answer is too long. Your text is kept. Please split it.':'Your answer is saved, but could not be read. You can retry it below.';render();}
    });return b;};
    function history(){
      const r=session.round(),answers=session.snapshot().answers.filter(a=>a.roundId===r.id);if(!answers.length&&r.phase!=='complete')return;
      const details=el('details');details.className='discovery-history';details.append(el('summary','View or correct your answers'));
      for(const a of answers){const q=r.queue.find(q=>q.id===a.questionId),latest=a.revisions.at(-1);details.append(el('p',q.question,'discovery-history-question'));
        if(latest.followupReply!==undefined){details.append(el('p',a.revisions.at(-2).text,'discovery-answer'),el('p','Your clarification','discovery-result-label'),el('p',latest.followupReply,'discovery-answer'));}else details.append(el('p',latest.text,'discovery-answer'));
        if(latest.experienceContext)details.append(el('p','Saved context: '+root.DraftedExperienceContext.describe(latest.experienceContext),'discovery-saved-context'));
        if(onEditExperienceContext&&a.status==='recorded')details.append(button(`Change context for answer ${r.queue.indexOf(q)+1}`,()=>onEditExperienceContext(a.id,a.currentRevision)));
        if(a.revisions.length>1){const revisions=el('details',null,'discovery-revisions');revisions.append(el('summary','Original answer and revisions'));for(const revision of a.revisions){revisions.append(el('p',`Revision ${revision.revision}`),el('blockquote',revision.text,'discovery-answer'));if(revision.experienceContext)revisions.append(el('p','Context: '+root.DraftedExperienceContext.describe(revision.experienceContext),'discovery-saved-context'));}details.append(revisions);}
        if(a.status==='processing')details.append(el('p','Answer saved. Checking it in the background.','discovery-note'));
        if(a.status==='error'){details.append(el('p','Your answer is saved. We could not check it.','discovery-note'));if(onRetry)details.append(button(`Retry answer ${r.queue.indexOf(q)+1}`,()=>onRetry(a.id)));}
        details.append(button(`Correct answer ${r.queue.indexOf(q)+1}`,()=>{drafts.set(q.id,a.revisions.at(-1).text);session.correct(q.id);}));
      }
      for(const q of r.phase==='complete'?r.queue.filter(q=>!answers.some(a=>a.questionId===q.id)):[]){
        details.append(el('p',q.question,'discovery-history-question'),el('p',q.status==='skipped'?'Skipped':'No answer saved','discovery-note'));
        details.append(button(`Answer question ${r.queue.indexOf(q)+1}`,()=>{drafts.set(q.id,'');session.correct(q.id);}));
      }
      container.append(details);
    }
    function requirements(q){const c=session.snapshot().context;return q.signalRefs.map(ref=>{const value=c.jobContext[ref.field][ref.index];return typeof value==='string'?value:value.signal;});}
    function requirementList(q,host){const list=el('ul');for(const text of requirements(q))list.append(el('li',text));host.append(list);}
    function followupPrompt(text,language){
      const answer=text.trim().replace(/[.!]+$/,'');
      const sv=language==='sv';
      if(/^(kanske|maybe)$/i.test(answer))return sv?'Vad är du osäker på?':'What are you unsure about?';
      if(/^(jag var med|i was involved|i helped(?: a little)?)$/i.test(answer))return sv?'Vad gjorde du själv, om något?':'What did you do yourself, if anything?';
      return sv?'Kan du beskriva ett konkret tillfälle, om du har något exempel?':'Can you describe one specific occasion, if you have an example?';
    }
    function outcome(){
      const state=getTailorState();
      container.append(el('h2',state==='ready'?'Ready to tailor your CV.':'Review your answers'));
      if(state==='preparing'){const status=el('p','Preparing your suggestions…');status.setAttribute('role','status');container.append(status);}
      const pending=session.results().pending;
      if(pending){const status=el('p',`${pending===1?'One answer is':pending+' answers are'} still being checked.`,'discovery-note');status.setAttribute('role','status');container.append(status);}
      if(session.moreCount())container.append(button(`Explore more questions (${session.moreCount()})`,()=>session.continueQuestions()));
      else container.append(el('p','No further relevant questions were identified for this CV and job ad.','discovery-note'));
      if(onFinishAndTailor&&state==='ready'){const finish=button('Finish and tailor my CV',()=>{const result=onFinishAndTailor();continueToEditor();return result;});finish.disabled=busy;finish.className='discovery-finish-primary';container.append(finish);}
    }
    const continueToEditor=()=>{disposed=true;stopObserving();onContinue(session.accountsForRound());};
    function render(){
      let r;try{r=session.round();if(disposed||r.id!==mountedRound||!container.isConnected)return;}catch{return;}
      const focused=container.contains(document.activeElement)&&document.activeElement.tagName==='TEXTAREA'?document.activeElement:null;
      const selection=focused&&renderedQuestion===session.current()?.id?{start:focused.selectionStart,end:focused.selectionEnd}:null;
      const historyOpen=r.phase==='complete'&&renderedPhase!=='complete'?false:container.querySelector('.discovery-history')?.open;
      const originalContextOpen=renderedQuestion===session.current()?.id&&container.querySelector('.discovery-original-context')?.open;
      container.replaceChildren();container.classList.add('experience-discovery');
      if(r.phase==='offer'){container.append(el('h2',r.total?`${r.total} relevant experience ${r.total===1?'topic is':'topics are'} not clear in your CV.`:'We can continue with what is available.'));if(r.total)container.append(button('Start the questions',()=>session.start()));container.append(button('Continue with what is available',()=>{session.finish();continueToEditor();}));}
      else if(r.phase==='complete')outcome();
      else{
        const batchStart=r.index<r.batchStart?0:r.batchStart||0;
        const q=session.current(),followup=r.phase==='followup',progress=el('p',followup?`Follow-up · Question ${r.index-batchStart+1} of ${r.total-batchStart}`:`${r.index-batchStart+1}/${r.total-batchStart}`,'discovery-progress');progress.setAttribute('aria-label',`Question ${r.index-batchStart+1} of ${r.total-batchStart}`);container.append(progress);
        let originalContext=null;
        if(followup){
          const answer=session.snapshot().answers.find(a=>a.id===q.answerId),text=answer.revisions.at(-1).text,context=el('div',null,'discovery-followup-context');
          context.append(el('p','Your previous answer','discovery-result-label'),el('blockquote',text,'discovery-answer discovery-previous-answer'));
          container.append(context,el('h2',followupPrompt(text,r.language)));
          originalContext=el('details',null,'discovery-original-context');originalContext.open=!!originalContextOpen;
          originalContext.append(el('summary','View original question and job context'),el('p',q.question,'discovery-history-question'),el('p','Job context','discovery-result-label'));requirementList(q,originalContext);
        }else{container.append(el('h2',q.question));if(r.notice)container.append(el('p',r.notice));}
        const actions=el('div');actions.className='discovery-question-actions';actions.setAttribute('role','group');actions.setAttribute('aria-label','Answer actions');
        if(busy||r.phase==='interpreting')container.append(el('p','I am reading your answer…'));
        else{
          const label=el('label',followup?'Your clarification':'A short answer or a longer story — both work.'),input=el('textarea');input.rows=4;input.value=drafts.get(q.id)||'';input.setAttribute('aria-label',label.textContent);input.addEventListener('input',()=>drafts.set(q.id,input.value));label.append(input);
          const saved=session.snapshot().answers.find(a=>a.id===q.answerId)?.revisions.at(-1)?.experienceContext;
          if(saved)container.append(el('p','Saved context: '+root.DraftedExperienceContext.describe(saved),'discovery-saved-context'));
          container.append(label,el('p','Up to 50,000 characters.','discovery-note'));
          actions.append(button(r.phase==='correct'?'Save correction':'Send answer',()=>{const result=onAnswer(drafts.get(q.id)||'');if(result&&session.round().phase==='interpreting')return result.then(value=>{drafts.delete(q.id);return value;});drafts.delete(q.id);return result;}));
          if(r.phase==='error'&&onRetry)actions.append(button('Try again',()=>onRetry()));
          actions.append(button('No',()=>{session.submit('No');drafts.delete(q.id);}),button('I don’t know',()=>{session.submit("I don't know");drafts.delete(q.id);}),button('Skip',()=>{session.skip();drafts.delete(q.id);}));
        }
        const pending=session.results().pending;if(pending)container.append(el('p',`${pending===1?'An earlier answer is':pending+' earlier answers are'} being checked. You can keep going.`,'discovery-note'));
        actions.append(button('Finish the questions',()=>session.finish()));container.append(actions);if(originalContext)container.append(originalContext);
      }
      history();if(historyOpen&&container.querySelector('.discovery-history'))container.querySelector('.discovery-history').open=true;
      if(error){const alert=el('p',error);alert.setAttribute('role','alert');container.append(alert);}
      onStateChange();
      renderedQuestion=session.current()?.id;
      renderedPhase=r.phase;
      if(selection){const input=container.querySelector('textarea');if(input){input.focus({preventScroll:true});input.setSelectionRange(selection.start,selection.end);}}
    }
    const stopObserving=session.observe(render);render();return {render};
  }
  root.DraftedExperienceDiscoveryUI={mount};
})(globalThis);
