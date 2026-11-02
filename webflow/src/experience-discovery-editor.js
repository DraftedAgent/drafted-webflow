/* Experience questions are an optional mode inside the existing editor. */
(function(root){
  'use strict';
  let motionSequence=0;
  function preparationMotion(){
    const wrapper=document.createElement('div');wrapper.innerHTML="<svg class=\"discovery-preparing-art\" viewBox=\"0 0 500 248\" aria-hidden=\"true\">\n<defs><linearGradient id=\"trail\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop stop-color=\"#02c8bb\" stop-opacity=\"0\"/><stop offset=\"1\" stop-color=\"#02c8bb\" stop-opacity=\".085\"/></linearGradient><clipPath id=\"paperclip\"><rect x=\"32\" y=\"18\" width=\"210\" height=\"212\" rx=\"4\"/></clipPath></defs>\n<rect class=\"paper\" x=\"32\" y=\"18\" width=\"210\" height=\"212\" rx=\"4\"/>\n<g class=\"type\"><path d=\"M51 38h70 M51 46h112\"/><path class=\"minor\" d=\"M51 57h170\"/>\n<path d=\"M51 78h137 M51 85h153 M51 92h124\"/>\n<path d=\"M51 119h79 M51 129h150 M51 136h136 M51 143h155\"/>\n<path d=\"M51 169h91 M51 179h153 M51 186h120 M51 193h141\"/>\n<path class=\"minor\" d=\"M51 212h170\"/></g>\n<g clip-path=\"url(#paperclip)\"><g id=\"scan\"><rect x=\"39\" y=\"-47\" width=\"196\" height=\"46\" fill=\"url(#trail)\"/><path d=\"M39 0H235\" stroke=\"#00a8a5\" stroke-width=\"1\"/><path d=\"M39 -3v6 M235 -3v6\" stroke=\"#008b91\" stroke-width=\"1\"/></g></g>\n<g id=\"regions\"></g><g id=\"connections\"></g><g id=\"questions\"></g>\n</svg>";
    const svg=wrapper.firstElementChild,prefix='discovery-motion-'+(++motionSequence)+'-';
    // Unique paint-server identifiers allow independent editor instances.
    for(const id of ['trail','paperclip']){svg.querySelector('#'+id).id=prefix+id;for(const n of svg.querySelectorAll('[fill],[clip-path]'))for(const attr of ['fill','clip-path'])if(n.getAttribute(attr)==='url(#'+id+')')n.setAttribute(attr,'url(#'+prefix+id+')');}

const ns='http://www.w3.org/2000/svg',make=(tag,attrs)=>{const e=document.createElementNS(ns,tag);for(const [k,v]of Object.entries(attrs))e.setAttribute(k,v);return e;};
const areas=[{x:46,y:70,w:164,h:28,t:710},{x:46,y:112,w:170,h:37,t:1260},{x:46,y:162,w:164,h:37,t:1880}];
const regions=areas.map(a=>{const g=make('g',{});g.append(make('rect',{x:a.x,y:a.y,width:a.w,height:a.h,fill:'#00b7ae','fill-opacity':'.025',stroke:'none'}),make('path',{class:'corner',d:`M${a.x} ${a.y+6}v-6h6 M${a.x+a.w-6} ${a.y}h6v6 M${a.x} ${a.y+a.h-6}v6h6 M${a.x+a.w-6} ${a.y+a.h}h6v-6`}));svg.querySelector('#regions').append(g);return g;});
const routes=['M210 84H258Q266 84 266 76V64Q266 56 274 56H318','M216 130H278Q286 130 286 122V64Q286 56 294 56H318','M216 130H318','M210 180H258Q266 180 266 172V138Q266 130 274 130H318','M210 180H282Q290 180 290 188V196Q290 204 298 204H318'];
const links=routes.map(d=>{const p=make('path',{class:'link',d,pathLength:100,'stroke-dasharray':100,'stroke-dashoffset':100});svg.querySelector('#connections').append(p);return p;});
const questions=[36,110,184].map((y,i)=>{const g=make('g',{});g.append(make('rect',{class:'frame',x:318,y,width:145,height:42,rx:4}),make('path',{class:'type',d:`M337 ${y+15}h102 M337 ${y+23}h${i===1?75:88} M337 ${y+31}h${i===2?91:63}`}),make('path',{class:'corner',d:`M318 ${y+7}v-7h7 M456 ${y+42}h7v-7`}),make('rect',{class:'node',x:324,y:y+13,width:2,height:4}));svg.querySelector('#questions').append(g);return g;});
const clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{x=clamp(x);return x*x*(3-2*x);};
let elapsed=0,last=null,frame=0,disposed=false;const preference=matchMedia('(prefers-reduced-motion: reduce)');
function render(){const reduced=preference.matches,t=reduced?4400:elapsed%6400,fade=1-smooth((t-5250)/800);const sweep=svg.querySelector('#scan');sweep.setAttribute('transform',`translate(0 ${27+190*smooth((t-180)/2420)})`);sweep.setAttribute('opacity',reduced?0:smooth(t/180)*(1-smooth((t-2600)/350)));
regions.forEach((g,i)=>g.setAttribute('opacity',smooth((t-areas[i].t)/200)*fade*(.7+.3*(1-smooth((t-3300)/600)))));
links.forEach((p,i)=>{const progress=smooth((t-1800-i*165)/720);p.setAttribute('stroke-dashoffset',100*(1-progress));p.setAttribute('opacity',fade*.72);});
questions.forEach((g,i)=>{const progress=smooth((t-2760-i*250)/650);g.setAttribute('opacity',progress*fade);g.setAttribute('transform',`translate(${(1-progress)*9} ${(1-progress)*(i===1?-7:7)})`);g.querySelector('.corner').setAttribute('opacity',smooth((t-3500-i*250)/160));g.querySelector('.node').setAttribute('opacity',smooth((t-3650-i*250)/140));});}

    function tick(now){frame=0;if(disposed||!svg.isConnected)return;if(preference.matches||document.hidden){last=null;render();return;}if(last!==null)elapsed+=now-last;last=now;render();frame=requestAnimationFrame(tick);}
    function schedule(){cancelAnimationFrame(frame);last=null;render();if(!disposed&&!preference.matches&&!document.hidden)frame=requestAnimationFrame(tick);}
    preference.addEventListener('change',schedule);document.addEventListener('visibilitychange',schedule);render();frame=requestAnimationFrame(tick);
    return {svg,dispose(){disposed=true;cancelAnimationFrame(frame);preference.removeEventListener('change',schedule);document.removeEventListener('visibilitychange',schedule);}};
  }
  function create({host,getContext,endpoint,onTailor=()=>{},sourceTailoring=false,getTailorBusy=()=>false,getTailorState=()=>getTailorBusy()?'preparing':'ready',onSourceStateChange=()=>{},getSourceNotice=()=>'',onEditExperienceContext=null}){
    let planTask=null;
    const interpretations=new Set();
    function track(promise){if(!promise?.then)return promise;interpretations.add(promise);promise.then(()=>interpretations.delete(promise),()=>interpretations.delete(promise));return promise;}
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
    const tailor=card.querySelector('#tailor-card');if(tailor){(card.closest('.section-editor').querySelector('.workspace-main-actions')||toolbar).prepend(tailor);const action=tailor.querySelector('#tailor-btn');if(action)action.textContent='Tailor to job';}
    const guidance=el('section');guidance.className='discovery-guidance';guidance.id='drafted-discovery-guidance';guidance.setAttribute('aria-label','Experience questions status');guidance.setAttribute('role','status');guidance.setAttribute('aria-live','polite');guidance.setAttribute('aria-atomic','true');guidance.hidden=true;host.prepend(guidance);
    let fingerprint='',generation=0,opened=false,prepared=false,pending=false,savedScroll=0,planState='idle',planController=null;
    let questionView=null,restoredDrafts=[],archived=[],preparingMotion=null;
    const earlier=el('details');earlier.className='workspace-earlier-answers';earlier.hidden=true;host.prepend(earlier);
    function earlierAnswers(){earlier.replaceChildren(el('summary','Earlier experience answers'));earlier.hidden=!archived.length;for(const previous of archived)for(const answer of previous.answers){const question=previous.round.queue.concat(previous.round.reserve||[]).find(q=>q.id===answer.questionId);earlier.append(el('p',question?.question||'Earlier answer'),el('blockquote',answer.revisions.at(-1)?.text||''));}}
    const count=el('span');count.className='discovery-count';count.id='drafted-experience-count';count.setAttribute('role','status');launcher.setAttribute('aria-describedby',count.id);count.hidden=true;launcher.append(count);launcher.setAttribute('aria-label','Experience questions');
    function remainingQuestions(){const r=session.round();return r.queue.filter(q=>['unanswered','answered'].includes(q.status)||q.id===session.current()?.id&&['followup','correct','error'].includes(r.phase)).length;}
    function hasConversation(){return !!host.querySelector(':scope > .chat-message.user, :scope > .chat-message.ai, :scope > .drafted-proposal-card, :scope > .tailor-suggestion, :scope > .tailor-feedback, :scope > .tailor-progress');}
    function updateGuidance(){
      if(planState==='loading'&&getTailorState()==='ready'&&preparingMotion){host.classList.toggle('is-discovery-start',!opened&&!hasConversation());return;}
      preparingMotion?.dispose();preparingMotion=null;
      host.classList.remove('is-discovery-start');
      guidance.replaceChildren();guidance.hidden=true;
      if(getTailorState()!=='ready')return;
      if(planState==='loading'||planState==='error'){
        guidance.hidden=false;host.classList.toggle('is-discovery-start',!opened&&!hasConversation());
        if(planState==='loading'){
          preparingMotion=preparationMotion();
          guidance.append(preparingMotion.svg,el('h2','Preparing your experience questions…'),el('p','This may take a moment.'));
        }else{
          const retry=button('Try again',start);retry.className='discovery-start-primary';
          guidance.append(el('h2','Your questions could not be prepared'),el('p','Your CV and saved answers are unchanged. You can try again or keep editing.'),retry);
        }
        return;
      }
      if(planState!=='ready')return;
      const r=session.round();if(!r.total&&!r.queue.length){guidance.hidden=false;host.classList.toggle('is-discovery-start',!opened&&!hasConversation());guidance.append(el('h2','No additional experience questions'),el('p','No further questions were identified for this CV and job ad. You can keep working in the editor.'));return;}
      const remaining=remainingQuestions();
      if(remaining&&hasConversation())return;
      guidance.hidden=false;
      if(remaining){
        host.classList.toggle('is-discovery-start',!opened);
        const review=button('Review questions',open);review.className='discovery-start-primary';
        guidance.append(el('h2','Your CV may not tell the whole story.'),el('p',`Answer ${remaining} ${remaining===1?'question':'questions'} to uncover experience relevant to this role.`),review);
      }else{
        guidance.append(root.DraftedExperienceDiscoveryUI.tailorMoment({hasAnswers:session.accountsForRound().length>0,pending:session.results().pending,moreCount:r.phase==='complete'?session.moreCount():0,onMore:()=>{if(session.continueQuestions()){prepared=false;open();updatePlanIndicator();}},onTailor:()=>onTailor()}));
      }
      let sourceNotice='';if(sourceTailoring){try{sourceNotice=getSourceNotice();}catch{sourceNotice='Answer details could not be checked. Your CV has not changed.';}}if(sourceNotice){const status=el('p',sourceNotice);status.className='tailor-review-warning';status.setAttribute('role','status');guidance.append(status);}
    }
    function setLabel(label){launcher.replaceChildren(document.createTextNode(label),count);launcher.setAttribute('aria-label',label);}
    function updatePlanIndicator(){
      launcher.dataset.planState=planState;launcher.setAttribute('aria-busy',String(pending));launcher.disabled=planState==='loading';launcher.setAttribute('aria-description',planState==='loading'?'Preparing your experience questions. This may take a moment.':'');updateGuidance();
      const remaining=planState==='ready'?remainingQuestions():0;
      count.hidden=remaining===0;count.textContent=remaining?String(remaining):'';
      count.setAttribute('aria-label',remaining+' experience '+(remaining===1?'question':'questions')+' remaining');
      launcher.title=planState==='ready'?(remaining?remaining+' '+(remaining===1?'question':'questions')+' remaining':'Review your answers'):planState==='loading'?'Preparing questions in the background':planState==='error'?'Questions could not be prepared. Open to retry.':'Explore your experience';
    }
    function close(focus=false){if(planState==='ready'&&session.round().focus){session.leaveFocus();prepared=false;questionView?.render();}if(planState==='ready'&&session.round().phase==='complete'){prepared=false;setLabel('Review your answers');}opened=false;panel.hidden=true;card.classList.remove('discovery-mode');launcher.setAttribute('aria-expanded','false');launcher.setAttribute('aria-pressed','false');chatMode.setAttribute('aria-pressed','true');updateGuidance();host.scrollTop=savedScroll;if(focus)card.querySelector('#editor-input')?.focus({preventScroll:true});}
    function focusQuestion(){if(opened){const target=body.querySelector('textarea,h2,[role=alert]');if(target){if(target.tagName!=='TEXTAREA')target.tabIndex=-1;target.focus({preventScroll:true});}}}
    function showRound(){if(questionView){questionView.render();prepared=true;focusQuestion();return;}questionView=root.DraftedExperienceDiscoveryUI.mount(body,session,{initialDrafts:restoredDrafts,onAnswer:t=>{const result=track(client.submit(session,t));if(result)return result.finally(updateGuidance);updateGuidance();return result;},onRetry:id=>track(client.retry(session,id)).finally(updateGuidance),onStateChange:()=>{back.hidden=session.round().phase==='complete';updateGuidance();updatePlanIndicator();onSourceStateChange();},sourceTailoring,getTailorState,onEditExperienceContext,onFinishAndTailor:()=>{session.finish();prepared=false;setLabel('Review your answers');close(true);return onTailor();},onContinue:()=>{prepared=false;setLabel('Review your answers');close(true);}});prepared=true;focusQuestion();}
    function activate(){if(!session.round().total&&!session.round().focus&&!session.round().queue.length){body.replaceChildren(el('h2','No additional experience questions'),el('p','No further questions were identified for this CV and job ad. You can keep working in the editor.'));prepared=true;return;}if(session.round().phase==='offer')session.start();showRound();}
    function start(){if(pending)return planTask;planTask=loadPlan();return planTask;}
    async function loadPlan(){const epoch=generation,controller=new AbortController();planController=controller;pending=true;planState='loading';updatePlanIndicator();body.replaceChildren(el('p','Preparing your questions…'));body.setAttribute('aria-busy','true');try{const result=await client.plan(session,'en',{signal:controller.signal});if(result.stale||epoch!==generation)return;planState='ready';updateGuidance();if(opened)activate();else body.replaceChildren();}catch{if(epoch!==generation)return;planState='error';body.replaceChildren(el('h2','Your questions could not be loaded'),el('p','You can try again or return to the editor.'),button('Try loading the questions again',start));focusQuestion();}finally{if(epoch===generation){if(planController===controller)planController=null;pending=false;body.removeAttribute('aria-busy');updatePlanIndicator();}}}
    function open(){if(!fingerprint||opened||planState==='loading')return;savedScroll=host.scrollTop;opened=true;panel.hidden=false;card.classList.add('discovery-mode');launcher.setAttribute('aria-expanded','true');launcher.setAttribute('aria-pressed','true');chatMode.setAttribute('aria-pressed','false');host.scrollTop=0;back.focus({preventScroll:true});
      updateGuidance();if(planState==='ready'&&!prepared)activate();else focusQuestion();
    }
    // Escape pauses questions, retaining the mounted answer form and any draft.
    panel.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();close(true);}});
    function invalidate(){const previous=session.snapshot();if(previous.round&&previous.answers.some(a=>a.roundId===previous.round.id)){if(!archived.some(r=>r.round.id===previous.round.id))archived.push({context:previous.context,round:previous.round,answers:previous.answers.filter(a=>a.roundId===previous.round.id)});earlierAnswers();}questionView?.dispose?.();questionView=null;restoredDrafts=[];generation++;planController?.abort();planController=null;fingerprint='';prepared=false;pending=false;planState='idle';close();guidance.hidden=true;launcher.hidden=true;setLabel('Experience questions');count.hidden=true;launcher.removeAttribute('aria-busy');launcher.dataset.planState='idle';launcher.disabled=false;body.replaceChildren();body.removeAttribute('aria-busy');const c=session.snapshot().context;if(c)session.setContext({...c,revision:crypto.randomUUID()});}
    function sync(){const context=getContext();if(!context){if(fingerprint)invalidate();return;}const key=JSON.stringify(context);if(key===fingerprint)return;invalidate();fingerprint=key;session.setContext({...context,revision:crypto.randomUUID()});launcher.hidden=false;planTask=start();onSourceStateChange();}
    new MutationObserver(updateGuidance).observe(host,{childList:true});
    return {sync,invalidate,
      async openSignal(signal,isCurrent=()=>true){const before=JSON.stringify(getContext());if(pending)await planTask;if(planState!=='ready'||!isCurrent()||before!==JSON.stringify(getContext()))throw Error('STALE_SIGNAL_CONTEXT');session.focusSignal(signal.ref,{question:signal.question,signalId:signal.id,assessmentId:signal.assessmentId,adQuote:signal.adEvidence.map(e=>e.quote).join('\n\n')});prepared=false;if(opened)showRound();else open();onSourceStateChange();},
      sourcesForSignal(ref){if(planState!=='ready')return [];const snap=session.snapshot(),ids=new Set(snap.round.queue.filter(q=>q.signalRefs.some(x=>x.field===ref.field&&x.index===ref.index)).map(q=>q.id));return snap.answers.filter(a=>a.roundId===snap.round.id&&ids.has(a.questionId));},
      reset(){invalidate();archived=[];earlierAnswers();session.restore(new root.DraftedExperienceDiscovery.Session().snapshot());},
      snapshot:()=>({session:session.snapshot(),fingerprint,opened,planState,savedScroll,archived,drafts:questionView?.snapshotDrafts()||restoredDrafts}),
      restore:saved=>{if(!saved)return;generation++;planController?.abort();session.restore(saved.session);archived=saved.archived||[];earlierAnswers();fingerprint=JSON.stringify(getContext());restoredDrafts=saved.drafts||[];questionView?.dispose?.();questionView=null;prepared=false;pending=false;planState=saved.planState==='ready'&&saved.session.round?'ready':saved.planState==='idle'?'idle':'error';savedScroll=saved.savedScroll||0;launcher.hidden=!saved.session.context;updatePlanIndicator();if(planState==='ready')updateGuidance();else if(planState==='error')body.replaceChildren(el('h2','Questions were interrupted. Your saved answers are kept.'),button('Try loading the questions again',start));if(saved.opened)open();},
      waitForSources:async()=>{while(interpretations.size)await Promise.allSettled([...interpretations]);},
      refreshTailorState:updateGuidance,
      showChat:(processed=false)=>{if(processed){prepared=false;setLabel('Review your answers');}close(true);},
      sourceContext:applications=>planState==='ready'?session.sourceContext(applications):null,
      appendContext:(id,revision,text)=>{session.appendContext(id,revision,text);prepared=false;updateGuidance();},
      assignExperienceContext:(id,revision,value)=>{session.assignExperienceContext(id,revision,value);prepared=false;updateGuidance();},
      adoptRepresentation:(blocks,version)=>{if(planState!=='ready')return;session.adoptRepresentation(blocks,version);fingerprint=JSON.stringify(getContext());prepared=false;updateGuidance();},
      sourceContentRevision:()=>{const s=session.snapshot();return JSON.stringify(s.answers.filter(a=>a.roundId===s.round?.id).map(a=>({id:a.id,revision:a.currentRevision,text:a.revisions.at(-1)?.text,status:a.status})));},
      sourceRevision:()=>JSON.stringify({context:session.snapshot().context?.revision,answers:session.snapshot().answers,phase:session.snapshot().round?.phase,index:session.snapshot().round?.index})};
  }
  root.DraftedDiscoveryEditor={create};
})(globalThis);
