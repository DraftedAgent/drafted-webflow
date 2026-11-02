/* Proposed read-only coverage lifecycle; isolated from the product contracts. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.CoverageStudyModel=factory();})(globalThis,()=>{
 const statuses=['clear','partial','not_represented','needs_review'];
 const canonical=value=>Array.isArray(value)?'['+value.map(canonical).join(',')+']':value&&typeof value==='object'?'{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}':JSON.stringify(value);
 const binding=input=>canonical({cvVersionId:input.cvVersionId,blocks:input.blocks,jobRevision:input.jobRevision,jobText:input.jobText,signals:input.signals.map(s=>({id:s.id,ref:s.ref,label:s.label,requirement:s.requirement,adEvidence:s.adEvidence}))});
 function validate(input,result){
  if(result.inputKey!==binding(input))throw Error('STALE_ASSESSMENT');
  if(result.rows.length!==input.signals.length||new Set(result.rows.map(r=>r.signalId)).size!==input.signals.length)throw Error('INCOMPLETE_ASSESSMENT');
  for(const row of result.rows){const signal=input.signals.find(s=>s.id===row.signalId);if(!signal||!statuses.includes(row.status)||!row.explanation?.trim())throw Error('INVALID_ASSESSMENT');const a=signal.adEvidence;if(!a||input.jobText.slice(a.start,a.end)!==a.quote)throw Error('INVALID_AD_ANCHOR');if(!['required','preferred','unspecified'].includes(signal.requirement))throw Error('INVALID_REQUIREMENT');if(['clear','partial'].includes(row.status)&&!row.evidence.length)throw Error('MISSING_CV_EVIDENCE');for(const e of row.evidence){const b=input.blocks.find(b=>b.blockId===e.blockId);if(!b||!e.quote||!b.text.includes(e.quote))throw Error('INVALID_CV_EVIDENCE');}}
  return result;
 }
 function fixtureAssessment(input,source){const rows=input.signals.map(s=>({signalId:s.id,status:s.status,evidence:structuredClone(s.evidence),explanation:s.explanation}));if(source?.applied){const row=rows.find(r=>r.signalId===source.signalId);const exact=source.text===source.knownFixture&&source.blockId==='exp-product';row.status=exact?'clear':'needs_review';row.evidence=[{blockId:source.blockId,quote:source.text}];row.explanation=exact?'The current CV now explicitly describes SQL, adoption data and onboarding cohorts.':'This prototype has no semantic assessment fixture for this wording. A real assessment is still required.';}return validate(input,{inputKey:binding(input),rows,advisory:true});}
 class Study{
  constructor(fixture){this.input=structuredClone(fixture);this.result=fixtureAssessment(this.input);this.source=null;this.candidate=null;this.state='ready';this.request=0;}
  counts(){if(!this.result)return null;return Object.fromEntries(statuses.map(s=>[s,this.result.rows.filter(r=>r.status===s).length]));}
  fresh(){return !!this.result&&this.result.inputKey===binding(this.input)&&this.state==='ready';}
  record(text,signalId,provenance){this.source={text,signalId,...provenance,applied:false,knownFixture:this.input.exampleAnswer};}
  propose(){if(!this.source?.text||!this.source.blockId)throw Error('NO_SOURCE_CONTEXT');this.candidate={baseKey:binding(this.input),sourceId:this.source.id,sourceRevision:this.source.revision,blockId:this.source.blockId,text:this.source.text};return this.candidate;}
  apply(){const c=this.candidate;if(!c||c.baseKey!==binding(this.input)||c.sourceId!==this.source.id||c.sourceRevision!==this.source.revision)throw Error('STALE_PROPOSAL');this.input.blocks.find(b=>b.blockId===c.blockId).text+='\n• '+c.text;this.input.cvVersionId='study-cv-v'+(Number(this.input.cvVersionId.split('v').at(-1))+1);this.source.applied=true;this.candidate=null;this.state='stale';}
  changeAd(){this.input.jobText+='\n\nUpdated: the role includes a new product area.';this.input.jobRevision+='-changed';this.state='stale';this.candidate=null;}
  begin(){this.state='loading';return {id:++this.request,inputKey:binding(this.input)};}
  accept(token,result){if(token.id!==this.request||token.inputKey!==binding(this.input))return false;validate(this.input,result);this.result=result;this.state='ready';return true;}
 }
 return {Study,validate,binding,fixtureAssessment,canonical,statuses};
});
