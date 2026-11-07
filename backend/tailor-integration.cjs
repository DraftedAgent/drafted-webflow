"use strict";
const P=require('../webflow/src/tailor-sources-v15.js');
function createHandler({model,scope=()=>crypto.randomUUID()}){return async r=>{try{await P.validateRequest(r);}catch(e){return fail(400,'INVALID_SOURCE_REQUEST');}const id=scope();let raw;try{raw=await model(P.makeCatalog(r,id),r.sourcesSchemaVersion==='1.5'?P.prompt15:r.sourcesSchemaVersion==='1.4'?P.prompt14:P.prompt13);}catch{return fail(503,'MODEL_UNAVAILABLE');}try{const body=await P.candidate(r,raw,{scope:id});await P.validateCandidate(r,body);return {status:200,body};}catch{return fail(422,'INVALID_SOURCE_OUTPUT');}};}
function fail(status,code){return {status,body:{ok:false,contractError:{code,message:'Your CV and original answers are kept.'}}};}
module.exports={createHandler};
