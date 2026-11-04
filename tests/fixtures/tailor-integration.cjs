'use strict';
const F=require('./tailor-sources.cjs'),P=require('../../webflow/src/tailor-sources-v13.js'),C=require('../../webflow/src/cv-coverage-contract.js'),X=require('../../webflow/src/experience-context.js'),B=require('../../backend/cv-coverage.cjs');
async function request(language='sv'){
 const r=F.request();r.sourcesSchemaVersion='1.3';r.language=language;
 if(language==='sv')r.blocks.find(b=>b.blockId==='experience-1').text='Intervjuade fem användare och sammanställde deras synpunkter.';
 r.sourceContext.answers=[{...r.sourceContext.answers[0],text:require('../../backend/tailor-integration-fixture.cjs').answer,experienceContext:X.reference(r.cvVersionId,r.blocks[1])}];r.sourceContext.questions=r.sourceContext.questions.slice(0,1);
 r.jobText=r.jobContext.topPriorities.map(x=>x.signal).join('\n')+'\nSynthetic vacancy for local contract verification. Collaborate with internal users, preserve original facts and demonstrate clear product work in the examples supplied. No external provider is called in this study.';const a={operation:'anchorSignals',requestId:'fixture',jobText:r.jobText,jobContext:r.jobContext};r.signalCatalog=await B.compile(a,{requestId:'fixture',annotations:C.signals(r.jobContext).map((s,i)=>({signalId:s.id,sourceIds:['ad_'+i],requirement:'unspecified',requirementSourceIds:[]}))});r.integrationApplications=[];r.inputRef=await P.inputRef(r);return r;
}
function integrated(c,text){const t=c.targets.find(t=>t.blockId==='experience-1');return {integrations:[{targetKey:t.targetKey,segments:[{text,cvEvidenceKeys:c.cvEvidence.filter(e=>e.blockId===t.blockId).map(e=>e.evidenceKey),answerSourceKeys:c.sources.filter(s=>s.status==='recorded').map(s=>s.sourceKey)}]}],contextQuestions:[],reviewNotes:[]};}
module.exports={request,integrated};
