'use strict';
// Offline preparation only. No HTTP calls, publication or model execution.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const {hash,projection,checkCode}=require('./structured-context-release.cjs');
const VERSION='27962c92-3fff-487d-a9a0-1138d1545172',BASE='27414c488c5dbcc06c9a155f52f14773307afdbd';
function prepare(workflow){
 assert.equal(workflow.id,'H8oAioy58R1v3PvRe3YUa');assert.equal(workflow.versionId,VERSION);assert.equal(workflow.activeVersionId,VERSION);assert.equal(workflow.active,true);
 const before=projection(workflow);assert.equal(hash(before),'9bc09c9ca85011a77fb1b37e441e6ed71e513fce2484713e814eb66e3ad279d0');assert.equal(hash(projection(workflow,true)),hash(before));
 const root=path.resolve(__dirname,'..'),old=execFileSync('git',['show',BASE+':backend/tailor-whole-cv/contract.cjs'],{cwd:root,encoding:'utf8'}),current=fs.readFileSync(path.join(__dirname,'tailor-whole-cv/contract.cjs'),'utf8');
 const line=text=>{const lines=text.replace(/\r\n?/g,'\n').split('\n').filter(l=>l.startsWith(' return {catalog,compile,prompt:'));assert.equal(lines.length,1);return lines[0];};
 const oldLine=line(old),newLine=line(current);assert.notEqual(oldLine,newLine);assert.equal(old.replace(oldLine,newLine).replace(/\r\n?/g,'\n'),current.replace(/\r\n?/g,'\n'));
 const payload=structuredClone(before),node=payload.nodes.find(n=>n.name==='Validate + Normalize');assert.equal(node.type,'n8n-nodes-base.code');const code=node.parameters.jsCode;assert.equal(code.split(oldLine).length,2);node.parameters.jsCode=code.replace(oldLine,newLine);
 for(const other of payload.nodes.filter(n=>n.id!==node.id))assert.deepEqual(other,workflow.nodes.find(n=>n.id===other.id));assert.deepEqual(payload.connections,workflow.connections);assert.deepEqual(payload.settings,workflow.settings);
 const versions=checkCode(payload);
 return {payload,receipt:{workflowId:workflow.id,beforeVersionId:VERSION,beforeUpdatedAt:workflow.updatedAt,beforeProjectionSha256:hash(before),candidateProjectionSha256:hash(payload),changedNodes:[node.name],codeHashes:{before:hash(code),after:hash(node.parameters.jsCode)},localCodeVersionsVerified:versions,productionWrites:0,modelCalls:0}};
}
module.exports={prepare};
if(require.main===module){let text='';process.stdin.setEncoding('utf8');process.stdin.on('data',s=>text+=s);process.stdin.on('end',()=>{try{const input=JSON.parse(text),mode=process.argv[2];let out;if(mode==='saved'||mode==='published'){const {workflow:w,receipt:r}=input;assert.equal(w.id,r.workflowId);assert.equal(hash(projection(w)),r.candidateProjectionSha256);if(mode==='published'){assert.equal(w.active,true);assert.equal(w.versionId,w.activeVersionId);assert.equal(hash(projection(w,true)),r.candidateProjectionSha256);}else{assert.equal(w.activeVersionId,r.beforeVersionId);assert.equal(hash(projection(w,true)),r.beforeProjectionSha256);}out={...r,versionId:w.versionId,activeVersionId:w.activeVersionId,productionWrites:mode==='published'?2:1};}else{const plan=prepare(input);out=mode==='plan'?plan:plan.receipt;}process.stdout.write(JSON.stringify(out,null,2));}catch{console.error('TARGET_CATALOG_PREPARATION_FAILED');process.exitCode=1;}});}
