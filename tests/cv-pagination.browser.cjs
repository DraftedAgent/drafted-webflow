'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),{spawn}=require('node:child_process'),path=require('node:path'),os=require('node:os'),fs=require('node:fs');
const fixtures=require('./fixtures/cv-pagination.cjs');
(async()=>{
 const child=spawn(process.execPath,[path.resolve(__dirname,'../tools/serve-editor-preview.cjs')],{env:{...process.env,PORT:'0',DRAFTED_REWRITE_TEST_APPROVAL:''},stdio:['ignore','pipe','pipe']});
 const base=await new Promise((resolve,reject)=>{let out='';const timer=setTimeout(()=>reject(Error('Server startup timeout')),10000);child.stdout.on('data',s=>{out+=s;const m=out.match(/http:\/\/127\.0\.0\.1:\d+\//);if(m){clearTimeout(timer);resolve(m[0]);}});child.on('error',reject);});
 const browser=await chromium.launch({headless:true,channel:'msedge'}),results=[],outside=[],errors=[];
 try {
  for(const name of ['short','multi','long']) {
   const fixture=fixtures[name],page=await browser.newPage({viewport:{width:1440,height:1000}});
   page.on('pageerror',e=>errors.push(e.message));let exportPayload,rewritePayload,updated=false,editCount=0;
   await page.route('**/*',async route=>{
    const req=route.request(),url=req.url();if(!url.startsWith(base)){outside.push(url);return route.abort();}
    if(url.endsWith('/webflow-experience-discovery')){const result=await require('../backend/experience-discovery.cjs').createHandler({model:()=>({topics:[]})})(req.postDataJSON());return route.fulfill({status:result.status,json:result.body});}
    if(url.endsWith('/preview-api/upload'))return route.fulfill({json:fixtures.envelope(fixture)});
    if(url.endsWith('/preview-api/rewrite')) {rewritePayload=req.postDataJSON();updated=true;editCount++;return route.fulfill({json:fixtures.envelope(editCount===1?{...fixture,blocks:[{...fixture.blocks[0],text:'Edited synthetic profile.'}]}:fixture)});}
    if(url.endsWith('/preview-api/export')) {exportPayload=req.postDataJSON();return route.fulfill({contentType:'application/pdf',body:Buffer.from('%PDF-1.4\n% locally mocked export regression\n%%EOF')});}
    return route.continue();
   });
   await page.goto(base);await page.getByRole('button',{name:'Try a synthetic CV and job ad',exact:true}).click();
   await page.waitForFunction(()=>Number(document.querySelector('#editor-preview-text').dataset.pageCount)>0);
   await page.evaluate(()=>document.fonts.ready);await page.locator('.section-editor').evaluate(el=>el.scrollIntoView({behavior:'instant',block:'start'}));
   async function audit(expected) {
    const data=await page.evaluate(()=>{
     const host=document.querySelector('#editor-preview-text'),pages=[...host.querySelectorAll('.cv-page')];
     return {count:pages.length,marker:host.dataset.pageCount,counter:document.querySelector('.workspace-page-count').textContent,
      source:Object.fromEntries([...new Set([...host.querySelectorAll('[data-cv-source]')].map(el=>el.dataset.cvSource))].map(id=>[id,[...host.querySelectorAll('[data-cv-source]')].filter(el=>el.dataset.cvSource===id).map(el=>el.textContent).join('')])),
      geometry:pages.map(p=>({w:p.offsetWidth,h:p.offsetHeight,overflow:[...p.querySelectorAll('.cv-page-content > *')].some(el=>el.getBoundingClientRect().bottom>p.firstElementChild.getBoundingClientRect().bottom+.5),horizontal:p.scrollWidth>p.clientWidth+1,empty:!p.firstElementChild.textContent.trim(),lastHeading:!!p.firstElementChild.lastElementChild?.lastElementChild?.matches('h1,h2,h3,.cv-entry-meta')})),
      signature:pages.map(p=>p.firstElementChild.textContent),bodySize:getComputedStyle(host.querySelector('.cv-block-body')).fontSize};
    });
    assert.equal(data.count,Number(data.marker));assert.equal(data.counter,`${data.count} ${data.count===1?'page':'pages'}`);
    for(const b of expected.blocks)assert.equal(data.source[b.blockId]||'',b.text,'Every source character retained: '+name+'/'+b.blockId);
    for(const g of data.geometry){assert.ok(Math.abs(g.w-794)<=1&&Math.abs(g.h-1123)<=1);assert.equal(g.overflow,false,'Content fits page');assert.equal(g.horizontal,false,'Long word wraps');assert.equal(g.empty,false);assert.equal(g.lastHeading,false,'No orphaned heading');}
    assert.equal(data.bodySize,'14px');return data;
   }
   const initial=await audit(fixture);assert.ok(name==='short'?initial.count===1:initial.count>=2);
   for(const viewport of [{width:1920,height:1080},{width:1366,height:768},{width:1024,height:600},{width:768,height:1024},{width:390,height:844},{width:360,height:640},{width:844,height:390}]) {
    await page.setViewportSize(viewport);await page.waitForTimeout(70);const resized=await audit(fixture);assert.deepEqual(resized.signature,initial.signature,'Panel resize cannot change page breaks');
    const fits=await page.evaluate(()=>{const pane=document.querySelector('.cv-document'),slot=document.querySelector('.cv-page-slot'),p=slot.firstElementChild,r=p.getBoundingClientRect(),s=slot.getBoundingClientRect();return {fits:r.width<=pane.clientWidth&&Math.abs(r.width-s.width)<1&&Math.abs(r.height-s.height)<1,overflow:pane.scrollWidth>pane.clientWidth+1};});assert.equal(fits.fits,true);assert.equal(fits.overflow,false);
   }
   await page.setViewportSize({width:390,height:844});await page.waitForTimeout(100);
   await page.locator('.cv-document').evaluate(el=>el.scrollTop=0);
   const firstText=page.locator('.cv-block-body').first();await firstText.scrollIntoViewIfNeeded();await page.waitForTimeout(200);
   const line=await firstText.evaluate(el=>{const r=document.createRange();r.setStart(el.firstChild,0);r.setEnd(el.firstChild,Math.min(80,el.firstChild.length));const b=r.getClientRects()[0];return {x:b.x,y:b.y,w:b.width,h:b.height};});
   await page.mouse.move(line.x+1,line.y+line.h/2);await page.mouse.down();await page.mouse.move(line.x+Math.min(80,line.w-2),line.y+line.h/2,{steps:10});
   assert.ok(await page.evaluate(()=>getSelection().toString().length>0),'Native selection on narrow preview');await page.mouse.up();
   await page.setViewportSize({width:1440,height:1000});await page.waitForTimeout(80);
   if(name!=='short') {
    const fragments=page.locator('.cv-block[data-block-id="experience-1"]');if(name==='long')assert.ok(await fragments.count()>1);
    await fragments.first().click();assert.equal(await fragments.locator('xpath=self::*[contains(@class,"is-selected")]').count(),await fragments.count());
    await page.getByRole('button',{name:'Clear',exact:true}).click();assert.equal(await page.locator('.cv-block.is-selected').count(),0);
    await fragments.first().click();await page.locator('.cv-block[data-block-id="education-1"]').first().click({modifiers:['Shift']});assert.ok(await page.locator('#context-chip').innerText().then(t=>t.includes('blocks')));await page.getByRole('button',{name:'Clear',exact:true}).click();
    const body=page.locator('.cv-block-body').first();await body.scrollIntoViewIfNeeded();const r=await body.boundingBox(),pane=await page.locator('.cv-document').boundingBox();await page.mouse.move(r.x+20,Math.max(pane.y+10,r.y+5));const before=await page.locator('.cv-document').evaluate(el=>el.scrollTop);await page.mouse.wheel(0,350);await page.waitForFunction(before=>document.querySelector('.cv-document').scrollTop>before,before);
   }
   // Export still receives canonical blocks and the legacy template, not page fragments.
   const download=page.waitForEvent('download');await page.getByRole('button',{name:'Export PDF',exact:true}).click();await download;
   assert.deepEqual(exportPayload.blocks,fixture.blocks);assert.equal(exportPayload.templateId,'classic_v1');assert.equal(exportPayload.cvTitle,fixture.title);
   await page.locator('.cv-document').evaluate(el=>el.scrollTo({top:0,behavior:'instant'}));await page.waitForTimeout(200);
   await page.screenshot({path:path.join(os.tmpdir(),`drafted-a4-${name}.png`)});
   await page.setViewportSize({width:390,height:844});await page.waitForTimeout(100);await page.screenshot({path:path.join(os.tmpdir(),`drafted-a4-${name}-mobile.png`)});await page.setViewportSize({width:1440,height:1000});
   if(name==='long') {
    await page.getByRole('button',{name:'Use full CV',exact:true}).click();await page.locator('#editor-input').fill('Use the synthetic edited profile.');await page.locator('#editor-send').click();
    await page.waitForFunction(()=>document.querySelector('#editor-preview-text').dataset.pageCount==='1');assert.equal(updated,true);assert.deepEqual(rewritePayload.blocks,fixture.blocks);
    await audit({...fixture,blocks:[{...fixture.blocks[0],text:'Edited synthetic profile.'}]});
    await page.locator('#editor-input').fill('Restore the longer synthetic fixture.');await page.locator('#editor-send').click();await page.waitForFunction(count=>Number(document.querySelector('#editor-preview-text').dataset.pageCount)===count,initial.count);await audit(fixture);
   }
   results.push({fixture:name,pages:initial.count,viewports:8,sourceComplete:true,exportPayloadUnchanged:true});await page.close();
  }
  assert.deepEqual(errors,[]);assert.deepEqual(outside,[]);
  fs.writeFileSync(path.join(os.tmpdir(),'drafted-a4-results.json'),JSON.stringify({results,outsideRequests:outside.length,pageErrors:errors},null,2));
  console.log('A4 editor PASS',JSON.stringify(results));
 } finally {await browser.close();child.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
