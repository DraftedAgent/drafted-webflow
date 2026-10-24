'use strict';
// Receives read-only current definitions via stdin; never saves raw workflows or credentials.
const fs=require('node:fs'),A=require('../backend/n8n-model-contracts-candidate.cjs'),H=require('../tests/helpers/model-contracts-harness.cjs'),F=require('../tests/fixtures/model-contracts.cjs'),M=require('../evaluation/materials.cjs');
function changes(before,after,path='parameters'){
 if(A.hash(before)===A.hash(after))return [];
 if(before&&after&&typeof before==='object'&&typeof after==='object'&&!Array.isArray(before)&&!Array.isArray(after))return [...new Set([...Object.keys(before),...Object.keys(after)])].flatMap(k=>changes(before[k]??null,after[k]??null,path+'.'+k));
 return [{path,...(typeof before==='string'&&before.length>2000||typeof after==='string'&&after.length>2000?{beforeSha256:A.hash(before),afterSha256:A.hash(after),beforeCharacters:before?.length??0,afterCharacters:after?.length??0}:{before,after})}];
}
async function review(defs){
 const out={version:1,localOnly:true,externalModelCalls:0,workflowWrites:0,workflows:{}};
 for(const kind of ['discovery','tailor']){
  const before=defs[kind],next=A.prepare(kind,before),nodes=next.nodes.filter(n=>A.hash(n.parameters)!==A.hash(before.nodes.find(b=>b.id===n.id).parameters));
  if(A.hash(next.connections)!==A.hash(before.connections)||A.hash(next.settings)!==A.hash(before.settings))throw Error('UNEXPECTED_GRAPH_OR_SETTINGS_CHANGE');
  for(const n of next.nodes){const old=before.nodes.find(b=>b.id===n.id);if(A.hash({...old,parameters:null})!==A.hash({...n,parameters:null}))throw Error('UNEXPECTED_NODE_METADATA_CHANGE');}
  const handle=H.createHarness({kind,definition:next,model:F.model}),r=kind==='discovery'?M.plan():require('../tests/fixtures/tailor-sources.cjs').request(),happy=await handle(r);if(happy.status!==200)throw Error('ACTUAL_CODE_REHEARSAL_FAILED');
  const invalid=await H.createHarness({kind,definition:next,model:()=>({})})(r);if(invalid.status!==422)throw Error('ACTUAL_CODE_REJECTION_FAILED');
  if(kind==='discovery'){const interpreted=await handle(M.interpret('I supported internal testing, not planning.'));if(interpreted.status!==200)throw Error('ACTUAL_INTERPRET_FAILED');}
  out.workflows[kind]={workflowId:before.id,baselineVersion:before.versionId,baselineProjection:A.hash({nodes:before.nodes,connections:before.connections,settings:before.settings}),candidateProjection:A.hash({nodes:next.nodes,connections:next.connections,settings:next.settings}),graphUnchanged:true,settingsUnchanged:true,model:next.nodes.find(n=>n.name===(kind==='discovery'?'Discovery model':'Tailor sources model')).parameters.modelId,modelOptions:next.nodes.find(n=>n.name===(kind==='discovery'?'Discovery model':'Tailor sources model')).parameters.options,changedNodes:nodes.map(n=>({name:n.name,parameterChanges:changes(before.nodes.find(b=>b.id===n.id).parameters,n.parameters)})),rehearsal:{syntheticSuccess:happy.status,syntheticMalformed:invalid.status}};
 }
 return out;
}
if(require.main===module){let input='';process.stdin.setEncoding('utf8');process.stdin.on('data',s=>input+=s);process.stdin.on('end',async()=>{try{const report=await review(JSON.parse(input));fs.writeFileSync(process.argv[2],JSON.stringify(report,null,2)+'\n');console.log('Read-only actual-definition rehearsal passed; saved safe review manifest only.');}catch(e){console.error(e.message);process.exitCode=1;}});}
module.exports={review,changes};
