'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto'),{fork}=require('node:child_process'),P=require('../evaluation/model-pilot.cjs'),L=require('../evaluation/run-ledger.cjs');
const temp=()=>fs.mkdtempSync(path.join(os.tmpdir(),'drafted-run-ledger-test-'));
const approve=()=>({...P.approvalTemplate(P.manifest()),approved:true,maxCostUSD:100,inputUSDPerMillion:1,outputUSDPerMillion:1});
function child(home,approval,mode='success'){
 const dir=fs.mkdtempSync(path.join(home,'different-results-')),config=path.join(dir,'input.json');fs.writeFileSync(config,JSON.stringify({approval,mode,folder:dir}));const process=fork(path.join(__dirname,'helpers/pilot-process.cjs'),[config],{env:{...globalThis.process.env,HOME:home,USERPROFILE:home},silent:true});const events=[],waiters=[];let stderr='';process.stderr.on('data',s=>stderr+=s);process.on('message',m=>{events.push(m);for(const w of [...waiters])if(w.predicate(m)){clearTimeout(w.timer);waiters.splice(waiters.indexOf(w),1);w.resolve(m);}});
 function wait(predicate){const found=events.find(predicate);if(found)return Promise.resolve(found);return new Promise((resolve,reject)=>{const waiter={predicate,resolve,timer:setTimeout(()=>{process.kill();reject(Error('Child fixture timeout: '+stderr));},15000)};waiters.push(waiter);});}
 return {process,events,result:()=>wait(m=>m.event==='result'),fetch:()=>wait(m=>m.event==='fetch'),stop:()=>new Promise(resolve=>{for(const w of waiters)clearTimeout(w.timer);waiters.length=0;if(process.exitCode!==null||process.signalCode!==null)return resolve();process.once('exit',resolve);process.kill('SIGKILL');})};
}
const storeAt=home=>L.createStore(path.join(home,'.codex','drafted-model-pilot-runs'));
test('durable reservations and actual/unknown cost survive reopening; consumed IDs cannot reset with changed budget',()=>{
 const root=temp(),store=L.createStore(root),approval=approve(),run=store.claim({approval,approvalSha256:P.sha(approval),manifestSha256:approval.manifestSha256});run.reserve('first',0.2);assert.equal(store.inspect(approval.runId).reservedCostUSD,0.2);run.settle('first',0.05);run.reserve('second',0.2);run.settle('second',null);run.finish('provider_failed');const read=L.createStore(root).inspect(approval.runId);assert.equal(read.knownCostUSD,0.05);assert.equal(read.reservedCostUSD,0.2);assert.equal(read.slotsConsumed,2);assert.equal(read.closed,true);assert.throws(()=>store.claim({approval:{...approval,maxCostUSD:999},approvalSha256:'changed'}),/ALREADY_CLAIMED/);assert.throws(()=>store.claim({approval:{...approval,runId:approval.runId.toUpperCase()}}),/ALREADY_CLAIMED/);
});
test('truncated/empty journals are consumed and never automatically reclaimed',()=>{
 const root=temp(),id=crypto.randomUUID();fs.writeFileSync(path.join(root,id+'.jsonl'),'{partial');const store=L.createStore(root);assert.equal(store.inspect(id).corrupt,true);assert.throws(()=>store.claim({approval:{runId:id}}),/ALREADY_CLAIMED/);
});
test('new process and new results folder cannot replay a completed approval; another approval runId can start',async()=>{
 const home=temp(),approval=approve(),one=child(home,approval);try{const result=await one.result();assert.equal(result.calls,72);assert.equal(result.report.executionReceipt.slotsConsumed,72);assert.equal(result.report.costUncertain,false);assert.equal(result.report.executionReceipt.active,false);assert.equal(one.events.filter(e=>e.event==='fetch').length,72);const f=one.events.find(e=>e.event==='fetch');assert.equal(f.url,'https://api.openai.com/v1/responses');assert.equal(f.store,false);assert.equal(f.serviceTier,'default');assert.equal(f.maxOutputTokens,4000);assert.equal(f.journal.slotsConsumed,1);assert.ok(f.journal.reservedCostUSD>0);
  const two=child(home,approval);try{const replay=await two.result();assert.equal(replay.error,'PILOT_RUN_ALREADY_CLAIMED');assert.equal(replay.calls,0);}finally{await two.stop();}
  const three=child(home,{...approval,runId:crypto.randomUUID(),maxCostUSD:0.000001});try{const fresh=await three.result();assert.equal(fresh.report.stopReason,'cost_cap');assert.equal(fresh.calls,0);}finally{await three.stop();}
 }finally{await one.stop();}
});
test('parallel process starts atomically claim one run; killed owner leaves reserved budget and cannot restart',async()=>{
 const home=temp(),approval=approve(),one=child(home,approval,'hold'),two=child(home,approval,'hold');try{
  const first=await Promise.race([one.fetch().then(m=>({owner:one,other:two,m})),two.fetch().then(m=>({owner:two,other:one,m}))]);const refused=await first.other.result();assert.equal(refused.error,'PILOT_RUN_ALREADY_CLAIMED');assert.equal(refused.calls,0);assert.ok(first.m.journal.reservedCostUSD>0);await first.owner.stop();const journal=storeAt(home).inspect(approval.runId);assert.equal(journal.slotsConsumed,1);assert.ok(journal.reservedCostUSD>0);assert.equal(journal.closed,false);
  const restarted=child(home,approval);try{const result=await restarted.result();assert.equal(result.error,'PILOT_RUN_ALREADY_CLAIMED');assert.equal(result.calls,0);}finally{await restarted.stop();}
 }finally{await one.stop();await two.stop();}
});
test('parallel invocations and repeated slots inside one process do not produce duplicate transport',async()=>{
 const c=child(temp(),approve(),'parallel-provider');try{const r=await c.result();assert.equal(r.parallelError,'PILOT_RUN_BUSY');assert.equal(r.repeatedError,'PILOT_SLOT_CONSUMED');assert.equal(r.calls,1);assert.equal(r.receipt.slotsConsumed,1);}finally{await c.stop();}
});
test('transport/usage/result-write failures consume consent and preserve durable budget, without retry',async()=>{
 for(const mode of ['http-fail','invalid-usage','callback-fail','timeout','tier-change']){const home=temp(),a=approve(),c=child(home,a,mode);try{const r=await c.result();assert.equal(r.calls,1);const state=storeAt(home).inspect(a.runId);assert.equal(state.slotsConsumed,1);assert.equal(state.closed,true);if(mode==='callback-fail'){assert.ok(state.knownCostUSD>0);assert.equal(state.reservedCostUSD,0);}else{assert.ok(state.reservedCostUSD>0);assert.equal(r.report.costUncertain,true);assert.equal(r.report.calls,1);if(mode==='timeout')assert.equal(r.report.stopReason,'PILOT_TIMEOUT');if(mode==='tier-change')assert.equal(r.report.stopReason,'PILOT_SERVICE_TIER_CHANGED');assert.ok(Object.values(r.report.groups).every(g=>Number.isFinite(g.shapeValid)));}
  const again=child(home,a);try{assert.equal((await again.result()).error,'PILOT_RUN_ALREADY_CLAIMED');assert.equal(again.events.filter(e=>e.event==='fetch').length,0);}finally{await again.stop();}
 }finally{await c.stop();}}
});

test('persisted actual spend constrains later reservations and unknown spend is never released',()=>{
 const root=temp(),approval={...approve(),maxCostUSD:0.3},store=L.createStore(root),run=store.claim({approval,approvalSha256:P.sha(approval),manifestSha256:approval.manifestSha256});run.reserve('one',0.3);run.settle('one',0.29);assert.throws(()=>run.reserve('two',0.02),/CAP/);assert.equal(store.inspect(approval.runId).slotsConsumed,1);assert.equal(store.inspect(approval.runId).knownCostUSD,0.29);run.finish('cost_cap');
});
