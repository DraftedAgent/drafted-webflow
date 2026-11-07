/* Local candidate safety. Reject structural drift; never silently edit source text or receipts. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./cv-document-structure.js'));else root.DraftedTailorStructure=factory(root.DraftedCvStructure);})(globalThis,function(S){
 'use strict';const fields=['label','title','degree','program','startDate','endDate'];
 const isTranslation=r=>r.languagePlan.cvLanguage!==r.language;
 function structure(r){return S.create(r.blocks.map(b=>{const a=r.languageApplications?.find(a=>a.blockId===b.blockId);return a?{...b,...a.originalFields}:b;}));}
 function validate(r,d){
  const plan=structure(r),translated=isTranslation(r),fail=()=>{throw Error('UNREQUESTED_DOCUMENT_STRUCTURE_CHANGE');};
  if(d.blocks.length!==r.blocks.length)fail();
  for(const original of r.blocks){const b=d.blocks.find(x=>x.blockId===original.blockId);if(!b||b.type!==original.type||b.order!==original.order)fail();
   if(!translated){for(const key of fields)if(b[key]!==original[key])fail();if(S.entry(plan,original).role&&b.text!==original.text)fail();}
   // Keep existing source characters. Only reject newly introduced stacked markers.
   const existing=original.text.split('\n'),used=new Map();
   for(const line of b.text.split('\n'))if(/^\s*(?:(?:[-*•▪‣]|\d+[.)])\s+){2,}/.test(line)){const n=(used.get(line)||0)+1;used.set(line,n);if(existing.filter(x=>x===line).length<n)throw Error('DUPLICATE_LIST_MARKER');}
  }
  return d;
 }
 return {isTranslation,structure,validate};
});
