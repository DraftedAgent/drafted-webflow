'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{spawn,execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),out=path.join(root,'output/pdf/hero-motion');fs.mkdirSync(out,{recursive:true});
const sizes=[{width:1536,height:1024},{width:1366,height:768},{width:390,height:844},{width:320,height:640}];
const clock=()=>{const raf=window.requestAnimationFrame,caf=window.cancelAnimationFrame;let pending,seq=-100;
 window.requestAnimationFrame=fn=>{if(fn.name==='tickHeroMotion'){pending=fn;return --seq}return raf(fn)};
 window.cancelAnimationFrame=id=>{if(id<-100)pending=null;else caf(id)};
 window.__heroAdvance=t=>{const next=pending;pending=null;if(next)next(t);return !!next};
};
(async()=>{
 const child=spawn(process.execPath,[path.join(root,'tools/serve-editor-preview.cjs')],{env:{...process.env,PORT:'0',DRAFTED_PREVIEW_HEADER_CASE:'complete'},stdio:['ignore','pipe','pipe']});
 const base=await new Promise((resolve,reject)=>{child.stdout.on('data',s=>{const m=String(s).match(/http:\/\/127\.0\.0\.1:\d+\//);if(m)resolve(m[0])});child.on('error',reject)});
 const browser=await chromium.launch({headless:true,channel:'msedge'}),outside=[],errors=[],report={viewports:[],failures:[],approvedGeometrySha256:require('node:crypto').createHash('sha256').update(fs.readFileSync(path.join(root,'webflow/assets/brand/drafted-hero-motion.json'))).digest('hex')};
 try{
 async function page(options={},mode='candidate'){
  const p=await browser.newPage(options);p.on('pageerror',e=>errors.push(e.message));
  await p.route('**/*',route=>{const request=route.request(),url=request.url();if(!url.startsWith(base)){outside.push(url);return route.abort()}
   const file=new URL(url).pathname.slice(1);
   if(mode==='baseline'&&['drafted-editor.js','drafted-editor.css'].includes(file))return route.fulfill({contentType:file.endsWith('.js')?'text/javascript':'text/css',body:execFileSync('git',['show','HEAD:'+file],{cwd:root})});
   if(mode==='missing'&&file.endsWith('drafted-hero-motion.json'))return route.fulfill({status:404,body:''});
   if(mode==='malformed'&&file.endsWith('drafted-hero-motion.json'))return route.fulfill({json:{cuts:[]}});
   if(mode==='timeout'&&file.endsWith('drafted-hero-motion.json'))return new Promise(resolve=>setTimeout(()=>resolve(route.fulfill({status:503,body:''}).catch(()=>{})),4300));
   return route.continue();
  });return p;
 }
 const geometry=p=>p.evaluate(()=>Object.fromEntries(['.drafted-nav-wordmark','.drafted-hero-brand','.drafted-hero-wordmark','.drafted-hero-heading','.drafted-hero-description','.drafted-hero-action','#section-input'].map(sel=>{const r=document.querySelector(sel).getBoundingClientRect();return[sel,{x:r.x,y:r.y,width:r.width,height:r.height}]})));
 const brand='.drafted-hero-brand';
 for(const viewport of sizes){
  const p=await page({viewport}),baseline=await page({viewport},'baseline');await p.addInitScript(clock);await baseline.goto(base);await p.goto(base);await p.waitForFunction(()=>document.querySelector('.drafted-hero-brand')?.dataset.motionState==='playing');
  assert.deepEqual(await geometry(p),await geometry(baseline),'layout matches existing static hero');
  const before=await geometry(p),header=await p.locator('.drafted-nav-wordmark').getAttribute('src');
  const approved=JSON.parse(fs.readFileSync(path.join(root,'webflow/assets/brand/drafted-hero-motion.json')));
  await p.evaluate(()=>__heroAdvance(0));
  for(const t of [0,240,480,720,900,1120,1185,1250,1335,1400,1485,1550,1635,1700,1960,2220]){
   await p.evaluate(t=>__heroAdvance(t),t);assert.deepEqual(await geometry(p),before,'no layout movement');
   assert.equal(await p.locator('.drafted-hero-action').isVisible(),true);assert.equal(await p.locator('.drafted-hero-heading').isVisible(),true);
   assert.equal(await p.locator('.drafted-nav-wordmark').getAttribute('src'),header);
   assert.equal(await p.locator('.drafted-hero-motion').getAttribute('aria-hidden'),'true');assert.equal(await p.getByRole('img',{name:'Drafted',exact:true}).count(),2,'header and hero retain accessible names');
   assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   if(t===720)assert.equal(await p.locator('[data-motion-layer="band"]').getAttribute('transform'),'translate(4 0)');
   if(t===900)assert.equal(await p.locator('[data-motion-layer="band"]').getAttribute('transform'),'translate(0 0)');
   if(t===2220)assert.equal(await p.locator('[data-motion-layer="dot"]').getAttribute('transform'),'translate(0 0) rotate(360 1350.5 283.25)');
   if(t===1335){await p.setViewportSize({...viewport,width:viewport.width-1});assert.equal(await p.locator(brand).getAttribute('data-motion-time'),'1335');assert.equal(await p.locator(brand).getAttribute('data-motion-state'),'playing');await p.setViewportSize(viewport);}
  }
  await p.evaluate(()=>__heroAdvance(2400));assert.equal(await p.locator(brand).getAttribute('data-motion-state'),'complete');assert.equal(await p.locator('.drafted-hero-motion').count(),0);
  await p.screenshot({path:path.join(out,`hero-${viewport.width}.png`)});
  const candidate=await p.locator(brand).screenshot(),reference=await baseline.locator(brand).screenshot();fs.writeFileSync(path.join(out,`end-${viewport.width}.png`),candidate);fs.writeFileSync(path.join(out,`baseline-${viewport.width}.png`),reference);
  await p.locator('.drafted-hero-action').focus();assert.equal(await p.locator('.drafted-hero-action').evaluate(e=>getComputedStyle(e).outlineStyle),'solid');await p.keyboard.press('Enter');await p.waitForFunction(()=>Math.abs(document.querySelector('#section-input').getBoundingClientRect().top)<2);
  await p.evaluate(()=>{scrollTo(0,0);document.querySelector(".page-scroll").scrollTop=0;});await p.setViewportSize({...viewport,height:viewport.height-50});await p.evaluate(()=>DraftedHeroView.mount());assert.equal(await p.locator(brand).getAttribute('data-motion-state'),'complete');assert.equal(await p.locator('.drafted-hero-motion').count(),0);
  report.viewports.push({viewport,layoutUnchanged:true,headerStatic:true,cta:true,noRestart:true});await p.close();await baseline.close();
 }
 // Native RAF: direct-entry visibility, CTA during motion and next visible hero.
 const live=await page({viewport:sizes[0]});await live.goto(base+'#section-input');await live.waitForFunction(()=>document.querySelector('.drafted-hero-brand')?.dataset.motionState==='waiting');assert.equal(await live.locator('.drafted-hero-motion').count(),0);
 await live.evaluate(()=>{scrollTo(0,0);document.querySelector(".page-scroll").scrollTop=0;});await live.waitForFunction(()=>document.querySelector('.drafted-hero-brand').dataset.motionState==='playing');
 await live.locator('.drafted-hero-action').click();await live.waitForFunction(()=>Math.abs(document.querySelector('#section-input').getBoundingClientRect().top)<2);await live.waitForTimeout(2600);await live.evaluate(()=>{scrollTo(0,0);document.querySelector(".page-scroll").scrollTop=0;});assert.equal(await live.locator(brand).getAttribute('data-motion-state'),'complete');await live.close();report.firstVisibleOnly=true;
 const motionPreference=await page({viewport:sizes[2],reducedMotion:'reduce'});await motionPreference.goto(base);await motionPreference.locator('.drafted-hero').waitFor();assert.equal(await motionPreference.locator(brand).getAttribute('data-motion-state'),'static');assert.equal(await motionPreference.locator('.drafted-hero-motion').count(),0);await motionPreference.close();
 const unsupported=await page({viewport:sizes[2]});await unsupported.addInitScript(()=>{window.IntersectionObserver=undefined;});await unsupported.goto(base);await unsupported.locator('.drafted-hero').waitFor();assert.equal(await unsupported.locator(brand).getAttribute('data-motion-state'),'static');assert.equal(await unsupported.locator('.drafted-hero-wordmark').isVisible(),true);await unsupported.close();report.unsupportedApiFallback=true;
 const changed=await page({viewport:sizes[0]});await changed.addInitScript(clock);await changed.goto(base);await changed.waitForFunction(()=>document.querySelector('.drafted-hero-brand')?.dataset.motionState==='playing');await changed.emulateMedia({reducedMotion:'reduce'});await changed.waitForFunction(()=>document.querySelector('.drafted-hero-brand').dataset.motionState==='static');await changed.emulateMedia({reducedMotion:'no-preference'});assert.equal(await changed.locator('.drafted-hero-motion').count(),0);await changed.close();report.reducedMotion=true;
 for(const failure of ['missing','malformed','timeout']){const p=await page({viewport:sizes[2]},failure);await p.goto(base);await p.waitForFunction(()=>document.querySelector('.drafted-hero-brand')?.dataset.motionState==='failed');assert.equal(await p.locator('.drafted-hero-wordmark').evaluate(e=>getComputedStyle(e).opacity),'1');assert.equal(await p.locator('.drafted-hero-motion').count(),0);assert.equal(await p.locator('.drafted-hero-action').isVisible(),true);report.failures.push(failure);await p.close();}
 // Loading the animation module is optional: the existing static mount works.
 const absent=await page({viewport:sizes[2]},'baseline');await absent.goto(base);assert.equal(await absent.locator('.drafted-hero-wordmark').isVisible(),true);await absent.close();
 assert.deepEqual(outside,[]);assert.deepEqual(errors,[]);report.externalRequests=0;report.errors=[];fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }finally{await browser.close();child.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
