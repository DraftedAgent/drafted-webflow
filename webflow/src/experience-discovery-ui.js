(function(root){
  'use strict';
  function mount(container,session,{onContinue=()=>{},onAnswer=text=>session.submit(text),onRetry=null,onStateChange=()=>{},onFinishAndTailor=null,sourceTailoring=false}={}){
    const drafts=new Map(),mountedRound=session.round().id;
    let error='',busy=false,disposed=false,renderedQuestion=null;
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
      const r=session.round(),answers=session.snapshot().answers.filter(a=>a.roundId===r.id);if(!answers.length)return;
      const details=el('details');details.className='discovery-history';details.append(el('summary','View or correct your answers'));
      for(const a of answers){const q=r.queue.find(q=>q.id===a.questionId),latest=a.revisions.at(-1);details.append(el('p',q.question,'discovery-history-question'));
        if(latest.followupReply!==undefined){details.append(el('p',a.revisions.at(-2).text,'discovery-answer'),el('p','Your clarification','discovery-result-label'),el('p',latest.followupReply,'discovery-answer'));}else details.append(el('p',latest.text,'discovery-answer'));
        if(a.revisions.length>1){const revisions=el('details',null,'discovery-revisions');revisions.append(el('summary','Original answer and revisions'));for(const revision of a.revisions)revisions.append(el('p',`Revision ${revision.revision}`),el('blockquote',revision.text,'discovery-answer'));details.append(revisions);}
        if(a.status==='processing')details.append(el('p','Answer saved. Checking it in the background.','discovery-note'));
        if(a.status==='error'){details.append(el('p','Your answer is saved. We could not check it.','discovery-note'));if(onRetry)details.append(button(`Retry answer ${r.queue.indexOf(q)+1}`,()=>onRetry(a.id)));}
        details.append(button(`Correct answer ${r.queue.indexOf(q)+1}`,()=>{drafts.set(q.id,a.revisions.at(-1).text);session.correct(q.id);}));
      }container.append(details);
    }
    function requirements(q){const c=session.snapshot().context;return q.signalRefs.map(ref=>{const value=c.jobContext[ref.field][ref.index];return typeof value==='string'?value:value.signal;});}
    function requirementList(q,host){const list=el('ul');for(const text of requirements(q))list.append(el('li',text));host.append(list);}
    function sourceExcerpt(host,text){host.append(el('blockquote',text.length>360?text.slice(0,360)+'…':text,'discovery-answer'));if(text.length>360)host.append(el('p','Excerpt shown. Your full answer is under “View or correct your answers”.','discovery-note'));}
    function outcome(){
      const result=session.results(),snap=session.snapshot(),r=session.round();
      container.append(el('h2',result.pending?'Your answers are saved.':'What your answers added'));
      if(result.pending){const status=el('p',`Checking ${result.pending===1?'your last answer':result.pending+' answers'} in the background. You can review your answers or go back to the editor.`);status.setAttribute('role','status');container.append(status);}
      container.append(el('p',sourceTailoring?'Answers are source material. Each tailoring suggestion shows which answers it uses. Only Apply changes your CV.':'These answers have not been added to your CV or used in CV suggestions. Earlier tailoring does not include them.','discovery-cv-status'));
      for(const q of r.queue){
        const card=el('section',null,'discovery-result'),own=snap.answers.find(a=>a.id===q.answerId&&a.roundId===r.id);
        const sources=own?.status==='recorded'?[own]:q.status==='covered'?snap.answers.filter(a=>a.roundId===r.id&&a.status==='recorded'&&a.drafts.some(d=>d.coveredQuestionIds.includes(q.id))):[];
        card.append(el('h3',`Question ${r.queue.indexOf(q)+1} · ${sources.length?'Answer saved':q.status==='no'?'You answered no':['needs_detail','unknown'].includes(q.status)?'Needs clarification':q.status==='error'?'Could not check answer':q.status==='processing'?'Checking answer':'No example provided'}`));
        requirementList(q,card);
        if(sources.length){
          card.append(el('p','What you described','discovery-result-label'));
          for(const a of sources){const drafts=q.status==='covered'?a.drafts.filter(d=>d.coveredQuestionIds.includes(q.id)):a.drafts;for(const quote of new Set(drafts.length?drafts.map(d=>d.sourceQuote):[a.revisions.at(-1).text]))sourceExcerpt(card,quote);}
          card.append(el('p','Potential support for the requirement above; not a finding that every part is met.','discovery-note'),el('p','Still unverified: whether your example covers all activities, audiences and settings in this requirement. An example in one setting does not establish experience in another.'));
          card.append(el('p',sourceTailoring?'Available as source material for a suggestion. AI interpretations are advisory; the original answer remains the source.':'How it is used: saved here for your review only. It is not used by CV suggestions.','discovery-note'));
        }else{
          if(q.status==='no'&&own){card.append(el('p','Your answer','discovery-result-label'));sourceExcerpt(card,own.revisions.at(-1).text);}
          const message={no:'You answered “No” within the scope of your answer. This does not rule out experience in other settings.',unknown:'You said you do not know. Whether you have this experience is still unclear.',needs_detail:'We could not identify a concrete example from your answer. This does not mean you lack the experience. You can clarify it below.',skipped:'You skipped this topic. No example was provided; this does not mean you lack the experience.',error:'Your answer is saved, but could not be checked. You can retry it below.',processing:'Your answer is saved and is still being checked.',unanswered:'You have not answered this topic. No conclusion about your experience has been drawn.'};
          card.append(el('p',message[q.status]||'No example is ready for review. No conclusion about your experience has been drawn.'),el('p',sourceTailoring?'This answer is not eligible for new experience claims. Earlier approved wording stays until you review and apply a change.':'How it is used: no experience from this topic is used in your CV or CV suggestions.','discovery-note'));
        }
        if(!own||q.status==='skipped')card.append(button(`Answer question ${r.queue.indexOf(q)+1}`,()=>{drafts.set(q.id,own?.revisions.at(-1).text||'');session.correct(q.id);}));
        container.append(card);
      }
      if(onFinishAndTailor){container.append(el('p',sourceTailoring?'Tailoring can use your relevant answers. You review the suggestion before Apply.':'Tailoring currently uses only your CV and the job ad. Your answers stay here for review.','discovery-note'),button('Finish and tailor my CV',()=>{const result=onFinishAndTailor();continueToEditor();return result;}));}
      container.append(button('Back to the editor',continueToEditor));
    }
    const continueToEditor=()=>{disposed=true;stopObserving();onContinue(session.accountsForRound());};
    function render(){
      let r;try{r=session.round();if(disposed||r.id!==mountedRound||!container.isConnected)return;}catch{return;}
      const focused=container.contains(document.activeElement)&&document.activeElement.tagName==='TEXTAREA'?document.activeElement:null;
      const selection=focused&&renderedQuestion===session.current()?.id?{start:focused.selectionStart,end:focused.selectionEnd}:null;
      const historyOpen=container.querySelector('.discovery-history')?.open;
      container.replaceChildren();container.classList.add('experience-discovery');container.append(el('p','Your answers stay while this page is open. The questions do not change your CV.','discovery-note'));
      if(r.phase==='offer'){container.append(el('h2',r.total?`${r.total} relevant experience ${r.total===1?'topic is':'topics are'} not clear in your CV.`:'We can continue with what is available.'));if(r.total)container.append(button('Start the questions',()=>session.start()));container.append(button('Continue with what is available',()=>{session.finish();continueToEditor();}));}
      else if(r.phase==='complete')outcome();
      else{
        const q=session.current(),followup=r.phase==='followup',progress=el('p',followup?`Follow-up · Question ${r.index+1} of ${r.total}`:`${r.index+1}/${r.total}`,'discovery-progress');progress.setAttribute('aria-label',`Question ${r.index+1} of ${r.total}`);container.append(progress);
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
      if(selection){const input=container.querySelector('textarea');if(input){input.focus({preventScroll:true});input.setSelectionRange(selection.start,selection.end);}}
    }
    const stopObserving=session.observe(render);render();return {render};
  }
  root.DraftedExperienceDiscoveryUI={mount};
})(globalThis);
