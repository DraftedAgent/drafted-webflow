'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..'),out=path.join(root,'output/pdf/initial-hero');fs.mkdirSync(out,{recursive:true});
const audit=()=>{
 window.__heroAudit={samples:[],shifts:[],load:null,dom:null,editor:null};
 addEventListener('load',()=>window.__heroAudit.load=performance.now());addEventListener('DOMContentLoaded',()=>window.__heroAudit.dom=performance.now());
 new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput)window.__heroAudit.shifts.push({value:e.value,time:e.startTime})}).observe({type:'layout-shift',buffered:true});
 let last=0;function sample(){const now=performance.now();if(now-last>=80){last=now;const h=document.querySelector('.drafted-hero-heading'),a=document.querySelector('.drafted-hero-action'),b=document.querySelector('.drafted-hero-brand'),s=b?.querySelector('.drafted-hero-initial');if(h&&a&&b){const r=b.getBoundingClientRect(),t=h.getBoundingClientRect();window.__heroAudit.samples.push({at:now,state:b.dataset.motionState||'initial',time:+(b.dataset.motionTime||0),root:document.documentElement.dataset.draftedHero,solidVisible:!!s&&getComputedStyle(s).display!=='none',finalOpacity:getComputedStyle(b.querySelector('.drafted-hero-wordmark')).opacity,text:h.textContent,cta:getComputedStyle(a).display!=='none',box:[r.x,r.y,r.width,r.height,t.y,t.height],old:!!document.querySelector('.hero-title')})}}if(now<20000)requestAnimationFrame(sample)}requestAnimationFrame(sample);
};
(async()=>{
 const source=path.join(out,'live-original.html');if(!fs.existsSync(source))fs.writeFileSync(source,await(await fetch('https://drafted-cad750.webflow.io/')).text());require('node:child_process').execFileSync(process.execPath,[path.join(root,'tools/build-initial-hero.cjs'),source,path.join(out,'site-prepared.html')]);
 const child=spawn(process.execPath,[path.join(root,'tools/serve-editor-preview.cjs')],{env:{...process.env,PORT:'0',DRAFTED_PREVIEW_HEADER_CASE:'complete'},stdio:['ignore','pipe','pipe']});const base=await new Promise((resolve,reject)=>{child.stdout.on('data',s=>{const m=String(s).match(/http:\/\/127\.0\.0\.1:\d+\//);if(m)resolve(m[0])});child.on('error',reject)});
 const browser=await chromium.launch({headless:true,channel:'msedge'}),report={cases:[],backendExecutions:0};
 try{
 for(const entry of [{name:'desktop-cold',viewport:{width:1536,height:1024},slow:true},{name:'mobile-cold',viewport:{width:390,height:844},slow:true},{name:'actual-webflow-cold',viewport:{width:1536,height:1024},slow:true,actual:true},{name:'reduced-motion',viewport:{width:390,height:844},reduced:true},{name:'no-javascript',viewport:{width:390,height:844},noJS:true},{name:'animation-failure',viewport:{width:390,height:844},failure:true},{name:'early-script-blocked',viewport:{width:390,height:844},blockedRuntime:true}]){
  if(process.env.HERO_FIRST_PAINT_CASE&&entry.name!==process.env.HERO_FIRST_PAINT_CASE)continue;
  const context=await browser.newContext({viewport:entry.viewport,javaScriptEnabled:!entry.noJS,reducedMotion:entry.reduced?'reduce':'no-preference',serviceWorkers:'block'}),page=await context.newPage(),errors=[],outside=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.text().includes('✅ Drafted editor loaded'))page.evaluate(()=>window.__heroAudit.editor=performance.now()).catch(()=>{})});
  if(!entry.noJS)await page.addInitScript(audit);
  await page.route('**/*',async route=>{const u=new URL(route.request().url());if(route.request().url().startsWith(base)){
    if(entry.slow&&u.pathname==='/drafted-editor.js')await new Promise(r=>setTimeout(r,6000));
    return route.continue();
   }
   if(u.hostname==='challenges.cloudflare.com')return route.fulfill({contentType:'text/javascript',body:'window.turnstile={ready:f=>f(),render:()=>"test",reset:()=>{},remove:()=>{}};'});
   if(entry.actual&&route.request().method()==='GET'&&['website-files.com','ajax.googleapis.com','d3e54v103j8qbb.cloudfront.net','cdn.jsdelivr.net','fonts.googleapis.com','fonts.gstatic.com','cdnjs.cloudflare.com'].some(d=>u.hostname===d||u.hostname.endsWith('.'+d)))return route.continue();
   outside.push(route.request().url());return route.abort();
  });
  if(entry.failure||entry.blockedRuntime)await page.route(base+'**',async route=>{if(!route.request().isNavigationRequest())return route.fallback();const r=await route.fetch();let html=await r.text();html=entry.failure?html.replace(/(<script id="drafted-hero-geometry"[^>]*>)[\s\S]*?(<\/script>)/,'$1INVALID$2'):html.replace(/<script data-drafted-early>[\s\S]*?<\/script>/,'');return route.fulfill({response:r,body:html})});
  const cdp=await context.newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});await cdp.send('Network.clearBrowserCache');
  if(entry.slow){await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:180,downloadThroughput:200000,uploadThroughput:93750});await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});}
  const frames=[];let navigationStart=Date.now();
  if(entry.slow){const dir=path.join(out,'capture-'+entry.name);fs.mkdirSync(dir,{recursive:true});cdp.on('Page.screencastFrame',event=>{const i=frames.length,file=path.join(dir,String(i).padStart(4,'0')+'.jpg');fs.writeFileSync(file,Buffer.from(event.data,'base64'));frames.push({file,at:Date.now()-navigationStart,timestamp:event.metadata.timestamp});cdp.send('Page.screencastFrameAck',{sessionId:event.sessionId}).catch(()=>{})});await cdp.send('Page.startScreencast',{format:'jpeg',quality:90,maxWidth:entry.viewport.width,maxHeight:entry.viewport.height,everyNthFrame:1});}
  navigationStart=Date.now();const response=await page.goto(base+(entry.actual?'initial-site':''),{waitUntil:'commit'}),raw=await response.text();assert(!raw.includes('Rewrite your CV with ruthless clarity'));assert(raw.includes('More substance.'));assert(raw.includes('data-motion-solid'));
  let result={name:entry.name,rawHtmlHasNoLegacyHero:true,viewport:entry.viewport};
  if(entry.noJS||entry.reduced||entry.failure||entry.blockedRuntime){await page.locator('.drafted-hero-heading').waitFor();if(entry.blockedRuntime)await page.waitForFunction(()=>document.documentElement.dataset.draftedHero==='fallback');else if(!entry.noJS)await page.waitForFunction(()=>['static','failed'].includes(document.querySelector('.drafted-hero-brand').dataset.motionState));assert.equal(await page.locator('.drafted-hero-initial').isVisible(),false);assert.equal(await page.locator('.drafted-hero-wordmark').isVisible(),true);assert.equal(await page.locator('.drafted-hero-action').isVisible(),true);result.staticFallback=true;}
  else{
   await page.waitForFunction(()=>document.querySelector('.drafted-hero-brand')?.dataset.motionState==='complete',{timeout:20000});
   if(entry.slow){await page.waitForTimeout(150);await cdp.send('Page.stopScreencast');fs.writeFileSync(path.join(out,'capture-'+entry.name,'timeline.json'),JSON.stringify({navigationStart,frames},null,2));}
   await page.waitForFunction(()=>window.__heroAudit.editor!==null&&window.__heroAudit.load!==null,null,{timeout:25000});
   const a=await page.evaluate(()=>window.__heroAudit);fs.writeFileSync(path.join(out,entry.name+'-audit.json'),JSON.stringify(a,null,2));const first=a.samples[0],moving=a.samples.filter(s=>s.state==='playing');assert(first.solidVisible);assert.equal(first.finalOpacity,'0');assert(a.samples.every(s=>!s.old&&s.cta));assert(moving.length>5);assert(moving.every(s=>s.root==='eligible'||s.time>=2280));
   const start=await page.evaluate(()=>performance.getEntriesByName('drafted-hero-motion-start')[0].startTime);assert(start<a.editor,'Hero starts before editor initialization');assert(start<a.load,'Hero starts before load');
   const sameBox=a.samples.every(s=>s.box.every((v,i)=>Math.abs(v-first.box[i])<1));assert(sameBox,'No hero geometry shift during first load or late editor initialization');
   assert(a.samples.filter(s=>s.time<1120&&s.root==='eligible').every(s=>s.solidVisible&&s.finalOpacity==='0'));
   result={...result,firstHeroPaintMs:first.at,motionStartMs:start,editorInitMs:a.editor,loadMs:a.load,cls:a.shifts.reduce((n,s)=>n+s.value,0),frames:frames.length,earlyStart:true,stableHero:true};
   const nodes=await page.evaluate(()=>{window.__heroNode=document.querySelector('.drafted-hero');window.__headerNode=document.querySelector('.drafted-site-header');return true});
   await page.evaluate(()=>DraftedHeroView.mount());assert(await page.evaluate(()=>window.__heroNode===document.querySelector('.drafted-hero')&&window.__headerNode===document.querySelector('.drafted-site-header')));
   await page.locator('.drafted-hero-action').click();await page.waitForFunction(()=>Math.abs(document.querySelector('#section-input').getBoundingClientRect().top)<2);
   result.ctaWorks=true;
  }
  await page.screenshot({path:path.join(out,entry.name+'.png')});assert.deepEqual(errors,[]);assert.deepEqual(outside,[]);report.cases.push(result);console.log(JSON.stringify(result));await context.close();
 }
 fs.writeFileSync(path.join(out,process.env.HERO_FIRST_PAINT_CASE?'verification-'+process.env.HERO_FIRST_PAINT_CASE+'.json':'verification.json'),JSON.stringify(report,null,2));
 }finally{await browser.close();child.kill()}
})().catch(e=>{console.error(e);process.exit(1)});
