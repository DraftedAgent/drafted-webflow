'use strict';
// Diagnostic-only patch against the deployed inline profile; no new acceptance rules.
const fs=require('node:fs');
function once(text,before,after){if(text.split(before).length!==2)throw Error('DIAGNOSTIC_BASE_CHANGED');return text.replace(before,()=>after);}
function library(){
 let text=fs.readFileSync(__dirname+'/../discovery-inline/contract.cjs','utf8').replace(/\r\n?/g,'\n');
 text=once(text,"const old=require('../../backend/discovery-signal-questions-proposal.cjs');",'const old=discoverySignalQuestions;');
 text=once(text,"function fail(code){", "function fail(code,path='$.assessments'){");
 text=once(text,"e.signalQuestionPath='$.assessments';",'e.signalQuestionPath=path;e.inlineDiagnosticReason=code;');
 text=once(text,"fail('INVALID_INLINE_PLAN');","fail('INVALID_INLINE_PLAN','$');");
 text=once(text,"fail('STALE_INLINE_PLAN');","fail('STALE_INLINE_PLAN','$');");
 text=once(text,"for(const [id,a]of Object.entries(raw.assessments)){","for(const [id,a]of Object.entries(raw.assessments)){\n  const path='$.assessments.'+id;");
 text=once(text,"if(!a||typeof a!=='object'||Array.isArray(a))fail('INVALID_INLINE_ASSESSMENT');","if(!a||typeof a!=='object'||Array.isArray(a))fail('INVALID_INLINE_ASSESSMENT',path);");
 text=once(text,"fail('LEGACY_QUESTION_REFERENCE');","fail('LEGACY_QUESTION_REFERENCE',path);");
 text=once(text,"if(Object.keys(a).length!==2||typeof a.question!=='string'||!a.question.trim()||a.question.length>500)fail('INVALID_INLINE_QUESTION');",`if(Object.keys(a).length!==2)fail('INVALID_INLINE_QUESTION_FIELDS',path);
   if(typeof a.question!=='string')fail('INVALID_INLINE_QUESTION_TYPE',path+'.question');
   if(!a.question.trim())fail('EMPTY_INLINE_QUESTION',path+'.question');
   if(a.question.length>500)fail('INLINE_QUESTION_TOO_LONG',path+'.question');`);
 text=once(text,"else fail('INVALID_INLINE_ASSESSMENT');","else fail('INVALID_INLINE_ASSESSMENT',path+'.kind');");
 const diagnostic=`function diagnostic(error){
 const allowed=['INVALID_INLINE_PLAN','INCOMPLETE_INLINE_ASSESSMENTS','INVALID_INLINE_ASSESSMENT','LEGACY_QUESTION_REFERENCE','INVALID_INLINE_QUESTION_FIELDS','INVALID_INLINE_QUESTION_TYPE','EMPTY_INLINE_QUESTION','INLINE_QUESTION_TOO_LONG','STALE_INLINE_PLAN'];
 const reason=error?.inlineDiagnosticReason,path=error?.signalQuestionPath;
 // Never serialize a model key, raw error message, input, or output. Signal IDs
 // reach this stage only after exact comparison with backend-created catalog IDs.
 if(!allowed.includes(reason)||typeof path!=='string'||!/^\\$(?:\\.assessments(?:\\.signal_(?:topPriorities|mustHave)_\\d{1,2}(?:\\.(?:question|kind))?)?)?$/.test(path))return null;
 return {event:'discovery_model_rejected',version:1,reason,path};
}
`;
 text=once(text,'module.exports={FORMAT,input,convert,review,instruction,prompts};',diagnostic+'return {FORMAT,input,convert,review,instruction,prompts,diagnostic};');
 return 'const discoveryInlineQuestions=(()=>{\n'+text+'\n})();';
}
function patch(source){
 const marker='const discoveryInlineQuestions=(()=>{',start=source.indexOf(marker),endMarker="const c=globalThis.DraftedDiscoveryContract;const r=$items('Validate request')[0].json.request;",end=source.indexOf(endMarker,start);
 if(start<0||end<0||source.indexOf(marker,start+1)>=0)throw Error('DIAGNOSTIC_NODE_BASE_CHANGED');
 const baseline=require('../../dev-system/prepared/discovery-plan-bound/baseline.safe.json').nodes.find(n=>n.name==='Validate model response').parameters.jsCode;
 if(source!==baseline)throw Error('ACTIVE_VALIDATOR_CHANGED');
 let out=source.slice(0,start)+library()+'\n'+source.slice(end);
 return once(out,'discoverySignalQuestions.diagnostic(e)||c.modelDiagnostic(e)','discoveryInlineQuestions.diagnostic(e)||discoverySignalQuestions.diagnostic(e)||c.modelDiagnostic(e)');
}
module.exports={patch};
