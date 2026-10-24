'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),P=require('../evaluation/model-pilot.cjs'),R=require('../backend/model-contracts-runtime.cjs'),B=require('../evaluation/baseline.cjs'),H=require('./helpers/model-contracts-harness.cjs'),mock=require('../evaluation/mock-provider.cjs');
const approve=m=>({approved:true,manifestSha256:m.manifestSha256,materialsSha256:m.materialsSha256,sourcesSha256:m.sourcesSha256,maxCalls:72,maxCostUSD:100,inputUSDPerMillion:1,outputUSDPerMillion:1});
test('exact synthetic manifest is deterministic; 18 cases/72 calls and no provider execution on prepare',()=>{
 const m=P.manifest();assert.deepEqual(P.verify(m),m);assert.equal(m.cases.length,18);assert.equal(m.runs.length,72);for(const op of ['plan','interpret','tailor'])assert.equal(m.cases.filter(c=>c.operation===op).length,6);assert.throws(()=>P.verify({...m,settings:{...m.settings,model:'changed'}}),/DRIFT/);assert.throws(()=>P.validateApproval(m,{...approve(m),approved:false}),/APPROVAL/);
});
test('mock all72 measures plumbing only; raw failures are distinct from backend outcomes',async()=>{
 const m=P.manifest(),report=await P.run({manifest:m,provider:mock});assert.equal(report.calls,72);assert.equal(report.externalCallsAttempted,0);assert.equal(report.productionReliabilityClaim,false);assert.equal(report.releaseApproved,false);assert.equal(report.manualReviewRequired,true);assert.equal(report.variation.length,36);assert.equal(report.results.some(r=>r.abortReason),false);
 const c=m.cases.find(c=>c.id==='tailor-context'),b=R.prepare('tailor',c.request,'scope'),raw={additions:[{sourceKey:b.input.sources[0].sourceKey,targetKey:b.input.targets.find(t=>t.type==='experience').targetKey,text:'Supported internal workshops.'}],contextQuestions:[]};assert.equal(R.assess(b,raw).referencesValid,false);assert.equal(R.compose(b,raw).outcome,'needs_context');
});
test('live gate refuses missing approval/budget before a call; uncertain cost stops without retry',async()=>{
 const m=P.manifest();let calls=0;const provider=async()=>{calls++;throw Error('private provider text');};await assert.rejects(P.run({manifest:m,provider,mode:'approved'}),/APPROVAL/);assert.equal(calls,0);
 let report=await P.run({manifest:m,provider,mode:'approved',approval:{...approve(m),maxCostUSD:0.000001}});assert.equal(calls,0);assert.equal(report.stopReason,'cost_cap');
 report=await P.run({manifest:m,provider,mode:'approved',approval:approve(m)});assert.equal(calls,1);assert.equal(report.calls,1);assert.equal(report.costUncertain,true);assert.equal(report.stopReason,'PILOT_PROVIDER_FAILED');assert.ok(!JSON.stringify(report).includes('private provider text'));
});
test('invalid usage stops with uniform result; usage/model recorded separately from content validity',async()=>{
 const m=P.manifest(),report=await P.run({manifest:m,mode:'approved',approval:approve(m),provider:async()=>({envelope:H.envelope({}),model:'gpt-4.1-mini',usage:{input_tokens:1,output_tokens:-1}})});assert.equal(report.calls,1);assert.equal(report.stopReason,'PILOT_USAGE_INVALID');assert.ok(Object.values(report.groups).every(g=>Number.isFinite(g.shapeValid)));assert.equal(report.costUncertain,true);
});
test('actual baseline and candidate Code compose their own approved-format fixtures',()=>{
 const c=P.manifest().cases.find(c=>c.id==='interpret-concrete');for(const core of [B,R]){const b=core.prepare(c.operation,c.request,'scope'),raw=core===B?{drafts:[{proposedText:'Supported release tests.',sourceQuote:c.request.sourceAnswer.text,coveredQuestionIds:[]}]}:{drafts:[{proposedText:'Supported release tests.',coveredQuestionKeys:[]}]};const done=core===B?core.compose(b,H.envelope(raw)):core.compose(b,raw);assert.equal(done.outcome,'answer_accounts');assert.equal(done.body.result.drafts[0].sourceQuote,c.request.sourceAnswer.text);}
});
test('HTTP provider is approved, hash-bound, no retries, fixed endpoint and no storage; injected transport only',async()=>{
 const m=P.manifest(),approval=approve(m);let calls=0;const factory=require('../evaluation/provider.cjs').createProvider;assert.throws(()=>factory({apiKey:'synthetic-key',manifest:m,approval:{...approval,approved:false}}),/APPROVAL/);
 const provider=factory({apiKey:'synthetic-key',manifest:m,approval,fetch:async(url,options)=>{calls++;assert.equal(url,'https://api.openai.com/v1/responses');const body=JSON.parse(options.body);assert.equal(body.store,false);assert.equal(body.model,'gpt-4.1-mini');assert.equal(body.max_output_tokens,4000);return {ok:true,json:async()=>({usage:{input_tokens:1,output_tokens:1},model:'gpt-4.1-mini'})};}});
 const spec=m.runs[0],c=m.cases.find(c=>c.id===spec.caseId),b=B.prepare(c.operation,c.request,spec.scope);await provider({messages:b.messages,settings:m.settings,spec});assert.equal(calls,1);await assert.rejects(provider({messages:b.messages,settings:m.settings,spec}),/BINDING/);assert.equal(calls,1);
});
