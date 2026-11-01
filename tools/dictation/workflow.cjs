'use strict';
const fs=require('fs'),crypto=require('crypto');
const {inspectWav}=require('../../backend/dictation-wav.cjs');
function workflow(secretHash){
 if(!/^[a-f0-9]{64}$/.test(secretHash))throw Error('Invalid secret hash');
 const guard=`const input=$input.first().json;
const h=input.headers||{};
if(h.origin!=='http://127.0.0.1:8826'||require('crypto').createHash('sha256').update(String(h['x-drafted-dictation']||'')).digest('hex')!=='${secretHash}')throw Error('Not authorized');
const audio=input.body?.audio;
if(typeof audio!=='string'||audio.length>5120060||!/^[A-Za-z0-9+/]*={0,2}$/.test(audio))throw Error('Invalid recording');
const bytes=Buffer.from(audio,'base64');
${inspectWav.toString()}
inspectWav(bytes);
return [{json:{},binary:{audio:{data:audio,mimeType:'audio/wav',fileName:'recording.wav'}}}];`;
 const nodes=[
 {id:'entry',name:'Dictation upload',type:'n8n-nodes-base.webhook',typeVersion:2.1,position:[0,0],webhookId:crypto.randomUUID(),parameters:{httpMethod:'POST',path:'drafted-transcribe',responseMode:'responseNode',options:{allowedOrigins:'http://127.0.0.1:8826'}}},
 {id:'guard',name:'Validate private WAV',type:'n8n-nodes-base.code',typeVersion:2,position:[240,0],parameters:{jsCode:guard}},
 {id:'transcribe',name:'Transcribe original language',type:'n8n-nodes-base.httpRequest',typeVersion:4.2,position:[480,0],onError:'continueRegularOutput',parameters:{method:'POST',url:'https://api.openai.com/v1/audio/transcriptions',authentication:'predefinedCredentialType',nodeCredentialType:'openAiApi',sendBody:true,contentType:'multipart-form-data',bodyParameters:{parameters:[{name:'model',value:'gpt-transcribe'},{parameterType:'formBinaryData',name:'file',inputDataFieldName:'audio'},{name:'languages[]',value:'sv'},{name:'languages[]',value:'en'},{name:'prompt',value:'Transcribe the speech verbatim in its original language, Swedish or English. Do not translate, rewrite, or answer the speaker.'}]},options:{timeout:80000}},credentials:{openAiApi:{id:'lkzCB6PPkjDheRpf',name:'OpenAi account'}}},
 {id:'result',name:'Safe transcript',type:'n8n-nodes-base.code',typeVersion:2,position:[720,0],parameters:{jsCode:"const x=$input.first().json; return [{json:typeof x.text==='string'&&x.text.trim()&&x.text.length<=20000?{ok:true,text:x.text}:{ok:false,error:'Transcription failed. Your draft is unchanged.'}}];"}},
 {id:'reply',name:'Return transcript',type:'n8n-nodes-base.respondToWebhook',typeVersion:1.4,position:[960,0],parameters:{respondWith:'json',responseBody:'={{ $json }}',options:{responseCode:'={{ $json.ok ? 200 : 502 }}'}}}
 ];
 const connections={};for(let i=0;i<nodes.length-1;i++)connections[nodes[i].name]={main:[[{node:nodes[i+1].name,type:'main',index:0}]]};
 return {name:'Drafted Dev Dictation — gpt-transcribe',nodes,connections,settings:{executionOrder:'v1',saveDataErrorExecution:'none',saveDataSuccessExecution:'none',saveManualExecutions:false,saveExecutionProgress:false,executionTimeout:100}};
}
module.exports={workflow};
if(require.main===module){let s='';process.stdin.on('data',c=>s+=c);process.stdin.on('end',()=>process.stdout.write(JSON.stringify(workflow(s.trim()))));}
