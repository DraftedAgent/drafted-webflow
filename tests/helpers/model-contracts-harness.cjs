'use strict';
const vm=require('node:vm'),adapter=require('../../backend/n8n-model-contracts-candidate.cjs');
const discoveryBaseline=require('./discovery-signal-questions-harness.cjs').definition,tailorBaseline=require('./tailor-context-recovery-harness.cjs').definition();
function definition(kind){return kind==='discovery'?adapter.patchDiscovery(discoveryBaseline):adapter.patchTailor(tailorBaseline);}
function envelope(raw){return {status:'completed',incomplete_details:null,output:[{type:'message',role:'assistant',status:'completed',content:[{type:'output_text',text:typeof raw==='string'?raw:JSON.stringify(raw)}]}]};}
function evaluate(code,context){return vm.runInNewContext(code,context,{timeout:3000});}
function runCode(code,input,nodes,scope){return JSON.parse(JSON.stringify(evaluate('(function(){'+code+'\n})()',{$input:{first:()=>({json:input}),all:()=>[{json:input}]},$items:name=>[{json:nodes[name]?.json}],$node:nodes,$execution:{id:scope},TextEncoder,Date,console:{warn:()=>{}}})[0].json));}
function createHarness({kind='discovery',definition:prepared=definition(kind),model,rawEnvelope=false}={}){
 let serial=0;
 return async request=>{
  const scope='synthetic_'+(++serial),nodes={},visited=[];let name=kind==='discovery'?'Validate request':'Validate + Normalize',input={body:request};
  for(let i=0;i<20;i++){
   const n=prepared.nodes.find(n=>n.name===name);if(!n)throw Error('Missing prepared node');visited.push(name);let branch=0;
   if(n.type==='n8n-nodes-base.code')input=runCode(n.parameters.jsCode,input,nodes,scope);
   else if(n.type==='n8n-nodes-base.if'){const expression=n.parameters.conditions.conditions[0].leftValue.slice(3,-2);branch=evaluate(expression,{$json:input})?0:1;}
   else if(['Discovery model','Tailor sources model'].includes(name)){
    const messages=n.parameters.responses.values.map(m=>({role:m.role||'user',content:evaluate(m.content.slice(3,-2),{$json:input})}));
    try{const raw=await model({request,input:JSON.parse(messages[1].content),messages,scope,operation:kind==='tailor'?'tailor':request.operation,parameters:n.parameters});input=rawEnvelope?raw:envelope(raw);}catch{input={error:{message:'synthetic provider failure'}};}
   }else if(n.type==='n8n-nodes-base.respondToWebhook'){
    const headers=Object.fromEntries((n.parameters.options?.responseHeaders?.entries||[]).map(e=>[e.name.toLowerCase(),e.value.startsWith('={{')?String(evaluate(e.value.slice(3,-2),{$json:input})):e.value]));
    return {status:input.httpStatus||input.status,body:input.response||input.body,headers,diagnostic:input.diagnostic||null,visited};
   }else throw Error('Unexpected prepared path');
   nodes[name]={json:input};const edge=prepared.connections[name]?.main[branch]?.[0];if(!edge)throw Error('Missing prepared edge');name=edge.node;
  }throw Error('Prepared route did not finish');
 };
}
module.exports={definition,createHarness,envelope,discoveryBaseline,tailorBaseline,runCode};
