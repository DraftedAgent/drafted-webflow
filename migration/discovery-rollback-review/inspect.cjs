'use strict';
// Read-only inspection of an already decrypted workflow-definition backup.
// No workflow call, model execution, output repair or product mutation.
const A=require('../luna/candidate.cjs');
let text='';process.stdin.on('data',s=>text+=s);process.stdin.on('end',()=>{
 const envelope=JSON.parse(text),saved=JSON.parse(envelope.rawSavedJson),pub=JSON.parse(envelope.rawPublishedJson),current=require('../../dev-system/prepared/discovery-plan-bound/baseline.safe.json');
 const node=(w,name)=>w.nodes.find(n=>n.name===name);
 const projection={name:saved.name,nodes:saved.nodes,connections:saved.connections,settings:saved.settings};
 const report={snapshotHashesVerifiedByCaller:true,savedVersion:saved.versionId,activeVersion:saved.activeVersionId,publishedKeys:Object.keys(pub),nodeNames:saved.nodes.map(n=>n.name),model:saved.nodes.filter(n=>n.type.includes('openAi')).map(n=>({name:n.name,parameters:n.parameters})),settings:saved.settings,graph:saved.connections,sharedNodesUnchanged:saved.nodes.filter(n=>!['Build discovery prompt','Validate model response','Discovery model'].includes(n.name)).map(n=>({name:n.name,equal:A.sha(n.parameters)===A.sha(node(current,n.name)?.parameters)})),publicRequestCodeUnchanged:node(saved,'Validate request').parameters.jsCode===node(current,'Validate request').parameters.jsCode,publicResponseStill1:node(saved,'Validate model response').parameters.jsCode.includes("schemaVersion:'1.0'"),projectionSha256:A.sha(projection),publishedProjectionSha256:pub.nodes?A.sha({name:saved.name,nodes:pub.nodes,connections:pub.connections,settings:saved.settings}):null,publicOperationNames:['plan','interpret'],retainsCompleteSignalAssessments:node(saved,'Validate model response').parameters.jsCode.includes('INCOMPLETE_SIGNAL_ASSESSMENT')};
 console.log(JSON.stringify(report,null,2));
});
