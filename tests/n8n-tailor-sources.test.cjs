'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const adapter=require('../backend/n8n-tailor-sources-candidate.cjs'),p=require('../webflow/src/tailor-sources.js'),f=require('./fixtures/tailor-sources.cjs');
const {createHarness,runCode,response,baseline}=require('./helpers/tailor-workflow-harness.cjs');
const prepared=adapter.prepare(baseline),node=(w,name)=>w.nodes.find(n=>n.name===name);
test('version and complete inspected code/graph changes fail closed; preparation preserves credentials/settings',()=>{
 for(const mutate of [w=>w.versionId='later',w=>w.activeVersionId='later',w=>w.active=false,w=>w.nodes[0].parameters.path='other',w=>w.connections.Webhook.main=[]]){const w=structuredClone(baseline);mutate(w);assert.throws(()=>adapter.prepare(w));}
 const w=structuredClone(baseline);w.settings={executionOrder:'v1'};node(w,'TailorModel').credentials={openAiApi:{id:'synthetic-reference',name:'Synthetic credential'}};const c=adapter.prepare(w);assert.deepEqual(c.settings,w.settings);assert.deepEqual(node(c,'Tailor sources model').credentials,node(w,'TailorModel').credentials);assert.ok(!JSON.stringify(adapter.diff(w,c)).includes('synthetic-reference'));assert.deepEqual(w.nodes.length,10);
});
test('ordinary Tailor node parameters and graph are retained; validation returns the identical no-source input',()=>{
 for(const n of baseline.nodes){if(n.name!=='Validate + Normalize')assert.deepEqual(node(prepared,n.name),n);}
 for(const [name,edges] of Object.entries(baseline.connections)){if(name!=='Validate + Normalize')assert.deepEqual(prepared.connections[name],edges);}
 const r=f.request();delete r.sourceContext;delete r.sourcesSchemaVersion;
 assert.deepEqual(runCode(node(prepared,'Validate + Normalize').parameters.jsCode,{body:r}),runCode(node(baseline,'Validate + Normalize').parameters.jsCode,{body:r}));
 assert.deepEqual(prepared.connections['Tailor has answer sources?'].main[1],baseline.connections['Validate + Normalize'].main[0]);
});
test('actual prepared model expressions use current sources; receipt survives whole prepared response path',async()=>{
 let calls=0;const r=f.request(),before=structuredClone(r);
 const handle=createHarness({model:(input,messages,parameters)=>{calls++;assert.deepEqual(input,p.modelInput(r));assert.equal(parameters.simplify,false);assert.equal(parameters.options.store,false);assert.equal(parameters.options.maxTokens,4000);assert.match(messages[0].content,/requested language/);assert.ok(!JSON.stringify(input).includes('ADVISORY'));return response(f.model(input));}});
 const d=await handle(r);assert.equal(d.status,200);p.validateCandidate(r,d.body);assert.equal(calls,1);assert.deepEqual(r,before);assert.equal(d.body.sourceUsage.length,2);assert.ok(!d.visited.includes('Merge'));assert.ok(!d.visited.includes('Deterministic Apply + Canonicalize'));assert.ok(d.body.blocks[2].text.includes('did not lead customer'));assert.equal(d.body.blocks[0].text,r.blocks[0].text);
});
test('unsupported/invalid source requests return 400 without ever reaching a model',async()=>{
 let calls=0;const handle=createHarness({model:()=>{calls++;return response({});}});
 for(const mutate of [r=>r.sourcesSchemaVersion='2.0',r=>delete r.sourceContext,r=>r.sourceContext.answers[0].revision=0,r=>r.sourceContext.questions[0].status='bad',r=>r.extra=true]){const r=f.request();mutate(r);const d=await handle(r);assert.equal(d.status,400);assert.equal(d.body.ok,false);assert.ok(!d.visited.includes('Tailor sources model'));assert.equal(JSON.stringify(d.body).includes('planned a release'),false);}
 assert.equal(calls,0);
});
test('Code sandbox needs no TextEncoder/crypto/import globals; UTF-8 size limit rejects oversized Unicode sources',async()=>{
 const r=f.request();r.sourceContext.answers[0].text='At Example Studio, I tested café flows 😀.\nI did not lead customer workshops.';
 const handle=createHarness({model:input=>response(f.model(input))});const d=await handle(r);p.validateCandidate(r,d.body);assert.equal(d.body.sourceUsage[0].sourceQuote,r.sourceContext.answers[0].text);
 for(let i=0;i<4;i++)r.blocks.push({...r.blocks[0],blockId:'large-'+i,order:100+i,text:'中'.repeat(95000)});
 const tooLarge=await handle(r);assert.equal(tooLarge.status,413);assert.ok(!tooLarge.visited.includes('Tailor sources model'));
});
test('refusal, truncation, tool call, malformed/ambiguous JSON and bad source output fail without repair or CV leakage',async()=>{
 const valid=response(f.model(p.modelInput(f.request())));
 const variants=[v=>v.status='incomplete',v=>v.incomplete_details={reason:'max_output_tokens'},v=>v.output[0].content[0]={type:'refusal',refusal:'No'},v=>v.output.push({type:'function_call'}),v=>delete v.output[0].status,v=>v.output[0].content[0].text='```json\n{}\n```',v=>v.output[0].content.push(v.output[0].content[0]),v=>v.output[0].content[0].text='{"additions":[],"contextQuestions":[],"edits":[]}',v=>v.output[0].content[0].text=JSON.stringify({additions:[{...f.model(p.modelInput(f.request())).additions[0],sourceQuote:'invented'}],contextQuestions:[]})];
 for(const mutate of variants){let calls=0;const raw=structuredClone(valid);mutate(raw);const d=await createHarness({model:()=>{calls++;return raw;}})(f.request());assert.equal(d.status,422);assert.equal(d.body.ok,false);assert.deepEqual(d.body.blocks,[]);assert.equal(calls,1);assert.ok(!JSON.stringify(d.body).includes('planned a release'));}
 const d=await createHarness({model:()=>{throw Error('secret/provider detail');}})(f.request());assert.equal(d.status,503);assert.ok(!JSON.stringify(d.body).includes('secret'));assert.equal(node(prepared,'Tailor sources model').retryOnFail,false);assert.equal(node(prepared,'Tailor sources model').onError,'continueRegularOutput');
});
test('prepared path preserves multi-Apply corrections across blocks and freezes uncertain old wording',async()=>{
 const handle=createHarness({model:input=>response(f.model(input))});let r=f.request();
 const apply=d=>{r={...r,blocks:structuredClone(d.body.blocks),sourceContext:{...r.sourceContext,applications:structuredClone(d.body.sourceApplications)}};};
 let d=await handle(r);apply(d);r.sourceContext.answers[1].revision=2;r.sourceContext.answers[1].text='In Community Project, I attended two workshops. A colleague facilitated them.';d=await handle(r);p.validateCandidate(r,d.body);apply(d);
 r.sourceContext.answers[0].revision=2;r.sourceContext.answers[0].text='No';r.sourceContext.questions[0].status='no';d=await handle(r);p.validateCandidate(r,d.body);assert.equal(d.body.blocks[1].text,f.blocks[1].text);assert.ok(d.body.blocks[2].text.includes('A colleague facilitated'));apply(d);
 r.blocks[2].text+=' Manual clarification.';r.sourceContext.questions[1].status='skipped';r.sourceContext.answers[1].revision++;d=await handle(r);assert.equal(d.body.blocks[2].text,r.blocks[2].text);assert.equal(d.body.sourceReview[0].reason,'text_changed');p.validateCandidate(r,d.body);
});
test('context needs, skipped sources and mixed limitations remain detached and source-traceable',async()=>{
 const handle=createHarness({model:input=>response(f.model(input))});let r=f.request();r.sourceContext.answers[0].text='I planned a release.';let d=await handle(r);assert.equal(d.body.contextQuestions[0].reason,'context_unclear');assert.equal(d.body.blocks[1].text,r.blocks[1].text);
 r.sourceContext.answers[0].text='At Another Company, I planned a release.';d=await handle(r);assert.equal(d.body.contextQuestions[0].reason,'new_block_required');assert.equal(d.body.blocks.length,r.blocks.length);
 r.sourceContext.questions[0].status='skipped';d=await handle(r);assert.ok(!d.body.sourceUsage.some(u=>u.answerId==='a1'));assert.ok(d.body.sourceUsage[0].sourceQuote.includes('did not lead customer'));assert.ok(d.body.sourceUsage[0].proposedQuote.includes('did not lead customer'));
});
test('review artifacts match candidate hashes; frontend matches the exact approved gate before or after release',()=>{
 const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
 const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8').replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n'),hash=s=>crypto.createHash('sha256').update(s,'utf8').digest('hex');
 const manifest=JSON.parse(read('dev-system/prepared/tailor-sources.release-manifest.json')),patch=read('dev-system/prepared/tailor-sources.frontend-enable.patch'),source=read('webflow/src/drafted-editor.js');
 assert.equal(manifest.workflowDiffSha256,hash(read('dev-system/prepared/tailor-sources.workflow.diff.json')));assert.equal(manifest.adapterSha256,hash(read('backend/n8n-tailor-sources-candidate.cjs')));assert.deepEqual(manifest.sharedSourceSha256,adapter.hashes());assert.equal(manifest.frontendEnablePatchSha256,hash(patch));
 const current=source.split(/\r?\n/).find(l=>l.startsWith('const tailorSourcesEnabled=')),released=patch.split('\n').find(l=>l.startsWith('+const tailorSourcesEnabled=')).slice(1);
 // The frozen whole-editor hash records DEV-080; later UI work may change the
 // editor while the exact approved transport gate and backend hashes stay fixed.
 const before=patch.split('\n').find(l=>l.startsWith('-const tailorSourcesEnabled=')).slice(1);assert.ok(current===before||current===released);assert.match(manifest.frontendSourceSha256,/^[a-f0-9]{64}$/);
 const evaluate=(line,hostname,endpoints={})=>vm.runInNewContext(line.replace('const tailorSourcesEnabled=','').replace(/;$/,''),{location:{hostname},window:Object.keys(endpoints).length?{__DRAFTED_PREVIEW_ENDPOINTS__:endpoints}:{},draftedEndpoints:endpoints,N8N_TAILOR_URL:endpoints.tailor||'https://drafted.app.n8n.cloud/webhook/tailor-cv'});
 assert.equal(evaluate(before,'drafted.example'),false);assert.equal(evaluate(current,'drafted.example'),current===released);assert.equal(evaluate(released,'drafted.example'),true);assert.equal(evaluate(released,'drafted.example',{tailor:'/other'}),false);assert.equal(evaluate(released,'127.0.0.1',{tailor:'/preview-api/tailor',tailorSources:true}),true);
 const x=JSON.parse(read('dev-system/prepared/tailor-sources.examples.json'));p.validateCandidate(x.request,x.response);p.validateCandidate(x.correctionRequest,x.correctionResponse);
});
