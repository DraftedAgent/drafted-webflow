'use strict';
const old=require('./discovery-anchors-harness.cjs'),anchors=require('../../backend/n8n-discovery-plan-anchors-candidate.cjs'),patch=require('../../backend/n8n-discovery-plan-assignments-candidate.cjs');
const baseline=anchors.prepare(old.baseline);baseline.versionId=baseline.activeVersionId=patch.BASE;
const definition=patch.prepare(baseline);
module.exports={baseline,definition,createHarness:options=>old.createHarness({definition,...options})};
