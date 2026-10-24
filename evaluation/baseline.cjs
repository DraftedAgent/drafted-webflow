'use strict';
// Frozen current preparation/composition Code. No model/network execution here.
const H=require('../tests/helpers/model-contracts-harness.cjs'),R=require('../backend/model-contracts-runtime.cjs'),owner=require('../backend/discovery-signal-questions-proposal.cjs'),P=require('../webflow/src/experience-discovery-contract.js'),refs=require('../backend/tailor-source-references.cjs');
function node(w,name){return w.nodes.find(n=>n.name===name).parameters.jsCode;}
function prepare(operation,request,scope){
 const candidate=R.prepare(operation,request,scope);let messages,input,schema=JSON.parse(JSON.stringify(candidate.schema));
 if(operation==='tailor'){const result=H.runCode(node(H.tailorBaseline,'Validate + Normalize'),{body:request},{},scope);messages=result.llmMessages;input=JSON.parse(messages[1].content);}
 else{
  const result=H.runCode(node(H.discoveryBaseline,'Build discovery prompt'),{request},{},scope);messages=[{role:'system',content:result.promptText}];input=operation==='plan'?owner.modelInput(request):request;
  if(operation==='plan'){schema.properties={modelFormat:{type:'string',enum:[owner.FORMAT]},requestId:{type:'string',enum:[request.requestId]},contextRevision:{type:'string',enum:[request.contextRevision]},...schema.properties};schema.required=Object.keys(schema.properties);}
  else{const item=schema.properties.drafts.items;item.properties={proposedText:item.properties.proposedText,sourceQuote:{type:'string',minLength:1,maxLength:50000},coveredQuestionIds:{type:'array',maxItems:100,items:{type:'string',enum:request.questions.map(q=>q.id)}}};item.required=Object.keys(item.properties);}
 }
 return {...candidate,profile:operation+'-baseline',messages,input,schema};
}
function assess(binding,raw){let shapeValid=false;try{R.validate(raw,binding.schema);shapeValid=true;if(binding.operation==='plan')owner.review(binding.request,raw);else if(binding.operation==='interpret')P.modelResult(binding.request,raw);else refs.compile(binding.request,raw,binding.scope);return {shapeValid:true,referencesValid:true,reason:null,path:null};}catch(e){const d=R.diagnostic(binding.operation,binding.request.requestId,422,e,'INVALID_MODEL_OUTPUT');return {shapeValid,referencesValid:false,reason:d.reason,path:d.path};}}
function compose(binding,envelope){
 const r=binding.request;
 if(binding.operation==='tailor'){
  const result=H.runCode(node(H.tailorBaseline,'Compose source suggestion'),envelope,{'Validate + Normalize':{json:{sourceRequest:r,sourceScope:binding.scope}}},binding.scope);return result.status===200?{body:result.body,outcome:outcome('tailor',result.body,r)}:{body:result.body,outcome:'technical_error',diagnostic:result.body.contractError?.code};
 }
 const result=H.runCode(node(H.discoveryBaseline,'Validate model response'),envelope,{'Validate request':{json:{request:r}}},binding.scope);return result.httpStatus===200?{body:result.response,outcome:outcome(binding.operation,result.response)}:{body:result.response,outcome:'technical_error',diagnostic:result.diagnostic?.reason};
}
function outcome(operation,body,request){if(operation==='plan')return body.result.topics.length?'questions':'no_questions';if(operation==='interpret')return body.result.drafts.length?'answer_accounts':'needs_detail';return R.tailorOutcome(request,body);}
module.exports={prepare,assess,compose,outcome};
