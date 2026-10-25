'use strict';
const original=require('./tailor-sources.cjs');
function request(){return {...original.request(),sourcesSchemaVersion:'1.1'};}
function model(input){
 const cvEdits=[],additions=[],contextQuestions=[],summary=input.cvTargets.find(t=>t.blockId==='summary-1'&&t.originalText==='Product specialist working with digital teams.');
 if(summary)cvEdits.push({targetKey:summary.targetKey,text:'Product specialist with experience interviewing users and sharing findings with digital teams.',cvEvidenceKeys:input.cvEvidence.filter(e=>['summary-1','experience-1'].includes(e.blockId)).map(e=>e.evidenceKey)});
 for(const s of input.sources){
  // Explicit irrelevant synthetic example: omission is valid, not a context problem.
  if(s.text==='I enjoy baking sourdough at weekends.')continue;
  const location=s.text.split('\n\nContext: ').at(-1);const existing=s.alreadyAppliedTargets||[],place=/^At Example Studio, /i.test(location)?input.targets.find(t=>t.employer==='Example Studio'):/^(In |Context: )?Community Project/i.test(s.text)||s.text.includes('In Community Project')?input.targets.find(t=>t.label==='Community Project'):null;
  if(place&&s.allowedTargets.includes(place.targetKey)){if(!existing.includes(place.targetKey))additions.push({sourceKey:s.sourceKey,targetKey:place.targetKey,text:s.text.split('\n\nContext: ')[0].replace(/^(At|In) [^,]+,\s*/, '')});}
  else contextQuestions.push({sourceKey:s.sourceKey,reason:'context_unclear'});
 }
 return {cvEdits,additions,contextQuestions};
}
module.exports={...original,request,model};
