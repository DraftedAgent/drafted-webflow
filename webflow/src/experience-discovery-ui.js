(function(root){
  'use strict';
  function mount(container,session,{onContinue=()=>{},onAnswer=text=>session.submit(text),onRetry=null}={}){
    let draft='',error='',busy=false,disposed=false;const mountedRound=session.round().id;
    const el=(tag,value,cls)=>{const n=document.createElement(tag);if(value)n.textContent=value;if(cls)n.className=cls;return n;};
    const button=(label,fn)=>{const b=el('button',label);b.type='button';b.disabled=busy;b.addEventListener('click',async()=>{try{error='';const result=fn();if(result&&typeof result.then==='function'){busy=true;render();await result;busy=false;}render();}catch(e){busy=false;error=e.message==='ANSWER_TOO_LONG'?'Your answer is too long. Your text is kept. Please split it.':'Your answer could not be read. Your text is kept. Retry or skip.';render();}});return b;};
    function history(){const r=session.round(),answers=session.snapshot().answers.filter(a=>a.roundId===r.id);if(!answers.length)return;const details=el('details');details.append(el('summary','Your answers – view or correct'));for(const a of answers){const q=r.queue.find(q=>q.id===a.questionId);details.append(el('p',q.question,'discovery-history-question'),el('p',a.revisions.at(-1).text,'discovery-answer'),button(`Correct answer ${r.queue.indexOf(q)+1}`,()=>{draft=a.revisions.at(-1).text;session.correct(q.id);}));}container.append(details);}
    const continueToEditor=()=>{disposed=true;onContinue(session.accountsForRound());};
    function render(){let r;try{r=session.round();if(disposed||r.id!==mountedRound||!container.isConnected)return;}catch{return;}container.replaceChildren();container.classList.add('experience-discovery');container.append(el('p','Your answers stay while this page is open. The questions do not change your CV.','discovery-note'));
      if(r.phase==='offer'){container.append(el('h2',r.total?`${r.total} relevant experience ${r.total===1?'topic is':'topics are'} not clear in your CV.`:'We can continue with what is available.'));if(r.total)container.append(button('Start the questions',()=>session.start()));container.append(button('Continue with what is available',()=>{session.finish();continueToEditor();}));}
      else if(r.phase==='complete'){const s=session.summary();container.append(el('h2','Thank you, we have gone through the questions.'),el('p',`${s.answered} answered, ${s.covered} covered by other answers, ${s.skipped+s.no+s.unknown} skipped or without examples. ${s.remaining} remaining out of ${s.total}.`),button('Back to the editor',continueToEditor));}
      else{const progress=el('p',`${r.index+1}/${r.total}`,'discovery-progress');progress.setAttribute('aria-label',`Question ${r.index+1} of ${r.total}`);container.append(progress,el('h2',r.phase==='followup'?r.notice:session.current().question));if(r.notice&&r.phase!=='followup')container.append(el('p',r.notice));
        if(busy||r.phase==='interpreting')container.append(el('p','I am reading your answer…'));
        else{const label=el('label','A short answer or a longer story — both work.'),input=el('textarea');input.rows=4;input.value=draft;input.setAttribute('aria-label',label.textContent);input.addEventListener('input',()=>{draft=input.value;});label.append(input);container.append(label,el('p','Up to 50,000 characters. Nothing is automatically cut.','discovery-note'),button(r.phase==='correct'?'Save correction':'Send answer',async()=>{await onAnswer(draft);draft='';}));if(r.phase==='error'&&onRetry)container.append(button('Try again',async()=>{await onRetry();draft='';}));container.append(button('No',()=>{session.submit('No');draft='';}),button('I don’t know',()=>{session.submit("I don't know");draft='';}),button('Skip',()=>{session.skip();draft='';}));}
        container.append(button('Finish the questions',()=>session.finish()));
      }
      history();if(error){const alert=el('p',error);alert.setAttribute('role','alert');container.append(alert);}
    }
    render();return {render};
  }
  root.DraftedExperienceDiscoveryUI={mount};
})(globalThis);
