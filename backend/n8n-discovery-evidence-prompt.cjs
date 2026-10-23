'use strict';
// Pure local preparation. No network, model call, activation or publication.
const ID='zeIzzxPwD2Y91OyD',BASE='be16ba37-66bb-424c-96c6-d944569e68e0';
const BEFORE='Clear requires exact block quotes, unclear requires empty evidence.';
const AFTER=BEFORE+' For every evidence item, copy quote verbatim as one contiguous substring of the text of the exact CV block identified by blockId. Preserve case, punctuation, whitespace and line breaks. Never paraphrase, translate, correct spelling, join separate passages, add ellipses, or borrow text from another block, block metadata, jobContext or an answer. Before returning a clear topic, check each quote against its identified block text. If no exact supporting quote is available, return support:"unclear" and evidence:[] with a short neutral experience question for that topic; missing CV evidence does not mean missing experience. Example: if block text is "Supported planning. Did not lead workshops.", quote "Led workshops" is invalid; do not remove the negation or treat it as positive evidence. An exact quote establishes traceability, not that a requirement is fulfilled; preserve role, negation, uncertainty and scope when judging support.';
function patchCode(code){
 if(typeof code!=='string'||code.includes(AFTER)||code.split(BEFORE).length!==2)throw Error('DISCOVERY_PROMPT_CHANGED');
 return code.replace(BEFORE,AFTER);
}
function prepare(workflow){
 if(workflow.id!==ID||workflow.versionId!==BASE||workflow.activeVersionId!==BASE||workflow.active!==true||workflow.nodes.length!==7)throw Error('DISCOVERY_BASE_CHANGED');
 const next=structuredClone(workflow),node=next.nodes.find(n=>n.name==='Build discovery prompt');
 if(node?.type!=='n8n-nodes-base.code')throw Error('DISCOVERY_PROMPT_CHANGED');
 node.parameters.jsCode=patchCode(node.parameters.jsCode);return next;
}
function prompts(request){return require('../webflow/src/experience-discovery-contract.js').prompts(request).map(m=>request.operation==='plan'&&m.role==='system'?{...m,content:m.content.replace(BEFORE,AFTER)}:m);}
module.exports={ID,BASE,BEFORE,AFTER,patchCode,prepare,prompts};
