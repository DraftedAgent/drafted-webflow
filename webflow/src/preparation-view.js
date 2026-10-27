/* Preparation-section chrome. Existing inputs, PDF viewer and handlers stay live. */
(function(global){
  'use strict';
  function mount(section){
    if(!section)return null;
    const left=section.querySelector('.input-left'),right=section.querySelector('.input-right');
    const job=section.querySelector('#job-ad-input'),jobStatus=section.querySelector('#jobcontext-status');
    const picker=section.querySelector('.file-picker'),file=section.querySelector('#cv-file'),choose=section.querySelector('#file-btn'),name=section.querySelector('#file-name');
    const action=section.querySelector('#upload-btn'),preview=section.querySelector('.cv-preview-box');
    if(!left||!right||!job||!jobStatus||!picker||!file||!choose||!name||!action||!preview)return null;
    const el=(tag,className,text)=>{const node=document.createElement(tag);node.className=className;if(text)node.textContent=text;return node;};
    // Remove this view's role field before the editor captures DOM references.
    // Other flows still support targetRole; this form sends the existing empty optional value.
    const role=section.querySelector('#target-role-input');if(role){role.value='';role.remove();}
    section.classList.add('preparation-section');section.setAttribute('aria-labelledby','preparation-title');
    const intro=el('header','preparation-intro');
    const title=el('h1','preparation-title','A starting point. A direction.');title.id='preparation-title';
    intro.append(title,el('p','preparation-introduction','Bring your current CV and the opportunity you have in mind. We’ll work from there.'));
    function step(number,title,help,id){
      const group=el('section','preparation-step'),heading=el('div','preparation-step-heading'),badge=el('span','preparation-number',number);badge.setAttribute('aria-hidden','true');
      const text=el('div','preparation-step-text'),label=el('h2','preparation-step-title',title);label.id=id;
      const description=el('p','preparation-step-help',help);description.id=id+'-help';text.append(label,description);heading.append(badge,text);group.append(heading);return {group,heading,label};
    }
    const opportunity=step('01','Job description (optional)','Paste the job description to give your CV a clear context.','preparation-opportunity');
    job.removeAttribute('style');job.setAttribute('aria-labelledby',opportunity.label.id);job.setAttribute('aria-describedby','preparation-opportunity-help preparation-job-hint');
    job.placeholder='Paste the job description…';
    const jobHint=el('p','preparation-job-hint','Use at least 200 characters to extract job context.');jobHint.id='preparation-job-hint';
    const updateHint=()=>{const length=job.value.trim().length;jobHint.hidden=length===0||length>=200;};job.addEventListener('input',updateHint);updateHint();
    jobStatus.setAttribute('role','status');jobStatus.setAttribute('aria-live','polite');
    opportunity.group.append(job,jobHint,jobStatus);
    const starting=step('02','Your current CV','Upload the CV you have today. It doesn’t need to be tailored to this role.','preparation-starting');
    const icon=el('span','preparation-file-icon');icon.setAttribute('aria-hidden','true');
    icon.innerHTML='<svg width="25" height="28" viewBox="0 0 24 28" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 2h9l5 5v18H5zM14 2v6h5M8 13h8M8 17h8M8 21h5"/></svg>';
    const fileText=el('div','preparation-file-details'),type=el('span','preparation-file-type','PDF document');fileText.append(name,type);
    file.setAttribute('aria-labelledby','preparation-starting');file.tabIndex=-1;
    choose.setAttribute('role','button');choose.tabIndex=0;choose.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();file.click();}});
    picker.replaceChildren(file,icon,fileText,choose);starting.group.append(picker);
    const actions=el('div','preparation-actions');
    action.textContent='Continue to editor';action.setAttribute('role','button');action.setAttribute('aria-disabled','false');
    action.addEventListener('keydown',event=>{if(event.key===' '){event.preventDefault();action.click();}});
    const status=el('p','preparation-status');status.id='preparation-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.hidden=true;
    action.removeAttribute('aria-describedby');actions.append(action,status);
    left.replaceChildren(intro,opportunity.group,starting.group,actions);
    right.replaceChildren(preview);right.setAttribute('role','figure');right.setAttribute('aria-label','Your uploaded CV preview');
    const layout=el('div','preparation-layout');layout.append(left,right);section.replaceChildren(layout);
    function show(state,text){status.dataset.state=state;status.textContent=text;status.hidden=!text;}
    function selected(){
      const selected=file.files?.[0];picker.dataset.hasFile=String(!!selected);name.textContent=selected?selected.name:'Choose your CV';name.title=selected?.name||'';
      type.textContent=selected?(selected.type==='application/pdf'||/\.pdf$/i.test(selected.name)?'PDF document':selected.type||'Selected file'):'PDF document';
      choose.textContent=selected?'Replace file':'Choose file';show('selected','');
    }
    file.addEventListener('change',selected);selected();
    global.DraftedUploadedPreviewOverlay.create({section,right,preview});
    return {
      loading(value){section.setAttribute('aria-busy',String(value));action.setAttribute('aria-disabled',String(value));action.setAttribute('aria-busy',String(value));if(value)show('loading','Analyzing your CV. Please keep this tab open.');},
      missingFile(){show('error','Choose a PDF before continuing.');choose.focus();},
      failed(selectedFile){if(file.files?.[0]===selectedFile)show('error','Your CV could not be processed. Please try again.');},
      complete(selectedFile,{navigate=true}={}){
        if(file.files?.[0]!==selectedFile)return;
        show('ready','Your CV is ready in the editor.');
        if(navigate)document.querySelector('.section-editor')?.scrollIntoView({behavior:global.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
      }
    };
  }
  global.DraftedPreparationView={mount};
})(window);
