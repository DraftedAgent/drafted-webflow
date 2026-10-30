/* Approved alternative B, 2400ms. Original graphics remain the static fallback.
   Geometry is baked from the approved SVG paths; there is no raster playback. */
(function(global){
  'use strict';
  const NS='http://www.w3.org/2000/svg',DURATION=2400,mounted=new WeakSet();
  const clamp=x=>Math.max(0,Math.min(1,x)),phase=(t,a,b)=>clamp((t-a)/(b-a)),ease=x=>x*x*(3-2*x);
  function mount(brand,assetBase){
    if(!brand||mounted.has(brand))return;
    mounted.add(brand);
    const reduced=global.matchMedia?.('(prefers-reduced-motion: reduce)');
    if(!reduced||reduced.matches||!global.IntersectionObserver||!global.fetch||!global.AbortController||!global.DOMParser){brand.dataset.motionState='static';return;}
    let observer,frame=0,started=false,visible=false,stage,ready=false,disposed=false,render;
    const abort=new AbortController(),timeout=setTimeout(()=>abort.abort(),4000);
    brand.dataset.motionState='loading';
    function restore(){brand.classList.remove('drafted-hero-motion-running');stage?.remove();}
    function finish(state='complete'){
      if(disposed)return;
      disposed=true;cancelAnimationFrame(frame);clearTimeout(timeout);abort.abort();observer?.disconnect();
      reduced.removeEventListener('change',preferenceChanged);document.removeEventListener('visibilitychange',visibilityChanged);
      restore();brand.dataset.motionState=state;
    }
    function preferenceChanged(){if(reduced.matches)finish('static');}
    function visibilityChanged(){if(document.hidden&&started)finish();else tryStart();}
    function tryStart(){
      if(disposed||started||!ready||!visible||document.hidden)return;
      if(reduced.matches)return finish('static');
      started=true;observer.disconnect();brand.append(stage);brand.classList.add('drafted-hero-motion-running');
      brand.dataset.motionState='playing';let begin;
      function tickHeroMotion(now){
        if(disposed)return;
        try{
          begin??=now;const t=Math.min(DURATION,now-begin);brand.dataset.motionTime=String(Math.round(t));
          if(t>=2280)restore();else render(t);
          if(t<DURATION)frame=requestAnimationFrame(tickHeroMotion);else finish();
        }catch(_){finish('failed');}
      }
      frame=requestAnimationFrame(tickHeroMotion);
    }
    reduced.addEventListener('change',preferenceChanged);document.addEventListener('visibilitychange',visibilityChanged);
    observer=new IntersectionObserver(entries=>{visible=entries.some(e=>e.isIntersecting&&e.intersectionRatio>0);tryStart();},{threshold:[0,.1]});observer.observe(brand);
    async function asset(file,json=false){const response=await fetch(new URL(file,assetBase),{signal:abort.signal,cache:'force-cache'});if(!response.ok)throw Error('Motion asset unavailable');return json?response.json():response.text();}
    Promise.all([asset('drafted-hero-motion.json',true),asset('drafted-wordmark-reference-dot.svg'),asset('drafted-measurement-rule.svg'),asset('drafted-registration-marks.svg')]).then(([geometry,wordSource,ruleSource,marksSource])=>{
      if(disposed)return;
      clearTimeout(timeout);
      const parse=source=>{const doc=new DOMParser().parseFromString(source,'image/svg+xml');if(doc.querySelector('parsererror'))throw Error('Invalid brand vector');return doc;};
      const word=parse(wordSource),rule=parse(ruleSource),marks=parse(marksSource);
      if(geometry.original!==word.getElementById('wordmark')?.getAttribute('d')||typeof geometry.unchanged!=='string'||geometry.cuts?.length!==4||geometry.cuts.some(c=>c.frames?.length!==131||c.frames.some(d=>typeof d!=='string'||!d)))throw Error('Unmatched motion geometry');
      stage=document.createElementNS(NS,'svg');stage.classList.add('drafted-hero-motion');stage.setAttribute('viewBox','0 0 1380 354');stage.setAttribute('aria-hidden','true');stage.setAttribute('focusable','false');
      const n=(tag,attrs={},parent=stage)=>{const node=document.createElementNS(NS,tag);Object.entries(attrs).forEach(([k,v])=>node.setAttribute(k,v));parent.append(node);return node;};
      const defs=n('defs'),remaining=n('clipPath',{id:'drafted-motion-remaining',clipPathUnits:'userSpaceOnUse'},defs),complete=n('clipPath',{id:'drafted-motion-complete',clipPathUnits:'userSpaceOnUse'},defs);
      [0,1].forEach(side=>{const clip=n('clipPath',{id:'drafted-motion-marks-'+side,clipPathUnits:'userSpaceOnUse'},defs);n('rect',{x:side*768,width:768,height:368},clip);});
      const arrival=n('clipPath',{id:'drafted-motion-arrival',clipPathUnits:'userSpaceOnUse'},defs);n('rect',{x:1316,y:220,width:104,height:120},arrival);
      const edges=[-2,294,608,1092,1382],solid=n('path',{fill:'#0C1724','fill-rule':'evenodd','clip-path':'url(#drafted-motion-remaining)'});
      n('path',{d:geometry.original,fill:'#0C1724','fill-rule':'evenodd','clip-path':'url(#drafted-motion-complete)'});
      const cuts=geometry.cuts.map((c,i)=>({...c,remaining:n('rect',{x:edges[i],y:-2,width:edges[i+1]-edges[i],height:325},remaining),complete:n('rect',{x:edges[i],y:-2,width:0,height:325},complete),width:edges[i+1]-edges[i],start:1120+i*150,end:1250+i*150}));
      function paths(source,parent){source.querySelectorAll('svg>path').forEach(p=>{const copy=document.importNode(p,true);copy.removeAttribute('id');parent.append(copy);});}
      const band=n('g',{'data-motion-layer':'band'}),bandPaths=n('g',{transform:'translate(0 323)'},band);paths(rule,bandPaths);
      const sides=[0,1].map(side=>{
        const outer=n('g',{class:'drafted-motion-marks'}),inner=n('g',{transform:'translate(-80 -15)','clip-path':`url(#drafted-motion-marks-${side})`},outer);paths(marks,inner);
        const helper=n('path',{d:side?'M1371 307V331M1371 331H1387':'M9 307V331M9 331H-11',fill:'none',stroke:'#02c8bb','stroke-width':'.8','vector-effect':'non-scaling-stroke'},outer);return{outer,helper};
      });
      const incoming=n('g',{'clip-path':'url(#drafted-motion-arrival)'}),dot=n('g',{'data-motion-layer':'dot'},incoming);
      const point=word.getElementById('brand-dot');if(!point)throw Error('Missing original point');const pointCopy=document.importNode(point,true);pointCopy.removeAttribute('id');dot.append(pointCopy);
      function bandShift(t){if(t<520)return -12;if(t<720)return -12+16*ease(phase(t,520,720));if(t<760)return 4;return 4*(1-ease(phase(t,760,900)));}
      render=t=>{
        band.setAttribute('transform',`translate(${bandShift(t)} ${24*(1-ease(phase(t,0,480)))})`);
        const shapes=[geometry.unchanged];
        for(const c of cuts){const i=Math.round(phase(t,c.start,c.end)*130);shapes.push(c.frames[i]);c.remaining.setAttribute('width',i===130?0:c.width);c.complete.setAttribute('width',i===130?c.width:0);}
        solid.setAttribute('d',shapes.join(' '));
        const lock=ease(phase(t,950,1090));sides.forEach(({outer,helper},i)=>{outer.setAttribute('transform',`translate(${(i?6:-6)*(1-lock)} 0)`);outer.style.opacity=.24+.76*lock;helper.style.opacity=phase(t,950,1040)*(1-phase(t,1730,1850));});
        const p=ease(phase(t,1810,2220));dot.style.display=t<1810?'none':'';dot.setAttribute('transform',`translate(${36*(1-p)} 0) rotate(${360*p} 1350.5 283.25)`);
      };
      render(0);ready=true;brand.dataset.motionState='waiting';tryStart();
    }).catch(()=>finish('failed'));
  }
  global.DraftedHeroMotion={mount};
})(window);
