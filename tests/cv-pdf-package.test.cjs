'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm');
const adapter=require('../backend/cv-pdf-package.cjs'),fixtures=require('./fixtures/cv-pdf.cjs');
test('deployment package embeds exact shared assets and safely preserves literal source',()=>{
 const model={cvVersionId:'release.test',cvTitle:'</script><script>throw Error("injection")</script>',language:'sv',templateId:'editorial_v1',blocks:structuredClone(fixtures.short.blocks)};
 const before=JSON.stringify(model),html=adapter.html(model);
 assert.ok(html.includes('data:font/ttf;base64,'));assert.ok(html.includes('window.__RENDER_DONE__=false'));
 assert.ok(html.includes('\\u003c/script>'));assert.equal(JSON.stringify(model),before);
 const result=vm.runInNewContext('(function(){'+adapter.code+'})()',{Buffer,structuredClone,$json:{body:model}});
 assert.equal(result[0].json.html,html);assert.equal(result[0].json.ok,true);
 assert.equal(Object.keys(adapter.manifest).length,5);
 const failure=vm.runInNewContext('(function(){'+adapter.code+'})()',{Buffer,structuredClone,$json:{body:{...model,templateId:'unknown'}}});
 assert.equal(failure[0].json.ok,false);assert.equal(failure[0].json.httpStatus,400);
});
