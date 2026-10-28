'use strict';
// Version-bound preparation/read-back verification only. HTTP writes belong to
// the separately controlled release script; workflow payloads never enter logs.
const assert=require('node:assert/strict'),crypto=require('node:crypto');
const {snippets}=require('./n8n-structured-context.cjs'),h=require('../tests/helpers/tailor-workflow-harness.cjs'),F=require('../tests/fixtures/tailor-whole-cv.cjs'),G=require('../tests/fixtures/structured-experience-context.cjs'),C=require('../webflow/src/experience-context.js'),P=require('../webflow/src/tailor-sources-v11.js');
const ID='H8oAioy58R1v3PvRe3YUa',VERSION='91ef21b1-6286-4cc4-9385-5ab112149900';
const changed=['Validate + Normalize','Compose source suggestion'];
function canonical(v){return Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;}
const hash=v=>crypto.createHash('sha256').update(typeof v==='string'?v:JSON.stringify(canonical(v))).digest('hex');
const projection=(w,active=false)=>({name:w.name,nodes:active?w.activeVersion.nodes:w.nodes,connections:active?w.activeVersion.connections:w.connections,settings:w.settings});
function structuredRequest(){const r=F.request();r.sourcesSchemaVersion='1.2';r.blocks=structuredClone(G.blocks);r.sourceContext.questions=r.sourceContext.questions.slice(0,1);r.sourceContext.answers=r.sourceContext.answers.slice(0,1);r.sourceContext.applications=[];r.sourceContext.answers[0].text='Coordinated internal planning sessions.';r.sourceContext.answers[0].experienceContext=C.reference(r.cvVersionId,r.blocks.find(b=>b.blockId==='experience-2'));P.validateRequest(r);return r;}
function checkCode(payload){
 const find=name=>payload.nodes.find(n=>n.name===name).parameters.jsCode;const result=[];
 for(const version of ['1.0','1.1','1.2']){
  const r=version==='1.2'?structuredRequest():F.request();r.sourcesSchemaVersion=version;
  const validated=h.runCode(find(changed[0]),{body:r},{},'release42');assert.equal(validated.status,200);assert.equal(validated.sourceRequest.sourcesSchemaVersion,version);
  const input=JSON.parse(validated.llmMessages[1].content);let model=version==='1.2'?G.model(input):version==='1.1'?F.model(input):{additions:[],contextQuestions:[]};
  const data=h.runCode(find(changed[1]),h.response(model),{[changed[0]]:{json:validated}},'release42');assert.equal(data.status,200);P.validateCandidate(r,data.body);if(version==='1.2')assert.equal(data.body.sourceUsage[0].blockId,'experience-2');result.push(version);
 }
 return result;
}
function prepare(w){
 assert.equal(w.id,ID);assert.equal(w.versionId,VERSION);assert.equal(w.activeVersionId,VERSION);assert.equal(w.active,true);assert.equal(hash(projection(w)),hash(projection(w,true)));
 assert.equal(w.staticData,null);assert.equal(Object.keys(w.pinData||{}).length,0);assert.equal((w.nodeGroups||[]).length,0);
 const payload=structuredClone(projection(w)),s=snippets(),hashes=[];
 for(const [i,name] of changed.entries()){const node=payload.nodes.find(n=>n.name===name);assert.equal(node.type,'n8n-nodes-base.code');const old=node.parameters.jsCode;assert(!old.includes("sourcesSchemaVersion==='1.2'"),'Already patched');const prefix=i===0?s.validate:s.compose;node.parameters.jsCode=prefix+old;hashes.push({name,before:hash(old),after:hash(node.parameters.jsCode),prefix:hash(prefix)});}
 assert.equal(payload.nodes.length,w.nodes.length);assert.deepEqual(payload.connections,w.connections);
 for(const node of payload.nodes.filter(n=>!changed.includes(n.name)))assert.deepEqual(node,w.nodes.find(n=>n.id===node.id));
 const versions=checkCode(payload);
 return {id:ID,beforeVersionId:w.versionId,beforeActiveVersionId:w.activeVersionId,beforeUpdatedAt:w.updatedAt,beforeProjectionSha256:hash(projection(w)),candidateProjectionSha256:hash(payload),payload,changedNodes:changed,codeHashes:hashes,localCodeVersionsVerified:versions};
}
function verify(w,plan,active){assert.equal(w.id,plan.id);assert.equal(hash(projection(w)),plan.candidateProjectionSha256);if(active){assert.equal(w.active,true);assert.equal(w.versionId,w.activeVersionId);assert.equal(hash(projection(w,true)),plan.candidateProjectionSha256);}else{assert.equal(w.activeVersionId,plan.beforeActiveVersionId);assert.equal(hash(projection(w,true)),plan.beforeProjectionSha256);}return {id:w.id,versionId:w.versionId,activeVersionId:w.activeVersionId,projectionSha256:plan.candidateProjectionSha256,changedNodes:plan.changedNodes,codeHashes:plan.codeHashes};}
function runtimeFixture(){
 const uuid=()=>crypto.randomUUID(),prefix=snippets(),fixture=structuredRequest(),id=uuid(),name='DEV-141 structured context runtime check (NO MODEL)',route='structured-context-check-'+uuid();
 const node=(name,type,parameters,x)=>({id:uuid(),name,type,typeVersion:type==='n8n-nodes-base.respondToWebhook'?1.5:type==='n8n-nodes-base.webhook'?2:2,position:[x,0],parameters});
 const model=G.model.toString();
 const nodes=[node('Webhook','n8n-nodes-base.webhook',{httpMethod:'POST',path:route,responseMode:'responseNode',options:{}},0),node('Synthetic request','n8n-nodes-base.code',{jsCode:'return [{json:{body:'+JSON.stringify(fixture)+'}}];'},220),node(changed[0],'n8n-nodes-base.code',{jsCode:prefix.validate+"throw Error('EXPECTED_1_2');"},440),node('Synthetic model (NO NETWORK)','n8n-nodes-base.code',{jsCode:`const model=${model};const result=model(JSON.parse($json.llmMessages[1].content));return [{json:{status:'completed',incomplete_details:null,output:[{type:'message',role:'assistant',status:'completed',content:[{type:'output_text',text:JSON.stringify(result)}]}]}}];`},660),node(changed[1],'n8n-nodes-base.code',{jsCode:prefix.compose+"throw Error('EXPECTED_1_2');"},880),node('Respond to test','n8n-nodes-base.respondToWebhook',{respondWith:'json',responseBody:'={{$json.body}}',options:{responseCode:'={{$json.status}}'}},1100)];
 nodes[0].webhookId=uuid();const connections={};for(let i=0;i<nodes.length-1;i++)connections[nodes[i].name]={main:[[{node:nodes[i+1].name,type:'main',index:0}]]};
 return {payload:{name,nodes,connections,settings:{executionOrder:'v1'}},testUrl:'https://drafted.app.n8n.cloud/webhook-test/'+route,syntheticOnly:true,externalModelCalls:0};
}
module.exports={prepare,verify,runtimeFixture,hash,projection,checkCode};
if(require.main===module){let input='';process.stdin.setEncoding('utf8');process.stdin.on('data',s=>input+=s);process.stdin.on('end',()=>{try{const x=JSON.parse(input||'{}'),mode=process.argv[2];let out;if(mode==='prepare')out=prepare(x.workflow);else if(mode==='before-save'){const fresh=prepare(x.workflow);assert.equal(fresh.beforeUpdatedAt,x.plan.beforeUpdatedAt);assert.equal(fresh.candidateProjectionSha256,x.plan.candidateProjectionSha256);assert.equal(hash(x.plan.payload),fresh.candidateProjectionSha256);out={ok:true};}else if(mode==='saved'||mode==='published')out=verify(x.workflow,x.plan,mode==='published');else if(mode==='fixture')out=runtimeFixture();else if(mode==='runtime-proof'){P.validateCandidate(structuredRequest(),x.response);assert.equal(x.response.sourceUsage[0].blockId,'experience-2');out={ok:true};}else throw Error('UNKNOWN_MODE');process.stdout.write(JSON.stringify(out));}catch(e){console.error('STRUCTURED_RELEASE_CHECK_FAILED: '+e.message.split('\n')[0]);process.exitCode=1;}});}
