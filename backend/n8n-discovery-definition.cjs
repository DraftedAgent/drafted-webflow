/* Inactive definition builder. Caller supplies the inspected existing model node. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
function definition(modelNode){
  if(!modelNode?.type||!modelNode.parameters?.responses?.values)throw new Error('Inspected model configuration required');
  const library=fs.readFileSync(path.join(__dirname,'../webflow/src/experience-discovery-contract.js'),'utf8').replace("if(typeof module==='object'&&module.exports)module.exports=api;else root.DraftedDiscoveryContract=api;","root.DraftedDiscoveryContract=api;");
  const id=()=>crypto.randomUUID();
  const code=(name,jsCode,position)=>({id:id(),name,type:'n8n-nodes-base.code',typeVersion:2,position,parameters:{mode:'runOnceForAllItems',jsCode:library+'\n'+jsCode}});
  const validate=code('Validate request',`const c=globalThis.DraftedDiscoveryContract;const r=$input.first().json.body;try{c.validateRequest(r);return [{json:{ok:true,request:r}}];}catch(e){const code=e.message==='INPUT_TOO_LARGE'?e.message:'INVALID_REQUEST';return [{json:{httpStatus:code==='INPUT_TOO_LARGE'?413:400,response:c.error(r,code),ok:false}}];}`,[240,0]);
  const prompt=code('Build discovery prompt',`const r=$input.first().json.request;return [{json:{promptText:globalThis.DraftedDiscoveryContract.prompts(r).map(m=>m.role.toUpperCase()+':\\n'+m.content).join('\\n\\n')}}];`,[700,-100]);
  const model={id:id(),name:'Discovery model',type:modelNode.type,typeVersion:modelNode.typeVersion,position:[940,-100],parameters:structuredClone(modelNode.parameters),credentials:structuredClone(modelNode.credentials||{}),onError:'continueRegularOutput'};
  model.parameters.responses.values=[{role:'system',content:'={{$json.promptText}}'}];
  const result=code('Validate model response',`const c=globalThis.DraftedDiscoveryContract;const r=$items('Validate request')[0].json.request;const data=$input.first().json;let response,httpStatus;try{if(data.error){response=c.error(r,'MODEL_UNAVAILABLE');httpStatus=503;}else{const raw=data.output?.[0]?.content?.[0]?.text;if(typeof raw!=='string')throw new Error();response=c.modelResult(r,raw);httpStatus=200;}}catch{response=c.error(r,'INVALID_MODEL_OUTPUT');httpStatus=422;}return [{json:{response,httpStatus}}];`,[1180,-100]);
  const gate={id:id(),name:'Input valid?',type:'n8n-nodes-base.if',typeVersion:2.2,position:[460,0],parameters:{conditions:{options:{caseSensitive:true,leftValue:'',typeValidation:'strict',version:2},conditions:[{id:id(),leftValue:'={{$json.ok}}',rightValue:true,operator:{type:'boolean',operation:'true',singleValue:true}}],combinator:'and'},options:{}}};
  const respond={id:id(),name:'Respond discovery',type:'n8n-nodes-base.respondToWebhook',typeVersion:1.4,position:[1440,0],parameters:{respondWith:'json',responseBody:'={{$json.response}}',options:{responseCode:'={{$json.httpStatus}}'}}};
  const webhook={id:id(),name:'Discovery webhook',type:'n8n-nodes-base.webhook',typeVersion:2,webhookId:id(),position:[0,0],parameters:{httpMethod:'POST',path:'webflow-experience-discovery',responseMode:'responseNode',options:{}}};
  const to=name=>({node:name,type:'main',index:0});
  return {name:'Drafted Experience Discovery v1 (inactive development)',nodes:[webhook,validate,gate,prompt,model,result,respond],connections:{'Discovery webhook':{main:[[to(validate.name)]]},[validate.name]:{main:[[to(gate.name)]]},[gate.name]:{main:[[to(prompt.name)],[to(respond.name)]]},[prompt.name]:{main:[[to(model.name)]]},[model.name]:{main:[[to(result.name)]]},[result.name]:{main:[[to(respond.name)]]}},settings:{executionOrder:'v1',saveDataErrorExecution:'none',saveDataSuccessExecution:'none',saveManualExecutions:false}};
}
module.exports={definition};
