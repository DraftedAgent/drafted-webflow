'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),{spawn}=require('node:child_process'),fs=require('node:fs'),path=require('node:path');
const fixtures=require('./fixtures/cv-header.cjs'),designs=require('../webflow/src/cv-document-designs.js');
const root=path.resolve(__dirname,'..'),out=path.join(root,'output/pdf/cv-header');fs.mkdirSync(out,{recursive:true});
(async()=>{
 const child=spawn(process.execPath,[path.join(root,'tools/serve-editor-preview.cjs')],{env:{...process.env,PORT:'0',DRAFTED_PREVIEW_HEADER_CASE:'complete'},stdio:['ignore','pipe','pipe']});
 const base=await new Promise((resolve,reject)=>{let text='';const timer=setTimeout(()=>reject(Error('Preview timeout')),10000);child.stdout.on('data',data=>{text+=data;const match=text.match(/http:\/\/127\.0\.0\.1:\d+\//);if(match){clearTimeout(timer);resolve(match[0]);}});child.on('error',reject);});
 const browser=await chromium.launch({headless:true,channel:'msedge'}),results=[],errors=[],outside=[];
 try{
  for(const [name,original]of Object.entries(fixtures.cases)){
   let fixture=structuredClone(original),requests=0;
   if(name==='complete')fixture.title='Legacy document label';
   const page=await browser.newPage({viewport:{width:1440,height:1000}});page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/*',route=>{const req=route.request(),url=req.url();if(!url.startsWith(base)){outside.push(url);return route.abort();}if(req.method()==='POST')requests++;if(url.endsWith('/preview-api/upload')||url.endsWith('/preview-api/rewrite'))return route.fulfill({json:fixtures.envelope(fixture)});return route.continue();});
   await page.goto(base+'?sample=1');await page.waitForFunction(()=>document.querySelector('#editor-preview-text').dataset.layoutState==='ready'&&Number(document.querySelector('#editor-preview-text').dataset.pageCount)>0);
   await page.waitForFunction(()=>document.documentElement.classList.contains('drafted-editor-active'));
   await page.locator('#editor-input').fill('An unsent instruction remains.');
   for(const design of designs){
    await page.locator('#cv-design').selectOption(design.id);await page.waitForFunction(id=>document.querySelector('#editor-preview-text').dataset.cvDesign===id&&document.querySelector('#editor-preview-text').dataset.layoutState==='ready',design.id);
    const audit=await page.locator('#editor-preview-text').evaluate(host=>{
     const source=Object.fromEntries([...new Set([...host.querySelectorAll('[data-cv-source]')].map(el=>el.dataset.cvSource))].map(id=>[id,[...host.querySelectorAll('[data-cv-source]')].filter(el=>el.dataset.cvSource===id).map(el=>el.textContent).join('')]));
     const pages=[...host.querySelectorAll('.cv-page')];
     for(const p of pages){const bounds=p.firstElementChild.getBoundingClientRect();for(const el of p.querySelectorAll('h1,h2,h3,p,li'))if(el.getBoundingClientRect().bottom>bounds.bottom+.5||el.getBoundingClientRect().right>bounds.right+.5)throw Error('Clipped source');}
     return {source,signature:pages.map(p=>p.textContent),name:host.querySelector('.cv-person-name')?.textContent,headline:[...host.querySelectorAll('.cv-headline')].map(el=>el.textContent).join(''),contact:host.querySelector('.cv-header-contact')?.textContent,links:[...host.querySelectorAll('.cv-header-contact a')].map(a=>a.href),body:host.textContent};
    });
    for(const b of fixture.blocks)assert.equal(audit.source[b.blockId],b.text.trim(),name+'/'+design.id+'/'+b.blockId);
    assert.equal(audit.name,fixture.personalInfo.fullName||undefined);assert.equal(audit.headline,fixture.personalInfo.currentTitle||'');
    if(fixture.personalInfo.email){assert.ok(audit.contact.includes(fixture.personalInfo.email));assert.ok(audit.links.includes('mailto:'+fixture.personalInfo.email));assert.ok(audit.links.includes('https://example.org/portfolio'));}
    else assert.equal(audit.contact,undefined);
    if(audit.name&&audit.headline)assert.equal(await page.evaluate(()=>Number(getComputedStyle(document.querySelector('.cv-person-name')).fontWeight)>Number(getComputedStyle(document.querySelector('.cv-headline')).fontWeight)),true);
    if(name==='source-artifacts'){assert.ok(!audit.body.includes('from the parsed CV'));assert.ok(!/^\s*•\s*$/m.test(audit.source['experience-1']));assert.ok(audit.body.includes('(with explicit user feedback)'));}
    if(name==='legitimate-parentheses')assert.ok(audit.body.includes('(employer and title: blank, from the parsed CV; period: 2025 - Present)'));
    const selectable=fixture.blocks.find(b=>b.label==='Name')||fixture.blocks.find(b=>b.type==='experience');
    await page.locator(`.cv-block[data-block-id="${selectable.blockId}"]`).first().click();assert.ok(await page.locator(`.cv-block.is-selected[data-block-id="${selectable.blockId}"]`).count());
    const nodes=await page.evaluate(()=>{window.__headerPages=[...document.querySelectorAll('.cv-page')];return window.__headerPages.length;});
    await page.getByRole('button',{name:'Expand preview',exact:true}).click();assert.equal(await page.evaluate(()=>window.__headerPages.every((p,i)=>p===document.querySelectorAll('.cv-page')[i])),true);
    const countBefore=requests;
    const prepared=await page.evaluate(async()=>{
     const host=document.querySelector('#editor-preview-text'),frame=await DraftedCvBrowserPrint.prepare(host,'Synthetic header',document.querySelector('link[href*="drafted-editor.css"]').href),doc=frame.contentDocument;
     const pages=[...doc.querySelectorAll('.cv-page')],original=[...host.querySelectorAll('.cv-page')];
     const result={signature:pages.map(p=>p.textContent),noUI:!doc.querySelector('button,select,.is-selected'),font:doc.fonts.check('14px "Drafted Sans"'),geometry:pages.every((page,i)=>{const a=page.getBoundingClientRect(),b=original[i].getBoundingClientRect(),scale=b.width/parseFloat(getComputedStyle(original[i]).width);return [...page.querySelectorAll('h1,h2,h3,p,li')].every((el,j)=>{const other=original[i].querySelectorAll('h1,h2,h3,p,li')[j],x=el.getBoundingClientRect(),y=other.getBoundingClientRect();return Math.abs((x.top-a.top)-(y.top-b.top)/scale)<.1&&getComputedStyle(el).font===getComputedStyle(other).font;});})};frame.remove();return result;
    });
    assert.deepEqual(prepared.signature,audit.signature);assert.equal(prepared.noUI,true);assert.equal(prepared.font,true);assert.equal(prepared.geometry,true);assert.equal(requests,countBefore);
    if(name==='complete'||name==='long'||name==='none')await page.screenshot({path:path.join(out,`${name}-${design.id}-expanded.png`)});
    await page.keyboard.press('Escape');await page.waitForFunction(()=>document.activeElement.classList.contains('workspace-expand-preview'));
    await page.getByRole('button',{name:'Clear',exact:true}).click();
    if(name==='complete'){await page.setViewportSize({width:390,height:844});await page.waitForTimeout(250);assert.deepEqual(await page.locator('.cv-page').allTextContents(),audit.signature);await page.screenshot({path:path.join(out,`${name}-${design.id}-mobile.png`)});await page.setViewportSize({width:1440,height:1000});await page.waitForTimeout(250);}
    assert.equal(await page.locator('#editor-input').inputValue(),'An unsent instruction remains.');
    if(name==='complete'||name==='none'||name==='source-artifacts')await page.screenshot({path:path.join(out,`${name}-${design.id}.png`)});
    results.push({case:name,design:design.id,pages:nodes,sourceComplete:true,overlaySameNodes:true,printCopyExact:true});
   }
   if(name==='complete'){
    fixture.blocks.find(b=>b.type==='summary').text+='\nSynthetic header verification edit.';
    await page.getByRole('button',{name:'Use full CV',exact:true}).click();await page.locator('#editor-input').fill('Apply the synthetic edit.');await page.locator('#editor-send').click();await page.waitForFunction(()=>document.querySelector('#editor-preview-text').textContent.includes('Synthetic header verification edit.'));
    assert.equal(await page.locator('.cv-person-name').textContent(),fixture.personalInfo.fullName);assert.equal(await page.locator('.cv-headline').textContent(),fixture.personalInfo.currentTitle);
    const nameBlock=fixture.blocks.find(b=>b.label==='Name');nameBlock.text='Åsa Example Lind';fixture.personalInfo.fullName=nameBlock.text;
    await page.locator('.cv-block[data-block-id="source-header-name"]').click();await page.locator('#editor-input').fill('Change the synthetic name to Åsa Example Lind.');await page.locator('#editor-send').click();await page.waitForFunction(()=>document.querySelector('.cv-person-name')?.textContent==='Åsa Example Lind');assert.equal(await page.locator('#cv-design').inputValue(),'editorial_v1');
    fixture=structuredClone(fixtures.cases.none);await page.getByRole('button',{name:'Try a synthetic CV and job ad',exact:true}).click();await page.waitForFunction(()=>document.querySelector('#editor-preview-text').dataset.layoutState==='ready'&&!document.querySelector('.cv-person-name')&&!document.querySelector('.cv-headline'));assert.equal(await page.locator('.cv-header-contact').count(),0,'A new source cannot inherit previous contact facts');
   }
   await page.close();
  }
  assert.deepEqual(errors,[]);assert.deepEqual(outside,[]);fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({results,pageErrors:errors,externalRequests:outside},null,2));console.log('CV header PASS',JSON.stringify(results));
 }finally{await browser.close();child.kill();}
})().catch(error=>{console.error(error);process.exitCode=1;});
