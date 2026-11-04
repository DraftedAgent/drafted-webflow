/* Read-only coverage view in the editor toolbar. Raw answers are only linked, never assessed as CV text. */
(function(root){
 'use strict';
 function create({host,getInput,onSignal,onFind,onAd,getSources=()=>[],onOpen=()=>{},config,onStateChange=()=>{}}){
  const C=root.DraftedCoverageContract,card=host.closest('.chat-card'),el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;},button=(text,fn,cls)=>{const b=el('button',text,cls);b.type='button';b.onclick=fn;return b;},labels={clear:'Clearly represented',partial:'Partly represented',not_represented:'Not represented in this CV',needs_review:'Needs review'},short={clear:'Clear',partial:'Partial',not_represented:'Not in this CV',needs_review:'Review'};
  let opened=false,filter='all',openSignals=new Set(),timer=null,restoring=false;
  const toggle=button('CV coverage',()=>opened?close():open(),'workspace-coverage-toggle');toggle.setAttribute('aria-controls','drafted-cv-coverage');toggle.setAttribute('aria-expanded','false');const toolbar=card.querySelector('.workspace-editor-toolbar');toolbar.append(toggle);
  const panel=el('section',undefined,'workspace-coverage-panel');panel.id='drafted-cv-coverage';panel.setAttribute('aria-label','Coverage in the current edited CV');panel.tabIndex=-1;panel.hidden=true;host.append(panel);
  const model=new root.DraftedCoverage.Session({enabled:config?.enabled===true,client:config?.enabled?new root.DraftedCoverage.Client({endpoint:config.endpoint}):null,changed:()=>{render();if(!restoring)onStateChange();}});
  function findEvidence(evidence,details){if(!model.fresh())return;Promise.resolve().then(()=>onFind(evidence)).catch(()=>{if(!details.isConnected)return;details.querySelector('.coverage-navigation-error')?.remove();const message=el('p','This evidence could not be located in the current CV. Your CV is unchanged; update the assessment or review its cited source.','coverage-navigation-error');message.setAttribute('role','alert');details.append(message);});}
  function render(){
   for(const d of panel.querySelectorAll('details'))if(d.open)openSignals.add(d.dataset.signal);else openSignals.delete(d.dataset.signal);
   const fresh=model.fresh(),counts=model.result?C.counts(model.result):null,total=model.result?.rows.length||0;
   toggle.textContent=fresh&&total?`Job signals · ${counts.clear}/${total}`:'Job signals'+(model.result?' · out of date':'');toggle.dataset.fullLabel=fresh&&total?`${counts.clear} of ${total} signals clearly represented`:toggle.textContent;toggle.dataset.state=model.status;
   panel.replaceChildren(button('← Back to editor',close,'coverage-back'));
   const status=el('div',undefined,'coverage-status');status.setAttribute('role','status');
   if(model.status==='loading')status.textContent='Reviewing the current CV against the job signals…';
   else if(model.status==='unavailable')status.textContent='Coverage is not connected in this environment yet. Your CV and experience questions remain available.';
   else if(model.status==='error')status.append(el('p','The assessment could not be updated. Your CV and answers are kept.'),button('Try coverage again',()=>model.run(getInput())));
   else if(model.status==='stale')status.append(el('p','The CV or job description changed. This previous assessment is out of date.'),button('Update assessment',()=>model.run(getInput())));
   else if(model.status==='idle')status.textContent='Add a CV and a job description to review coverage.';
   if(status.childNodes.length)panel.append(status);
   if(!model.result)return;
   if(!total){panel.append(el('p','No assessable signals were identified in this job context. You can still view the full job description.'));return;}
   const heading=el('p',`${counts.clear} of ${total} signals clearly represented`,'coverage-total');panel.append(heading,el('p',fresh?'Current Edited CV · advisory assessment':'Previous assessment — not the current CV/job context','coverage-caption'));
   const grid=el('div',undefined,'coverage-counts');for(const key of C.statuses){const box=el('div',undefined,key);box.append(el('strong',String(counts[key])),el('span',labels[key]));grid.append(box);}panel.append(grid);
   const nav=el('nav');nav.setAttribute('aria-label','Filter CV coverage');for(const key of ['all',...C.statuses]){const b=button(key==='all'?`All ${total}`:`${short[key]} ${counts[key]}`,()=>{filter=key;render();});b.setAttribute('aria-pressed',String(filter===key));nav.append(b);}panel.append(nav);
   for(const row of model.result.rows.filter(row=>filter==='all'||row.status===filter)){
    const signal=model.resultCatalog?.signals.find(s=>s.id===row.signalId);if(!signal)continue;const details=el('details',undefined,'coverage-signal');details.dataset.signal=signal.id;details.open=openSignals.has(signal.id);const summary=el('summary'),name=el('span',signal.text);name.append(el('small',signal.requirement==='required'?'Explicit requirement':signal.requirement==='preferred'?'Preferred in the ad':'Requirement level not stated'));summary.append(name,el('span',(fresh?'':'Previous: ')+labels[row.status],'coverage-row-status '+row.status));details.append(summary);summary.addEventListener('click',()=>{if(!details.open&&fresh&&row.status==='clear'&&model.fresh())findEvidence(row.evidence,details);});
    details.append(el('h3','What the ad asks for'));if(signal.adEvidence.length)for(const span of signal.adEvidence){details.append(el('blockquote',span.quote));const link=button('View source in job description ↗',()=>onAd(span),'coverage-link');link.disabled=!fresh;details.append(link);}else details.append(el('p','An exact source in the original ad could not be verified. Review the job wording.'));
    details.append(el('h3','Evidence in the assessed CV'));if(row.evidence.length)for(const evidence of row.evidence){details.append(el('blockquote',evidence.quote,'coverage-cv-quote'));const link=button('Find in current CV ↗',()=>findEvidence([evidence],details),'coverage-link');link.disabled=!fresh;details.append(link);}else details.append(el('p','No supporting text found in this CV version.'));
    details.append(el('h3',row.status==='clear'?'Why it is represented':'What is not yet clear'),el('p',row.explanation));const sources=fresh?getSources(signal.ref):[];if(sources.length)details.append(el('p','Relevant answer shared — separate from the assessed CV.','coverage-source-note'));
    if((row.status!=='clear'&&row.question)||sources.length){const b=button(sources.length?'View or correct your experience':'I have relevant experience',async()=>{if(!model.fresh())return;const key=C.canonical(model.input);b.disabled=true;b.textContent='Opening your experience question…';try{await onSignal({...signal,question:row.question,assessmentId:model.result.assessmentId},()=>model.fresh()&&key===C.canonical(model.input));close();}catch{b.disabled=false;b.textContent='Try opening the experience question again';const error=el('p','The question could not be opened for this context. Your existing answers and draft are kept.');error.setAttribute('role','alert');details.append(error);}},'coverage-experience');b.disabled=!fresh;details.append(b);}panel.append(details);
   }
   panel.append(el('p','Coverage describes this CV, not your total experience or your chances of getting the job.','coverage-caption'));
  }
  function open(){onOpen();opened=true;card.classList.add('coverage-mode');panel.hidden=false;toggle.setAttribute('aria-expanded','true');render();panel.focus({preventScroll:true});host.scrollTop=0;onStateChange();}
  function close(){opened=false;card.classList.remove('coverage-mode');panel.hidden=true;toggle.setAttribute('aria-expanded','false');onStateChange();}
  toolbar.addEventListener('click',event=>{if(!toggle.contains(event.target))close();});panel.addEventListener('keydown',e=>{if(e.key==='Escape'){close();toggle.focus();}});
  function sync({automatic=true}={}){if(restoring)return;const input=getInput(),changed=model.invalidate(input);if(changed){clearTimeout(timer);if(automatic&&config?.enabled&&!model.restoreBlocked&&input?.jobContext&&input.blocks?.length)timer=setTimeout(()=>model.run(getInput()),350);else if(!config?.enabled&&input?.blocks?.length){model.status='unavailable';model.emit();}}}
  return {sync,close,open,refreshSources:()=>{if(opened)render();},snapshot:()=>({session:model.snapshot(),opened,filter,openSignals:[...openSignals]}),async restore(saved){clearTimeout(timer);restoring=true;try{filter=saved?.filter||'all';openSignals=new Set(saved?.openSignals||[]);await model.restore(saved?.session,getInput());if(saved?.opened)open();else close();}finally{restoring=false;}},model};
 }
 root.DraftedCoverageView={create};
})(globalThis);
