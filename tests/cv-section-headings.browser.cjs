'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),{spawn}=require('node:child_process'),path=require('node:path'),fs=require('node:fs');
const fixtures=require('./fixtures/cv-pagination.cjs'),designs=require('../webflow/src/cv-document-designs.js');
const root=path.resolve(__dirname,'..'),out=path.join(root,'output/pdf/cv-section-headings');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const child=spawn(process.execPath,[path.join(root,'tools/serve-editor-preview.cjs')],{env:{...process.env,PORT:'0'},stdio:['ignore','pipe','pipe']});
 const base=await new Promise((resolve,reject)=>{let output='';const timer=setTimeout(()=>reject(Error('Preview timeout')),10000);child.stdout.on('data',data=>{output+=data;const match=output.match(/http:\/\/127\.0\.0\.1:\d+\//);if(match){clearTimeout(timer);resolve(match[0]);}});child.on('error',reject);});
 const browser=await chromium.launch({headless:true,channel:'msedge'}),outside=[],errors=[],results=[];
 try{
  for(const name of ['short','multi']){
   const fixture=structuredClone(fixtures[name]);
   for(const b of fixture.blocks){if(b.type==='experience')b.label=b.title;if(b.type==='education')b.label=b.institution;}
   fixture.blocks.push({blockId:'custom-heading',type:'portfolioNotes',label:'Selected projects',order:300,text:'A synthetic custom section remains intact.'});
   const canonical=JSON.stringify(fixture.blocks),page=await browser.newPage({viewport:{width:1440,height:1000}});page.on('pageerror',error=>errors.push(error.message));
   await page.route('**/*',route=>{const url=route.request().url();if(!url.startsWith(base)){outside.push(url);return route.abort();}if(url.endsWith('/preview-api/upload'))return route.fulfill({json:fixtures.envelope(fixture)});return route.continue();});
   await page.goto(base+'?sample=1');await page.waitForFunction(()=>document.querySelector('#editor-preview-text').dataset.layoutState==='ready'&&Number(document.querySelector('#editor-preview-text').dataset.pageCount)>0);
   for(const design of designs){
    await page.locator('#cv-design').selectOption(design.id);await page.waitForFunction(id=>document.querySelector('#editor-preview-text').dataset.cvDesign===id&&document.querySelector('#editor-preview-text').dataset.layoutState==='ready',design.id);
    const headings=await page.locator('#editor-preview-text .cv-section-heading').allTextContents();assert.deepEqual(headings,['Experience','Education','Skills','Selected projects']);
    const source=await page.locator('#editor-preview-text').evaluate(host=>Object.fromEntries([...host.querySelectorAll('[data-cv-source]')].map(el=>el.dataset.cvSource).map(id=>[id,[...host.querySelectorAll('[data-cv-source]')].filter(el=>el.dataset.cvSource===id).map(el=>el.textContent).join('')])));
    for(const b of fixture.blocks)assert.equal(source[b.blockId],b.text.trim());
    for(const b of fixture.blocks.filter(b=>b.type==='experience'))assert.ok((await page.locator('.cv-exp-title').allTextContents()).includes(b.title));
    assert.ok((await page.locator('.cv-edu-degree').allTextContents()).includes('BSc, Information Systems'));
    await page.getByRole('button',{name:'Expand preview',exact:true}).click();assert.deepEqual(await page.locator('#editor-preview-text .cv-section-heading').allTextContents(),headings);
    const printed=await page.evaluate(async()=>{const host=document.querySelector('#editor-preview-text'),frame=await DraftedCvBrowserPrint.prepare(host,'Synthetic headings',document.querySelector('link[href*="drafted-editor.css"]').href);const headings=[...frame.contentDocument.querySelectorAll('.cv-section-heading')].map(el=>el.textContent);frame.remove();return headings;});assert.deepEqual(printed,headings);
    if(name==='short'&&design.id==='editorial_v1')await page.screenshot({path:path.join(out,'editorial-expanded.png')});
    await page.keyboard.press('Escape');await page.setViewportSize({width:390,height:844});assert.deepEqual(await page.locator('#editor-preview-text .cv-section-heading').allTextContents(),headings);await page.setViewportSize({width:1440,height:1000});
    results.push({fixture:name,design:design.id,headings,print:true,mobile:true});
   }
   assert.equal(JSON.stringify(fixture.blocks),canonical);await page.close();
  }
  assert.deepEqual(errors,[]);assert.deepEqual(outside,[]);fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));console.log('CV section headings PASS',JSON.stringify(results));
 }finally{await browser.close();child.kill();}
})().catch(error=>{console.error(error);process.exitCode=1;});
