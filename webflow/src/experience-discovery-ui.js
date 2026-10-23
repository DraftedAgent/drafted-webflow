(function(root){
  'use strict';
  function mount(container,session,{onContinue=()=>{},onAnswer=text=>session.submit(text),onRetry=null,onStateChange=()=>{},onFinishAndTailor=null,sourceTailoring=false}={}){
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
        if(a.revisions.length>1){const revisions=el('details',null,'discovery-revisions');revisions.append(el('summary','Original answer and revisions'));for(const revision of a.revisions)revisions.append(el('p',`Revision ${revision.revision}`),el('blockquote',revision.text,'discovery-answer'));details.append(revisions);}
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
    function sourceExcerpt(host,text){host.append(el('blockquote',text.length>360?text.slice(0,360)+'…':text,'discovery-answer'));if(text.length>360)host.append(el('p','Excerpt shown. Your full answer is under “View or correct your answers”.','discovery-note'));}
    function outcome(){
      container.append(el('h2','Ready to tailor your CV.'));
      const pending=session.results().pending;
      if(pending){const status=el('p',`${pending===1?'One answer is':pending+' answers are'} still being checked.`,'discovery-note');status.setAttribute('role','status');container.append(status);}
      if(session.moreCount())container.append(button(`Explore more questions (${session.moreCount()})`,()=>session.continueQuestions()));
      else container.append(el('p','No further relevant questions were identified for this CV and job ad.','discovery-note'));
      if(onFinishAndTailor){const finish=button('Finish and tailor my CV',()=>{const result=onFinishAndTailor();continueToEditor();return result;});finish.className='discovery-finish-primary';container.append(finish);}
    }
    const continueToEditor=()=>{disposed=true;stopObserving();onContinue(session.accountsForRound());};
    function render(){
      let r;try{r=session.round();if(disposed||r.id!==mountedRound||!container.isConnected)return;}catch{return;}
      const focused=container.contains(document.activeElement)&&document.activeElement.tagName==='TEXTAREA'?document.activeElement:null;
      const selection=focused&&renderedQuestion===session.current()?.id?{start:focused.selectionStart,end:focused.selectionEnd}:null;
      const historyOpen=r.phase==='complete'&&renderedPhase!=='complete'?false:container.querySelector('.discovery-history')?.open;
      container.replaceChildren();container.classList.add('experience-discovery');if(r.phase!=='complete')container.append(el('p','Your answers stay while this page is open. The questions do not change your CV.','discovery-note'));
      if(r.phase==='offer'){container.append(el('h2',r.total?`${r.total} relevant experience ${r.total===1?'topic is':'topics are'} not clear in your CV.`:'We can continue with what is available.'));if(r.total)container.append(button('Start the questions',()=>session.start()));container.append(button('Continue with what is available',()=>{session.finish();continueToEditor();}));}
      else if(r.phase==='complete')outcome();
      else{
        const batchStart=r.index<r.batchStart?0:r.batchStart||0;
        const q=session.current(),followup=r.phase==='followup',progress=el('p',followup?`Follow-up · Question ${r.index-batchStart+1} of ${r.total-batchStart}`:`${r.index-batchStart+1}/${r.total-batchStart}`,'discovery-progress');progress.setAttribute('aria-label',`Question ${r.index-batchStart+1} of ${r.total-batchStart}`);container.append(progress);
        if(followup){
          const answer=session.snapshot().answers.find(a=>a.id===q.answerId),context=el('div',null,'discovery-followup-context');
          context.append(el('p','Topic from the job ad','discovery-result-label'));requirementList(q,context);
          context.append(el('p','Original question','discovery-result-label'),el('p',q.question),el('p','Your answer','discovery-result-label'));sourceExcerpt(context,answer.revisions.at(-1).text);
          const brief=/^\s*(yes|ja|ja,? lite|yes,? a little)[.!]?\s*$/i.test(answer.revisions.at(-1).text);
          context.append(el('p',brief?'This answer does not yet describe an example. One specific situation will help show how your experience relates to the original question.':'I could not tell what experience this answer describes. You can clarify what you mean, give an example if you have one, or skip.'));
          container.append(context,el('h2',brief?'What is one situation you have in mind when answering the question above?':'What do you mean in relation to the original question?'));
        }else{container.append(el('h2',q.question));if(r.notice)container.append(el('p',r.notice));}
        if(busy||r.phase==='interpreting')container.append(el('p','I am reading your answer…'));
        else{
          const label=el('label','A short answer or a longer story — both work.'),input=el('textarea');input.rows=4;input.value=drafts.get(q.id)||'';input.setAttribute('aria-label',label.textContent);input.addEventListener('input',()=>drafts.set(q.id,input.value));label.append(input);
          container.append(label,el('p','Up to 50,000 characters. Nothing is automatically cut.','discovery-note'),button(r.phase==='correct'?'Save correction':'Send answer',()=>{const result=onAnswer(drafts.get(q.id)||'');if(result&&session.round().phase==='interpreting')return result.then(value=>{drafts.delete(q.id);return value;});drafts.delete(q.id);return result;}));
          if(r.phase==='error'&&onRetry)container.append(button('Try again',()=>onRetry()));
          container.append(button('No',()=>{session.submit('No');drafts.delete(q.id);}),button('I don’t know',()=>{session.submit("I don't know");drafts.delete(q.id);}),button('Skip',()=>{session.skip();drafts.delete(q.id);}));
        }
        const pending=session.results().pending;if(pending)container.append(el('p',`${pending===1?'An earlier answer is':pending+' earlier answers are'} being checked. You can keep going.`,'discovery-note'));
        container.append(button('Finish the questions',()=>session.finish()));
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
