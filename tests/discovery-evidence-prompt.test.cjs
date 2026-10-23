const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm');
const patch=require('../backend/n8n-discovery-evidence-prompt.cjs'),{definition}=require('../backend/n8n-discovery-definition.cjs'),contract=require('../webflow/src/experience-discovery-contract.js'),{createHandler}=require('../backend/experience-discovery.cjs'),f=require('./fixtures/tailor-sources.cjs');
function request(){return {schemaVersion:'1.0',operation:'plan',requestId:'req',contextRevision:'ctx',conversationLanguage:'en',cvVersionId:'cv',blocksSchemaVersion:'1.0',blocks:[{...f.blocks[1],blockId:'exp',text:'Supported planning.\nDid not lead workshops.'},{blockId:'other',type:'summary',label:'Profile',order:2,text:'Worked with digital teams.'}],jobContextSchemaVersion:'1.0',jobContext:structuredClone(f.jobContext)};}
function result(quote='Supported planning.'){return {topics:[{key:'planning',question:'Have you helped plan a delivery?',signalRefs:[{field:'topPriorities',index:0}],support:'clear',evidence:[{blockId:'exp',quote}]}]};}
function generated(){return definition({type:'synthetic-model',typeVersion:2,parameters:{responses:{values:[]}}});}
function run(code,request){return vm.runInNewContext('(function(){'+code+'\n})()',{$input:{first:()=>({json:{request}})},TextEncoder})[0].json.promptText;}
test('version-bound approved candidate changes only the planning instruction in one node',()=>{
 const workflow={...generated(),id:patch.ID,versionId:patch.BASE,activeVersionId:patch.BASE,active:true};
 const node=workflow.nodes.find(n=>n.name==='Build discovery prompt');node.parameters.jsCode=node.parameters.jsCode.replace(patch.AFTER,patch.BEFORE);
 const before=structuredClone(workflow),next=patch.prepare(workflow),nextNode=next.nodes.find(n=>n.name===node.name);
 assert.equal(nextNode.parameters.jsCode,node.parameters.jsCode.replace(patch.BEFORE,patch.AFTER));nextNode.parameters.jsCode=node.parameters.jsCode;assert.deepEqual(next,before);assert.deepEqual(workflow,before);
 assert.throws(()=>patch.prepare({...workflow,activeVersionId:'changed'}));assert.throws(()=>patch.prepare(patch.prepare(workflow)));
});
test('generated planning prompt requires verbatim block-bound evidence; interpret task and raw input unchanged',()=>{
 const code=generated().nodes.find(n=>n.name==='Build discovery prompt').parameters.jsCode,r=request(),before=JSON.stringify(r);
 assert.ok(run(code,r).includes(patch.AFTER));assert.equal(JSON.stringify(r),before);
 const interpret={operation:'interpret',conversationLanguage:'en',sourceAnswer:{id:'a',revision:3,text:'No. I supported a colleague; I did not lead.'}};
 assert.equal(run(code,interpret),run(code.replace(patch.AFTER,patch.BEFORE),interpret));assert.ok(run(code,interpret).includes(interpret.sourceAnswer.text));
});
test('paraphrase, translation, punctuation, folded lines and wrong-block quotes remain 422; no repair or inferred clear support',async()=>{
 const r=request(),before=JSON.stringify(r);
 for(const quote of ['Led planning.','Stöttade planeringen.','Supported planning!','Supported planning. Did not lead workshops.','Worked with digital teams.']){
  const raw=result(quote);
  const response=await createHandler({model:()=>raw})(r);assert.equal(response.status,422);assert.equal(response.body.contractError.code,'INVALID_MODEL_OUTPUT');
 }
 assert.equal((await createHandler({model:()=>result()})(r)).status,200);assert.equal(JSON.stringify(r),before);
 const unclear=result();unclear.topics[0].support='unclear';unclear.topics[0].evidence=[];contract.validateResult(r,unclear);
 const {Session}=require('../webflow/src/experience-discovery.js'),s=new Session();s.setContext({revision:r.contextRevision,cvVersionId:r.cvVersionId,blocks:r.blocks,jobContext:r.jobContext});s.plan({contextRevision:r.contextRevision,topics:unclear.topics},'en');assert.equal(s.round().total,1);assert.equal(s.snapshot().context.blocks[0].text,r.blocks[0].text);
});
