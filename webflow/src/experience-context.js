/* Revision-scoped context, never a global experience identity or a CV edit. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.DraftedExperienceContext=api;})(globalThis,function(){
 'use strict';
 const keys=['type','label','companyOrContext','roleOrProject','startDate','endDate'];
 const copy=x=>JSON.parse(JSON.stringify(x));
 const check=ok=>{if(!ok)throw Error('INVALID_EXPERIENCE_CONTEXT');};
 const exact=(o,fields)=>check(o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).length===fields.length&&fields.every(k=>Object.hasOwn(o,k)));
 const text=(s,max=1000)=>check(typeof s==='string'&&s.length<=max);
 const eligible=b=>b&&(b.type==='experience'||['project','projects'].includes(b.type)||b.type==='otherSections'&&/project|projekt/i.test(b.label||''));
 function snapshot(b){return {type:b.type,label:b.label||'',companyOrContext:b.employer||'',roleOrProject:b.title||(['project','projects','otherSections'].includes(b.type)?b.label:'')||'',startDate:b.startDate||'',endDate:b.endDate||''};}
 function reference(cvVersionId,b){check(eligible(b));const value={kind:'cv_entry',cvVersionId,blockId:b.blockId,snapshot:snapshot(b)};validate(value);return value;}
 function validate(c){
  if(c?.kind==='cv_entry'){exact(c,['kind','cvVersionId','blockId','snapshot']);text(c.cvVersionId,200);text(c.blockId,200);check(c.cvVersionId.trim()&&c.blockId.trim());exact(c.snapshot,keys);for(const k of keys)text(c.snapshot[k]);}
  else{exact(c,['kind','companyOrContext','roleOrProject','period']);check(c.kind==='other');for(const k of ['companyOrContext','roleOrProject','period'])text(c[k]);check(c.roleOrProject.trim());}
  return c;
 }
 function resolve(c,cvVersionId,blocks){
  validate(c);if(c.kind==='other')return {status:'unplaced'};
  if(c.cvVersionId!==cvVersionId)return {status:'unresolved',reason:'cv_version_changed'};
  const matches=blocks.filter(b=>b.blockId===c.blockId);if(matches.length!==1||!eligible(matches[0]))return {status:'unresolved',reason:'entry_unavailable'};
  if(JSON.stringify(snapshot(matches[0]))!==JSON.stringify(Object.fromEntries(keys.map(k=>[k,c.snapshot[k]]))))return {status:'unresolved',reason:'entry_changed'};
  return {status:'resolved',blockId:matches[0].blockId};
 }
 function describe(c){validate(c);if(c.kind==='other')return [c.companyOrContext,c.roleOrProject,c.period].filter(x=>x.trim()).join(' · ');const s=c.snapshot;return [s.companyOrContext,s.roleOrProject||s.label,[s.startDate,s.endDate].filter(Boolean).join(' – ')].filter(Boolean).join(' · ')||'CV experience';}
 return {eligible,snapshot,reference,validate,resolve,describe,copy};
});
