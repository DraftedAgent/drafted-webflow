'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..'),out=path.join(root,'output/pdf/workspace-layout');
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const server=spawn(process.execPath,[path.join(root,'tools/serve-standalone.cjs')],{env:{...process.env,PORT:'0'},stdio:['ignore','pipe','pipe']});
 const base=await new Promise(r=>server.stdout.on('data',s=>{const m=String(s).match(/http:\/\/127\.0\.0\.1:\d+\//);if(m)r(m[0]);}));
 const browser=await chromium.launch({headless:true,channel:'msedge'}),results=[];
 try{for(const viewport of [{width:1440,height:900},{width:1280,height:720},{width:390,height:844}]){
  const context=await browser.newContext({viewport}),page=await context.newPage(),outside=[],errors=[];page.setDefaultTimeout(15000);
  await context.route('**/*',r=>{if(!r.request().url().startsWith(base)){outside.push(r.request().url());return r.abort();}return r.continue();});
  page.on('pageerror',e=>errors.push(e.message));
  const boot=()=>page.waitForFunction(()=>typeof workspacePages!=='undefined'&&workspacePages&&!workspacePages.restoring());
  const ready=()=>page.waitForFunction(()=>document.querySelector('#editor-preview-text').dataset.layoutState==='ready');
  await page.goto(base);await boot();await page.waitForTimeout(2200);
  assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).scrollSnapType),'y mandatory');
  await page.mouse.move(10,viewport.height/2);await page.mouse.wheel(0,viewport.height*.75);await page.waitForTimeout(900);
  assert(Math.abs(await page.locator('#section-input').evaluate(n=>n.getBoundingClientRect().top))<2,'Wheel snaps to setup');
  await page.mouse.wheel(0,-viewport.height*.75);await page.waitForTimeout(900);assert((await page.evaluate(()=>scrollY))<2,'Wheel snaps back to hero');
  await page.locator('.drafted-hero-action').click();await page.waitForTimeout(200);
  await page.locator('#cv-file').setInputFiles({name:'Layout.pdf',mimeType:'application/pdf',buffer:Buffer.from(require('./fixtures/source-pdf.js').create({pages:2}))});
  await page.waitForFunction(()=>document.querySelector('#cv-preview').dataset.pageCount==='2');
  if(viewport.width>800){const sizes=await page.evaluate(()=>({left:document.querySelector('.input-left').getBoundingClientRect().height,right:document.querySelector('.input-right').getBoundingClientRect().height}));assert(sizes.right>=sizes.left-1);}
  await page.locator('#section-input').screenshot({path:path.join(out,`setup-${viewport.width}.png`)});
  await page.getByRole('button',{name:'Enlarge CV preview'}).click();await page.locator('.preparation-pdf-dialog[open]').waitFor();await page.keyboard.press('Escape');
  await page.locator('#upload-btn').click();await page.waitForURL('**/editor');await ready();
  assert.equal(await page.locator('#drafted-environment').isVisible(),false);
  assert.equal(await page.locator('.page-scroll').evaluate(n=>n.getBoundingClientRect().top),0);
  assert((await page.locator('.workspace-preview-title').boundingBox()).height<95,'Toolbar stays compact');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.getByRole('button',{name:'Use full CV',exact:true}).click();
  assert.equal(await page.locator('.cv-document-inner').evaluate(n=>n.classList.contains('is-scope-full')),true);
  const blocks=page.locator('#editor-preview-text .cv-block');await blocks.nth(0).click();await blocks.nth(1).click({modifiers:['Control']});
  assert.equal(await page.locator('#editor-preview-text .cv-block.is-selected').count(),2);
  const initial=await page.evaluate(()=>({cv:captureWorkspace().cv,geometry:[...document.querySelectorAll('#editor-preview-text .cv-page')].map(n=>({w:n.offsetWidth,h:n.offsetHeight,text:n.textContent}))}));
  const divider=page.getByRole('separator',{name:'Resize conversation and CV preview'});
  if(viewport.width>800){
   const box=await divider.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+50);await page.mouse.down();await page.mouse.move(viewport.width-5,box.y+50,{steps:8});await page.mouse.up();
   const rightWidth=await page.locator('.editor-right').evaluate(n=>n.getBoundingClientRect().width);assert(rightWidth>=360);
   await divider.press('Home');assert((await page.locator('.editor-left').boundingBox()).width>=280);
   await divider.press('ArrowRight');const width=await page.locator('.editor-left').evaluate(n=>n.getBoundingClientRect().width);
   await page.reload();await boot();await ready();assert(Math.abs((await page.locator('.editor-left').boundingBox()).width-width)<2);
   await divider.dblclick();
  }else assert.equal(await divider.isVisible(),false);
  assert.equal(await page.locator('#editor-preview-text .cv-block.is-selected').count(),2,'Resize preserves multiselection');
  await page.getByRole('button',{name:'Original',exact:true}).click();await ready();await page.getByRole('button',{name:'Edited',exact:true}).click();await ready();
  await page.locator('.workspace-zoom-plus').click();await page.locator('.workspace-zoom-fit').click();
  await page.getByRole('button',{name:'Expand preview',exact:true}).click();await page.locator('#cv-preview-dialog[open]').waitFor();await page.getByRole('button',{name:'Close',exact:true}).click();await page.waitForTimeout(100);
  const final=await page.evaluate(()=>({cv:captureWorkspace().cv,geometry:[...document.querySelectorAll('#editor-preview-text .cv-page')].map(n=>({w:n.offsetWidth,h:n.offsetHeight,text:n.textContent}))}));assert.deepEqual(final,initial,'Chrome changes preserve canonical CV and page geometry');
  const tools=await page.locator('.workspace-preview-primary').evaluate(n=>({width:n.clientWidth,scroll:n.scrollWidth}));assert(tools.scroll<=tools.width+1,'Primary toolbar does not overflow');
  await page.locator('.cv-document').evaluate(n=>n.scrollTop=0);await page.evaluate(()=>document.activeElement?.blur());await page.mouse.move(2,viewport.height-2);
  await page.screenshot({path:path.join(out,`editor-${viewport.width}.png`)});
  // Exercise the actual print preparation without opening native print or sending a request.
  const print=await page.evaluate(async()=>{const host=document.querySelector('#editor-preview-text'),frame=await DraftedCvBrowserPrint.prepare(host,'Layout',document.querySelector('link[href*="drafted-editor.css"]').href);const result={pages:Number(frame.dataset.pageCount),divider:frame.contentDocument.querySelector('.workspace-divider')!==null,geometry:[...frame.contentDocument.querySelectorAll('.cv-page')].map(n=>({w:n.offsetWidth,h:n.offsetHeight,text:n.textContent}))};frame.remove();return result;});
  assert.equal(print.divider,false);assert.deepEqual(print.geometry,initial.geometry);
  if(viewport.width<801){
   await page.locator('#editor-input').focus();await page.setViewportSize({width:viewport.width,height:420});
   await page.waitForFunction(()=>document.documentElement.dataset.workspaceKeyboard==='true');
   assert.equal(await page.locator('.editor-right').isVisible(),false);
   const send=await page.locator('#editor-chat-send').boundingBox();assert(send.y+send.height<=420);
   await page.evaluate(()=>document.activeElement.blur());await page.setViewportSize(viewport);
  }
  await page.getByRole('link',{name:'Back to setup'}).click();await page.waitForTimeout(200);assert(Math.abs(await page.locator('#section-input').evaluate(n=>n.getBoundingClientRect().top))<2);
  await page.reload();await boot();assert((await page.evaluate(()=>scrollY))<2);
  assert.deepEqual(errors,[]);assert.deepEqual(outside,[]);results.push({...viewport,printPages:print.pages,passed:true});await context.close();
 }
 fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify({results,realBackendRequests:0},null,2));console.log(JSON.stringify(results));
 }finally{await browser.close();server.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
