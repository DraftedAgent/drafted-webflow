'use strict';
const original=require('../../backend/n8n-tailor-sources-candidate.cjs');
const amendment=require('../../backend/n8n-tailor-context-prompt.cjs');
const adapter=require('../../backend/n8n-tailor-source-references.cjs');
const harness=require('./tailor-workflow-harness.cjs');
// Reconstruct historical approved Code for isolated synthetic tests. Full live
// definition/version binding is checked separately before save and activation.
function definition(){
 const base=original.prepare(harness.baseline);
 for(const name of ['Validate + Normalize','Compose source suggestion']){
  const n=base.nodes.find(n=>n.name===name);
  if(name==='Validate + Normalize')n.parameters.jsCode=n.parameters.jsCode.replace(amendment.BEFORE,amendment.AFTER);
  n.parameters.jsCode=adapter.patch(n.parameters.jsCode,name==='Validate + Normalize');
 }
 return base;
}
const createHarness=({model,definition:prepared=definition()}={})=>harness.createHarness({model,definition:prepared});
module.exports={createHarness,definition,response:harness.response,runCode:harness.runCode};
