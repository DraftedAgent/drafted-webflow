'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const p=require('../webflow/src/tailor-sources.js'),f=require('./fixtures/tailor-sources.cjs'),{Session}=require('../webflow/src/experience-discovery.js');
const generate=r=>p.candidate(r,f.model(p.modelInput(r)));
function apply(r,d){return {...structuredClone(r),blocks:structuredClone(d.blocks),sourceContext:{...structuredClone(r.sourceContext),applications:structuredClone(d.sourceApplications)}};}
test('current raw sources reach matching existing work/project sections, not summary; metadata intact',()=>{
 const r=f.request(),before=structuredClone(r),d=generate(r);p.validateCandidate(r,d);assert.deepEqual(r,before);assert.equal(d.blocks[0].text,r.blocks[0].text);assert.ok(d.blocks[1].text.includes('I planned a release'));assert.ok(d.blocks[2].text.includes('internal workshops'));assert.ok(d.blocks[2].text.includes('did not lead customer'));assert.equal(d.sourceUsage.length,2);assert.equal(d.blocks.length,r.blocks.length);
 for(const b of d.blocks){const {text,...meta}=b,{text:old,...expected}=r.blocks.find(x=>x.blockId===b.blockId);assert.deepEqual(meta,expected);}
 assert.equal(JSON.stringify(p.modelInput(r)).includes('ADVISORY'),false);
});
test('missing context asks where; unsupported new setting requires a new block without summary fallback',()=>{
 const r=f.request();r.sourceContext.answers[0].text='I planned a release with two developers.';let d=generate(r);assert.equal(d.contextQuestions[0].reason,'context_unclear');assert.equal(d.blocks[1].text,r.blocks[1].text);
 r.sourceContext.answers[0].text='At Another Company, I planned a release.';d=generate(r);assert.equal(d.contextQuestions[0].reason,'new_block_required');assert.equal(d.blocks[0].text,r.blocks[0].text);
});
test('No, unknown, skipped, editing, processing and failed cannot become positive sources',()=>{
 for(const status of ['no','unknown','skipped','editing','processing','error','needs_detail']){const r=f.request();r.sourceContext.questions[0].status=status;const d=generate(r);assert.ok(!d.sourceUsage.some(u=>u.answerId==='a1'));const malicious=f.model(p.modelInput(f.request()));assert.throws(()=>p.candidate(r,malicious));}
});
test('source revision, quote, target, structure and exact response are validated',()=>{
 for(const change of [m=>m.additions[0].answerRevision=9,m=>m.additions[0].sourceQuote='fabricated',m=>m.additions[0].blockId='new-block',m=>m.additions[0].contextQuote='',m=>m.additions[0].unexpected=true]){const r=f.request(),m=f.model(p.modelInput(r));change(m);assert.throws(()=>p.candidate(r,m));}
 for(const change of [d=>d.blocks[1].employer='Another Company',d=>d.blocks[0].text+=' invented',d=>d.sourceUsage.pop(),d=>d.sourceContextRevision='old',d=>d.sourceApplications[0].additions[0].start=0]){const r=f.request(),d=generate(r);change(d);assert.throws(()=>p.validateCandidate(r,d));}
});
test('all additions from a source are replaced across blocks after multiple Apply cycles',()=>{
 let r=f.request();r.sourceContext.answers[0].text+=' I use Python to prepare release reports.';
 const base=f.model(p.modelInput(r)),item=base.additions[0];base.additions.push({...item,blockId:'skills-1',text:'I use Python to prepare release reports.',contextQuote:''});
 // Explicitly exercise multi-target source dependencies, independent of fixture routing.
 base.additions[0]={...item,blockId:'experience-1',text:'I planned a release with two developers.',contextQuote:r.sourceContext.answers[0].text};
 const ledger=new p.Ledger();let d=p.candidate(r,base);ledger.commit(r,d);r=apply(r,d);
 r.sourceContext.answers[1].revision=2;r.sourceContext.answers[1].text='In Community Project, I attended two internal workshops; a colleague facilitated them.';
 d=generate(r);ledger.commit(r,d);r=apply(r,d);assert.ok(d.blocks[2].text.includes('a colleague facilitated'));assert.equal(d.blocks[1].text.includes('planned a release'),true);
 r.sourceContext.answers[0].revision=2;r.sourceContext.answers[0].text='No';r.sourceContext.questions[0].status='no';
 d=generate(r);p.validateCandidate(r,d);assert.ok(!d.blocks[1].text.includes('planned a release'));assert.ok(!d.blocks[3].text.includes('Python'));assert.ok(d.blocks[2].text.includes('a colleague facilitated'));ledger.commit(r,d);assert.equal(ledger.history.filter(h=>h.answerId==='a1'&&h.status==='superseded').length,2);
 assert.ok(!JSON.stringify(p.modelInput(r)).includes('I planned a release with two developers.'));
});
test('successive sources in the same block retain exact spans when an earlier source is corrected',()=>{
 let r=f.request();r.sourceContext.answers[1].text='At Example Studio, I coordinated testing with a designer.';let d=generate(r);r=apply(r,d);
 assert.equal(r.sourceContext.applications[0].additions.length,2);
 r.sourceContext.answers[0].revision=2;r.sourceContext.answers[0].text='At Example Studio, I supported release testing, not planning.';d=generate(r);r=apply(r,d);p.validateRequest(r);
 assert.ok(!d.blocks[1].text.includes('I planned'));assert.ok(d.blocks[1].text.includes('I coordinated testing'));assert.ok(d.blocks[1].text.includes('not planning'));
 r.sourceContext.answers[1].revision=2;r.sourceContext.questions[1].status='skipped';d=generate(r);assert.ok(!d.blocks[1].text.includes('coordinated testing'));assert.ok(d.blocks[1].text.includes('not planning'));
});
test('changed earlier text freezes that entire block; no automatic deletion or reuse as model facts',()=>{
 let r=f.request(),d=generate(r);r=apply(r,d);r.blocks[1].text=r.blocks[1].text.replace('planned','helped plan');r.sourceContext.answers[0].revision=2;r.sourceContext.answers[0].text='No';r.sourceContext.questions[0].status='no';const before=r.blocks[1].text;
 d=generate(r);assert.equal(d.blocks[1].text,before);assert.equal(d.sourceReview[0].reason,'text_changed');assert.ok(!p.modelInput(r).blocks.some(b=>b.blockId==='experience-1'));assert.ok(d.sourceApplications.some(g=>g.blockId==='experience-1'));p.validateCandidate(r,d);
});
test('missing historical source is review-only, never assumed withdrawn',()=>{
 let r=f.request(),d=generate(r);r=apply(r,d);r.sourceContext.answers.shift();r.sourceContext.questions[0].status='unanswered';d=generate(r);assert.equal(d.blocks[1].text,r.blocks[1].text);assert.equal(d.sourceReview[0].reason,'source_unavailable');
});
test('repeated generation/Apply does not duplicate unchanged source additions',()=>{
 let r=f.request(),d=generate(r);r=apply(r,d);const again=generate(r);assert.deepEqual(again.blocks,d.blocks);assert.equal(again.sourceUsage.length,0);assert.deepEqual(again.sourceApplications,d.sourceApplications);
});
test('original sources/revisions survive context clarification, adoption and repeated corrections',()=>{
 const s=new Session();s.setContext({revision:'ctx',cvVersionId:'cv',blocks:f.blocks,jobContext:f.jobContext});s.plan({contextRevision:'ctx',topics:[{key:'a',support:'unclear',question:'Where have you planned a delivery?',signalRefs:[{field:'topPriorities',index:0}]}]},'en');s.start();s.submit('I planned a release.');const a=s.snapshot().answers[0],origin=structuredClone(a.context);s.appendContext(a.id,1,'At Example Studio');assert.equal(s.snapshot().answers[0].revisions[0].text,'I planned a release.');assert.equal(s.sourceContext().answers[0].revision,2);s.adoptRepresentation(f.blocks,'cv');assert.deepEqual(s.snapshot().answers[0].context,origin);assert.equal(s.round().phase,'complete');s.correct(s.round().queue[0].id);assert.equal(s.sourceContext().questions[0].status,'editing');s.submit('No');assert.equal(s.sourceContext().answers[0].revision,3);assert.equal(s.snapshot().answers[0].revisions.length,3);
});
test('bounds, duplicate application identities and injected-provider errors fail safely',async()=>{
 const r=f.request();r.sourceContext.answers[0].text='x'.repeat(50001);assert.throws(()=>p.validateRequest(r));
 const {createHandler}=require('../backend/tailor-sources.cjs');assert.equal((await createHandler({model:()=>{throw Error('private');}})(f.request())).status,503);assert.equal((await createHandler({model:()=>({additions:[],contextQuestions:[],extra:true})})(f.request())).status,422);
 let applied=apply(f.request(),generate(f.request()));applied.sourceContext.applications[1].additions[0].id=applied.sourceContext.applications[0].additions[0].id;assert.throws(()=>p.validateRequest(applied));
});

test('uncertain current source freezes earlier text until resolved; it is not a retraction',()=>{for(const status of ['editing','processing','error','needs_detail','unknown']){let r=f.request(),d=generate(r);r=apply(r,d);r.sourceContext.questions[0].status=status;r.sourceContext.answers[0].revision++;d=generate(r);assert.equal(d.blocks[1].text,r.blocks[1].text);assert.equal(d.sourceReview[0].reason,'source_uncertain');}});
test('context correction replaces active context while retaining complete prior revisions',()=>{const s=new Session();s.setContext({revision:'ctx',cvVersionId:'cv',blocks:f.blocks,jobContext:f.jobContext});s.plan({contextRevision:'ctx',topics:[{key:'x',support:'unclear',question:'Have you done this?',signalRefs:[{field:'topPriorities',index:0}]}]},'en');s.start();s.submit('I planned a release.');const a=s.snapshot().answers[0];s.appendContext(a.id,1,'At Example Studio');const old=s.sourceContext().contextRevision;s.appendContext(a.id,2,'In Community Project');assert.equal(s.sourceContext().answers[0].text,'I planned a release.\n\nContext: In Community Project');assert.notEqual(s.sourceContext().contextRevision,old);assert.ok(s.snapshot().answers[0].revisions[1].text.includes('At Example Studio'));assert.equal(s.snapshot().answers[0].revisions[0].text,'I planned a release.');});
test('skills and education can receive grounded additions; ambiguous employment must ask for context',()=>{let r=f.request();r.sourceContext.answers[0].text='I use Python to prepare reports.';let d=generate(r);assert.ok(d.blocks.find(b=>b.type==='skills').text.includes('Python'));assert.equal(d.blocks.find(b=>b.type==='summary').text,r.blocks[0].text);r=f.request();r.blocks.push({blockId:'education-1',type:'education',label:'Education',order:50,text:'Studied information systems.',institution:'Example University',degree:'BSc',program:'Information Systems',startDate:'2018',endDate:'2021'});r.sourceContext.answers[0].text='At Example University, I built a scheduling tool during a course.';d=p.candidate(r,{additions:[{blockId:'education-1',text:'Built a scheduling tool during a course.',answerId:'a1',answerRevision:1,sourceQuote:r.sourceContext.answers[0].text,contextQuote:r.sourceContext.answers[0].text}],contextQuestions:[]});assert.ok(d.blocks.at(-1).text.includes('scheduling tool'));r=f.request();r.blocks.push({...r.blocks[1],blockId:'experience-2',title:'Researcher'});assert.equal(generate(r).contextQuestions[0].reason,'context_unclear');});

test('Unicode source text and UTF-16 application ranges survive Apply and correction exactly',()=>{let r=f.request();r.sourceContext.answers[0].text='At Example Studio, I tested a café flow with colleagues 😀.\n\nI did not lead customer workshops.';let d=generate(r);p.validateCandidate(r,d);assert.equal(d.sourceUsage[0].sourceQuote,r.sourceContext.answers[0].text);r=apply(r,d);p.validateRequest(r);r.sourceContext.answers[0].revision=2;r.sourceContext.answers[0].text='No';r.sourceContext.questions[0].status='no';d=generate(r);assert.equal(d.blocks[1].text,f.blocks[1].text);});

test('several explicitly located examples in one answer stay in their own sections and all follow its correction',()=>{let r=f.request();r.sourceContext.questions[1].status='skipped';r.sourceContext.answers=r.sourceContext.answers.slice(0,1);r.sourceContext.answers[0].text='At Example Studio, I planned a release with two developers.\n\nIn Community Project, I supported internal workshops. I did not lead customer sessions.\n\nI use Python to prepare reports.';let d=generate(r);assert.equal(d.sourceUsage.length,3);assert.ok(d.blocks[1].text.includes('planned a release'));assert.ok(!d.blocks[1].text.includes('workshops'));assert.ok(d.blocks[2].text.includes('internal workshops'));assert.ok(d.blocks[3].text.includes('Python'));r=apply(r,d);r.sourceContext.answers[0].revision=2;r.sourceContext.answers[0].text='No';r.sourceContext.questions[0].status='no';d=generate(r);assert.deepEqual(d.blocks,f.blocks);});
