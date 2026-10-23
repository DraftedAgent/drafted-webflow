'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),{spawn,execFileSync}=require('node:child_process'),path=require('node:path'),os=require('node:os'),fs=require('node:fs');
(async()=>{
 const child=spawn(process.execPath,[path.resolve(__dirname,'../tools/serve-editor-preview.cjs')],{env:{...process.env,PORT:'0',DRAFTED_PREVIEW_PDF_CASE:'long-special'},stdio:['ignore','pipe','pipe']});
 const base=await new Promise((resolve,reject)=>{let output='';const timer=setTimeout(()=>reject(Error('Preview startup timeout')),10000);child.stdout.on('data',data=>{output+=data;const match=output.match(/http:\/\/127\.0\.0\.1:\d+\//);if(match){clearTimeout(timer);resolve(match[0]);}});child.on('error',reject);});
 const output=path.resolve(__dirname,'../output/pdf/editor-workspace');fs.mkdirSync(output,{recursive:true});
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
  const baseline=await browser.newPage({viewport:{width:1440,height:1000}});
  await baseline.route('**/*',route=>{const url=route.request().url();if(!url.startsWith(base))return route.abort();const file=new URL(url).pathname.slice(1);if(['drafted-editor.js','drafted-editor.css'].includes(file))return route.fulfill({contentType:file.endsWith('.js')?'text/javascript':'text/css',body:execFileSync('git',['show','c0cec3e:'+file])});return route.continue();});
  await baseline.goto(base+'?sample=1');await baseline.waitForFunction(()=>!document.querySelector('.workspace-print-button')?.disabled);
  await baseline.waitForTimeout(500);
  const before={},after={};
  for(const viewport of [{width:1440,height:1000},{width:390,height:844}]){await baseline.setViewportSize(viewport);await baseline.locator('.section-editor').evaluate(el=>el.scrollIntoView({behavior:'instant'}));await baseline.waitForTimeout(250);before[viewport.width]=await baseline.locator('.cv-document').boundingBox();await baseline.screenshot({path:path.join(output,`before-${viewport.width}.png`)});}
  await baseline.close();
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],outside=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/*',route=>route.request().url().startsWith(base)?route.continue():(outside.push(route.request().url()),route.abort()));
  await page.addInitScript(()=>{window.print=()=>{window.parent.__toolbarPrintCalls=(window.parent.__toolbarPrintCalls||0)+1;window.dispatchEvent(new Event('afterprint'));};});
  await page.goto(base);assert.equal(await page.locator('.navbar').isVisible(),true);
  await page.getByRole('button',{name:'Try a synthetic CV and job ad',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.workspace-print-button')?.disabled===false);
  await page.waitForFunction(()=>document.documentElement.classList.contains('drafted-editor-active'));
  async function section(selector,active){await page.locator(selector).evaluate(el=>el.scrollIntoView({behavior:'instant'}));await page.waitForFunction(value=>document.documentElement.classList.contains('drafted-editor-active')===value,active);await page.waitForTimeout(250);assert.equal(await page.locator('.navbar').isVisible(),!active);assert.ok(await page.locator(selector).evaluate(el=>Math.abs(el.getBoundingClientRect().top-el.closest('.page-scroll').getBoundingClientRect().top)<2),'Stable section anchor');}
  for(let i=0;i<5;i++){await section('#section-input',false);await section('.hero-section',false);await section('.section-editor',true);}
  await page.locator('#editor-input').fill('Preserve this unsent instruction.');
  assert.equal(await page.locator('.workspace-print-help,#cv-design-note').count(),0);
  for(const design of ['classic_v1','compact_v1','editorial_v1']){
   await page.locator('#cv-design').selectOption(design);await page.waitForFunction(()=>!document.querySelector('.workspace-print-button').disabled);
   const before=await page.locator('.cv-page-content').allTextContents();
   for(const viewport of [{width:1920,height:1080},{width:1440,height:1000},{width:1366,height:768},{width:1024,height:600},{width:390,height:844},{width:320,height:640},{width:844,height:390}]){
    await page.setViewportSize(viewport);await page.waitForTimeout(250);
    assert.equal(await page.locator('.workspace-topbar #cv-design').count(),1);
    assert.equal(await page.locator('.workspace-topbar .workspace-preview-title').count(),1);
    const geometry=await page.evaluate(()=>{const r=document.querySelector('.editor-container').getBoundingClientRect(),pane=document.querySelector('.cv-document').getBoundingClientRect(),editor=document.querySelector('.chat-title').getBoundingClientRect(),input=document.querySelector('.chat-command-bar').getBoundingClientRect(),bar=document.querySelector('.workspace-topbar').getBoundingClientRect();return {bottom:r.bottom,inputBottom:input.bottom,top:document.querySelector('.page-scroll').getBoundingClientRect().top,alignment:Math.abs(pane.top-editor.top),barHeight:bar.height,paneHeight:pane.height};});
    if(design==='classic_v1')after[viewport.width]=await page.locator('.cv-document').boundingBox();
    assert.equal(geometry.top,0);assert.ok(geometry.bottom<=viewport.height+1);assert.ok(geometry.inputBottom<=viewport.height+1);assert.ok(geometry.paneHeight>35);assert.ok(geometry.barHeight<=58,'Single toolbar row');if(viewport.width>700)assert.ok(geometry.alignment<2,'Preview starts beside Editor heading');
    const more=page.getByRole('button',{name:'More actions',exact:true});
    if(viewport.width<=1280){await more.click();assert.equal(await page.getByRole('button',{name:'Export PDF (Classic)',exact:true}).isVisible(),true);assert.ok(await page.locator('.cv-tools').evaluate(el=>el.contains(document.activeElement)));await page.keyboard.press('Tab');await page.keyboard.press('Shift+Tab');await page.keyboard.press('Escape');assert.equal(await more.evaluate(el=>el===document.activeElement),true);assert.equal(await more.getAttribute('aria-expanded'),'false');assert.equal(await page.getByRole('button',{name:'Export PDF (Classic)',exact:true}).isVisible(),false,'Closed actions are hidden');}
    else assert.equal(await more.isVisible(),false);

    assert.equal(await page.locator('.cv-card > .workspace-design-controls').count(),0);
    const fits=async()=>page.locator('#cv-design,.workspace-print-button,.workspace-page-count,.workspace-expand-preview:not([hidden]),.workspace-close-preview:not([hidden])').evaluateAll(els=>els.every(el=>{const r=el.getBoundingClientRect();return r.width>0&&r.left>=0&&r.right<=innerWidth;}));
    assert.equal(await fits(),true,'Normal controls fit viewport');
    await page.getByRole('button',{name:'Expand preview',exact:true}).click();
    assert.equal(await page.locator('#cv-preview-dialog .workspace-preview-title #cv-design').count(),1);
    assert.equal(await fits(),true,'Expanded controls fit viewport');
    assert.deepEqual(await page.locator('.cv-page-content').allTextContents(),before);
    if(design==='classic_v1'&&viewport.width!==320)await page.screenshot({path:path.join(output,`expanded-${viewport.width}.png`)});
    const print=page.getByRole('button',{name:'Print / Save as PDF',exact:true});await print.click();
    await page.waitForFunction(()=>!document.querySelector('iframe[data-cv-print]')&&!document.querySelector('.workspace-print-button').disabled);
    assert.equal(await page.locator('.workspace-print-status').isVisible(),false);
    if(viewport.width===390)await page.keyboard.press('Escape');else await page.getByRole('button',{name:'Close',exact:true}).click();
    await page.waitForFunction(()=>!document.querySelector('#cv-preview-dialog').open);
    await page.locator('.workspace-topbar #cv-design').waitFor({state:'attached'});
    assert.equal(await page.locator('.workspace-topbar #cv-design').count(),1);
    assert.equal(await page.locator('.workspace-topbar .workspace-preview-title').count(),1);
    assert.equal(await page.locator('#cv-design').inputValue(),design);
    await page.waitForTimeout(200);assert.equal(await page.locator('.navbar').isVisible(),false,'Editor retains full height after modal/resize');assert.ok(await page.locator('.section-editor').evaluate(el=>Math.abs(el.getBoundingClientRect().top)<2),'Editor remains anchored');
    assert.equal(await page.locator('#editor-input').inputValue(),'Preserve this unsent instruction.');
    assert.deepEqual(await page.locator('.cv-page-content').allTextContents(),before);
    if(design==='classic_v1'&&viewport.width!==320)await page.screenshot({path:path.join(output,`after-${viewport.width}.png`)});
   }
  }
  assert.equal(await page.evaluate(()=>window.__toolbarPrintCalls),21);
  fs.writeFileSync(path.join(output,'results.json'),JSON.stringify({designs:3,viewports:7,printPreparationCalls:21,before,after,outsideRequests:outside,pageErrors:errors},null,2));
  assert.deepEqual(errors,[]);assert.deepEqual(outside,[]);
  console.log('Workspace height/toolbar PASS: no help/status clutter, topbar and modal-header controls fit 1440/390/320px, all three designs across seven viewports, header/section stability, print preparation/afterprint cleanup, Close/Escape, unchanged pages and unsent draft; no external calls. Native PDF saving not rerun for this UI-only change.');
 }finally{await browser.close();child.kill();}
})().catch(error=>{console.error(error);process.exitCode=1;});
