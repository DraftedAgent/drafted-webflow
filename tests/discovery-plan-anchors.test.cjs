const {test}=require('node:test'),assert=require('node:assert/strict');
const p=require('../backend/discovery-plan-anchors.cjs'),c=require('../webflow/src/experience-discovery-contract.js'),f=require('./fixtures/tailor-sources.cjs');
function request(){return {schemaVersion:'1.0',operation:'plan',requestId:'req-1',contextRevision:'ctx-1',conversationLanguage:'en',cvVersionId:'cv-1',blocksSchemaVersion:'1.0',blocks:structuredClone(f.blocks),jobContextSchemaVersion:'1.0',jobContext:structuredClone(f.jobContext)};}
function output(r){return {modelFormat:p.FORMAT,requestId:r.requestId,contextRevision:r.contextRevision,topics:[{key:'planning',question:'Have you helped plan a delivery?',signalIds:['signal_topPriorities_0'],support:'clear',evidenceIds:['source_1']}]};}
test('server materializes exact original block text, including whitespace/unicode/negation, with unchanged IDs/input',()=>{
 const r=request();r.blocks[1].text='Supported planning.\r\n\t“Internal only” — not customer work.\nI did not lead.';const before=JSON.stringify(r),input=p.modelInput(r),result=p.compile(r,output(r));
 assert.equal(input.evidence[1].text,r.blocks[1].text);assert.deepEqual(result.topics[0].evidence,[{blockId:r.blocks[1].blockId,quote:r.blocks[1].text}]);c.validateResult(r,result);assert.equal(JSON.stringify(r),before);
});
test('model cannot submit a paraphrase/quote/index; old format and extra fields are rejected rather than repaired',()=>{
 const r=request();for(const key of ['quote','evidence','signalRefs','blockId']){const bad=output(r);bad.topics[0][key]='invented';assert.throws(()=>p.compile(r,bad));}
 const old={topics:[{key:'planning',question:'Question?',signalRefs:[{field:'topPriorities',index:0}],support:'clear',evidence:[{blockId:r.blocks[1].blockId,quote:'Invented quotation'}]}]};assert.throws(()=>p.compile(r,old));
});
test('unknown/wrong/stale sources and duplicate references fail closed without changing the request',()=>{
 const r=request(),before=JSON.stringify(r);
 for(const kind of ['signal','evidence','request','context','duplicate','crossTopic']){const bad=output(r);if(kind==='signal')bad.topics[0].signalIds=['signal_mustHave_13'];if(kind==='evidence')bad.topics[0].evidenceIds=['missing'];if(kind==='request')bad.requestId='old';if(kind==='context')bad.contextRevision='old';if(kind==='duplicate')bad.topics[0].evidenceIds.push('source_1');if(kind==='crossTopic')bad.topics.push({...bad.topics[0],key:'different'});assert.throws(()=>p.compile(r,bad));}
 assert.equal(JSON.stringify(r),before);
});
test('unclear remains a neutral question without evidence; no catalog text becomes experience',()=>{
 const r=request(),raw=output(r);raw.topics[0].support='unclear';raw.topics[0].evidenceIds=[];const result=p.compile(r,raw);assert.deepEqual(result.topics[0].evidence,[]);
 const {Session}=require('../webflow/src/experience-discovery.js'),session=new Session();session.setContext({revision:r.contextRevision,cvVersionId:r.cvVersionId,blocks:r.blocks,jobContext:r.jobContext});session.plan({contextRevision:r.contextRevision,topics:result.topics},'en');assert.equal(session.round().total,1);assert.deepEqual(session.snapshot().context.blocks,r.blocks);
});
test('empty source text is not offered and empty signal lists cannot support a topic',()=>{
 const r=request();r.blocks[0].text='  ';r.jobContext.topPriorities=[];r.jobContext.mustHave=[];assert.equal(p.modelInput(r).evidence.length,r.blocks.length-1);assert.equal(p.modelInput(r).signals.length,0);assert.throws(()=>p.compile(r,output(r)));const empty=output(r);empty.topics=[];assert.deepEqual(p.compile(r,empty),{topics:[]});
});
