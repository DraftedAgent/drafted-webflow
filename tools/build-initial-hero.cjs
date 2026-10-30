'use strict';
// Generates the HTML to deliver, not a client-side replacement of old content.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),landing=path.join(root,'webflow/landing');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const data=read('webflow/assets/brand/drafted-hero-motion.json'),g=JSON.parse(data);
const source=f=>read('webflow/assets/brand/'+f).replaceAll('\r\n','\n');
const paths=f=>(source(f).match(/<path[\s\S]*?\/>/g)||[]).map(p=>p.replace(/\s+id="[^"]*"/g,'')).join('');
const wordSource=source('drafted-wordmark-reference-dot.svg'),word=wordSource.match(/<path id="wordmark"[\s\S]*?\/>/)[0].replace(' id="wordmark"',''),dot=wordSource.match(/<path id="brand-dot"[\s\S]*?\/>/)[0].replace(' id="brand-dot"','');
const rule=paths('drafted-measurement-rule.svg'),marks=paths('drafted-registration-marks.svg');
const svg=(attrs,body)=>`<svg xmlns="http://www.w3.org/2000/svg" fill="none" ${attrs}>${body}</svg>`;
const logo=cls=>svg(`class="${cls}" viewBox="0 0 1380 320" width="1380" height="320" role="img" aria-label="Drafted"`,word+dot);
const edges=[-2,294,608,1092,1382];
const remaining=edges.slice(0,4).map((x,i)=>`<rect data-motion-remaining="${i}" x="${x}" y="-2" width="${edges[i+1]-x}" height="325"/>`).join('');
const complete=edges.slice(0,4).map((x,i)=>`<rect data-motion-complete="${i}" x="${x}" y="-2" width="0" height="325"/>`).join('');
const defs=`<defs><clipPath id="initial-remaining" clipPathUnits="userSpaceOnUse">${remaining}</clipPath><clipPath id="initial-complete" clipPathUnits="userSpaceOnUse">${complete}</clipPath><clipPath id="initial-dot" clipPathUnits="userSpaceOnUse"><rect x="1316" y="220" width="104" height="120"/></clipPath>${[0,1].map(i=>`<clipPath id="initial-marks-${i}" clipPathUnits="userSpaceOnUse"><rect x="${i*768}" width="768" height="368"/></clipPath>`).join('')}</defs>`;
const startWord=`<path data-motion-solid fill="#0C1724" fill-rule="evenodd" clip-path="url(#initial-remaining)" d="${[g.unchanged,...g.cuts.map(c=>c.frames[0])].join(' ')}"/><path fill="#0C1724" fill-rule="evenodd" clip-path="url(#initial-complete)" d="${g.original}"/>`;
const startMarks=[0,1].map(i=>`<g class="drafted-motion-marks" data-motion-side="${i}" transform="translate(${i?6:-6} 0)" style="opacity:.24"><g transform="translate(-80 -15)" clip-path="url(#initial-marks-${i})">${marks}</g><path data-motion-helper="${i}" d="${i?'M1371 307V331M1371 331H1387':'M9 307V331M9 331H-11'}" fill="none" stroke="#02c8bb" stroke-width=".8" vector-effect="non-scaling-stroke" style="opacity:0"/></g>`).join('');
const initial=svg('class="drafted-hero-motion drafted-hero-initial" viewBox="0 0 1380 354" width="1380" height="354" aria-hidden="true" focusable="false"',defs+startWord+`<g data-motion-band style="visibility:hidden" transform="translate(-12 24)"><g transform="translate(0 323)">${rule}</g></g>`+startMarks+`<g clip-path="url(#initial-dot)"><g data-motion-dot style="display:none" transform="translate(36 0) rotate(0 1350.5 283.25)">${dot}</g></g>`);
const hero=`<!-- DRAFTED_INITIAL_START -->
<div id="drafted-start" class="page-start drafted-landing"><header class="navbar drafted-site-header" role="banner"><div class="drafted-header-inner"><a class="drafted-home" href="#drafted-start" aria-label="Drafted home">${logo('drafted-nav-wordmark')}</a></div></header>
<section class="hero-section snap-section drafted-hero" data-initial-hero aria-labelledby="drafted-hero-heading"><div class="drafted-hero-inner"><div class="drafted-hero-brand" data-initial-hero>${logo('drafted-hero-wordmark')}${svg('class="drafted-hero-rule" viewBox="0 0 1380 26" preserveAspectRatio="none" aria-hidden="true"',rule)}<div class="drafted-hero-registration" aria-hidden="true">${svg('class="drafted-hero-marks" viewBox="0 0 1536 368" preserveAspectRatio="none" aria-hidden="true"',marks)}</div>${initial}</div><div class="drafted-hero-content"><h1 id="drafted-hero-heading" class="drafted-hero-heading"><span>More substance.</span> <span>Less underselling.</span></h1><div class="drafted-hero-direction"><p class="drafted-hero-description">Build a CV that reflects the experience you bring to the role.</p><a class="drafted-hero-action" href="#section-input">Start with your CV<span class="drafted-action-arrow" aria-hidden="true">→</span></a></div></div></div><template data-drafted-hero-ready></template></section></div>
<!-- DRAFTED_INITIAL_END -->`;
const probe=`(function(){var r=document.documentElement;var ok=window.matchMedia&&!matchMedia('(prefers-reduced-motion: reduce)').matches&&window.IntersectionObserver&&window.MutationObserver&&window.requestAnimationFrame;if(ok){r.dataset.draftedHero='eligible';window.__DRAFTED_HERO_DEADLINE__=setTimeout(function(){if(!document.querySelector('.drafted-hero-brand[data-motion-state="playing"],.drafted-hero-brand[data-motion-state="waiting"],.drafted-hero-brand[data-motion-state="complete"]'))r.dataset.draftedHero='fallback';},5000);}else r.dataset.draftedHero='static';})();`;
const runtime=read('webflow/src/hero-motion.js')+'\n;\n'+read('webflow/src/hero-view.js');
const critical=`html,body{margin:0;height:100%;background:#f8f7f4}.drafted-landing,.drafted-landing *{box-sizing:border-box}\n`+read('webflow/src/css/scroll-snap.css')+'\n'+read('webflow/src/css/components/hero.css');
const head=`<!-- DRAFTED_INITIAL_HEAD_START -->
<style data-drafted-critical>${critical}</style>
<script data-drafted-probe>${probe}</script>
<script data-drafted-early>${runtime}</script>
<!-- DRAFTED_INITIAL_HEAD_END -->`;
// Keep data outside the head so text/SVG can paint while it arrives. Bounded
// parts can also be inserted individually by the page's editing surface.
const compact={original:g.original,unchanged:g.unchanged,cuts:g.cuts.map(c=>({frames:c.frames.map((s,i)=>{if(!i)return s;const previous=c.frames[i-1];let a=0,b=0;while(a<Math.min(s.length,previous.length)&&s[a]===previous[a])a++;while(b<Math.min(s.length,previous.length)-a&&s[s.length-1-b]===previous[previous.length-1-b])b++;return[a,b,s.slice(a,s.length-b)];})}))};
const compactText=JSON.stringify(compact),parts=[];
const roundTrip=JSON.parse(compactText);for(const c of roundTrip.cuts)for(let i=1;i<c.frames.length;i++){const [a,b,m]=c.frames[i],p=c.frames[i-1];c.frames[i]=p.slice(0,a)+m+(b?p.slice(-b):'');}
require('node:assert/strict').deepEqual(roundTrip,{original:g.original,unchanged:g.unchanged,cuts:g.cuts.map(c=>({frames:c.frames}))});
for(let offset=0;offset<compactText.length;offset+=32768){const i=parts.length;parts.push(`<script ${i===0?'id="drafted-hero-geometry" ':''}type="application/json" data-geometry-part="${i}" data-format="prefix-delta-v1">${JSON.stringify(compactText.slice(offset,offset+32768))}</script>`);}
const payload=parts.join('\n');
const smallHead=head;
const visual=hero.replace('<template data-drafted-hero-ready></template>','');
const fullHero=visual.replace('<!-- DRAFTED_INITIAL_END -->',payload+'\n<template data-drafted-hero-ready></template>\n<!-- DRAFTED_INITIAL_END -->');
function transform(html){
 html=html.replace(/<!-- DRAFTED_INITIAL_HEAD_START -->[\s\S]*?<!-- DRAFTED_INITIAL_HEAD_END -->\s*/,'');
 if(html.includes('<!-- DRAFTED_INITIAL_START -->'))html=html.replace(/<!-- DRAFTED_INITIAL_START -->[\s\S]*?<!-- DRAFTED_INITIAL_END -->/,fullHero);
 else{
  const body=html.match(/<body\b[^>]*>/i);if(!body)throw Error('Missing body');const start=body.index+body[0].length,scroll=html.indexOf('<div class="page-scroll">',start);if(scroll<0)throw Error('Missing page-scroll');
  // Existing public/fixture header is immediately before the shared scroller.
  html=html.slice(0,start)+html.slice(scroll);
  const oldHero=html.match(/<section\b[^>]*class="[^"]*\bhero-section\b[^>]*>[\s\S]*?<\/section>/);if(!oldHero)throw Error('Missing original hero section');html=html.replace(oldHero[0],fullHero);
 }
 // Place the critical markup/probe before external styles or editor scripts.
 html=html.replace(/<head\b[^>]*>/i,m=>m+'\n'+smallHead+'\n');
 // Editor/Webflow styles are non-blocking; inline critical styles own the hero.
 html=html.replace(/<link\b[^>]*rel="stylesheet"[^>]*>/gi,m=>m.includes('data-drafted-deferred')||m.includes('data-drafted-noscript')?m:m.replace(/\s*\/?\s*>$/,' media="print" onload="this.media=\'all\'" data-drafted-deferred>')+'<noscript>'+m.replace(/\s*\/?\s*>$/,' data-drafted-noscript>')+'</noscript>');
 if(html.includes('Rewrite your CV with ruthless clarity'))throw Error('Legacy hero survived initial HTML transformation');
 return html;
}
if(require.main===module){
fs.mkdirSync(landing,{recursive:true});
fs.writeFileSync(path.join(root,'drafted-hero.js'),runtime);fs.mkdirSync(path.join(root,'webflow/dist'),{recursive:true});fs.writeFileSync(path.join(root,'webflow/dist/drafted-hero.js'),runtime);
fs.writeFileSync(path.join(landing,'head.html'),smallHead);fs.writeFileSync(path.join(landing,'hero.html'),fullHero);
fs.writeFileSync(path.join(landing,'hero-visual.html'),visual);fs.writeFileSync(path.join(landing,'motion-data.html'),payload+'\n<template data-drafted-hero-ready></template>');
parts.forEach((part,i)=>fs.writeFileSync(path.join(landing,`motion-data-${i+1}.html`),part+(i===parts.length-1?'\n<template data-drafted-hero-ready></template>':'')));
const args=process.argv.slice(2),input=args[0],output=args[1];
if(input&&output){fs.writeFileSync(path.resolve(root,output),transform(fs.readFileSync(path.resolve(root,input),'utf8')));}
else{const fixture=path.join(root,'webflow/preview/editor.html');fs.writeFileSync(fixture,transform(fs.readFileSync(fixture,'utf8')));}
console.log(JSON.stringify({heroBytes:Buffer.byteLength(fullHero),visualBytes:Buffer.byteLength(visual),headBytes:Buffer.byteLength(smallHead),standaloneJsBytes:Buffer.byteLength(runtime),initialContent:true}));
}
module.exports={transform,head:smallHead,hero:fullHero,runtime};
