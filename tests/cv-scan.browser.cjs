'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..'),out=path.join(root,'output/pdf/cv-scan');
(async()=>{
 fs.mkdirSync(out,{recursive:true});const server=spawn(process.execPath,[path.join(root,'tools/serve-cv-scan.cjs')],{env:{...process.env,PORT:'0'},stdio:['ignore','pipe','pipe']});
 const base=await new Promise(r=>server.stdout.on('data',s=>{const m=String(s).match(/http:\/\/127\.0\.0\.1:\d+\//);if(m)r(m[0]);}));
 const browser=await chromium.launch({headless:true,channel:'msedge'}),results=[];
 try{for(const viewport of [{width:1440,height:1080},{width:390,height:844}]){
  const context=await browser.newContext({viewport}),page=await context.newPage(),errors=[],external=[];
  page.on('pageerror',e=>errors.push(e.message));await context.route('**/*',r=>{if(!r.request().url().startsWith(base)||r.request().method()!=='GET'){external.push(r.request().url());return r.abort();}return r.continue();});
  await page.goto(base);await page.locator('.paper-wrap').scrollIntoViewIfNeeded();
  const before=await page.locator('.paper').evaluate(n=>({text:n.innerText,height:n.getBoundingClientRect().height,width:n.getBoundingClientRect().width}));
  await page.waitForTimeout(1600);const line1=await page.locator('.drafted-scan-sweep>path').first().getAttribute('d');
  await page.screenshot({path:path.join(out,`scan-${viewport.width}.png`),fullPage:true});
  await page.waitForTimeout(2200);assert.notEqual(await page.locator('.drafted-scan-sweep>path').first().getAttribute('d'),line1);
  assert.deepEqual(await page.locator('.paper').evaluate(n=>({text:n.innerText,height:n.getBoundingClientRect().height,width:n.getBoundingClientRect().width})),before);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.waitForTimeout(2300);assert.equal(await page.evaluate(()=>DraftedScanPreview.state),'analyzing','Does not pretend to complete');
  assert.equal(await page.locator('#status').textContent(),'Analyzing your CV…');
  const geometry=await page.evaluate(()=>{const r=document.querySelector('.paper').getBoundingClientRect();return [...document.querySelectorAll('[data-scan]')].every((n,i)=>{const b=n.getBoundingClientRect(),mark=document.querySelectorAll('.drafted-scan-region rect')[i];return Math.abs(Number(mark.getAttribute('y'))-(b.top-r.top-3))<1&&Math.abs(Number(mark.getAttribute('width'))-(b.width+8))<1;});});assert(geometry);
  await page.evaluate(()=>DraftedScanPreview.complete());assert.equal(await page.locator('.drafted-cv-scan').isVisible(),false);
  await page.waitForTimeout(200);assert.equal(await page.locator('.drafted-cv-scan').count(),0);
  await page.evaluate(()=>DraftedScanPreview.start());await page.waitForTimeout(300);await page.evaluate(()=>DraftedScanPreview.fail());await page.locator('#error').waitFor({state:'visible'});assert.equal(await page.locator('.drafted-cv-scan').isVisible(),false);
  await page.screenshot({path:path.join(out,`error-${viewport.width}.png`),fullPage:true});await page.locator('#retry').click();assert.equal(await page.evaluate(()=>DraftedScanPreview.state),'analyzing');
  await page.locator('#pause').click();const paused=await page.locator('.drafted-scan-sweep>path').first().getAttribute('d');await page.waitForTimeout(200);assert.equal(await page.locator('.drafted-scan-sweep>path').first().getAttribute('d'),paused);await page.locator('#pause').click();
  await page.locator('#reduce').check();assert.equal(await page.locator('.drafted-scan-sweep').isVisible(),false);assert.equal(await page.locator('#pause').isDisabled(),true);
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);await context.close();results.push({...viewport,stableDocument:true,alignedRegions:true,loopAndImmediateExit:true});
 }
 const context=await browser.newContext({reducedMotion:'reduce'}),page=await context.newPage();await page.goto(base);assert.equal(await page.locator('#reduce').isChecked(),true);assert.equal(await page.locator('#reduce').isDisabled(),true);assert.equal(await page.locator('.drafted-scan-sweep').isVisible(),false);await page.screenshot({path:path.join(out,'reduced-motion.png'),fullPage:true});await context.close();
 fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify({results,systemReducedMotion:true,backendCalls:0},null,2));console.log(JSON.stringify(results));
 }finally{await browser.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
