(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./tailor-sources.js'));else root.DraftedTailorSourceClient=factory(root.DraftedTailorSources);})(globalThis,function(sources){
  'use strict';
  const backendCodes=new Set(['INVALID_SOURCE_OUTPUT','INVALID_SOURCE_REQUEST','MODEL_UNAVAILABLE','INPUT_TOO_LARGE']);
  class Failure extends Error {
    constructor(code,status=null,backendCode=null){super(code);this.name='TailorSourceError';this.code=code;this.status=status;this.backendCode=backendCodes.has(backendCode)?backendCode:null;}
  }
  async function fetchSuggestion(endpoint,payload,{fetch:fetcher=globalThis.fetch,timeoutMs=90000}={}){
    try{sources.validateRequest(payload);}catch{throw new Failure('SOURCE_REQUEST_INVALID');}
    const controller=new AbortController();let timer;
    const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>{reject(new Failure('SOURCE_TIMEOUT'));controller.abort();},timeoutMs);});
    const request=(async()=>{
      let response;
      try{response=await fetcher(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:controller.signal});}
      catch{throw new Failure('SOURCE_NETWORK_FAILED');}
      let data;
      try{
        if(!(response.headers.get('content-type')||'').includes('application/json'))throw Error();
        data=await response.json();
      }catch{throw new Failure(response.ok?'SOURCE_RESPONSE_INVALID':'SOURCE_HTTP_FAILED',response.status);}
      if(!response.ok||data?.ok!==true)throw new Failure('SOURCE_HTTP_FAILED',response.status,data?.contractError?.code);
      try{sources.validateCandidate(payload,data);}catch{throw new Failure('SOURCE_RESPONSE_INVALID',response.status);}
      return data;
    })();
    try{return await Promise.race([request,timeout]);}finally{clearTimeout(timer);}
  }
  function message(error){
    if(error?.code==='SOURCE_TIMEOUT')return 'Tailoring took too long. Your CV and answers have been kept. Try again.';
    if(error?.code==='SOURCE_NETWORK_FAILED')return 'Could not reach Tailor. Your CV and answers have been kept. Check your connection and try again.';
    return 'We could not prepare a suggestion that could be checked against your answers. Your CV and answers have been kept. Try again.';
  }
  return {fetchSuggestion,message,Failure};
});
