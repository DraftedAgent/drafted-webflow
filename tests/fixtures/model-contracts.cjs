'use strict';
const owner=require('./discovery-signal-questions.cjs'),tailor=require('./tailor-source-references.cjs'),format=require('../../backend/discovery-signal-questions-proposal.cjs').FORMAT;
function model(data){
 if(data.operation==='tailor')return tailor.model(data.input);
 if(data.operation==='interpret')return {drafts:/^(yes|maybe|i don.t know)[.!]?$/i.test(data.input.answerText.trim())?[]:[{proposedText:data.input.answerText,coveredQuestionKeys:[]}]};
 const result=owner.model({...data,input:{...data.input,modelFormat:format,requestId:data.request.requestId,contextRevision:data.request.contextRevision}});return {assessments:result.assessments};
}
module.exports={model};
