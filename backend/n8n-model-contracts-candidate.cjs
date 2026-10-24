'use strict';
// Local preparation only: no deployment, credential access or model calls.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const BASES={discovery:{id:'zeIzzxPwD2Y91OyD',version:'6336f54e-9913-4976-bd32-78d8508338d5',hash:'a3d028c090cfd2490a37a8070819154e86f308445b7b730889494a4363f203cd'},tailor:{id:'H8oAioy58R1v3PvRe3YUa',version:'a5196f17-4ccc-41db-8993-9b6c5fe466dd',hash:'e6ff225845693f1ce500f165d096edf83d00c11185f69cf79122c1f6baee41de'}};
function sort(x){return Array.isArray(x)?x.map(sort):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,sort(x[k])])):x;}
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(sort(x))).digest('hex');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8').replace(/\r\n?/g,'\n');
function once(code,before,after){if(code.split(before).length!==2)throw Error('MODEL_CONTRACT_CODE_DRIFT');return code.replace(before,()=>after);}
function diagnosticsLibrary(){return '\nconst safeModelDiagnostics=(()=>{const globalThis={},module=undefined;\n'+read('webflow/src/model-diagnostics.js')+'\nreturn globalThis.DraftedModelDiagnostics;})();\n';}
function library(kind){
 let core=read('backend/model-contracts.cjs');core=once(core,'module.exports={create};','return {create};');
 const deps=kind==='discovery'?'discoveryOwner:discoverySignalQuestions,discoveryPublic:globalThis.DraftedDiscoveryContract':'tailorRefs:sourceReferences,tailorRecovery:sourceContextRecovery,tailorProfile:sourceProfile';
 return diagnosticsLibrary()+'const modelContractsFactory=(()=>{\n'+core+'\n})();\nconst modelContracts=modelContractsFactory.create({diagnostics:safeModelDiagnostics,'+deps+'});\n';
}
function suffix(code,marker,replacement){if(code.split(marker).length!==2)throw Error('MODEL_CONTRACT_CODE_DRIFT');return code.slice(0,code.indexOf(marker))+replacement;}
function patchDiscovery(w){
 const next=structuredClone(w),node=name=>next.nodes.find(n=>n.name===name),prompt=node('Build discovery prompt'),result=node('Validate model response'),model=node('Discovery model');
 const gate=node('Validate request');gate.parameters.jsCode=suffix(gate.parameters.jsCode,'const c=globalThis.DraftedDiscoveryContract;const r=$input.first().json.body;',diagnosticsLibrary()+`
const c=globalThis.DraftedDiscoveryContract,r=$input.first().json.body;
try{c.validateRequest(r);return [{json:{ok:true,request:r}}];}
catch(e){const code=e.message==='INPUT_TOO_LARGE'?'INPUT_TOO_LARGE':'INVALID_REQUEST',httpStatus=code==='INPUT_TOO_LARGE'?413:400;return [{json:{httpStatus,response:c.error(r,code),ok:false,diagnostic:safeModelDiagnostics.safe({operation:r?.operation,requestId:r?.requestId,status:httpStatus,code,reason:code,path:'$'})}}];}`);
 prompt.parameters.jsCode=suffix(prompt.parameters.jsCode,'const r=$input.first().json.request;return [{json:{promptText:',library('discovery')+`const request=$input.first().json.request,binding=modelContracts.prepare(request.operation,request,String($execution.id));return [{json:{llmMessages:binding.messages,modelContractProfile:binding.profile}}];`);
 result.parameters.jsCode=suffix(result.parameters.jsCode,"const c=globalThis.DraftedDiscoveryContract;const r=$items('Validate request')[0].json.request;",library('discovery')+`
const c=globalThis.DraftedDiscoveryContract,request=$items('Validate request')[0].json.request;
let response,httpStatus,diagnostic=null,assessmentAudit=null;
try{const binding=modelContracts.prepare(request.operation,request,String($execution.id)),raw=modelContracts.extract($input.first().json),done=modelContracts.compose(binding,raw);response=done.body;assessmentAudit=done.audit;httpStatus=200;if(request.operation==='plan'&&!response.result.topics.length)diagnostic=discoverySignalQuestions.successDiagnostic({result:response.result,counts:done.counts});}
catch(e){httpStatus=modelContracts.reason(e)==='MODEL_UNAVAILABLE'?503:422;const code=httpStatus===503?'MODEL_UNAVAILABLE':'INVALID_MODEL_OUTPUT';response=c.error(request,code);diagnostic=modelContracts.diagnostic(request.operation,request.requestId,httpStatus,e,code);}
return [{json:{response,httpStatus,diagnostic,assessmentAudit}}];`);
 model.parameters.responses.values=[{role:'system',content:'={{$json.llmMessages[0].content}}'},{role:'user',content:'={{$json.llmMessages[1].content}}'}];model.parameters.simplify=false;model.parameters.options={...model.parameters.options,store:false};
 headers(node('Respond discovery'),false);return next;
}
function patchTailor(w){
 const next=structuredClone(w),node=name=>next.nodes.find(n=>n.name===name),validate=node('Validate + Normalize'),compose=node('Compose source suggestion');
 // The validated source prefix alone changes; the ordinary CV/ad path is kept.
 validate.parameters.jsCode=once(validate.parameters.jsCode,'const sourceRoot=$input.first().json,sourceRequest=sourceRoot?.body??sourceRoot;',library('tailor').replace('tailorRecovery:sourceContextRecovery,','')+'const sourceRoot=$input.first().json,sourceRequest=sourceRoot?.body??sourceRoot;');
 const begin=' try{sourceProfile.validateRequest(sourceRequest);',end="\n}\n// Validate + Normalize (Tailor CV)";const code=validate.parameters.jsCode,a=code.indexOf(begin),b=code.indexOf(end,a);if(a<0||b<0)throw Error('TAILOR_SOURCE_PREFIX_DRIFT');
 validate.parameters.jsCode=code.slice(0,a)+`
 try{const sourceScope=String($execution.id),binding=modelContracts.prepare('tailor',sourceRequest,sourceScope);return [{json:{_tailorSources:true,status:200,sourceRequest:binding.request,sourceScope,llmMessages:binding.messages}}];}
 catch(e){const status=e.message==='INPUT_TOO_LARGE'?413:400,code=status===413?'INPUT_TOO_LARGE':'INVALID_SOURCE_REQUEST';return [{json:{_tailorSources:true,...sourceFailure(status,code),diagnostic:modelContracts.diagnostic('tailor','tailor_'+String($execution.id),status,e,code)}}];}`+code.slice(b);
 compose.parameters.jsCode=suffix(compose.parameters.jsCode,"const validated=$node['Validate + Normalize'].json,request=validated.sourceRequest,raw=$input.first().json;",library('tailor')+`
const validated=$node['Validate + Normalize'].json,request=validated.sourceRequest,scope=validated.sourceScope,requestId='tailor_'+String($execution.id);
try{const binding=modelContracts.prepare('tailor',request,scope),raw=modelContracts.extract($input.first().json),used=new Set(request.sourceContext.applications.flatMap(g=>g.additions.map(a=>a.id)));let count=0;const id=()=>{let value;do{value=requestId+'_'+(++count);}while(used.has(value));used.add(value);return value;};const done=modelContracts.compose(binding,raw,{id});return [{json:{status:200,body:done.body,requestId,diagnostic:null}}];}
catch(e){const status=modelContracts.reason(e)==='MODEL_UNAVAILABLE'?503:422,code=status===503?'MODEL_UNAVAILABLE':'INVALID_SOURCE_OUTPUT';return [{json:{...sourceFailure(status,code),requestId,diagnostic:modelContracts.diagnostic('tailor',requestId,status,e,code)}}];}`);
 headers(node('Respond with source suggestion'),true);return next;
}
function headers(node,tailor){
 const options=node.parameters.options||={},entries=structuredClone(options.responseHeaders?.entries||[]),set=(name,value)=>{const existing=entries.find(e=>e.name.toLowerCase()===name.toLowerCase());if(existing)existing.value=value;else entries.push({name,value});};
 set('X-Drafted-Validation-Reason','={{$json.diagnostic?.reason || "none"}}');set('X-Drafted-Validation-Path','={{$json.diagnostic?.path || "none"}}');
 set('X-Drafted-Request-Id',tailor?'={{$json.diagnostic?.requestId || $json.requestId || ""}}':'={{$json.diagnostic?.requestId || (/^[a-zA-Z0-9_-]{1,200}$/.test($json.response?.requestId || "") ? $json.response.requestId : "")}}');
 const expose=entries.find(e=>e.name.toLowerCase()==='access-control-expose-headers');if(expose&&expose.value.includes('{{'))throw Error('DYNAMIC_EXPOSE_HEADERS_REQUIRES_REVIEW');
 set('Access-Control-Expose-Headers',Array.from(new Set([...(expose?.value||'').split(',').map(s=>s.trim()).filter(Boolean),'X-Drafted-Validation-Reason','X-Drafted-Validation-Path','X-Drafted-Request-Id'])).join(', '));node.parameters.options={...options,responseHeaders:{...options.responseHeaders,entries}};
}
function prepare(kind,w){const base=BASES[kind];if(!base||w.id!==base.id||!w.active||w.versionId!==base.version||w.activeVersionId!==base.version||hash({nodes:w.nodes,connections:w.connections,settings:w.settings})!==base.hash)throw Error('MODEL_CONTRACT_BASE_CHANGED');if(w.activeVersion&&(hash(w.activeVersion.nodes)!==hash(w.nodes)||hash(w.activeVersion.connections)!==hash(w.connections)))throw Error('MODEL_CONTRACT_ACTIVE_DRIFT');return kind==='discovery'?patchDiscovery(w):patchTailor(w);}
module.exports={BASES,hash,prepare,patchDiscovery,patchTailor,headers};
