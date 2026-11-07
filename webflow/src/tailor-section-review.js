/* Local section decisions over an immutable, fully validated proposal.
 * Evidence stays bound to the original request; never rebase a recipe onto
 * partially accepted blocks. Only the selected block and its receipts commit. */
(function(root){
 'use strict';
 const copy=x=>JSON.parse(JSON.stringify(x)),keys=['groups','history','integrations','integrationHistory','languageApplications','languageHistory'];
 const equal=(a,b)=>root.DraftedCoverageContract.canonical(a)===root.DraftedCoverageContract.canonical(b);
 const assert=(v,code)=>{if(!v)throw Error(code);};
 function ledger(value){return Object.fromEntries(keys.map(k=>[k,copy(value[k]||[])]));}
 function changed(request,data){return data.blocks.filter(b=>!equal(b,request.blocks.find(o=>o.blockId===b.blockId))).map(b=>b.blockId);}
 function blocks(request,data,decisions,preview=false){return request.blocks.map(b=>copy(decisions[b.blockId]==='accept'||preview&&!decisions[b.blockId]?data.blocks.find(n=>n.blockId===b.blockId):b));}
 async function project(request,data,session){
  assert(['1.3','1.4','1.5'].includes(data.sourcesSchemaVersion),'SECTION_REVIEW_REQUIRES_VALIDATED_SOURCES');
  const ids=changed(request,data);
  assert(Object.entries(session.decisions).every(([id,value])=>ids.includes(id)&&['accept','decline'].includes(value)),'INVALID_SECTION_DECISION');
  const full=new root.DraftedTailorSources.Ledger();Object.assign(full,copy(session.ledger));await full.commit(request,data);
  const accepted=new Set(Object.keys(session.decisions).filter(id=>session.decisions[id]==='accept'));
  const result={};for(const k of keys)result[k]=[...copy(session.ledger[k]||[]).filter(g=>!accepted.has(g.blockId)),...copy(full[k]||[]).filter(g=>accepted.has(g.blockId))];
  return {blocks:blocks(request,data,session.decisions),ledger:result};
 }
 async function decide({request,data,session,currentBlocks,currentLedger,ids,decision}){
  assert(['accept','decline'].includes(decision)&&ids.length&&new Set(ids).size===ids.length,'INVALID_SECTION_DECISION');
  const changes=changed(request,data);assert(ids.every(id=>changes.includes(id)&&!session.decisions[id]),'SECTION_ALREADY_DECIDED');
  const expected=await project(request,data,session);
  assert(equal(currentBlocks,expected.blocks)&&equal(ledger(currentLedger),expected.ledger),'STALE_SECTION_REVIEW');
  const next=copy(session);for(const id of ids)next.decisions[id]=decision;
  return {...await project(request,data,next),session:next};
 }
 // Derived display only: never passed to candidate, ledger or export.
 function summary(request,data,decisions={}){
  const ids=changed(request,data),accepted=ids.filter(id=>decisions[id]==='accept'),pending=ids.filter(id=>!decisions[id]),declined=ids.filter(id=>decisions[id]==='decline');
  const shown=blocks(request,data,decisions,true),active=shown.filter(b=>ids.includes(b.blockId)&&decisions[b.blockId]!=='decline');
  const clean=value=>String(value||'').replace(/\s+/g,' ').trim();
  const clip=value=>{const text=clean(value);return text.length>140?text.slice(0,137).replace(/\s+\S*$/,'')+'…':text;};
  const label=b=>clean(b.title||b.label||b.type);
  const focus=active.slice(0,3).map(b=>label(b)+': “'+clip(b.text)+'”').join('; ');
  const shortened=active.filter(b=>clean(b.text).length<clean(request.blocks.find(x=>x.blockId===b.blockId).text).length).map(label);
  const overview=active.length?(pending.length?'The proposed version presents ':'Your reviewed CV presents ')+focus+(active.length>3?'; with changes in '+(active.length-3)+' other sections.':'.')+(shortened.length?' Wording is more concise in '+shortened.join(', ')+'.':''):'Your existing wording is retained; no changes from this review were accepted.';
  return {overview,status:'Accepted: '+accepted.length+' · Pending: '+pending.length+' · Declined: '+declined.length,accepted,pending,declined};
 }
 root.DraftedSectionReview={ledger,changed,blocks,project,decide,summary};
})(globalThis);
