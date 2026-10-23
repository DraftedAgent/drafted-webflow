'use strict';
const old=require('./tailor-sources.cjs'),anchors=require('../../backend/discovery-plan-anchors.cjs');
// Explicit synthetic fixture adapter, never used to repair production output.
function model({request,input}){
 if(request.operation!=='plan')return old.discovery({request});
 if(input.modelFormat!==anchors.FORMAT)throw Error('Explicit anchor fixture input required');
 const topics=old.discovery({request}).topics.map(t=>({key:t.key,question:t.question,signalIds:t.signalRefs.map(ref=>input.signals.find(s=>s.field===ref.field&&s.index===ref.index).id),support:t.support,evidenceIds:t.evidence.map(e=>{const source=input.evidence.find(s=>s.blockId===e.blockId);if(!source||!source.text.includes(e.quote))throw Error('Invalid synthetic source');return source.id;})}));
 return {modelFormat:input.modelFormat,requestId:input.requestId,contextRevision:input.contextRevision,topics};
}
module.exports={model};
