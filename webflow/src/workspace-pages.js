/* Exactly two fixed page views share the existing Webflow nodes/handlers. */
(function(global){
  'use strict';
  const editorPath='/editor',isEditor=()=>location.pathname.replace(/\/$/,'')===editorPath;
  document.documentElement.classList.add('drafted-pages');document.documentElement.dataset.workspacePage=isEditor()?'editor':'setup';document.documentElement.dataset.workspaceBooting='true';
  function create(adapter){
    const root=document.documentElement,section=document.querySelector('.section-editor'),setup=document.getElementById('section-input'),input=document.getElementById('cv-file');
    let store,storageReady=false,restoring=true,scheduled=false,sourceHash=null,error='',saving=Promise.resolve();
    const status=document.createElement('p');status.className='workspace-save-status';status.setAttribute('role','status');status.hidden=true;document.body.append(status);
    const empty=document.createElement('main');empty.className='workspace-empty';empty.hidden=true;empty.innerHTML='<h1>No CV is open yet</h1><p>Choose your current CV to start an editor workspace.</p><a href="/#section-input">Go to setup</a>';document.body.append(empty);
    const back=document.createElement('a');back.href='/#section-input';back.className='workspace-back-setup';back.textContent='Back to setup';section.querySelector('.workspace-identity').prepend(back);
    const jobButton=document.createElement('button');jobButton.type='button';jobButton.className='workspace-edit-job';jobButton.textContent='Job description';section.querySelector('.workspace-main-actions').prepend(jobButton);
    const dialog=document.createElement('dialog');dialog.className='workspace-job-dialog';dialog.setAttribute('aria-labelledby','workspace-job-title');dialog.innerHTML='<h2 id="workspace-job-title">Job description (optional)</h2><label for="workspace-job-input">Give your experience a context</label><textarea id="workspace-job-input" rows="10"></textarea><p>Changing the job description does not change your CV. Use Tailor to job when you want a new suggestion.</p><div><button type="button" data-cancel>Cancel</button><button type="button" data-save>Save job description</button></div>';section.append(dialog);
    const jobDraft=dialog.querySelector('textarea');
    const jobState=document.createElement('p');jobState.setAttribute('role','status');dialog.querySelector('h2').after(jobState);
    function showJobState(){const text=document.getElementById('jobcontext-status-text')?.textContent||'';jobState.textContent=text;jobState.hidden=!text;}
    new MutationObserver(()=>{if(dialog.open)showJobState();}).observe(document.getElementById('jobcontext-status'),{subtree:true,childList:true,attributes:true,attributeFilter:['data-state']});
    function notify(message){error=message||'';status.textContent=error;status.hidden=!error;}
    function viewport(){const vv=global.visualViewport,height=vv?.height||innerHeight;root.style.setProperty('--workspace-viewport-height',height+'px');root.style.setProperty('--workspace-viewport-top',(vv?.offsetTop||0)+'px');root.dataset.workspaceKeyboard=String(document.activeElement===document.getElementById('editor-input')&&(height<innerHeight*.72||innerWidth<=700&&height<500));}
    global.visualViewport?.addEventListener('resize',viewport);global.visualViewport?.addEventListener('scroll',viewport);global.addEventListener('resize',viewport);document.addEventListener('focusin',viewport);document.addEventListener('focusout',()=>requestAnimationFrame(viewport));
    function render(){
      document.querySelectorAll('dialog[open]').forEach(modal=>modal.close());
      const editor=isEditor(),valid=global.DraftedWorkspaceStore.valid(adapter.capture());root.dataset.workspacePage=editor?'editor':'setup';root.dataset.workspaceReady=String(valid);empty.hidden=!editor||valid;section.inert=!editor||!valid;setup.inert=editor;const landing=document.querySelector('.page-start');if(landing)landing.inert=editor;
      if(editor){global.scrollTo(0,0);requestAnimationFrame(()=>{global.DraftedCvLayout.rescale(document.getElementById('editor-preview-text'));adapter.showEditor();});}else if(location.hash==='#section-input')requestAnimationFrame(()=>setup.scrollIntoView({behavior:'instant',block:'start'}));viewport();
    }
    function focusPage(){requestAnimationFrame(()=>{const target=isEditor()?(global.DraftedWorkspaceStore.valid(adapter.capture())?section.querySelector('.workspace-document-title'):empty.querySelector('h1')):document.getElementById('preparation-title');if(target){target.tabIndex=-1;target.focus({preventScroll:true});}});}
    async function save(){if(restoring||!store||!storageReady)return;const state=adapter.capture();state.sourceHash=sourceHash;try{saving=store.save(state,{selected:input.files?.[0]||null,source:adapter.sourceFile()});await saving;if(error)notify(state.cv&&!adapter.sourceFile()?'Your editor work is restored. The original file is unavailable; choose it again to restore its preview.':'');}catch(e){notify(e.message);throw e;}}
    function schedule(){if(restoring||scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;save().catch(()=>{});});}
    async function navigate(path){try{await ready;await save();history.replaceState({...history.state,workspaceScroll:global.scrollY},'');history.pushState({draftedWorkspace:true},'',path);render();if(!isEditor())setup.scrollIntoView({behavior:'instant',block:'start'});focusPage();requestAnimationFrame(schedule);}catch(e){notify(e.message);}}
    back.addEventListener('click',event=>{if(event.button||event.metaKey||event.ctrlKey||event.shiftKey)return;event.preventDefault();navigate('/#section-input');});
    empty.querySelector('a').addEventListener('click',event=>{event.preventDefault();navigate('/#section-input');});
    global.addEventListener('popstate',()=>{render();if(!isEditor()&&location.hash!=='#section-input')global.scrollTo(0,history.state?.workspaceScroll||0);focusPage();requestAnimationFrame(schedule);});
    // A browser-restored older document must not overwrite newer saved work.
    global.addEventListener('pageshow',event=>{if(event.persisted){restoring=true;root.dataset.workspaceBooting='true';location.reload();}});
    jobButton.addEventListener('click',()=>{jobDraft.value=document.getElementById('job-ad-input').value;showJobState();dialog.showModal();jobDraft.focus();});
    dialog.querySelector('[data-cancel]').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>jobButton.focus({preventScroll:true}));
    dialog.querySelector('[data-save]').addEventListener('click',()=>{const original=document.getElementById('job-ad-input');if(original.value!==jobDraft.value||!global.__DRAFTED_JOBCONTEXT__&&jobDraft.value.trim().length>=200){original.value=jobDraft.value;original.dispatchEvent(new Event('input',{bubbles:true}));}dialog.close();schedule();});
    async function confirmReplacement(){
      const modal=document.createElement('dialog');modal.className='workspace-replace-dialog';modal.setAttribute('aria-labelledby','workspace-replace-title');modal.innerHTML='<h2 id="workspace-replace-title">Replace the current CV?</h2><p>A new CV starts new editor work and replaces the current CV, chat and pending suggestions. Your current work stays unchanged if processing fails.</p><button type="button" data-cancel>Keep current work</button><button type="button" data-replace>Replace CV and continue</button>';document.body.append(modal);
      return new Promise(resolve=>{let approved=false;modal.querySelector('[data-cancel]').onclick=()=>modal.close();modal.querySelector('[data-replace]').onclick=()=>{approved=true;modal.close();};modal.addEventListener('close',()=>{modal.remove();document.getElementById('upload-btn').focus({preventScroll:true});resolve(approved);},{once:true});modal.showModal();modal.querySelector('[data-cancel]').focus();});
    }
    const ready=(async()=>{
      try{store=global.DraftedWorkspaceStore.create();const saved=await store.load();storageReady=true;if(saved){sourceHash=saved.state.sourceHash||(saved.files.source?await store.fingerprint(saved.files.source):null);await adapter.restore(saved.state,saved.files);if(saved.state.cv&&!saved.files.source)notify('Your editor work is restored. The original file is unavailable; choose it again to restore its preview.');if(saved.state.jobEditor?.open&&isEditor()){jobDraft.value=saved.state.jobEditor.draft;requestAnimationFrame(()=>{showJobState();dialog.showModal();jobDraft.focus({preventScroll:true});});}}}
      catch(e){notify(e.message);}finally{restoring=false;delete root.dataset.workspaceBooting;render();}
    })();
    document.addEventListener('input',schedule,true);document.addEventListener('change',schedule,true);document.addEventListener('click',schedule,true);let scrollTimer;document.addEventListener('scroll',()=>{clearTimeout(scrollTimer);scrollTimer=setTimeout(schedule,100);},{capture:true,passive:true});
    new MutationObserver(schedule).observe(section,{subtree:true,childList:true,characterData:true});global.addEventListener('pagehide',()=>{save().catch(()=>{});});
    return {ready,save,schedule,restoring:()=>restoring,
      async beforeContinue(file){await ready;if(!store||!storageReady)throw Error('Workspace storage is unavailable. Enable browser storage before continuing.');const hash=await store.fingerprint(file);if(input.files?.[0]!==file)return false;if(global.DraftedWorkspaceStore.valid(adapter.capture())){if(hash===sourceHash){if(!adapter.sourceFile())adapter.adoptSource(file);await navigate(editorPath);return 'resume';}if(!await confirmReplacement())return false;}return 'upload';},
      async complete(file){sourceHash=await store.fingerprint(file);await navigate(editorPath);},
      showSetup:()=>navigate('/#section-input'),notify};
  }
  global.DraftedWorkspacePages={enabled:true,create};
})(window);
