'use strict';
const contract=require('../webflow/src/experience-discovery-contract.js');
function createHandler({model}){
  if(typeof model!=='function')throw new Error('Explicit model provider required');
  return async request=>{
    const r=structuredClone(request);
    try{contract.validateRequest(r);}catch(e){const code=e.message==='INPUT_TOO_LARGE'?e.message:'INVALID_REQUEST';return {status:code==='INPUT_TOO_LARGE'?413:400,body:contract.error(r,code)};}
    let result;
    try{result=await model({operation:r.operation,messages:contract.prompts(r),request:structuredClone(r)});}catch{return {status:503,body:contract.error(r,'MODEL_UNAVAILABLE')};}
    try{return {status:200,body:contract.modelResult(r,result)};}catch{return {status:422,body:contract.error(r,'INVALID_MODEL_OUTPUT')};}
  };
}
module.exports={createHandler};
