'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),{spawn}=require('node:child_process'),path=require('node:path'),os=require('node:os');
(async()=>{
 const child=spawn(process.execPath,[path.resolve(__dirname,'../tools/serve-editor-preview.cjs')],{env:{...process.env,PORT:'0',DRAFTED_PREVIEW_PDF_CASE:'long-special'},stdio:['ignore','pipe','pipe']});
 const base=await new Promise((resolve,reject)=>{let output='';const timer=setTimeout(()=>reject(Error('Preview startup timeout')),10000);child.stdout.on('data',data=>{output+=data;const match=output.match(/http:\/\/127\.0\.0\.1:\d+\//);if(match){clearTimeout(timer);resolve(match[0]);}});child.on('error',reject);});
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],outside=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/*',route=>route.request().url().startsWith(base)?route.continue():(outside.push(route.request().url()),route.abort()));
  await page.addInitScript(()=>{window.print=()=>{window.parent.__toolbarPrintCalls=(window.parent.__toolbarPrintCalls||0)+1;window.dispatchEvent(new Event('afterprint'));};});
  await page.goto(base+'?sample=1');await page.waitForFunction(()=>document.querySelector('.workspace-print-button')?.disabled===false);
  await page.locator('#editor-input').fill('Preserve this unsent instruction.');
  assert.equal(await page.locator('.workspace-print-help,#cv-design-note').count(),0);
  for(const design of ['classic_v1','compact_v1','editorial_v1']){
   await page.locator('#cv-design').selectOption(design);await page.waitForFunction(()=>!document.querySelector('.workspace-print-button').disabled);
   const before=await page.locator('.cv-page-content').allTextContents();
   for(const viewport of [{width:1440,height:1000},{width:390,height:844},{width:320,height:640}]){
    await page.setViewportSize(viewport);await page.waitForTimeout(100);
    assert.equal(await page.locator('.workspace-topbar #cv-design').count(),1);
    assert.equal(await page.locator('.cv-card > .workspace-design-controls').count(),0);
    const fits=async()=>page.locator('#cv-design,.workspace-print-button,.workspace-page-count,.workspace-expand-preview:not([hidden]),.workspace-close-preview:not([hidden])').evaluateAll(els=>els.every(el=>{const r=el.getBoundingClientRect();return r.width>0&&r.left>=0&&r.right<=innerWidth;}));
    assert.equal(await fits(),true,'Normal controls fit viewport');
    await page.getByRole('button',{name:'Expand preview',exact:true}).click();
    assert.equal(await page.locator('#cv-preview-dialog .workspace-preview-title #cv-design').count(),1);
    assert.equal(await fits(),true,'Expanded controls fit viewport');
    assert.deepEqual(await page.locator('.cv-page-content').allTextContents(),before);
    if(design==='classic_v1'&&viewport.width!==320)await page.screenshot({path:path.join(os.tmpdir(),`drafted-clean-preview-expanded-${viewport.width}.png`)});
    const print=page.getByRole('button',{name:'Print / Save as PDF',exact:true});await print.click();
    await page.waitForFunction(()=>!document.querySelector('iframe[data-cv-print]')&&!document.querySelector('.workspace-print-button').disabled);
    assert.equal(await page.locator('.workspace-print-status').isVisible(),false);
    if(viewport.width===390)await page.keyboard.press('Escape');else await page.getByRole('button',{name:'Close',exact:true}).click();
    await page.waitForFunction(()=>!document.querySelector('#cv-preview-dialog').open);
    await page.locator('.workspace-topbar #cv-design').waitFor({state:'attached'});
    assert.equal(await page.locator('.workspace-topbar #cv-design').count(),1);
    assert.equal(await page.locator('#cv-design').inputValue(),design);
    assert.equal(await page.locator('#editor-input').inputValue(),'Preserve this unsent instruction.');
    assert.deepEqual(await page.locator('.cv-page-content').allTextContents(),before);
    if(design==='classic_v1'&&viewport.width!==320)await page.screenshot({path:path.join(os.tmpdir(),`drafted-clean-preview-${viewport.width}.png`)});
   }
  }
  assert.equal(await page.evaluate(()=>window.__toolbarPrintCalls),9);
  assert.deepEqual(errors,[]);assert.deepEqual(outside,[]);
  console.log('Preview toolbar PASS: no help/status clutter, topbar and modal-header controls fit 1440/390/320px, all three designs, print preparation/afterprint cleanup, Close/Escape, unchanged pages and unsent draft; no external calls. Native PDF saving not rerun for this UI-only change.');
 }finally{await browser.close();child.kill();}
})().catch(error=>{console.error(error);process.exitCode=1;});
