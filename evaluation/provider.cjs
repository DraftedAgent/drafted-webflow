'use strict';
// Only the runner may start a bound session. Creating/importing a provider does no I/O.
const P=require('./model-pilot.cjs'),L=require('./run-ledger.cjs'),sessions=new WeakMap();
function slot(spec){return spec.caseId+':'+spec.profile+':'+spec.repeat;}
function createProvider({apiKey,manifest:m,approval:a,fetch:fetcher=globalThis.fetch}){
 m=P.verify(m);P.validateApproval(m,a);const approval=JSON.parse(JSON.stringify(a)),approvalSha256=P.sha(approval);
 if(typeof apiKey!=='string'||!apiKey.trim())throw Error('EXPLICIT_EVALUATION_API_KEY_REQUIRED');
 const session={m,approval,approvalSha256,ledger:null,busy:false,actualModel:null};
 const provider=async({messages,settings,signal,spec})=>{
  if(!session.ledger)throw Error('PILOT_RUN_NOT_STARTED');
  if(session.busy)throw Error('PILOT_RUN_BUSY');
  const match=m.runs.find(r=>slot(r)===slot(spec));
  if(!match||P.sha(spec)!==P.sha(match)||P.sha(messages)!==match.messagesSha256||P.sha(settings)!==P.sha(m.settings))throw Error('PILOT_PROVIDER_BINDING_INVALID');
  const key=slot(spec),cost=P.reservation(m,approval,messages);session.busy=true;let reserved=false,accounted=false,attempted=false;
  try{
   if(signal?.aborted)throw Error('PILOT_INTERRUPTED');
   session.ledger.reserve(key,cost);reserved=true;attempted=true;
   const response=await fetcher(m.settings.endpoint,{method:'POST',signal,headers:{Authorization:'Bearer '+apiKey,'Content-Type':'application/json'},body:JSON.stringify({model:settings.model,input:messages,temperature:settings.temperature,service_tier:settings.serviceTier,max_output_tokens:settings.maxOutputTokens,store:false,...(spec.operation==='tailor'?{}:{text:{format:{type:'json_object'}}})})});
   if(!response.ok)throw Error('PILOT_PROVIDER_FAILED');const envelope=await response.json(),u=envelope.usage,inputBound=Buffer.byteLength(JSON.stringify(messages),'utf8')+4096;
   if(!u||!Number.isInteger(u.input_tokens)||!Number.isInteger(u.output_tokens)||u.input_tokens<0||u.input_tokens>inputBound||u.output_tokens<0||u.output_tokens>settings.maxOutputTokens)throw Error('PILOT_USAGE_INVALID');
   if(envelope.service_tier!==settings.serviceTier)throw Error('PILOT_SERVICE_TIER_CHANGED');
   const actual=(u.input_tokens*approval.inputUSDPerMillion+u.output_tokens*approval.outputUSDPerMillion)/1000000;
   session.ledger.settle(key,actual);accounted=true;
   if(typeof envelope.model!=='string'||session.actualModel&&session.actualModel!==envelope.model)throw Error('PILOT_MODEL_CHANGED');session.actualModel=envelope.model;
   return {envelope,usage:u,model:envelope.model,externalAttempted:true};
  }catch(error){
   if(reserved&&!accounted)session.ledger.settle(key,null);
   const code=['PILOT_USAGE_INVALID','PILOT_SERVICE_TIER_CHANGED','PILOT_MODEL_CHANGED','PILOT_PROVIDER_CAP','PILOT_SLOT_CONSUMED','PILOT_RUN_CLOSED','PILOT_LEDGER_WRITE_FAILED','PILOT_INTERRUPTED'].includes(error.message)?error.message:'PILOT_PROVIDER_FAILED';
   if(reserved||code==='PILOT_INTERRUPTED')finish(provider,code==='PILOT_USAGE_INVALID'?'usage_invalid':code==='PILOT_SERVICE_TIER_CHANGED'?'service_tier_changed':code==='PILOT_MODEL_CHANGED'?'model_changed':code==='PILOT_INTERRUPTED'?'interrupted':'provider_failed');
   const e=Error(code);e.externalAttempted=attempted;throw e;
  }finally{session.busy=false;}
 };
 sessions.set(provider,session);return provider;
}
function start(provider,m,a){const s=sessions.get(provider);if(!s||s.ledger||s.m.manifestSha256!==m.manifestSha256||s.approvalSha256!==P.sha(a))throw Error('PILOT_DURABLE_SESSION_REQUIRED');s.ledger=L.claim({approval:s.approval,approvalSha256:s.approvalSha256,manifestSha256:s.m.manifestSha256});}
function finish(provider,reason){const s=sessions.get(provider);return s?.ledger?.finish(reason);}
function receipt(provider){return sessions.get(provider)?.ledger?.snapshot()||null;}
module.exports={createProvider,start,finish,receipt};
