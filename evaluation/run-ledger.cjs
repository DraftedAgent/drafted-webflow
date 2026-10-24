'use strict';
// Local, durable, fail-closed run journal. Never selected by a results folder.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const RUN_ID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ROOT=path.join(os.homedir(),'.codex','drafted-model-pilot-runs');
const allowedReasons=new Set(['complete','cost_cap','call_cap','duration_cap','interrupted','provider_failed','usage_invalid','service_tier_changed','model_changed','runner_failed']);
function createStore(root){
 const fileFor=id=>{if(!RUN_ID.test(id))throw Error('PILOT_RUN_ID_INVALID');return path.join(root,id.toLowerCase()+'.jsonl');};
 function claim({approval,approvalSha256,manifestSha256}){
  fs.mkdirSync(root,{recursive:true,mode:0o700});let fd;
  try{fd=fs.openSync(fileFor(approval.runId),'wx',0o600);}catch(e){throw Error(e.code==='EEXIST'?'PILOT_RUN_ALREADY_CLAIMED':'PILOT_LEDGER_UNAVAILABLE');}
  let active=true,blocked=false,knownCostUSD=0,reservedCostUSD=0,pending=null;const used=new Set();
  function append(event){try{const bytes=Buffer.from(JSON.stringify(event)+'\n');let offset=0;while(offset<bytes.length){const n=fs.writeSync(fd,bytes,offset,bytes.length-offset);if(!n)throw Error();offset+=n;}fs.fsyncSync(fd);}catch{active=false;try{fs.closeSync(fd);}catch{}throw Error('PILOT_LEDGER_WRITE_FAILED');}}
  // An empty/truncated file from a crash is ALSO consumed: never unlink/reclaim.
  append({event:'claimed',version:2,runId:approval.runId.toLowerCase(),approvalSha256,manifestSha256,approval:{...approval,runId:approval.runId.toLowerCase()},at:new Date().toISOString()});
  const snapshot=()=>({runId:approval.runId.toLowerCase(),approvalSha256,manifestSha256,slotsConsumed:used.size,knownCostUSD,reservedCostUSD,active,blocked});
  return {
   snapshot,
   reserve(slot,cost){
    if(!active||blocked)throw Error('PILOT_RUN_CLOSED');if(pending)throw Error('PILOT_RUN_BUSY');if(used.has(slot))throw Error('PILOT_SLOT_CONSUMED');
    if(!Number.isFinite(cost)||cost<=0||used.size>=approval.maxCalls||knownCostUSD+reservedCostUSD+cost>approval.maxCostUSD)throw Error('PILOT_PROVIDER_CAP');
    append({event:'reserved',slot,reservationUSD:cost,slotsConsumed:used.size+1,knownCostUSD,reservedCostUSD:reservedCostUSD+cost});used.add(slot);pending={slot,cost};reservedCostUSD+=cost;
   },
   settle(slot,cost){
    if(!active||!pending||pending.slot!==slot)throw Error('PILOT_LEDGER_STATE_INVALID');
    if(cost!==null&&(!Number.isFinite(cost)||cost<0||cost>pending.cost))throw Error('PILOT_LEDGER_COST_INVALID');
    if(cost===null){append({event:'unaccounted',slot,knownCostUSD,reservedCostUSD});blocked=true;}
    else{append({event:'settled',slot,costUSD:cost,knownCostUSD:knownCostUSD+cost,reservedCostUSD:reservedCostUSD-pending.cost});knownCostUSD+=cost;reservedCostUSD-=pending.cost;}
    pending=null;
   },
   finish(reason){if(!active)return snapshot();const terminal=allowedReasons.has(reason)?reason:'runner_failed';append({event:'closed',reason:terminal,...snapshot(),active:false});active=false;fs.closeSync(fd);return snapshot();}
  };
 }
 function inspect(id){
  // Read-only reconstruction, never recovery/resumption. Pending reservations stay held.
  const text=fs.readFileSync(fileFor(id),'utf8'),events=[];let corrupt=false;
  for(const line of text.split('\n').filter(Boolean)){try{events.push(JSON.parse(line));}catch{corrupt=true;break;}}
  const last=events.at(-1),header=events[0];return {runId:id.toLowerCase(),consumed:true,corrupt:corrupt||header?.event!=='claimed',closed:last?.event==='closed',slotsConsumed:events.filter(e=>e.event==='reserved').length,knownCostUSD:last?.knownCostUSD??0,reservedCostUSD:last?.reservedCostUSD??0,events};
 }
 return {claim,inspect};
}
const store=createStore(ROOT);
module.exports={RUN_ID,ROOT,createStore,claim:store.claim,inspect:store.inspect};
