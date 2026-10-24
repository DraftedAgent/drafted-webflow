'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),R=require('../backend/model-contracts-runtime.cjs'),B=require('./baseline.cjs'),materials=require('./materials.cjs');
const root=path.resolve(__dirname,'..'),stable=x=>JSON.stringify(sort(x));
function sort(x){return Array.isArray(x)?x.map(sort):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,sort(x[k])])):x;}
const sha=x=>crypto.createHash('sha256').update(typeof x==='string'?x:stable(x)).digest('hex');
function sources(){const list=[];for(const dir of ['backend','webflow/src','evaluation','tests/helpers','tests/fixtures'])for(const name of fs.readdirSync(path.join(root,dir))){const file=dir+'/'+name;if(fs.statSync(path.join(root,file)).isFile()&&/\.(?:cjs|js|json)$/.test(name))list.push(file);}return Object.fromEntries(list.sort().map(file=>[file,sha(fs.readFileSync(path.join(root,file),'utf8').replace(/\r\n?/g,'\n'))]));}
function manifest(){
 const cases=materials.cases(),runs=[];for(const c of cases)for(let repeat=1;repeat<=2;repeat++)for(const profile of ['baseline','candidate']){const scope='pilot_'+c.id.replace(/-/g,'_')+'_'+repeat,binding=(profile==='baseline'?B:R).prepare(c.operation,c.request,scope);runs.push({caseId:c.id,operation:c.operation,repeat,profile,scope,textFormat:c.operation==='tailor'?'text':'json_object',messagesSha256:sha(binding.messages),schemaSha256:sha(binding.schema)});}
 const value={version:1,synthetic:true,workflowBases:{discovery:'6336f54e-9913-4976-bd32-78d8508338d5',tailor:'a5196f17-4ccc-41db-8993-9b6c5fe466dd'},settings:{model:'gpt-4.1-mini',temperature:0.2,maxOutputTokens:4000,store:false,timeoutMs:90000,maxDurationMs:1800000,concurrency:1,retries:0,maxCalls:72,endpoint:'https://api.openai.com/v1/responses'},materialsSha256:sha(cases),sourcesSha256:sha(sources()),cases,runs};return {...value,manifestSha256:sha(value)};
}
function verify(m){const expected=manifest();if(m.manifestSha256!==expected.manifestSha256||sha({...m,manifestSha256:undefined})!==sha({...expected,manifestSha256:undefined}))throw Error('PILOT_MANIFEST_DRIFT');return expected;}
function validateApproval(m,a){if(!a||a.approved!==true||a.manifestSha256!==m.manifestSha256||a.materialsSha256!==m.materialsSha256||a.sourcesSha256!==m.sourcesSha256||a.maxCalls!==72||!Number.isFinite(a.maxCostUSD)||a.maxCostUSD<=0||!Number.isFinite(a.inputUSDPerMillion)||a.inputUSDPerMillion<=0||!Number.isFinite(a.outputUSDPerMillion)||a.outputUSDPerMillion<=0)throw Error('PILOT_APPROVAL_REQUIRED');}
function checks(c,done){
 const body=done.body,expected=c.expected,result={expectedOutcome:expected.outcomes.includes(done.outcome),publicSuccess:body?.ok===true};
 if(body?.ok){if(c.operation==='plan'){const n=body.result.topics.length;result.questionBounds=(expected.minQuestions==null||n>=expected.minQuestions)&&(expected.maxQuestions==null||n<=expected.maxQuestions);}
  if(c.operation==='tailor'){const n=body.sourceUsage.length;result.additionBounds=(expected.minAdditions==null||n>=expected.minAdditions)&&(expected.maxAdditions==null||n<=expected.maxAdditions);if(expected.requiredContextAnswer)result.contextQuestion=body.contextQuestions.some(q=>q.answerId===expected.requiredContextAnswer&&q.reason==='context_unclear');if(expected.requiredNewBlockAnswer)result.newBlockNotCreated=body.blocks.length===c.request.blocks.length&&body.contextQuestions.some(q=>q.answerId===expected.requiredNewBlockAnswer&&q.reason==='new_block_required');if(expected.requiredFrozenBlock)result.uncertainTextFrozen=body.blocks.find(b=>b.blockId===expected.requiredFrozenBlock).text===c.request.blocks.find(b=>b.blockId===expected.requiredFrozenBlock).text&&body.sourceReview.some(r=>r.blockId===expected.requiredFrozenBlock);}}
 return result;
}
function reservation(m,a,messages){return ( (Buffer.byteLength(JSON.stringify(messages),'utf8')+4096)*a.inputUSDPerMillion+m.settings.maxOutputTokens*a.outputUSDPerMillion)/1000000;}
async function run({manifest:m,provider,mode='mock',approval=null,now=()=>Date.now(),onResult=()=>{}}){
 verify(m);if(typeof provider!=='function')throw Error('EXPLICIT_PILOT_PROVIDER_REQUIRED');if(mode!=='mock'&&mode!=='approved')throw Error('EXPLICIT_PILOT_MODE_REQUIRED');if(mode==='mock'&&provider.synthetic!==true)throw Error('SYNTHETIC_PROVIDER_REQUIRED');if(mode==='approved')validateApproval(m,approval);
 const started=now(),results=[];let spent=0,unknownExposure=0,actualModel=null,stopReason='complete';
 for(const spec of m.runs){
  if(results.length>=m.settings.maxCalls){stopReason='call_cap';break;}if(now()-started>=m.settings.maxDurationMs){stopReason='duration_cap';break;}
  const c=m.cases.find(c=>c.id===spec.caseId),binding=(spec.profile==='baseline'?B:R).prepare(c.operation,c.request,spec.scope);
  if(sha(binding.messages)!==spec.messagesSha256||sha(binding.schema)!==spec.schemaSha256)throw Error('PILOT_BINDING_DRIFT');
  const inputBound=Buffer.byteLength(JSON.stringify(binding.messages),'utf8')+4096,reserved=mode==='approved'?reservation(m,approval,binding.messages):0;
  if(mode==='approved'&&spent+reserved>approval.maxCostUSD){stopReason='cost_cap';break;}
  const controller=new AbortController(),callStart=now();let timer,response,shape={shapeValid:false,referencesValid:false,reason:null,path:null},done={outcome:'technical_error'},abortReason=null,accounted=false,callCost=null,externalAttempted=false;
  try{
   response=await Promise.race([provider({messages:binding.messages,settings:m.settings,signal:controller.signal,spec,material:c,binding}),new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('PILOT_TIMEOUT'));},Math.min(m.settings.timeoutMs,m.settings.maxDurationMs-(now()-started)));})]);
   externalAttempted=response?.externalAttempted===true;
   if(mode==='approved'){
    if(!response?.usage||!Number.isInteger(response.usage.input_tokens)||!Number.isInteger(response.usage.output_tokens)||response.usage.input_tokens<0||response.usage.input_tokens>inputBound||response.usage.output_tokens<0||response.usage.output_tokens>m.settings.maxOutputTokens)throw Error('PILOT_USAGE_INVALID');
    callCost=(response.usage.input_tokens*approval.inputUSDPerMillion+response.usage.output_tokens*approval.outputUSDPerMillion)/1000000;spent+=callCost;accounted=true;
    if(typeof response.model!=='string'||actualModel&&actualModel!==response.model)throw Error('PILOT_MODEL_CHANGED');actualModel=response.model;
   }
   const raw=R.extract(response.envelope);shape=(spec.profile==='baseline'?B:R).assess(binding,raw);
   done=spec.profile==='baseline'?B.compose(binding,response.envelope):R.compose(binding,raw,{id:(()=>{let i=0;return ()=>'pilot_add_'+(++i);})()});
  }catch(e){
   externalAttempted=externalAttempted||e.externalAttempted===true;done={outcome:'technical_error'};const d=R.diagnostic(c.operation,c.request.requestId,422,e,'INVALID_MODEL_OUTPUT');if(!shape.reason)shape={...shape,reason:d.reason,path:d.path};
   if(mode==='approved'&&(!accounted||e.message==='PILOT_MODEL_CHANGED')){abortReason=['PILOT_TIMEOUT','PILOT_USAGE_INVALID','PILOT_MODEL_CHANGED'].includes(e.message)?e.message:'PILOT_PROVIDER_FAILED';stopReason=abortReason;if(!accounted)unknownExposure+=reserved;}
  }finally{clearTimeout(timer);}
  const result={...spec,...shape,outcome:done.outcome,backendRecovered:!shape.referencesValid&&done.outcome!=='technical_error',checks:checks(c,done),durationMs:Math.max(0,now()-callStart),usage:accounted||mode==='mock'?response?.usage||null:null,costUSD:callCost,externalAttempted,abortReason,questionCount:done.body?.result?.topics?.length??null,resultSha256:done.body?sha(done.body):null,rawSha256:response?.envelope?sha(response.envelope):null,manualReview:{status:'pending',checklist:c.review},...(mode==='mock'?{}:{syntheticRawResponse:response?.envelope||null,syntheticFinalResponse:done.body||null})};
  results.push(result);onResult(result);if(abortReason)break;
 }
 const groups={};for(const r of results){const key=r.operation+':'+r.profile,g=groups[key]||(groups[key]={attempts:0,shapeValid:0,referencesValid:0,recovered:0,technicalErrors:0,checksPassed:0});g.attempts++;g.shapeValid+=+r.shapeValid;g.referencesValid+=+r.referencesValid;g.recovered+=+r.backendRecovered;g.technicalErrors+=+(r.outcome==='technical_error');g.checksPassed+=+Object.values(r.checks||{}).every(Boolean);}
 const variation=[];for(const c of m.cases)for(const profile of ['baseline','candidate']){const rows=results.filter(r=>r.caseId===c.id&&r.profile===profile);variation.push({caseId:c.id,profile,repeats:rows.length,outcomes:rows.map(r=>r.outcome),questionCounts:rows.map(r=>r.questionCount),distinctRawOutputs:new Set(rows.map(r=>r.rawSha256)).size,semanticReview:'pending'});}
 return {version:1,manifestSha256:m.manifestSha256,mode,externalCallsAttempted:results.filter(r=>r.externalAttempted).length,providerAttempts:results.length,calls:results.length,complete:results.length===m.runs.length,stopReason,knownCostUSD:mode==='approved'?spent:null,costUncertain:unknownExposure>0,maxUnaccountedCostUSD:unknownExposure,actualModel,groups,variation,results,manualReviewRequired:true,productionReliabilityClaim:false,releaseApproved:false};
}
module.exports={manifest,verify,validateApproval,checks,run,sha,reservation};
