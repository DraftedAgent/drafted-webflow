'use strict';
const f=require('./tailor-source-references.cjs');
// Synthetic reproduction of an otherwise valid selection with missing context.
function model(input){
 const out=f.model(input);
 if(input.sources[0]&&!input.sources[0].text.includes('Example Studio')){
  out.contextQuestions=out.contextQuestions.filter(q=>q.sourceKey!==input.sources[0].sourceKey);
  out.additions.unshift({sourceKey:input.sources[0].sourceKey,targetKey:input.targets.find(t=>t.blockId==='experience-1').targetKey,text:'Ran internal AI workshops.'});
 }
 return out;
}
module.exports={...f,model};
