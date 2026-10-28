'use strict';
const F=require('./tailor-sources.cjs');
const blocks=[...structuredClone(F.blocks),{...structuredClone(F.blocks[1]),blockId:'experience-2',title:'Delivery Coordinator',startDate:'2019',endDate:'2021'},{blockId:'project-empty',type:'otherSections',label:'Independent project',order:50,text:'Documented a personal project.'}];
function model(input){const additions=[],contextQuestions=[];for(const s of input.sources){if(!s.experienceContext)contextQuestions.push({sourceKey:s.sourceKey,reason:'context_unclear'});else if(s.contextStatus==='resolved'&&s.allowedTargets.length)additions.push({sourceKey:s.sourceKey,targetKey:s.allowedTargets[0],text:'Coordinated internal planning sessions.'});}return {cvEdits:[],additions,contextQuestions};}
module.exports={...F,blocks,model};
