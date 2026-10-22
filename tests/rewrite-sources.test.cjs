'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm');
const c=require('../webflow/src/rewrite-sources-candidate.js'),f=require('./fixtures/rewrite-sources.cjs'),baseline=require('./fixtures/rewrite-baseline.safe.json'),{prepare,diff}=require('../backend/n8n-rewrite-sources-candidate.cjs');
const prepared=prepare(baseline),node=name=>prepared.nodes.find(n=>n.name===name);
const run=(name,json,base)=>vm.runInNewContext('(function(){'+node(name).parameters.jsCode+'})()',{$json:json,$input:{all:()=>[{json}],first:()=>({json})},$node:{'Validation + Normalization':{json:base}},TextEncoder},{timeout:1000});
const output=(r,value=f.output(r))=>({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(value)}]}]});
test('typed sources reuse existing discovery validation, exact keys and complete current revisions',()=>{
 c.validateRequest(f.request());
 for(const change of [r=>r.drafts=[],r=>r.sourceContext.answers[0].revision=0,r=>r.sourceContext.questions[0].signalRefs[0].index=999,r=>r.sourceContext.answers[0].questionId='q3',r=>r.sourceContext.jobContext.unknown=true,r=>r.blocks.push({...r.blocks[0]})]){const r=f.request();change(r);assert.throws(()=>c.validateRequest(r));}
});
test('professional paraphrase with raw quote receipt; existing CV, metadata and other blocks preserved',()=>{
 const r=f.request(),copy=JSON.stringify(r),d=c.candidate(r,f.output(r));c.validateCandidate(r,d);assert.equal(JSON.stringify(r),copy);assert.deepEqual(d.blocks[1],r.blocks[1]);assert.ok(d.blocks[0].text.startsWith(r.blocks[0].text+'\n\n'));assert.equal(d.sourceUsage.length,2);assert.ok(!d.blocks[0].text.includes('executive'));assert.ok(!d.blocks[0].text.includes(r.sourceContext.answers[1].text));
});
test('used receipt covers actual additions, not every supplied answer; no changes valid',()=>{
 const r=f.request(),m=f.output(r);m.updates[0].additions.pop();const d=c.candidate(r,m);assert.deepEqual(d.sourceUsage.map(u=>u.answerId),['a1']);c.validateCandidate(r,d);const empty=c.candidate(r,{updates:[]});assert.deepEqual(empty.blocks,r.blocks);assert.deepEqual(empty.sourceUsage,[]);
});
test('reject missing quotes, stale revisions, wrong targets, unknown model fields and duplicate additions',()=>{
 for(const change of [m=>m.updates[0].additions[0].sourceQuote='not in any answer',m=>m.updates[0].additions[0].answerRevision=9,m=>m.updates[0].blockId='experience-1',m=>m.summary='untraced',m=>m.updates[0].additions.push(m.updates[0].additions[0])]){const r=f.request(),m=f.output(r);change(m);assert.throws(()=>c.candidate(r,m));}
});
test('reject detached response tampering, missing receipt and stale context',()=>{
 for(const change of [d=>d.blocks[0].text+=' Led customer executive sessions.',d=>d.blocks[1].employer='Invented',d=>d.sourceContextRevision='old',d=>delete d.sourceUsage,d=>d.sourceUsage[0].sourceQuote='invented']){const r=f.request(),d=c.candidate(r,f.output(r));change(d);assert.throws(()=>c.validateCandidate(r,d));}
});
test('correction after Apply replaces only known addition; no/unknown never supply positive evidence',()=>{
 const original=f.request(),d=c.candidate(original,f.output(original)),r=f.request(2);r.blocks=d.blocks;r.sourceContext.previousApplication={blockId:'summary-1',additionText:d.sourceUsage.map(u=>u.proposedQuote).join('\n'),answers:original.sourceContext.answers};const revised=c.candidate(r,f.output(r));c.validateCandidate(r,revised);assert.ok(revised.blocks[0].text.includes('facilitated by a colleague'));assert.ok(!revised.blocks[0].text.includes('Designed and facilitated'));
 const input=c.modelInput(r);assert.equal('previousApplication' in input.sourceContext,false);assert.equal(input.blocks[0].text,original.blocks[0].text);assert.equal(input.sourceContext.answers[1].revision,2);
 r.sourceContext.questions[1].status='no';r.sourceContext.answers.pop();const no=c.candidate(r,f.output(r));assert.ok(!no.blocks[0].text.includes('workshop'));assert.equal(no.sourceUsage.length,1);r.blocks[0].text+=' unrelated change';assert.throws(()=>c.validateRequest(r));
});
test('prepared EXISTING n8n nodes execute same validator/candidate code in local VM',()=>{
 const r=f.request(),validated=run('Validation + Normalization',{body:r})[0].json;assert.equal(validated.ok,true);const normalized=run('Normalize output1',output(r),validated).json;assert.equal(normalized.ok,true);const applied=run('Apply updates + Return main-format1',normalized,validated).json;c.validateCandidate(r,applied);assert.equal(applied.sourceUsage.length,2);
});
test('n8n malformed, empty, refused, incomplete and invalid source output fail closed without source logs',()=>{
 const r=f.request(),base=run('Validation + Normalization',{body:r})[0].json;
 for(const raw of [{error:'provider error with private data'},{output:[]},{status:'incomplete',output:output(r).output},{output:[{content:[{text:'{not json'}]}]},output(r,{updates:[{blockId:'unknown',additions:[]}]})]){const normalized=run('Normalize output1',raw,base).json;assert.equal(normalized.ok,false);const d=run('Apply updates + Return main-format1',normalized,base).json;assert.equal(d.ok,false);assert.equal(JSON.stringify(d).includes('private'),false);assert.equal(JSON.stringify(d).includes(r.sourceContext.answers[0].text),false);}
});
test('bad input cannot enter model; model request route bypasses detector and has no retry',()=>{
 const r=f.request();r.sourceContext.answers[0].revision=-1;const d=run('Validation + Normalization',{body:r})[0].json;assert.equal(d.ok,false);assert.equal(d.contractError.code,'INVALID_REQUEST');assert.equal(prepared.connections['Rewrite input valid?'].main[1][0].node,'Respond to Webhook1');assert.equal(prepared.connections['Rewrite has answer sources?'].main[0][0].node,'EN-EditorRewriteModel');assert.deepEqual(prepared.connections['Rewrite has answer sources?'].main[1],baseline.connections['Validation + Normalization'].main[0]);assert.equal(node('EN-EditorRewriteModel').retryOnFail,false);assert.ok(node('EN-EditorRewriteModel').parameters.options.maxTokens.includes('1600'));
});
test('ordinary no-source rewrite still uses old normalization; parse failures no longer fake success',()=>{
 const r=f.request();delete r.sourceContext;delete r.sourcesSchemaVersion;const before=structuredClone(r);const base=run('Validation + Normalization',{body:r})[0].json;assert.equal(base.ok,true);const normalized=run('Normalize output1',output(r,{updates:[{blockId:'summary-1',replacementText:'Updated existing wording.'}]}),base).json;const applied=run('Apply updates + Return main-format1',normalized,base).json;assert.equal(applied.blocks[0].text,'Updated existing wording.');assert.equal('sourceUsage' in applied,false);assert.deepEqual(r,before);for(const name of ['Apply updates + Return main-format','Apply updates + Return main-format1'])assert.equal(run(name,{ok:false,error:'legacy failure'},base).json.ok,false);
});
test('pure patch cannot overwrite changed saved/active version, no new workflow or route',()=>{
 assert.throws(()=>prepare({...baseline,activeVersionId:'changed'}));assert.throws(()=>prepare({...baseline,versionId:'changed'}));assert.equal(prepared.id,baseline.id);assert.equal(prepared.active,true);assert.deepEqual(node('Webhook'),baseline.nodes.find(n=>n.name==='Webhook'));assert.equal(diff(baseline,prepared).changes.length,13);
});
