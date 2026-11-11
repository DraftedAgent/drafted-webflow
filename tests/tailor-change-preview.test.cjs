'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),P=require('../webflow/src/tailor-change-preview.js');
const blocks=[{blockId:'summary',text:'Product specialist working with digital teams.'},{blockId:'experience',text:'Interviewed five users and shared their feedback.'}];
test('CV/job-based change is reviewable without any answer receipt; inputs stay unchanged',()=>{const next=structuredClone(blocks);next[0].text='Product specialist experienced in user interviews and sharing feedback with digital teams.';const before=JSON.stringify(blocks),out=P.changes(blocks,next);assert.equal(out.length,1);assert.equal(out[0].blockId,'summary');assert.equal(out[0].action,'Update');assert.equal(out[0].text,next[0].text);assert.equal(JSON.stringify(blocks),before);});
test('CV wording and an answer addition in one block both remain in the actual diff',()=>{const next=structuredClone(blocks);next[1].text='Shared findings from interviews with five users.\n\nHelped test internal releases.';const out=P.changes(blocks,next);assert.equal(out.length,1);assert(out[0].text.includes('Shared findings'));assert(out[0].text.includes('Helped test'));});
test('deletion-only is Remove; unchanged text yields no forced proposal',()=>{assert.deepEqual(P.changes(blocks,structuredClone(blocks)),[]);const old=[{blockId:'e',text:'Existing CV fact.\n\nWithdrawn answer addition.'}],next=[{blockId:'e',text:'Existing CV fact.'}];const out=P.changes(old,next);assert.equal(out[0].action,'Remove');assert(out[0].text.includes('Withdrawn answer addition.'));});

test('complete comparison retains every source character, with no context-window fragments',()=>{
 const before='• Ledde projekt i många år.\n'.repeat(150),after=before+'\n• Samordnade åtta kollegor och granskade <script>alert("test")</script>.';
 const [edit]=P.changes([{blockId:'e',text:before}],[{blockId:'e',text:after}])[0].edits;
 assert.equal(edit.before.map(x=>x.text).join(''),before);assert.equal(edit.after.map(x=>x.text).join(''),after);
 const a='Worked with digital projects.\n\n• Interviewed five users.\n• Shared findings.',b='Led digital projects.\n\n• Interviewed eight users.\n• Shared findings.\n\n• Supported workshops.';
 const changes=P.changes([{blockId:'e',text:a}],[{blockId:'e',text:b}])[0].edits;
 assert.equal(changes.length,1);assert.equal(changes[0].before.map(x=>x.text).join(''),a);assert.equal(changes[0].after.map(x=>x.text).join(''),b);
});
test('recommendations reflect changes, sources and supplied reasons without inventing relevance',()=>{
 const before={blockId:'p',type:'summary',text:'I work with delivery planning and I also work with planning releases.'},after={...before,text:'Coordinate releases.'};
 const d=P.describe({before,after});assert.match(d.recommendation,/Shorten the profile/);assert.equal(d.why,'');
 assert.equal(P.describe({before,after,notes:['Retains delivery coordination for the target role.']}).why,'Retains delivery coordination for the target role.');
 assert.match(P.describe({before,after,action:'omit'}).recommendation,/entire block.*source content is preserved/);
 assert.match(P.describe({before:{...before,title:'Assistant'},after:{...after,title:'Manager'},meaningfulTitle:true}).recommendation,/Assistant.*Manager/);
 const a=P.describe({before:{...before,text:'Supported planning.'},after:{...after,text:'Supported planning; the product lead retained roadmap decisions.'}});assert.match(a.recommendation,/product lead retained roadmap decisions/);
});
test('word diff reconstructs both originals including spacing, bullets, emoji, empty text and bounded fallback',()=>{
 for(const [a,b] of [['','Added.'],['Removed.',''],['a  b\n\nc','a b\nc'],['• Räknade fem.\n• Läste.','• Räknade åtta.\n• Läste.'],['🧑🏽‍💻 & <html>','🧑🏽‍🔧 & <img>'],['a '.repeat(2000),'z '.repeat(2000)]]){
  const out=P.wordDiff(a,b);assert.equal(out.filter(x=>x.type!=='add').map(x=>x.text).join(''),a);assert.equal(out.filter(x=>x.type!=='remove').map(x=>x.text).join(''),b);
 }
 const edit=P.changes([{blockId:'e',text:'One.\n\nTwo.'}],[{blockId:'e',text:'One.\nTwo.'}])[0].edits[0];assert.equal(edit.kind,'Rewritten');assert(edit.removed!==edit.added);
});
