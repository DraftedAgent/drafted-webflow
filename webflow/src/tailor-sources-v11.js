/* Negotiated whole-CV edits plus answer-derived additions; shared browser/backend code. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./tailor-sources.js'));else root.DraftedTailorSources=factory(root.DraftedTailorSources);})(globalThis,function(legacy){
 'use strict';
 const copy=x=>JSON.parse(JSON.stringify(x)),old=r=>({...r,sourcesSchemaVersion:r.sourcesSchemaVersion==='1.2'?'1.2':'1.0'});
 function check(ok,code='INVALID_SOURCE_CANDIDATE'){if(!ok)throw Error(code);}
 function exact(o,keys){check(o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).length===keys.length&&keys.every(k=>Object.hasOwn(o,k)));}
 function validateRequest(r){check(['1.0','1.1','1.2'].includes(r?.sourcesSchemaVersion),'INVALID_SOURCE_REQUEST');return legacy.validateRequest(old(r));}
 function prepare(r){validateRequest(r);return legacy.prepare(old(r));}
 function cvCatalog(r){
  const base=prepare(r),targets=[];
  for(const b of base.blocks){if(base.review.some(x=>x.blockId===b.blockId))continue;const additions=base.applications.find(g=>g.blockId===b.blockId)?.additions||[];let start=0;
   for(const a of [...additions,{start:b.text.length,end:b.text.length}]){if(a.start>start||!b.text.length)targets.push({blockId:b.blockId,start,end:a.start,originalText:b.text.slice(start,a.start)});start=a.end;}
  }return {base,targets,evidence:targets.filter(t=>t.originalText.trim()).map(t=>({blockId:t.blockId,quote:t.originalText}))};
 }
 function rebase(blocks,applications,edits){
  const next=copy(blocks),groups=copy(applications);
  for(const b of next){const list=edits.filter(e=>e.blockId===b.blockId).sort((a,z)=>a.start-z.start);let cursor=0,text='';for(const e of list){check(e.start>=cursor);text+=b.text.slice(cursor,e.start)+e.proposedText;cursor=e.end;}text+=b.text.slice(cursor);check(text.length<=100000,'OUTPUT_TOO_LARGE');
   const g=groups.find(g=>g.blockId===b.blockId);if(g){for(const a of g.additions){check(!list.some(e=>e.start<a.end&&e.end>a.start),'SOURCE_RANGE_OVERLAP');const shift=list.filter(e=>e.end<=a.start).reduce((n,e)=>n+e.proposedText.length-(e.end-e.start),0);a.start+=shift;a.end+=shift;}if(list.length)g.checkpointText=text;}b.text=text;
  }return {blocks:next,applications:groups};
 }
 function removeReplaced(blocks,applications,additions,frozen){
  const next=copy(blocks),groups=[];
  for(const g of applications){const b=next.find(b=>b.blockId===g.blockId);if(frozen.some(x=>x.blockId===g.blockId)){groups.push(copy(g));continue;}const replacing=additions.filter(a=>a.blockId===g.blockId);let cursor=0,text='',kept=[];
   for(const a of g.additions){text+=b.text.slice(cursor,a.start);const replacement=replacing.find(x=>x.answerId===a.source.answerId&&x.answerRevision===a.source.answerRevision);const same=replacement&&g.additions.filter(x=>x.source.answerId===replacement.answerId).length===1&&replacement.text===a.text;
    if(!replacement||same){const start=text.length;text+=b.text.slice(a.start,a.end);kept.push({...copy(a),start,end:text.length});}cursor=a.end;
   }text+=b.text.slice(cursor);b.text=text;if(kept.length)groups.push({blockId:g.blockId,checkpointText:text,additions:kept});
  }return {blocks:next,applications:groups};
 }
 function candidate(r,model,options={}){
  if(r.sourcesSchemaVersion==='1.0')return legacy.candidate(r,model,options);
  validateRequest(r);exact(model,['cvEdits','additions','contextQuestions']);check(Array.isArray(model.cvEdits)&&model.cvEdits.length<=1000);check(Array.isArray(model.additions));for(const a of model.additions){const b=r.blocks.find(b=>b.blockId===a.blockId);if(b)legacy.validateSkillsDelta(b,a.text);}const catalog=cvCatalog(r),seen=new Set(),cvEdits=[];
  for(const e of model.cvEdits){exact(e,['blockId','start','end','originalText','proposedText','cvEvidence']);const target=catalog.targets.find(t=>t.blockId===e.blockId&&t.start===e.start&&t.end===e.end&&t.originalText===e.originalText);check(target,'INVALID_CV_TARGET');const key=e.blockId+':'+e.start+':'+e.end;check(!seen.has(key),'DUPLICATE_CV_TARGET');seen.add(key);check(typeof e.proposedText==='string'&&e.proposedText.length<=100000);check(Array.isArray(e.cvEvidence)&&e.cvEvidence.length>0&&e.cvEvidence.length<=100);const refs=new Set();for(const v of e.cvEvidence){exact(v,['blockId','quote']);check(catalog.evidence.some(s=>s.blockId===v.blockId&&s.quote===v.quote),'INVALID_CV_EVIDENCE');const key=v.blockId+':'+v.quote;check(!refs.has(key),'DUPLICATE_CV_EVIDENCE');refs.add(key);}if(e.originalText!==e.proposedText)cvEdits.push(copy(e));}
  const edited=rebase(catalog.base.blocks,catalog.base.applications,cvEdits),replaced=removeReplaced(edited.blocks,edited.applications,model.additions,catalog.base.review);
  const request={...old(r),blocks:replaced.blocks,sourceContext:{...r.sourceContext,applications:replaced.applications}};
  const result=legacy.candidate(request,{additions:model.additions,contextQuestions:model.contextQuestions},options);
  return {...result,sourcesSchemaVersion:r.sourcesSchemaVersion,cvEdits};
 }
 function validateCandidate(r,data){
  if(r.sourcesSchemaVersion==='1.0')return legacy.validateCandidate(r,data);
  check(data?.sourcesSchemaVersion===r.sourcesSchemaVersion);exact(data,['ok','blocksSchemaVersion','cvVersionId','cvTitle','summaryOfChanges','blocks','rewrittenCv','rewrittenCvLegacy','sourcesSchemaVersion','sourceContextRevision','sourceRoundId','sourceUsage','sourceApplications','sourceReview','contextQuestions','cvEdits']);check(Array.isArray(data.sourceUsage));
  const ids=data.sourceUsage.map(u=>u.applicationId);check(new Set(ids).size===ids.length);let n=0;
  const expected=candidate(r,{cvEdits:data.cvEdits,additions:data.sourceUsage.map(u=>({blockId:u.blockId,text:u.proposedQuote,answerId:u.answerId,answerRevision:u.answerRevision,sourceQuote:u.sourceQuote,contextQuote:u.contextQuote})),contextQuestions:data.contextQuestions},{id:()=>ids[n++]});
  check(JSON.stringify(data)===JSON.stringify(expected));return data;
 }
 function withoutReceipt(data){const result=legacy.withoutReceipt(data);delete result.cvEdits;return result;}
 class Ledger extends legacy.Ledger{
  commit(r,data){if(r.sourcesSchemaVersion==='1.0')return super.commit(r,data);validateCandidate(r,data);const next=new Set(data.sourceApplications.flatMap(g=>g.additions.map(a=>a.id)));for(const h of this.history)if(h.status==='active'&&!next.has(h.id))h.status='superseded';for(const u of data.sourceUsage)this.history.push({...copy(u),id:u.applicationId,status:'active'});for(const x of data.sourceReview)for(const h of this.history)if(x.applicationIds.includes(h.id))h.status='review';this.groups=copy(data.sourceApplications);}
 }
 return {...legacy,validateRequest,prepare,cvCatalog,candidate,validateCandidate,withoutReceipt,Ledger};
});
