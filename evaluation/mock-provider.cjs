'use strict';
// Plumbing check only: deliberately bounded rules, NOT model evaluation.
const H=require('../tests/helpers/model-contracts-harness.cjs'),F=require('../tests/fixtures/model-contracts.cjs');
async function provider({binding,material}){
 let raw;
 if(binding.operation==='plan'){
  raw={assessments:Object.fromEntries(binding.input.signals.map(s=>[s.id,{kind:'question',question:'Have you helped with '+s.text+'?'}]))};
  if(binding.profile.endsWith('baseline'))Object.assign(raw,{modelFormat:require('../backend/discovery-signal-questions-proposal.cjs').FORMAT,requestId:material.request.requestId,contextRevision:material.request.contextRevision});
 }else if(binding.operation==='interpret'){
  raw={drafts:material.id.includes('vague')||material.id.includes('uncertain')?[]:[{proposedText:material.request.sourceAnswer.text,...(binding.profile.endsWith('baseline')?{sourceQuote:material.request.sourceAnswer.text,coveredQuestionIds:[]}:{coveredQuestionKeys:[]})}]};
 }else raw=F.model({operation:'tailor',input:binding.input});
 return {envelope:H.envelope(raw),usage:null,model:null};
}
provider.synthetic=true;module.exports=provider;
