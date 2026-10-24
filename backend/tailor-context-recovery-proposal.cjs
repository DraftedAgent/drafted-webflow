'use strict';
// Owner-approved DEV-101 context recovery, injected into existing Tailor Compose.
// No network, model rerun, inferred user facts or source identity repair.
const refs=require('./tailor-source-references.cjs');
function check(ok,code='INVALID_SOURCE_SELECTION'){if(!ok)throw Error(code);}
function exact(o,keys){check(o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).length===keys.length&&keys.every(k=>Object.hasOwn(o,k)));}
const contextual=b=>b&&(['experience','education','otherSections','project','projects'].includes(b.type));
function compile(request,raw,scope){
 try{return refs.compile(request,raw,scope);}catch(e){if(e.message!=='UNSUPPORTED_SOURCE_TARGET')throw e;}
 // Validate every item, not just those reached before the initial rejection.
 exact(raw,['additions','contextQuestions']);for(const a of [raw.additions,raw.contextQuestions])check(Array.isArray(a)&&a.length<=100);
 refs.compile(request,{additions:[],contextQuestions:raw.contextQuestions},scope);
 const c=refs.catalog(request,scope),pairs=new Set(),unclear=new Set();
 for(const a of raw.additions){
  exact(a,['sourceKey','targetKey','text']);check(typeof a.text==='string'&&a.text.trim()===a.text&&a.text.length>0&&a.text.length<=10000);
  check(!raw.contextQuestions.some(q=>q.sourceKey===a.sourceKey),'CONFLICTING_SOURCE_SELECTION');
  const pair=a.sourceKey+'|'+a.targetKey;check(!pairs.has(pair),'DUPLICATE_SOURCE_TARGET');pairs.add(pair);
  try{refs.compile(request,{additions:[a],contextQuestions:[]},scope);}catch(e){
   if(e.message!=='UNSUPPORTED_SOURCE_TARGET')throw e;
   const s=c.sources.find(s=>s.sourceKey===a.sourceKey),t=c.targets.find(t=>t.targetKey===a.targetKey);
   // Only missing entry context may become a clarification. Unknown/stale IDs,
   // already-applied pairs, frozen blocks and a wrong choice despite available
   // contextual targets remain failures. Never guess an employer or relocate.
   check(s&&contextual(t)&&!s.alreadyAppliedTargets.includes(t.targetKey),'UNSUPPORTED_SOURCE_TARGET');
   check(!!(t.type==='experience'?t.employer:t.type==='education'?t.institution:t.title||t.label),'UNSUPPORTED_SOURCE_TARGET');
   check(!c.targets.some(b=>contextual(b)&&s.allowedTargets.includes(b.targetKey)),'UNSUPPORTED_SOURCE_TARGET');
   unclear.add(s.sourceKey);
  }
 }
 // Withhold ALL proposed additions for each affected source, including any
 // summary/skills attempt from it. Keep independent valid sources traceable.
 const selected={additions:raw.additions.filter(a=>!unclear.has(a.sourceKey)),contextQuestions:[...raw.contextQuestions,...Array.from(unclear,sourceKey=>({sourceKey,reason:'context_unclear'}))]};
 return refs.compile(request,selected,scope);
}
module.exports={compile};
