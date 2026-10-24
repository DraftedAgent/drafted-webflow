'use strict';
// Explicit synthetic provider, never used to repair production model responses.
const f=require('./discovery-assignments.cjs'),format=require('../../backend/discovery-plan-assessments.cjs').FORMAT;
function model(data){
 if(data.request.operation!=='plan')return f.model(data);
 if(data.input.modelFormat!==format)throw Error('Assessment format required');
 const old=f.model({...data,input:{...data.input,modelFormat:'discovery-plan-assignments-1',signalTopics:Object.fromEntries(data.input.signals.map(s=>[s.id,null]))}});
 return {modelFormat:format,requestId:old.requestId,contextRevision:old.contextRevision,topics:old.topics.map(t=>({key:t.key,question:t.question})),assessments:Object.fromEntries(Object.entries(old.signalTopics).map(([id,key])=>{if(!key)throw Error('Synthetic fixture needs an explicit assessment');return [id,{kind:'question',topicKey:key}];}))};
}
module.exports={model};
