/* Exactly two fixed page views share the existing Webflow nodes/handlers. */
(function(global){
  'use strict';
  const editorPath='/editor',isEditor=()=>location.pathname.replace(/\/$/,'')===editorPath;
  document.documentElement.classList.add('drafted-pages');document.documentElement.dataset.workspacePage=isEditor()?'editor':'setup';document.documentElement.dataset.workspaceBooting='true';
  function create(adapter){
    const root=document.documentElement,section=document.querySelector('.section-editor'),setup=document.getElementById('section-input'),input=document.getElementById('cv-file');
    global.DraftedLocalLayout?.mount(section);
    let store,storageReady=false,restoring=true,scheduled=false,leaving=false,sourceHash=null,error='',saving=Promise.resolve();
    const status=document.createElement('p');status.className='workspace-save-status';status.setAttribute('role','status');status.hidden=true;document.body.append(status);
    const empty=document.createElement('main');empty.className='workspace-empty';empty.hidden=true;empty.innerHTML='<h1>No CV is open yet</h1><p>Choose your current CV to start an editor workspace.</p><a href="/#section-input">Go to setup</a>';document.body.append(empty);
    const back=document.createElement('a');back.href='/#section-input';back.className='workspace-back-setup';back.textContent='Back to setup';section.querySelector('.workspace-identity').prepend(back);
    const jobButton=document.createElement('button');jobButton.type='button';jobButton.className='workspace-edit-job';jobButton.textContent='Job description';section.querySelector('.workspace-main-actions').prepend(jobButton);
    const dialog=document.createElement('dialog');dialog.className='workspace-job-dialog';dialog.setAttribute('aria-labelledby','workspace-job-title');dialog.innerHTML='<h2 id="workspace-job-title">Job description</h2><div class="workspace-job-reading" tabindex="0" role="region" aria-label="Saved job description"></div><a class="workspace-change-job" href="/#section-input">Change job description in setup</a><div><button type="button" data-close>Close</button></div>';section.append(dialog);
    const jobReading=dialog.querySelector('.workspace-job-reading');
    let jobSourceOpener=null;
    function showJobState(){jobReading.textContent=(adapter.capture().jobText||'').trim()||'No job description has been added.';}
    function notify(message){error=message||'';status.textContent=error;status.hidden=!error;}
    function viewport(){const vv=global.visualViewport,height=vv?.height||innerHeight;root.style.setProperty('--workspace-viewport-height',height+'px');root.style.setProperty('--workspace-viewport-top',(vv?.offsetTop||0)+'px');root.dataset.workspaceKeyboard=String(document.activeElement===document.getElementById('editor-input')&&(height<innerHeight*.72||innerWidth<=700&&height<500));}
    global.visualViewport?.addEventListener('resize',viewport);global.visualViewport?.addEventListener('scroll',viewport);global.addEventListener('resize',viewport);document.addEventListener('focusin',viewport);document.addEventListener('focusout',()=>requestAnimationFrame(viewport));
    function render(){
      document.querySelectorAll('dialog[open]').forEach(modal=>modal.close());
      const editor=isEditor(),valid=global.DraftedWorkspaceStore.valid(adapter.capture());root.dataset.workspacePage=editor?'editor':'setup';root.dataset.workspaceReady=String(valid);empty.hidden=!editor||valid;section.inert=!editor||!valid;setup.inert=editor;const landing=document.querySelector('.page-start');if(landing)landing.inert=editor;
      if(editor){global.scrollTo(0,0);requestAnimationFrame(()=>{global.DraftedCvLayout.rescale(document.getElementById('editor-preview-text'));adapter.showEditor();});}else if(location.hash==='#section-input')requestAnimationFrame(()=>setup.scrollIntoView({behavior:'instant',block:'start'}));viewport();
    }
    function focusPage(){requestAnimationFrame(()=>{const target=isEditor()?(global.DraftedWorkspaceStore.valid(adapter.capture())?section.querySelector('.workspace-document-title'):empty.querySelector('h1')):document.getElementById('preparation-title');if(target){target.tabIndex=-1;target.focus({preventScroll:true});}});}
    async function save(){if(restoring||leaving||!store||!storageReady)return;const state=adapter.capture();state.sourceHash=sourceHash;try{saving=store.save(state,{selected:input.files?.[0]||null,source:adapter.sourceFile(),portrait:adapter.portraitFile?.()||null});await saving;if(error&&!leaving)notify(state.cv&&!adapter.sourceFile()?'Your editor work is restored. The original file is unavailable; choose it again to restore its preview.':'');}catch(e){if(!leaving)notify(e.message);throw e;}}
    function schedule(){if(restoring||scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;save().catch(()=>{});});}
    async function navigate(path,{transition=false}={}){try{
      const prepare=async()=>{await ready;await save();};
      const commit=()=>{history.replaceState({...history.state,workspaceScroll:global.scrollY},'');history.pushState({draftedWorkspace:true},'',path);render();};
      if(transition&&!isEditor()&&global.DraftedWorkspaceStore.valid(adapter.capture())&&global.DraftedWorkspaceTransition)await global.DraftedWorkspaceTransition.run(prepare,commit);
      else{await prepare();commit();}
      if(!isEditor())setup.scrollIntoView({behavior:'instant',block:'start'});focusPage();requestAnimationFrame(schedule);
    }catch(e){notify(e.message);}}
    back.addEventListener('click',event=>{if(event.button||event.metaKey||event.ctrlKey||event.shiftKey)return;event.preventDefault();navigate('/#section-input');});
    empty.querySelector('a').addEventListener('click',event=>{event.preventDefault();navigate('/#section-input');});
    global.addEventListener('popstate',()=>{render();if(!isEditor()&&location.hash!=='#section-input')global.scrollTo(0,history.state?.workspaceScroll||0);focusPage();requestAnimationFrame(schedule);});
    // A browser-restored older document must not overwrite newer saved work.
    global.addEventListener('pageshow',event=>{if(event.persisted){restoring=true;root.dataset.workspaceBooting='true';location.reload();}});
    jobButton.addEventListener('click',()=>{showJobState();dialog.showModal();dialog.querySelector('[data-close]').focus({preventScroll:true});});
    dialog.querySelector('[data-close]').addEventListener('click',()=>dialog.close());
    dialog.addEventListener('close',()=>{if(isEditor())(jobSourceOpener?.isConnected?jobSourceOpener:jobButton).focus({preventScroll:true});jobSourceOpener=null;});
    dialog.querySelector('.workspace-change-job').addEventListener('click',event=>{if(event.button||event.metaKey||event.ctrlKey||event.shiftKey)return;event.preventDefault();dialog.close();navigate('/#section-input');});
    async function confirmJobChange(){
      const modal=document.createElement('dialog');modal.className='workspace-replace-dialog';modal.setAttribute('aria-labelledby','workspace-job-change-title');modal.innerHTML='<h2 id="workspace-job-change-title">Use this job description?</h2><p>Your CV and saved answers will be kept. Existing suggestions will need to be updated.</p><button type="button" data-cancel>Cancel</button><button type="button" data-use>Use job description</button>';document.body.append(modal);
      return new Promise(resolve=>{let approved=false;modal.querySelector('[data-cancel]').onclick=()=>modal.close();modal.querySelector('[data-use]').onclick=()=>{approved=true;modal.close();};modal.addEventListener('close',()=>{modal.remove();document.getElementById('upload-btn').focus({preventScroll:true});resolve(approved);},{once:true});modal.showModal();modal.querySelector('[data-cancel]').focus();});
    }
    async function confirmReplacement(){
      const modal=document.createElement('dialog');modal.className='workspace-replace-dialog';modal.setAttribute('aria-labelledby','workspace-replace-title');modal.innerHTML='<h2 id="workspace-replace-title">Replace the current CV?</h2><p>A new CV starts new editor work and replaces the current CV, chat and pending suggestions. Your current work stays unchanged if processing fails.</p><button type="button" data-cancel>Keep current work</button><button type="button" data-replace>Replace CV and continue</button>';document.body.append(modal);
      return new Promise(resolve=>{let approved=false;modal.querySelector('[data-cancel]').onclick=()=>modal.close();modal.querySelector('[data-replace]').onclick=()=>{approved=true;modal.close();};modal.addEventListener('close',()=>{modal.remove();document.getElementById('upload-btn').focus({preventScroll:true});resolve(approved);},{once:true});modal.showModal();modal.querySelector('[data-cancel]').focus();});
    }
    const ready=(async()=>{
      try{store=global.DraftedWorkspaceStore.create();const saved=await store.load();storageReady=true;if(saved){sourceHash=saved.state.sourceHash||(saved.files.source?await store.fingerprint(saved.files.source):null);await adapter.restore(saved.state,saved.files);if(saved.state.cv&&!saved.files.source)notify('Your editor work is restored. The original file is unavailable; choose it again to restore its preview.');}}
      catch(e){notify(e.message);}finally{restoring=false;delete root.dataset.workspaceBooting;render();}
    })();
    document.addEventListener('drafted-draft-change',schedule);document.addEventListener('input',schedule,true);document.addEventListener('change',schedule,true);document.addEventListener('click',schedule,true);let scrollTimer;document.addEventListener('scroll',()=>{clearTimeout(scrollTimer);scrollTimer=setTimeout(schedule,100);},{capture:true,passive:true});
    new MutationObserver(schedule).observe(section,{subtree:true,childList:true,characterData:true});
    // Snapshot before navigation aborts fetch. Its rejection/finally must not
    // overwrite an interrupted request with an ordinary failed/finished state.
    function checkpointExit(){if(leaving)return;save().catch(()=>{});leaving=true;}
    global.addEventListener('beforeunload',checkpointExit);global.addEventListener('pagehide',checkpointExit);
    return {ready,save,schedule,openJobSource(span,expected,opener){
      const raw=adapter.capture().jobText||'';if(raw!==expected||!Number.isInteger(span.start)||!Number.isInteger(span.end)||span.start<0||span.end<=span.start||raw.slice(span.start,span.end)!==span.quote)return;
      jobSourceOpener=opener;jobReading.replaceChildren();const mark=document.createElement('mark');mark.textContent=span.quote;jobReading.append(document.createTextNode(raw.slice(0,span.start)),mark,document.createTextNode(raw.slice(span.end)));dialog.showModal();dialog.querySelector('[data-close]').focus({preventScroll:true});requestAnimationFrame(()=>{jobReading.scrollTop=mark.offsetTop-jobReading.offsetTop-32;});
    },restoring:()=>restoring,
      async beforeContinue(file){await ready;if(!store||!storageReady)throw Error('Workspace storage is unavailable. Enable browser storage before continuing.');const hash=await store.fingerprint(file);if(input.files?.[0]!==file)return false;if(global.DraftedWorkspaceStore.valid(adapter.capture())){if(hash===sourceHash){if((adapter.capture().jobText||'')!==document.getElementById('job-ad-input').value){if(!await confirmJobChange())return false;await adapter.commitJobDraft();}if(!adapter.sourceFile())adapter.adoptSource(file);await navigate(editorPath);return 'resume';}if(!await confirmReplacement())return false;await adapter.commitJobDraft();}return 'upload';},
      async complete(file){sourceHash=await store.fingerprint(file);await navigate(editorPath,{transition:true});},
      showSetup:()=>navigate('/#section-input'),notify};
  }
  global.DraftedWorkspacePages={enabled:true,create};
})(window);
