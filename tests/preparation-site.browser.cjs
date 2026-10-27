'use strict';
// Actual Webflow DOM and styling, candidate assets, local synthetic backend only.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const source=require('./fixtures/source-pdf.js'),cv=require('./fixtures/cv-header.cjs'),{createHandler}=require('../backend/experience-discovery.cjs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'output/pdf/preparation'),site='https://drafted-cad750.webflow.io/',assets='https://draftedagent.github.io/drafted-webflow/';
const phase=process.argv[2]==='published'?'published':'preflight';
const jobContext={roleTitle:'Product Specialist',seniority:'mid',surfaces:['app'],tone:'balanced',topPriorities:[{signal:'Plan delivery with a team',weight:5}],mustHave:[],successMetrics:[],keywords:['product','planning','delivery','team','research','design','engineering','customers','communication','priorities']};
(async()=>{const browser=await chromium.launch({headless:true,channel:'msedge'}),errors=[],unexpected=[],requests=[];try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',async route=>{const request=route.request(),url=request.url(),u=new URL(url),headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*','Access-Control-Allow-Methods':'POST, OPTIONS'};
  if(request.method()==='OPTIONS')return route.fulfill({status:204,headers});
  if(u.hostname.endsWith('n8n.cloud')||request.method()==='POST'){
   requests.push(u.pathname);
   if(u.pathname.endsWith('/webflow-upload-cv'))return route.fulfill({headers,json:cv.envelope(cv.cases.complete)});
   if(u.pathname.endsWith('/webflow-jobcontext-extract'))return route.fulfill({headers,json:{ok:true,jobContextSchemaVersion:'1.0',jobContext}});
   if(u.pathname.endsWith('/webflow-experience-discovery')){const response=await createHandler({model:()=>({topics:[]})})(request.postDataJSON());return route.fulfill({headers,status:response.status,json:response.body});}
   unexpected.push(url);return route.abort();
  }
  if(phase==='preflight'&&url.startsWith(assets)){
   const file=u.pathname.split('/').at(-1);if(['drafted-editor.css','drafted-editor.js','latest.json'].includes(file))return route.fulfill({headers,contentType:file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'application/json',body:fs.readFileSync(path.join(root,file))});
  }
  if(request.method()==='GET'&&[u.hostname==='drafted-cad750.webflow.io',u.hostname==='draftedagent.github.io',u.hostname.endsWith('website-files.com'),u.hostname==='ajax.googleapis.com',u.hostname==='d3e54v103j8qbb.cloudfront.net',u.hostname==='cdn.jsdelivr.net',u.hostname==='fonts.googleapis.com',u.hostname==='fonts.gstatic.com',u.hostname==='cdnjs.cloudflare.com'].some(Boolean))return route.continue();return route.abort();
 });
 await page.goto(site,{waitUntil:'domcontentloaded'});await page.locator('.preparation-layout').waitFor();await page.locator('#section-input').evaluate(el=>el.scrollIntoView({behavior:'instant'}));assert.equal(await page.locator('#target-role-input').count(),0);assert.equal(await page.locator('.cv-preview-placeholder').isVisible(),true);assert.equal(requests.length,0);await page.screenshot({path:path.join(out,`site-${phase}-empty.png`)});
 const bytes=Buffer.from(source.create({pages:3,title:'Synthetic original CV'}));await page.locator('#cv-file').setInputFiles({name:'synthetic-original.pdf',mimeType:'application/pdf',buffer:bytes});await page.waitForFunction(()=>document.querySelector('#cv-preview').dataset.state==='ready');assert.equal(await page.locator('#cv-preview').getAttribute('data-page-count'),'3');
 await page.getByRole('textbox',{name:'The opportunity',exact:true}).fill('We are looking for a product specialist to plan deliveries, understand customers and work with designers and engineers. Practical communication and research experience are useful. This is a synthetic verification job description.');await page.waitForFunction(()=>document.querySelector('#jobcontext-status').dataset.state==='ready');
 for(const viewport of [{width:1440,height:1000},{width:1024,height:768},{width:390,height:844},{width:320,height:640}]){await page.setViewportSize(viewport);await page.locator('#section-input').evaluate(el=>el.scrollIntoView({behavior:'instant'}));await page.waitForTimeout(100);assert.equal(await page.locator('.preparation-layout').evaluate(el=>el.scrollWidth<=el.clientWidth+1),true);await page.screenshot({path:path.join(out,`site-${phase}-selected-${viewport.width}.png`)});await page.locator('#upload-btn').scrollIntoViewIfNeeded();assert.equal(await page.locator('#upload-btn').isVisible(),true);}
 await page.setViewportSize({width:1440,height:1000});await page.getByRole('button',{name:'Continue to editor',exact:true}).click();await page.waitForFunction(()=>document.querySelector('#editor-preview-text').dataset.layoutState==='ready'&&Math.abs(document.querySelector('.section-editor').getBoundingClientRect().top)<2);assert.equal(await page.locator('.cv-person-name').textContent(),'Åsa Example');assert.equal(await page.locator('.workspace-job-role').textContent(),jobContext.roleTitle);assert.equal(await page.getByRole('slider',{name:'Preview zoom percentage'}).count(),1);assert.equal(await page.locator('#cv-preview').getAttribute('data-page-count'),'3');assert.deepEqual(unexpected,[]);assert.deepEqual(errors,[]);console.log(JSON.stringify({ok:true,phase,site,viewports:4,originalPages:3,correctEditor:true,backendCallsMocked:requests.length,externalBackendExecutions:0}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
