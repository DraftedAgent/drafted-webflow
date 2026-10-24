'use strict';
const old=require('./discovery-assessments-harness.cjs'),patch=require('../../backend/n8n-discovery-signal-questions-proposal.cjs');
const definition=structuredClone(old.definition);
for(const name of ['Build discovery prompt','Validate model response']){const n=definition.nodes.find(n=>n.name===name);n.parameters.jsCode=patch.patch(n.parameters.jsCode,name==='Build discovery prompt');}
module.exports={baseline:old.definition,definition,createHarness:options=>old.createHarness({definition,...options})};
