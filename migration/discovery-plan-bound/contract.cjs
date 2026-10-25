'use strict';
// Plan-only portable factory: this exact source is embedded in both n8n Code nodes.
function create(inline, publicContract) {
 const PROFILE='discovery-plan-bound-1';
 const clone=v=>JSON.parse(JSON.stringify(v));
 const stable=v=>JSON.stringify(v===null||typeof v!=='object'?v:Array.isArray(v)?v.map(x=>JSON.parse(stable(x))):Object.fromEntries(Object.keys(v).sort().map(k=>[k,JSON.parse(stable(v[k]))])));
 function fail(code,path='$.assessments'){const e=Error(code);e.signalQuestionCode=code.startsWith('STALE')?'STALE_SIGNAL_QUESTIONS':'INVALID_SIGNAL_QUESTION';e.signalQuestionPath=path;throw e;}
 function validated(request){const r=clone(request);publicContract.validateRequest(r);if(r.operation!=='plan')fail('PLAN_ONLY');return r;}
 function schema(catalog){
  const object=properties=>({type:'object',properties,required:Object.keys(properties),additionalProperties:false});
  const string={type:'string',pattern:'\\S'};
  const variants=[object({kind:{type:'string',enum:['question']},question:string})];
  if(catalog.evidence.length)variants.push(object({kind:{type:'string',enum:['cv_supported']},evidenceIds:{type:'array',minItems:1,maxItems:100,items:{type:'string',enum:catalog.evidence.map(e=>e.id)}},explanation:string}));
  variants.push(object({kind:{type:'string',enum:['not_actionable']},reason:{type:'string',enum:['not_experience_requirement','too_unspecific_to_form_question']},explanation:string}));
  return {...object({assessments:object(Object.fromEntries(catalog.signals.map(s=>[s.id,{$ref:'#/$defs/assessment'}])))}),$defs:{assessment:{anyOf:variants}}};
 }
 function prepare(request,executionId){
  if(typeof executionId!=='string'||!executionId)fail('MISSING_EXECUTION_BINDING');
  const r=validated(request),catalog=inline.input(r);
  delete catalog.modelFormat;delete catalog.requestId;delete catalog.contextRevision;
  const messages=inline.prompts(r);
  const instruction=inline.instruction.replace('Return modelFormat, requestId, contextRevision and one assessment per exact signal ID.','Return only {assessments:{SIGNAL_ID:ASSESSMENT}}, with one assessment per exact signal ID. Backend supplies all request identity, revisions and format metadata; never return these.');
  if(!messages[0].content.includes(inline.instruction))fail('PROMPT_BASE_CHANGED');
  messages[0].content=messages[0].content.replace(inline.instruction,()=>instruction);
  messages[1].content=JSON.stringify(catalog);
  // Native n8n's summary:"none" is an editor sentinel, not an API enum value.
  // Omit summary on the direct API request to preserve disabled summaries.
  return {profile:PROFILE,executionId,request:r,apiRequest:{model:'gpt-6-luna',input:messages,reasoning:{effort:'low'},service_tier:'default',max_output_tokens:3000,store:false,text:{format:{type:'json_schema',name:'drafted_discovery_plan_bound_1',strict:true,schema:schema(catalog)}}}};
 }
 function review(binding,raw,request,executionId){
  const r=validated(request);
  if(!binding||binding.profile!==PROFILE||binding.executionId!==executionId||stable(binding.request)!==stable(r))fail('STALE_EXECUTION_BINDING');
  if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).length!==1||!Object.hasOwn(raw,'assessments'))fail('INVALID_BOUND_PLAN_ROOT');
  return inline.review(r,{modelFormat:inline.FORMAT,requestId:r.requestId,contextRevision:r.contextRevision,assessments:raw.assessments});
 }
 return {PROFILE,prepare,review,schema};
}
module.exports={create};
