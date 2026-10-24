'use strict';
// Unconnected, version-bound local proposal. No network/model/deployment calls.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const ID='zeIzzxPwD2Y91OyD',BASE='8fc9596b-ca45-4ade-8697-34e27bc9ecce',BASE_HASH='d20151203f67ad5721004abac8c436745811694da84c4c5a09a527afc97fb6e2';
function sort(x){return Array.isArray(x)?x.map(sort):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,sort(x[k])])):x;}
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(sort(x))).digest('hex');
function once(code,before,after){if(code.split(before).length!==2)throw Error('DISCOVERY_CODE_CHANGED');return code.replace(before,()=>after);}
function library(){
 let code=fs.readFileSync(path.join(__dirname,'discovery-signal-questions-proposal.cjs'),'utf8').replace(/\r\n?/g,'\n');const dependency="const assessments=require('./discovery-plan-assessments.cjs');";
 if(code.split(dependency).length!==2||code.split('module.exports=').length!==2)throw Error('SIGNAL_QUESTIONS_LIBRARY_CHANGED');
 return '\nconst discoverySignalQuestions=(()=>{\n'+code.replace(dependency,'const assessments=discoveryPlanAssessments;').replace('module.exports=','return ')+'\n})();\n';
}
function patch(code,prompt){
 if(code.includes('const discoverySignalQuestions='))throw Error('ALREADY_PATCHED');
 const marker=prompt?'const r=$input.first().json.request;return [{json:{promptText:':"const c=globalThis.DraftedDiscoveryContract;const r=$items('Validate request')[0].json.request;";
 code=once(code,marker,library()+marker);
 if(prompt)return once(code,'discoveryPlanAssessments.prompts(r)','discoverySignalQuestions.prompts(r)');
 for(const method of ['review','successDiagnostic','diagnostic'])code=once(code,'discoveryPlanAssessments.'+method+'(','discoverySignalQuestions.'+method+'(');
 return code;
}
function prepare(w){
 if(w.id!==ID||!w.active||w.versionId!==BASE||w.activeVersionId!==BASE||hash({nodes:w.nodes,connections:w.connections,settings:w.settings})!==BASE_HASH)throw Error('DISCOVERY_BASE_CHANGED');
 if(w.activeVersion&&(hash(w.activeVersion.nodes)!==hash(w.nodes)||hash(w.activeVersion.connections)!==hash(w.connections)))throw Error('DISCOVERY_ACTIVE_DRIFT');
 const next=structuredClone(w);for(const name of ['Build discovery prompt','Validate model response']){const n=next.nodes.find(n=>n.name===name);if(n?.type!=='n8n-nodes-base.code')throw Error('DISCOVERY_NODE_CHANGED');n.parameters.jsCode=patch(n.parameters.jsCode,name==='Build discovery prompt');}return next;
}
module.exports={ID,BASE,BASE_HASH,hash,patch,prepare};
