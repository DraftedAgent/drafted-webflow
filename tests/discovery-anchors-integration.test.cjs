const {test}=require('node:test'),assert=require('node:assert/strict'),anchors=require('../backend/discovery-plan-anchors.cjs'),patch=require('../backend/n8n-discovery-plan-anchors-candidate.cjs'),h=require('./helpers/discovery-anchors-harness.cjs'),f=require('./fixtures/tailor-sources.cjs');
function request(){return {schemaVersion:'1.0',operation:'plan',requestId:'req-1',contextRevision:'ctx-1',conversationLanguage:'en',cvVersionId:'cv-1',blocksSchemaVersion:'1.0',blocks:structuredClone(f.blocks),jobContextSchemaVersion:'1.0',jobContext:structuredClone(f.jobContext)};}
function output(input){return {modelFormat:input.modelFormat,requestId:input.requestId,contextRevision:input.contextRevision,topics:[{key:'planning',question:'Have you helped plan a delivery?',signalIds:[input.signals[0].id],support:'clear',evidenceIds:[input.evidence[1].id]}]};}
test('prepared actual n8n Code/graph emits unchanged public envelope with original full quote for string AND parsed-object model text',async()=>{
 for(const parsedOutput of [false,true]){const r=request();r.blocks[1].text+='\r\nI did not lead; only internal support.';const before=JSON.stringify(r);let calls=0;
  const result=await h.createHarness({parsedOutput,model:({input,messages})=>{calls++;assert.ok(!Object.hasOwn(input,'blocks'));assert.ok(messages.includes('never emit indices, quotes or block IDs'));assert.ok(messages.includes('Talk like a helpful colleague'));return output(input);}})(r);
  assert.equal(result.status,200);assert.equal(result.body.result.topics[0].evidence[0].quote,r.blocks[1].text);assert.equal(JSON.stringify(r),before);assert.equal(result.body.requestId,r.requestId);assert.equal(calls,1);assert.deepEqual(result.warnings,[]);
 }
});
test('actual result gate rejects unknown/stale/extra/old format with safe diagnostics; no model failure fallback',async()=>{
 for(const kind of ['unknown','stale','quote','old','provider']){const r=request(),result=await h.createHarness({model:({input})=>{const raw=output(input);if(kind==='unknown')raw.topics[0].evidenceIds=['private-unknown-id'];if(kind==='stale')raw.contextRevision='old';if(kind==='quote')raw.topics[0].quote='private generated text';if(kind==='old')return {topics:[]};if(kind==='provider')throw Error('private provider detail');return raw;}})(r);
  assert.equal(result.status,kind==='provider'?503:422);assert.equal(result.body.ok,false);assert.ok(!JSON.stringify(result).includes('private'));if(kind==='unknown'){assert.equal(result.diagnostic.reason,'UNKNOWN_EVIDENCE_SOURCE');assert.equal(result.diagnostic.path,'$.topics[0].evidenceIds[0]');}
 }
});
test('interpret prompt/results remain identical and invalid requests never reach provider',async()=>{
 const r=request();Object.assign(r,{operation:'interpret',roundId:'round',questionId:'q',questions:[{id:'q',topicKey:'planning',question:'Have you helped plan?',signalRefs:[{field:'topPriorities',index:0}]}],sourceAnswer:{id:'answer',revision:3,text:'No. I helped internally; I did not lead.'}});
 const d=patch.prepare(h.baseline),oldPrompt=h.baseline.nodes.find(n=>n.name==='Build discovery prompt').parameters.jsCode,newPrompt=d.nodes.find(n=>n.name==='Build discovery prompt').parameters.jsCode;assert.equal(h.run(newPrompt,{request:r},r).promptText,h.run(oldPrompt,{request:r},r).promptText);
 const model=()=>({drafts:[{proposedText:r.sourceAnswer.text,sourceQuote:r.sourceAnswer.text,coveredQuestionIds:[]}]});
 const oldResult=await h.createHarness({definition:h.baseline,model})(r),nextResult=await h.createHarness({model})(r);assert.deepEqual(nextResult.body,oldResult.body);assert.equal(nextResult.status,200);
 let calls=0;const invalid=await h.createHarness({model:()=>calls++})({bad:true});assert.equal(invalid.status,400);assert.equal(calls,0);
});
test('only two Code strings change; prepared patch rejects version drift and duplicate application',()=>{
 const next=patch.prepare(h.baseline),restored=structuredClone(next),changed=[];for(const n of restored.nodes){const before=h.baseline.nodes.find(b=>b.id===n.id);if(JSON.stringify(n)!==JSON.stringify(before)){changed.push(n.name);n.parameters.jsCode=before.parameters.jsCode;}}
 assert.deepEqual(changed.sort(),['Build discovery prompt','Validate model response']);assert.deepEqual(restored,h.baseline);assert.throws(()=>patch.prepare(next));assert.throws(()=>patch.prepare({...h.baseline,activeVersionId:'changed'}));
});
test('explicit injected handler uses anchors only when selected; never accepts legacy plan as anchor success',async()=>{
 const {createHandler}=require('../backend/experience-discovery.cjs'),r=request();const ok=await createHandler({planFormat:'anchors-1',model:({input})=>output(input)})(r);assert.equal(ok.status,200);
 const bad=await createHandler({planFormat:'anchors-1',model:()=>({topics:[]})})(r);assert.equal(bad.status,422);assert.throws(()=>createHandler({planFormat:'unknown',model:()=>{}}));
});
