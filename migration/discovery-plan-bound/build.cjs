'use strict';
// Creates a reviewable local package only. No network, workflow mutation or model execution.
const fs=require('node:fs'),path=require('node:path'),A=require('./n8n-patch.cjs'),T=require('./checks.cjs');
const root=path.resolve(__dirname,'../..'),folder=path.join(root,'dev-system/prepared/discovery-plan-bound');
const write=(name,value)=>fs.writeFileSync(path.join(folder,name),JSON.stringify(value,null,2)+'\n');
const base=require('../../dev-system/prepared/discovery-plan-bound/baseline.safe.json'),candidate=A.prepare(base),report=T.checks();
if(report.failed.length)throw Error(JSON.stringify(report.failed));
write('local-checks.json',report);write('candidate.safe.json',candidate);
const request=T.material(),modelResult=T.output(request),flow=T.graph(candidate,request,modelResult);
write('examples.json',{syntheticOnly:true,publicRequest:request,apiRequest:flow.calls[0].body,modelResult,publicResponse:flow.out.response,assessmentAudit:flow.out.assessmentAudit});
write('node-changes.json',{workflowId:base.id,baselineVersion:base.versionId,modified:base.nodes.filter(n=>['Build discovery prompt','Validate model response'].includes(n.name)).map(n=>({name:n.name,beforeCode:n.parameters.jsCode,afterCode:candidate.nodes.find(x=>x.name===n.name).parameters.jsCode})),added:candidate.nodes.filter(n=>!base.nodes.some(x=>x.name===n.name)),connections:{before:base.connections,after:candidate.connections},credentials:'Only credential type names in this package. On future approved delivery inherit existing Discovery model credential reference in memory, without reading its value.'});
const frozen=[['dev-system/prepared/model-pilot/manifest.json','690751f8f15367d7483fc4ed3963a375f5ea8d69105c22e9035c7281ef6b3288'],['dev-system/prepared/model-migration-12/manifest.json','5017bb756bbc6e776eab0c4200a1f10564592514d1ba672d876f494fd3d7e5b1']];
for(const [index,[name,expected]]of frozen.entries()){
 const text=fs.readFileSync(path.join(root,name),'utf8'),m=JSON.parse(text);
 // The first historical pilot hashes canonical content excluding its own digest;
 // migration12 hashes exact manifest bytes. Preserve each original convention.
 const actual=index===0?require('../../evaluation/model-pilot.cjs').sha({...m,manifestSha256:undefined}):A.sha(text);
 if(actual!==expected)throw Error('FROZEN_MANIFEST_CHANGED '+name);
}
const files=['migration/discovery-plan-bound/contract.cjs','migration/discovery-plan-bound/n8n-patch.cjs','migration/discovery-plan-bound/checks.cjs','migration/discovery-plan-bound/build.cjs','migration/discovery-plan-bound/capture.cjs','tests/discovery-plan-bound.test.cjs','dev-system/prepared/discovery-plan-bound/baseline.json','dev-system/prepared/discovery-plan-bound/baseline.safe.json','dev-system/prepared/discovery-plan-bound/candidate.safe.json','dev-system/prepared/discovery-plan-bound/node-changes.json','dev-system/prepared/discovery-plan-bound/examples.json','dev-system/prepared/discovery-plan-bound/local-checks.json','dev-system/prepared/discovery-plan-bound/REVIEW.md'];
const manifest={status:'local_implementation_awaiting_one_delivery_approval',workflowId:base.id,baselineVersion:base.versionId,profile:'discovery-plan-bound-1',changes:{modifiedCodeNodes:['Build discovery prompt','Validate model response'],addedNodes:['Discovery planning?','Discovery plan model'],removedNodes:[],unchangedModel:'Discovery model',unchangedGuard:'Luna output - Discovery model',unchangedPublicSchema:'1.0',interpretationUnchanged:true,tailorUnchanged:true},externalModelCalls:0,workflowWrites:0,deliveryApproved:false,checks:{total:report.total,passed:report.passed},files:Object.fromEntries(files.map(name=>[name,A.sha(fs.readFileSync(path.join(root,name),'utf8'))])),preservedPilotManifestHashes:Object.fromEntries(frozen)};
write('package-lock.json',manifest);console.log(JSON.stringify({total:report.total,passed:report.passed,packageSha256:A.sha(fs.readFileSync(path.join(folder,'package-lock.json'),'utf8')),externalModelCalls:0,workflowWrites:0}));
