'use strict';
// Generates review artifacts from the inspected SAFE fixture. Never deploy this
// fixture: it deliberately omits credentials, settings, pinned/static data, etc.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const adapter=require('../backend/n8n-tailor-sources-candidate.cjs');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'dev-system/prepared');
const read=p=>fs.readFileSync(path.join(root,p),'utf8').replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n'),hash=s=>crypto.createHash('sha256').update(s,'utf8').digest('hex');
const original=read('tests/fixtures/tailor-workflow.safe.json'),baseline=JSON.parse(original.replace(/^\uFEFF/,'')),candidate=adapter.prepare(baseline),diff=adapter.diff(baseline,candidate);
const file='webflow/src/drafted-editor.js',source=read(file),lines=source.split(/\r?\n/),index=lines.findIndex(l=>l.startsWith('const tailorSourcesEnabled='));
if(index<0)throw Error('FRONTEND_GATE_CHANGED');
if(lines[index].includes('(!window.__DRAFTED_PREVIEW_ENDPOINTS__'))throw Error('FRONTEND_RELEASE_ALREADY_APPLIED: keep the reviewed pre-release artifacts frozen.');
const before=lines[index],after=before.replace('const tailorSourcesEnabled=','const tailorSourcesEnabled=(!window.__DRAFTED_PREVIEW_ENDPOINTS__&&N8N_TAILOR_URL==="https://drafted.app.n8n.cloud/webhook/tailor-cv")||');
const frontend=`--- a/${file}\n+++ b/${file}\n@@ -${index-2},5 +${index-2},5 @@\n`+[...lines.slice(index-3,index).map(l=>' '+l),'-'+before,'+'+after,...lines.slice(index+1,index+2).map(l=>' '+l)].join('\n')+'\n';
const patch=JSON.stringify(diff,null,2)+'\n';
fs.writeFileSync(path.join(dir,'tailor-sources.workflow.diff.json'),patch);
fs.writeFileSync(path.join(dir,'tailor-sources.frontend-enable.patch'),frontend);
const manifest={purpose:'Review only. No workflow write, model call, frontend enablement or deployment.',workflowId:adapter.ID,savedVersionId:adapter.BASE,activeVersionId:adapter.BASE,remoteUpdatedAt:baseline.updatedAt,inspectedAtUtc:baseline.inspectedAtUtc,activeCodeAndGraphMatchesSaved:baseline.activeCodeAndGraphMatchesSaved,safeFixtureSha256:hash(original),sharedSourceSha256:adapter.hashes(),adapterSha256:hash(read('backend/n8n-tailor-sources-candidate.cjs')),workflowDiffSha256:hash(patch),frontendSourceSha256:hash(source),frontendEnablePatchSha256:hash(frontend),newNodes:candidate.nodes.filter(n=>!baseline.nodes.some(o=>o.id===n.id)).map(n=>n.name),changedExistingNodes:['Validate + Normalize'],preservedLegacyNodes:baseline.nodes.filter(n=>n.name!=='Validate + Normalize').map(n=>n.name),model:{name:'gpt-4.1-mini',maxOutputTokens:4000,temperature:0.2,simplify:false,store:false,n8nRetryOnFail:false,tools:[],credential:'Inherited in memory from existing TailorModel; absent from review diff.'},publicationOrder:['Fresh saved/active definition check and verified complete encrypted snapshots.','Apply approved existing-workflow patch with publishIfActive=false; read back saved AND active state. Stop on any unexpected active-state change.','Separately approved publication of exactly the reviewed saved workflow.','Apply frontend enable patch, rebuild/verify assets, then approved PR merge/Pages release.'],excluded:['No new blocks/profile store.','No external workflow/API mutations or executions in preparation.','No live-model semantic-quality or n8n-engine validation claimed.'],failureStatuses:{invalidRequest:400,inputTooLarge:413,invalidModelOutput:422,providerError:503}};
manifest.hashEncoding='SHA-256 of UTF-8 text after BOM removal and LF normalization (portable across checkouts).';
fs.writeFileSync(path.join(dir,'tailor-sources.release-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({workflowId:adapter.ID,base:adapter.BASE,changedExisting:1,addedNodes:manifest.newNodes.length,artifacts:['tailor-sources.workflow.diff.json','tailor-sources.frontend-enable.patch','tailor-sources.release-manifest.json'],externalActions:0}));
