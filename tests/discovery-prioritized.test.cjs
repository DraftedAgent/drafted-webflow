const {test}=require('node:test'),assert=require('node:assert/strict'),h=require('./helpers/discovery-prioritized-harness.cjs'),f=require('./fixtures/discovery-batches.cjs');
test('prepared workflow changes only plan prompt; strict single ownership and source compiler remain identical',async()=>{
 const before=structuredClone(h.baseline),after=structuredClone(h.definition),name='Build discovery prompt';after.nodes.find(n=>n.name===name).parameters.jsCode=before.nodes.find(n=>n.name===name).parameters.jsCode;assert.deepEqual(after,before);
 const r={schemaVersion:'1.0',operation:'plan',requestId:'r',contextRevision:'c',conversationLanguage:'en',cvVersionId:'v',blocksSchemaVersion:'1.0',blocks:f.blocks,jobContextSchemaVersion:'1.0',jobContext:f.jobContext};
 const result=await h.createHarness({model:data=>{assert.match(data.messages,/compare each ad priority/);assert.match(data.messages,/Never pad/);assert.match(data.messages,/exact source selection and single signal ownership/);return f.discoveryModel(data);}})(r);assert.equal(result.status,200);assert.equal(result.body.result.topics.length,12);
});
