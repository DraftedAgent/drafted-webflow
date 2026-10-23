'use strict';
// Synthetic-only provider. Never a production-output repair path.
const anchors=require('./discovery-anchors.cjs'),format=require('../../backend/discovery-plan-assignments.cjs').FORMAT;
function model(data){
 if(data.request.operation!=='plan')return anchors.model(data);
 if(data.input.modelFormat!==format)throw Error('Assignment format required');
 const raw=anchors.model({...data,input:{...data.input,modelFormat:'discovery-plan-anchors-1'}});
 const signalTopics={...data.input.signalTopics};
 const topics=raw.topics.map(({signalIds,...topic})=>{for(const id of signalIds){if(signalTopics[id]!==null)throw Error('Duplicate fixture ownership');signalTopics[id]=topic.key;}return topic;});
 return {...raw,modelFormat:format,topics,signalTopics};
}module.exports={model};
