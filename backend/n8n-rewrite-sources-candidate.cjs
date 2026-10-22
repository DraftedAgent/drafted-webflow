'use strict';
// Pure, version-bound preparation. No API client, credentials, writes or execution.
const fs=require('node:fs'),path=require('node:path');
const profile=require('../webflow/src/rewrite-sources-candidate.js');
const BASE='fb91e3d1-44a6-4224-a5c5-9ba08b8d1ba4',ID='3fy8qAJngSRWzP35';
const library=['experience-discovery-contract.js','rewrite-sources-candidate.js'].map(file=>fs.readFileSync(path.join(__dirname,'../webflow/src',file),'utf8')).join('\n;\n');
const failure="{ok:false,blocksSchemaVersion:'1.0',blocks:[],contractError:{code:'INVALID_MODEL_OUTPUT',message:'A safe draft suggestion could not be created.'}}";
function prepare(workflow){
 if(workflow.id!==ID||workflow.versionId!==BASE||workflow.activeVersionId!==BASE)throw Error('REWRITE_BASE_VERSION_CHANGED');
 const next=structuredClone(workflow),node=name=>{const n=next.nodes.find(n=>n.name===name);if(!n)throw Error('MISSING_NODE:'+name);return n;};
 const validate=node('Validation + Normalization');
 validate.parameters.jsCode=library+`\nconst incoming=$input.all()[0]?.json;const sourceRequest=incoming?.body??incoming?.data??incoming;\nif(sourceRequest&&('sourceContext' in sourceRequest||'sourcesSchemaVersion' in sourceRequest)){try{DraftedRewriteSources.validateRequest(sourceRequest);return [{json:{...sourceRequest,ok:true,originalBlocks:sourceRequest.blocks,rewriteSourceInput:DraftedRewriteSources.modelInput(sourceRequest)}}];}catch{return [{json:{ok:false,blocksSchemaVersion:'1.0',blocks:[],contractError:{code:'INVALID_REQUEST',message:'The answer-based draft request is invalid.'}}}];}}\n`+validate.parameters.jsCode;
 const condition=(name,id,expression)=>({id,name,type:'n8n-nodes-base.if',typeVersion:2.2,position:[650,400],parameters:{conditions:{options:{caseSensitive:true,leftValue:'',typeValidation:'strict',version:2},conditions:[{id:id+'-condition',leftValue:expression,rightValue:true,operator:{type:'boolean',operation:'true',singleValue:true}}],combinator:'and'},options:{}}});
 next.nodes.push(condition('Rewrite input valid?','rewrite-source-input-valid','={{$json.ok === true}}'),condition('Rewrite has answer sources?','rewrite-source-profile','={{$json.sourcesSchemaVersion === "1.0"}}'));
 const to=(name,index=0)=>({node:name,type:'main',index});
 const original=next.connections[validate.name];
 next.connections[validate.name]={main:[[to('Rewrite input valid?')]]};
 next.connections['Rewrite input valid?']={main:[[to('Rewrite has answer sources?')],[to('Respond to Webhook1')]]};
 next.connections['Rewrite has answer sources?']={main:[[to('EN-EditorRewriteModel')],original.main[0]]};
 const en=node('EN-EditorRewriteModel'),oldPrompt=en.parameters.responses.values[0].content;
 en.parameters.responses.values[0].content='={{ $json.sourcesSchemaVersion === "1.0" ? '+JSON.stringify(profile.prompt)+' : '+JSON.stringify(oldPrompt)+' }}';
 en.parameters.responses.values[1].content='={{ $json.sourcesSchemaVersion === "1.0" ? JSON.stringify($json.rewriteSourceInput) : "Here is the input (JSON):\\n" + JSON.stringify($json) }}';
 // Explicit cap for this source-only path; preserve the old no-source value (undefined).
 en.parameters.options.maxTokens='={{ $json.sourcesSchemaVersion === "1.0" ? 1600 : undefined }}';
 en.parameters.simplify='={{ $json.sourcesSchemaVersion !== "1.0" }}';
 en.retryOnFail=false;
 // n8n vendor OpenAI transport uses requestWithAuthentication, not SDK retries.
 const normalize=node('Normalize output1');
 normalize.parameters.jsCode=library+`\nconst sourceBase=$node['Validation + Normalization'].json;\nif(sourceBase.sourcesSchemaVersion==='1.0'){try{const raw=$json.output?.[0]?.content?.[0]?.text;if($json.error||($json.status&&$json.status!=='completed')||typeof raw!=='string'||raw.length>60000)throw Error();const request={...sourceBase};delete request.ok;delete request.originalBlocks;delete request.rewriteSourceInput;const candidate=DraftedRewriteSources.candidate(request,JSON.parse(raw));return {json:{sourceCandidate:candidate,ok:true}};}catch{return {json:${failure}};}}\n`+normalize.parameters.jsCode;
 const apply=node('Apply updates + Return main-format1');
 apply.parameters.jsCode=`if($node['Validation + Normalization'].json.sourcesSchemaVersion==='1.0'){return {json:$json.ok===true&&$json.sourceCandidate?$json.sourceCandidate:${failure}};}\n`+apply.parameters.jsCode;
 // No-source parsing failure must not turn into successful empty updates, in either branch.
 for(const name of ['Apply updates + Return main-format','Apply updates + Return main-format1']){const n=node(name);n.parameters.jsCode=`if($json.ok===false)return {json:${failure}};\n`+n.parameters.jsCode;}
 for(const name of ['Respond to Webhook','Respond to Webhook1'])node(name).parameters.options.responseCode='={{ $json.ok === false ? ($json.contractError?.code === "INVALID_REQUEST" ? 400 : 422) : 200 }}';
 return next;
}
function diff(before,after){const changes=[];for(const n of after.nodes){const old=before.nodes.find(b=>b.id===n.id);if(!old){changes.push({path:'/nodes/'+n.name,before:null,after:n});continue;}for(const key of ['parameters','retryOnFail'])if(JSON.stringify(old[key])!==JSON.stringify(n[key]))changes.push({path:'/nodes/'+n.name+'/'+key,before:old[key]??null,after:n[key]});}for(const key of Object.keys(after.connections))if(JSON.stringify(before.connections[key])!==JSON.stringify(after.connections[key]))changes.push({path:'/connections/'+key,before:before.connections[key]??null,after:after.connections[key]});return {workflowId:ID,baseVersionId:BASE,activeVersionId:BASE,changes};}
module.exports={prepare,diff,ID,BASE};
