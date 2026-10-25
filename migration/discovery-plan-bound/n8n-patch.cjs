'use strict';
const fs=require('node:fs'),crypto=require('node:crypto');
const BASE='063ed025-c1ee-4778-90cb-91b83e6f9be5';
const clone=v=>JSON.parse(JSON.stringify(v));
const sha=v=>crypto.createHash('sha256').update(typeof v==='string'?v:JSON.stringify(v)).digest('hex');
function once(text,before,after){if(text.split(before).length!==2)throw Error('BOUND_NODE_BASE_CHANGED');return text.replace(before,()=>after);}
function library(){return '\nconst discoveryPlanBound=(()=>{\n'+once(fs.readFileSync(__dirname+'/contract.cjs','utf8').replace(/\r\n?/g,'\n'),'module.exports={create};','return create(discoveryInlineQuestions,globalThis.DraftedDiscoveryContract);')+'\n})();\n';}
function patch(code,prompt){
 const marker=prompt?'const r=$input.first().json.request;return [{json:{promptText:':"const c=globalThis.DraftedDiscoveryContract;const r=$items('Validate request')[0].json.request;";
 let out=once(code,marker,library()+marker);
 if(prompt)out=once(out,marker,"const r=$input.first().json.request;if(r.operation==='plan'){const planBinding=discoveryPlanBound.prepare(r,String($execution.id));return [{json:{planBinding,planRequest:planBinding.apiRequest}}];}return [{json:{promptText:");
 else out=once(out,"discoveryInlineQuestions.review(r,typeof value==='string'?JSON.parse(value):value)","discoveryPlanBound.review($items('Build discovery prompt')[0].json.planBinding,typeof value==='string'?JSON.parse(value):value,r,String($execution.id))");
 return out;
}
function prepare(current){
 if(current.id!=='zeIzzxPwD2Y91OyD'||current.versionId!==BASE||current.activeVersionId!==BASE)throw Error('ACTIVE_BASE_CHANGED');
 const frozen=require('../../dev-system/prepared/discovery-plan-bound/baseline.safe.json');
 const safeNodes=current.nodes.map(n=>{const {credentials,...safe}=n;return {...safe,credentialTypes:credentials?Object.keys(credentials):n.credentialTypes||[]};});
 if(sha(safeNodes)!==sha(frozen.nodes)||sha(current.connections)!==sha(frozen.connections)||sha(current.settings)!==sha(frozen.settings)||current.name!==frozen.name)throw Error('ACTIVE_PROJECTION_CHANGED');
 const w=clone(current),node=name=>w.nodes.find(n=>n.name===name),model=node('Discovery model');
 for(const name of ['Discovery planning?','Discovery plan model'])if(node(name))throw Error('BRANCH_ALREADY_EXISTS');
 node('Build discovery prompt').parameters.jsCode=patch(node('Build discovery prompt').parameters.jsCode,true);
 node('Validate model response').parameters.jsCode=patch(node('Validate model response').parameters.jsCode,false);
 const routing={id:'4322ef4b-8158-49d6-a643-498898d99edf',name:'Discovery planning?',type:'n8n-nodes-base.if',typeVersion:2.2,position:[900,-320],parameters:{conditions:{options:{caseSensitive:true,leftValue:'',typeValidation:'strict',version:2},conditions:[{id:'9be1176a-8508-47ea-94e1-817022186c84',leftValue:'={{ $json.planBinding?.profile === "discovery-plan-bound-1" }}',rightValue:'',operator:{type:'boolean',operation:'true',singleValue:true}}],combinator:'and'},options:{}}};
 const transport={id:'adbfda20-5060-486b-b61a-250901e53605',name:'Discovery plan model',type:'n8n-nodes-base.httpRequest',typeVersion:4.2,position:[1110,-320],parameters:{method:'POST',url:'https://api.openai.com/v1/responses',authentication:'predefinedCredentialType',nodeCredentialType:'openAiApi',sendBody:true,specifyBody:'json',jsonBody:'={{ $json.planRequest }}',options:{timeout:90000,response:{response:{responseFormat:'json'}}}},retryOnFail:false,onError:'continueRegularOutput'};
 if(model.credentials)transport.credentials=clone(model.credentials);
 if(model.credentialTypes)transport.credentialTypes=clone(model.credentialTypes);
 w.nodes.push(routing,transport);
 const edge=name=>({node:name,type:'main',index:0});
 w.connections['Build discovery prompt']={main:[[edge(routing.name)]]};
 w.connections[routing.name]={main:[[edge(transport.name)],[edge(model.name)]]};
 w.connections[transport.name]={main:[[edge('Luna output - Discovery model')]]};
 return w;
}
module.exports={BASE,sha,patch,prepare};
