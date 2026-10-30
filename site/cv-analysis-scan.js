/* Visual request state only. Coordinates come from the displayed PDF text layer;
   no document mutation, OCR, backend call, progress estimate or completion timer. */
(function(global){
 'use strict';
 const ns='http://www.w3.org/2000/svg';let sequence=0;
 const node=(tag,attrs={})=>{const el=document.createElementNS(ns,tag);for(const [key,value] of Object.entries(attrs))el.setAttribute(key,value);return el;};
 function surface(paper,selector){
  const svg=node('svg',{'class':'drafted-cv-scan','aria-hidden':'true',focusable:'false'}),defs=node('defs'),gradient=node('linearGradient',{id:'drafted-scan-trail-'+(++sequence),x1:0,y1:0,x2:0,y2:1});
  gradient.append(node('stop',{offset:0,'stop-color':'#02c8bb','stop-opacity':0}),node('stop',{offset:1,'stop-color':'#02c8bb','stop-opacity':.085}));defs.append(gradient);
  const regions=node('g',{'class':'drafted-scan-regions'}),sweep=node('g',{'class':'drafted-scan-sweep'}),zone=node('rect',{fill:`url(#${gradient.id})`}),line=node('path',{fill:'none',stroke:'#00a8a5','stroke-width':1,'vector-effect':'non-scaling-stroke'}),tips=node('path',{fill:'none',stroke:'#007f86','stroke-width':1.5,'vector-effect':'non-scaling-stroke'});
  sweep.append(zone,line,tips);svg.append(defs,regions,sweep);paper.append(svg);
  let areas=[],width=0,height=0;
  function measure(){
   const box=paper.getBoundingClientRect();width=paper.offsetWidth;height=paper.offsetHeight;if(!box.width||!width)return;
   const scale=box.width/width;svg.setAttribute('viewBox',`0 0 ${width} ${height}`);regions.replaceChildren();
   areas=[...paper.querySelectorAll(selector)].filter(el=>el.textContent.trim()&&el.getBoundingClientRect().width).map(el=>{
    const b=el.getBoundingClientRect(),x=(b.left-box.left)/scale-4,y=(b.top-box.top)/scale-3,w=b.width/scale+8,h=b.height/scale+6;
    const group=node('g',{'class':'drafted-scan-region',opacity:0}),rect=node('rect',{x,y,width:w,height:h,rx:1.5}),corners=node('path',{d:`M${x} ${y+5}V${y}h5 M${x+w-5} ${y+h}h5v-5`}),detail=node('circle',{cx:x+w+4,cy:y+3,r:1.2,opacity:0});group.append(rect,corners,detail);regions.append(group);return {group,detail,y:y+h*.35};
   });
  }
  function render(elapsed,reduced){
   svg.dataset.reduced=String(reduced);
   if(reduced){areas.forEach((a,i)=>{a.group.setAttribute('opacity',i%5===0?.22:0);a.detail.setAttribute('opacity',0);});return;}
   const cycle=elapsed%5600,progress=Math.min(1,cycle/4800),top=18,bottom=height-18,y=top+(bottom-top)*progress;
   sweep.setAttribute('opacity',Math.min(1,cycle/180,Math.max(0,(5000-cycle)/200)));
   zone.setAttribute('x',14);zone.setAttribute('y',y-90);zone.setAttribute('width',Math.max(0,width-28));zone.setAttribute('height',90);
   line.setAttribute('d',`M14 ${y}H${width-14}`);tips.setAttribute('d',`M14 ${y-3}v6 M${width-14} ${y-3}v6`);
   areas.forEach(a=>{const age=cycle-(a.y-top)/(bottom-top)*4800,opacity=age<0?0:age<100?age/100:Math.max(0,1-(age-100)/1000);a.group.setAttribute('opacity',opacity*.8);a.detail.setAttribute('opacity',age>150&&age<700?.7:0);});
  }
  measure();return {paper,measure,render,remove:()=>svg.remove()};
 }
 function create({host,paperSelector='.source-pdf-slot[data-rendered=true] .source-pdf-paper',regionSelector='.source-pdf-text span:not(.markedContent)',reducedMotion=false}){
  const preference=matchMedia('(prefers-reduced-motion: reduce)'),surfaces=new Map();
  let active=false,paused=false,speed=1,manualReduced=reducedMotion,elapsed=0,last=null,frame=0,queued=false;
  const reduced=()=>preference.matches||manualReduced;
  const render=()=>surfaces.forEach(s=>s.render(elapsed,reduced()));
  function tick(now){frame=0;if(!active||paused||reduced()||document.hidden){last=null;return;}if(last!==null)elapsed+=(now-last)*speed;last=now;render();frame=requestAnimationFrame(tick);}
  function schedule(){cancelAnimationFrame(frame);frame=0;last=null;render();if(active&&!paused&&!reduced()&&!document.hidden)frame=requestAnimationFrame(tick);}
  function refresh(){
   queued=false;if(!active)return;const papers=[...host.querySelectorAll(paperSelector)];
   for(const [paper,s] of surfaces)if(!papers.includes(paper)){s.remove();surfaces.delete(paper);}
   for(const paper of papers){if(!surfaces.has(paper))surfaces.set(paper,surface(paper,regionSelector));else surfaces.get(paper).measure();}render();
  }
  const observer=new MutationObserver(records=>{
   if(active&&!queued&&records.some(r=>!r.target.closest?.('.drafted-cv-scan')&&(r.type==='attributes'||[...r.addedNodes,...r.removedNodes].some(n=>n.nodeType===1&&!n.matches('.drafted-cv-scan'))))){queued=true;queueMicrotask(refresh);}
  });
  const resize=new ResizeObserver(()=>{if(active){surfaces.forEach(s=>s.measure());render();}});
  function stop(){active=false;cancelAnimationFrame(frame);frame=0;last=null;observer.disconnect();resize.disconnect();for(const s of surfaces.values())s.remove();surfaces.clear();host?.removeAttribute('data-cv-analyzing');}
  preference.addEventListener('change',schedule);document.addEventListener('visibilitychange',schedule);global.addEventListener('pagehide',stop);
  return {start(){if(!host)return;stop();active=true;paused=false;elapsed=0;host.dataset.cvAnalyzing='true';observer.observe(host,{subtree:true,childList:true,attributes:true,attributeFilter:['data-rendered','data-state']});resize.observe(host);refresh();schedule();},stop,
   pause(value){paused=!!value;schedule();},speed(value){speed=value;},reduced(value){manualReduced=!!value;schedule();},
   get active(){return active;},dispose(){stop();preference.removeEventListener('change',schedule);document.removeEventListener('visibilitychange',schedule);global.removeEventListener('pagehide',stop);}};
 }
 global.DraftedCvScan={create};
})(window);
