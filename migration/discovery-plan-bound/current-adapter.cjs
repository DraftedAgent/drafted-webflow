'use strict';
// Reuse the locked plan-bound implementation, rebased only onto deployed diagnostics.
const A=require('../luna/candidate.cjs'),Old=require('./n8n-patch.cjs'),D=require('./diagnostic-patch.cjs');
const oldBase=require('../../dev-system/prepared/discovery-plan-bound/baseline.safe.json'),diag=require('../../dev-system/prepared/discovery-inline-diagnostics/proposal.json'),receipt=require('../../dev-system/deliveries/discovery-diagnostics-2026-10-25/receipt.json');
const clone=v=>JSON.parse(JSON.stringify(v)),node=(w,name)=>w.nodes.find(n=>n.name===name);
function baseline(){const w=clone(oldBase);w.versionId=w.activeVersionId=receipt.proof.activeVersionId;node(w,'Validate model response').parameters.jsCode=diag.changes.afterCode;return w;}
function check(current){
 const expected=baseline(),safe=clone(current);
 safe.nodes=safe.nodes.map(n=>{const {credentials,...rest}=n;return {...rest,credentialTypes:credentials?Object.keys(credentials):n.credentialTypes||[]};});
 if(current.id!==expected.id||!current.active||current.versionId!==expected.versionId||current.activeVersionId!==expected.activeVersionId||A.sha({name:safe.name,nodes:safe.nodes,connections:safe.connections,settings:safe.settings})!==A.sha({name:expected.name,nodes:expected.nodes,connections:expected.connections,settings:expected.settings}))throw Error('CURRENT_DISCOVERY_BASE_CHANGED');
 if(current.activeVersion&&A.sha({name:current.name,nodes:current.activeVersion.nodes,connections:current.activeVersion.connections,settings:current.settings})!==receipt.proof.projectionSha256)throw Error('ACTIVE_DISCOVERY_PROJECTION_CHANGED');
}
function prepare(current,{bound=false}={}){
 check(current);const w=clone(current);
 if(bound){
  const oldCandidate=Old.prepare(oldBase);
  node(w,'Build discovery prompt').parameters.jsCode=Old.patch(node(w,'Build discovery prompt').parameters.jsCode,true);
  node(w,'Validate model response').parameters.jsCode=Old.patch(node(w,'Validate model response').parameters.jsCode,false);
  for(const name of ['Discovery planning?','Discovery plan model']){const n=clone(node(oldCandidate,name));if(name==='Discovery plan model'&&node(w,'Discovery model').credentials){n.credentials=clone(node(w,'Discovery model').credentials);delete n.credentialTypes;}w.nodes.push(n);}
  w.connections=clone(oldCandidate.connections);
 }
 node(w,'Validate model response').parameters.jsCode=D.validator(node(w,'Validate model response').parameters.jsCode);
 const pos=w.nodes.findIndex(n=>n.name==='Respond discovery');w.nodes[pos]=D.response(w.nodes[pos]);
 return w;
}
module.exports={baseline,check,prepare};
