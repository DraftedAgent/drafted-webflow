'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {prepareUploadPresentation}=require('../backend/cv-upload-source-guard.cjs'),{cases}=require('./fixtures/cv-header.cjs');
test('parser facts use existing canonical text blocks, no generated name or headline',()=>{
  for(const [name,fixture]of Object.entries(cases)){
    const header=fixture.blocks.filter(b=>b.blockId.startsWith('source-header-'));
    assert.equal(header.find(b=>b.label==='Name')?.text,fixture.personalInfo.fullName||undefined,name);
    assert.equal(header.find(b=>b.label==='Professional headline')?.text,fixture.personalInfo.currentTitle||undefined,name);
    for(const b of header){assert.equal(b.type,'otherSections');assert.equal(typeof b.text,'string');}
  }
});
test('repairs only source-absent, verified model artefacts without editing legitimate parentheses or markers',()=>{
  assert.deepEqual(cases['source-artifacts'].changes.map(c=>c.kind),['model-empty-list-marker','model-parser-diagnostic']);
  assert.equal(cases['source-artifacts'].blocks.find(b=>b.type==='experience').text,'• Built a synthetic service (with explicit user feedback).\n');
  assert.deepEqual(cases['legitimate-parentheses'].changes,[]);
  assert.equal(cases['legitimate-parentheses'].blocks.find(b=>b.type==='experience').text,cases['legitimate-parentheses'].modelBlocks.find(b=>b.type==='experience').text);
});
test('missing provenance cannot authorize cleaning; caller input and unknown blocks stay intact',()=>{
  const blocks=[{blockId:'x',type:'experience',text:'•\n(employer and title: blank, from the parsed CV; period: 2025 - Present)',title:'',employer:'',startDate:'2025',endDate:'Present'},{blockId:'custom',type:'customFuture',text:'A real note (parentheses preserved).',extra:'unchanged'}],before=structuredClone(blocks);
  const result=prepareUploadPresentation({blocks,parsedCvJson:{}});assert.deepEqual(result.blocks,blocks);assert.deepEqual(blocks,before);
});
test('date mismatch and existing authoritative titles are not parser diagnostics to remove',()=>{
  const note='(employer and title: blank, from the parsed CV; period: 2025 - Present)';
  for(const title of ['', 'Staff designer (interim)']){
    const blocks=[{blockId:'e',type:'experience',title,employer:'',startDate:'2024',endDate:'Present',text:note}];
    assert.equal(prepareUploadPresentation({blocks,parsedCvJson:{},sourceExperiencesByBlockId:{e:{descriptionRaw:'Source'}}}).blocks[0].text,note);
  }
});
test('header IDs are stable across missing optional fields and collisions fail rather than replace content',()=>{
  assert.equal(cases.complete.blocks.find(b=>b.label==='Contact details').blockId,cases['no-name'].blocks.find(b=>b.label==='Contact details').blockId);
  assert.throws(()=>prepareUploadPresentation({blocks:[{blockId:'source-header-name',text:'Existing fact'}],parsedCvJson:{personalInfo:{fullName:'Another fact'}}}),/collision/);
});
