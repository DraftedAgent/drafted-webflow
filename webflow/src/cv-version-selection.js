/* Version-local selection. Sources are immutable; restore is always a proposal. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.DraftedCvSelection=api;})(globalThis,function(){
 'use strict';const copy=x=>JSON.parse(JSON.stringify(x)),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const fail=code=>{throw Error(code);};
 function validBlocks(blocks){if(!Array.isArray(blocks)||new Set(blocks.map(b=>b.blockId)).size!==blocks.length||blocks.some(b=>!b.blockId||typeof b.text!=='string'))fail('INVALID_BLOCKS');}
 function create({versionId,blocks,answers=[]}){validBlocks(blocks);if(!versionId)fail('MISSING_VERSION');return {schema:'selection-1',versionId,sources:{blocks:copy(blocks),answers:copy(answers)},approved:copy(blocks),omitted:[],proposal:null};}
 function propose(state,operations){
  const next=copy(state);if(next.proposal)fail('REVIEW_IN_PROGRESS');if(!Array.isArray(operations)||!operations.length)fail('EMPTY_SELECTION');
  const ids=new Set();
  for(const op of operations){
   if(!['keep','shorten','omit','restore'].includes(op.action)||!op.blockId||ids.has(op.blockId))fail('INVALID_SELECTION');ids.add(op.blockId);
   const current=next.approved.find(b=>b.blockId===op.blockId),saved=next.omitted.find(x=>x.block.blockId===op.blockId);
   if(op.action==='restore'){if(current||!saved)fail('RESTORE_CONFLICT');}
   else if(!current)fail('UNKNOWN_BLOCK');
   if((op.action!=='keep'||typeof op.text==='string'&&op.text!==current?.text)&&(typeof op.reason!=='string'||!op.reason.trim()))fail('MISSING_SELECTION_REASON');
   if(op.action==='shorten'&&(typeof op.text!=='string'||!op.text.trim()||op.text.length>=current.text.length))fail('INVALID_SHORTENING');
  }
  // Dependencies are restricted to changes within one block in this stage.
  // A changed text and its omission are one operation, never hidden cross-role approval.
  next.proposal={baseline:copy(next.approved),operations:copy(operations).map(op=>({...op,before:copy(next.approved.find(b=>b.blockId===op.blockId)||null),restored:op.action==='restore'?copy(next.omitted.find(x=>x.block.blockId===op.blockId).block):null})),decisions:{}};return next;
 }
 function apply(blocks,op){
  if(op.action==='omit')return blocks.filter(b=>b.blockId!==op.blockId);
  if(op.action==='shorten'||op.action==='keep'&&typeof op.text==='string')return blocks.map(b=>b.blockId===op.blockId?{...b,text:op.text}:b);
  if(op.action==='restore'){if(blocks.some(b=>b.blockId===op.blockId))fail('RESTORE_CONFLICT');return [...blocks,copy(op.restored)].sort((a,b)=>a.order-b.order);}
  return blocks;
 }
 function preview(state){let blocks=copy(state.approved);for(const op of state.proposal?.operations||[])if(!state.proposal.decisions[op.blockId])blocks=apply(blocks,op);return blocks;}
 function decide(state,id,decision){
  if(!['accept','decline'].includes(decision)||!state.proposal)fail('INVALID_DECISION');const next=copy(state),p=next.proposal,op=p.operations.find(x=>x.blockId===id);
  if(!op||p.decisions[id])fail('ALREADY_DECIDED');
  const current=next.approved.find(b=>b.blockId===id)||null;if(!same(current,op.before))fail('STALE_SELECTION');
  if(decision==='accept'){
   if(op.action==='omit')next.omitted.push({block:copy(current),reason:op.reason,versionId:next.versionId});
   next.approved=apply(next.approved,op);
   if(op.action==='restore')next.omitted=next.omitted.filter(x=>x.block.blockId!==id);
  }
  p.decisions[id]=decision;return next;
 }
 function revise(state,id,{text,reason}){const next=copy(state),p=next.proposal,op=p?.operations.find(x=>x.blockId===id);if(!op||p.decisions[id])fail('ALREADY_DECIDED');if(op.action!=='shorten'||typeof text!=='string'||!text.trim()||text.length>=op.before.text.length||!reason?.trim())fail('INVALID_REVISION');op.text=text;op.reason=reason;return next;}
 function settle(state){const next=copy(state);if(next.proposal?.operations.some(op=>!next.proposal.decisions[op.blockId]))fail('UNDECIDED_SELECTION');next.proposal=null;return next;}
 function replaceApproved(state,blocks){validBlocks(blocks);const next=copy(state);next.approved=copy(blocks);return next;}
 return {create,propose,preview,decide,revise,settle,replaceApproved};
});
