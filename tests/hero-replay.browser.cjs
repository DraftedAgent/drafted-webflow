'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..'),out=path.join(root,'output/pdf/hero-band-last');
(async()=>{
  fs.mkdirSync(out,{recursive:true});
  const server=spawn(process.execPath,[path.join(root,'tools/serve-standalone.cjs')],{env:{...process.env,PORT:'0'},stdio:['ignore','pipe','pipe']});
  const base=await new Promise(r=>server.stdout.on('data',s=>{const m=String(s).match(/http:\/\/127\.0\.0\.1:\d+\//);if(m)r(m[0]);}));
  const browser=await chromium.launch({headless:true,channel:'msedge'}),results=[];
  try{
    for(const width of [1440,390]){const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage();page.on('pageerror',e=>{throw e;});await page.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());await page.goto(base);const logo=page.getByRole('button',{name:'Replay Drafted logo animation',exact:true});await page.waitForFunction(()=>document.querySelector('.drafted-hero-brand').dataset.motionState==='complete');await logo.click();await page.waitForFunction(()=>document.querySelector('.drafted-hero-brand').dataset.motionState==='playing');await page.waitForTimeout(300);await logo.press('Enter');await page.waitForFunction(()=>document.querySelector('.drafted-hero-brand').dataset.motionState==='playing');await page.waitForFunction(()=>document.querySelector('.drafted-hero-brand').dataset.motionState==='complete');assert.equal(await page.locator('.drafted-hero-initial').count(),0);await page.emulateMedia({reducedMotion:'reduce'});await logo.click();assert.equal(await page.locator('.drafted-hero-brand').getAttribute('data-motion-state'),'static');console.log('PASS replay',width,'click, keyboard, mid-animation restart and reduced motion');await context.close();}
  }finally{await browser.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
