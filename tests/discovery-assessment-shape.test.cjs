'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),V=require('../migration/luna/checks.cjs'),T=require('../migration/discovery-plan-bound/checks.cjs'),C=require('../migration/discovery-plan-bound/current-adapter.cjs'),S=require('../migration/discovery-plan-bound/signal-shape.cjs'),Inline=require('../migration/discovery-inline/contract.cjs');
const base=C.baseline(),diagnostic=C.prepare(base),bound=C.prepare(base,{bound:true}),r=T.material(),ids=Inline.input(r).signals.map(s=>s.id),clone=x=>JSON.parse(JSON.stringify(x)),node=(w,name)=>w.nodes.find(n=>n.name===name);
const output=()=>({...T.output(r),modelFormat:Inline.FORMAT,requestId:r.requestId,contextRevision:r.contextRevision});
function failure(w,value){const g=T.graph(w,r,value);assert.equal(g.out.httpStatus,422);assert.equal(g.out.response.ok,false);assert.equal(g.out.diagnostic.reason,'INCOMPLETE_INLINE_ASSESSMENTS');return g.out;}
test('current Luna base: only validator and one diagnostic header change; paused bound implementation reused',()=>{
 for(const n of base.nodes){if(n.name==='Validate model response')assert.notEqual(node(diagnostic,n.name).parameters.jsCode,n.parameters.jsCode);else if(n.name==='Respond discovery'){const changed=clone(node(diagnostic,n.name));changed.parameters.options.responseHeaders.entries.pop();assert.deepEqual(changed,n);}else assert.deepEqual(node(diagnostic,n.name),n);}
 assert.deepEqual(diagnostic.connections,base.connections);assert.deepEqual(diagnostic.settings,base.settings);assert.equal(diagnostic.nodes.length,base.nodes.length);assert.equal(bound.nodes.length,base.nodes.length+2);assert.equal(node(bound,'Discovery model').parameters.modelId.value,'gpt-6-luna');assert.deepEqual(node(bound,'Discovery model'),node(base,'Discovery model'));assert.equal(node(bound,'Discovery plan model').type,'n8n-nodes-base.httpRequest');assert.throws(()=>C.prepare({...base,versionId:'other'}));
});
test('actual current validator distinguishes every wrong container type without guessing missing keys',()=>{
 for(const [type,value]of [['null',null],['array',[]],['string','private source text'],['boolean',false],['number',7]]){const raw=output();raw.assessments=value;const d=failure(diagnostic,raw).diagnostic.assessmentShape;assert.equal(d.containerType,type);assert.deepEqual(d.expectedKeys,ids);assert.equal(d.missingKeys,null);assert.equal(d.unexpectedSignalKeys,null);assert(!JSON.stringify(d).includes('private source text'));}
 // Missing entire root field fails the preceding exact-root rule, not this set gate.
 const absent=output();delete absent.assessments;assert.equal(T.graph(diagnostic,r,absent).out.diagnostic.reason,'INVALID_INLINE_PLAN');assert.equal(S.describe(ids,undefined).containerType,'missing');
});
test('actual current validator reports exact missing and unexpected signal IDs even with equal counts',()=>{
 const raw=output();delete raw.assessments[ids[0]];raw.assessments.signal_mustHave_999={private:'CV or answer text'};const before=clone(raw),d=failure(diagnostic,raw).diagnostic.assessmentShape;assert.equal(d.containerType,'object');assert.deepEqual(d.missingKeys,[ids[0]]);assert.deepEqual(d.unexpectedSignalKeys,['signal_mustHave_999']);assert.equal(d.actualKeyCount,ids.length);assert.deepEqual(raw,before);assert(!JSON.stringify(d).includes('answer text'));
 const missing=output();delete missing.assessments[ids[1]];assert.deepEqual(failure(diagnostic,missing).diagnostic.assessmentShape.missingKeys,[ids[1]]);
 const extra=output();extra.assessments.mustHave_9={};assert.deepEqual(failure(diagnostic,extra).diagnostic.assessmentShape.unexpectedSignalKeys,['mustHave_9']);
});
test('free-text keys/values never enter diagnostic header, and technical extra keys are bounded',()=>{
 const raw=output();raw.assessments['Private CV and original answer text']={question:'Do not log this sentence'};const d=failure(diagnostic,raw).diagnostic.assessmentShape;assert.equal(d.redactedUnexpectedKeyCount,1);assert.deepEqual(d.unexpectedSignalKeys,[]);assert(!JSON.stringify(d).includes('Private'));assert(!JSON.stringify(d).includes('sentence'));
 for(let i=0;i<100;i++)raw.assessments['signal_mustHave_'+(100+i)]={};const bounded=failure(diagnostic,raw).diagnostic.assessmentShape;assert.equal(bounded.unexpectedSignalKeys.length,20);assert.equal(bounded.omittedUnexpectedSignalKeyCount,80);assert(Buffer.byteLength(JSON.stringify(bounded))<3000);
});
test('shared schema has exact required object keys and forbids other keys; bound backend retains strict rejection with same diagnostic',()=>{
 const valid=T.output(r),g=T.graph(bound,r,valid),schema=g.calls[0].body.text.format.schema,a=schema.properties.assessments;
 assert.equal(g.calls.length,1);assert.equal(g.calls[0].body.model,'gpt-6-luna');assert.equal(g.calls[0].body.text.format.strict,true);assert.equal(a.type,'object');assert.equal(a.additionalProperties,false);assert.deepEqual(a.required,ids);assert.deepEqual(Object.keys(a.properties),ids);assert.equal(schema.additionalProperties,false);
 for(const value of [null,[],{},Object.fromEntries(ids.slice(1).map(id=>[id,valid.assessments[id]])),{...valid.assessments,signal_mustHave_999:{kind:'question',question:'Example?'}}]){const raw={assessments:value};const d=failure(bound,raw).diagnostic.assessmentShape;assert.deepEqual(d,S.describe(ids,value));}
 assert.equal(g.out.response.ok,true);assert.equal(node(bound,'Respond discovery').parameters.options.responseHeaders.entries.at(-1).name,'X-Drafted-Assessment-Shape');
});
test('valid plans, complete zero and interpretation retain behavior; no input or CV mutation',()=>{
 const valid=output(),zero=output(),before=clone(r);for(const id of ids)zero.assessments[id]={kind:'not_actionable',reason:'not_experience_requirement',explanation:'Synthetic administrative condition.'};
 for(const raw of [valid,zero])assert.deepEqual(T.graph(diagnostic,r,raw).out,T.graph(base,r,raw).out);
 assert.equal(T.graph(bound,r,{assessments:zero.assessments}).out.response.result.topics.length,0);
 for(const c of require('../dev-system/prepared/model-pilot/manifest.json').cases.filter(c=>c.operation==='interpret').slice(0,1)){const old=T.graph(base,c.request,{drafts:[]});assert.deepEqual(T.graph(diagnostic,c.request,{drafts:[]}).out,old.out);assert.deepEqual(T.graph(bound,c.request,{drafts:[]}).out,old.out);assert.deepEqual(T.graph(bound,c.request,{drafts:[]}).calls,old.calls);}
 assert.deepEqual(r,before);
});
