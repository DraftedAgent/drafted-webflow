'use strict';
// LOCAL files only. Never deploys, arms a listener or invokes a model.
const fs=require('node:fs'),path=require('node:path'),{createHash}=require('node:crypto');
const {prepare,diff}=require('../backend/n8n-rewrite-sources-candidate.cjs'),sources=require('../webflow/src/rewrite-sources-candidate.js'),fixture=require('../tests/fixtures/rewrite-sources.cjs');
const before=require('../tests/fixtures/rewrite-baseline.safe.json'),after=prepare(before),patch=diff(before,after),dir=path.join(__dirname,'../dev-system/prepared');
fs.mkdirSync(dir,{recursive:true});
const stringify=value=>JSON.stringify(value,null,2)+'\n';
fs.writeFileSync(path.join(dir,'rewrite-sources.backend-diff.json'),stringify(patch));
// A readable, exact code diff is generated separately by git --no-index for review.
for(const [name,w]of [['before',before],['after',after]]){let text='';for(const n of w.nodes){text+='\n// NODE '+n.name+'\n';if(n.parameters.jsCode)text+=n.parameters.jsCode+'\n';else text+=stringify(n.parameters);if(n.retryOnFail!==undefined)text+='// retryOnFail: '+n.retryOnFail+'\n';}text+='\n// CONNECTIONS\n'+stringify(w.connections);fs.writeFileSync(path.join(dir,'rewrite-sources.'+name+'.txt'),text);}
const requests=[fixture.request(),fixture.request(2)],inputs=requests.map(sources.modelInput);
const tokenEstimates=inputs.map(input=>({inputUtf8Bytes:Buffer.byteLength(sources.prompt+JSON.stringify(input)),estimatedInputTokens:2000,budgetInputTokens:6000,maxOutputTokens:1600}));
fs.writeFileSync(path.join(dir,'rewrite-sources.test-data.json'),stringify({synthetic:true,requests,expectedSemanticExamples:requests.map(r=>fixture.output(r)),model:'gpt-4.1-mini',requestsMaximum:2,modelCallsMaximum:2,automaticRetries:0,tokenEstimates,estimatedCostUsd:0.005,conservativeBudgetUsd:0.02}));
const patchSha256=createHash('sha256').update(stringify(patch)).digest('hex');
fs.writeFileSync(path.join(dir,'rewrite-sources.manifest.json'),stringify({workflowId:patch.workflowId,baseVersionId:patch.baseVersionId,activeVersionId:patch.activeVersionId,patchSha256,changedPaths:patch.changes.map(c=>c.path),status:'PREPARED_ONLY_NOT_APPROVED',testData:'rewrite-sources.test-data.json'}));
console.log(JSON.stringify({patchSha256,changedPaths:patch.changes.length,tokenEstimates,externalCalls:0}));
