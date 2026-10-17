(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./experience-discovery-contract.js'));else root.DraftedDiscoveryClient=factory(root.DraftedDiscoveryContract);})(globalThis,function(contract){
  'use strict';
  class Client {
    constructor({endpoint,fetch:fetcher=globalThis.fetch,id=()=>crypto.randomUUID(),timeoutMs=30000}){
      if(!endpoint)throw new Error('Explicit discovery endpoint required');
      this.endpoint=endpoint;this.fetch=(...args)=>fetcher(...args);this.id=id;this.timeoutMs=timeoutMs;
    }
    async call(request){
      contract.validateRequest(request);
      const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),this.timeoutMs);
      try{const response=await this.fetch(this.endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(request),signal:controller.signal});
        const text=await response.text();if(new TextEncoder().encode(text).length>contract.LIMIT)throw new Error('INVALID_RESPONSE');
        const body=JSON.parse(text);contract.validateResponse(request,body);
        if(!response.ok||!body.ok)throw new Error(body.contractError?.code||'INVALID_RESPONSE');return body.result;
      }finally{clearTimeout(timer);}
    }
    async plan(session,language){
      const c=session.snapshot().context;
      const request={schemaVersion:'1.0',operation:'plan',requestId:this.id(),contextRevision:c.revision,conversationLanguage:language,cvVersionId:c.cvVersionId,blocksSchemaVersion:'1.0',blocks:c.blocks,jobContextSchemaVersion:'1.0',jobContext:c.jobContext};
      try{const result=await this.call(request);if(session.snapshot().context.revision!==request.contextRevision)return {stale:true};session.plan({contextRevision:request.contextRevision,topics:result.topics},language);return result;}catch(e){if(session.snapshot().context.revision!==request.contextRevision)return {stale:true};throw e;}
    }
    async submit(session,text){session.submit(text);if(session.round().phase==='confirm')return this.interpret(session);}
    async retry(session){return this.interpret(session);}
    async interpret(session){
      const token=session.token(),snap=session.snapshot(),answer=snap.answers.find(a=>a.id===token.answerId);
      const c=snap.context,r=snap.round;
      const request={schemaVersion:'1.0',operation:'interpret',requestId:this.id(),contextRevision:c.revision,conversationLanguage:r.language,cvVersionId:c.cvVersionId,blocksSchemaVersion:'1.0',blocks:c.blocks,jobContextSchemaVersion:'1.0',jobContext:c.jobContext,roundId:r.id,questionId:session.current().id,questions:r.queue.map(q=>({id:q.id,topicKey:q.topicKey,question:q.question,signalRefs:q.signalRefs})),sourceAnswer:{id:answer.id,revision:answer.currentRevision,text:answer.revisions.at(-1).text}};
      session.beginInterpret();
      const current=()=>{try{return JSON.stringify(session.token())===JSON.stringify(token);}catch{return false;}};
      try{const result=await this.call(request);if(!current())return {stale:true};session.reviewDrafts(token,result.drafts);return result;}
      catch(e){if(!current())return {stale:true};session.interpretFailed(token);throw e;}
    }
  }
  return {Client};
});
