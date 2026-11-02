/* Shared request client + recoverable, generation-bound coverage lifecycle. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./cv-coverage-contract.js'));else root.DraftedCoverage=factory(root.DraftedCoverageContract);})(globalThis,function(C){
 'use strict';const copy=x=>JSON.parse(JSON.stringify(x));
 class Client{
  constructor({endpoint,fetch:send=globalThis.fetch,timeoutMs=90000}){if(!endpoint)throw Error('EXPLICIT_COVERAGE_ENDPOINT_REQUIRED');this.endpoint=endpoint;this.send=send;this.timeoutMs=timeoutMs;}
  async call(r,signal){await C.validateRequest(r);const abort=new AbortController(),cancel=()=>abort.abort(),timer=setTimeout(cancel,this.timeoutMs);signal?.addEventListener('abort',cancel,{once:true});if(signal?.aborted)cancel();try{const response=await this.send(this.endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(r),signal:abort.signal}),text=await response.text();if(new TextEncoder().encode(text).length>C.LIMIT)throw Error('INVALID_COVERAGE_RESPONSE');const data=JSON.parse(text);if(!response.ok||data.ok!==true)throw Error('COVERAGE_REQUEST_FAILED');if(Object.keys(data).sort().join(',')!=='coverageSchemaVersion,ok,operation,requestId,result'||data.coverageSchemaVersion!==C.VERSION||data.operation!==r.operation||data.requestId!==r.requestId)throw Error('INVALID_COVERAGE_RESPONSE');return await C.validateResult(r,data.result);}finally{clearTimeout(timer);signal?.removeEventListener('abort',cancel);}}
 }
 class Session{
  constructor({client,enabled=true,changed=()=>{}}){this.client=client;this.enabled=enabled;this.changed=changed;this.status='idle';this.catalog=null;this.resultCatalog=null;this.result=null;this.signature='';this.input=null;this.generation=0;this.controller=null;this.restoreBlocked=false;}
  fresh(){return this.status==='ready'&&!!this.result&&this.signature===C.canonical(this.input);}
  emit(){this.changed();}
  invalidate(input){const signature=C.canonical(input);if(signature===this.signature)return false;this.generation++;this.controller?.abort();this.controller=null;this.input=copy(input);this.signature=signature;this.restoreBlocked=false;this.status=this.result?'stale':'idle';this.emit();return true;}
  async run(input=this.input){
   if(!input||!input.cvVersionId||!input.blocks?.length||!input.jobContext||!input.jobText?.trim()){this.status=this.result?'stale':'idle';this.emit();return;}
   if(!this.enabled){this.status='unavailable';this.emit();return;}if(this.status==='loading'&&this.signature===C.canonical(input))return;
   this.invalidate(input);const generation=++this.generation,signature=this.signature,controller=new AbortController();this.controller?.abort();this.controller=controller;this.status='loading';this.emit();const current=()=>generation===this.generation&&signature===this.signature;
   try{const common={coverageSchemaVersion:C.VERSION,jobText:input.jobText,jobContext:input.jobContext},jobRef=await C.jobRef(input.jobText,input.jobContext);let catalog=this.catalog;
    if(!catalog||C.canonical(catalog.jobRef)!==C.canonical(jobRef))catalog=await this.client.call({...common,operation:'anchorSignals',requestId:crypto.randomUUID()},controller.signal);
    if(!current())return;this.catalog=catalog;const request={...common,operation:'assessCoverage',requestId:crypto.randomUUID(),cvVersionId:input.cvVersionId,blocks:input.blocks,catalog,inputRef:await C.inputRef(input.cvVersionId,input.blocks,catalog)};
    const result=await this.client.call(request,controller.signal);if(!current())return;this.result=result;this.resultCatalog=catalog;this.status='ready';this.restoreBlocked=false;this.emit();
   }catch{if(current()){this.status='error';this.emit();}}finally{if(current())this.controller=null;}
  }
  snapshot(){return copy({schemaVersion:C.VERSION,status:this.status,catalog:this.catalog,resultCatalog:this.resultCatalog,result:this.result});}
  async restore(saved,input){this.generation++;this.controller?.abort();this.input=copy(input);this.signature=C.canonical(input);this.status='idle';this.restoreBlocked=!!saved;this.catalog=null;this.resultCatalog=null;this.result=null;
   if(!saved){this.signature='';this.emit();return;}if(saved.schemaVersion!==C.VERSION){this.status=this.enabled?'error':'unavailable';this.emit();return;}try{
    if(!input?.jobContext||!input?.cvVersionId||!input.blocks?.length)throw Error('NO_INPUT');const catalog=saved.resultCatalog||saved.catalog;await C.validateCatalog(input.jobText,input.jobContext,catalog);this.catalog=catalog;this.resultCatalog=catalog;
    const request={operation:'assessCoverage',inputRef:await C.inputRef(input.cvVersionId,input.blocks,this.catalog),catalog:this.catalog,blocks:input.blocks};await C.validateResult(request,saved.result);this.result=copy(saved.result);this.status=saved.status==='ready'?'ready':'error';this.restoreBlocked=this.status!=='ready';
   }catch{this.catalog=null;this.resultCatalog=null;this.result=null;this.status=this.enabled?'error':'unavailable';}this.emit();
  }
 }
 return {Client,Session};
});
