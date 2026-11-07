const {test}=require('node:test'),assert=require('node:assert/strict');
global.DraftedCoverageContract=require('../webflow/src/cv-coverage-contract.js');require('../webflow/src/tailor-section-review.js');
const review=global.DraftedSectionReview;
test('overview tracks mixed decisions, revisions and all-declined without changing sources',()=>{
 const request={blocks:[{blockId:'a',title:'Coordinator',text:'Coordinated the project with four people from different teams.'},{blockId:'b',title:'Developer',text:'Reviewed pull requests.'}]};
 const data={blocks:[{...request.blocks[0],text:'Coordinated four people across teams.'},{...request.blocks[1],text:'Reviewed pull requests and supported junior developers.'}]},original=JSON.stringify({request,data});
 let summary=review.summary(request,data,{});assert.equal(summary.pending.length,2);assert.match(summary.overview,/proposed/);
 summary=review.summary(request,data,{a:'accept',b:'decline'});assert.deepEqual(summary.accepted,['a']);assert.deepEqual(summary.declined,['b']);assert.doesNotMatch(summary.overview,/junior developers|Developer/);assert.match(summary.overview,/reviewed CV/);
 assert.equal(JSON.stringify({request,data}),original);
 const revised=structuredClone(data);revised.blocks[0].text='Coordinated status reporting for four participants.';
 assert.match(review.summary(request,revised,{}).overview,/status reporting/);
 summary=review.summary(request,data,{a:'decline',b:'decline'});assert.match(summary.overview,/no changes.*accepted/);assert.equal(summary.pending.length,0);
});
test('policy reaches negotiated Tailor and scoped revision prompt without changing schema',()=>{
 const P=require('../webflow/src/tailor-sources-v15.js');assert(P.prompt15.includes(P.contentPolicy));assert.match(P.prompt15,/Preserve every unique fact/);assert.match(P.prompt15,/no mandatory result-first/);assert.match(P.prompt15,/Do not omit, group or move facts across blocks/);
});
test('seniority policy survives assessment planner prompt transformation and interpretation',()=>{
 const F=require('./fixtures/tailor-sources.cjs').request(),base={schemaVersion:'1.0',operation:'plan',requestId:'policy',contextRevision:'ctx',conversationLanguage:'en',cvVersionId:F.cvVersionId,blocksSchemaVersion:F.blocksSchemaVersion,blocks:F.blocks,jobContextSchemaVersion:F.jobContextSchemaVersion,jobContext:F.jobContext};
 const planner=require('../backend/discovery-plan-assessments.cjs');
 const messages=planner.prompts(base),input=JSON.parse(messages[1].content);assert.equal(input.careerContext.find(b=>b.blockId==='experience-1').title,base.blocks.find(b=>b.blockId==='experience-1').title);
 const plan=messages[0].content;assert.match(plan,/actual mandate and seniority/);assert.match(plan,/never request proof/);assert.match(plan,/Do not infer budget/);
 const interpret=require('../webflow/src/experience-discovery-contract.js').prompts({...base,operation:'interpret'})[0].content;assert.match(interpret,/actual mandate and seniority/);
});

test('published export region unchanged; pending preview blocks export and accepted source stays canonical',()=>{
 const fs=require('node:fs'),{execFileSync}=require('node:child_process');
 const code=fs.readFileSync('webflow/src/drafted-editor.js','utf8').replace(/\r\n/g,'\n'),prior=execFileSync('git',['show','aca2aaf:webflow/src/drafted-editor.js'],{encoding:'utf8'}).replace(/\r\n/g,'\n');
 const region=s=>s.slice(s.indexOf('// 2) Bygg payload ENBART'),s.indexOf('// 3) Hitta download-knappen'));
 assert.equal(region(code).replace('||cvSelectionUI?.hasPending()',''),region(prior));
 const build=new Function('tailorCvPreview','documentBlocksState','cvVersionId','documentTitle','documentLanguage','const cvSelectionUI=null;'+region(code)+'; return buildPdfExportPayload();');
 const accepted=[{blockId:'a',text:'Accepted wording'}];assert.deepEqual(build({suggested:()=>true},accepted,'v','CV','en'),{ok:false,reason:'SUGGESTED_PREVIEW'});
 const result=build({suggested:()=>false},accepted,'v','CV','en');assert.equal(result.ok,true);assert.deepEqual(result.payload.blocks,accepted);assert.equal(result.payload.language,'en');
});

test('title translation equivalence never hides seniority or unknown substantive changes',()=>{const L=require('../webflow/src/cv-language.js');assert(L.equivalentTitle('Product Specialist','Produktspecialist'));assert(L.equivalentTitle('Delivery Coordinator','Leveranskoordinator'));assert(L.equivalentTitle('Senior Product Specialist','Senior Produktspecialist'));assert(!L.equivalentTitle('Product Specialist','Senior Produktspecialist'));assert(!L.equivalentTitle('Developer','Engineering Manager'));assert(!L.equivalentTitle('Product Specialist','Produktchef'));});
