'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
global.DraftedCoverageContract=require('../webflow/src/cv-coverage-contract.js');global.DraftedTailorSources=require('../webflow/src/tailor-sources-v14.js');require('../webflow/src/tailor-section-review.js');
const R=global.DraftedSectionReview,P=global.DraftedTailorSources,F=require('./fixtures/tailor-language.cjs'),provider=require('../backend/tailor-language-fixture.cjs');
test('section decisions preserve untouched blocks, exact receipts, original evidence, decline and resume',async()=>{
 const request=await F.request({cv:'en',ad:'sv',answers:false}),data=await P.candidate(request,provider.model(P.makeCatalog(request,'sections')),{scope:'sections'}),initial=new P.Ledger(),session={decisions:{},ledger:R.ledger(initial)};
 const input={request,data,session,currentBlocks:request.blocks,currentLedger:initial};
 const a=await R.decide({...input,ids:['summary-1'],decision:'accept'});
 assert.deepEqual(a.blocks.find(b=>b.blockId==='summary-1'),data.blocks.find(b=>b.blockId==='summary-1'));for(const b of request.blocks.filter(b=>b.blockId!=='summary-1'))assert.deepEqual(a.blocks.find(x=>x.blockId===b.blockId),b);
 assert(a.ledger.integrations.every(g=>g.blockId==='summary-1'));assert(a.ledger.languageApplications.every(g=>g.blockId==='summary-1'));
 const b=await R.decide({...input,session:a.session,currentBlocks:a.blocks,currentLedger:a.ledger,ids:['experience-1'],decision:'decline'});assert.deepEqual(b.blocks,a.blocks);assert.deepEqual(b.ledger,a.ledger);
 const restored=await R.project(request,data,JSON.parse(JSON.stringify(b.session)));assert.deepEqual(restored.blocks,b.blocks);assert.deepEqual(restored.ledger,b.ledger);
 const c=await R.decide({...input,session:b.session,currentBlocks:b.blocks,currentLedger:b.ledger,ids:['skills-1'],decision:'accept'});assert.equal(c.blocks.find(x=>x.blockId==='experience-1').text,request.blocks.find(x=>x.blockId==='experience-1').text);
 await assert.rejects(R.decide({...input,session:c.session,currentBlocks:c.blocks,currentLedger:c.ledger,ids:['summary-1'],decision:'accept'}),/ALREADY_DECIDED/);
 const stale=structuredClone(c.blocks);stale[0].text+=' changed';await assert.rejects(R.decide({...input,session:c.session,currentBlocks:stale,currentLedger:c.ledger,ids:['project-1'],decision:'accept'}),/STALE_SECTION/);
 const bad=structuredClone(data);bad.blocks[0].text+=' tampered';await assert.rejects(R.project(request,bad,session));
});
test('accepted answer receipts remain valid for later tailoring after a partial translation',async()=>{
 const request=await F.request({cv:'en',ad:'sv',answers:true}),data=await P.candidate(request,provider.model(P.makeCatalog(request,'answer-sections')),{scope:'answer-sections'}),session={decisions:{},ledger:R.ledger(new P.Ledger())};
 const result=await R.decide({request,data,session,currentBlocks:request.blocks,currentLedger:new P.Ledger(),ids:['experience-1'],decision:'accept'});
 assert(result.ledger.integrations.some(g=>g.blockId==='experience-1'&&g.segments.some(s=>s.answerSources.length)));
 assert(!result.ledger.integrations.some(g=>g.blockId==='summary-1'));
 const next=structuredClone(request);next.blocks=result.blocks;next.integrationApplications=result.ledger.integrations;next.sourceContext.applications=result.ledger.groups;next.languageApplications=result.ledger.languageApplications;
 const decision=require('../webflow/src/cv-language.js').resolve({explicitLanguage:next.languagePlan.explicitLanguage,jobText:next.jobText,blocks:next.blocks});next.languagePlan.source=decision.source;next.languagePlan.cvLanguage=decision.cvLanguage;next.language=decision.language;next.inputRef=await P.inputRef(next);await P.validateRequest(next);
});
