/* Explicit local fixture configuration. No production fallback is allowed. */
(function(){
 'use strict';
 const base=location.origin;
 window.__DRAFTED_COVERAGE__=Object.freeze({enabled:true,endpoint:'/preview-api/coverage',mode:'simulated'});
 window.__DRAFTED_DICTATION__=Object.freeze({mode:'simulated',endpoint:'/preview-api/transcribe'});
 window.DraftedEnvironment?.show('simulated');
 if(!['127.0.0.1','localhost','[::1]'].includes(location.hostname))throw Error('This build is for local verification only.');
 const nativeFetch=window.fetch.bind(window);
 window.fetch=(input,options)=>{
  const target=new URL(input instanceof Request?input.url:input,location.href);
  if(target.origin!==base)return Promise.reject(new Error('External requests are disabled in this local build.'));
  return nativeFetch(input,options);
 };
 window.__DRAFTED_PREVIEW_ENDPOINTS__={upload:'/preview-api/upload',rewrite:'/preview-api/rewrite',chat:'/preview-api/chat',export:'/preview-api/export',jobcontext:'/preview-api/jobcontext',tailor:'/preview-api/tailor',discovery:'/webflow-experience-discovery',tailorSources:true,tailorSourcesVersion:'1.5'};
})();
