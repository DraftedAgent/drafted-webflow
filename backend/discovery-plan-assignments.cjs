'use strict';
// DEV-092 owner-approved single signal ownership.
const anchors=require('./discovery-plan-anchors.cjs');
const FORMAT='discovery-plan-assignments-1';
function fail(code='INVALID_SIGNAL_ASSIGNMENTS'){const e=Error(code);e.assignmentCode=code;throw e;}
function exact(value,keys){if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length!==keys.length||keys.some(k=>!Object.hasOwn(value,k)))fail();}
function modelInput(request){const input=anchors.modelInput(request);return {...input,modelFormat:FORMAT,signalTopics:Object.fromEntries(input.signals.map(s=>[s.id,null]))};}
function compile(request,raw){
 const input=modelInput(request);exact(raw,['modelFormat','requestId','contextRevision','topics','signalTopics']);
 if(raw.modelFormat!==FORMAT||raw.requestId!==request.requestId||raw.contextRevision!==request.contextRevision)fail('STALE_ASSIGNMENT_PLAN');
 if(!Array.isArray(raw.topics)||raw.topics.length>20)fail();
 exact(raw.signalTopics,input.signals.map(s=>s.id));
 const keys=new Set(),topics=raw.topics.map(t=>{
  exact(t,['key','question','support','evidenceIds']);if(typeof t.key!=='string'||!t.key.trim()||keys.has(t.key))fail('INVALID_TOPIC_ID');keys.add(t.key);return {...t,signalIds:[]};
 });
 for(const signal of input.signals){const topicId=raw.signalTopics[signal.id];if(topicId===null)continue;
  if(typeof topicId!=='string')fail();const topic=topics.find(t=>t.key===topicId);if(!topic)fail('UNKNOWN_TOPIC_ASSIGNMENT');topic.signalIds.push(signal.id);
 }
 if(topics.some(t=>!t.signalIds.length))fail('UNASSIGNED_TOPIC');
 // Single iteration over unique catalog IDs makes cross-topic ref reuse impossible.
 // Keep the existing source compiler/public validator; do not repair v1 output.
 return anchors.compile(request,{modelFormat:anchors.FORMAT,requestId:raw.requestId,contextRevision:raw.contextRevision,topics});
}
const instruction='Return {modelFormat,requestId,contextRevision,topics:[{key,question,support,evidenceIds}],signalTopics}. Copy every supplied signalTopics key exactly once and give it one topic key or null. Never put signal IDs in topics, never assign an array of topics, and never create a signal key. Each topic must own at least one signal. Plan focused neutral questions first and allocate signals once across the whole plan; combine only truly overlapping experiences. If two different questions compete for one broad signal, resolve the plan before returning; do not duplicate the assignment, silently omit a question or join unrelated experiences. Evidence/source and factual limits remain unchanged.';
function prompts(request){
 const messages=anchors.prompts(request);if(request.operation!=='plan')return messages;
 const preserved=anchors.instruction.slice(anchors.instruction.indexOf(' Group only'));
 messages[0].content=messages[0].content.replace(anchors.instruction,instruction+' Copy the supplied format/request/context identifiers. Select evidenceIds only from the supplied evidence catalog; never emit indices, quotes or block IDs.'+preserved);
 messages[1].content=JSON.stringify(modelInput(request));return messages;
}
function diagnostic(e){return ['INVALID_SIGNAL_ASSIGNMENTS','STALE_ASSIGNMENT_PLAN','INVALID_TOPIC_ID','UNKNOWN_TOPIC_ASSIGNMENT','UNASSIGNED_TOPIC'].includes(e?.assignmentCode)?{event:'discovery_model_rejected',version:1,reason:e.assignmentCode,path:'$'}:anchors.diagnostic(e);}
module.exports={FORMAT,modelInput,compile,instruction,prompts,diagnostic};
