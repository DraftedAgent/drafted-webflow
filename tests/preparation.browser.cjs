'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),{spawn,execFileSync}=require('node:child_process'),path=require('node:path'),fs=require('node:fs');
const root=path.resolve(__dirname,'..'),out=path.join(root,'output/pdf/preparation');fs.mkdirSync(out,{recursive:true});
const pdf=require('./fixtures/source-pdf.js'),cv=require('./fixtures/cv-header.cjs');
(async()=>{
 const server=spawn(process.execPath,[path.join(root,'tools/serve-editor-preview.cjs')],{env:{...process.env,PORT:'0',DRAFTED_PREVIEW_HEADER_CASE:'complete'},stdio:['ignore','pipe','pipe']});
 const base=await new Promise((resolve,reject)=>{let output='';server.stdout.on('data',s=>{output+=s;const m=output.match(/http:\/\/127\.0\.0\.1:\d+\//);if(m)resolve(m[0]);});server.on('error',reject);});
 const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[],outside=[],uploads=[],jobs=[],dialogs=[];
 let holdUpload=false,releaseUpload,failUpload=false,malformed=false,failJob=false,holdJob=false,releaseJob;
 try{
  async function configure(page,baseline=false){
   page.on('pageerror',e=>errors.push(e.message));page.on('dialog',async d=>{dialogs.push(d.message());await d.dismiss();});
   await page.route('**/*',async route=>{
    const request=route.request(),url=request.url();if(!url.startsWith(base)){outside.push(url);return route.abort();}
    const file=new URL(url).pathname.slice(1);
    if(baseline&&['drafted-editor.js','drafted-editor.css'].includes(file))return route.fulfill({contentType:file.endsWith('.js')?'text/javascript':'text/css',body:execFileSync('git',['show','b9db99d:'+file],{cwd:root})});
    if(url===base){const response=await route.fetch();return route.fulfill({response,body:(await response.text()).replace('id="target-role-input"','id="target-role-input" value="Stale role from the old form"')});}
    if(file==='preview-api/upload'){
     const body=request.postDataBuffer();uploads.push(body);if(holdUpload){holdUpload=false;await new Promise(resolve=>releaseUpload=resolve);}
     if(failUpload)return route.fulfill({status:503,json:{ok:false,contractError:{code:'SYNTHETIC_FAILURE',message:'Synthetic failure'}}});
     if(malformed)return route.fulfill({json:{ok:true,blocks:[]}});
     return route.fulfill({json:cv.envelope(cv.cases.complete)});
    }
    if(file==='preview-api/jobcontext'){
     jobs.push(request.postDataJSON());if(holdJob){holdJob=false;await new Promise(resolve=>releaseJob=resolve);}
     if(failJob)return route.fulfill({status:503,json:{ok:false}});
    }
    return route.continue();
   });
  }
  const style=page=>page.evaluate(()=>Object.fromEntries(['.section-editor','.workspace-topbar','.cv-document'].map(selector=>{const s=getComputedStyle(document.querySelector(selector));return [selector,Object.fromEntries(['font','color','backgroundColor','padding','borderRadius','width','height'].map(k=>[k,s[k]]))];})));
  const baseline=await browser.newPage({viewport:{width:1440,height:1000}});await configure(baseline,true);await baseline.goto(base);const otherStyles=await style(baseline);await baseline.close();
  const page=await browser.newPage({viewport:{width:1440,height:1000}});await configure(page);await page.goto(base);await page.locator('#section-input').evaluate(el=>el.scrollIntoView({behavior:'instant'}));
  assert.deepEqual(await style(page),otherStyles,'Other sections retain identical computed styles');
  assert.equal(await page.locator('#target-role-input').count(),0);assert.equal(await page.getByRole('heading',{name:'A starting point. A direction.',exact:true}).count(),1);const job=page.getByRole('textbox',{name:'Job description (optional)',exact:true});assert.equal(await job.getAttribute('required'),null);
  assert.equal(await page.locator('.cv-preview-placeholder').isVisible(),true);assert.equal(await page.locator('.preparation-preview-caption').count(),0);assert.equal(await page.locator('.source-pdf-slot').count(),0);
  assert.equal(await page.locator('#upload-btn').textContent(),'Continue to editor');assert.equal(await page.locator('#file-btn').textContent(),'Choose file');
  await page.screenshot({path:path.join(out,'empty-1440.png')});await page.locator('#upload-btn').click();assert.equal(uploads.length,0);assert.match(await page.locator('#preparation-status').textContent(),/Choose a PDF/);assert.equal(dialogs.length,1);
  const file=page.locator('#cv-file'),bytes=Buffer.from(pdf.create({pages:3,landscape:true})),longName='A very long actual filename '+('product-development-'.repeat(12))+'.pdf';
  const [chooser]=await Promise.all([page.waitForEvent('filechooser'),page.locator('#file-btn').press('Enter')]);await chooser.setFiles({name:longName,mimeType:'application/pdf',buffer:bytes});await page.waitForFunction(()=>document.querySelector('#cv-preview').dataset.state==='ready');assert.equal(await page.locator('#file-btn').textContent(),'Replace file');assert.equal(await page.locator('#file-name').textContent(),longName);assert.equal(await page.locator('#cv-preview').getAttribute('data-page-count'),'3');assert.equal(await page.locator('.preparation-preview-caption').count(),0);assert.equal(uploads.length,0);assert.equal(await page.locator('#preparation-status').isVisible(),false);
  await job.fill('A short role');assert.equal(await page.locator('#preparation-job-hint').isVisible(),true);assert.equal(jobs.length,0);
  holdJob=true;const ad='A synthetic product role involves research, delivery planning and collaboration with engineers and designers. '.repeat(30);await job.fill(ad);await page.waitForFunction(()=>document.querySelector('#jobcontext-status').dataset.state==='loading');assert.equal(await job.inputValue(),ad);releaseJob();await page.waitForFunction(()=>document.querySelector('#jobcontext-status').dataset.state==='ready');assert.equal(jobs.at(-1).jobAdText,ad.trim());assert.equal(await page.locator('#preparation-job-hint').isVisible(),false);
  for(const viewport of [{width:1920,height:1080},{width:1440,height:1000},{width:1024,height:768},{width:390,height:844},{width:320,height:640}]){
   await page.setViewportSize(viewport);await page.locator('#section-input').evaluate(el=>el.scrollIntoView({behavior:'instant'}));await page.waitForTimeout(100);
   const geometry=await page.locator('.preparation-layout').evaluate(el=>{const r=el.getBoundingClientRect(),left=el.querySelector('.input-left').getBoundingClientRect(),right=el.querySelector('.input-right').getBoundingClientRect();return {width:r.width,left:left.width,right:right.width,stacked:right.top>=left.bottom-1};});assert.ok(geometry.width<=1280&&geometry.width<=viewport.width);
   if(viewport.width>800)assert.ok(Math.abs(geometry.left/(geometry.left+geometry.right)-.55)<.01);else assert.equal(geometry.stacked,true);
   assert.equal(await page.locator('.preparation-layout').evaluate(el=>el.scrollWidth<=el.clientWidth+1),true);
   await page.screenshot({path:path.join(out,`selected-${viewport.width}.png`),fullPage:true});
   await page.locator('#upload-btn').scrollIntoViewIfNeeded();const button=await page.locator('#upload-btn').boundingBox();assert.ok(button.y>=0&&button.y+button.height<=viewport.height+1,'Primary action reachable before the original preview');
   await page.locator('#file-btn').focus();await page.keyboard.press('Tab');assert.equal(await page.locator('#upload-btn').evaluate(el=>el===document.activeElement),true);assert.equal(await page.locator('#upload-btn').evaluate(el=>getComputedStyle(el).outlineStyle),'solid');
  }
  await page.setViewportSize({width:1440,height:1000});
  failJob=true;await job.fill(ad+'Synthetic error case.');await page.waitForFunction(()=>document.querySelector('#jobcontext-status').dataset.state==='error');assert.equal(await job.inputValue(),ad+'Synthetic error case.');failJob=false;
  await job.fill('');assert.equal(await page.locator('#jobcontext-status').getAttribute('data-state'),'idle');
  // Failed and malformed processing cannot navigate to or populate the editor.
  failUpload=true;await page.locator('#upload-btn').click();await page.waitForFunction(()=>document.querySelector('#upload-btn').getAttribute('aria-busy')==='false');assert.match(await page.locator('#preparation-status').textContent(),/could not be processed/);assert.equal(await page.locator('.cv-page').count(),0);assert.equal(await file.evaluate(el=>el.files[0].name),longName);assert.equal(await page.locator('#upload-btn').textContent(),'Continue to editor');failUpload=false;
  malformed=true;await page.locator('#upload-btn').click();await page.waitForFunction(()=>document.querySelector('#upload-btn').getAttribute('aria-busy')==='false');assert.equal(await page.locator('.cv-page').count(),0);malformed=false;
  holdUpload=true;const prior=uploads.length;await page.locator('#upload-btn').click();await page.waitForFunction(()=>document.querySelector('#upload-btn').getAttribute('aria-busy')==='true');await page.locator('#upload-btn').evaluate(el=>{el.click();el.click();});await page.waitForTimeout(150);assert.equal(uploads.length,prior+1);assert.equal(await page.locator('#upload-btn').textContent(),'Analyzing…');assert.equal(await page.locator('.cv-page').count(),0);await page.screenshot({path:path.join(out,'processing.png')});releaseUpload();
  await page.waitForFunction(()=>document.querySelector('#editor-preview-text').dataset.layoutState==='ready'&&document.querySelector('#upload-btn').getAttribute('aria-busy')==='false');await page.waitForFunction(()=>Math.abs(document.querySelector('.section-editor').getBoundingClientRect().top)<2);assert.equal(await page.locator('.cv-person-name').textContent(),'Åsa Example');assert.equal(await page.locator('.preparation-status').getAttribute('data-state'),'ready');assert.ok(uploads.at(-1).includes(bytes));assert.ok(!uploads.at(-1).toString().includes('Stale role from the old form'));assert.match(uploads.at(-1).toString(),/name="targetRole"\r\n\r\n\r\n/);assert.equal(await page.locator('.workspace-job-context').isVisible(),false);
  // Replacement preserves original PDF identity and subsequent optional job context.
  const replacement=Buffer.from(pdf.create({pages:1,title:'Replacement original CV'}));await file.setInputFiles({name:'replacement.pdf',mimeType:'application/pdf',buffer:replacement});await page.waitForFunction(()=>document.querySelector('#cv-preview').dataset.state==='ready'&&document.querySelector('#cv-preview').dataset.pageCount==='1');await job.fill(ad);await page.waitForFunction(()=>document.querySelector('#jobcontext-status').dataset.state==='ready');await page.locator('#upload-btn').click();await page.waitForFunction(()=>document.querySelector('#upload-btn').getAttribute('aria-busy')==='false');assert.ok(uploads.at(-1).includes(replacement));assert.equal(await page.locator('.workspace-job-role').textContent(),'Produktspecialist');assert.equal(await page.locator('.workspace-job-text').textContent(),ad.trim());
  await file.setInputFiles({name:'broken.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.4\nInvalid synthetic PDF')});await page.waitForFunction(()=>document.querySelector('#cv-preview').dataset.state==='error');assert.equal(await page.locator('.preparation-preview-caption').count(),0);assert.equal(await page.locator('.source-pdf-status').isVisible(),true);assert.equal(await page.locator('#preparation-status').getAttribute('data-state'),'selected');
  await file.setInputFiles({name:'unsupported.txt',mimeType:'text/plain',buffer:Buffer.from('Synthetic non-PDF')});await page.waitForFunction(()=>document.querySelector('#cv-preview').dataset.state==='error');assert.equal(await page.locator('.preparation-file-type').textContent(),'text/plain');
  await file.setInputFiles([]);assert.equal(await page.locator('#file-btn').textContent(),'Choose file');assert.equal(await page.locator('.cv-preview-placeholder').isVisible(),true);
  assert.deepEqual(outside,[]);assert.deepEqual(errors,[]);console.log(JSON.stringify({ok:true,viewports:5,originalPages:[1,3],uploadDeduplication:true,optionalJob:true,clearedTargetRole:true,outsideRequests:0,out}));
 }finally{await browser.close();server.kill();}
})().catch(error=>{console.error(error);process.exitCode=1;});
