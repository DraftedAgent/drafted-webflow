const {test}=require('node:test'),assert=require('node:assert/strict');
const patch=require('../backend/n8n-tailor-context-prompt.cjs'),old=require('../backend/n8n-tailor-sources-candidate.cjs'),f=require('./fixtures/tailor-sources.cjs'),h=require('./helpers/tailor-workflow-harness.cjs');
function workflow(){return {...old.prepare(h.baseline),versionId:patch.BASE,activeVersionId:patch.BASE};}
test('approved prompt patch changes exactly one string in one node; version drift/duplicate fail',()=>{
 const before=workflow(),after=patch.prepare(before),restored=structuredClone(after);restored.nodes.find(n=>n.name==='Validate + Normalize').parameters.jsCode=before.nodes.find(n=>n.name==='Validate + Normalize').parameters.jsCode;assert.deepEqual(restored,before);
 const doc=require('fs').readFileSync(require('path').join(__dirname,'../dev-system/TAILOR-SOURCE-FAILURE.md'),'utf8');assert.ok(doc.includes(patch.BEFORE));assert.ok(doc.includes(patch.AFTER));
 assert.throws(()=>patch.prepare({...before,versionId:'different'}));assert.throws(()=>patch.prepare(after));
});
test('patched Code source path preserves grounding rejection and existing context-question receipt',async()=>{
 const definition=patch.prepare(workflow());let prompt;
 const harness=h.createHarness({definition,model:(input,messages)=>{prompt=messages[0].content;return h.response(f.model(input));}});
 const request=f.request(),before=JSON.stringify(request),success=await harness(request);assert.equal(success.status,200);assert.equal(JSON.stringify(request),before);assert.ok(prompt.includes('literal, contiguous substrings'));
 const bad=h.createHarness({definition,model:input=>{const out=f.model(input);out.additions[0].contextQuote='In an inferred role';return h.response(out);}});assert.equal((await bad(request)).status,422);
 request.sourceContext.answers[0].text='I planned a release with two developers.';const clarification=await harness(request);assert.equal(clarification.status,200);assert.equal(clarification.body.contextQuestions[0].reason,'context_unclear');assert.equal(clarification.body.blocks[1].text,request.blocks[1].text);
});
