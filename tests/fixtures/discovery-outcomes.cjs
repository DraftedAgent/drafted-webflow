// Explicit synthetic scenario for the existing whole-editor preview and discovery handler.
const signals=['Plan and deliver releases with developers','Facilitate customer workshops and executive sessions','Measure product outcomes','Lead procurement','Manage a budget'];
const questions=['Have you planned and delivered a release with developers?','Have you facilitated customer workshops or executive sessions?','Have you measured the outcome of a product change?','Have you led procurement?','Have you managed a budget?'];
const jobContext={roleTitle:'Synthetic product lead',seniority:'lead',surfaces:['app'],tone:'balanced',topPriorities:signals.map(signal=>({signal,weight:5})),mustHave:[],successMetrics:[],keywords:['product','release','delivery','developer','workshop','customer','executive','measurement','procurement','budget']};
function model({request:r}){
 if(r.operation==='plan')return {topics:questions.map((question,index)=>({key:'synthetic-'+index,question,signalRefs:[{field:'topPriorities',index}],support:'unclear',evidence:[]}))};
 if(r.sourceAnswer.text.includes('It depends'))return {drafts:[]};
 const sourceQuote=r.sourceAnswer.text.split('\n\n').at(-1);
 // Deliberately overclaim in an advisory draft: UI must show the real source, never this inference.
 return {drafts:[{proposedText:sourceQuote.includes('internal AI')?'Facilitated executive sessions for customers.':sourceQuote,sourceQuote,coveredQuestionIds:[]}]};
}
const blocks=[{blockId:'summary-1',type:'summary',label:'Summary',order:1,text:'Product specialist working with digital teams.'},{blockId:'experience-1',type:'experience',label:'Experience',order:10,text:'Interviewed five users and shared their feedback with the product team.',employer:'Example Studio',title:'Product Specialist',startDate:'2022',endDate:'2024'}];
module.exports={jobContext,model,questions,blocks};
