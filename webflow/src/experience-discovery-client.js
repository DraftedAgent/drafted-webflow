(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./experience-discovery-contract.js'),require('./model-diagnostics.js'));else root.DraftedDiscoveryClient=factory(root.DraftedDiscoveryContract,root.DraftedModelDiagnostics);})(globalThis,function(contract,D){
  'use strict';
  class Client {
    constructor({endpoint,fetch:fetcher=globalThis.fetch,id=()=>crypto.randomUUID(),timeoutMs=30000,background=false}){
      if(!endpoint)throw new Error('Explicit discovery endpoint required');
      this.endpoint=endpoint;this.fetch=(...args)=>fetcher(...args);this.id=id;this.timeoutMs=timeoutMs;this.background=background;this.inflight=new Map();this.failures=new Map();
    }
    async call(request,{signal}={}){
      try{contract.validateRequest(request);}catch{throw new D.Failure({operation:request?.operation,requestId:request?.requestId,code:'INVALID_REQUEST',reason:'INVALID_REQUEST'});}
      const controller=new AbortController();let timer,abortReject,timedOut=false;
      const aborted=new Promise((_,reject)=>abortReject=reject),abort=()=>{abortReject(new D.Failure({operation:request.operation,requestId:request.requestId,code:'DISCOVERY_ABORTED',reason:'REQUEST_ABORTED'}));controller.abort();};
      const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>{timedOut=true;reject(new D.Failure({operation:request.operation,requestId:request.requestId,code:'DISCOVERY_TIMEOUT',reason:'REQUEST_TIMEOUT'}));controller.abort();},this.timeoutMs);});
      if(signal?.aborted)abort();else signal?.addEventListener('abort',abort,{once:true});
      const work=(async()=>{
        let response;try{response=await this.fetch(this.endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(request),signal:controller.signal});}
        catch{throw new D.Failure({operation:request.operation,requestId:request.requestId,code:timedOut?'DISCOVERY_TIMEOUT':controller.signal.aborted?'DISCOVERY_ABORTED':'DISCOVERY_NETWORK_FAILED',reason:timedOut?'REQUEST_TIMEOUT':controller.signal.aborted?'REQUEST_ABORTED':'NETWORK_FAILED'});}
        let body;
        try{const text=await response.text();if(new TextEncoder().encode(text).length>contract.LIMIT)throw Error();body=JSON.parse(text);contract.validateResponse(request,body);}
        catch{throw new D.Failure(D.fromResponse(request.operation,request.requestId,response,'DISCOVERY_RESPONSE_INVALID','INVALID_RESPONSE'));}
        if(!response.ok||!body.ok){const code=['INVALID_MODEL_OUTPUT','MODEL_UNAVAILABLE','INVALID_REQUEST','INPUT_TOO_LARGE'].includes(body.contractError?.code)?body.contractError.code:'DISCOVERY_HTTP_FAILED';throw new D.Failure(D.fromResponse(request.operation,request.requestId,response,code,code));}
        return body.result;
      })();
      try{return await Promise.race([work,timeout,aborted]);}finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);}
    }
    failureFor(session,answerId){const entry=this.failures.get(answerId),s=session.snapshot(),a=s.answers.find(a=>a.id===answerId);return entry&&entry.contextRevision===s.context?.revision&&entry.revision===a?.currentRevision?entry.error:null;}
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
      this.failures.delete(token.answerId);session.beginInterpret(token,{background:this.background});
      const current=()=>{try{if(this.background){session.answerForToken(token);return true;}return JSON.stringify(session.token())===JSON.stringify(token);}catch{return false;}};
      try{const result=await this.call(request);if(!current())return {stale:true};session.reviewDrafts(token,result.drafts,{background:this.background});return result;}
      catch(e){if(!current())return {stale:true};this.failures.set(token.answerId,{contextRevision:token.contextRevision,revision:token.answerRevision,error:e});session.interpretFailed(token,{background:this.background});throw e;}
    }
  }
  return {Client};
});
