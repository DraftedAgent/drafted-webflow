'use strict';
const blocks=[
 {blockId:'summary-1',type:'summary',label:'Profile',order:10,text:'Product specialist working with digital teams.'},
 {blockId:'experience-1',type:'experience',label:'Experience',order:20,text:'Interviewed five users and shared their feedback.',employer:'Example Studio',title:'Product Specialist',startDate:'2022',endDate:'2024'},
 {blockId:'project-1',type:'otherSections',label:'Community Project',order:30,text:'Volunteered with a local community group.'},
 {blockId:'skills-1',type:'skills',label:'Skills',order:40,text:'User interviews.'}
];
const jobContext={roleTitle:'Product Specialist',seniority:'mid',surfaces:['app'],tone:'balanced',topPriorities:[{signal:'Plan product deliveries',weight:5},{signal:'Collaborate and facilitate workshops',weight:4}],mustHave:[],successMetrics:[],keywords:['product','planning','delivery','workshops','collaboration','research','users','design','development','communication']};
function discovery({request:r}){if(r.operation==='plan')return {topics:[{key:'planning',question:'Have you helped plan a delivery?',support:'unclear',evidence:[],signalRefs:[{field:'topPriorities',index:0}]},{key:'collaboration',question:'Have you helped people work together?',support:'unclear',evidence:[],signalRefs:[{field:'topPriorities',index:1}]}]};return {drafts:[{proposedText:'ADVISORY ONLY: never use this interpretation as a fact.',sourceQuote:r.sourceAnswer.text,coveredQuestionIds:[]}]};}
// Bounded synthetic demonstration, NOT a general-purpose semantic parser or model substitute.
function model(input){
 const additions=[],contextQuestions=[];
 for(const a of input.answers){
  const original=a.text.split('\n\nContext: ')[0],paragraphs=original.split(/\n\s*\n/);
  // Split only explicit, independently located examples. Keep unanchored qualifications together.
  const units=paragraphs.length>1&&paragraphs.every(p=>/^(?:At |In |I (?:use|used) (?:Python|SQL)\b)/.test(p))?paragraphs:[original];
  const proposed=[];let issue=null;
  for(const unit of units){
   const contextQuote=units.length>1?unit:a.text,place=contextQuote.split('\n\nContext: ').at(-1).trim().toLowerCase();
   const named=name=>{const n=name.toLowerCase();return ['at ','in '].some(prefix=>place===prefix+n||place.startsWith(prefix+n+',')||place.startsWith(prefix+n+' as '));};
   const statement=unit.replace(/^(?:At|In) [^,]+,\s*/,'');let target;
   if(/^I (?:use|used) (?:Python|SQL)\b/.test(statement))target=input.blocks.find(b=>b.type==='skills');
   else{const matches=input.blocks.filter(b=>b.type==='experience'&&named(b.employer));if(matches.length>1){const roles=matches.filter(b=>place.includes(' as '+b.title.toLowerCase()));if(roles.length===1)target=roles[0];else{issue='context_unclear';break;}}else target=matches[0];target=target||input.blocks.find(b=>b.type==='otherSections'&&named(b.label));}
   if(!target&&input.reviewSections?.some(b=>named(b.employer||b.institution||b.title||b.label)))continue;
   if(!target){issue=/\b(?:At |In |Context: )/.test(a.text)?'new_block_required':'context_unclear';break;}
   // A later explicit setting within an otherwise unanchored story requires clarification.
   if(units.length===1&&/\n\n(?:At |In )/.test(unit)){issue='context_unclear';break;}
   if(statement.trim())proposed.push({blockId:target.blockId,text:statement,answerId:a.id,answerRevision:a.revision,sourceQuote:unit,contextQuote:target.type==='skills'?'':contextQuote});
  }
  if(issue)contextQuestions.push({answerId:a.id,answerRevision:a.revision,reason:issue});else additions.push(...proposed);
 }
 return {additions,contextQuestions};
}
function request(){return {cvVersionId:'cv-1',cvTitle:'Alex Example',targetRole:'Product Specialist',language:'en',blocksSchemaVersion:'1.0',blocks:structuredClone(blocks),jobContextSchemaVersion:'1.0',jobContext:structuredClone(jobContext),sourcesSchemaVersion:'1.0',sourceContext:{contextRevision:'ctx-1',roundId:'round-1',questions:[{id:'q1',question:'Have you helped plan a delivery?',signalRefs:[{field:'topPriorities',index:0}],status:'recorded'},{id:'q2',question:'Have you helped people work together?',signalRefs:[{field:'topPriorities',index:1}],status:'recorded'}],answers:[{id:'a1',questionId:'q1',revision:1,text:'At Example Studio, I planned a release with two developers.'},{id:'a2',questionId:'q2',revision:1,text:'In Community Project, I helped facilitate two internal workshops. I did not lead customer sessions.'}],applications:[]}};}
module.exports={blocks,jobContext,discovery,model,request};
