'use strict';
const fs=require('node:fs'),path=require('node:path');
const ID='zeIzzxPwD2Y91OyD',BASE='8cd1ce3b-5745-45be-a1aa-040f05a72418';
function library(){
 let code=fs.readFileSync(path.join(__dirname,'discovery-plan-assessments.cjs'),'utf8').replace(/\r\n?/g,'\n');
 const dependency="const anchors=require('./discovery-plan-anchors.cjs');";
 if(code.split(dependency).length!==2||code.split('module.exports=').length!==2)throw Error('ASSESSMENT_LIBRARY_CHANGED');
 code=code.replace(dependency,'const anchors=discoveryPlanAnchors;').replace('module.exports=','return ');
 return '\nconst discoveryPlanAssessments=(()=>{\n'+code+'\n})();\n';
}
function replaceOnce(code,before,after){if(code.split(before).length!==2)throw Error('DISCOVERY_CODE_CHANGED');return code.replace(before,()=>after);}
function patch(code,prompt){
 if(code.includes('const discoveryPlanAssessments='))throw Error('ALREADY_PATCHED');
 const marker=prompt?'const r=$input.first().json.request;return [{json:{promptText:':"const c=globalThis.DraftedDiscoveryContract;const r=$items('Validate request')[0].json.request;";
 code=replaceOnce(code,marker,library()+marker);
 if(prompt){
  const old='(function(){const messages=discoveryPlanAssignments.prompts(r);messages[0].content+='+JSON.stringify(' '+require('./discovery-prioritized-prompt.cjs').instruction)+';return messages;})()';
  return replaceOnce(code,old,'discoveryPlanAssessments.prompts(r)');
 }
 code=replaceOnce(code,'let response,httpStatus,diagnostic=null;','let response,httpStatus,diagnostic=null,assessmentAudit=null;');
 code=replaceOnce(code,"const value=c.modelText(data);response=c.modelResult(r,r.operation==='plan'?discoveryPlanAssignments.compile(r,typeof value==='string'?JSON.parse(value):value):value);", "const value=c.modelText(data);if(r.operation==='plan'){const assessed=discoveryPlanAssessments.review(r,typeof value==='string'?JSON.parse(value):value);assessmentAudit=assessed.audit;response=c.modelResult(r,assessed.result);diagnostic=discoveryPlanAssessments.successDiagnostic(assessed);}else{response=c.modelResult(r,value);}");
 code=replaceOnce(code,'response,httpStatus,diagnostic}}','response,httpStatus,diagnostic,assessmentAudit}}');
 return replaceOnce(code,'discoveryPlanAssignments.diagnostic(e)','discoveryPlanAssessments.diagnostic(e)');
}
function prepare(w){
 if(w.id!==ID||w.versionId!==BASE||w.activeVersionId!==BASE||!w.active||w.nodes.length!==7)throw Error('DISCOVERY_BASE_CHANGED');
 const next=structuredClone(w);for(const name of ['Build discovery prompt','Validate model response']){const node=next.nodes.find(n=>n.name===name);if(node?.type!=='n8n-nodes-base.code')throw Error('DISCOVERY_NODE_CHANGED');node.parameters.jsCode=patch(node.parameters.jsCode,name==='Build discovery prompt');}return next;
}
module.exports={ID,BASE,prepare};
