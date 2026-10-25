'use strict';
const fs=require('node:fs'),A=require('../luna/candidate.cjs'),Patch=require('./patch.cjs');
const file='dev-system/prepared/discovery-inline-diagnostics/proposal.json',approved='ff6757aede764ba6690f72d9568f9083431089e676034dfec8648acba41fc0e7';
if(A.sha(fs.readFileSync(file,'utf8'))!==approved)throw Error('APPROVED_DIAGNOSTIC_CHANGED');
const p=JSON.parse(fs.readFileSync(file)),prior=require('../../dev-system/deliveries/discovery-inline-2026-10-25/receipt.json').proof;
const projection=(w,active=false)=>({name:w.name,nodes:active?w.activeVersion?.nodes:w.nodes,connections:active?w.activeVersion?.connections:w.connections,settings:w.settings});
function prepare(w){
 if(w.id!==p.workflowId||!w.active||w.versionId!==p.activeVersionVerified||w.activeVersionId!==p.activeVersionVerified||A.sha(projection(w))!==prior.projectionSha256||A.sha(projection(w,true))!==prior.projectionSha256||w.staticData!=null)throw Error('DIAGNOSTIC_ACTIVE_BASE_CHANGED');
 const next=structuredClone(w),n=next.nodes.find(n=>n.name===p.changes.node);
 if(n?.id!==p.changes.nodeId||n.type!=='n8n-nodes-base.code'||A.sha(n.parameters.jsCode)!==p.changes.beforeCodeSha256||A.sha(p.changes.afterCode)!==p.changes.afterCodeSha256||Patch.patch(n.parameters.jsCode)!==p.changes.afterCode)throw Error('DIAGNOSTIC_NODE_CHANGED');
 n.parameters.jsCode=p.changes.afterCode;
 return {id:w.id,name:w.name,beforeVersionId:w.versionId,beforeActiveVersionId:w.activeVersionId,beforeProjectionSha256:A.sha(projection(w)),beforeActiveProjectionSha256:A.sha(projection(w,true)),candidateProjectionSha256:A.sha(projection(next)),payload:{name:next.name,nodes:next.nodes,connections:next.connections,settings:next.settings},changedNodes:[p.changes.node],proposalSha256:approved};
}
function verify(w,plan,active){
 if(w.id!==plan.id||A.sha(projection(w))!==plan.candidateProjectionSha256)throw Error('DIAGNOSTIC_SAVED_MISMATCH');
 if(active){if(!w.active||w.versionId!==w.activeVersionId||A.sha(projection(w,true))!==plan.candidateProjectionSha256)throw Error('DIAGNOSTIC_ACTIVE_MISMATCH');}
 else if(w.activeVersionId!==plan.beforeActiveVersionId||A.sha(projection(w,true))!==plan.beforeActiveProjectionSha256)throw Error('DIAGNOSTIC_UNEXPECTED_ACTIVATION');
 return {id:w.id,name:w.name,savedVersionId:w.versionId,activeVersionId:w.activeVersionId,active:w.active,projectionVerified:true,activeProjectionVerified:active,projectionSha256:plan.candidateProjectionSha256,changedNodes:plan.changedNodes,proposalSha256:approved,model:'gpt-6-luna',modelExecutionsInitiated:0};
}
let input='';process.stdin.setEncoding('utf8');process.stdin.on('data',s=>input+=s);process.stdin.on('end',()=>{try{const x=JSON.parse(input),mode=process.argv[2];let result;if(mode==='prepare')result=prepare(x.workflow);else if(mode==='before-save'){const prepared=prepare(x.workflow);if(prepared.candidateProjectionSha256!==x.plan.candidateProjectionSha256||A.sha(x.plan.payload)!==prepared.candidateProjectionSha256)throw Error('DIAGNOSTIC_PAYLOAD_CHANGED');result={ok:true};}else if(mode==='saved'||mode==='published')result=verify(x.workflow,x.plan,mode==='published');else throw Error('UNKNOWN_MODE');process.stdout.write(JSON.stringify(result));}catch(e){console.error('DIAGNOSTIC_DELIVERY_FAILED '+e.message);process.exitCode=1;}});
