'use strict';
// Child-process fixture: isolated HOME, synthetic key and injected HTTP only.
const fs=require('node:fs'),P=require('../../evaluation/model-pilot.cjs'),V=require('../../evaluation/provider.cjs'),L=require('../../evaluation/run-ledger.cjs'),H=require('./model-contracts-harness.cjs'),B=require('../../evaluation/baseline.cjs');
const cfg=JSON.parse(fs.readFileSync(process.argv[2],'utf8')),m=P.manifest();let calls=0,release;
if(cfg.mode==='timeout'){const original=setTimeout;globalThis.setTimeout=(fn,ms,...args)=>original(fn,ms>=89900&&ms<=90000?20:ms,...args);}
function send(x){process.send?.(x);}
const provider=V.createProvider({manifest:m,approval:cfg.approval,apiKey:'synthetic-key',fetch:async(url,options)=>{
 calls++;const body=JSON.parse(options.body),journal=L.inspect(cfg.approval.runId);send({event:'fetch',calls,url,bodyModel:body.model,store:body.store,serviceTier:body.service_tier,maxOutputTokens:body.max_output_tokens,journal:{slotsConsumed:journal.slotsConsumed,reservedCostUSD:journal.reservedCostUSD,closed:journal.closed}});
 if(cfg.mode==='hold')await new Promise(()=>{});
 if(cfg.mode==='timeout')await new Promise((_,reject)=>options.signal.addEventListener('abort',()=>reject(Error('synthetic abort')),{once:true}));
 if(cfg.mode==='parallel-provider')await new Promise(resolve=>release=resolve);
 if(cfg.mode==='http-fail')return {ok:false};
 return {ok:true,json:async()=>({...H.envelope({}),model:'gpt-4.1-mini-2025-04-14',service_tier:cfg.mode==='tier-change'?'priority':'default',usage:{input_tokens:1,output_tokens:cfg.mode==='invalid-usage'?-1:1}})};
}});
(async()=>{
 if(cfg.mode==='parallel-provider'){
  V.start(provider,m,cfg.approval);const spec=m.runs[0],c=m.cases.find(c=>c.id===spec.caseId),binding=B.prepare(c.operation,c.request,spec.scope),args={spec,messages:binding.messages,settings:m.settings};
  const one=provider(args);let parallelError;try{await provider(args);}catch(e){parallelError=e.message;}release();await one;let repeatedError;try{await provider(args);}catch(e){repeatedError=e.message;}V.finish(provider,'complete');send({event:'result',calls,parallelError,repeatedError,receipt:V.receipt(provider)});return;
 }
 const report=await P.run({manifest:m,provider,approval:cfg.approval,mode:'approved',onResult:()=>{if(cfg.mode==='callback-fail')throw Error('SYNTHETIC_RESULT_WRITE_FAILURE');}});send({event:'result',calls,report});
})().catch(e=>{let journal;try{const j=L.inspect(cfg.approval.runId);journal={slotsConsumed:j.slotsConsumed,knownCostUSD:j.knownCostUSD,reservedCostUSD:j.reservedCostUSD,closed:j.closed};}catch{}send({event:'result',calls,error:e.message,journal});});
