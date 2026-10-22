'use strict';
// Reads a complete definition in memory; emits a write payload only after exact approval checks.
const fs=require('node:fs'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const {prepare,diff}=require('../backend/n8n-rewrite-sources-candidate.cjs');
const baseline=require('../tests/fixtures/rewrite-baseline.safe.json'),manifest=require('../dev-system/prepared/rewrite-sources.manifest.json');
const workflow=JSON.parse(fs.readFileSync(0,'utf8').replace(/^\uFEFF/,''));
const safe={id:workflow.id,versionId:workflow.versionId,activeVersionId:workflow.activeVersionId,active:workflow.active,nodes:workflow.nodes.map(n=>({id:n.id,name:n.name,type:n.type,typeVersion:n.typeVersion,parameters:n.parameters,retryOnFail:n.retryOnFail??null,maxTries:n.maxTries??null,onError:n.onError??null})),connections:workflow.connections};
assert.deepEqual(safe,baseline,'REMOTE_BASELINE_DIFFERS');
const candidate=prepare(workflow),patch=diff(workflow,candidate),sha=createHash('sha256').update(JSON.stringify(patch,null,2)+'\n').digest('hex');
assert.equal(sha,manifest.patchSha256,'APPROVED_DIFF_CHANGED');
assert.equal(sha,'81918529e898b11168401d4d34811fb531926e1095d83da2f12b1f419db453ab');
assert.deepEqual(candidate.settings,workflow.settings);assert.equal(candidate.activeVersionId,workflow.activeVersionId);
process.stdout.write(JSON.stringify({verified:true,patchSha256:sha,payload:{name:candidate.name,nodes:candidate.nodes,connections:candidate.connections,settings:candidate.settings}}));
