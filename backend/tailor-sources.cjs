'use strict';
const profile=require('../webflow/src/tailor-sources.js');
// Injected provider only. No credentials, external API client, fallback or retries.
function createHandler({model}){
 return async request=>{
  try{profile.validateRequest(request);}catch(e){return failure(e.message==='INPUT_TOO_LARGE'?413:400,e.message==='INPUT_TOO_LARGE'?'INPUT_TOO_LARGE':'INVALID_SOURCE_REQUEST');}
  let output;try{output=await model(profile.modelInput(request),profile.prompt);}catch{return failure(503,'MODEL_UNAVAILABLE');}
  try{const data=profile.candidate(request,output);profile.validateCandidate(request,data);return {status:200,body:data};}catch{return failure(422,'INVALID_SOURCE_OUTPUT');}
 };
}
function failure(status,code){return {status,body:{ok:false,blocksSchemaVersion:'1.0',cvVersionId:null,cvTitle:'',summaryOfChanges:'',blocks:[],rewrittenCv:'',rewrittenCvLegacy:'',contractError:{code,message:'A safe answer-based suggestion could not be prepared. Your CV has not changed.'}}};}
module.exports={createHandler};
