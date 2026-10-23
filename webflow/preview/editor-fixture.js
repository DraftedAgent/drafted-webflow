/* Explicit local-only fixture configuration. Never included in the production bundle. */
if(!['127.0.0.1','localhost'].includes(location.hostname))throw Error('Local preview only');
window.__DRAFTED_PREVIEW_ENDPOINTS__={upload:'/preview-api/upload',rewrite:'/preview-api/rewrite',chat:'/preview-api/chat',export:'/preview-api/export',jobcontext:'/preview-api/jobcontext',tailor:'/preview-api/tailor',discovery:'/webflow-experience-discovery'};
document.addEventListener('DOMContentLoaded',()=>{
  const banner=document.createElement('div');banner.className='local-preview-banner';banner.style.cssText='top:auto;bottom:0;left:auto;right:8px;width:auto;padding:2px 6px;font-size:10px;pointer-events:none';banner.textContent='Local preview · Synthetic CV and job ad · No external AI or publishing';document.body.prepend(banner);
  const inputSection=document.querySelector('#section-input');
  const sample=document.createElement('button');sample.type='button';sample.id='load-preview-scenario';sample.textContent='Try a synthetic CV and job ad';sample.className='w-button';sample.style.cssText='position:absolute;left:8px;top:8px;z-index:10;padding:6px 10px;font-size:12px';inputSection.style.position='relative';
  sample.addEventListener('click',()=>{const f=new File([DraftedSyntheticPdf.create()],'synthetic-original-cv.pdf',{type:'application/pdf'}),dt=new DataTransfer();dt.items.add(f);const file=document.querySelector('#cv-file');file.files=dt.files;file.dispatchEvent(new Event('change',{bubbles:true}));const ad=document.querySelector('#job-ad-input');ad.value='We are looking for a product specialist who can help a team prioritize work and plan the next delivery. You work with developers and learn what users need. Experience from volunteering and personal projects is also relevant. Tell us how you contributed to a specific piece of work.';ad.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('#upload-btn').click();document.querySelector('.section-editor').scrollIntoView({behavior:'smooth'});});
  inputSection.prepend(sample);
  // Explicit synthetic demonstration URL; run after the editor's ready handlers.
  const params=new URLSearchParams(location.search);
  if(params.get('sample')==='1')requestAnimationFrame(()=>sample.click());
  if(params.get('source')==='1')requestAnimationFrame(()=>{
    const dt=new DataTransfer();dt.items.add(new File([DraftedSyntheticPdf.create()],'synthetic-original-cv.pdf',{type:'application/pdf'}));
    const input=document.querySelector('#cv-file');input.files=dt.files;input.dispatchEvent(new Event('change',{bubbles:true}));inputSection.scrollIntoView({behavior:'instant'});
  });
});
