'use strict';
const F=require('./tailor-whole-cv.cjs');
const list='AI Solutions · Workflow Automation · C#/.NET · SQL · Git',added='AI and agentic coding: evaluation, testing and implementation';
function request(){const r=F.request();r.sourcesSchemaVersion='1.2';r.blocks.find(b=>b.type==='skills').text=list;r.blocks.push({blockId:'skills-separate',type:'skills',label:'Additional technical skills',order:99,text:'SQL · Git'});r.sourceContext.questions=r.sourceContext.questions.slice(0,1);r.sourceContext.answers=r.sourceContext.answers.slice(0,1);r.sourceContext.answers[0].text='I use AI and agentic coding for evaluation, testing and implementation.';delete r.sourceContext.answers[0].experienceContext;r.sourceContext.applications=[];return r;}
function model(input,kind='delta'){const target=input.targets.find(b=>b.type==='skills'&&b.blockId!=='skills-separate'),source=input.sources[0];return {cvEdits:[],additions:[{sourceKey:source.sourceKey,targetKey:target.targetKey,text:kind==='duplicate'?list+' · '+added:added}],contextQuestions:[]};}
module.exports={list,added,request,model};
