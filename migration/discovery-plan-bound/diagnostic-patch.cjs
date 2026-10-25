'use strict';
const describe=require('./signal-shape.cjs').describe;
function once(text,before,after){if(text.split(before).length!==2)throw Error('SHAPE_DIAGNOSTIC_BASE_CHANGED');return text.replace(before,()=>after);}
function validator(source){
 let out=once(source,"const FORMAT='discovery-inline-questions-1';","const FORMAT='discovery-inline-questions-1';\nconst describeAssessmentShape="+describe.toString()+";\nfunction rejectAssessmentSet(ids,assessments){try{fail('INCOMPLETE_INLINE_ASSESSMENTS');}catch(error){error.assessmentShape=describeAssessmentShape(ids,assessments);throw error;}}\n");
 // Match only the existing set/type failure call, not another validation rule.
 out=once(out,"ids.some(id=>!Object.hasOwn(raw.assessments,id)))fail('INCOMPLETE_INLINE_ASSESSMENTS');","ids.some(id=>!Object.hasOwn(raw.assessments,id)))rejectAssessmentSet(ids,raw.assessments);");
 return once(out,"return {event:'discovery_model_rejected',version:1,reason,path};","return {event:'discovery_model_rejected',version:1,reason,path,...(reason==='INCOMPLETE_INLINE_ASSESSMENTS'?{assessmentShape:error.assessmentShape}:{})};");
}
function response(node){
 const out=JSON.parse(JSON.stringify(node)),entries=out.parameters.options.responseHeaders.entries;
 if(entries.some(h=>h.name==='X-Drafted-Assessment-Shape'))throw Error('SHAPE_HEADER_ALREADY_PRESENT');
 entries.push({name:'X-Drafted-Assessment-Shape',value:'={{ JSON.stringify($json.diagnostic?.assessmentShape || null) }}'});
 return out;
}
module.exports={validator,response};
