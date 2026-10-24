'use strict';
// Synthetic provider for local preview only. Bounded existing scenario logic;
// no real NLP/model inference and no private execution data.
const fixture=require('./tailor-sources.cjs');
function model(input){
 const old=fixture.model({answers:input.sources.map(s=>({id:s.sourceKey,revision:1,text:s.text})),blocks:input.targets,reviewSections:input.reviewSections});
 const additions=[];
 for(const a of old.additions){
  const t=input.targets.find(t=>t.blockId===a.blockId);if(input.sources.find(s=>s.sourceKey===a.answerId).alreadyAppliedTargets.includes(t.targetKey))continue;const prior=additions.find(x=>x.sourceKey===a.answerId&&x.targetKey===t.targetKey);
  if(prior)prior.text+='\n'+a.text;else additions.push({sourceKey:a.answerId,targetKey:t.targetKey,text:a.text});
 }
 return {additions,contextQuestions:old.contextQuestions.map(q=>({sourceKey:q.answerId,reason:q.reason}))};
}
module.exports={...fixture,model};
