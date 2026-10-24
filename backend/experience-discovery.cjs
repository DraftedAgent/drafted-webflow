'use strict';
const contract=require('../webflow/src/experience-discovery-contract.js');
function createHandler({model,planFormat='quoted-1'}){
  if(typeof model!=='function')throw new Error('Explicit model provider required');
  if(!['quoted-1','anchors-1','assignments-1','assessments-1'].includes(planFormat))throw new Error('Explicit supported plan format required');
  return async request=>{
    const r=structuredClone(request);
    try{contract.validateRequest(r);}catch(e){const code=e.message==='INPUT_TOO_LARGE'?e.message:'INVALID_REQUEST';return {status:code==='INPUT_TOO_LARGE'?413:400,body:contract.error(r,code)};}
    let result;
    const anchors=r.operation==='plan'&&planFormat!=='quoted-1'?require(planFormat==='assessments-1'?'./discovery-plan-assessments.cjs':planFormat==='assignments-1'?'./discovery-plan-assignments.cjs':'./discovery-plan-anchors.cjs'):null;
    try{result=await model({operation:r.operation,messages:anchors?anchors.prompts(r):require('./n8n-discovery-reference-prompt.cjs').prompts(r),request:structuredClone(r),...(anchors?{input:anchors.modelInput(r)}:{})});}catch{return {status:503,body:contract.error(r,'MODEL_UNAVAILABLE')};}
    try{return {status:200,body:contract.modelResult(r,anchors?anchors.compile(r,typeof result==='string'?JSON.parse(result):result):result)};}catch{return {status:422,body:contract.error(r,'INVALID_MODEL_OUTPUT')};}
  };
}
module.exports={createHandler};
