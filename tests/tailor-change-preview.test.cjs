'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),P=require('../webflow/src/tailor-change-preview.js');
const blocks=[{blockId:'summary',text:'Product specialist working with digital teams.'},{blockId:'experience',text:'Interviewed five users and shared their feedback.'}];
test('CV/job-based change is reviewable without any answer receipt; inputs stay unchanged',()=>{const next=structuredClone(blocks);next[0].text='Product specialist experienced in user interviews and sharing feedback with digital teams.';const before=JSON.stringify(blocks),out=P.changes(blocks,next);assert.equal(out.length,1);assert.equal(out[0].blockId,'summary');assert.equal(out[0].action,'Update');assert.equal(out[0].text,next[0].text);assert.equal(JSON.stringify(blocks),before);});
test('CV wording and an answer addition in one block both remain in the actual diff',()=>{const next=structuredClone(blocks);next[1].text='Shared findings from interviews with five users.\n\nHelped test internal releases.';const out=P.changes(blocks,next);assert.equal(out.length,1);assert(out[0].text.includes('Shared findings'));assert(out[0].text.includes('Helped test'));});
test('deletion-only is Remove; unchanged text yields no forced proposal',()=>{assert.deepEqual(P.changes(blocks,structuredClone(blocks)),[]);const old=[{blockId:'e',text:'Existing CV fact.\n\nWithdrawn answer addition.'}],next=[{blockId:'e',text:'Existing CV fact.'}];const out=P.changes(old,next);assert.equal(out[0].action,'Remove');assert(out[0].text.includes('Withdrawn answer addition.'));});

test('one appended sentence in a long block shows just the addition, with exact Swedish and HTML-like text',()=>{
 const old='• Ledde projekt i många år.\n'.repeat(150),added='\n• Samordnade åtta kollegor och granskade <script>alert("test")</script>.';
 const out=P.changes([{blockId:'e',text:old}],[{blockId:'e',text:old+added}]);
 assert.equal(out[0].edits.length,1);const edit=out[0].edits[0];assert.equal(edit.kind,'Added');assert.equal(edit.after.map(x=>x.text).join(''),added);assert(!edit.after.some(x=>x.text.includes('många år')));
});
test('distant phrase edits form distinct hunks in the same block; shared words remain unmarked',()=>{
 const a='Worked with digital projects and helped teams improve processes.\n\n• Interviewed five users.\n• Shared findings.\n\nKept project notes.';
 const b='Led digital projects and helped teams improve processes.\n\n• Interviewed eight users.\n• Shared findings.\n\nKept project notes.\n\n• Supported workshops.';
 const edits=P.changes([{blockId:'e',text:a}],[{blockId:'e',text:b}])[0].edits;
 assert.equal(edits.length,3);assert.deepEqual(edits.map(x=>x.kind),['Rewritten','Rewritten','Added']);
 assert(edits[0].after.some(x=>x.type==='equal'&&x.text.includes('digital projects')));
 assert.equal(edits[1].before.filter(x=>x.type==='remove').map(x=>x.text).join(''),'five');
 assert.equal(edits[1].after.filter(x=>x.type==='add').map(x=>x.text).join(''),'eight');
});
test('word diff reconstructs both originals including spacing, bullets, emoji, empty text and bounded fallback',()=>{
 for(const [a,b] of [['','Added.'],['Removed.',''],['a  b\n\nc','a b\nc'],['• Räknade fem.\n• Läste.','• Räknade åtta.\n• Läste.'],['🧑🏽‍💻 & <html>','🧑🏽‍🔧 & <img>'],['a '.repeat(2000),'z '.repeat(2000)]]){
  const out=P.wordDiff(a,b);assert.equal(out.filter(x=>x.type!=='add').map(x=>x.text).join(''),a);assert.equal(out.filter(x=>x.type!=='remove').map(x=>x.text).join(''),b);
 }
 const edit=P.changes([{blockId:'e',text:'One.\n\nTwo.'}],[{blockId:'e',text:'One.\nTwo.'}])[0].edits[0];assert.equal(edit.kind,'Removed');assert(edit.removed!==edit.added);
});
