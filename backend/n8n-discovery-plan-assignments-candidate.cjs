'use strict';
const fs=require('node:fs'),path=require('node:path');
const ID='zeIzzxPwD2Y91OyD',BASE='3478b0d8-8a3e-4bc5-aa19-40e19b377066';
function library(){
 let code=fs.readFileSync(path.join(__dirname,'discovery-plan-assignments.cjs'),'utf8').replace(/\r\n?/g,'\n');
 const dependency="const anchors=require('./discovery-plan-anchors.cjs');";
 if(code.split(dependency).length!==2||code.split('module.exports=').length!==2)throw Error('ASSIGNMENT_LIBRARY_CHANGED');
 return '\nconst discoveryPlanAssignments=(()=>{\n'+code.replace(dependency,'const anchors=discoveryPlanAnchors;').replace('module.exports=','return ')+'\n})();\n';
}
function patch(code,prompt){
 const marker=prompt?'const r=$input.first().json.request;return [{json:{promptText:':"const c=globalThis.DraftedDiscoveryContract;const r=$items('Validate request')[0].json.request;";
 if(code.includes('const discoveryPlanAssignments=')||code.split(marker).length!==2)throw Error('DISCOVERY_CODE_CHANGED');
 let tail=code.slice(code.indexOf(marker));
 for(const method of prompt?['prompts']:['compile','diagnostic']){
  const before='discoveryPlanAnchors.'+method+'(r';
  const token=method==='diagnostic'?'discoveryPlanAnchors.diagnostic(e)':before;
  if(tail.split(token).length!==2)throw Error('DISCOVERY_CALL_CHANGED');
  tail=tail.replace(token,()=>token.replace('discoveryPlanAnchors','discoveryPlanAssignments'));
 }
 return code.slice(0,code.indexOf(marker))+library()+tail;
}
function prepare(w){
 if(w.id!==ID||w.versionId!==BASE||w.activeVersionId!==BASE||!w.active||w.nodes.length!==7)throw Error('DISCOVERY_BASE_CHANGED');
 const next=structuredClone(w);
 for(const name of ['Build discovery prompt','Validate model response']){
  const node=next.nodes.find(n=>n.name===name);if(node?.type!=='n8n-nodes-base.code')throw Error('DISCOVERY_NODE_CHANGED');
  node.parameters.jsCode=patch(node.parameters.jsCode,name==='Build discovery prompt');
 }return next;
}
module.exports={ID,BASE,prepare};
