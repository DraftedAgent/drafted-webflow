(function(root){
 'use strict';
 const sessions=new Map(),pending=new Map();let worker=null,nextId=0,writing=false,getProtectedText=()=>'',lastContext='',protectedWords=new Set();
 const selector='textarea[data-drafted-spelling],textarea#editor-input';
 const eligible=node=>node instanceof HTMLTextAreaElement&&node.matches(selector)&&!node.disabled&&!node.readOnly;
 function state(input){const key=input.dataset.draftedSpelling||input.id;let s=sessions.get(key);if(!s){s={text:input.value,ignored:new Set(),corrections:[],generation:0};sessions.set(key,s);}if(!input.value&&s.text){s.ignored.clear();s.corrections=[];s.text='';s.generation++;}input.spellcheck=true;input.setAttribute('autocorrect','off');return s;}
 function start(){if(worker)return worker;try{worker=new Worker(new URL('assets/spelling/worker.js',location.origin+'/'));worker.onmessage=({data})=>{if(!data.id)return;const resolve=pending.get(data.id);pending.delete(data.id);resolve?.(data.result);};worker.onerror=()=>{for(const resolve of pending.values())resolve(null);pending.clear();worker?.terminate();worker=null;};}catch{return null;}return worker;}
 function protectedContext(){const text=String(getProtectedText()||'');if(text!==lastContext){lastContext=text;protectedWords=new Set((text.toLocaleLowerCase().match(/[\p{L}\p{M}\p{N}_+#.-]+/gu)||[]));}return [...protectedWords];}
 function changed(s,value,type){
  const before=s.text;if(before===value)return;
  let left=0,right=0;while(left<before.length&&left<value.length&&before[left]===value[left])left++;while(right<before.length-left&&right<value.length-left&&before[before.length-1-right]===value[value.length-1-right])right++;
  const oldEnd=before.length-right,delta=value.length-before.length;
  for(const c of s.corrections){
   if(type==='historyUndo'&&(value===c.before||value.slice(c.start,c.start+c.original.length)===c.original)){s.ignored.add(c.original);if(value===c.before)s.undoCaret=c.caret;}
   if(oldEnd<=c.start&&left<c.start){c.start+=delta;c.end+=delta;}
   else if(left<c.end&&oldEnd>=c.start||c.editing&&left>=c.start&&left<=c.end){c.editing=true;c.end=Math.max(c.start,c.end+delta);}
   if(c.editing&&value.slice(c.start,c.end)===c.original)s.ignored.add(c.original);
  }
  s.text=value;s.generation++;
 }
 function completedWord(input){const caret=input.selectionStart;if(caret!==input.selectionEnd)return null;const prefix=input.value.slice(0,caret),boundary=prefix.match(/[\s.,!?;:()[\]{}"“”'’…]+$/u);if(!boundary)return null;const end=caret-boundary[0].length;let start=end;while(start>0&&/[\p{L}\p{M}\p{N}_@./:+#-]/u.test(prefix[start-1]))start--;return start<end?{start,end,word:prefix.slice(start,end)}:null;}
 async function check(input,s){
  const word=completedWord(input),active=start();if(!word||!active||s.ignored.has(word.word))return;
  const id=++nextId,value=input.value,generation=s.generation,caret=input.selectionStart,context=value.slice(0,word.start).split('\n').at(-1).slice(-240);
  const result=await new Promise(resolve=>{pending.set(id,resolve);active.postMessage({id,word:word.word,context,protectedWords:protectedContext()});});
  if(!result||!input.isConnected||document.activeElement!==input||s.generation!==generation||input.value!==value||input.selectionStart!==caret||input.selectionEnd!==caret||s.ignored.has(word.word))return;
  const delta=result.word.length-word.word.length;if(input.maxLength>=0&&value.length+delta>input.maxLength)return;
  const top=input.scrollTop,left=input.scrollLeft;
  writing=true;
  try{
   input.setSelectionRange(word.start,word.end);
   // Native editing transaction preserves the browser's Undo/Redo stack.
   const applied=document.execCommand('insertText',false,result.word);
   if(applied&&input.value===value.slice(0,word.start)+result.word+value.slice(word.end)){
    s.corrections.push({start:word.start,end:word.start+result.word.length,original:word.word,before:value,caret,editing:false});s.corrections=s.corrections.slice(-32);s.text=input.value;s.generation++;input.lang=result.language;
    input.setSelectionRange(caret+delta,caret+delta);
   }else input.setSelectionRange(caret,caret);
  }finally{writing=false;input.scrollTop=top;input.scrollLeft=left;}
 }
 document.addEventListener('focusin',event=>{if(eligible(event.target)){state(event.target);start();}},true);
 document.addEventListener('beforeinput',event=>{if(eligible(event.target)&&!writing){const s=state(event.target);changed(s,event.target.value,event.inputType);}},true);
 document.addEventListener('input',event=>{
  const input=event.target;if(!eligible(input)||writing)return;const s=state(input);changed(s,input.value,event.inputType);
  if(s.undoCaret!=null){input.setSelectionRange(s.undoCaret,s.undoCaret);delete s.undoCaret;}
  if(event.isComposing||event.inputType==='insertCompositionText'||!event.isTrusted)return;
  if(['insertText','insertLineBreak','insertParagraph'].includes(event.inputType)&&(!event.data||/[\s.,!?;:()[\]{}"“”'’…]$/u.test(event.data)))check(input,s);
 },true);
 root.DraftedSpelling={configure(options={}){getProtectedText=options.getProtectedText||getProtectedText;},start};
 // Warm the local worker without delaying the editor or requiring a first typo.
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})(window);
