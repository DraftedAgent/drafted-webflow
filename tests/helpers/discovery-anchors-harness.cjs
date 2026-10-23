'use strict';
// Actual prepared Code/graph simulation with an injected provider. No HTTP/API.
const vm=require('node:vm'),baseline=require('../fixtures/discovery-workflow.safe.json'),patch=require('../../backend/n8n-discovery-plan-anchors-candidate.cjs');
function run(code,input,request,warnings=[]){return JSON.parse(JSON.stringify(vm.runInNewContext('(function(){'+code+'\n})()',{$input:{first:()=>({json:input})},$items:()=>[{json:{request}}],TextEncoder,console:{warn:value=>warnings.push(String(value))}},{timeout:1500})[0].json));}
function modelPayload(prompt){const marker='USER:',at=prompt.indexOf(marker);if(at<0)throw Error('No user input');return JSON.parse(prompt.slice(at+marker.length).replace(/^(?:\\n|\s)+/,''));}
function createHarness({model,definition=patch.prepare(baseline),parsedOutput=false}={}){
 return async request=>{
  const warnings=[],visited=[];let current='Validate request',input={body:request};
  for(let step=0;step<8;step++){
   const node=definition.nodes.find(n=>n.name===current);visited.push(current);let branch=0;
   if(node.type==='n8n-nodes-base.code')input=run(node.parameters.jsCode,input,request,warnings);
   else if(current==='Input valid?')branch=input.ok?0:1;
   else if(current==='Discovery model'){
    const payload=modelPayload(input.promptText);try{const value=await model({input:payload,request,messages:input.promptText});input={output:[{content:[{text:parsedOutput?value:JSON.stringify(value)}]}]};}catch{input={error:{message:'synthetic provider unavailable'}};}
   }else if(current==='Respond discovery')return {status:input.httpStatus,body:input.response,diagnostic:input.diagnostic||null,warnings,visited};
   else throw Error('Unexpected graph node');
   const next=definition.connections[current]?.main[branch]?.[0];if(!next)throw Error('Missing route');current=next.node;
  }throw Error('Route did not finish');
 };
}
module.exports={run,modelPayload,createHarness,baseline};
