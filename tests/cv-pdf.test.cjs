'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {validate}=require('../backend/cv-pdf.cjs'),fixtures=require('./fixtures/cv-pdf.cjs');
const request=f=>({cvVersionId:'fixture.pdf.1',cvTitle:f.title,language:'en',templateId:'classic_v1',blocks:structuredClone(f.blocks)});
test('each shared design is allowed without mutating any CV fields',()=>{
 const designs=require('../webflow/src/cv-document-designs.js');assert.equal(designs.length,3);
 for(const design of designs){const input={...request(fixtures['long-special']),templateId:design.id};assert.deepEqual(validate(input),input);}
});
test('export preserves complete source, stable IDs, metadata and unknown types',()=>{
 for(const name of ['short','multi','long-special','edited']){const original=request(fixtures[name]),before=JSON.stringify(original),result=validate(original);assert.equal(JSON.stringify(result),before);assert.notEqual(result.blocks,original.blocks);assert.equal(JSON.stringify(original),before);}
});
test('contract limits fail before rendering rather than clipping text',()=>{
 for(const mutate of [r=>r.blocks[0].text='x'.repeat(6001),r=>r.blocks[1].blockId=r.blocks[0].blockId,r=>r.cvTitle='x'.repeat(141),r=>r.templateId='other',r=>r.language='auto',r=>r.blocks[1].title='x'.repeat(121),r=>r.blocks[0].order=NaN,r=>r.blocks=[]]){const input=request(fixtures.short);mutate(input);assert.throws(()=>validate(input),error=>error.status===400);}
});
