/* Explicit local-only fixture configuration. Never included in the production bundle. */
if(!['127.0.0.1','localhost'].includes(location.hostname))throw Error('Local preview only');
window.__DRAFTED_PREVIEW_ENDPOINTS__={upload:'/preview-api/upload',rewrite:'/preview-api/rewrite',chat:'/preview-api/chat',export:'/preview-api/export',jobcontext:'/preview-api/jobcontext',tailor:'/preview-api/tailor',discovery:'/webflow-experience-discovery'};
document.addEventListener('DOMContentLoaded',()=>{
  const banner=document.createElement('div');banner.className='local-preview-banner';banner.textContent='Lokal förhandsversion · Syntetiskt CV och annons · Ingen extern AI eller publicering';document.body.prepend(banner);
  const inputSection=document.querySelector('#section-input');
  const sample=document.createElement('button');sample.type='button';sample.id='load-preview-scenario';sample.textContent='Prova med syntetiskt CV och annons';sample.className='w-button';
  sample.addEventListener('click',()=>{const f=new File(['%PDF-1.4\n% Synthetic local fixture, not personal data.\n%%EOF'],'exempel-cv.pdf',{type:'application/pdf'}),dt=new DataTransfer();dt.items.add(f);const file=document.querySelector('#cv-file');file.files=dt.files;file.dispatchEvent(new Event('change',{bubbles:true}));const ad=document.querySelector('#job-ad-input');ad.value='Vi söker en produktspecialist som kan hjälpa ett team att prioritera arbetet och planera nästa leverans. Du arbetar tillsammans med utvecklare och tar reda på vad användarna behöver. Erfarenhet från föreningar och egna projekt är också relevant. Berätta gärna hur du själv har bidragit till ett konkret arbete.';ad.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('#upload-btn').click();document.querySelector('.section-editor').scrollIntoView({behavior:'smooth'});});
  inputSection.prepend(sample);
});
