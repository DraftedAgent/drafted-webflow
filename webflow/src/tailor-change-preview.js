/* Review actual CV text differences independently of answer receipts. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.DraftedTailorChangePreview=api;})(globalThis,function(){
 'use strict';
 function paragraph(text,start,end){while(start<end&&/\s/.test(text[start]))start++;const before=text.lastIndexOf('\n\n',start),after=text.indexOf('\n\n',end);return text.slice(before<0?0:before+2,after<0?text.length:after);}
 function changes(previous,next){
  const out=[];
  for(const b of next){const old=previous.find(p=>p.blockId===b.blockId);if(!old)throw Error('UNKNOWN_REVIEW_BLOCK');if(old.text===b.text)continue;
   let from=0,end=0;while(from<old.text.length&&from<b.text.length&&old.text[from]===b.text[from])from++;
   while(end<old.text.length-from&&end<b.text.length-from&&old.text[old.text.length-1-end]===b.text[b.text.length-1-end])end++;
   const removed=old.text.slice(from,old.text.length-end),added=b.text.slice(from,b.text.length-end);
   out.push({blockId:b.blockId,action:!added?'Remove':!removed?'Add':'Update',text:added?paragraph(b.text,from,b.text.length-end):paragraph(old.text,from,old.text.length-end)});
  }return out;
 }
 return {changes};
});
