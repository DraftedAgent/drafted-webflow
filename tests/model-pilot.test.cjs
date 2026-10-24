'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),P=require('../evaluation/model-pilot.cjs'),R=require('../backend/model-contracts-runtime.cjs'),B=require('../evaluation/baseline.cjs'),H=require('./helpers/model-contracts-harness.cjs'),mock=require('../evaluation/mock-provider.cjs');
const approve=m=>({...P.approvalTemplate(m),approved:true,maxCostUSD:100,inputUSDPerMillion:1,outputUSDPerMillion:1});
test('exact synthetic manifest is deterministic; 18 cases/72 calls and no provider execution on prepare',()=>{
 const m=P.manifest();assert.deepEqual(P.verify(m),m);assert.equal(m.cases.length,18);assert.equal(m.runs.length,72);for(const op of ['plan','interpret','tailor'])assert.equal(m.cases.filter(c=>c.operation===op).length,6);assert.throws(()=>P.verify({...m,settings:{...m.settings,model:'changed'}}),/DRIFT/);assert.throws(()=>P.validateApproval(m,{...approve(m),approved:false}),/APPROVAL/);
});
test('mock all72 measures plumbing only; raw failures are distinct from backend outcomes',async()=>{
 const m=P.manifest(),report=await P.run({manifest:m,provider:mock});assert.equal(report.calls,72);assert.equal(report.externalCallsAttempted,0);assert.equal(report.productionReliabilityClaim,false);assert.equal(report.releaseApproved,false);assert.equal(report.manualReviewRequired,true);assert.equal(report.variation.length,36);assert.equal(report.results.some(r=>r.abortReason),false);
 const c=m.cases.find(c=>c.id==='tailor-context'),b=R.prepare('tailor',c.request,'scope'),raw={additions:[{sourceKey:b.input.sources[0].sourceKey,targetKey:b.input.targets.find(t=>t.type==='experience').targetKey,text:'Supported internal workshops.'}],contextQuestions:[]};assert.equal(R.assess(b,raw).referencesValid,false);assert.equal(R.compose(b,raw).outcome,'needs_context');
});
test('live gate rejects missing approval or a provider without durable registration before a call',async()=>{
 const m=P.manifest();let calls=0;const provider=async()=>{calls++;throw Error();};await assert.rejects(P.run({manifest:m,provider,mode:'approved'}),/APPROVAL/);await assert.rejects(P.run({manifest:m,provider,mode:'approved',approval:approve(m)}),/DURABLE_SESSION/);assert.equal(calls,0);
});

test('actual baseline and candidate Code compose their own approved-format fixtures',()=>{
 const c=P.manifest().cases.find(c=>c.id==='interpret-concrete');for(const core of [B,R]){const b=core.prepare(c.operation,c.request,'scope'),raw=core===B?{drafts:[{proposedText:'Supported release tests.',sourceQuote:c.request.sourceAnswer.text,coveredQuestionIds:[]}]}:{drafts:[{proposedText:'Supported release tests.',coveredQuestionKeys:[]}]};const done=core===B?core.compose(b,H.envelope(raw)):core.compose(b,raw);assert.equal(done.outcome,'answer_accounts');assert.equal(done.body.result.drafts[0].sourceQuote,c.request.sourceAnswer.text);}
});
test('HTTP factory requires v2 exact approval and the runner must claim its session before transport',async()=>{
 const m=P.manifest(),approval=approve(m);let calls=0;const factory=require('../evaluation/provider.cjs').createProvider;assert.throws(()=>factory({apiKey:'synthetic-key',manifest:m,approval:{...approval,approved:false}}),/APPROVAL/);
 const provider=factory({apiKey:'synthetic-key',manifest:m,approval,fetch:async()=>{calls++;throw Error();}}),spec=m.runs[0],c=m.cases.find(c=>c.id===spec.caseId),b=B.prepare(c.operation,c.request,spec.scope);await assert.rejects(provider({messages:b.messages,settings:m.settings,spec}),/NOT_STARTED/);assert.equal(calls,0);
});

test('withdrawal-only pilot restores every affected block as a detached suggestion in both profiles',()=>{
 const c=P.manifest().cases.find(c=>c.id==='tailor-withdraw-all'),before=JSON.stringify(c.request);assert.equal(c.expected.removedApplicationIds.length,3);assert.equal(c.request.sourceContext.applications.length,3);const priorQuotes=c.request.sourceContext.applications.flatMap(g=>g.additions).filter(a=>a.source.answerId==='a1').map(a=>a.source.sourceQuote);assert.equal(priorQuotes.length,2);assert.equal(priorQuotes[0],priorQuotes[1]);assert.match(priorQuotes[0],/I used Python/);
 for(const core of [B,R]){const b=core.prepare('tailor',c.request,'withdraw'),raw={additions:[],contextQuestions:[]},done=core===B?core.compose(b,H.envelope(raw)):core.compose(b,raw);assert.equal(done.outcome,'suggestion');assert.equal(done.body.sourceUsage.length,0);assert.deepEqual(done.body.blocks,c.expected.restoredBlocks);assert.equal(done.body.sourceApplications.length,0);assert.ok(Object.values(P.checks(c,done)).every(Boolean));assert.equal(JSON.stringify(c.request),before);
  const applied={...c.request,blocks:done.body.blocks,sourceContext:{...c.request.sourceContext,applications:done.body.sourceApplications}},next=core.prepare('tailor',applied,'after_apply'),again=core===B?core.compose(next,H.envelope(raw)):core.compose(next,raw);assert.equal(again.outcome,'no_changes');
 }
});

test('old material/approval and pre-v2 consent cannot authorize the revised pilot',()=>{
 const m=P.manifest(),oldHash='3266793e1bcb2100caeaf89cfd72f39f0bd85b79b498ea606e0c0263a5eb3f09';assert.notEqual(m.manifestSha256,oldHash);assert.throws(()=>P.validateApproval(m,{...approve(m),manifestSha256:oldHash}),/APPROVAL/);const a=approve(m);delete a.approvalVersion;assert.throws(()=>P.validateApproval(m,a),/APPROVAL/);
});

test('Tailor classification compares block values, ignoring object property order and retaining review warnings',()=>{
 const r=require('./fixtures/tailor-sources.cjs').request(),blocks=r.blocks.map(b=>Object.fromEntries(Object.entries(b).reverse())),body={blocks,sourceUsage:[],sourceReview:[],contextQuestions:[]};assert.equal(R.tailorOutcome(r,body),'no_changes');blocks[1].text+=' Changed.';assert.equal(R.tailorOutcome(r,body),'suggestion');body.contextQuestions=[{}];assert.equal(R.tailorOutcome(r,body),'suggestion_with_context');body.blocks=r.blocks;assert.equal(R.tailorOutcome(r,body),'needs_context');body.contextQuestions=[];body.sourceReview=[{}];assert.equal(R.tailorOutcome(r,body),'suggestion');
});

test('prepared candidate Code preserves the removal-only proposal and does not mutate its input CV',async()=>{
 const c=P.manifest().cases.find(c=>c.id==='tailor-withdraw-all'),before=JSON.stringify(c.request),result=await H.createHarness({kind:'tailor',model:()=>({additions:[],contextQuestions:[]})})(c.request);assert.equal(result.status,200);assert.deepEqual(result.body.blocks,c.expected.restoredBlocks);assert.equal(result.body.sourceUsage.length,0);assert.equal(result.body.sourceApplications.length,0);assert.equal(R.tailorOutcome(c.request,result.body),'suggestion');assert.equal(JSON.stringify(c.request),before);
});
