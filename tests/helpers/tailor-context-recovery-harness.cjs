'use strict';
const h=require('./tailor-references-harness.cjs'),adapter=require('../../backend/n8n-tailor-context-recovery-proposal.cjs');
function definition(){const w=h.definition(),n=w.nodes.find(n=>n.name==='Compose source suggestion');n.parameters.jsCode=adapter.patch(n.parameters.jsCode);return w;}
const createHarness=({model,definition:prepared=definition()}={})=>h.createHarness({model,definition:prepared});
module.exports={...h,definition,createHarness};
