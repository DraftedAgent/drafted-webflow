/* Local, version-specific presentation. Original file never enters AI payloads. */
(function(root){
 'use strict';
 const clamp=(n,min,max,fallback)=>Number.isFinite(n)?Math.max(min,Math.min(max,n)):fallback;
 const shapes=['square','rounded','circle'];
 const designs=typeof module==='object'&&module.exports?require('./cv-document-designs.js'):root.DraftedCvDesigns;
 const designConfig=id=>designs.find(d=>d.id===id)||designs[0];
 // Migrate a legacy global choice only with an explicitly known active template.
 function normalize(value,legacyDesign){
  const shapeOverrides={};
  if(Object.prototype.hasOwnProperty.call(value||{},'shapeOverrides')){
   for(const design of designs){const shape=value.shapeOverrides?.[design.id];if(shapes.includes(shape))shapeOverrides[design.id]=shape;}
  }else if(designs.some(d=>d.id===legacyDesign)){
   const legacy=Object.prototype.hasOwnProperty.call(value||{},'shapeOverride')?value.shapeOverride:value?.shape;
   if(shapes.includes(legacy))shapeOverrides[legacyDesign]=legacy;
  }
  return {enabled:value?.enabled===true,shapeOverrides,x:clamp(value?.x,0,100,50),y:clamp(value?.y,0,100,50),zoom:clamp(value?.zoom,1,3,1)};
 }
 const effectiveShape=(value,design)=>normalize(value,design).shapeOverrides[design]??designConfig(design).defaultPhotoShape;
 const radius=(shape,design,scaled=false)=>shape==='circle'?'50%':shape==='rounded'?(scaled?6/(designConfig(design).photoSizeMm*96/25.4)*100+'%':'6px'):'0';

 function requirements(text=''){
  const clauses=String(text).split(/(?<=[.!?])\s+|\n/).map(s=>s.trim()).filter(Boolean),found=[];
  for(const quote of clauses){
   const cv=/\b(?:cv|résumé|resume|curriculum vitae)\b/i.test(quote),photo=/\b(?:photo(?:graph)?|portrait|headshot|foto|fotografi|porträtt(?:bild)?|bild)\b/i.test(quote);
   if(!photo)continue;
   const forward=/\b(?:cv|résumé|resume|curriculum vitae)\b.{0,16}\b(?:must|should|shall|ska|måste|får)\b.{0,40}\b(?:photo(?:graph)?|portrait|headshot|foto|bild|porträtt)\b/i.test(quote);
   const separate=/\b(?:separat(?:e|ely)?|separate attachment|portfolio|portfölj|arbetsprov)\b/i.test(quote),direct=forward||/\b(?:cv|résumé|resume|curriculum vitae)\s+(?:with|without|med|utan)\b/i.test(quote)||/\b(?:photo(?:graph)?|portrait|headshot|foto|fotografi|porträtt(?:bild)?|bild)\b.{0,55}\b(?:in|on|i|på)\s+(?:(?:your|the|ditt|ert|din)\s+)?(?:cv|résumé|resume)\b/i.test(quote);
   if(separate&&!direct){found.push({kind:'separate',quote});continue;}
   if(!cv||!direct)continue;
   if(/\b(?:optional|voluntary|not required|do not require|don't require|if you wish|if you want|if desired|om du vill|om du önskar|valfri(?:tt)?|frivillig(?:t)?|may include|can include|kan inkludera|krävs inte|behövs inte)\b/i.test(quote)){found.push({kind:'optional',quote});continue;}
   if(/\b(?:without|no photos?|no photographs?|do not (?:include|send|attach|add|use)|don't (?:include|send|attach|add|use)|must not|utan|inga bilder|inget foto|inte.*(?:bild|foto)|ej.*(?:bild|foto))\b/i.test(quote)){found.push({kind:'forbidden',quote});continue;}
   // Require an explicit relationship to the CV; titles/employer names alone
   // and general application-image requirements are never enough.
   if(forward||/\b(?:cv|résumé|resume|curriculum vitae)\s+(?:with|med)\b.{0,50}\b(?:photo(?:graph)?|portrait|headshot|foto|bild|porträtt)/i.test(quote)||/\b(?:include|add|attach|required|must|please|ska|måste|bifoga|inkludera|lägg till|krävs)\b/i.test(quote)&&/\b(?:in|on|to|i|på)\s+(?:(?:your|the|ditt|ert|din)\s+)?(?:cv|résumé|resume|curriculum vitae)\b/i.test(quote))found.push({kind:'required',quote});
  }
  const kinds=new Set(found.map(f=>f.kind));
  return {kind:kinds.has('required')&&kinds.has('forbidden')?'conflict':kinds.has('forbidden')?'forbidden':kinds.has('required')?'required':'optional',sources:found};
 }
 function frame(photo,design='classic_v1'){
  const w=designConfig(design).photoSizeMm,h=w;
  const el=document.createElement('figure');el.className='cv-portrait cv-photo-slot';el.style.setProperty('--portrait-width',w+'mm');el.style.setProperty('--portrait-height',h+'mm');
  const image=document.createElement('img');image.alt='Portrait';image.src=photo.src;
  const crop=normalize(photo);
  const shape=effectiveShape(photo,design);el.dataset.portraitShape=shape;el.style.borderRadius=radius(shape,design);
  Object.assign(image.style,{width:'100%',height:'100%',objectFit:'cover',objectPosition:crop.x+'% '+crop.y+'%',transform:'scale('+crop.zoom+')',transformOrigin:crop.x+'% '+crop.y+'%'});
  el.append(image);return el;
 }
 async function decode(src){const image=new Image();image.src=src;await image.decode();if(!image.naturalWidth||!image.naturalHeight||image.naturalWidth*image.naturalHeight>40000000)throw Error('Choose an image smaller than 40 megapixels.');return {width:image.naturalWidth,height:image.naturalHeight};}
 function create({host,getJob,getDesign,onChange}){
  let state=normalize(),file=null,src=null,size=null,dialog=null,restoreIssue='';
  const rule=()=>requirements(getJob());
  function model(){return file&&src&&state.enabled&&rule().kind!=='forbidden'?{...state,...size,src}:null;}
  function error(){const r=rule();return r.kind==='conflict'?'The application gives conflicting photo instructions. Check the job description before exporting.':r.kind==='required'&&!model()?'This application asks for a photo in the CV. Add a photo before exporting.':state.enabled&&!file&&r.kind!=='forbidden'?'Your photo is unavailable. Choose it again or remove it from this CV.':'';}
  function mount(){
   host.querySelectorAll('[data-portrait-action]').forEach(n=>n.remove());
   const page=host.querySelector('.cv-page');if(!page)return;
   const portrait=page.querySelector('.cv-portrait'),button=document.createElement('button');button.type='button';button.dataset.portraitAction=portrait?'change':'add';button.dataset.cvEditorOnly='true';
   if(portrait){button.className='cv-portrait-edit';button.setAttribute('aria-label','Change photo');button.title='Change photo';portrait.append(button);}
   else{button.className='cv-portrait-add';button.textContent='Add photo';const style=getComputedStyle(page);button.style.top=Math.max(4,parseFloat(style.paddingTop)-34)+'px';button.style[['studio_v1','editorial_v1'].includes(getDesign())?'left':'right']=style.paddingRight;page.append(button);}
  }
  function focusControl(){host.querySelector('[data-portrait-action]')?.focus({preventScroll:true});}
  async function restore(value,original,legacyDesign){
   if(src)URL.revokeObjectURL(src);state=normalize(value,legacyDesign);file=null;src=null;size=null;restoreIssue='';
   if(original){const next=URL.createObjectURL(original);try{size=await decode(next);file=original;src=next;}catch{URL.revokeObjectURL(next);restoreIssue='Your saved photo could not be restored. Choose it again.';}}
   else if(value?.hasOriginal)restoreIssue='Your original photo is unavailable. Choose it again.';
  }
  async function commit(){await onChange();document.dispatchEvent(new Event('drafted-draft-change'));focusControl();}
  function open(){
   if(dialog?.open)return;const activeDesign=getDesign();let draft=normalize(state),draftFile=file,draftSrc=src,draftSize=size,temporary=null,loading=false,readSequence=0,drag=null,dragMoved=false;
   const current=document.createElement('dialog');dialog=current;current.className='cv-portrait-dialog';current.setAttribute('aria-label','Photo');
   const add=(tag,text,parent=current)=>{const e=document.createElement(tag);if(text)e.textContent=text;parent.append(e);return e;};
   add('h2','Photo');const r=rule();
   const message=r.kind==='forbidden'?'This application asks for a CV without a photo.':r.kind==='conflict'?'The application gives conflicting photo instructions. Check the job description.':r.kind==='required'?'This application asks for a photo in the CV.':'';
   if(message)add('p',message).className='cv-portrait-notice';
   const upload=add('input');upload.type='file';upload.hidden=true;upload.accept='image/jpeg,image/png,image/webp';upload.setAttribute('aria-label','Photo file');
   const shapes=add('div');shapes.className='cv-photo-shapes';shapes.setAttribute('role','group');shapes.setAttribute('aria-label','Photo shape');
   const shapeButtons=['square','rounded','circle'].map(value=>{const label=value[0].toUpperCase()+value.slice(1),button=add('button','',shapes);button.type='button';button.setAttribute('aria-label',label);const icon=add('span','',button);icon.className='cv-photo-shape-icon';icon.dataset.shape=value;icon.setAttribute('aria-hidden','true');add('span',label,button);button.onclick=()=>{draft.shapeOverrides[activeDesign]=value;draw();};return {value,button};});
   const preview=add('div');preview.className='cv-portrait-crop';preview.tabIndex=0;preview.setAttribute('role','group');preview.setAttribute('aria-label','Drag photo to position your face');
   const zoomLabel=add('label','Zoom'),zoom=add('input','',zoomLabel);zoom.type='range';zoom.min=1;zoom.max=3;zoom.step=.05;zoom.value=draft.zoom;zoom.setAttribute('aria-label','Zoom');
   const status=add('p',restoreIssue);status.setAttribute('role','alert');
   const actions=add('div');actions.className='cv-portrait-actions';const remove=add('button','Remove photo',actions),cancel=add('button','Cancel',actions),save=add('button','Save',actions);remove.type=cancel.type=save.type='button';remove.className='cv-photo-remove';
   function draw(){
    const shape=effectiveShape(draft,activeDesign);preview.style.borderRadius=radius(shape,activeDesign,true);for(const {value,button} of shapeButtons)button.setAttribute('aria-pressed',String(value===shape));
    preview.setAttribute('role','button');preview.setAttribute('aria-label',draftSrc?'Change photo; drag to position your face':'Choose photo');preview.title=draftSrc?'Click to change photo. Drag to position.':'Choose photo';
    preview.replaceChildren();if(draftSrc){const crop=frame({...draft,...draftSize,src:draftSrc},activeDesign),ratio=parseFloat(crop.style.getPropertyValue('--portrait-height'))/parseFloat(crop.style.getPropertyValue('--portrait-width'));crop.style.width='100%';crop.style.height=ratio*100+'%';crop.style.borderRadius=preview.style.borderRadius;preview.append(crop);}else{const hint=add('span','Choose a photo',preview);hint.className='cv-photo-empty';}
    zoom.disabled=!draftSrc;save.disabled=loading||!draftSrc||r.kind==='forbidden';remove.hidden=!draftSrc;remove.disabled=loading;
   }
   function move(dx,dy,origin){
    const x=origin.width-origin.imageWidth,y=origin.height-origin.imageHeight;
    if(Math.abs(x)>.1)draft.x=clamp(origin.x+dx/x*100,0,100,50);
    if(Math.abs(y)>.1)draft.y=clamp(origin.y+dy/y*100,0,100,50);
    draw();
   }
   function geometry(){const f=preview.querySelector('.cv-portrait'),i=f?.querySelector('img');if(!f||!i)return null;const a=f.getBoundingClientRect(),cover=Math.max(a.width/draftSize.width,a.height/draftSize.height)*draft.zoom;return {x:draft.x,y:draft.y,width:a.width,height:a.height,imageWidth:draftSize.width*cover,imageHeight:draftSize.height*cover};}
   preview.onclick=()=>{if(!dragMoved&&!loading)upload.click();dragMoved=false;};
   preview.onpointerdown=e=>{dragMoved=false;if(e.button!==0||!draftSrc)return;const origin=geometry();if(!origin)return;drag={...origin,left:e.clientX,top:e.clientY,id:e.pointerId};preview.setPointerCapture(e.pointerId);preview.classList.add('is-dragging');e.preventDefault();};
   preview.onpointermove=e=>{if(drag&&e.pointerId===drag.id){const dx=e.clientX-drag.left,dy=e.clientY-drag.top;if(Math.hypot(dx,dy)>4)dragMoved=true;if(dragMoved)move(dx,dy,drag);}};
   const endDrag=()=>{drag=null;preview.classList.remove('is-dragging');};preview.onpointerup=endDrag;preview.onpointercancel=endDrag;preview.onlostpointercapture=endDrag;
   preview.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();if(!loading)upload.click();return;}const offset={ArrowLeft:[-5,0],ArrowRight:[5,0],ArrowUp:[0,-5],ArrowDown:[0,5]}[e.key],origin=geometry();if(offset&&origin){e.preventDefault();move(...offset,origin);}};
   zoom.oninput=()=>{draft.zoom=Number(zoom.value);draw();};
   upload.onchange=async()=>{
    const selected=upload.files?.[0];if(!selected)return;const read=++readSequence;status.textContent='';loading=true;draw();let next;
    try{if(!['image/jpeg','image/png','image/webp'].includes(selected.type)||selected.size>12*1024*1024)throw Error('Choose a JPEG, PNG or WebP image up to 12 MB.');next=URL.createObjectURL(selected);const dimensions=await decode(next);if(!current.isConnected||read!==readSequence){URL.revokeObjectURL(next);return;}if(temporary)URL.revokeObjectURL(temporary);temporary=next;draftSrc=next;draftSize=dimensions;draftFile=selected;draft={...draft,enabled:true,x:50,y:50,zoom:1};zoom.value=1;}catch(e){if(next)URL.revokeObjectURL(next);status.textContent=e.message;}finally{if(read===readSequence){loading=false;draw();}}
   };
   cancel.onclick=()=>current.close();
   save.onclick=async()=>{if(save.disabled)return;const old=src;state=normalize({...draft,enabled:true});file=draftFile;src=draftSrc;size=draftSize;restoreIssue='';temporary=null;current.close();await commit();if(old&&old!==src)URL.revokeObjectURL(old);};
   remove.onclick=async()=>{if(loading)return;state.enabled=false;current.close();await commit();};
   current.addEventListener('close',()=>{if(temporary)URL.revokeObjectURL(temporary);current.remove();focusControl();},{once:true});
   (host.closest('dialog[open]')||document.body).append(current);draw();current.showModal();
  }
  host.addEventListener('click',event=>{if(!event.target.closest('[data-portrait-action]'))return;event.preventDefault();event.stopImmediatePropagation();open();},true);
  return {model,error,mount,snapshot:()=>({...normalize(state),hasOriginal:!!file}),file:()=>file,restore,async reset(){await restore(null,null);},jobChanged(){state.enabled=false;},open};
 }
 const api={normalize,effectiveShape,requirements,frame,decode,create};if(typeof module==='object'&&module.exports)module.exports=api;else root.DraftedCvPortrait=api;
})(typeof window==='object'?window:globalThis);
