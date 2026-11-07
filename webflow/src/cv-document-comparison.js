/* Session-local presentation. The imported representation is never a live editor object. */
(function(global){
 'use strict';
 const copy=x=>JSON.parse(JSON.stringify(x));
 function freeze(x){if(x&&typeof x==='object'){Object.values(x).forEach(freeze);Object.freeze(x);}return x;}
 function clear(prefix){for(const side of ['before','after'])global.CSS?.highlights?.delete(prefix+'-'+side);}
 function paint(host,before,after,mode,prefix,onlyId){
  clear(prefix);if(!global.CSS?.highlights||!global.Highlight)return;
  const left=new Map((before.blocks||[]).map(b=>[b.blockId,b])),right=new Map((after.blocks||[]).map(b=>[b.blockId,b])),ranges=[];
  for(const id of new Set([...left.keys(),...right.keys()])){
   if(onlyId&&id!==onlyId)continue;
   const a=left.get(id)?.text||'',b=right.get(id)?.text||'',expected=mode==='before'?a:b;
   if(a===b)continue;
   const sources=[...host.querySelectorAll('[data-cv-source]')].filter(n=>n.dataset.cvSource===id);
   if(sources.map(n=>n.textContent).join('')!==expected)continue; // Never guess offsets in transformed text.
   let total=0;const nodes=[];for(const element of sources){const walk=document.createTreeWalker(element,NodeFilter.SHOW_TEXT);let n;while((n=walk.nextNode())){nodes.push({node:n,start:total,end:total+n.length});total+=n.length;}}
   let offset=0;for(const op of global.DraftedTailorChangePreview.wordDiff(a,b)){
    if(op.type===(mode==='before'?'add':'remove'))continue;
    const end=offset+op.text.length;
    if(op.type!=='equal'&&end>offset){const startNode=nodes.find(n=>n.end>offset),endNode=nodes.find(n=>n.end>=end);if(startNode&&endNode){const r=new Range();r.setStart(startNode.node,offset-startNode.start);r.setEnd(endNode.node,end-endNode.start);ranges.push(r);}}
    offset=end;
   }
  }
  global.CSS.highlights.set(prefix+'-'+(mode==='before'?'before':'after'),new global.Highlight(...ranges));
 }
 function create({host,controls,getEdited,getCompared=getEdited,render}){
  const pane=host.closest('.cv-document'),group=document.createElement('section');group.className='document-comparison';group.setAttribute('aria-label','Document comparison');
  const versions=document.createElement('div');versions.className='document-version-choice';versions.setAttribute('role','group');versions.setAttribute('aria-label','CV version');group.append(versions);
  const buttons={};let original=null,mode='edited',marks=false,suspended=false,stamp=null,anchor=null,restorePending=false;
  for(const name of ['Original','Current','Show changes']){const b=document.createElement('button');b.type='button';b.textContent=name;b.setAttribute('aria-pressed',String(name==='Current'));buttons[name]=b;(name==='Show changes'?group:versions).append(b);}
  const status=document.createElement('span');status.className='document-comparison-status';status.setAttribute('role','status');group.append(status);controls.append(group);
  const capture=()=>{const bounds=pane.getBoundingClientRect(),all=[...host.querySelectorAll('.cv-block[data-block-id]')],n=all.find(n=>n.getBoundingClientRect().bottom>bounds.top+16);return n?{id:n.dataset.blockId,fragment:all.filter(b=>b.dataset.blockId===n.dataset.blockId).indexOf(n),offset:n.getBoundingClientRect().top-bounds.top,ratio:pane.scrollTop/Math.max(1,pane.scrollHeight-pane.clientHeight)}:null;};
  function update(){group.hidden=suspended||!(getEdited().blocks||[]).length;buttons.Original.disabled=!original;buttons['Show changes'].disabled=!original||!global.CSS?.highlights||!global.Highlight;buttons.Original.setAttribute('aria-pressed',String(mode==='original'));buttons.Current.setAttribute('aria-pressed',String(mode==='edited'));buttons['Show changes'].setAttribute('aria-pressed',String(marks));status.textContent=original?'':'Original unavailable for this editing session.';}
  function show(next){if(suspended||next==='original'&&!original)return;anchor=capture();restorePending=true;mode=next;update();render();}
  buttons.Original.addEventListener('click',()=>show('original'));buttons.Current.addEventListener('click',()=>show('edited'));
  buttons['Show changes'].addEventListener('click',()=>{marks=!marks;update();render();});
  function afterRender(){
   if(restorePending&&anchor){const ns=[...host.querySelectorAll('.cv-block[data-block-id]')].filter(n=>n.dataset.blockId===anchor.id),n=ns[Math.min(anchor.fragment,ns.length-1)];if(n)pane.scrollTop+=n.getBoundingClientRect().top-pane.getBoundingClientRect().top-anchor.offset;else{pane.scrollTop=anchor.ratio*Math.max(0,pane.scrollHeight-pane.clientHeight);status.textContent='This block is absent in '+(mode==='original'?'Original.':'Edited.');}}restorePending=false;
   clear('drafted-document');if(!suspended&&marks&&original)paint(host,original,getCompared(),mode==='original'?'before':'after','drafted-document');
  }
  update();
  return {begin(model){original=freeze(copy(model));mode='edited';marks=false;stamp=JSON.stringify(model);anchor=null;restorePending=false;update();},
   sync(blocked){const current=JSON.stringify(getEdited());if(!blocked&&stamp!==current){mode='edited';stamp=current;restorePending=false;}suspended=blocked;clear('drafted-document');update();},
   edited({clearChanges=false,showChanges=false}={}){mode='edited';if(showChanges)marks=true;restorePending=false;if(clearChanges){marks=false;clear('drafted-document');}update();},model:()=>!suspended&&mode==='original'?original:null,afterRender,
   beforeRender(){clear('drafted-document');},original:()=>original,mode:()=>mode,changes:()=>marks,
   snapshot:()=>({schema:1,original:original?copy(original):null,mode,marks}),
   restore(saved){
    if(saved&&(saved.schema!==1||saved.original&&(!Array.isArray(saved.original.blocks)||!saved.original.blocks.every(b=>typeof b.blockId==='string'&&typeof b.text==='string'))))throw Error('The saved original CV cannot be restored.');
    original=saved?.original?freeze(copy(saved.original)):null;mode=original&&saved.mode==='original'?'original':'edited';marks=!!original&&!!saved?.marks;
    stamp=JSON.stringify(getEdited());anchor=null;restorePending=false;clear('drafted-document');update();
   }};
 }
 global.DraftedCvDocumentComparison={create,paint,clear};
})(window);
