'use strict';
// Importing this file never reads keys or makes requests. Explicit live approval only.
const P=require('./model-pilot.cjs');
function createProvider({apiKey,manifest:m,approval,fetch:fetcher=globalThis.fetch}){
 P.verify(m);P.validateApproval(m,approval);
 if(typeof apiKey!=='string'||!apiKey.trim())throw Error('EXPLICIT_EVALUATION_API_KEY_REQUIRED');
 let calls=0,reserved=0;const used=new Set();
 return async({messages,settings,signal,spec})=>{
  const match=m.runs.find(r=>r.caseId===spec.caseId&&r.profile===spec.profile&&r.repeat===spec.repeat);
  const key=spec.caseId+':'+spec.profile+':'+spec.repeat;
  if(!match||P.sha(messages)!==match.messagesSha256||P.sha(settings)!==P.sha(m.settings)||used.has(key))throw Error('PILOT_PROVIDER_BINDING_INVALID');
  const cost=P.reservation(m,approval,messages);if(calls>=72||reserved+cost>approval.maxCostUSD)throw Error('PILOT_PROVIDER_CAP');
  calls++;reserved+=cost;used.add(key);
  try{
   const response=await fetcher(m.settings.endpoint,{method:'POST',signal,headers:{Authorization:'Bearer '+apiKey,'Content-Type':'application/json'},body:JSON.stringify({model:settings.model,input:messages,temperature:settings.temperature,max_output_tokens:settings.maxOutputTokens,store:false,...(spec.operation==='tailor'?{}:{text:{format:{type:'json_object'}}})})});
   if(!response.ok)throw Error('PILOT_PROVIDER_HTTP_FAILED');const envelope=await response.json();return {envelope,usage:envelope.usage,model:envelope.model,externalAttempted:true};
  }catch{const e=Error('PILOT_PROVIDER_FAILED');e.externalAttempted=true;throw e;}

 };
}
module.exports={createProvider};
