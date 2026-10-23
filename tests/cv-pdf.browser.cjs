'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),{spawn}=require('node:child_process'),fs=require('node:fs'),path=require('node:path');
const fixtures=require('./fixtures/cv-pdf.cjs'),{createHandler}=require('../backend/experience-discovery.cjs');
const designMode=process.env.DRAFTED_TEST_DESIGNS==='1',designs=require('../webflow/src/cv-document-designs.js');
const cases=designMode?designs.flatMap(design=>['short','long-special'].map(fixture=>({name:design.id+'-'+fixture,fixture,design:design.id}))):['short','multi','long-special','edited'].map(name=>({name,fixture:name,design:'classic_v1'}));
const root=path.resolve(__dirname,'..'),out=path.join(root,'output/pdf',designMode?'designs':''),proofRoot=path.join(root,'tmp/pdfs',designMode?'designs':'');
const sharedCss=fs.readFileSync(path.join(root,'webflow/src/css/components/cv-document-layout.css'),'utf8');
fs.mkdirSync(out,{recursive:true});fs.mkdirSync(proofRoot,{recursive:true});
(async()=>{
 const child=spawn(process.execPath,[path.join(root,'tools/serve-editor-preview.cjs')],{env:{...process.env,PORT:'0',DRAFTED_PREVIEW_CV:''},stdio:['ignore','pipe','pipe']});
 const base=await new Promise((resolve,reject)=>{let text='';const timer=setTimeout(()=>reject(Error('Preview startup timeout')),10000);child.stdout.on('data',data=>{text+=data;const match=text.match(/http:\/\/127\.0\.0\.1:\d+\//);if(match){clearTimeout(timer);resolve(match[0]);}});child.on('error',reject);});
 const browser=await chromium.launch({headless:true,channel:'msedge'}),results=[],outside=[],errors=[];
 try {
  for(const scenario of cases) {
   const {name,design}=scenario,fixture=structuredClone(fixtures[scenario.fixture]),dir=path.join(proofRoot,name);fs.mkdirSync(dir,{recursive:true});
   if(designMode&&scenario.fixture==='long-special')fixture.blocks[0].text+='\nRecently applied edit: presentation verification.';
   const page=await browser.newPage({viewport:{width:1440,height:1000}});
   page.on('pageerror',error=>errors.push(error.message));
   let exportCount=0,releaseFonts,releaseExport,holdExport=false,exportStarted,apiRequests=0;
   const fontGate=new Promise(resolve=>releaseFonts=resolve);
   if(scenario.fixture!=='short')releaseFonts();
   let exportGate,exportSeen;
   await page.route('**/*',async route=>{
    const request=route.request(),url=request.url();
    if(request.method()==='POST')apiRequests++;
    if(!url.startsWith(base)){outside.push(url);return route.abort();}
    if(url.endsWith('.ttf')){await fontGate;return route.continue();}
    if(url.endsWith('/preview-api/upload'))return route.fulfill({json:fixtures.envelope(scenario.fixture==='edited'?fixtures.short:fixtures[scenario.fixture])});
    if(url.endsWith('/webflow-experience-discovery')){const result=await createHandler({model:()=>({topics:[]})})(request.postDataJSON());return route.fulfill({status:result.status,json:result.body});}
    if(url.endsWith('/preview-api/rewrite'))return route.fulfill({json:fixtures.envelope(designMode?fixture:fixtures.edited)});
    if(url.endsWith('/preview-api/export')) {
     exportCount++;const payload=request.postDataJSON();
     assert.equal(payload.templateId,design);
     if(!holdExport)assert.deepEqual(payload.blocks,fixture.blocks,'Design must not change canonical content');
     if(holdExport){holdExport=false;exportStarted=payload;exportSeen();const response=await route.fetch();await exportGate;return route.fulfill({response});}
    }
    return route.continue();
   });
   await page.goto(base,{waitUntil:'domcontentloaded'});await page.getByRole('button',{name:'Try a synthetic CV and job ad',exact:true}).click();
   if(scenario.fixture==='short') {
    await page.waitForFunction(()=>document.querySelector('#editor-preview-text').dataset.layoutState==='loading');
    assert.equal(await page.getByRole('button',{name:'Export PDF',exact:true}).getAttribute('aria-disabled'),'true');assert.equal(exportCount,0);releaseFonts();
   }
   await page.waitForFunction(()=>document.querySelector('#editor-preview-text').dataset.layoutState==='ready'&&Number(document.querySelector('#editor-preview-text').dataset.pageCount)>0);
   if(designMode){
    const chooser=page.getByRole('combobox',{name:'CV design'});
    for(let wait=0;apiRequests<3&&wait<100;wait++)await page.waitForTimeout(50);
    assert.equal(apiRequests,3,'Initial upload, job context and local discovery plan settled');
    await page.locator('#editor-input').fill('Unsent instruction stays intact.');
    const beforeRequests=apiRequests;
    const counts=[];
    for(const item of designs){
     await chooser.selectOption(item.id);
     await page.waitForFunction(id=>document.querySelector('#editor-preview-text').dataset.cvDesign===id&&document.querySelector('#editor-preview-text').dataset.layoutState==='ready',item.id);
     const source=await page.locator('#editor-preview-text [data-cv-source]').evaluateAll(els=>Object.fromEntries([...new Set(els.map(el=>el.dataset.cvSource))].map(id=>[id,els.filter(el=>el.dataset.cvSource===id).map(el=>el.textContent).join('')])));
     for(const block of fixtures[scenario.fixture].blocks)assert.equal(source[block.blockId],block.text);
     assert.equal(await page.locator('#editor-input').inputValue(),'Unsent instruction stays intact.');
     const count=Number(await page.locator('#editor-preview-text').getAttribute('data-page-count'));counts.push(count);
     assert.equal(await page.locator('.workspace-page-count').textContent(),`${count} ${count===1?'page':'pages'}`);
    }
    // Exercise the native keyboard control, then restore the intended variant.
    await chooser.focus();await chooser.press('Home');await chooser.press('ArrowDown');await chooser.press('Enter');
    assert.equal(await chooser.inputValue(),'compact_v1');
    await chooser.selectOption(design);
    await page.waitForFunction(id=>document.querySelector('#editor-preview-text').dataset.cvDesign===id&&document.querySelector('#editor-preview-text').dataset.layoutState==='ready',design);
    await page.waitForTimeout(100);assert.equal(apiRequests,beforeRequests,'Design switches cannot trigger discovery, tailoring or proposals');
    await page.getByRole('button',{name:'Experience questions',exact:true}).click();
    await page.getByRole('button',{name:'Chat',exact:true}).click();
    assert.equal(await chooser.inputValue(),design,'Design survives editor view changes');
    assert.equal(await page.locator('#editor-input').inputValue(),'Unsent instruction stays intact.');
    if(scenario.fixture==='long-special')assert.ok(new Set(counts).size>1,'Long fixture demonstrates real design-dependent counts');
    await page.locator('#editor-input').fill('');
    if(scenario.fixture==='long-special'){
     await page.getByRole('button',{name:'Use full CV',exact:true}).click();await page.locator('#editor-input').fill('Apply the synthetic revised CV.');await page.locator('#editor-send').click();
     await page.waitForFunction(()=>document.querySelector('#editor-preview-text').textContent.includes('Recently applied edit:'));
     assert.equal(await chooser.inputValue(),design,'Design survives Apply');
     assert.equal(await page.locator('#editor-preview-text').getAttribute('data-cv-design'),design);
    }
    // Keep a selection while changing presentation; every fragment stays selected.
    await page.locator('.cv-block[data-block-id="experience-1"]').first().click();
    for(const item of designs){await chooser.selectOption(item.id);await page.waitForFunction(id=>document.querySelector('#editor-preview-text').dataset.cvDesign===id&&document.querySelector('#editor-preview-text').dataset.layoutState==='ready',item.id);assert.equal(await page.locator('.cv-block[data-block-id="experience-1"].is-selected').count(),await page.locator('.cv-block[data-block-id="experience-1"]').count());}
    await chooser.selectOption(design);await page.waitForFunction(id=>document.querySelector('#editor-preview-text').dataset.cvDesign===id&&document.querySelector('#editor-preview-text').dataset.layoutState==='ready',design);await page.getByRole('button',{name:'Clear',exact:true}).click();
    if(scenario.fixture==='short'){
     holdExport=true;exportGate=new Promise(resolve=>releaseExport=resolve);const started=new Promise(resolve=>exportSeen=resolve);
     let downloads=0;const observed=()=>downloads++;page.on('download',observed);
     await page.getByRole('button',{name:'Export PDF',exact:true}).click();await started;
     await chooser.selectOption(designs.find(item=>item.id!==design).id);
     await page.waitForFunction(()=>document.querySelector('#editor-preview-text').dataset.layoutState==='ready');
     const dialog=page.waitForEvent('dialog');releaseExport();const notice=await dialog;assert.match(notice.message(),/different design/);await notice.dismiss();
     await page.waitForFunction(()=>!window.__DRAFTED_EXPORT__.inFlight);assert.equal(downloads,0);page.off('download',observed);
     await chooser.selectOption(design);await page.waitForFunction(id=>document.querySelector('#editor-preview-text').dataset.cvDesign===id&&document.querySelector('#editor-preview-text').dataset.layoutState==='ready',design);
    }
   }
   if(name==='edited') {
    // Hold an old result while an approved edit changes the visible version.
    holdExport=true;exportGate=new Promise(resolve=>releaseExport=resolve);
    const started=new Promise(resolve=>exportSeen=resolve);let downloads=0;page.on('download',()=>downloads++);
    await page.getByRole('button',{name:'Export PDF',exact:true}).click();await started;
    assert.deepEqual(exportStarted.blocks,fixtures.short.blocks);
    await page.getByRole('button',{name:'Use full CV',exact:true}).click();await page.locator('#editor-input').fill('Apply the synthetic revised CV.');await page.locator('#editor-send').click();
    await page.waitForFunction(()=>document.querySelector('#editor-preview-text').textContent.includes('Recently applied edit:'));
    const dialog=page.waitForEvent('dialog');releaseExport();const notice=await dialog;
    assert.match(notice.message(),/CV changed/);await notice.dismiss();assert.equal(downloads,0,'Old PDF cannot be downloaded after a newer edit');
    await page.waitForFunction(()=>!window.__DRAFTED_EXPORT__.inFlight);
   }
   const snapshot=await page.evaluate(()=>[...document.querySelectorAll('#editor-preview-text .cv-page')].map(page=>{
    const content=page.firstElementChild,items=[...page.querySelectorAll('h1,h2,h3,p,li')],bounds=content.getBoundingClientRect();
    if(!items.length||items.some(el=>el.getBoundingClientRect().bottom>bounds.bottom+.5||el.getBoundingClientRect().right>bounds.right+.5))throw Error('Clipped or empty document page');
    if(items.at(-1).matches('h1,h2,h3,.cv-entry-meta'))throw Error('Orphaned document heading');
    const clone=page.cloneNode(true);clone.style.transform='none';clone.querySelectorAll('.is-selected').forEach(el=>el.classList.remove('is-selected'));
    const origin=page.getBoundingClientRect(),scale=origin.width/parseFloat(getComputedStyle(page).width);
    const geometry=[...page.querySelectorAll('h1,h2,h3,p,li,.cv-page-number')].map(el=>{const r=el.getBoundingClientRect(),style=getComputedStyle(el);return {left:(r.left-origin.left)/scale,top:(r.top-origin.top)/scale,width:r.width/scale,height:r.height/scale,font:style.font,spacing:style.letterSpacing};});
    return {html:clone.outerHTML,text:page.innerText,content:page.firstElementChild.innerText,geometry};
   }));
   const source=await page.evaluate(()=>{const elements=[...document.querySelectorAll('#editor-preview-text [data-cv-source]')];return Object.fromEntries([...new Set(elements.map(el=>el.dataset.cvSource))].map(id=>[id,elements.filter(el=>el.dataset.cvSource===id).map(el=>el.textContent).join('')]));});
   for(const b of fixture.blocks)assert.equal(source[b.blockId],b.text,'Complete source retained in preview');
   // Capture the actual preview DOM at its physical scale, without editor clipping.
   const proof=await browser.newPage({viewport:{width:1000,height:1300},deviceScaleFactor:1});
   await proof.route('**/*',route=>route.request().url().startsWith(base)?route.continue():route.abort());
   await proof.goto(base);
   for(let i=0;i<snapshot.length;i++) {
    await proof.setContent(`<!doctype html><base href="${base}"><style>${sharedCss}</style><body style="margin:0"><main id="editor-preview-text" class="cv-layout" data-cv-design="${design}" style="width:210mm"><div class="cv-page-slot" style="width:210mm;height:297mm">${snapshot[i].html}</div></main></body>`);
    await proof.evaluate(async()=>{await document.fonts.load('14px "Drafted Sans"');await document.fonts.load('700 14px "Drafted Sans"');await document.fonts.ready;});
    const measured=await proof.locator('.cv-page').evaluate(page=>{const origin=page.getBoundingClientRect();return [...page.querySelectorAll('h1,h2,h3,p,li,.cv-page-number')].map(el=>{const r=el.getBoundingClientRect(),style=getComputedStyle(el);return {left:r.left-origin.left,top:r.top-origin.top,width:r.width,height:r.height,font:style.font,spacing:style.letterSpacing};});});
    assert.equal(measured.length,snapshot[i].geometry.length);
    for(let j=0;j<measured.length;j++){
     assert.equal(measured[j].font,snapshot[i].geometry[j].font,'Proof must use the actual preview font');
     assert.equal(measured[j].spacing,snapshot[i].geometry[j].spacing);
     for(const key of ['left','top','width','height'])assert.ok(Math.abs(measured[j][key]-snapshot[i].geometry[j][key])<.08,`Unscaled proof differs from actual preview: ${name}/${i+1}/${j}/${key}`);
    }
    await proof.locator('.cv-page').screenshot({path:path.join(dir,`preview-${i+1}.png`)});
   }
   await proof.close();
   const outputs=[];
   for(const viewport of [{width:1440,height:1000},{width:390,height:844}]) {
    await page.setViewportSize(viewport);await page.waitForTimeout(80);
    const signature=await page.locator('.cv-page').evaluateAll(pages=>pages.map(p=>p.innerText));assert.deepEqual(signature,snapshot.map(p=>p.text));
    const bodySize=await page.locator('#editor-preview-text .cv-block-body').first().evaluate(el=>parseFloat(getComputedStyle(el).fontSize));assert.ok(Math.abs(bodySize-(design==='compact_v1'?40/3:14))<.01,'Fixed readable text size');
    if(designMode){const box=await page.locator('#cv-design').boundingBox();assert.ok(box.x>=0&&box.x+box.width<=viewport.width,'Chooser fits small screens');}
    const download=page.waitForEvent('download',{timeout:30000});await page.getByRole('button',{name:'Export PDF',exact:true}).click();
    const file=viewport.width===1440?path.join(out,name+'.pdf'):path.join(dir,'mobile.pdf');await(await download).saveAs(file);outputs.push(file);
    assert.deepEqual(await page.locator('.cv-page').evaluateAll(pages=>pages.map(p=>p.innerText)),signature,'Export cannot mutate preview');
   }
   const selected=page.locator('.cv-block[data-block-id="experience-1"]');await selected.first().click();assert.equal(await page.locator('.cv-block[data-block-id="experience-1"].is-selected').count(),await selected.count());await page.getByRole('button',{name:'Clear',exact:true}).click();
   await page.locator('.cv-document').evaluate(el=>el.scrollTo({top:0,behavior:'instant'}));const pane=await page.locator('.cv-document').boundingBox();await page.mouse.move(pane.x+pane.width/2,pane.y+Math.min(80,pane.height/2));await page.mouse.wheel(0,250);await page.waitForFunction(()=>document.querySelector('.cv-document').scrollTop>0);
   fs.writeFileSync(path.join(dir,'preview.json'),JSON.stringify({name,fixture:scenario.fixture,design,pages:snapshot.map(({text,content})=>({text,content})),outputs,browserVersion:browser.version(),fontFiles:['LiberationSans-Regular.ttf','LiberationSans-Bold.ttf'],proofMatchesActualPreviewGeometry:true,exportCount},null,2));
   results.push({fixture:name,pages:snapshot.length,outputs,viewports:2,staleExportBlocked:name==='edited'||(designMode&&scenario.fixture==='short'),designChecks:designMode});await page.close();
  }
  assert.deepEqual(errors,[]);assert.deepEqual(outside,[]);
  const status=await(await browser.newPage()).request.get(base+'preview-status');assert.equal((await status.json()).externalModelCalls,0);
  fs.writeFileSync(path.join(proofRoot,'browser-results.json'),JSON.stringify({results,externalRequests:outside.length,pageErrors:errors,browserVersion:browser.version()},null,2));
  console.log('Real PDF export browser PASS',JSON.stringify(results));
 } finally {await browser.close();child.kill();}
})().catch(error=>{console.error(error);process.exitCode=1;});
