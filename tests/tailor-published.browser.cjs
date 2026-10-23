'use strict';
// Actual Webflow page + candidate/served assets. ALL backend traffic fulfilled
// locally before navigation; never executes a remote workflow or model.
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const f=require('./fixtures/tailor-sources.cjs'),{createHarness,response}=require('./helpers/tailor-workflow-harness.cjs');
const discovery=require('../backend/experience-discovery.cjs').createHandler({model:f.discovery});
const tailor=createHarness({model:input=>response(f.model(input))});
const phase=process.argv[2],root=path.resolve(__dirname,'..'),site='https://drafted-cad750.webflow.io/',assets='https://draftedagent.github.io/drafted-webflow/',build=JSON.parse(fs.readFileSync(path.join(root,'latest.json'),'utf8')).build;
if(!['preflight','published'].includes(phase))throw Error('Explicit phase required');
const normalized=s=>s.replace(/\r\n/g,'\n');
(async()=>{const browser=await chromium.launch({headless:true,channel:'msedge'});try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),unexpected=[],errors=[],requests=[];let release,seen;
 const observed=new Promise(resolve=>seen=resolve);let hold=true;
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',async route=>{
  const req=route.request(),u=new URL(req.url()),headers={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*','Access-Control-Allow-Methods':'POST, OPTIONS'};
  if(req.method()==='OPTIONS')return route.fulfill({status:204,headers});
  if(u.hostname.endsWith('n8n.cloud')||req.method()!=='GET'){
   if(u.pathname.endsWith('/webflow-upload-cv')){const text=f.blocks.map(b=>b.text).join('\n');return route.fulfill({headers,json:{ok:true,blocksSchemaVersion:'1.0',cvVersionId:'synthetic-published-v1',cvTitle:'Alex Example',summaryOfChanges:'',blocks:f.blocks,rewrittenCv:text,rewrittenCvLegacy:text}});}
   if(u.pathname.endsWith('/webflow-jobcontext-extract'))return route.fulfill({headers,json:{ok:true,jobContextSchemaVersion:'1.0',jobContext:f.jobContext}});
   if(u.pathname.endsWith('/webflow-experience-discovery')){const result=await discovery(req.postDataJSON());return route.fulfill({headers,status:result.status,json:result.body});}
   if(u.pathname.endsWith('/tailor-cv')){requests.push(req.postDataJSON());if(hold)await new Promise(resolve=>{release=resolve;seen();});const result=await tailor(req.postDataJSON());return route.fulfill({headers,status:result.status,json:result.body});}
   unexpected.push(req.method()+' '+u.hostname+u.pathname);return route.abort();
  }
  if(phase==='preflight'&&req.url().startsWith(assets)){
   const file=u.pathname.split('/').at(-1);if(['drafted-editor.js','drafted-editor.css','latest.json'].includes(file))return route.fulfill({headers,contentType:file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'application/json',body:fs.readFileSync(path.join(root,file))});
  }
  if(['drafted-cad750.webflow.io','draftedagent.github.io','ajax.googleapis.com','d3e54v103j8qbb.cloudfront.net','cdn.jsdelivr.net','fonts.googleapis.com','fonts.gstatic.com','cdnjs.cloudflare.com'].includes(u.hostname)||u.hostname.endsWith('website-files.com'))return route.continue();
  return route.abort();
 });
 await page.goto(site,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>!!window.DraftedTailorSources,{},{timeout:30000});
 assert.equal(await page.evaluate(()=>!!window.__DRAFTED_PREVIEW_ENDPOINTS__),false);
 const loaded=await page.evaluate(url=>fetch(url).then(r=>r.text()),assets+'drafted-editor.js?v='+build);assert.equal(normalized(loaded),normalized(fs.readFileSync(path.join(root,'drafted-editor.js'),'utf8')));
 await page.locator('#cv-file').setInputFiles({name:'synthetic-source-cv.pdf',mimeType:'application/pdf',buffer:Buffer.from(require('./fixtures/source-pdf.js').create())});
 await page.locator('#job-ad-input').fill('We need a Product Specialist who can plan product deliveries with a team and collaborate in workshops. Experience from volunteering and personal projects is also relevant. This synthetic job ad is used only with locally intercepted backend requests.');
 await page.locator('#upload-btn').click();const guide=page.locator('#drafted-discovery-guidance'),panel=page.locator('.drafted-discovery'),cv=page.locator('.cv-document-inner'),suggestion=page.getByRole('region',{name:'Tailoring suggestion',exact:true});
 await guide.getByRole('button',{name:'Review questions',exact:true}).click();const input=panel.getByRole('textbox');
 await input.fill('At Example Studio, I planned a release with two developers.');await panel.getByRole('button',{name:'Send answer',exact:true}).click();
 await input.fill('In Community Project, I helped facilitate two internal workshops. I did not lead customer sessions.');await panel.getByRole('button',{name:'Send answer',exact:true}).click();
 await panel.getByRole('heading',{name:'Ready to tailor your CV.',exact:true}).waitFor();assert.equal(requests.length,0);const before=await cv.innerText();
 await panel.getByRole('button',{name:'Finish and tailor my CV',exact:true}).click();await observed;await page.locator('#tailor-btn').evaluate(button=>button.click());hold=false;release();await suggestion.waitFor();
 assert.equal(requests.length,1);assert.equal(requests[0].sourcesSchemaVersion,'1.0');assert.equal(requests[0].sourceContext.answers.length,2);assert.ok(!JSON.stringify(requests).includes('ADVISORY ONLY'));assert.equal(await cv.innerText(),before);
 for(const details of await suggestion.locator('details').all())await details.evaluate(e=>e.open=true);await page.screenshot({path:path.join(os.tmpdir(),'drafted-tailor-'+phase+'-desktop.png')});
 await suggestion.getByRole('button',{name:'Dismiss',exact:true}).click();assert.equal(await cv.innerText(),before);
 await guide.getByRole('button',{name:'Tailor my CV',exact:true}).click();await suggestion.waitFor();await suggestion.getByRole('button',{name:'Apply tailored CV',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.cv-document-inner').innerText.includes('I planned a release'));assert.ok((await cv.innerText()).includes('I did not lead customer sessions.'));
 await page.getByRole('button',{name:'Review your answers',exact:true}).click();await panel.locator('.discovery-history').evaluate(e=>e.open=true);await panel.getByRole('button',{name:'Correct answer 1',exact:true}).click();await input.fill('No');await panel.getByRole('button',{name:'Save correction',exact:true}).click();await page.getByRole('button',{name:'Chat',exact:true}).click();
 const approved=await cv.innerText();await guide.getByRole('button',{name:'Tailor my CV',exact:true}).click();await suggestion.waitFor();assert.equal(await cv.innerText(),approved);await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(os.tmpdir(),'drafted-tailor-'+phase+'-mobile.png')});await suggestion.getByRole('button',{name:'Apply tailored CV',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('.cv-document-inner').innerText.includes('I planned a release'));assert.ok((await cv.innerText()).includes('internal workshops'));
 assert.deepEqual(unexpected,[]);assert.deepEqual(errors,[]);const receipt={phase,site,build,realSourceGate:true,tailorRequestsMocked:requests.length,remoteWorkflowExecutions:0,externalModelCalls:0,reviewBeforeApply:true,multiApplyCorrection:true,duplicateStartBlocked:true};fs.writeFileSync(path.join(os.tmpdir(),'drafted-tailor-'+phase+'-website.json'),JSON.stringify(receipt,null,2));console.log(JSON.stringify(receipt));
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
