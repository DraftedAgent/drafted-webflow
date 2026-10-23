const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm');
const p=require('../backend/n8n-discovery-reference-prompt.cjs'),c=require('../webflow/src/experience-discovery-contract.js'),{definition}=require('../backend/n8n-discovery-definition.cjs'),{createHandler}=require('../backend/experience-discovery.cjs'),f=require('./fixtures/tailor-sources.cjs');
function request(n=8,m=6){return {schemaVersion:'1.0',operation:'plan',requestId:'req',contextRevision:'ctx',conversationLanguage:'en',cvVersionId:'cv',blocksSchemaVersion:'1.0',blocks:structuredClone(f.blocks),jobContextSchemaVersion:'1.0',jobContext:{...structuredClone(f.jobContext),topPriorities:Array.from({length:n},(_,i)=>({signal:'Priority '+i,weight:5})),mustHave:Array.from({length:m},(_,i)=>'Requirement '+i)}};}
function catalog(r){const content=p.prompts(r)[0].content;return JSON.parse(content.slice(content.indexOf('\n{"allowedSignalRefs":')+1).split('\n')[0]);}
const topic=(ref,i)=>({key:'topic-'+i,question:'Have you helped with this activity?',signalRefs:[ref],support:'unclear',evidence:[]});
function definitionForTest(){return definition({type:'synthetic-model',parameters:{responses:{values:[]}}});}
test('catalog enumerates per-list indices: topic14 must not imply index13',()=>{
 const r=request(),before=JSON.stringify(r),data=catalog(r);assert.equal(data.allowedSignalRefs.length,14);assert.deepEqual(data.allowedSignalRefs.at(-1).ref,{field:'mustHave',index:5});
 const choices=data.signalRefsJSONSchema.items.anyOf;assert.deepEqual(choices[0].properties.index.enum,[0,1,2,3,4,5,6,7]);assert.deepEqual(choices[1].properties.index.enum,[0,1,2,3,4,5]);assert.ok(!p.prompts(r)[0].content.includes('Exact JSON example:'));assert.equal(JSON.stringify(r),before);
 c.validateResult(r,{topics:data.allowedSignalRefs.map((x,i)=>topic(x.ref,i))});
});
test('empty lists, singleton, uneven and maximum requests enumerate only existing pairs',()=>{
 for(const [n,m] of [[0,0],[0,1],[1,0],[1,12],[8,0],[8,12]]){const r=request(n,m),data=catalog(r);assert.equal(data.allowedSignalRefs.length,n+m);
  for(const {ref} of data.allowedSignalRefs)assert.ok(r.jobContext[ref.field][ref.index]);
  if(!n&&!m){assert.equal(data.signalRefsJSONSchema,null);assert.ok(p.prompts(r)[0].content.includes('return {"topics":[]}'));}
  else assert.deepEqual(data.signalRefsJSONSchema.items.anyOf.map(x=>x.properties.field.enum[0]),[...(n?['topPriorities']:[]),...(m?['mustHave']:[])]);
 }
});
test('out-of-range, non-integer, negative, unknown-field and duplicate references stay rejected; valid retry does not change sources',async()=>{
 const r=request(),before=JSON.stringify(r);let bad={field:'mustHave',index:13};
 const handler=createHandler({model:()=>({topics:[topic(bad,0)]})});
 for(bad of [{field:'mustHave',index:13},{field:'topPriorities',index:8},{field:'mustHave',index:6},{field:'mustHave',index:-1},{field:'mustHave',index:0.5},{field:'keywords',index:0}])assert.equal((await handler(r)).status,422);
 const duplicate=[topic({field:'mustHave',index:0},0),topic({field:'mustHave',index:0},1)];assert.throws(()=>c.validateResult(r,{topics:duplicate}));
 bad={field:'mustHave',index:5};assert.equal((await handler(r)).status,200);assert.equal(JSON.stringify(r),before);
});
test('generated Code matches backend for Swedish/English and leaves interpretation unchanged',()=>{
 const d=definitionForTest(),code=d.nodes.find(n=>n.name==='Build discovery prompt').parameters.jsCode;
 const run=r=>vm.runInNewContext('(function(){'+code+'\n})()',{$input:{first:()=>({json:{request:r}})},TextEncoder},{timeout:1500})[0].json.promptText;
 for(const language of ['en','sv'])for(const [n,m] of [[8,6],[0,1],[1,0],[0,0]]){const r=request(n,m);r.conversationLanguage=language;assert.equal(run(r),p.prompts(r).map(x=>x.role.toUpperCase()+':\n'+x.content).join('\n\n'));}
 const r={operation:'interpret',conversationLanguage:'en',sourceAnswer:{id:'a',revision:3,text:'No. I helped internally; I did not lead.'}};assert.deepEqual(p.prompts(r),c.prompts(r));assert.equal(run(r),c.prompts(r).map(x=>x.role.toUpperCase()+':\n'+x.content).join('\n\n'));
});
test('version-bound patch changes only one node and rejects drift/reapplication',()=>{
 const w={...definitionForTest(),id:p.ID,versionId:p.BASE,activeVersionId:p.BASE,active:true},node=w.nodes.find(n=>n.name==='Build discovery prompt');
 const prefix='const discoveryReferencePrompt='+p.augment.toString()+';\n';assert.ok(node.parameters.jsCode.startsWith(prefix));
 node.parameters.jsCode=node.parameters.jsCode.slice(prefix.length).replace('discoveryReferencePrompt(globalThis.DraftedDiscoveryContract.prompts(r),r).map','globalThis.DraftedDiscoveryContract.prompts(r).map');
 const after=p.prepare(w),restored=structuredClone(after);restored.nodes.find(n=>n.name===node.name).parameters.jsCode=node.parameters.jsCode;assert.deepEqual(restored,w);assert.throws(()=>p.prepare(after));assert.throws(()=>p.prepare({...w,versionId:'changed'}));
});
