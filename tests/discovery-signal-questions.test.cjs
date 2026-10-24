'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),p=require('../backend/discovery-signal-questions-proposal.cjs'),old=require('../backend/discovery-plan-assessments.cjs'),h=require('./helpers/discovery-signal-questions-harness.cjs'),f=require('./fixtures/tailor-sources.cjs'),{Session}=require('../webflow/src/experience-discovery.js');
function request(){return {schemaVersion:'1.0',operation:'plan',requestId:'req',contextRevision:'ctx',conversationLanguage:'en',cvVersionId:'cv',blocksSchemaVersion:'1.0',blocks:structuredClone(f.blocks),jobContextSchemaVersion:'1.0',jobContext:structuredClone(f.jobContext)};}
function output(r){return {modelFormat:p.FORMAT,requestId:r.requestId,contextRevision:r.contextRevision,assessments:Object.fromEntries(p.modelInput(r).signals.map(s=>[s.id,{kind:'question',question:'Have you helped with '+s.text.toLowerCase()+'?'}]))};}
const supported=()=>({kind:'cv_supported',evidenceIds:['source_1'],explanation:'Original evidence describes the synthetic internal activity and its limits.'});
const notActionable=()=>({kind:'not_actionable',reason:'not_experience_requirement',explanation:'Synthetic availability condition; no experience question is needed.'});
test('reproduces reported UNASSIGNED_TOPIC; question owners generate assigned topics without filtering drafts',async()=>{
 const r=request(),orphan={modelFormat:old.FORMAT,requestId:r.requestId,contextRevision:r.contextRevision,topics:[{key:'owned',question:'Have you helped plan a delivery?'},{key:'orphan',question:'Have you facilitated a workshop?'}],assessments:Object.fromEntries(old.modelInput(r).signals.map(s=>[s.id,{kind:'question',topicKey:'owned'}]))};
 const before=await h.createHarness({definition:h.baseline,model:()=>orphan})(r);assert.equal(before.status,422);assert.equal(before.diagnostic.reason,'UNASSIGNED_TOPIC');
 const raw=output(r),ids=Object.keys(raw.assessments);raw.assessments[ids[1]]={kind:'same_question',questionSignalId:ids[0]};const after=await h.createHarness({model:()=>raw})(r);assert.equal(after.status,200);assert.equal(after.body.result.topics.length,1);assert.equal(after.body.result.topics[0].signalRefs.length,2);
 const extra={...raw,topics:[{key:'orphan',question:'Extra draft?'}]};assert.throws(()=>p.compile(r,extra));assert.equal((await h.createHarness({model:()=>extra})(r)).status,422);
});
test('every valid question owns a signal; empty questions require explicit non-question assessments',()=>{
 const r=request();r.jobContext.mustHave=['Independent synthetic requirement'];
 for(let mask=0;mask<27;mask++){
  const raw=output(r),ids=Object.keys(raw.assessments);let n=mask,expected=0;
  for(const id of ids){const kind=n%3;n=Math.floor(n/3);if(kind===1)raw.assessments[id]=supported();else if(kind===2)raw.assessments[id]=notActionable();else expected++;}
  const review=p.review(r,raw);assert.equal(review.result.topics.length,expected);assert.ok(review.result.topics.every(t=>t.signalRefs.length>0));assert.equal(review.counts.question,expected);assert.equal(review.audit.length,ids.length);
 }
});
test('unknown/self/cyclic/chained/non-question owners and missing/null/extra signal assessments fail closed',async()=>{
 const r=request(),raw=output(r),ids=Object.keys(raw.assessments);
 for(const mutate of [v=>delete v.assessments[ids[0]],v=>v.assessments[ids[0]]=null,v=>v.assessments.foreign=supported(),v=>v.assessments[ids[0]]={kind:'same_question',questionSignalId:'foreign'},v=>v.assessments[ids[0]]={kind:'same_question',questionSignalId:ids[0]},v=>{v.assessments[ids[0]]={kind:'same_question',questionSignalId:ids[1]};v.assessments[ids[1]]={kind:'same_question',questionSignalId:ids[0]};},v=>{v.assessments[ids[0]]={kind:'same_question',questionSignalId:ids[1]};v.assessments[ids[1]]=supported();},v=>v.assessments[ids[0]].question='',v=>v.assessments[ids[0]].topicKey='invented']){
  const bad=structuredClone(raw);mutate(bad);assert.throws(()=>p.compile(r,bad));const d=await h.createHarness({model:()=>bad})(r);assert.equal(d.status,422);assert.equal(d.body.result,undefined);
 }
});
test('source evidence, negation/scope audit, schema binding and original request remain unchanged',()=>{
 const r=request();r.blocks[1].text+='\nInternal support only; did not lead customer sessions.';const before=structuredClone(r),raw=output(r),ids=Object.keys(raw.assessments);raw.assessments[ids[0]]=supported();const reviewed=p.review(r,raw);assert.equal(reviewed.audit[0].evidence[0].quote,r.blocks[1].text);assert.equal(reviewed.audit[0].interpretationIsAdvisory,true);assert.deepEqual(r,before);
 for(const evidenceIds of [[],['invented'],['source_1','source_1']]){const bad=structuredClone(raw);bad.assessments[ids[0]].evidenceIds=evidenceIds;assert.throws(()=>p.compile(r,bad));}
 for(const field of ['modelFormat','requestId','contextRevision']){const bad=structuredClone(raw);bad[field]='stale';assert.throws(()=>p.compile(r,bad),/STALE_SIGNAL_QUESTIONS/);}
});
test('complete supported/not-actionable zero retains existing explicit audit; unassessed zero stays a failure',async()=>{
 const r=request(),raw=output(r),ids=Object.keys(raw.assessments);raw.assessments[ids[0]]=supported();raw.assessments[ids[1]]=notActionable();let d=await h.createHarness({model:()=>raw})(r);assert.equal(d.status,200);assert.deepEqual(d.body.result,{topics:[]});assert.equal(d.diagnostic.reason,'EMPTY_PLAN_MIXED_ASSESSMENTS');
 d=await h.createHarness({model:()=>({...raw,assessments:{}})})(r);assert.equal(d.status,422);assert.equal(d.body.result,undefined);
 r.jobContext.topPriorities=[];d=await h.createHarness({model:()=>({...raw,assessments:{}})})(r);assert.equal(d.status,200);assert.equal(d.diagnostic.reason,'EMPTY_SIGNAL_CATALOG');
});
test('actual prepared Code accepts string/parsed outputs with new messages and unchanged public result',async()=>{
 const r=request(),before=structuredClone(r);
 for(const parsedOutput of [false,true]){let calls=0;const d=await h.createHarness({parsedOutput,model:data=>{calls++;assert.equal(data.input.modelFormat,p.FORMAT);assert.match(data.messages,/questionSignalId/);assert.ok(!data.messages.includes('topics:[{key,question}]'));return output(r);}})(r);assert.equal(d.status,200);assert.equal(calls,1);assert.equal(d.body.schemaVersion,'1.0');assert.equal(d.body.result.topics.length,2);assert.deepEqual(r,before);}
});
test('13 real assigned questions keep the existing first-five and optional continuation flow',()=>{
 const r=request();r.jobContext.topPriorities=Array.from({length:8},(_,i)=>({signal:'Synthetic priority '+i,weight:5-i%5}));r.jobContext.mustHave=Array.from({length:5},(_,i)=>'Synthetic requirement '+i);const topics=p.compile(r,output(r)).topics;assert.equal(topics.length,13);const s=new Session();s.setContext({revision:r.contextRevision,cvVersionId:r.cvVersionId,blocks:r.blocks,jobContext:r.jobContext});s.plan({contextRevision:r.contextRevision,topics},'en');assert.equal(s.round().total,5);assert.equal(s.moreCount(),8);s.start();for(let i=0;i<5;i++)s.skip();assert.equal(s.round().phase,'complete');assert.equal(s.continueQuestions(),true);assert.equal(s.moreCount(),3);assert.deepEqual(s.snapshot().context.blocks,r.blocks);
});
test('interpreting a raw answer is byte-equivalent; model/settings/response schema and graph remain unchanged',async()=>{
 const before=structuredClone(h.baseline),after=structuredClone(h.definition);for(const name of ['Build discovery prompt','Validate model response'])after.nodes.find(n=>n.name===name).parameters.jsCode=before.nodes.find(n=>n.name===name).parameters.jsCode;assert.deepEqual(after,before);
 const r={...request(),operation:'interpret',roundId:'round',questionId:'q',questions:[{id:'q',topicKey:'key',question:'Have you helped?',signalRefs:[{field:'topPriorities',index:0}]}],sourceAnswer:{id:'answer',revision:3,text:'I supported internally; I did not lead customer sessions.'}},model=()=>({drafts:[{proposedText:r.sourceAnswer.text,sourceQuote:r.sourceAnswer.text,coveredQuestionIds:[]}]});assert.deepEqual(p.prompts(r),old.prompts(r));assert.deepEqual(await h.createHarness({model})(r),await h.createHarness({model,definition:h.baseline})(r));
 assert.throws(()=>require('../backend/n8n-discovery-signal-questions-proposal.cjs').prepare(before),/DISCOVERY_BASE_CHANGED/);
});
