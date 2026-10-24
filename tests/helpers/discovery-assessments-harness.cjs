const old=require('./discovery-prioritized-harness.cjs'),patch=require('../../backend/n8n-discovery-assessments-candidate.cjs');
const baseline=structuredClone(old.definition);baseline.versionId=baseline.activeVersionId=patch.BASE;
const definition=patch.prepare(baseline);
module.exports={baseline,definition,createHarness:options=>old.createHarness({definition,...options})};
