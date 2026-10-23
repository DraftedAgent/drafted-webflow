'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),{spawn}=require('node:child_process'),path=require('node:path'),fs=require('node:fs');
(async()=>{
 const child=spawn(process.execPath,[path.resolve(__dirname,'../tools/serve-editor-preview.cjs')],{env:{...process.env,PORT:'0',DRAFTED_PREVIEW_HEADER_CASE:'complete'},stdio:['ignore','pipe','pipe']});
 const base=await new Promise((resolve,reject)=>{let out='';child.stdout.on('data',data=>{out+=data;const m=out.match(/http:\/\/127\.0\.0\.1:\d+\//);if(m)resolve(m[0]);});child.on('error',reject);});
 const browser=await chromium.launch({headless:true,channel:'msedge'}),outside=[],errors=[],results=[],out=path.resolve(__dirname,'../output/pdf/natural-header');fs.mkdirSync(out,{recursive:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  await page.route('**/*',route=>route.request().url().startsWith(base)?route.continue():(outside.push(route.request().url()),route.abort()));page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>document.addEventListener('DOMContentLoaded',()=>{window.__originalHeader=document.querySelector('.navbar');window.__headerClicks=0;window.__originalHeader.addEventListener('click',()=>window.__headerClicks++);}));
  await page.goto(base);
  assert.equal(await page.evaluate(()=>document.querySelector('.page-scroll').firstElementChild===window.__originalHeader),true);
  await page.locator('.navbar .logo').click();assert.equal(await page.evaluate(()=>window.__headerClicks),1);
  const sample=()=>page.getByRole('button',{name:'Try a synthetic CV and job ad',exact:true});
  const geometry=()=>page.evaluate(()=>{const s=document.querySelector('.page-scroll'),n=document.querySelector('.navbar'),e=document.querySelector('.section-editor'),c=document.querySelector('.editor-container'),input=document.querySelector('.chat-command-bar'),p=document.querySelector('.cv-document');return {width:innerWidth,height:innerHeight,scroll:s.scrollTop,navTop:n.getBoundingClientRect().top,navHeight:n.getBoundingClientRect().height,navPosition:getComputedStyle(n).position,navDisplay:getComputedStyle(n).display,top:s.getBoundingClientRect().top,section:e.getBoundingClientRect().top,editorBottom:c.getBoundingClientRect().bottom,inputBottom:input.getBoundingClientRect().bottom,paneHeight:p.getBoundingClientRect().height,snap:getComputedStyle(s).scrollSnapType,oldState:document.documentElement.classList.contains('drafted-editor-active')};});
  for(const viewport of [{width:1440,height:1000},{width:390,height:844},{width:320,height:640},{width:844,height:390}]){
   await page.setViewportSize(viewport);await page.evaluate(()=>document.querySelector('.page-scroll').scrollTop=0);await page.waitForTimeout(200);
   const start=await geometry();assert.equal(start.navTop,0);assert.ok(!['fixed','sticky'].includes(start.navPosition));assert.notEqual(start.navDisplay,'none');assert.equal(start.snap,'none');assert.equal(start.top,0);
   // Scroll in both directions without snapping, delayed visibility changes or height reservation.
   for(const offset of [24,60,120,80,18,0]){
    await page.evaluate(y=>document.querySelector('.page-scroll').scrollTop=y,offset);await page.waitForTimeout(30);const immediate=await geometry();await page.waitForTimeout(200);const settled=await geometry();
    assert.equal(settled.scroll,immediate.scroll);assert.equal(settled.navTop,immediate.navTop);assert.equal(settled.navHeight,start.navHeight);assert.equal(settled.navTop+offset,0);assert.equal(settled.navDisplay,start.navDisplay);assert.equal(settled.oldState,false);
   }
   await page.evaluate(()=>document.querySelector('.page-scroll').scrollTop=60);await page.screenshot({path:path.join(out,`flow-${viewport.width}.png`)});
   // Existing page anchor links continue navigating to upload, without a header offset.
   await page.evaluate(()=>document.querySelector('.page-scroll').scrollTop=0);await page.locator('.tryitfree-button').click();await page.waitForFunction(()=>Math.abs(document.querySelector('#section-input').getBoundingClientRect().top)<2);
   await sample().click();await page.waitForFunction(()=>!document.querySelector('.workspace-print-button').disabled);await page.waitForFunction(()=>Math.abs(document.querySelector('.section-editor').getBoundingClientRect().top)<2);await page.waitForTimeout(100);
   const editor=await geometry();assert.ok(editor.editorBottom<=viewport.height+1);assert.ok(editor.inputBottom<=viewport.height+1);assert.ok(editor.paneHeight>35);assert.ok(editor.navTop+editor.navHeight<0);assert.equal(await page.locator('.workspace-brand').textContent(),'Drafted');
   await page.locator('#editor-input').fill('Keep this unsent instruction.');const pages=await page.locator('.cv-page-content').allTextContents();
   // Reversing scroll by a small amount must reveal only naturally approaching content.
   await page.evaluate(()=>document.querySelector('.page-scroll').scrollTop-=48);const partial=await geometry();await page.waitForTimeout(220);assert.deepEqual(await geometry(),partial);
   await page.locator('.section-editor').evaluate(el=>el.scrollIntoView({behavior:'instant',block:'start'}));
   await page.locator('.cv-block').first().click();assert.ok(await page.locator('.cv-block.is-selected').count());
   const pane=page.locator('.cv-document');await pane.evaluate(el=>el.scrollTop=45);const paneTop=await pane.evaluate(el=>el.scrollTop),outer=await page.locator('.page-scroll').evaluate(el=>el.scrollTop);
   await page.getByRole('button',{name:'Expand preview',exact:true}).click();await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('#cv-preview-dialog').open);await page.waitForTimeout(50);
   assert.equal(await page.locator('.page-scroll').evaluate(el=>el.scrollTop),outer,JSON.stringify({viewport,expected:outer,geometry:await geometry()}));assert.equal(await pane.evaluate(el=>el.scrollTop),paneTop);assert.equal(await page.getByRole('button',{name:'Expand preview',exact:true}).evaluate(el=>el===document.activeElement),true);assert.ok(await page.locator('.cv-block.is-selected').count());
   assert.deepEqual(await page.locator('.cv-page-content').allTextContents(),pages);assert.equal(await page.locator('#editor-input').inputValue(),'Keep this unsent instruction.');
   await page.screenshot({path:path.join(out,`editor-${viewport.width}.png`)});results.push({viewport,headerNormalFlow:true,noDelayedScrollShift:true,editorFullHeight:true});
  }
  // Resize/rotation preserves the editor anchor even while the expanded viewer is open.
  await page.setViewportSize({width:390,height:844});await page.locator('.section-editor').evaluate(el=>el.scrollIntoView({behavior:'instant'}));await page.waitForTimeout(100);
  await page.getByRole('button',{name:'Expand preview',exact:true}).click();await page.setViewportSize({width:844,height:390});await page.waitForTimeout(200);await page.getByRole('button',{name:'Close',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('#cv-preview-dialog').open);await page.waitForTimeout(100);
  for(const size of [{width:844,height:390},{width:320,height:640},{width:1440,height:1000}]){await page.setViewportSize(size);await page.waitForTimeout(200);const g=await geometry();assert.ok(Math.abs(g.section)<2);assert.ok(g.editorBottom<=size.height+1);assert.ok(g.inputBottom<=size.height+1);}
  assert.deepEqual(outside,[]);assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({results,rotation:true,overlayResize:true,outsideRequests:outside,pageErrors:errors},null,2));console.log('Natural header PASS: desktop/mobile/low-height, bidirectional incremental scrolling with no delayed shifts, links/upload, full-height editor, original header/branding/selection/draft/scroll/focus and overlay rotation preserved; zero external calls.');
 }finally{await browser.close();child.kill();}
})().catch(error=>{console.error(error);process.exitCode=1;});
