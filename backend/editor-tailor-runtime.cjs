'use strict';
// Shared production/local handlers. No credentials, HTTP client or simulation.
const source=require('./tailor-integration.cjs');
const selection=require('./cv-selection.cjs');
const revision=require('./tailor-section-revision.cjs');
function kind(request){return request?.schema==='selection-1'?'selection':request?.schema==='1.0'&&request.request&&request.candidate?'revision':request?.sourcesSchemaVersion==='1.5'?'source':null;}
function handler(request,model,scope){
 const operation=kind(request);
 if(operation==='source')return source.createHandler({model:(catalog,prompt)=>model({input:catalog,prompt}),scope:()=>scope});
 if(operation==='selection')return selection.createHandler({model});
 if(operation==='revision')return revision.createHandler({model:input=>{const {prompt,...catalog}=input;return model({prompt,input:catalog});}});
 throw Error('UNSUPPORTED_OPERATION');
}
async function prepare(request,scope){
 let descriptor;
 const result=await handler(request,input=>{descriptor=input;throw Error('PREPARE_ONLY');},scope)(request);
 if(!descriptor)return result;
 return {status:200,messages:[{role:'system',content:descriptor.prompt+' Return JSON only.'},{role:'user',content:JSON.stringify(descriptor.input)}]};
}
function complete(request,output,scope){return handler(request,()=>output,scope)(request);}
module.exports={kind,prepare,complete};
