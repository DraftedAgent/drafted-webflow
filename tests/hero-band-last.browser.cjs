'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..'),out=path.join(root,'output/pdf/hero-band-last');
(async()=>{
  fs.mkdirSync(out,{recursive:true});
  const server=spawn(process.execPath,[path.join(root,'tools/serve-standalone.cjs')],{env:{...process.env,PORT:'0'},stdio:['ignore','pipe','pipe']});
  const base=await new Promise(r=>server.stdout.on('data',s=>{const m=String(s).match(/http:\/\/127\.0\.0\.1:\d+\//);if(m)r(m[0]);}));
  const browser=await chromium.launch({headless:true,channel:'msedge'}),results=[];
  try{
    for(const width of [1440,390]){
      const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage(),outside=[],errors=[];
      await context.route('**/*',r=>{if(!r.request().url().startsWith(base)){outside.push(r.request().url());return r.abort();}return r.continue();});
      page.on('pageerror',e=>errors.push(e.message));
      await page.addInitScript(()=>{const native=requestAnimationFrame;let pending;window.requestAnimationFrame=fn=>{if(fn.name==='tickHeroMotion'){pending=fn;return -1;}return native(fn);};window.__stepHero=t=>{const fn=pending;pending=null;fn?.(t);};});
      const response=await page.goto(base);
      assert.match(await response.text(),/data-motion-band style="visibility:hidden"/,'Initial markup hides the band before hydration');
      await page.waitForFunction(()=>document.querySelector('.drafted-hero-brand')?.dataset.motionState==='playing');
      const band=page.locator('[data-motion-band]'),dot=page.locator('[data-motion-dot]');
      async function step(t){await page.evaluate(t=>__stepHero(t/1.15),t);}
      await step(0);assert.equal(await band.evaluate(e=>getComputedStyle(e).visibility),'hidden');
      await step(710);
      assert.deepEqual(await page.locator('[data-motion-remaining]').evaluateAll(es=>es.map(e=>Number(e.getAttribute('width')))),[0,0,0,0],'All cuts finish before the dot and band');
      assert.equal(await dot.evaluate(e=>getComputedStyle(e).display),'none');
      assert.equal(await band.evaluate(e=>getComputedStyle(e).visibility),'hidden');
      await step(1160);assert.equal(await dot.getAttribute('transform'),'translate(0 0) rotate(360 1350.5 283.25)');
      assert.equal(await band.evaluate(e=>getComputedStyle(e).visibility),'hidden');
      await step(1420);assert.equal(await band.evaluate(e=>getComputedStyle(e).visibility),'visible');
      assert.equal(await band.getAttribute('transform'),'translate(-12 12)');
      await page.screenshot({path:path.join(out,`band-rising-${width}.png`)});
      await step(1900);assert.equal(await band.getAttribute('transform'),'translate(4 0)');
      await step(2275);assert.equal(await band.getAttribute('transform'),'translate(0 0)');
      assert.deepEqual(await page.locator('[data-motion-side]').evaluateAll(es=>es.map(e=>e.style.opacity)),['1','1']);
      await step(2400);await page.waitForFunction(()=>document.querySelector('.drafted-hero-brand').dataset.motionState==='complete');
      await page.setViewportSize({width:width-10,height:850});await page.evaluate(()=>{scrollTo(0,900);scrollTo(0,0);});
      assert.equal(await page.evaluate(()=>performance.getEntriesByName('drafted-hero-motion-start').length),1);
      await page.screenshot({path:path.join(out,`complete-${width}.png`)});
      assert.deepEqual(outside,[]);assert.deepEqual(errors,[]);results.push({width,order:'cuts, dot, band, registration lock',durationMs:2400/1.15});await context.close();
    }
    for(const options of [{reducedMotion:'reduce'},{javaScriptEnabled:false}]){
      const context=await browser.newContext(options),page=await context.newPage();
      await context.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());
      await page.goto(base);await page.locator('.drafted-hero-wordmark').waitFor({state:'visible'});
      assert.equal(await page.locator('.drafted-hero-initial').isVisible(),false);await context.close();
    }
    fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify({results,staticFallback:true,realBackendRequests:0},null,2));console.log(JSON.stringify(results));
  }finally{await browser.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
