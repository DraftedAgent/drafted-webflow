'use strict';
// Actual Webflow DOM with candidate assets. Never execute a production backend.
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=path.join(root,'output/pdf/hero-release'),site='https://drafted-cad750.webflow.io/',assets='https://draftedagent.github.io/drafted-webflow/';
const mode=process.env.HERO_SITE_MODE||'candidate',sizes=[{width:1536,height:1024},{width:1366,height:768},{width:390,height:844},{width:320,height:640}];
(async()=>{const browser=await chromium.launch({headless:true,channel:'msedge'}),report={mode,viewports:[],backendExecutions:0},errors=[],unexpected=[],posts=[];
try{
 const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{const raf=requestAnimationFrame;let pending;window.requestAnimationFrame=fn=>{if(fn.name==='tickHeroMotion'){pending=fn;return -1000}return raf(fn)};window.__advanceHero=t=>{const cb=pending;pending=null;if(cb)cb(t)}});
 await page.route('**/*',async route=>{
  const r=route.request(),u=new URL(r.url()),headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*','Access-Control-Allow-Methods':'POST, OPTIONS'};
  if(r.method()==='OPTIONS')return route.fulfill({status:204,headers});
  if(r.method()==='POST'||u.hostname.endsWith('n8n.cloud')){posts.push(u.pathname);if(u.pathname.endsWith('/webflow-upload-cv')){const f=require('./fixtures/cv-header.cjs');return route.fulfill({headers,json:f.envelope(f.cases.complete)})}unexpected.push(u.pathname);return route.fulfill({status:503,headers,json:{ok:false}})}
  if(u.hostname==='challenges.cloudflare.com')return route.fulfill({contentType:'text/javascript',body:'/* Non-verifying UI stub for the unrelated Webflow form challenge. */ window.turnstile={ready:cb=>cb(),render:()=>"isolated-widget",reset:()=>{},remove:()=>{}};'});
  if(mode==='candidate'&&r.url().startsWith(assets)){
   const rel=u.pathname.replace('/drafted-webflow/',''),file=path.join(root,rel);
   if(['latest.json','drafted-editor.js','drafted-editor.css'].includes(rel)||rel.startsWith('webflow/assets/brand/')){assert(fs.existsSync(file),'Candidate asset exists: '+rel);if(rel==='drafted-editor.css')await new Promise(resolve=>setTimeout(resolve,750));return route.fulfill({headers,body:fs.readFileSync(file),contentType:rel.endsWith('.json')?'application/json':rel.endsWith('.svg')?'image/svg+xml':rel.endsWith('.css')?'text/css':'text/javascript'})}
  }
  if(r.method()==='GET'&&['drafted-cad750.webflow.io','draftedagent.github.io','ajax.googleapis.com','d3e54v103j8qbb.cloudfront.net','cdn.jsdelivr.net','fonts.googleapis.com','fonts.gstatic.com','cdnjs.cloudflare.com'].includes(u.hostname)||r.method()==='GET'&&u.hostname.endsWith('website-files.com'))return route.continue();
  unexpected.push(r.url());return route.abort();
 });
 for(const viewport of sizes){
  await page.setViewportSize(viewport);await page.goto(site+'?hero-release='+Date.now(),{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('.drafted-hero-brand')?.dataset.motionState==='playing');
  await page.evaluate(async()=>Promise.all([...document.querySelectorAll('.drafted-landing img')].map(i=>i.decode())));
  const geometry=()=>page.evaluate(()=>{const box=s=>{const r=document.querySelector(s).getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height}};return{brand:box('.drafted-hero-brand'),heading:box('.drafted-hero-heading'),cta:box('.drafted-hero-action'),nav:box('.drafted-nav-wordmark')}});
  const before=await geometry();await page.evaluate(()=>__advanceHero(0));
  for(const t of [240,720,1185,1335,1485,1635,1960,2220]){await page.evaluate(t=>__advanceHero(t),t);assert.deepEqual(await geometry(),before);assert.equal(await page.locator('.drafted-hero-action').isVisible(),true)}
  if(viewport.width===1536||viewport.width===390)await page.screenshot({path:path.join(out,mode+'-motion-'+viewport.width+'.png')});
  // The CTA is active while animation time is held at 2220ms.
  await page.locator('.drafted-hero-action').focus();await page.keyboard.press('Enter');await page.waitForFunction(()=>Math.abs(document.querySelector('#section-input').getBoundingClientRect().top)<2);
  await page.evaluate(()=>__advanceHero(2400));await page.evaluate(()=>{scrollTo(0,0);document.querySelector('.page-scroll').scrollTop=0});await page.setViewportSize({...viewport,height:viewport.height-20});
  assert.equal(await page.locator('.drafted-hero-brand').getAttribute('data-motion-state'),'complete');assert.equal(await page.locator('.drafted-hero-motion').count(),0);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  report.viewports.push({viewport,stableGeometry:true,ctaDuringMotion:true,noRestart:true});
 }
 // Verify upload and handoff against the current deployed editor implementation.
 await page.locator('.drafted-hero-action').click();await page.locator('#cv-file').setInputFiles({name:'synthetic-original.pdf',mimeType:'application/pdf',buffer:Buffer.from(require('./fixtures/source-pdf.js').create({pages:2}))});
 await page.waitForFunction(()=>document.querySelector('#cv-preview').dataset.state==='ready');await page.getByRole('button',{name:'Continue to editor',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('#editor-preview-text').dataset.layoutState==='ready'&&Math.abs(document.querySelector('.section-editor').getBoundingClientRect().top)<2);
 assert.equal(await page.locator('.cv-person-name').textContent(),'Åsa Example');assert.deepEqual(errors,[]);assert.deepEqual(unexpected,[]);report.uploadEditorHandoff=true;report.mockedPosts=posts;report.errors=[];fs.writeFileSync(path.join(out,mode+'-site.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
