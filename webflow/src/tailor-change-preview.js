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
 function context(text,tail){
  if(text.length<=100)return text;
  return tail?'…'+text.slice(-100).replace(/^\S*\s/,''):text.slice(0,100).replace(/\s\S*$/,'')+'…';
 }
 function edits(before,after){
  const ops=wordDiff(before,after),out=[];
  for(let i=0;i<ops.length;i++){
   if(ops[i].type==='equal')continue;
   const from=i;let to=i;
   while(to+1<ops.length){
    if(ops[to+1].type!=='equal'){to++;continue;}
    if(to+2<ops.length&&ops[to+1].text.length<70&&!/\n/.test(ops[to+1].text)){to+=2;continue;}break;
   }
   const middle=ops.slice(from,to+1),removed=middle.filter(o=>o.type==='remove').map(o=>o.text).join(''),added=middle.filter(o=>o.type==='add').map(o=>o.text).join('');
   const kind=!removed?'Added':!added?'Removed':'Rewritten';
   // A complete appended/removed sentence or paragraph needs no repeated block.
   const standalone=kind!=='Rewritten'&&(/\n/.test(added||removed)||/^\s*[•*\-]/.test(added||removed)||/[.!?]\s*$/.test(added||removed));
   const leading=standalone?'':context(ops[from-1]?.text||'',true),trailing=standalone?'':context(ops[to+1]?.text||'',false);
   const runs=side=>[...(leading?[{type:'equal',text:leading}]:[]),...middle.filter(o=>o.type!==(side==='before'?'add':'remove')),...(trailing?[{type:'equal',text:trailing}]:[])];
   out.push({kind,before:runs('before'),after:runs('after'),removed,added,standalone});i=to;
  }return out;
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
 return {changes,wordDiff};
});
