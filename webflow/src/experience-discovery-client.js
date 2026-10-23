(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./experience-discovery-contract.js'));else root.DraftedDiscoveryClient=factory(root.DraftedDiscoveryContract);})(globalThis,function(contract){
  'use strict';
  class Client {
    constructor({endpoint,fetch:fetcher=globalThis.fetch,id=()=>crypto.randomUUID(),timeoutMs=30000,background=false}){
      if(!endpoint)throw new Error('Explicit discovery endpoint required');
      this.endpoint=endpoint;this.fetch=(...args)=>fetcher(...args);this.id=id;this.timeoutMs=timeoutMs;this.background=background;this.inflight=new Map();
    }
    async call(request,{signal}={}){
      contract.validateRequest(request);
      const controller=new AbortController(),abort=()=>controller.abort(),timer=setTimeout(abort,this.timeoutMs);
      if(signal?.aborted)abort();else signal?.addEventListener('abort',abort,{once:true});
      try{const response=await this.fetch(this.endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(request),signal:controller.signal});
        const text=await response.text();if(new TextEncoder().encode(text).length>contract.LIMIT)throw new Error('INVALID_RESPONSE');
        const body=JSON.parse(text);contract.validateResponse(request,body);
        if(!response.ok||!body.ok)throw new Error(body.contractError?.code||'INVALID_RESPONSE');return body.result;
      }finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);}
    }
    async plan(session,language,{signal}={}){
      const c=session.snapshot().context;
      const request={schemaVersion:'1.0',operation:'plan',requestId:this.id(),contextRevision:c.revision,conversationLanguage:language,cvVersionId:c.cvVersionId,blocksSchemaVersion:'1.0',blocks:c.blocks,jobContextSchemaVersion:'1.0',jobContext:c.jobContext};
      try{const result=await this.call(request,{signal});if(session.snapshot().context.revision!==request.contextRevision)return {stale:true};session.plan({contextRevision:request.contextRevision,topics:result.topics},language);return result;}catch(e){if(session.snapshot().context.revision!==request.contextRevision)return {stale:true};throw e;}
    }
    submit(session,text){session.submit(text,{defer:true});if(session.round().phase==='ready')return this.interpret(session);}
    retry(session,answerId){const answer=answerId&&session.snapshot().answers.find(a=>a.id===answerId);return this.interpret(session,answer?session.token(answer.questionId):session.token());}
    interpret(session,token=session.token()){
      const key=JSON.stringify(token);if(this.inflight.has(key))return this.inflight.get(key);
      const work=this.runInterpret(session,token).finally(()=>this.inflight.delete(key));this.inflight.set(key,work);return work;
    }
    async runInterpret(session,token){
      const snap=session.snapshot(),answer=snap.answers.find(a=>a.id===token.answerId);
      const c=snap.context,r=snap.round;
      const request={schemaVersion:'1.0',operation:'interpret',requestId:this.id(),contextRevision:c.revision,conversationLanguage:r.language,cvVersionId:c.cvVersionId,blocksSchemaVersion:'1.0',blocks:c.blocks,jobContextSchemaVersion:'1.0',jobContext:c.jobContext,roundId:r.id,questionId:answer.questionId,questions:session.allQuestions().map(q=>({id:q.id,topicKey:q.topicKey,question:q.question,signalRefs:q.signalRefs})),sourceAnswer:{id:answer.id,revision:answer.currentRevision,text:answer.revisions.at(-1).text}};
      session.beginInterpret(token,{background:this.background});
      const current=()=>{try{if(this.background){session.answerForToken(token);return true;}return JSON.stringify(session.token())===JSON.stringify(token);}catch{return false;}};
      try{const result=await this.call(request);if(!current())return {stale:true};session.reviewDrafts(token,result.drafts,{background:this.background});return result;}
      catch(e){if(!current())return {stale:true};session.interpretFailed(token,{background:this.background});throw e;}
    }
  }
  return {Client};
});
