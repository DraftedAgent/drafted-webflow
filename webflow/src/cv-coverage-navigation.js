/* Presentation-only navigation to exact, validated CV evidence. Never edits canonical text. */
(function(root){
 'use strict';
 function create({host,getBlocks,prepare}){
  const key='drafted-coverage-evidence';let serial=0;
  function clear(){root.CSS?.highlights?.delete(key);for(const mark of host.querySelectorAll('mark.coverage-evidence-mark')){const parent=mark.parentNode;mark.replaceWith(...mark.childNodes);parent.normalize();}host.querySelectorAll('.is-coverage-target').forEach(n=>n.classList.remove('is-coverage-target'));}
  function locate(evidence){
   const block=getBlocks().find(b=>b.blockId===evidence.blockId);if(!block||!evidence.quote||!block.text.includes(evidence.quote))throw Error('STALE_CV_EVIDENCE');
   const sources=[...host.querySelectorAll('[data-cv-source]')].filter(n=>n.dataset.cvSource===evidence.blockId);if(sources.map(n=>n.textContent).join('')!==block.text)throw Error('UNMAPPED_CV_EVIDENCE');
   const nodes=[];let offset=0;for(const source of sources){const walk=document.createTreeWalker(source,NodeFilter.SHOW_TEXT);let n;while((n=walk.nextNode())){nodes.push({node:n,start:offset,end:offset+n.length});offset+=n.length;}}
   const ranges=[];for(let start=block.text.indexOf(evidence.quote);start!==-1;start=block.text.indexOf(evidence.quote,start+evidence.quote.length)){const end=start+evidence.quote.length;for(const n of nodes){const a=Math.max(start,n.start),b=Math.min(end,n.end);if(b<=a)continue;const range=document.createRange();range.setStart(n.node,a-n.start);range.setEnd(n.node,b-n.start);ranges.push(range);}}return ranges;
  }
  async function show(evidence){
   const request=++serial,stamp=JSON.stringify(getBlocks());if(!Array.isArray(evidence)||!evidence.length)throw Error('MISSING_CV_EVIDENCE');await prepare();await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));if(request!==serial)return;if(stamp!==JSON.stringify(getBlocks()))throw Error('STALE_CV_EVIDENCE');clear();
   const ranges=evidence.flatMap(locate),rects=ranges.flatMap(r=>[...r.getClientRects()]).filter(r=>r.width&&r.height);if(!rects.length)throw Error('UNMAPPED_CV_EVIDENCE');
   const pane=host.closest('.cv-document');if(!pane)throw Error('PREVIEW_UNAVAILABLE');
   if(root.CSS?.highlights&&root.Highlight)root.CSS.highlights.set(key,new root.Highlight(...ranges));
   else for(const range of [...ranges].reverse()){const mark=document.createElement('mark');mark.className='coverage-evidence-mark';range.surroundContents(mark);}
   const first=rects[0],top=Math.min(...rects.map(r=>r.top)),bottom=Math.max(...rects.map(r=>r.bottom));const target=bottom-top<=pane.clientHeight*.8?{top,height:bottom-top,left:Math.min(...rects.map(r=>r.left)),right:Math.max(...rects.map(r=>r.right))}:first;
   const bounds=pane.getBoundingClientRect();pane.scrollTop=Math.max(0,Math.min(pane.scrollHeight-pane.clientHeight,pane.scrollTop+target.top-bounds.top-pane.clientTop-(pane.clientHeight-target.height)/2));pane.scrollLeft=Math.max(0,Math.min(pane.scrollWidth-pane.clientWidth,pane.scrollLeft+(target.left+target.right)/2-bounds.left-pane.clientLeft-pane.clientWidth/2));pane.focus({preventScroll:true});
  }
  return {show,clear};
 }
 root.DraftedCoverageNavigation={create};
})(window);
