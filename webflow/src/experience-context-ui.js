(function(root){
 'use strict';
 function mount(host,{blocks,cvVersionId,selected=null,onContinue,onLeaveOut}){
  const C=root.DraftedExperienceContext,form=document.createElement('form');form.className='experience-context-picker';
  const add=(tag,text,parent=form)=>{const n=document.createElement(tag);if(text)n.textContent=text;parent.append(n);return n;};
  const options=add('fieldset',''),legend=add('legend','Choose the role or project',options);legend.className='workspace-sr-only';
  let choice=null,sending=false;const records=new Map(),inputs=[];
  const other=add('div','');other.className='experience-other-context';other.hidden=true;
  const field=(label,required=false)=>{const wrapper=add('label',label,other),input=add('input','',wrapper);input.type='text';input.maxLength=1000;input.required=required;return input;};
  const company=field('Company or context'),role=field('Role or project'),period=field('Period (optional)');company.placeholder='Optional for an independent project';
  const choose=value=>{choice=value;other.hidden=value!=='other';role.required=value==='other';for(const input of inputs)input.closest('label').classList.toggle('is-chosen',input.checked);};
  const option=(key,title,detail,context)=>{
   const label=add('label','',options);label.className='experience-context-option';const input=add('input','',label);input.type='radio';input.name='experience-context';input.value=key;input.required=true;inputs.push(input);
   const copy=add('span','',label);add('strong',title,copy);if(detail)add('span',detail,copy);
   if(context)records.set(key,context);input.addEventListener('change',()=>choose(key));return input;
  };
  for(const [i,b] of blocks.filter(C.eligible).entries()){
   const context=C.reference(cvVersionId,b),s=context.snapshot,title=s.companyOrContext||s.roleOrProject||s.label||'Experience',detail=[s.roleOrProject!==title?s.roleOrProject:'',[s.startDate,s.endDate].filter(Boolean).join(' – ')].filter(Boolean).join(' · ');
   const input=option(String(i),title,detail||(!s.companyOrContext&&!s.roleOrProject?b.text.slice(0,140):''),context);
   // Restore only an explicit, still-valid saved choice; never a model guess.
   if(selected?.kind==='cv_entry'&&C.resolve(selected,cvVersionId,blocks).status==='resolved'&&selected.blockId===b.blockId){input.checked=true;choose(String(i));}
  }
  const another=option('other','Another role or project','',null);
  if(selected?.kind==='other'){another.checked=true;company.value=selected.companyOrContext;role.value=selected.roleOrProject;period.value=selected.period;choose('other');}
  if(selected?.kind==='cv_entry'&&C.resolve(selected,cvVersionId,blocks).status!=='resolved')add('p','Saved context: '+C.describe(selected)+'. Its CV reference needs to be selected again.');
  const error=add('p','');error.setAttribute('role','alert');
  const actions=add('div','');actions.className='tailor-actions';const save=add('button','Continue',actions);save.type='submit';save.className='tailor-primary';const omit=add('button','Leave this out',actions);omit.type='button';
  omit.addEventListener('click',()=>{if(!sending)onLeaveOut();});
  form.addEventListener('submit',async event=>{
   event.preventDefault();if(sending)return;error.textContent='';
   try{if(choice===null){error.textContent='Choose a role or project.';return;}
    const value=choice==='other'?{kind:'other',companyOrContext:company.value,roleOrProject:role.value,period:period.value}:records.get(choice);C.validate(value);
    sending=true;save.disabled=omit.disabled=true;await onContinue(C.copy(value));
   }catch(failure){sending=false;save.disabled=omit.disabled=false;error.textContent=['STALE_CONTEXT','STALE_CONTEXT_REFERENCE','STALE_ANSWER'].includes(failure?.message)?'Your CV, job context or answer changed. Your answer and selection are kept. Leave this suggestion and prepare a new one.':'The context could not be saved. Your answer and selection are kept. Review the choice and try again.';}
  });host.append(form);return form;
 }
 root.DraftedExperienceContextUI={mount};
})(globalThis);
