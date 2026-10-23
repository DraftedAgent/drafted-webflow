'use strict';
// Local simulation of prepared routing/Code snippets, NOT the n8n engine.
const vm=require('node:vm');
const adapter=require('../../backend/n8n-tailor-sources-candidate.cjs');
const baseline=require('../fixtures/tailor-workflow.safe.json');
function runCode(code,input,nodes={},execution='synthetic_1'){
 const value=vm.runInNewContext('(function(){'+code+'\n})()',{$input:{first:()=>({json:input}),all:()=>[{json:input}]},$json:input,$node:nodes,$execution:{id:execution},Date},{timeout:1500});
 return JSON.parse(JSON.stringify(Array.isArray(value)?value[0].json:value.json));
}
function createHarness({model,definition=adapter.prepare(baseline)}={}){
 let count=0;
 return async request=>{
  const nodes={},visited=[];let current='Validate + Normalize',input={body:request};
  for(let step=0;step<12;step++){
   const node=definition.nodes.find(n=>n.name===current);if(!node)throw Error('Missing node: '+current);visited.push(current);let branch=0;
   if(node.type==='n8n-nodes-base.code')input=runCode(node.parameters.jsCode,input,nodes,'synthetic_'+(++count));
   else if(node.type==='n8n-nodes-base.if'){
    const expression=node.parameters.conditions.conditions[0].leftValue.slice(3,-2);
    branch=vm.runInNewContext(expression,{$json:input},{timeout:100})?0:1;
   }else if(current==='Tailor sources model'){
    // Evaluate exactly the request expressions configured on the new node.
    const messages=node.parameters.responses.values.map(v=>({role:v.role||'user',content:vm.runInNewContext(v.content.slice(3,-2),{$json:input},{timeout:100})}));
    try{input=await model(JSON.parse(messages[1].content),messages,node.parameters);}catch{input={error:{message:'synthetic failure'}};}
   }else if(current==='Respond with source suggestion')return {...input,visited};
   else throw Error('Not a source-only path: '+current);
   nodes[current]={json:input};const edge=definition.connections[current]?.main[branch]?.[0];if(!edge)throw Error('Missing route');current=edge.node;
  }throw Error('Routing did not terminate');
 };
}
function response(output){return {status:'completed',incomplete_details:null,output:[{type:'message',role:'assistant',status:'completed',content:[{type:'output_text',text:JSON.stringify(output)}]}]};}
module.exports={createHarness,runCode,response,baseline};
