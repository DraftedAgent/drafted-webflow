'use strict';
// Actual Webflow shell with local candidate assets; all backend requests mocked.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'output/pdf/hero'),site='https://drafted-cad750.webflow.io/',assets='https://draftedagent.github.io/drafted-webflow/';fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({headless:true,channel:'msedge'}),errors=[],unexpected=[],posts=[];try{
 const page=await browser.newPage({viewport:{width:1536,height:1024}});page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',async route=>{const request=route.request(),url=request.url(),u=new URL(url),headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*','Access-Control-Allow-Methods':'POST, OPTIONS'};
  if(request.method()==='OPTIONS')return route.fulfill({status:204,headers});
  if(u.hostname.endsWith('n8n.cloud')||request.method()==='POST'){
   posts.push(u.pathname);
   if(u.pathname.endsWith('/webflow-upload-cv')){const f=require('./fixtures/cv-header.cjs');return route.fulfill({headers,json:f.envelope(f.cases.complete)});}
   unexpected.push(url);return route.abort();
  }
  if(url.startsWith(assets)){
   const file=u.pathname.split('/').at(-1);if(['drafted-editor.js','drafted-editor.css','latest.json'].includes(file))return route.fulfill({headers,contentType:file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'application/json',body:fs.readFileSync(path.join(root,file))});
   if(u.pathname.includes('/webflow/assets/brand/')){assert.ok(['drafted-wordmark-reference-dot.svg','drafted-registration-marks.svg','drafted-measurement-rule.svg'].includes(file));return route.fulfill({headers,contentType:'image/svg+xml',body:fs.readFileSync(path.join(root,'webflow/assets/brand',file))});}
  }
  if(request.method()==='GET'&&[u.hostname==='drafted-cad750.webflow.io',u.hostname==='draftedagent.github.io',u.hostname.endsWith('website-files.com'),u.hostname==='ajax.googleapis.com',u.hostname==='d3e54v103j8qbb.cloudfront.net',u.hostname==='cdn.jsdelivr.net',u.hostname==='fonts.googleapis.com',u.hostname==='fonts.gstatic.com',u.hostname==='cdnjs.cloudflare.com'].some(Boolean))return route.continue();return route.abort();
 });
 await page.goto(site,{waitUntil:'domcontentloaded'});await page.locator('.drafted-hero').waitFor();await page.evaluate(async()=>{await Promise.all([...document.querySelectorAll('.drafted-landing img')].map(el=>el.decode()));});assert.equal(await page.locator('.drafted-hero-eyebrow').textContent(),'CAREER CLARITY / WITHOUT THE FLUFF');assert.equal(posts.length,0);
 for(const viewport of [{width:1536,height:1024},{width:1024,height:768},{width:390,height:844},{width:320,height:640},{width:844,height:390}]){
  await page.setViewportSize(viewport);await page.evaluate(()=>document.querySelector('.page-scroll').scrollTop=0);await page.waitForTimeout(100);assert.equal(await page.locator('.page-scroll').evaluate(el=>el.scrollWidth<=innerWidth+1),true);
  if(viewport.width===1536)await page.screenshot({path:path.join(out,'site-desktop.png')});
  if(viewport.width===390){const h=await page.locator('.page-start').evaluate(el=>Math.ceil(el.getBoundingClientRect().height));await page.setViewportSize({width:390,height:h+1});await page.screenshot({path:path.join(out,'site-mobile.png')});await page.setViewportSize(viewport);}
  for(const name of ['Get started','Start with your CV']){await page.evaluate(()=>document.querySelector('.page-scroll').scrollTop=0);await page.getByRole('link',{name,exact:true}).click();await page.waitForFunction(()=>Math.abs(document.querySelector('#section-input').getBoundingClientRect().top)<2);assert.ok(page.url().endsWith('#section-input'));}
 }
 await page.goto(site+'#section-input',{waitUntil:'domcontentloaded'});await page.locator('.drafted-hero').waitFor();await page.waitForFunction(()=>Math.abs(document.querySelector('#section-input').getBoundingClientRect().top)<2);
 await page.locator('#cv-file').setInputFiles({name:'synthetic-original.pdf',mimeType:'application/pdf',buffer:Buffer.from(require('./fixtures/source-pdf.js').create({pages:2}))});await page.waitForFunction(()=>document.querySelector('#cv-preview').dataset.state==='ready');await page.getByRole('button',{name:'Continue to editor',exact:true}).click();await page.waitForFunction(()=>document.querySelector('#editor-preview-text').dataset.layoutState==='ready'&&Math.abs(document.querySelector('.section-editor').getBoundingClientRect().top)<2);assert.equal(await page.locator('.cv-person-name').textContent(),'Åsa Example');assert.deepEqual(unexpected,[]);assert.deepEqual(errors,[]);console.log(JSON.stringify({ok:true,site,viewports:5,decodedVectorAssets:true,bothAnchors:true,deepLink:true,uploadEditorFlow:true,mockedBackendCalls:posts.length,externalBackendExecutions:0}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
