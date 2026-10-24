'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const refs=require('../backend/tailor-source-references.cjs'),p=require('../webflow/src/tailor-sources.js');
const f=require('./fixtures/tailor-source-references.cjs'),adapter=require('../backend/n8n-tailor-source-references.cjs');
const {createHarness,definition,response,runCode}=require('./helpers/tailor-references-harness.cjs');
const node=(w,name)=>w.nodes.find(n=>n.name===name);
test('catalog binds execution keys to unchanged sources, original identity and revision; model sees only aliases',()=>{
 const r=f.request();r.sourceContext.answers[0].revision=4;r.sourceContext.answers[0].text='At Example Studio, I supported testing, not planning.\nI did not lead customer sessions. 😀';
 const before=structuredClone(r),c=refs.catalog(r,'exec_1'),s=c.sources[0],target=c.targets.find(t=>t.blockId==='experience-1');
 assert.equal(c.modelInput.format,refs.FORMAT);assert.equal(s.answerId,'a1');assert.equal(s.answerRevision,4);assert.equal(s.text,r.sourceContext.answers[0].text);assert.ok(s.allowedTargets.includes(target.targetKey));assert.equal(Object.hasOwn(c.modelInput.sources[0],'answerId'),false);
 const raw={additions:[{sourceKey:s.sourceKey,targetKey:target.targetKey,text:'Supported testing, not planning; did not lead customer sessions.'}],contextQuestions:[]};
 const out=refs.compile(r,raw,'exec_1');assert.deepEqual(out.additions[0],{blockId:'experience-1',text:raw.additions[0].text,answerId:'a1',answerRevision:4,sourceQuote:s.text,contextQuote:s.text});p.validateCandidate(r,p.candidate(r,out));assert.deepEqual(r,before);
 assert.throws(()=>refs.compile(r,raw,'exec_2'),/UNKNOWN_SOURCE_KEY/);
});
test('invalid, stale, foreign, duplicate and conflicting selections reject without dropping or repairing',()=>{
 const r=f.request(),c=refs.catalog(r,'test'),raw=f.model(c.modelInput),a=raw.additions[0];
 for(const mutate of [x=>x.extra=true,x=>x.additions[0].answerId='a1',x=>x.additions[0].sourceKey='a1',x=>x.additions[0].targetKey='experience-1',x=>x.additions.push({...a}),x=>x.contextQuestions.push({sourceKey:a.sourceKey,reason:'context_unclear'}),x=>x.contextQuestions.push({sourceKey:'missing',reason:'context_unclear'}),x=>x.additions[0].text=' ',x=>x.additions[0].text='x'.repeat(10001),x=>x.additions=Array(101).fill(a)]){const v=structuredClone(raw);mutate(v);assert.throws(()=>refs.compile(r,v,'test'));}
 assert.throws(()=>refs.compile(r,{additions:[],contextQuestions:[{sourceKey:a.sourceKey,reason:'invalid'}]},'test'));
 assert.throws(()=>refs.compile(r,{additions:[],contextQuestions:[{sourceKey:a.sourceKey,reason:'context_unclear'},{sourceKey:a.sourceKey,reason:'context_unclear'}]},'test'));
});
test('missing/ambiguous employment context cannot select employment; clarification uses current original ID/revision',()=>{
 const r=f.request();r.sourceContext.answers[0].text='I supported testing, not planning.';r.sourceContext.answers[0].revision=3;
 let c=refs.catalog(r,'ctx'),s=c.sources[0],t=c.targets.find(t=>t.blockId==='experience-1');
 assert.ok(!s.allowedTargets.includes(t.targetKey));assert.throws(()=>refs.compile(r,{additions:[{sourceKey:s.sourceKey,targetKey:t.targetKey,text:'Supported testing.'}],contextQuestions:[]},'ctx'),/UNSUPPORTED_SOURCE_TARGET/);
 let out=refs.compile(r,{additions:[],contextQuestions:[{sourceKey:s.sourceKey,reason:'context_unclear'}]},'ctx');assert.deepEqual(out.contextQuestions,[{answerId:'a1',answerRevision:3,reason:'context_unclear'}]);
 r.blocks.push({...r.blocks[1],blockId:'experience-2',title:'Other role',startDate:'2020',order:25});r.sourceContext.answers[0].text='At Example Studio, I supported testing.';c=refs.catalog(r,'ctx');assert.ok(c.targets.filter(t=>t.type==='experience').every(t=>!c.sources[0].allowedTargets.includes(t.targetKey)));
 r.sourceContext.answers[0].text='At Example Studio as Product Specialist, I supported testing.';c=refs.catalog(r,'ctx');assert.ok(c.sources[0].allowedTargets.includes(c.targets.find(t=>t.blockId==='experience-1').targetKey));assert.ok(!c.sources[0].allowedTargets.includes(c.targets.find(t=>t.blockId==='experience-2').targetKey));
});
test('no/skipped/unknown/processing/editing sources remain constraints and cannot make positive additions',()=>{
 for(const status of ['no','skipped','unknown','processing','editing','needs_detail','covered','error']){
  const r=f.request();r.sourceContext.questions[0].status=status;const c=refs.catalog(r,'neg');assert.equal(c.sources.length,1);assert.equal(c.modelInput.constraints[0].text,r.sourceContext.answers[0].text);assert.equal(c.modelInput.constraints[0].status,status);
  assert.ok(!c.sources.some(s=>s.answerId==='a1'));assert.throws(()=>refs.compile(r,{additions:[{sourceKey:'a1',targetKey:c.targets[0].targetKey,text:'Invented claim'}],contextQuestions:[]},'neg'));
 }
});
test('actual prepared Code roundtrip resolves mixed answers literally, no private IDs/quotes supplied by model',async()=>{
 const r=f.request(),before=structuredClone(r);let calls=0;
 const handle=createHarness({model:(input,messages)=>{calls++;assert.equal(input.format,refs.FORMAT);assert.match(messages[0].content,/NOT proof/);assert.equal(JSON.stringify(input).includes('ADVISORY'),false);return response(f.model(input));}});
 const d=await handle(r);assert.equal(d.status,200);p.validateCandidate(r,d.body);assert.equal(calls,1);assert.deepEqual(r,before);assert.ok(!d.visited.includes('Merge'));assert.equal(d.body.sourceUsage.length,2);
 assert.equal(d.body.sourceUsage[1].sourceQuote,r.sourceContext.answers[1].text);assert.equal(d.body.sourceUsage[1].contextQuote,r.sourceContext.answers[1].text);assert.match(d.body.blocks[2].text,/did not lead customer sessions/);
});
test('multiple Apply rounds replace every dependent addition while preserving other sources and freezing edited text',async()=>{
 let r=f.request();r.sourceContext.answers[0].text='At Example Studio, I planned a release.\n\nIn Community Project, I supported testing.';
 const handle=createHarness({model:input=>response(f.model(input))});
 const apply=d=>{p.validateCandidate(r,d.body);r={...r,blocks:structuredClone(d.body.blocks),sourceContext:{...r.sourceContext,applications:structuredClone(d.body.sourceApplications)}};};
 let d=await handle(r);assert.equal(d.status,200);assert.equal(d.body.sourceUsage.filter(x=>x.answerId==='a1').length,2);apply(d);
 d=await handle(r);assert.equal(d.body.sourceUsage.length,0);apply(d);
 r.sourceContext.answers[1].revision=2;r.sourceContext.answers[1].text='In Community Project, I attended workshops; a colleague facilitated them.';d=await handle(r);apply(d);
 r.sourceContext.answers[0].revision=2;r.sourceContext.answers[0].text='At Example Studio, I supported testing, not planning.\n\nIn Community Project, I observed testing, not delivery.';d=await handle(r);assert.equal(d.status,200);assert.ok(!d.body.blocks.some(b=>b.text.includes('planned a release')));assert.match(d.body.blocks[1].text,/not planning/);assert.match(d.body.blocks[2].text,/observed testing, not delivery/);assert.match(d.body.blocks[2].text,/colleague facilitated/);apply(d);
 r.sourceContext.questions[0].status='no';r.sourceContext.answers[0].revision++;r.sourceContext.answers[0].text='No';d=await handle(r);apply(d);assert.equal(r.blocks[1].text,f.blocks[1].text);assert.ok(!r.blocks[2].text.includes('observed testing'));assert.match(r.blocks[2].text,/colleague facilitated/);
 r.blocks[2].text+=' Manual clarification.';r.sourceContext.answers[1].revision++;d=await handle(r);assert.equal(d.status,200);assert.equal(d.body.blocks[2].text,r.blocks[2].text);assert.equal(d.body.sourceReview[0].reason,'text_changed');assert.equal(d.body.sourceUsage.length,0);p.validateCandidate(r,d.body);
});
test('education/project/skills placements use existing sections; no new blocks or invented context',()=>{
 const r=f.request();r.blocks.push({blockId:'edu',type:'education',label:'Education',order:50,text:'Studies',institution:'Example University',degree:'Degree',program:'Systems',startDate:'2020',endDate:'2022'});
 r.sourceContext.answers[0].text='At Example University, I studied systems design.';
 let c=refs.catalog(r,'edu');assert.ok(c.sources[0].allowedTargets.includes(c.targets.find(t=>t.blockId==='edu').targetKey));
 r.sourceContext.answers[0].text='I used Python for data checks.';c=refs.catalog(r,'skill');const target=c.targets.find(t=>t.type==='skills');const out=refs.compile(r,{additions:[{sourceKey:c.sources[0].sourceKey,targetKey:target.targetKey,text:'Python for data checks.'}],contextQuestions:[]},'skill');assert.equal(p.candidate(r,out).sourceUsage[0].blockId,'skills-1');
 r.sourceContext.answers[0].text='At Another Company, I supported testing.';c=refs.catalog(r,'new');const d=p.candidate(r,refs.compile(r,{additions:[],contextQuestions:[{sourceKey:c.sources[0].sourceKey,reason:'new_block_required'}]},'new'));assert.equal(d.blocks.length,r.blocks.length);assert.equal(d.contextQuestions[0].reason,'new_block_required');
});
test('former substring receipts do not duplicate on paraphrase; correction replaces all legacy dependent additions',()=>{
 let r=f.request();r.sourceContext.answers[0].text='At Example Studio, I planned a release.\n\nAt Example Studio, I supported testing.';
 const old={additions:r.sourceContext.answers[0].text.split('\n\n').map(text=>({blockId:'experience-1',text,answerId:'a1',answerRevision:1,sourceQuote:text,contextQuote:text})),contextQuestions:[]};
 const prior=p.candidate(r,old);r={...r,blocks:prior.blocks,sourceContext:{...r.sourceContext,applications:prior.sourceApplications}};
 let c=refs.catalog(r,'migration'),s=c.sources.find(s=>s.answerId==='a1'),t=c.targets.find(t=>t.blockId==='experience-1');assert.ok(s.alreadyAppliedTargets.includes(t.targetKey));assert.ok(!s.allowedTargets.includes(t.targetKey));
 assert.throws(()=>refs.compile(r,{additions:[{sourceKey:s.sourceKey,targetKey:t.targetKey,text:'A paraphrase must not duplicate prior text.'}],contextQuestions:[]},'migration'),/UNSUPPORTED_SOURCE_TARGET/);
 r.sourceContext.answers[0].revision++;r.sourceContext.answers[0].text='At Example Studio, I supported testing, not planning.';c=refs.catalog(r,'corrected');s=c.sources.find(s=>s.answerId==='a1');t=c.targets.find(t=>t.blockId==='experience-1');assert.ok(s.allowedTargets.includes(t.targetKey));
 const d=p.candidate(r,refs.compile(r,{additions:[{sourceKey:s.sourceKey,targetKey:t.targetKey,text:'Supported testing, not planning.'}],contextQuestions:[]},'corrected'));assert.ok(!d.blocks[1].text.includes('planned a release'));assert.equal(d.sourceApplications[0].additions.length,1);p.validateCandidate(r,d);
});
test('actual graph fails closed for invalid input, old model format, wrong keys/envelopes; no retries/fallback',async()=>{
 let calls=0;const r=f.request();r.sourcesSchemaVersion='2';let d=await createHarness({model:()=>{calls++;return response({});}})(r);assert.equal(d.status,400);assert.equal(calls,0);
 const variants=[input=>response({additions:[{blockId:'experience-1',answerId:'a1',answerRevision:1,sourceQuote:'fabricated',contextQuote:'fabricated',text:'test'}],contextQuestions:[]}),input=>response({additions:[{sourceKey:'foreign',targetKey:input.targets[0].targetKey,text:'test'}],contextQuestions:[]}),input=>({...response(f.model(input)),status:'incomplete'}),input=>{const x=response(f.model(input));x.output[0].content[0].text='```json\n{}\n```';return x;},()=>({error:{message:'private provider error'}})];
 for(const model of variants){calls=0;d=await createHarness({model:input=>{calls++;return model(input);}})(f.request());assert.ok([422,503].includes(d.status));assert.equal(calls,1);assert.deepEqual(d.body.blocks,[]);assert.ok(!JSON.stringify(d.body).includes('planned a release'));assert.ok(!d.visited.includes('TailorModel'));}
});
test('only source Code changes; legacy input and routing retained; exact live binding rejects drift',()=>{
 const historic=require('./helpers/tailor-workflow-harness.cjs'),old=require('../backend/n8n-tailor-sources-candidate.cjs').prepare(historic.baseline),prepared=definition();
 for(const n of old.nodes)if(!['Validate + Normalize','Compose source suggestion'].includes(n.name))assert.deepEqual(node(prepared,n.name),n);
 assert.deepEqual(prepared.connections,old.connections);assert.deepEqual(prepared.settings,old.settings);
 const request=f.request();delete request.sourcesSchemaVersion;delete request.sourceContext;assert.deepEqual(runCode(node(prepared,'Validate + Normalize').parameters.jsCode,{body:request}),runCode(node(old,'Validate + Normalize').parameters.jsCode,{body:request}));
 assert.throws(()=>adapter.prepare({...prepared,id:adapter.ID,versionId:adapter.BASE,activeVersionId:adapter.BASE,active:true}),/TAILOR_BASE_CHANGED/);
});
