'use strict';
const fs=require('node:fs'),path=require('node:path');
const ID='zeIzzxPwD2Y91OyD',BASE='95648c64-008f-4cc4-93e3-df61556d27ff';
function library(){
 let code=fs.readFileSync(path.join(__dirname,'discovery-plan-anchors.cjs'),'utf8').replace(/\r\n?/g,'\n');
 const dependency="const contract=require('../webflow/src/experience-discovery-contract.js');";
 if(code.split(dependency).length!==2||code.split('module.exports=').length!==2)throw Error('ANCHOR_LIBRARY_CHANGED');
 code=code.replace(dependency,'const contract=globalThis.DraftedDiscoveryContract;').replace('module.exports=','return ');
 return '\nconst discoveryPlanAnchors=(()=>{\n'+code+'\n})();\n';
}
function patchPrompt(code){
 const marker='const r=$input.first().json.request;return [{json:{promptText:';
 const before='discoveryReferencePrompt(globalThis.DraftedDiscoveryContract.prompts(r),r).map';
 if(typeof code!=='string'||code.includes('const discoveryPlanAnchors=')||code.split(marker).length!==2||code.split(before).length!==2)throw Error('DISCOVERY_PROMPT_CHANGED');
 return code.replace(marker,()=>library()+marker).replace(before,()=>"(r.operation==='plan'?discoveryPlanAnchors.prompts(r):discoveryReferencePrompt(globalThis.DraftedDiscoveryContract.prompts(r),r)).map");
}
function patchResult(code){
 const marker='const c=globalThis.DraftedDiscoveryContract;const r=$items(\'Validate request\')[0].json.request;';
 const before='response=c.modelResult(r,c.modelText(data));';
 const diagnostic='...c.modelDiagnostic(e),operation:';
 if(typeof code!=='string'||code.includes('const discoveryPlanAnchors=')||code.split(marker).length!==2||code.split(before).length!==2||code.split(diagnostic).length!==2)throw Error('DISCOVERY_RESULT_CHANGED');
 return code.replace(marker,()=>library()+marker).replace(before,()=>"const value=c.modelText(data);response=c.modelResult(r,r.operation==='plan'?discoveryPlanAnchors.compile(r,typeof value==='string'?JSON.parse(value):value):value);").replace(diagnostic,()=>"...(r.operation==='plan'?(discoveryPlanAnchors.diagnostic(e)||c.modelDiagnostic(e)):c.modelDiagnostic(e)),operation:");
}
function prepare(w){
 if(w.id!==ID||w.versionId!==BASE||w.activeVersionId!==BASE||w.active!==true||w.nodes.length!==7)throw Error('DISCOVERY_BASE_CHANGED');
 const next=structuredClone(w);for(const [name,patch] of [['Build discovery prompt',patchPrompt],['Validate model response',patchResult]]){
  const node=next.nodes.find(n=>n.name===name);if(node?.type!=='n8n-nodes-base.code')throw Error('DISCOVERY_NODE_CHANGED');node.parameters.jsCode=patch(node.parameters.jsCode);
 }return next;
}
module.exports={ID,BASE,prepare,patchPrompt,patchResult};
