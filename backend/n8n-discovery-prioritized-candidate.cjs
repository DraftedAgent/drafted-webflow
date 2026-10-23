'use strict';
const {instruction}=require('./discovery-prioritized-prompt.cjs');
const ID='zeIzzxPwD2Y91OyD',BASE='720bf158-17f4-440d-9a29-a5a84fa3b3a3';
function prepare(w){
 if(w.id!==ID||w.versionId!==BASE||w.activeVersionId!==BASE||!w.active||w.nodes.length!==7)throw Error('DISCOVERY_BASE_CHANGED');
 const next=structuredClone(w),node=next.nodes.find(n=>n.name==='Build discovery prompt');
 const before='discoveryPlanAssignments.prompts(r)';
 if(node?.type!=='n8n-nodes-base.code'||node.parameters.jsCode.split(before).length!==2)throw Error('DISCOVERY_PROMPT_CHANGED');
 node.parameters.jsCode=node.parameters.jsCode.replace(before,()=>'(function(){const messages=discoveryPlanAssignments.prompts(r);messages[0].content+='+JSON.stringify(' '+instruction)+';return messages;})()');
 return next;
}
module.exports={ID,BASE,prepare};
