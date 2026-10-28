'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),P=require('../webflow/src/tailor-sources-v11.js'),F=require('./fixtures/tailor-whole-cv.cjs');
test('cross-block CV evidence makes remaining edits invalid after a partial acceptance; rebasing alone cannot authorize them',()=>{
 const r=F.request(),catalog=P.cvCatalog(r),summary=catalog.targets.find(t=>t.blockId==='summary-1'),experience=catalog.targets.find(t=>t.blockId==='experience-1'),source=catalog.evidence.find(t=>t.blockId==='experience-1');
 const summaryEdit={...summary,proposedText:'Product specialist sharing user feedback.',cvEvidence:[{blockId:source.blockId,quote:source.quote}]},experienceEdit={...experience,proposedText:'Collected feedback from five users.',cvEvidence:[{blockId:source.blockId,quote:source.quote}]};
 const full=P.candidate(r,{cvEdits:[summaryEdit,experienceEdit],additions:[],contextQuestions:[]});P.validateCandidate(r,full);
 const selected=P.candidate(r,{cvEdits:[experienceEdit],additions:[],contextQuestions:[]});P.validateCandidate(r,selected);
 const next={...structuredClone(r),blocks:selected.blocks,sourceContext:{...structuredClone(r.sourceContext),applications:selected.sourceApplications}};
 assert.throws(()=>P.candidate(next,{cvEdits:[summaryEdit],additions:[],contextQuestions:[]}),/INVALID_CV_EVIDENCE/);
});
