const {test}=require('node:test'),assert=require('node:assert/strict'),p=require('../backend/discovery-plan-assignments.cjs'),f=require('./fixtures/tailor-sources.cjs');
function request(){return {schemaVersion:'1.0',operation:'plan',requestId:'req',contextRevision:'ctx',conversationLanguage:'en',cvVersionId:'cv',blocksSchemaVersion:'1.0',blocks:structuredClone(f.blocks),jobContextSchemaVersion:'1.0',jobContext:structuredClone(f.jobContext)};}
function output(r){const input=p.modelInput(r);return {modelFormat:p.FORMAT,requestId:r.requestId,contextRevision:r.contextRevision,topics:[{key:'planning',question:'Have you helped plan a delivery?',support:'unclear',evidenceIds:[]},{key:'workshops',question:'Have you helped run a workshop?',support:'unclear',evidenceIds:[]}],signalTopics:Object.fromEntries(input.signals.map((s,i)=>[s.id,i===0?'planning':'workshops']))};}
test('each input signal has one topic owner; generated public refs cannot repeat across topics',()=>{
 const r=request(),raw=output(r),before=JSON.stringify(r),result=p.compile(r,raw),refs=result.topics.flatMap(t=>t.signalRefs.map(x=>x.field+':'+x.index));assert.equal(new Set(refs).size,refs.length);assert.equal(result.topics.length,2);assert.equal(JSON.stringify(r),before);
});
test('overlapping signals may share one focused topic; disjoint questions are not merged',()=>{
 const r=request();r.jobContext.mustHave=['Coordinate a release'];const raw=output(r);raw.signalTopics.signal_mustHave_0='planning';const result=p.compile(r,raw);assert.equal(result.topics[0].signalRefs.length,2);assert.equal(result.topics[1].signalRefs.length,1);assert.equal(result.topics[1].question,raw.topics[1].question);
});
test('arrays/missing/unknown assignments, orphan topics and old duplicate lists fail rather than being silently repaired',()=>{
 const r=request();for(const kind of ['array','missing','foreign','orphan','oldList','unknownTopic']){const bad=output(r);if(kind==='array')bad.signalTopics.signal_topPriorities_0=['planning','workshops'];if(kind==='missing')delete bad.signalTopics.signal_topPriorities_0;if(kind==='foreign')bad.signalTopics.invented='planning';if(kind==='orphan')bad.signalTopics.signal_topPriorities_0=null;if(kind==='oldList')bad.topics[1].signalIds=['signal_topPriorities_0'];if(kind==='unknownTopic')bad.signalTopics.signal_topPriorities_0='missing-topic';assert.throws(()=>p.compile(r,bad));}
});
test('stale responses are rejected; full exact source including negative scope survives successful compilation',()=>{
 const r=request();r.blocks[1].text+='\r\nI did not lead; internal support only.';const raw=output(r);raw.topics[0].support='clear';raw.topics[0].evidenceIds=['source_1'];assert.equal(p.compile(r,raw).topics[0].evidence[0].quote,r.blocks[1].text);raw.contextRevision='old';assert.throws(()=>p.compile(r,raw));
});
test('empty plans require explicit null assignments; an empty catalog cannot invent topics',()=>{
 const r=request(),raw=output(r);raw.topics=[];for(const k of Object.keys(raw.signalTopics))raw.signalTopics[k]=null;assert.deepEqual(p.compile(r,raw),{topics:[]});r.jobContext.topPriorities=[];r.jobContext.mustHave=[];const empty={...raw,signalTopics:{}};assert.deepEqual(p.compile(r,empty),{topics:[]});empty.topics=[{key:'invented',question:'Question?',support:'unclear',evidenceIds:[]}];assert.throws(()=>p.compile(r,empty));
});
