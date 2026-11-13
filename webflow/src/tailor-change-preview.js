/* Review actual CV text differences independently of answer receipts. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.DraftedTailorChangePreview=api;})(globalThis,function(){
 'use strict';
 // Word/punctuation tokens retain every code point, including whitespace. Limit
 // diff work for unrelated long texts; the fallback still shows the whole edit.
 const tokens=text=>text.match(/[\p{L}\p{N}\p{M}_]+|[^\p{L}\p{N}\p{M}_]/gu)||[];
 function wordDiff(before,after){
  const a=tokens(before),b=tokens(after);let start=0,end=0;
  while(start<a.length&&start<b.length&&a[start]===b[start])start++;
  while(end<a.length-start&&end<b.length-start&&a[a.length-end-1]===b[b.length-end-1])end++;
  const x=a.slice(start,a.length-end),y=b.slice(start,b.length-end),ops=[];
  const push=(type,text)=>{if(!text)return;const last=ops.at(-1);if(last?.type===type)last.text+=text;else ops.push({type,text});};
  push('equal',a.slice(0,start).join(''));
  const trace=[],v=new Map([[1,0]]);let work=0,found=false;
  search:for(let d=0;d<=Math.min(x.length+y.length,300);d++){
   trace.push(new Map(v));
   for(let k=-d;k<=d;k+=2){
    if(++work>500000)break search;
    let i=k===-d||k!==d&&(v.get(k-1)??-1)<(v.get(k+1)??-1)?v.get(k+1):v.get(k-1)+1,j=i-k;
    while(i<x.length&&j<y.length&&x[i]===y[j]){i++;j++;if(++work>500000)break search;}
    v.set(k,i);
    if(i>=x.length&&j>=y.length){found=true;break search;}
   }
  }
  if(found){
   let i=x.length,j=y.length;const reversed=[];
   for(let d=trace.length-1;d>0;d--){
    const prev=trace[d],k=i-j,pk=k===-d||k!==d&&(prev.get(k-1)??-1)<(prev.get(k+1)??-1)?k+1:k-1,pi=prev.get(pk),pj=pi-pk;
    while(i>pi&&j>pj){reversed.push({type:'equal',text:x[--i]});j--;}
    if(i===pi)reversed.push({type:'add',text:y[--j]});else reversed.push({type:'remove',text:x[--i]});
   }
   while(i>0&&j>0){reversed.push({type:'equal',text:x[--i]});j--;}
   while(i>0)reversed.push({type:'remove',text:x[--i]});while(j>0)reversed.push({type:'add',text:y[--j]});
   for(const op of reversed.reverse())push(op.type,op.text);
  }else{push('remove',x.join(''));push('add',y.join(''));}
  push('equal',end?a.slice(a.length-end).join(''):'');return ops;
 }
 // Review complete blocks once. Context-window hunks used to overlap, split
 // sentences and leave isolated bullet markers even though the sources were whole.
 function edits(before,after){
  if(before===after)return [];
  const ops=wordDiff(before,after),removed=ops.filter(o=>o.type==='remove').map(o=>o.text).join(''),added=ops.filter(o=>o.type==='add').map(o=>o.text).join('');
  return [{kind:!before?'Added':!after?'Removed':'Rewritten',before:ops.filter(o=>o.type!=='add'),after:ops.filter(o=>o.type!=='remove'),removed,added,standalone:false}];
 }
 function describe({before,after,request={},data={},notes=[],meaningfulTitle=false,action}){
  if(action==='omit')return {recommendation:'Omit this entire block from this CV version. The source content is preserved.',why:notes.join(' ')};
  if(action==='restore')return {recommendation:'Restore the saved block to this CV version for approval.',why:notes.join(' ')};
  const old=before?.text||'',text=after?.text||'',words=t=>(t.match(/[\p{L}\p{N}]+/gu)||[]).length;
  const parts=[],changed=wordDiff(old,text).filter(o=>o.type!=='equal').map(o=>o.text).join(' ');
  const topics=(request.jobContext?.keywords||[]).filter(k=>typeof k==='string'&&k.length>3&&text.toLocaleLowerCase().includes(k.toLocaleLowerCase())).slice(0,3);
  const name=before?.type==='summary'?'profile':before?.type==='skills'?'skills section':'description';
  // Extract an intact action clause from the most changed point. This names
  // the real subject without generating career claims or guessing intent.
  const actions={coordinated:'coordinating',introduced:'introducing',used:'using',wrote:'writing',interviewed:'interviewing',supported:'supporting',managed:'managing',led:'leading',developed:'developing',built:'building',created:'creating',delivered:'delivering',reviewed:'reviewing',collaborated:'collaborating',maintained:'maintaining',organised:'organising',organized:'organizing'};
  const oldLines=old.split(/\n+/),points=text.split(/\n+/).map((line,i)=>{
   const raw=line.replace(/^[•*\-]\s*/,''),match=raw.match(/^(\w+)\s+(.+?)(?:[,;.]| and |$)/),gerund=actions[match?.[1]?.toLowerCase()];
   const delta=wordDiff(oldLines[i]||'',line).filter(o=>o.type==='add'||o.type==='remove').reduce((n,o)=>n+o.text.length,0);
   return {topic:gerund&&match[2].length<100?gerund+' '+match[2]:'',delta};
  }).filter(p=>p.topic&&p.delta).sort((a,b)=>b.delta-a.delta);

  const scopePattern=/\b(responsib\w*|own\w*|led|lead|decid\w*|decision\w*|supervis\w*|independen\w*|mandat\w*|ansvar\w*|självständ\w*|handled\w*)\b/iu;
  if(old!==text){
   const oldItems=old.split(/\s*[·;]\s*/),newItems=text.split(/\s*[·;]\s*/);
   if(oldItems.length>1&&JSON.stringify([...oldItems].sort())===JSON.stringify([...newItems].sort()))parts.push('Reorder the '+name+' to lead with '+newItems[0]+'.');
   else if(words(text)<words(old))parts.push('Shorten the '+name+' from '+words(old)+' to '+words(text)+' words'+(topics.length?', focusing on '+topics.join(', '):'')+'.');
   else parts.push(points.length?'Rework the point about '+points[0].topic+'.':'Rephrase the '+name+(topics.length?' around '+topics.join(', '):'')+'.');
   if(words(text)<words(old)&&before?.type==='experience'&&points.length)parts.push('Rework the point about '+points[0].topic+'.');
   const uses=(data.sourceUsage||[]).filter(u=>u.blockId===after?.blockId);
   if(uses.length)parts.push('Incorporate '+(new Set(uses.map(u=>u.answerId)).size===1?'your saved answer':'your saved answers')+' into this block.');
   if(scopePattern.test(changed)){
    const clauses=text.split(/(?<=[.!?;])\s+|\n/).map(t=>t.replace(/^[•*\-]\s*/,''));
    const scope=clauses.find(t=>scopePattern.test(t)&&!old.includes(t)&&t.length<=220);
    const oldScope=old.split(/(?<=[.!?;])\s+|\n/).map(t=>t.replace(/^[•*\-]\s*/,'')).find(t=>scopePattern.test(t)&&!text.includes(t)&&t.length<=220);
    parts.push(scope?'Responsibility wording: “'+scope+'”':oldScope?'Remove or replace the responsibility wording “'+oldScope+'” — check its scope before accepting.':'Change the wording about responsibility or decision-making; check its scope before accepting.');
   }
  }
  if(meaningfulTitle)parts.push('Change the role title from “'+(before.title||'(none)')+'” to “'+(after.title||'(none)')+'”.');
  if(!parts.length)parts.push('Update the displayed section information.');
  const priorities=[];
  for(const use of (data.sourceUsage||[]).filter(u=>u.blockId===after?.blockId)){
   const answer=request.sourceContext?.answers?.find(a=>a.id===use.answerId),q=request.sourceContext?.questions?.find(q=>q.id===answer?.questionId);
   for(const ref of q?.signalRefs||[]){const value=request.jobContext?.[ref.field]?.[ref.index],label=typeof value==='string'?value:value?.signal;if(label&&!priorities.includes(label))priorities.push(label);}
  }
  return {recommendation:parts.join(' '),why:notes.length?notes.join(' '):priorities.length?'The saved answer is linked to the target role’s priority: '+priorities.slice(0,2).join('; ')+'.':''};
 }
 function describeRevision(before,after,instruction='',type=''){
  const words=t=>(t.match(/[\p{L}\p{N}]+/gu)||[]).length,old=words(before),next=words(after),name=type==='summary'?'profile':'section';
  const topics=[];
  if(/release planning|planning releases|release coordination/i.test(after))topics.push('release planning');
  if(/customer feedback/i.test(after))topics.push('customer feedback work');
  if(/collaborat|designers and developers/i.test(after))topics.push('collaboration');
  let text=next>old?'Expanded the '+name+(topics.length?' to describe '+topics.join(', ')+' in more detail.':' from '+old+' to '+next+' words.'):next<old?'Shortened the '+name+' from '+old+' to '+next+' words.':'Revised the wording while keeping a similar length.';
  // Describe observable changes; do not claim arbitrary free-text requests
  // have been fully satisfied when no such judgment was returned by the model.
  if(/longer|expand|more detail|längre|utförligare/i.test(instruction)&&next<=old)text+=' The result is not longer; use Edit to clarify what needs more detail.';
  else if(/shorter|concise|shorten|kortare/i.test(instruction)&&next>=old)text+=' The result is not shorter; use Edit to clarify what can be reduced.';
  return text;
 }
 function renderDetails(host,before,after,fields=[]){
  const doc=host.ownerDocument,add=(tag,text,parent)=>{const n=doc.createElement(tag);n.textContent=text;parent.append(n);return n;};
  const details=add('details','',host);details.className='tailor-exact-changes';add('summary','Show exact changes',details);
  for(const field of fields){const row=add('p','',details);add('strong',field.name+': ',row);add('del',field.before||'(none)',row);row.append(doc.createTextNode(' → '));add('mark',field.after||'(none)',row);}
  const ops=wordDiff(before,after);
  for(const [label,excluded] of [['Before','add'],['After','remove']]){
   const row=add('div','',details);row.className='tailor-diff-row';add('span',label,row).className='tailor-diff-label';
   const text=add('div','',row);text.className='tailor-diff-text';text.dataset.diffSide=label.toLowerCase();
   // Keep all original characters, including line boundaries. No shortening,
   // context windows or separate DOM rows for individual token changes.
   for(const op of ops.filter(o=>o.type!==excluded)){
    if(op.type==='equal')text.append(doc.createTextNode(op.text));
    else add(label==='Before'?'del':'mark',op.text,text).className=label==='Before'?'tailor-mark-removed':'tailor-mark-added';
   }
   if(!(label==='Before'?before:after))add('span',label==='Before'?'Not in this CV version.':'Omitted in this proposed version.',row).className='tailor-diff-empty';
  }
  return details;
 }
 function paragraph(text,start,end){while(start<end&&/\s/.test(text[start]))start++;const before=text.lastIndexOf('\n\n',start),after=text.indexOf('\n\n',end);return text.slice(before<0?0:before+2,after<0?text.length:after);}
 function changes(previous,next){
  const out=[];
  for(const b of next){const old=previous.find(p=>p.blockId===b.blockId);if(!old)throw Error('UNKNOWN_REVIEW_BLOCK');if(old.text===b.text)continue;
   let from=0,end=0;while(from<old.text.length&&from<b.text.length&&old.text[from]===b.text[from])from++;
   while(end<old.text.length-from&&end<b.text.length-from&&old.text[old.text.length-1-end]===b.text[b.text.length-1-end])end++;
   const removed=old.text.slice(from,old.text.length-end),added=b.text.slice(from,b.text.length-end);
   out.push({blockId:b.blockId,action:!added?'Remove':!removed?'Add':'Update',text:added?paragraph(b.text,from,b.text.length-end):paragraph(old.text,from,old.text.length-end),edits:edits(old.text,b.text)});
  }return out;
 }
 return {changes,wordDiff,describe,describeRevision,renderDetails};
});
