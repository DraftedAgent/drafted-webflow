const {test}=require('node:test'),assert=require('node:assert/strict');
const h=require('./helpers/discovery-assignments-harness.cjs'),provider=require('./fixtures/discovery-assignments.cjs'),f=require('./fixtures/tailor-sources.cjs'),p=require('../backend/discovery-plan-assignments.cjs');
function request(){return {schemaVersion:'1.0',operation:'plan',requestId:'req',contextRevision:'ctx',conversationLanguage:'en',cvVersionId:'cv',blocksSchemaVersion:'1.0',blocks:structuredClone(f.blocks),jobContextSchemaVersion:'1.0',jobContext:structuredClone(f.jobContext)};}
test('actual seven-node graph compiles assignment format in string and object mode',async()=>{
 for(const parsedOutput of [false,true]){
  const r=request();r.blocks[1].text+='\r\nI did not lead; internal support only.';
  const before=JSON.stringify(r);const out=await h.createHarness({parsedOutput,model:data=>{const raw=provider.model(data);raw.topics[0].support='clear';raw.topics[0].evidenceIds=[data.input.evidence[1].id];return raw;}})(r);
  assert.equal(out.status,200);assert.equal(out.diagnostic,null);assert.equal(out.visited.at(-1),'Respond discovery');
  assert.equal(JSON.stringify(r),before);assert.equal(out.body.result.topics[0].evidence[0].quote,r.blocks[1].text);
 }
});
test('nine topics retain unique ownership and original order',async()=>{
 const r=request();r.jobContext.mustHave=Array.from({length:9},(_,i)=>'Requirement '+i);
 const out=await h.createHarness({model:({input,messages})=>{
  assert.ok(messages.includes('Preserve negation'));assert.ok(messages.includes('signalTopics'));assert.ok(!messages.includes('topics:[{key,question,signalIds'));
  return {modelFormat:p.FORMAT,requestId:r.requestId,contextRevision:r.contextRevision,topics:r.jobContext.mustHave.map((_,i)=>({key:'topic'+i,question:'Have you helped with activity '+i+'?',support:'unclear',evidenceIds:[]})),signalTopics:Object.fromEntries(input.signals.map(s=>[s.id,s.field==='mustHave'?'topic'+s.index:null]))};
 }})(r);
 assert.equal(out.status,200);const topics=out.body.result.topics,refs=topics.flatMap(t=>t.signalRefs.map(x=>x.field+':'+x.index));assert.equal(topics.length,9);assert.equal(new Set(refs).size,9);assert.equal(topics[8].key,'topic8');
});
test('multiple owners, orphan, old format and stale context fail explicitly without repair',async()=>{
 for(const kind of ['array','orphan','legacy','stale']){
  const out=await h.createHarness({model:data=>{const raw=provider.model(data),id=Object.keys(raw.signalTopics).find(k=>raw.signalTopics[k]);if(kind==='array')raw.signalTopics[id]=[raw.signalTopics[id],'other'];if(kind==='orphan')raw.topics.push({key:'orphan',question:'Question?',support:'unclear',evidenceIds:[]});if(kind==='legacy')raw.modelFormat='discovery-plan-anchors-1';if(kind==='stale')raw.contextRevision='old';return raw;}})(request());
  assert.equal(out.status,422);assert.ok(out.diagnostic.reason);assert.ok(!JSON.stringify(out.diagnostic).includes('Requirement'));
 }
});
test('candidate changes exactly two code fields, leaves model/settings/graph intact and rejects drift',()=>{
 const before=structuredClone(h.baseline),after=structuredClone(h.definition);
 for(const name of ['Build discovery prompt','Validate model response']){const a=after.nodes.find(n=>n.name===name),b=before.nodes.find(n=>n.name===name);assert.notEqual(a.parameters.jsCode,b.parameters.jsCode);a.parameters.jsCode=b.parameters.jsCode;}
 assert.deepEqual(after,before);assert.throws(()=>require('../backend/n8n-discovery-plan-assignments-candidate.cjs').prepare({...before,versionId:'changed'}));
});
test('explicit handler uses assignments; interpret prompt remains identical',async()=>{
 const result=await require('../backend/experience-discovery.cjs').createHandler({planFormat:'assignments-1',model:provider.model})(request());assert.equal(result.status,200);
 const baseline=h.baseline.nodes.find(n=>n.name==='Build discovery prompt').parameters.jsCode;
 const updated=h.definition.nodes.find(n=>n.name==='Build discovery prompt').parameters.jsCode;
 const r={...request(),operation:'interpret',roundId:'round',questionId:'q',questions:[{id:'q',topicKey:'planning',question:'Have you helped plan?',signalRefs:[{field:'topPriorities',index:0}]}],sourceAnswer:{id:'answer',revision:3,text:'No. I helped internally; I did not lead.'}};
 const old=require('./helpers/discovery-anchors-harness.cjs');assert.equal(old.run(updated,{request:r},r).promptText,old.run(baseline,{request:r},r).promptText);
 const model=()=>({drafts:[{proposedText:r.sourceAnswer.text,sourceQuote:r.sourceAnswer.text,coveredQuestionIds:[]}]});
 assert.deepEqual(await h.createHarness({model})(r),await h.createHarness({model,definition:h.baseline})(r));
});
