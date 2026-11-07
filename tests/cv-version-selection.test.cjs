const {test}=require('node:test'),assert=require('node:assert/strict'),S=require('../webflow/src/cv-version-selection.js');
const blocks=[{blockId:'a',order:1,text:'Relevant experience with specific factual details.'},{blockId:'b',order:2,text:'Older supporting experience.'}];
test('omission preview is detached; approval never destroys sources or answer revisions',()=>{
 const state=S.create({versionId:'v',blocks,answers:[{id:'answer',revisions:[{revision:1,text:'Original answer'},{revision:2,text:'Corrected answer'}]}]}),before=structuredClone(state);
 let review=S.propose(state,[{blockId:'b',action:'omit',reason:'Less relevant to this target role.'}]);assert.deepEqual(state,before);assert.equal(S.preview(review).length,1);assert.equal(review.approved.length,2);
 review=S.decide(review,'b','accept');assert.equal(review.approved.length,1);assert.deepEqual(review.sources,before.sources);assert.equal(review.omitted[0].block.text,blocks[1].text);
});
test('restore remains a proposal and preserves later edits to other blocks',()=>{
 let state=S.create({versionId:'v',blocks});state=S.settle(S.decide(S.propose(state,[{blockId:'b',action:'omit',reason:'Less relevant.'}]),'b','accept'));
 state=S.replaceApproved(state,[{...state.approved[0],text:'Later approved correction.'}]);state=S.propose(state,[{blockId:'b',action:'restore',reason:'User requested restoration.'}]);assert.equal(state.approved.length,1);assert.equal(S.preview(state)[0].text,'Later approved correction.');
 state=S.decide(state,'b','accept');assert.equal(state.approved[0].text,'Later approved correction.');assert.deepEqual(state.approved[1],blocks[1]);assert.deepEqual(state.sources.blocks,blocks);
});
test('decline, edit and stale target conflicts retain approved state',()=>{
 let state=S.propose(S.create({versionId:'v',blocks}),[{blockId:'a',action:'shorten',text:'Specific factual details.',reason:'Remove repetition.'}]);state=S.revise(state,'a',{text:'Relevant factual details.',reason:'Revised wording.'});assert.deepEqual(state.approved,blocks);
 assert.deepEqual(S.decide(state,'a','decline').approved,blocks);
 const changed=S.replaceApproved(state,[{...blocks[0],text:'Later correction.'},blocks[1]]);assert.throws(()=>S.decide(changed,'a','accept'),/STALE_SELECTION/);
 assert.throws(()=>S.propose(S.create({versionId:'v',blocks}),[{blockId:'a',action:'omit',reason:''}]),/MISSING_SELECTION_REASON/);
});

test('keep with revised wording is a detached review proposal, never silently discarded or accepted',()=>{const state=S.propose(S.create({versionId:'v',blocks}),[{blockId:'a',action:'keep',text:'Reworded source detail.',reason:'Professional wording.'}]);assert.deepEqual(state.approved,blocks);assert.equal(S.preview(state)[0].text,'Reworded source detail.');assert.deepEqual(S.decide(state,'a','decline').approved,blocks);assert.equal(S.decide(state,'a','accept').approved[0].text,'Reworded source detail.');});
