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
  if(c?.kind==='cv_entries'){exact(c,['kind','entries']);check(Array.isArray(c.entries)&&c.entries.length>=2&&c.entries.length<=100);check(new Set(c.entries.map(e=>e.blockId)).size===c.entries.length);for(const e of c.entries){check(e.kind==='cv_entry');validate(e);}check(new Set(c.entries.map(e=>e.cvVersionId)).size===1);}
  else if(c?.kind==='cv_entry'){exact(c,['kind','cvVersionId','blockId','snapshot']);text(c.cvVersionId,200);text(c.blockId,200);check(c.cvVersionId.trim()&&c.blockId.trim());exact(c.snapshot,keys);for(const k of keys)text(c.snapshot[k]);}
  else{exact(c,['kind','companyOrContext','roleOrProject','period']);check(c.kind==='other');for(const k of ['companyOrContext','roleOrProject','period'])text(c[k]);check(c.roleOrProject.trim());}
  return c;
 }
 function resolve(c,cvVersionId,blocks){
  validate(c);if(c.kind==='cv_entries'){const results=c.entries.map(e=>resolve(e,cvVersionId,blocks));return results.every(r=>r.status==='resolved')?{status:'resolved',blockIds:results.map(r=>r.blockId)}:{status:'unresolved',reason:'entry_unavailable'};}if(c.kind==='other')return {status:'unplaced'};
  if(c.cvVersionId!==cvVersionId)return {status:'unresolved',reason:'cv_version_changed'};
  const matches=blocks.filter(b=>b.blockId===c.blockId);if(matches.length!==1||!eligible(matches[0]))return {status:'unresolved',reason:'entry_unavailable'};
  if(JSON.stringify(snapshot(matches[0]))!==JSON.stringify(Object.fromEntries(keys.map(k=>[k,c.snapshot[k]]))))return {status:'unresolved',reason:'entry_changed'};
  return {status:'resolved',blockId:matches[0].blockId};
 }
 function describe(c){validate(c);if(c.kind==='cv_entries')return c.entries.map(describe).join('; ');if(c.kind==='other')return [c.companyOrContext,c.roleOrProject,c.period].filter(x=>x.trim()).join(' · ');const s=c.snapshot;return [s.companyOrContext,s.roleOrProject||s.label,[s.startDate,s.endDate].filter(Boolean).join(' – ')].filter(Boolean).join(' · ')||'CV experience';}
 function infer(answer,cvVersionId,blocks){
  const normalize=x=>String(x||'').normalize('NFKC').toLocaleLowerCase().replace(/\s+/g,' ').trim();
  const text=normalize(answer),jobs=blocks.filter(b=>b.type==='experience');
  const mentions=value=>{const needle=normalize(value);if(needle.length<2)return false;let index=text.indexOf(needle);while(index>=0){const before=text[index-1]||'',after=text[index+needle.length]||'';if(!/[\p{L}\p{N}]/u.test(before)&&!/[\p{L}\p{N}]/u.test(after)&&!/(?:not|never|inte|aldrig)\s+(?:(?:work|worked|arbetade|arbetar|jobbar)\s+)?(?:at|hos|på)?\s*$/.test(text.slice(Math.max(0,index-25),index)))return true;index=text.indexOf(needle,index+1);}return false;};
  const groups=[];for(const company of new Set(jobs.map(b=>b.employer).filter(Boolean)))if(mentions(company)){const same=jobs.filter(b=>normalize(b.employer)===normalize(company)),named=same.filter(b=>mentions(b.title));groups.push({company,entries:named.length?named:same,explicitMultiple:named.length>1&&new Set(named.map(b=>normalize(b.title))).size===named.length});}
  const current=!/(?:not|inte)\s+(?:in |på )?(?:my current|mitt nuvarande|min nuvarande)/i.test(text)&&/\b(?:my current (?:job|role|position|employment|employer|company|work)|my present (?:job|role)|mitt nuvarande (?:jobb|arbete)|min nuvarande (?:anställning|roll|arbetsgivare|arbetsplats|tjänst)|på mitt nuvarande jobb|nuvarande arbetsgivare)\b/i.test(text);
  if(current){
   let latest=jobs.filter(b=>/^(?:present|current|now|ongoing|nu|nuvarande|pågående|idag|tillsvidare)$/i.test(String(b.endDate||'').trim()));
   if(!latest.length){
    const date=value=>{const str=normalize(value),year=str.match(/\b(?:19|20)\d{2}\b/);if(!year)return null;const month=str.match(/(?:^|\D)(0?[1-9]|1[0-2])(?:\D|$)/),names=['jan','feb','mar','apr','may|maj','jun','jul','aug','sep','oct|okt','nov','dec'];const named=names.findIndex(name=>new RegExp('\\b(?:'+name+')[a-zåäö]*\\b').test(str));return Number(year[0])*12+(named>=0?named:month?Number(month[1])-1:11);};
    const dates=jobs.map(b=>({b,date:date(b.endDate)}));if(dates.length&&dates.every(d=>d.date!==null)){const max=Math.max(...dates.map(d=>d.date));latest=dates.filter(d=>d.date===max).map(d=>d.b);}else latest=jobs;
   }
   // An explicit company/role may disambiguate which current employment is meant.
   const named=latest.filter(b=>mentions(b.employer)||mentions(b.title));if(named.length)latest=named;
   if(groups.length===1&&groups[0].entries.length>1&&!groups[0].explicitMultiple&&latest.length===1&&groups[0].entries.includes(latest[0]))groups[0].entries=latest;
   groups.push({company:'current or most recent employment',entries:latest});
  }
  if(!groups.length)return {status:'missing',blockIds:[],question:'Which roles or projects does this example relate to? Select all that apply.'};
  if(groups.some(g=>g.entries.length!==1&&!g.explicitMultiple)){const candidates=[...new Set(groups.flatMap(g=>g.entries.map(b=>b.blockId)))];const ambiguous=groups.filter(g=>g.entries.length!==1&&!g.explicitMultiple).map(g=>g.company);return {status:'ambiguous',blockIds:candidates,certainIds:[...new Set(groups.filter(g=>g.entries.length===1||g.explicitMultiple).flatMap(g=>g.entries.map(b=>b.blockId)))],question:'Which role'+(candidates.length>1?' or roles':'')+' at '+ambiguous.join(' / ')+' does this answer refer to? Select the matching entries.'};}
  const ids=[...new Set(groups.flatMap(g=>g.entries.map(b=>b.blockId)))];if(!ids.length)return {status:'missing',blockIds:[],question:'Which role does this answer refer to?'};
  return {status:'resolved',blockIds:ids,context:selection(ids.map(id=>reference(cvVersionId,jobs.find(b=>b.blockId===id))))};
 }
 function selection(entries){check(entries.length>0);const c=entries.length===1?copy(entries[0]):{kind:'cv_entries',entries:copy(entries)};return validate(c);}
 return {eligible,snapshot,reference,selection,infer,validate,resolve,describe,copy};
});
