'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),C=require('../webflow/src/experience-context.js'),P=require('../webflow/src/tailor-sources-v11.js'),R=require('../backend/tailor-whole-cv/runtime.cjs'),{Session}=require('../webflow/src/experience-discovery.js'),F=require('./fixtures/structured-experience-context.cjs'),h=require('./helpers/tailor-workflow-harness.cjs');
const copy=x=>structuredClone(x);
function session(){let n=0;const s=new Session({id:()=>`s${++n}`});s.setContext({revision:'context1',cvVersionId:'cv1',blocks:F.blocks,jobContext:F.jobContext});s.plan({contextRevision:'context1',topics:[{key:'planning',question:'Have you helped with planning?',support:'unclear',evidence:[],signalRefs:[{field:'topPriorities',index:0}]}]},'en');s.start();s.submit('Coordinated internal planning sessions.');return s;}
function request(s){return {cvVersionId:s.snapshot().context.cvVersionId,cvTitle:'Fixture',targetRole:'',language:'en',blocksSchemaVersion:'1.0',blocks:copy(s.snapshot().context.blocks),jobContextSchemaVersion:'1.0',jobContext:F.jobContext,sourcesSchemaVersion:'1.2',sourceContext:s.sourceContext()};}
function assign(s,block=F.blocks.find(b=>b.blockId==='experience-2')){const a=s.snapshot().answers[0];s.assignExperienceContext(a.id,a.currentRevision,C.reference('cv1',block));}
function generate(r,raw){const scope='structured_test',catalog=R.catalog(r,scope),model=raw?raw(catalog):F.model(catalog.modelInput);const d=P.candidate(r,R.compile(r,model,scope),{id:()=> 'app1'});P.validateCandidate(r,d);return d;}
test('atomic context revision preserves original answer/CV and binds distinct roles at the same employer',()=>{
 const s=session(),original=s.snapshot();assign(s);const after=s.snapshot(),a=after.answers[0];assert.equal(a.currentRevision,2);assert.equal(a.revisions[1].text,a.revisions[0].text);assert.equal(a.revisions[1].experienceContext.blockId,'experience-2');assert.deepEqual(after.context,original.context);
 const r=request(s),catalog=R.catalog(r,'test'),source=catalog.sources[0];assert.deepEqual(source.allowedTargets,[catalog.targets.find(t=>t.blockId==='experience-2').targetKey]);assert(!r.sourceContext.answers[0].text.includes('Context:'));const d=generate(r);assert.equal(d.sourceUsage[0].blockId,'experience-2');assert.deepEqual(r.blocks,original.context.blocks);
});
test('changing choice and editing source text retain separate original/context revisions; duplicate stale save is atomic',()=>{
 const s=session();assign(s);let a=s.snapshot().answers[0];s.assignExperienceContext(a.id,2,C.reference('cv1',F.blocks[1]));const before=s.snapshot();assert.throws(()=>s.assignExperienceContext(a.id,2,C.reference('cv1',F.blocks[1])),/STALE_ANSWER/);assert.deepEqual(s.snapshot(),before);
 s.correct(a.questionId);s.submit('Corrected source wording.');a=s.snapshot().answers[0];assert.equal(a.currentRevision,4);assert.equal(a.revisions.at(-1).experienceContext.blockId,F.blocks[1].blockId);assert.equal(a.revisions[1].experienceContext.blockId,'experience-2');
});
test('invalid local choice never changes state; server keeps typed stale/forged references unresolved, never remaps',()=>{
 for(const change of [c=>c.blockId='missing',c=>c.cvVersionId='other-cv',c=>c.snapshot.roleOrProject='Forged role',c=>c.blockId='summary-1']){
  const s=session(),c=C.reference('cv1',F.blocks[1]);change(c);const before=s.snapshot();assert.throws(()=>s.assignExperienceContext(before.answers[0].id,1,c));assert.deepEqual(s.snapshot(),before);
  const r=request(s);r.sourceContext.answers[0].experienceContext=c;const d=generate(r);assert.deepEqual(d.blocks,r.blocks);assert.equal(d.sourceUsage.length,0);assert.equal(d.contextQuestions[0].reason,'reference_unresolved');assert.deepEqual(r.sourceContext.answers[0].experienceContext,c);
 }
});
test('explicit target wins over misleading employer words; a model cannot select a different role or summary',()=>{
 const s=session();assign(s);const r=request(s);r.sourceContext.answers[0].text+=' In a different role at Example Studio.';
 for(const id of ['experience-1','summary-1'])assert.throws(()=>generate(r,c=>({cvEdits:[],contextQuestions:[],additions:[{sourceKey:c.sources[0].sourceKey,targetKey:c.targets.find(t=>t.blockId===id).targetKey,text:'Coordinated internal planning sessions.'}]})));
 const d=generate(r,c=>({cvEdits:[],additions:[],contextQuestions:[{sourceKey:c.sources[0].sourceKey,reason:'context_unclear'}]}));assert.equal(d.contextQuestions.length,0);
});
test('new employer, independent project and unclear employment relation stay unplaced and survive transport',()=>{
 for(const value of [{kind:'other',companyOrContext:'New company',roleOrProject:'Project lead',period:'2021–2022'},{kind:'other',companyOrContext:'',roleOrProject:'Independent accessibility project',period:''},{kind:'other',companyOrContext:'Shared initiative',roleOrProject:'Internal project; employer relation not specified',period:''}]){
  const s=session(),a=s.snapshot().answers[0];s.assignExperienceContext(a.id,1,value);const r=request(s),before=copy(r);const d=generate(r);assert.equal(d.contextQuestions[0].reason,'new_block_required');assert.equal(d.sourceUsage.length,0);assert.deepEqual(d.blocks,r.blocks);assert.deepEqual(r,before);assert.deepEqual(r.sourceContext.answers[0].experienceContext,value);
 }
});
test('old text Context and missing display metadata remain usable; schema downgrade cannot discard structured context',()=>{
 const s=session(),a=s.snapshot().answers[0];s.appendContext(a.id,1,'Example Studio, Product Specialist, 2022');let r=request(s);delete r.sourceContext.answers[0].experienceContext;const c=R.catalog(r,'legacy');assert(c.sources[0].allowedTargets.includes(c.targets.find(t=>t.blockId==='experience-1').targetKey));
 s.assignExperienceContext(a.id,2,C.reference('cv1',F.blocks.at(-1)));r=request(s);assert.equal(r.sourceContext.answers[0].text,'Coordinated internal planning sessions.');assert.equal(C.resolve(r.sourceContext.answers[0].experienceContext,'cv1',r.blocks).status,'resolved');
 assert.throws(()=>P.validateRequest({...r,sourcesSchemaVersion:'1.1'}));assert.throws(()=>P.validateRequest({...r,sourceContext:{...r.sourceContext,answers:[{...r.sourceContext.answers[0],experienceContext:null}]}}));
});
test('prepared n8n Code prefixes execute actual validator/compiler with model-only fixtures; malformed input fails closed',()=>{
 const s=session();assign(s);const r=request(s),code=require('../backend/n8n-structured-context.cjs').snippets(),validated=h.runCode(code.validate,{body:r},{},'local123');assert.equal(validated.status,200);
 const result=h.runCode(code.compose,h.response(F.model(JSON.parse(validated.llmMessages[1].content))),{'Validate + Normalize':{json:validated}},'local123');assert.equal(result.status,200);assert.equal(result.body.sourceUsage[0].blockId,'experience-2');P.validateCandidate(r,result.body);
 const bad=copy(r);bad.sourceContext.answers[0].experienceContext.extra='untrusted';assert.equal(h.runCode(code.validate,{body:bad},{},'local124').status,400);
 const legacy={...copy(r),sourcesSchemaVersion:'1.1'};delete legacy.sourceContext.answers[0].experienceContext;
 const fallback='return [{json:{legacy:true}}];';assert.equal(h.runCode(code.validate+fallback,{body:legacy},{},'legacy').legacy,true);assert.equal(h.runCode(code.compose+fallback,{}, {'Validate + Normalize':{json:{sourceRequest:legacy}}},'legacy').legacy,true);
});
test('unplaced contexts cannot hide malformed, duplicate or conflicting model selections',()=>{
 const s=session(),a=s.snapshot().answers[0];s.assignExperienceContext(a.id,1,{kind:'other',companyOrContext:'',roleOrProject:'Independent project',period:''});const r=request(s);
 for(const shape of ['duplicate','unknown','conflict'])assert.throws(()=>generate(r,c=>{const addition={sourceKey:c.sources[0].sourceKey,targetKey:c.targets[0].targetKey,text:'A claim.'};return {cvEdits:[],additions:shape==='duplicate'?[addition,addition]:shape==='unknown'?[{...addition,targetKey:'foreign'}]:[addition],contextQuestions:shape==='conflict'?[{sourceKey:addition.sourceKey,reason:'new_block_required'}]:[]};}));
});
test('adopting another CV version preserves source/context history and explicitly makes its old reference unresolved',()=>{
 const s=session();assign(s);const old=s.snapshot().answers;s.adoptRepresentation(copy(F.blocks),'cv2');assert.deepEqual(s.snapshot().answers,old);const d=generate(request(s));assert.equal(d.contextQuestions[0].reason,'reference_unresolved');assert.equal(d.sourceUsage.length,0);
});
