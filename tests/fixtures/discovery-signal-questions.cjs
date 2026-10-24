'use strict';
// Deterministic conversion of synthetic fixtures only; never repairs real output.
const base=require('./discovery-assessments.cjs'),old=require('../../backend/discovery-plan-assessments.cjs'),format=require('../../backend/discovery-signal-questions-proposal.cjs').FORMAT;
function model(data){
 if(data.request.operation!=='plan')return base.model(data);
 const raw=base.model({...data,input:{...data.input,modelFormat:old.FORMAT}}),owners=new Map(),assessments={};
 for(const [id,a] of Object.entries(raw.assessments)){
  if(a.kind!=='question'){assessments[id]=a;continue;}
  if(owners.has(a.topicKey))assessments[id]={kind:'same_question',questionSignalId:owners.get(a.topicKey)};
  else{owners.set(a.topicKey,id);assessments[id]={kind:'question',question:raw.topics.find(t=>t.key===a.topicKey).question};}
 }
 return {modelFormat:format,requestId:raw.requestId,contextRevision:raw.contextRevision,assessments};
}
module.exports={model};
