'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),{spawn}=require('node:child_process'),fs=require('node:fs'),path=require('node:path');
const fixtures=require('./fixtures/cv-pdf.cjs'),designs=require('../webflow/src/cv-document-designs.js'),{createHandler}=require('../backend/experience-discovery.cjs');
const root=path.resolve(__dirname,'..'),proof=path.join(root,'output/pdf/preview-overlay');fs.mkdirSync(proof,{recursive:true});
(async()=>{
 const server=spawn(process.execPath,[path.join(root,'tools/serve-editor-preview.cjs')],{env:{...process.env,PORT:'0'},stdio:['ignore','pipe','pipe']});
 const base=await new Promise((resolve,reject)=>{let output='';const timer=setTimeout(()=>reject(Error('Startup timeout')),10000);server.stdout.on('data',data=>{output+=data;const match=output.match(/http:\/\/127\.0\.0\.1:\d+\//);if(match){clearTimeout(timer);resolve(match[0]);}});server.on('error',reject);});
 const browser=await chromium.launch({headless:true,channel:'msedge'}),results=[],errors=[],outside=[];
 try{
  for(const fixtureName of ['short','long-special']){
   const original=fixtures[fixtureName],edited=structuredClone(original);edited.blocks[0].text+='\nApplied overlay verification.';
   const page=await browser.newPage({viewport:{width:1440,height:1000}});let requests=0,releaseFonts,payload;
   page.on('pageerror',e=>errors.push(e.message));const fontGate=new Promise(resolve=>releaseFonts=resolve);
   await page.route('**/*',async route=>{
    const req=route.request(),url=req.url();if(!url.startsWith(base)){outside.push(url);return route.abort();}
    if(req.method()==='POST')requests++;
    if(url.endsWith('.ttf')){await fontGate;return route.continue();}
    if(url.endsWith('/preview-api/upload'))return route.fulfill({json:fixtures.envelope(original)});
    if(url.endsWith('/webflow-experience-discovery')){const result=await createHandler({model:()=>({topics:[]})})(req.postDataJSON());return route.fulfill({status:result.status,json:result.body});}
    if(url.endsWith('/preview-api/chat'))return route.fulfill({json:{ok:true,message:'Synthetic history stays available.'}});
    if(url.endsWith('/preview-api/rewrite'))return route.fulfill({json:fixtures.envelope(edited)});
    if(url.endsWith('/preview-api/export')){payload=req.postDataJSON();return route.fulfill({contentType:'application/pdf',body:'%PDF-1.4\n% transport-only fixture\n%%EOF'});}
    return route.continue();
   });
   await page.goto(base,{waitUntil:'domcontentloaded'});await page.getByRole('button',{name:'Try a synthetic CV and job ad',exact:true}).click();
   await page.waitForFunction(()=>document.querySelector('#editor-preview-text').dataset.layoutState==='loading');
   assert.equal(await page.getByRole('button',{name:'Expand preview',exact:true}).isDisabled(),true);
   assert.equal(await page.locator('.workspace-page-count').textContent(),'Updating pages…');
   assert.equal(await page.getByRole('button',{name:'Export PDF',exact:true}).getAttribute('aria-disabled'),'true');
   releaseFonts();await page.waitForFunction(()=>Number(document.querySelector('#editor-preview-text').dataset.pageCount)>0);
   await page.locator('#editor-input').fill('Keep this synthetic history.');await page.locator('#editor-chat-send').click();await page.getByText('Synthetic history stays available.',{exact:true}).waitFor();
   await page.getByRole('button',{name:'Use full CV',exact:true}).click();await page.locator('#editor-input').fill('Apply the synthetic edit.');await page.locator('#editor-send').click();await page.waitForFunction(()=>document.querySelector('#editor-preview-text').textContent.includes('Applied overlay verification.'));
   await page.locator('#editor-input').fill('Unsent draft stays intact.');
   const history=await page.locator('.chat-messages > .chat-message').allTextContents();assert.ok(history.some(text=>text.includes('Synthetic history stays available.')));
   await page.waitForTimeout(900);
   await page.evaluate(()=>{window.__layoutRenderCalls=0;const render=DraftedCvLayout.render;DraftedCvLayout.render=(...args)=>{window.__layoutRenderCalls++;return render(...args);};});
   for(const design of designs){
    const pending=await page.evaluate(id=>{const select=document.querySelector('#cv-design');select.value=id;select.dispatchEvent(new Event('change',{bubbles:true}));return {counter:document.querySelector('.workspace-page-count').textContent,state:document.querySelector('#editor-preview-text').dataset.layoutState,count:document.querySelector('#editor-preview-text').dataset.pageCount,exportDisabled:document.querySelector('[aria-label="Export PDF"]').getAttribute('aria-disabled')};},design.id);
    assert.equal(pending.counter,'Updating pages…');assert.equal(pending.state,'loading');assert.equal(pending.count,undefined);assert.equal(pending.exportDisabled,'true');
    await page.waitForFunction(id=>document.querySelector('#editor-preview-text').dataset.cvDesign===id&&document.querySelector('#editor-preview-text').dataset.layoutState==='ready',design.id);
    await page.getByRole('button',{name:'Experience questions',exact:true}).click();await page.getByRole('button',{name:'Chat',exact:true}).click();assert.equal(await page.locator('#cv-design').inputValue(),design.id);
    const signature=await page.locator('.cv-page').allTextContents();
    for(const viewport of [{width:1440,height:1000},{width:1024,height:600},{width:390,height:844},{width:320,height:640},{width:844,height:390}]){
     await page.setViewportSize(viewport);await page.waitForTimeout(70);
     const pane=page.locator('.cv-document');await pane.evaluate(el=>el.scrollTop=Math.min(240,el.scrollHeight-el.clientHeight));
     const top=await pane.evaluate(el=>el.scrollTop),beforeRequests=requests,renderCalls=await page.evaluate(()=>window.__layoutRenderCalls);
     await page.evaluate(()=>{window.__livePreview=document.querySelector('#editor-preview-text');window.__livePages=[...document.querySelectorAll('.cv-page')];});
     const expand=page.getByRole('button',{name:'Expand preview',exact:true});await expand.focus();await expand.press('Enter');
     const dialog=page.getByRole('dialog',{name:'CV preview',exact:true});await dialog.waitFor({state:'visible'});
     assert.equal(await page.getByRole('button',{name:'Close',exact:true}).evaluate(el=>el===document.activeElement),true);
     assert.equal(await page.evaluate(()=>{document.querySelector('[aria-label="Export PDF"]').focus();return !!document.activeElement.closest('dialog[open]');}),true,'Background controls stay inert');
     assert.equal(await page.evaluate(()=>window.__livePreview===document.querySelector('#editor-preview-text')&&window.__livePages.every((el,i)=>el===document.querySelectorAll('.cv-page')[i])),true);
     assert.deepEqual(await page.locator('.cv-page').allTextContents(),signature);
     assert.equal(await page.evaluate(()=>window.__layoutRenderCalls),renderCalls,'Expand cannot paginate');
     const bounds=await dialog.boundingBox();assert.ok(bounds.x>=0&&bounds.y>=0&&bounds.x+bounds.width<=viewport.width+1&&bounds.y+bounds.height<=viewport.height+1,'Dialog fits viewport');
     if(viewport.width===390){await page.setViewportSize({width:844,height:390});await page.waitForTimeout(70);const rotated=await dialog.boundingBox();assert.ok(rotated.y>=0&&rotated.y+rotated.height<=391);assert.deepEqual(await page.locator('.cv-page').allTextContents(),signature);await page.setViewportSize(viewport);await page.waitForTimeout(70);}
     await page.getByRole('button',{name:'Close',exact:true}).press('Shift+Tab');assert.equal(await page.evaluate(()=>!!document.activeElement.closest('dialog[open]')),true);
     for(let i=0;i<5;i++){await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>!!document.activeElement.closest('dialog[open]')),true,'Focus remains in modal');}
     // Keyboard scrolling and normal fragment clicks work on the same live pane.
     await pane.focus();const scrollBefore=await pane.evaluate(el=>el.scrollTop);await page.keyboard.press('PageDown');await page.waitForTimeout(100);assert.ok(await pane.evaluate(el=>el.scrollTop)>=scrollBefore);
     if(fixtureName==='long-special'){await pane.evaluate(el=>el.scrollTop=0);const box=await pane.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+80);await page.mouse.wheel(0,240);await page.waitForFunction(()=>document.querySelector('.cv-document').scrollTop>0);}
     const block=page.locator('.cv-block[data-block-id="experience-1"]').first();if(await block.evaluate(el=>el.classList.contains('is-selected')))await block.click();await block.click();assert.equal(await page.locator('.cv-block[data-block-id="experience-1"].is-selected').count(),await page.locator('.cv-block[data-block-id="experience-1"]').count());
     if(viewport.width===1440)await dialog.screenshot({path:path.join(proof,`${fixtureName}-${design.id}-expanded.png`)});
     if(viewport.width===390)await page.screenshot({path:path.join(proof,`${fixtureName}-${design.id}-mobile.png`)});
     await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('#cv-preview-dialog').open&&document.activeElement.classList.contains('workspace-expand-preview'));
     assert.ok(Math.abs(await pane.evaluate(el=>el.scrollTop)-top)<=1,'Original scroll position restored');
     assert.equal(await page.evaluate(()=>window.__layoutRenderCalls),renderCalls);assert.equal(await page.locator('#cv-design').inputValue(),design.id);assert.deepEqual(await page.locator('.cv-page').allTextContents(),signature);
     await expand.click();await page.getByRole('button',{name:'Close',exact:true}).click();await page.waitForFunction(()=>document.activeElement.classList.contains('workspace-expand-preview'));
     assert.ok(Math.abs(await pane.evaluate(el=>el.scrollTop)-top)<=1);assert.equal(requests,beforeRequests,'Viewer actions cannot call APIs');
     assert.equal(await page.locator('#editor-input').inputValue(),'Unsent draft stays intact.');assert.deepEqual(await page.locator('.chat-messages > .chat-message').allTextContents(),history);
     const source=await page.locator('[data-cv-source]').evaluateAll(els=>Object.fromEntries([...new Set(els.map(e=>e.dataset.cvSource))].map(id=>[id,els.filter(e=>e.dataset.cvSource===id).map(e=>e.textContent).join('')])));for(const b of edited.blocks)assert.equal(source[b.blockId],b.text);
    }
    // Selection inside the overlay updates this same design control and persists on return.
    await page.getByRole('button',{name:'Expand preview',exact:true}).click();const alternate=designs.find(item=>item.id!==design.id);
    await page.locator('#cv-design').selectOption(alternate.id);await page.waitForFunction(id=>document.querySelector('#editor-preview-text').dataset.cvDesign===id&&document.querySelector('#editor-preview-text').dataset.layoutState==='ready',alternate.id);
    await page.getByRole('button',{name:'Close',exact:true}).click();await page.waitForFunction(()=>document.activeElement.classList.contains('workspace-expand-preview'));assert.equal(await page.locator('#cv-design').inputValue(),alternate.id);
    await page.locator('#cv-design').selectOption(design.id);await page.waitForFunction(id=>document.querySelector('#editor-preview-text').dataset.cvDesign===id&&document.querySelector('#editor-preview-text').dataset.layoutState==='ready',design.id);
    await page.setViewportSize({width:1440,height:1000});const download=page.waitForEvent('download');await page.getByRole('button',{name:'Export PDF',exact:true}).click();await download;assert.equal(payload.templateId,design.id);assert.deepEqual(payload.blocks,edited.blocks);
    results.push({fixture:fixtureName,design:design.id,pages:signature.length,viewports:5,sameDom:true,noRepagination:true,scrollAndFocusRestored:true,historyAndSourcePreserved:true,exportPayloadPreserved:true});
   }
   await page.close();
  }
  assert.deepEqual(errors,[]);assert.deepEqual(outside,[]);fs.writeFileSync(path.join(proof,'verification.json'),JSON.stringify({results,errors,externalRequests:outside.length,exportVerification:'Transport fixture only; shared PDF layout unchanged from prior real-PDF verification.'},null,2));console.log('Preview overlay PASS',JSON.stringify(results));
 }finally{await browser.close();server.kill();}
})().catch(error=>{console.error(error);process.exitCode=1;});
