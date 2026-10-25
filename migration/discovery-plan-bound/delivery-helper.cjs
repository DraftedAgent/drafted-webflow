'use strict';
const fs=require('node:fs'),A=require('../luna/candidate.cjs'),C=require('./current-adapter.cjs'),Public=require('../../webflow/src/experience-discovery-contract.js');
const file='dev-system/prepared/discovery-plan-bound-current/package-lock.json',approved='92c2634907b46e8ce421fe8f816f2d21024acb0116481df746ab6b008daa4f20';
function lock(){if(A.sha(fs.readFileSync(file,'utf8'))!==approved)throw Error('APPROVED_BOUND_PACKAGE_CHANGED');const m=JSON.parse(fs.readFileSync(file));for(const [f,h]of Object.entries(m.files))if(A.sha(fs.readFileSync(f,'utf8'))!==h)throw Error('BOUND_SOURCE_CHANGED');return m;}
const projection=(w,active=false)=>({name:w.name,nodes:active?w.activeVersion?.nodes:w.nodes,connections:active?w.activeVersion?.connections:w.connections,settings:w.settings});
function prepare(w){
 lock();C.check(w);if(w.staticData!=null)throw Error('UNEXPECTED_STATIC_DATA');
 const next=C.prepare(w,{bound:true});
 const safe=structuredClone(next);safe.nodes=safe.nodes.map(n=>{const {credentials,...rest}=n;return {...rest,credentialTypes:credentials?Object.keys(credentials):n.credentialTypes||[]};});
 const reviewed=structuredClone(require('../../dev-system/prepared/discovery-plan-bound-current/schema-and-diagnostic.safe.json'));
 // Capture metadata is absent on newly added credential-free routing nodes.
 // Normalize that metadata on both sides; it is not a workflow parameter.
 reviewed.nodes=reviewed.nodes.map(n=>({...n,credentialTypes:n.credentialTypes||[]}));
 if(A.sha(projection(safe))!==A.sha(projection(reviewed)))throw Error('REVIEWED_CANDIDATE_MISMATCH');
 return {id:w.id,name:w.name,beforeVersionId:w.versionId,beforeActiveVersionId:w.activeVersionId,beforeProjectionSha256:A.sha(projection(w)),candidateProjectionSha256:A.sha(projection(next)),proposalSha256:approved,payload:projection(next),changedNodes:['Build discovery prompt','Validate model response','Respond discovery'],addedNodes:['Discovery planning?','Discovery plan model']};
}
function verify(w,p,active){
 lock();if(w.id!==p.id||A.sha(projection(w))!==p.candidateProjectionSha256)throw Error('SAVED_BOUND_CANDIDATE_MISMATCH');
 if(active){if(!w.active||w.versionId!==w.activeVersionId||A.sha(projection(w,true))!==p.candidateProjectionSha256)throw Error('ACTIVE_BOUND_CANDIDATE_MISMATCH');}
 else if(w.activeVersionId!==p.beforeActiveVersionId||A.sha(projection(w,true))!==p.beforeProjectionSha256)throw Error('BOUND_ACTIVATED_BEFORE_SMOKE');
 return {id:w.id,savedVersionId:w.versionId,activeVersionId:w.activeVersionId,activeProjectionVerified:active,savedProjectionVerified:true,candidateProjectionSha256:p.candidateProjectionSha256,proposalSha256:approved,model:'gpt-6-luna'};
}
let input='';process.stdin.setEncoding('utf8');process.stdin.on('data',s=>input+=s);process.stdin.on('end',()=>{try{const x=JSON.parse(input),mode=process.argv[2];let out;if(mode==='prepare')out=prepare(x.workflow);else if(mode==='before-save'){const p=prepare(x.workflow);if(p.candidateProjectionSha256!==x.plan.candidateProjectionSha256||A.sha(x.plan.payload)!==p.candidateProjectionSha256)throw Error('BOUND_PAYLOAD_CHANGED');out={ok:true};}else if(mode==='saved'||mode==='published')out=verify(x.workflow,x.plan,mode==='published');else if(mode==='smoke'){if(x.status!==200)throw Error('SYNTHETIC_HTTP_FAILED_'+x.status);Public.validateResponse(x.request,x.response);if(!x.response.ok)throw Error('SYNTHETIC_RESPONSE_REJECTED');out={publicResponseValid:true,requestId:x.request.requestId,contextRevision:x.request.contextRevision,topics:x.response.result.topics.length};}else throw Error('UNKNOWN_BOUND_DELIVERY_MODE');process.stdout.write(JSON.stringify(out));}catch(e){console.error('BOUND_DELIVERY_STOPPED '+e.message);process.exitCode=1;}});
