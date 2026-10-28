'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),{spawn}=require('node:child_process'),path=require('node:path');
(async()=>{
 const server=spawn(process.execPath,[path.resolve(__dirname,'../tools/serve-editor-preview.cjs')],{env:{...process.env,PORT:'0'},stdio:['ignore','pipe','pipe']});let browser;
 try{
  const base=await new Promise((resolve,reject)=>{let text='';server.stdout.on('data',chunk=>{text+=chunk;const match=text.match(/http:\/\/127\.0\.0\.1:\d+\//);if(match)resolve(match[0]);});server.on('error',reject);});
  browser=await chromium.launch({headless:true,channel:'msedge'});
  for(const width of [1440,1024,390,320]){
   const page=await browser.newPage({viewport:{width,height:1000}}),outside=[],errors=[];let release,failed=false;
   page.on('pageerror',error=>errors.push(error.message));
   await page.route('**/*',async route=>{
    const url=route.request().url();if(!url.startsWith(base)){outside.push(url);return route.abort();}
    if(new URL(url).pathname==='/preview-api/jobcontext'){
     await new Promise(resolve=>release=resolve);
     if(failed)return route.fulfill({status:503,json:{ok:false}});
    }
    return route.continue();
   });
   await page.goto(base);await page.locator('.preparation-layout').waitFor();await page.locator('#section-input').evaluate(el=>el.scrollIntoView({behavior:'instant'}));await page.waitForTimeout(100);
   const job=page.locator('#job-ad-input'),button=page.locator('#file-btn'),status=page.locator('#jobcontext-status');
   const position=()=>button.evaluate(el=>{const r=el.getBoundingClientRect();return {x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height};});
   const before=await position(),same=async state=>{const after=await position();for(const key of Object.keys(before))assert(Math.abs(after[key]-before[key])<.5,`${width}px ${state}: file button ${key} moved ${before[key]} -> ${after[key]}; `+JSON.stringify(await page.locator('.preparation-job-feedback').evaluate(el=>[el,...el.children].map(n=>({tag:n.id||n.className,height:n.getBoundingClientRect().height,display:getComputedStyle(n).display,visibility:getComputedStyle(n).visibility,margin:getComputedStyle(n).margin})))));};
   assert.equal(await status.isVisible(),false);
   await job.fill('Short description');assert.equal(await page.locator('#preparation-job-hint').isVisible(),true);await same('short hint');
   const ad='A synthetic role involving product delivery, planning and collaboration. '.repeat(5);
   await job.fill(ad);await page.waitForFunction(()=>document.querySelector('#jobcontext-status').dataset.state==='loading');await same('loading');
   // Clicking the original document coordinate must still open the file chooser.
   await button.scrollIntoViewIfNeeded();const scroll=await page.evaluate(()=>({x:scrollX,y:scrollY}));
   const [chooser]=await Promise.all([page.waitForEvent('filechooser'),page.mouse.click(before.x+before.width/2-scroll.x,before.y+before.height/2-scroll.y)]);await chooser.setFiles([]);
   release();await page.waitForFunction(()=>document.querySelector('#jobcontext-status').dataset.state==='ready');await same('ready');
   failed=true;await job.fill(ad+' Failure case.');await page.waitForFunction(()=>document.querySelector('#jobcontext-status').dataset.state==='loading');release();await page.waitForFunction(()=>document.querySelector('#jobcontext-status').dataset.state==='error');await same('error');
   await job.fill('');await same('cleared');assert.equal(await status.isVisible(),false);assert.equal(await page.locator('#preparation-job-hint').isVisible(),false);
   assert.deepEqual(outside,[]);assert.deepEqual(errors,[]);await page.close();console.log(`PASS ${width}px: stable file-button geometry in idle/hint/loading/ready/error/cleared; original-coordinate click opens chooser`);
  }
 }finally{if(browser)await browser.close();server.kill();}
})().catch(error=>{console.error(error);process.exitCode=1;});
