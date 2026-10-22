(function(root){
  'use strict';
  function mount(container,session,{onContinue=()=>{},onAnswer=text=>session.submit(text),onRetry=null}={}){
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
      const details=el('details');details.className='discovery-history';details.append(el('summary','Your answers – view or correct'));
      for(const a of answers){const q=r.queue.find(q=>q.id===a.questionId);details.append(el('p',q.question,'discovery-history-question'),el('p',a.revisions.at(-1).text,'discovery-answer'));
        if(a.status==='processing')details.append(el('p','Answer saved. Checking it in the background.','discovery-note'));
        if(a.status==='error'){details.append(el('p','Your answer is saved. We could not check it.','discovery-note'));if(onRetry)details.append(button(`Retry answer ${r.queue.indexOf(q)+1}`,()=>onRetry(a.id)));}
        details.append(button(`Correct answer ${r.queue.indexOf(q)+1}`,()=>{drafts.set(q.id,a.revisions.at(-1).text);session.correct(q.id);}));
      }container.append(details);
    }
    function outcome(){
      const s=session.summary(),result=session.results();
      container.append(el('h2',result.pending?'Your answers are saved.':'What your answers added'));
      if(result.pending){const status=el('p',`Checking ${result.pending===1?'your last answer':result.pending+' answers'} in the background. You can review your answers or go back to the editor.`);status.setAttribute('role','status');container.append(status);}
      const examples=result.examples;
      if(examples.length){container.append(el('p',`You shared ${examples.length===1?'an example':examples.length+' examples'} to consider for this role.`));
        for(const example of examples){const q=session.round().queue.find(q=>q.id===example.questionId);container.append(el('h3',q.question));for(const text of new Set(example.texts))container.append(el('p',text,'discovery-answer'));}
      }else if(!result.pending&&!result.failed&&!result.needsDetail)container.append(el('p',s.remaining?'No new examples are ready yet.':'No new examples were found to suggest adding to this CV. You can still continue with your existing CV.'));
      if(result.failed)container.append(el('p',`${result.failed===1?'One answer could':'Some answers could'} not be checked. Your text is saved; you can retry below.`));
      if(result.needsDetail)container.append(el('p','An answer still needs a concrete example. You can add it by correcting your answer below.'));
      container.append(el('p','Your CV has not changed. These answers are not yet included in CV suggestions.','discovery-note'),el('p',`${s.answered} answered, ${s.covered} covered by other answers, ${s.skipped+s.no+s.unknown} skipped or without examples. ${s.remaining} remaining out of ${s.total}.`),button('Back to the editor',continueToEditor));
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
        const q=session.current(),progress=el('p',`${r.index+1}/${r.total}`,'discovery-progress');progress.setAttribute('aria-label',`Question ${r.index+1} of ${r.total}`);container.append(progress,el('h2',r.phase==='followup'?r.notice:q.question));if(r.notice&&r.phase!=='followup')container.append(el('p',r.notice));
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
      renderedQuestion=session.current()?.id;
      if(selection){const input=container.querySelector('textarea');if(input){input.focus({preventScroll:true});input.setSelectionRange(selection.start,selection.end);}}
    }
    const stopObserving=session.observe(render);render();return {render};
  }
  root.DraftedExperienceDiscoveryUI={mount};
})(globalThis);
